import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

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
 * Format ISO date string for input fields (yyyy-MM-dd)
 * @param isoDate ISO date string
 * @returns Date string in yyyy-MM-dd format
 */
export const formatDateForInput = (isoDate: string): string => {
  const date = toZonedTime(parseISO(isoDate), UTC);
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get current date as ISO string at start of day in UTC
 * @returns ISO date string
 */
export const getTodayISO = (): string => {
  const now = new Date();
  const utcDate = toZonedTime(now, UTC);
  return fromZonedTime(startOfDay(utcDate), UTC).toISOString();
};

/**
 * Convert date input value to ISO string
 * @param dateInput Date string in yyyy-MM-dd format or Date object
 * @returns ISO date string
 */
export const toISODate = (dateInput: string | Date): string => {
  let date: Date;
  if (typeof dateInput === 'string') {
    // Parse as UTC by appending timezone
    date = parseISO(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00.000Z`);
  } else {
    date = dateInput;
  }
  const utcDate = toZonedTime(date, UTC);
  return fromZonedTime(startOfDay(utcDate), UTC).toISOString();
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
