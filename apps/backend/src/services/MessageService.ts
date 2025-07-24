import prisma from '../lib/prisma';
import { s3 } from '../lib/s3Client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ApiError } from '../utils/ApiError';

/**
 * MessageService centralises all chat-related business logic so that both
 * the REST controllers and the Socket.IO handlers rely on the same
 * validation rules and DB operations. This prevents the two code-paths from
 * diverging over time.
 */
export class MessageService {
  private static readonly PAGE_SIZE = 50;

  /* --------------------------------------------------------------------- */
  /* Shared helpers                                                        */
  /* --------------------------------------------------------------------- */

  /** Ensures the user is a member of the given server or throws 403. */
  private static async assertMembership(userId: string, serverId: string) {
    const member = await prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });
    if (!member) {
      throw new ApiError(403, 'You are not a member of this server');
    }
    return member;
  }

  /** Verifies that reply target belongs to same server. */
  private static async assertValidReply(serverId: string, replyToId?: string) {
    if (!replyToId) return;
    const parent = await prisma.message.findUnique({ where: { id: replyToId } });
    if (!parent || parent.serverId !== serverId) {
      throw new ApiError(400, 'Invalid replyToId');
    }
  }

  /* --------------------------------------------------------------------- */
  /* Queries                                                                */
  /* --------------------------------------------------------------------- */

  /** Returns a chronologically-ordered page of messages for UI usage. */
  static async getMessages(
    userId: string,
    serverId: string,
    before?: string,
  ) {
    await this.assertMembership(userId, serverId);

    const where: any = { serverId };
    if (before) where.createdAt = { lt: new Date(before) };

    const fetched = await prisma.message.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: this.PAGE_SIZE,
    });

    return fetched.reverse(); // oldest → newest
  }

  /* --------------------------------------------------------------------- */
  /* Mutations                                                              */
  /* --------------------------------------------------------------------- */

  /** Creates a new **user** message. */
  static async createMessage(params: {
    userId: string;
    serverId: string;
    content?: string;
    attachment?: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE';
    replyToId?: string;
  }) {
    const { userId, serverId, content, attachment, type, replyToId } = params;

    if (!content && !attachment) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    await this.assertMembership(userId, serverId);
    await this.assertValidReply(serverId, replyToId);

    const data: any = {
      content: content ?? '',
      serverId,
      authorId: userId,
    };
    if (attachment) data.attachment = attachment;
    if (type) data.type = type;
    if (replyToId) data.replyToId = replyToId;

    return (prisma.message as any).create({
      data,
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        replyTo: {
          include: {
            author: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });
  }

  /** Creates a new **bot** message (LLM integration). */
  static async createBotMessage(params: {
    serverId: string;
    content: string;
    replyToId?: string;
  }) {
    const { serverId, content, replyToId } = params;

    if (!content) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    await this.assertValidReply(serverId, replyToId);

    const BOT_USER_ID = process.env.BOT_USER_ID ?? 'ollama-bot';
    const BOT_USERNAME = process.env.BOT_USERNAME ?? 'Shpion AI';
    const BOT_AVATAR = process.env.BOT_AVATAR_URL ?? '/bot-avatar.png';

    await prisma.user.upsert({
      where: { id: BOT_USER_ID },
      create: {
        id: BOT_USER_ID,
        email: `${BOT_USER_ID}@local`,
        username: BOT_USERNAME,
        password: '!',
        avatar: BOT_AVATAR,
      },
      update: {
        username: BOT_USERNAME,
        avatar: BOT_AVATAR,
      },
    });

    await prisma.member.upsert({
      where: { userId_serverId: { userId: BOT_USER_ID, serverId } },
      create: { userId: BOT_USER_ID, serverId },
      update: {},
    });

    return (prisma.message as any).create({
      data: {
        content,
        serverId,
        authorId: BOT_USER_ID,
        replyToId,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        replyTo: {
          include: {
            author: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });
  }

  /** Updates message content (author-only). */
  static async editMessage(userId: string, messageId: string, content: string) {
    if (!content) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) throw new ApiError(404, 'Message not found');
    if (existing.authorId !== userId) {
      throw new ApiError(403, 'You are not the author of this message');
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { content, updatedAt: new Date() },
      include: { author: { select: { id: true, username: true, avatar: true } } },
    });
  }

  /** Deletes a message (author or server admin). Returns owning serverId. */
  static async deleteMessage(userId: string, messageId: string) {
    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) throw new ApiError(404, 'Message not found');

    const member = await prisma.member.findFirst({
      where: { serverId: existing.serverId, userId },
    });

    if (existing.authorId !== userId && member?.role !== 'ADMIN') {
      throw new ApiError(403, 'You do not have permission to delete this message');
    }

    // Remove attachment from object storage, if any.
    if (existing.attachment) {
      try {
        let key = existing.attachment;
        if (key.startsWith('/api/upload/file/')) {
          key = key.replace('/api/upload/file/', '');
        }
        if (!key.includes('..')) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET,
              Key: key,
            }),
          );
        }
      } catch (err) {
        console.error('Failed to delete attachment from S3', err);
      }
    }

    await prisma.message.delete({ where: { id: messageId } });
    return existing.serverId;
  }
}

export default MessageService; 