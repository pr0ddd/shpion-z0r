import prisma from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service layer for working with server invite codes. Keeps controllers thin and makes it
 * easier to unit-test business logic. All methods throw ApiError on expected end-user
 * failures – controllers (wrapped with catchAsync) can just forward the error middleware.
 */
export class InviteService {
  /**
   * Join a server using an invite code. Uses a transaction to ensure that the member record
   * is created atomically and we return the updated server in a consistent state.
   *
   * @throws ApiError – 404 if code invalid; 400 if user already a member.
   */
  static async joinServerWithInviteCode(inviteCode: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Locate the server by its invite code
      const server = await tx.server.findUnique({ where: { inviteCode } });
      if (!server) throw new ApiError(404, 'Invalid invite code');

      try {
        // Attempt to add the user as a member. Unique constraint on (userId, serverId)
        // will protect us from duplicates.
        const updatedServer = await tx.server.update({
          where: { id: server.id },
          data: {
            members: {
              create: { userId },
            },
          },
          include: {
            members: true,
            sfu: true,
            _count: { select: { members: true } },
          },
        });
        return updatedServer;
      } catch (err) {
        // Prisma duplicate key error (unique constraint violation)
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new ApiError(400, 'You are already a member of this server');
        }
        throw err;
      }
    });
  }

  /**
   * Fetch public (non-authenticated) information about a server by invite code.
   */
  static async getPublicInviteInfo(inviteCode: string) {
    const server = await prisma.server.findUnique({
      where: { inviteCode },
      select: {
        id: true,
        name: true,
        icon: true,
        _count: { select: { members: true } },
      },
    });

    if (!server) throw new ApiError(404, 'Invalid invite code');

    return {
      id: server.id,
      name: server.name,
      icon: server.icon,
      memberCount: server._count.members,
    } as const;
  }

  /**
   * Refresh the invite code for a server. Only the owner can do this.
   */
  static async refreshInviteCode(serverId: string, ownerId: string) {
    // Verify ownership
    const server = await prisma.server.findUnique({
      where: { id: serverId, ownerId },
      select: { id: true },
    });
    if (!server) {
      throw new ApiError(403, 'You are not the owner of this server or server does not exist');
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: { inviteCode: uuidv4() },
      select: { inviteCode: true },
    });

    return updatedServer;
  }
} 