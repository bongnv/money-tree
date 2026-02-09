import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSync } from '@/contexts/SyncContext';
import { useStore } from '@/contexts/StoreContext';
import { useFormatService } from '@/hooks/useServices';
import { db } from '@/db/database';

/**
 * Domain hook for data sync settings page
 * Manages file info, connection status, and disconnect logic
 */
export function useDataSyncSettings() {
  const navigate = useNavigate();
  const syncOps = useSync();
  const { provider, currentFile } = syncOps;
  const { accounts, categories, transactionTypes, transactions, assets, budgets } = useStore();
  const formatService = useFormatService();

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const cloudFileName = useMemo(() => {
    return currentFile?.name || null;
  }, [currentFile]);

  const fileSize = useMemo(() => {
    return formatService.calculateDataSize({
      accounts,
      categories,
      transactionTypes,
      transactions,
      budgets,
      assets,
    });
  }, [accounts, categories, transactionTypes, transactions, budgets, assets, formatService]);

  const storageLocation = useMemo(() => {
    return provider?.getName() || 'Not connected';
  }, [provider]);

  const openDisconnectDialog = useCallback(() => {
    setDisconnectDialogOpen(true);
  }, []);

  const closeDisconnectDialog = useCallback(() => {
    setDisconnectDialogOpen(false);
  }, []);

  const handleDisconnect = useCallback(async () => {
    setDisconnectDialogOpen(false);

    // Clear all data from IndexedDB
    await db.delete();
    await db.open();

    // Disconnect from cloud storage (will show welcome dialog automatically)
    await syncOps.disconnect();

    // Redirect to dashboard
    navigate('/');
  }, [syncOps, navigate]);

  return {
    cloudFileName,
    fileSize,
    storageLocation,
    status: provider?.getName() || 'Not connected',
    disconnectDialogOpen,
    openDisconnectDialog,
    closeDisconnectDialog,
    handleDisconnect,
  };
}
