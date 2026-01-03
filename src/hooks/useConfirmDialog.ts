import { useState, useCallback } from 'react';

interface UseConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info';
}

interface UseConfirmDialogReturn {
  open: boolean;
  dialogProps: UseConfirmDialogOptions;
  confirm: (options: UseConfirmDialogOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmDialog = (): UseConfirmDialogReturn => {
  const [open, setOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<UseConfirmDialogOptions>({
    title: '',
    message: '',
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: UseConfirmDialogOptions): Promise<boolean> => {
    setDialogProps(options);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
    }
  }, [resolvePromise]);

  return {
    open,
    dialogProps,
    confirm,
    handleConfirm,
    handleCancel,
  };
};
