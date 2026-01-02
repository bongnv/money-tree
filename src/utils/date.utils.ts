import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const UTC = 'UTC';

/**
 * Format ISO date string for display
 * @param isoDate ISO date string
 * @param formatString Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (isoDate: string, formatString = 'MMM dd, yyyy'): string => {
  const date = toZonedTime(parseISO(isoDate), UTC);
  return format(date, formatString);
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns Date string in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  const now = new Date();
  const utcDate = toZonedTime(now, UTC);
  return format(startOfDay(utcDate), 'yyyy-MM-dd');
};

/**
 * Convert date input value to YYYY-MM-DD format
 * @param dateInput Date string in yyyy-MM-dd format or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const toDateString = (dateInput: string | Date): string => {
  // If already in YYYY-MM-DD format, return as-is
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  let date: Date;
  if (typeof dateInput === 'string') {
    // Parse ISO datetime or date string
    date = parseISO(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00.000Z`);
  } else {
    date = dateInput;
  }
  const utcDate = toZonedTime(date, UTC);
  return format(startOfDay(utcDate), 'yyyy-MM-dd');
};

/**
 * Check if date is within range (inclusive)
 * @param date ISO date string to check
 * @param startDate ISO date string for start of range
 * @param endDate ISO date string for end of range
 * @returns True if date is within range
 */
export const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
  const checkDate = parseISO(date);
  const start = startOfDay(parseISO(startDate));
  const end = endOfDay(parseISO(endDate));
  
  return (isAfter(checkDate, start) || isEqual(checkDate, start)) &&
         (isBefore(checkDate, end) || isEqual(checkDate, end));
};

/**
 * Sort dates in ascending order
 * @param dates Array of ISO date strings
 * @returns Sorted array of ISO date strings
 */
export const sortDatesAsc = (dates: string[]): string[] => {
  return [...dates].sort((a, b) => {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Sort dates in descending order
 * @param dates Array of ISO date strings
 * @returns Sorted array of ISO date strings
 */
export const sortDatesDesc = (dates: string[]): string[] => {
  return [...dates].sort((a, b) => {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    return dateB.getTime() - dateA.getTime();
  });
};
