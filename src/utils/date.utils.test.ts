import {
  formatDate,
  formatDateForInput,
  getTodayISO,
  toISODate,
  isDateInRange,
  sortDatesAsc,
  sortDatesDesc,
} from './date.utils';

describe('date.utils', () => {
  describe('formatDate', () => {
    it('should format ISO date with default format', () => {
      const result = formatDate('2024-03-15T00:00:00.000Z');
      expect(result).toBe('Mar 15, 2024');
    });

    it('should format ISO date with custom format', () => {
      const result = formatDate('2024-03-15T00:00:00.000Z', 'yyyy-MM-dd');
      expect(result).toBe('2024-03-15');
    });

    it('should handle different date formats', () => {
      const result = formatDate('2024-12-31T23:59:59.999Z', 'MMMM dd, yyyy');
      expect(result).toBe('December 31, 2024');
    });
  });

  describe('formatDateForInput', () => {
    it('should format ISO date for input field', () => {
      const result = formatDateForInput('2024-03-15T00:00:00.000Z');
      expect(result).toBe('2024-03-15');
    });

    it('should handle dates with time components', () => {
      const result = formatDateForInput('2024-03-15T14:30:00.000Z');
      expect(result).toBe('2024-03-15');
    });
  });

  describe('getTodayISO', () => {
    it('should return today date as ISO string', () => {
      const result = getTodayISO();
      const today = new Date().toISOString().split('T')[0];
      expect(result).toContain(today);
      expect(result).toContain('T00:00:00.000Z');
    });
  });

  describe('toISODate', () => {
    it('should convert date string to ISO', () => {
      const result = toISODate('2024-03-15');
      expect(result).toBe('2024-03-15T00:00:00.000Z');
    });

    it('should convert Date object to ISO', () => {
      const date = new Date('2024-03-15T14:30:00.000Z');
      const result = toISODate(date);
      expect(result).toBe('2024-03-15T00:00:00.000Z');
    });

    it('should normalize time to start of day', () => {
      const result = toISODate('2024-03-15T23:59:59.999Z');
      expect(result).toBe('2024-03-15T00:00:00.000Z');
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const result = isDateInRange(
        '2024-03-15T00:00:00.000Z',
        '2024-03-01T00:00:00.000Z',
        '2024-03-31T00:00:00.000Z'
      );
      expect(result).toBe(true);
    });

    it('should return true for date at start of range', () => {
      const result = isDateInRange(
        '2024-03-01T00:00:00.000Z',
        '2024-03-01T00:00:00.000Z',
        '2024-03-31T00:00:00.000Z'
      );
      expect(result).toBe(true);
    });

    it('should return true for date at end of range', () => {
      const result = isDateInRange(
        '2024-03-31T00:00:00.000Z',
        '2024-03-01T00:00:00.000Z',
        '2024-03-31T00:00:00.000Z'
      );
      expect(result).toBe(true);
    });

    it('should return false for date before range', () => {
      const result = isDateInRange(
        '2024-02-28T00:00:00.000Z',
        '2024-03-01T00:00:00.000Z',
        '2024-03-31T00:00:00.000Z'
      );
      expect(result).toBe(false);
    });

    it('should return false for date after range', () => {
      const result = isDateInRange(
        '2024-04-01T00:00:00.000Z',
        '2024-03-01T00:00:00.000Z',
        '2024-03-31T00:00:00.000Z'
      );
      expect(result).toBe(false);
    });
  });

  describe('sortDatesAsc', () => {
    it('should sort dates in ascending order', () => {
      const dates = [
        '2024-03-15T00:00:00.000Z',
        '2024-01-10T00:00:00.000Z',
        '2024-12-25T00:00:00.000Z',
      ];
      const result = sortDatesAsc(dates);
      expect(result).toEqual([
        '2024-01-10T00:00:00.000Z',
        '2024-03-15T00:00:00.000Z',
        '2024-12-25T00:00:00.000Z',
      ]);
    });

    it('should not mutate original array', () => {
      const dates = ['2024-03-15T00:00:00.000Z', '2024-01-10T00:00:00.000Z'];
      const original = [...dates];
      sortDatesAsc(dates);
      expect(dates).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortDatesAsc([]);
      expect(result).toEqual([]);
    });

    it('should handle single date', () => {
      const dates = ['2024-03-15T00:00:00.000Z'];
      const result = sortDatesAsc(dates);
      expect(result).toEqual(dates);
    });
  });

  describe('sortDatesDesc', () => {
    it('should sort dates in descending order', () => {
      const dates = [
        '2024-03-15T00:00:00.000Z',
        '2024-01-10T00:00:00.000Z',
        '2024-12-25T00:00:00.000Z',
      ];
      const result = sortDatesDesc(dates);
      expect(result).toEqual([
        '2024-12-25T00:00:00.000Z',
        '2024-03-15T00:00:00.000Z',
        '2024-01-10T00:00:00.000Z',
      ]);
    });

    it('should not mutate original array', () => {
      const dates = ['2024-03-15T00:00:00.000Z', '2024-01-10T00:00:00.000Z'];
      const original = [...dates];
      sortDatesDesc(dates);
      expect(dates).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortDatesDesc([]);
      expect(result).toEqual([]);
    });

    it('should handle single date', () => {
      const dates = ['2024-03-15T00:00:00.000Z'];
      const result = sortDatesDesc(dates);
      expect(result).toEqual(dates);
    });
  });
});
