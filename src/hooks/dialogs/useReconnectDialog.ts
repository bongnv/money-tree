import { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useSync } from '@/contexts/SyncContext';

/**
 * Hook for managing ReconnectDialog state and actions
 */
export const useReconnectDialog = () => {
  const { reconnect } = useSync();
  const { setShowReconnectDialog } = useApp();
  const [error, setError] = useState<string | null>(null);

  const handleReconnect = useCallback(async () => {
    setError(null);

    try {
      await reconnect();
      setShowReconnectDialog(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect';
      setError(errorMessage);
    }
  }, [reconnect, setShowReconnectDialog]);

  const handleCancel = useCallback(() => {
    setShowReconnectDialog(false);
    setError(null);
  }, [setShowReconnectDialog]);

  return {
    error,
    handleReconnect,
    handleCancel,
  };
};
