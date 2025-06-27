export type Severity = 'error' | 'warning' | 'info' | 'success';

export interface NotificationContextType {
  showNotification: (message: string, severity?: Severity) => void;
}
