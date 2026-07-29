export type ToastType = 'error' | 'ticket' | 'info' | 'success' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
  onAction?: () => void;
  autoDismissMs?: number;
}
