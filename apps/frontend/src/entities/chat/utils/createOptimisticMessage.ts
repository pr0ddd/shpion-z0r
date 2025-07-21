import { Message, User } from "@shared/types";

export const createOptimisticMessage = (
  content: string,
  user: User | Pick<User, 'id' | 'username' | 'avatar'>,
  serverId: string,
  opts?: { attachment?: string; type?: 'IMAGE' | 'FILE'; replyTo?: Message },
  status: Message['status'] | undefined = undefined
): Message => {
  const clientNonce = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const tempId = `temp_${clientNonce}`;

  return {
    id: tempId,
    content,
    attachment: opts?.attachment,
    type: opts?.type ?? 'TEXT',
    authorId: user?.id ?? 'me',
    serverId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: { id: user.id, username: user.username, avatar: user.avatar },
    status,
    replyToId: opts?.replyTo ? opts.replyTo.id : null,
    replyTo: opts?.replyTo ?? null,
  } as any;
};