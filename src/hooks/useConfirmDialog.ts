import { useState, useCallback } from 'react';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmDialogProps {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
}

export interface UseConfirmDialogResult {
  open: boolean;
  dialogProps: ConfirmDialogProps;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

/**
 * Hook for managing a confirmation dialog
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
export function useConfirmDialog(): UseConfirmDialogResult {
  const [open, setOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps>({
    title: '',
    message: '',
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    setDialogProps({
      title: options.title,
      message: options.message,
      severity: options.severity,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
    });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
  }, [resolver]);

  return {
    open,
    dialogProps,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
