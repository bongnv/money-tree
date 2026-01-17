import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { SyncService } from '../services/sync.service';
import { BackupService } from '../services/backup.service';
import { StorageService } from '../services/storage/StorageService';
import { ArchiveService } from '../services/archive.service';
import { CalculationService } from '../services/calculation.service';
import { ReportService } from '../services/report.service';

/**
 * Service Contexts
 * React Context-based service provision for clean dependency injection
 */

// Create contexts with null assertion (will be provided by ServiceProvider)
const SyncServiceContext = createContext<SyncService>(null!);
const BackupServiceContext = createContext<BackupService>(null!);
const StorageServiceContext = createContext<StorageService>(null!);
const ArchiveServiceContext = createContext<ArchiveService>(null!);
const CalculationServiceContext = createContext<CalculationService>(null!);
const ReportServiceContext = createContext<ReportService>(null!);

/**
 * Combined Service Provider
 * Wraps app and provides all service instances via React Context
 */
export const ServiceProvider: React.FC<{
  children: ReactNode;
  onReconnectNeeded: (providerName: string) => Promise<'reconnect' | 'dismiss'>;
}> = ({ children, onReconnectNeeded }) => {
  // Create singleton instances using useMemo (created once per app lifecycle)
  // Create base services without dependencies first
  const storageService = useMemo(() => new StorageService(onReconnectNeeded), [onReconnectNeeded]);
  const calculationService = useMemo(() => new CalculationService(), []);

  // Services that depend on other services
  const syncService = useMemo(() => new SyncService(storageService), [storageService]);
  const backupService = useMemo(() => new BackupService(storageService), [storageService]);
  const archiveService = useMemo(
    () => new ArchiveService(storageService, calculationService),
    [storageService, calculationService]
  );
  const reportService = useMemo(() => new ReportService(calculationService), [calculationService]);

  return (
    <SyncServiceContext.Provider value={syncService}>
      <BackupServiceContext.Provider value={backupService}>
        <StorageServiceContext.Provider value={storageService}>
          <ArchiveServiceContext.Provider value={archiveService}>
            <CalculationServiceContext.Provider value={calculationService}>
              <ReportServiceContext.Provider value={reportService}>
                {children}
              </ReportServiceContext.Provider>
            </CalculationServiceContext.Provider>
          </ArchiveServiceContext.Provider>
        </StorageServiceContext.Provider>
      </BackupServiceContext.Provider>
    </SyncServiceContext.Provider>
  );
};

/**
 * Hook to access the StorageService singleton
 */
export const useStorage = (): StorageService => {
  const context = useContext(StorageServiceContext);
  if (!context) {
    throw new Error('useStorage must be used within ServiceProvider');
  }
  return context;
};

// Keep old name for compatibility during migration
export const useStorageFactory = useStorage;

/**
 * Hook to access the SyncService singleton
 */
export const useSyncService = (): SyncService => {
  const context = useContext(SyncServiceContext);
  if (!context) {
    throw new Error('useSyncService must be used within ServiceProvider');
  }
  return context;
};

/**
 * Hook to access the BackupService singleton
 */
export const useBackupService = (): BackupService => {
  const context = useContext(BackupServiceContext);
  if (!context) {
    throw new Error('useBackupService must be used within ServiceProvider');
  }
  return context;
};

/**
 * Hook to access the ArchiveService singleton
 */
export const useArchiveService = (): ArchiveService => {
  const context = useContext(ArchiveServiceContext);
  if (!context) {
    throw new Error('useArchiveService must be used within ServiceProvider');
  }
  return context;
};

/**
 * Hook to access the CalculationService singleton
 */
export const useCalculationService = (): CalculationService => {
  const context = useContext(CalculationServiceContext);
  if (!context) {
    throw new Error('useCalculationService must be used within ServiceProvider');
  }
  return context;
};

/**
 * Hook to access the ReportService singleton
 */
export const useReportService = (): ReportService => {
  const context = useContext(ReportServiceContext);
  if (!context) {
    throw new Error('useReportService must be used within ServiceProvider');
  }
  return context;
};

/**
 * Hook to access all services at once (for components needing multiple services)
 */
export const useServices = () => {
  return {
    storage: useStorage(),
    sync: useSyncService(),
    backup: useBackupService(),
    archive: useArchiveService(),
    calculation: useCalculationService(),
    report: useReportService(),
  };
};
