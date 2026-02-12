import React, { createContext, useContext, useMemo } from 'react';
import { db } from '@/db/database';
import { ArchiveService } from '@/services/archive.service';
import { CalculationService } from '@/services/calculation.service';
import { CloudService } from '@/services/cloud.service';
import { CloudSyncService } from '@/services/cloudSync.service';
import { FormatService } from '@/services/formatService';
import { ReportService } from '@/services/report.service';

interface Services {
  cloudService: CloudService;
  cloudSyncService: CloudSyncService;
  archiveService: ArchiveService;
  calculationService: CalculationService;
  reportService: ReportService;
  formatService: FormatService;
}

// Service Context
const ServiceContext = createContext<Services | null>(null);

interface ServiceProviderProps {
  cloudService: CloudService;
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ cloudService, children }) => {
  const services = useMemo<Services>(() => {
    const calculationService = new CalculationService();
    const reportService = new ReportService(calculationService);
    const archiveService = new ArchiveService(db, cloudService);
    const formatService = new FormatService();
    const cloudSyncService = new CloudSyncService(cloudService, db);

    return {
      cloudService,
      cloudSyncService,
      archiveService,
      calculationService,
      reportService,
      formatService,
    };
  }, [cloudService]);

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
};

/**
 * Hook to get all service instances
 */
export function useServiceContext() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServiceContext must be used within ServiceProvider');
  }
  return context;
}
