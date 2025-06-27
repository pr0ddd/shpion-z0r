import { Server, Message, Member } from '@shared/types';

export interface ServerContextType {
  servers: Server[];
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  selectedServer: Server | null;
  members: Member[];
  messages: Message[];
  isLoading: boolean;
  areMembersLoading: boolean;
  error: string | null;
  selectServer: (server: Server | null) => void;
  fetchServers: () => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setOptimisticMessageStatus: (messageId: string, status: 'failed') => void;
  sendMessage: (content: string) => void;
  listeningStates: Record<string, boolean>;
}

export interface ServerStoreState {
  selectedServer: Server | null;
  members: Member[];
  messages: Message[];
  isLoading: boolean;
  areMembersLoading: boolean;
  error: string | null;
  listeningStates: Record<string, boolean>;
  isTransitioning: boolean;
  setTransitioning: (v: boolean) => void;
  setSelectedServer: (server: Server | null) => void;
  setMembers: (members: Member[]) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (v: boolean) => void;
  setMembersLoading: (v: boolean) => void;
  setError: (err: string | null) => void;
  addMessage: (m: Message) => void;
  updateMessage: (m: Message) => void;
  addMessages: (batch: Message[]) => void;
  removeMessage: (id: string) => void;
  setOptimisticMessageStatus: (id: string, status: 'failed') => void;
  setListeningState: (userId: string, listening: boolean) => void;
}
