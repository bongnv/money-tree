import { useState, useCallback } from 'react';
import { useSync } from '@/contexts/SyncContext';
import { StorageProviderType } from '@/services/storage/StorageProviderFactory';
import { isUserCancellationError } from '@/utils/error.utils';

interface WelcomeDialogState {
  isConnecting: boolean;
  error: string | null;
}

export function useWelcomeDialog(onClose: () => void) {
  const syncOps = useSync();

  const [state, setState] = useState<WelcomeDialogState>({
    isConnecting: false,
    error: null,
  });

  const handleConnect = useCallback(
    async (provider: StorageProviderType) => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));

      try {
        // Cloud: authenticate (hook will show file picker automatically)
        await syncOps.connect(provider);
        setState((s) => ({ ...s, isConnecting: false }));
        // Close welcome dialog
        onClose();
      } catch (error) {
        setState((s) => ({ ...s, isConnecting: false }));
        if (!isUserCancellationError(error)) {
          setState((s) => ({
            ...s,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      }
    },
    [syncOps, onClose]
  );

  return {
    isConnecting: state.isConnecting,
    error: state.error,
    handleConnect,
  };
}
