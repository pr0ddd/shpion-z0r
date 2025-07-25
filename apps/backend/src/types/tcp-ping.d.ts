declare module 'tcp-ping' {
  export interface PingOptions {
    address: string;
    port?: number;
    timeout?: number;
  }
  export interface PingResult {
    avg: number;
  }
  export function ping(options: PingOptions, callback: (err: Error | null, result: PingResult) => void): void;
} 