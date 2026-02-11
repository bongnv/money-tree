import React, { createContext, useContext, useMemo } from 'react';
import { CalculationService } from '@/services/calculation.service';
import { ReportService } from '@/services/report.service';
import { ArchiveService } from '@/services/archive.service';
import { FormatService } from '@/services/formatService';
import { CloudService } from '@/services/cloud.service';
import { db } from '@/db/database';

interface Services {
  cloudService: CloudService;
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

    return {
      cloudService,
      archiveService,
      calculationService,
      reportService,
      formatService,
    };
  }, [cloudService]);

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
};

function useServiceContext() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('Service hooks must be used within ServiceProvider');
  }
  return context;
}

/**
 * Hook to get ArchiveService instance
 */
export function useArchiveService(): ArchiveService {
  const { archiveService } = useServiceContext();
  return archiveService;
}

/**
 * Hook to get CalculationService instance
 */
export function useCalculationService(): CalculationService {
  const { calculationService } = useServiceContext();
  return calculationService;
}

/**
 * Hook to get ReportService instance
 */
export function useReportService(): ReportService {
  const { reportService } = useServiceContext();
  return reportService;
}

/**
 * Hook to get FormatService instance
 */
export function useFormatService(): FormatService {
  const { formatService } = useServiceContext();
  return formatService;
}

/**
 * Hook to get CloudService from context
 */
export function useCloudService(): CloudService {
  const { cloudService } = useServiceContext();
  return cloudService;
}
