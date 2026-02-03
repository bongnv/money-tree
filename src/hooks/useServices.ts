import { useMemo } from 'react';
import { CalculationService } from '@/services/calculation.service';
import { ReportService } from '@/services/report.service';
import { ArchiveService } from '@/services/archive.service';
import { db } from '@/db/database';

// Singleton instances
let calculationServiceInstance: CalculationService | null = null;
let reportServiceInstance: ReportService | null = null;

function getCalculationService(): CalculationService {
  if (!calculationServiceInstance) {
    calculationServiceInstance = new CalculationService();
  }
  return calculationServiceInstance;
}

/**
 * Get ArchiveService instance
 */
function getArchiveService(): ArchiveService {
  return new ArchiveService(db);
}

/**
 * Hook to get ArchiveService instance
 */
export function useArchiveService(): ArchiveService {
  return useMemo(() => {
    return getArchiveService();
  }, []);
}

/**
 * Hook to get CalculationService instance
 */
export function useCalculationService(): CalculationService {
  return useMemo(() => getCalculationService(), []);
}

/**
 * Get ReportService instance (singleton)
 */
function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService(getCalculationService());
  }
  return reportServiceInstance;
}

/**
 * Hook to get ReportService instance
 */
export function useReportService(): ReportService {
  return useMemo(() => getReportService(), []);
}

/**
 * Hook to get all services at once
 */
export function useServices() {
  return {
    archive: useArchiveService(),
    calculation: useCalculationService(),
    report: useReportService(),
  };
}
