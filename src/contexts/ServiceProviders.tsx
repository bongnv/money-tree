import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { SyncService } from '../services/sync.service';
import { BackupService } from '../services/backup.service';
import { StorageFactory } from '../services/storage/StorageFactory';
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
const StorageFactoryContext = createContext<StorageFactory>(null!);
const ArchiveServiceContext = createContext<ArchiveService>(null!);
const CalculationServiceContext = createContext<CalculationService>(null!);
const ReportServiceContext = createContext<ReportService>(null!);

/**
 * Combined Service Provider
 * Wraps app and provides all service instances via React Context
 */
export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Create singleton instances using useMemo (created once per app lifecycle)
  // Create base services without dependencies first
  const storageFactory = useMemo(() => new StorageFactory(), []);
  const calculationService = useMemo(() => new CalculationService(), []);

  // Services that depend on other services
  const syncService = useMemo(() => new SyncService(storageFactory), [storageFactory]);
  const backupService = useMemo(() => new BackupService(storageFactory), [storageFactory]);
  const archiveService = useMemo(
    () => new ArchiveService(storageFactory, calculationService),
    [storageFactory, calculationService]
  );
  const reportService = useMemo(() => new ReportService(calculationService), [calculationService]);

  return (
    <SyncServiceContext.Provider value={syncService}>
      <BackupServiceContext.Provider value={backupService}>
        <StorageFactoryContext.Provider value={storageFactory}>
          <ArchiveServiceContext.Provider value={archiveService}>
            <CalculationServiceContext.Provider value={calculationService}>
              <ReportServiceContext.Provider value={reportService}>
                {children}
              </ReportServiceContext.Provider>
            </CalculationServiceContext.Provider>
          </ArchiveServiceContext.Provider>
        </StorageFactoryContext.Provider>
      </BackupServiceContext.Provider>
    </SyncServiceContext.Provider>
  );
};

/**
 * Hook to access the StorageFactory singleton
 */
export const useStorageFactory = (): StorageFactory => {
  const context = useContext(StorageFactoryContext);
  if (!context) {
    throw new Error('useStorageFactory must be used within ServiceProvider');
  }
  return context;
};

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
    storage: useStorageFactory(),
    sync: useSyncService(),
    backup: useBackupService(),
    archive: useArchiveService(),
    calculation: useCalculationService(),
    report: useReportService(),
  };
};
