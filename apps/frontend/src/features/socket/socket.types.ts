import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { Socket } from "socket.io-client";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketContextType {
  socket: AppSocket | null;
  isConnected: boolean;
}