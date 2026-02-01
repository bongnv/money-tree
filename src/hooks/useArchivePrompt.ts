import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBaseCurrency } from './useSyncMetadata';
import { useArchiveService } from './useServices';
import { useSync } from '@/contexts/SyncContext';
import { CurrencyCode } from '@/types/enums';

interface ArchiveYearSummary {
  transactionCount: number;
  closingNetWorth: number;
  closingBalances: Record<string, number>;
  closingAssetValuations: Record<string, number>;
}

export function useArchivePrompt() {
  const navigate = useNavigate();
  const archiveService = useArchiveService();
  const baseCurrency = useBaseCurrency() ?? CurrencyCode.USD;
  const { syncStatus } = useSync();

  const [showPrompt, setShowPrompt] = useState(false);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [archiveYearSummary, setArchiveYearSummary] = useState<ArchiveYearSummary | null>(null);

  // Check for archivable year when connected and synced
  useEffect(() => {
    const checkArchive = async () => {
      // Only check when connected
      if (syncStatus.status === 'not-connected') return;

      const archivableYear = await archiveService.identifyArchivableYear();
      if (archivableYear !== null) {
        const summary = await archiveService.calculateYearEndSummary(archivableYear, baseCurrency);
        setArchiveYear(archivableYear);
        setArchiveYearSummary(summary);
        setShowPrompt(true);
      }
    };

    checkArchive();
  }, [syncStatus, archiveService, baseCurrency]);

  const handleGoToSettings = () => {
    setShowPrompt(false);
    navigate('/settings/archives');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
  };

  return {
    showPrompt,
    archiveYear,
    archiveYearSummary,
    handleGoToSettings,
    handleRemindLater,
  };
}
