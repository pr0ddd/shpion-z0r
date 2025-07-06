import { Message, User } from "@shared/types";

export const createOptimisticMessage = (
  content: string,
  user: User | Pick<User, 'id' | 'username' | 'avatar'>,
  serverId: string,
  status: Message['status'] = 'sending'
): Message => {
  const clientNonce = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const tempId = `temp_${clientNonce}`;

  return {
    id: tempId,
    content,
    authorId: user?.id ?? 'me',
    serverId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: { id: user.id, username: user.username, avatar: user.avatar },
    status,
  };
};