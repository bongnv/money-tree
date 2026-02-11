import { useState, useCallback } from 'react';
import { useSync } from '@/contexts/SyncContext';
import { StorageProviderType } from '@/services/storage/IStorageProvider';
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
        // Cloud: authenticate (will trigger redirect, page will navigate away)
        await syncOps.connect(provider);
        // Note: Code below won't execute if redirect happens successfully
        setState((s) => ({ ...s, isConnecting: false }));
        onClose();
      } catch (error) {
        console.error('[WelcomeDialog] Connect failed:', error);
        setState((s) => ({ ...s, isConnecting: false }));
        if (!isUserCancellationError(error)) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';
          setState((s) => ({ ...s, error: errorMessage }));
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
