import type { PeriodOption } from '@/components/common/PeriodSelector';
import { getTodayDate } from '@/utils/date.utils';

const formatDate = (year: number, month: number, day: number): string => {
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
};

// Budget-specific presets: all months, quarters, and years
export const getBudgetPresets = (): PeriodOption[] => {
  const today = getTodayDate();
  const currentYear = parseInt(today.substring(0, 4));
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const periods: PeriodOption[] = [];

  // Add months for current year
  for (let i = 0; i < 12; i++) {
    const monthEndDate = new Date(currentYear, i + 1, 0);
    const lastDay = monthEndDate.getDate();
    periods.push({
      label: `${monthNames[i]} ${currentYear}`,
      value: `month-${currentYear}-${i + 1}`,
      startDate: formatDate(currentYear, i + 1, 1),
      endDate: formatDate(currentYear, i + 1, lastDay),
    });
  }

  // Add quarters for current year
  const quarters = [
    { label: 'Q1', value: 'q1', months: [1, 2, 3] },
    { label: 'Q2', value: 'q2', months: [4, 5, 6] },
    { label: 'Q3', value: 'q3', months: [7, 8, 9] },
    { label: 'Q4', value: 'q4', months: [10, 11, 12] },
  ];

  quarters.forEach((quarter) => {
    const firstMonth = quarter.months[0];
    const lastMonth = quarter.months[2];
    const lastDayOfQuarter = new Date(currentYear, lastMonth, 0).getDate();
    periods.push({
      label: `${quarter.label} ${currentYear}`,
      value: `quarter-${currentYear}-${quarter.value}`,
      startDate: formatDate(currentYear, firstMonth, 1),
      endDate: formatDate(currentYear, lastMonth, lastDayOfQuarter),
    });
  });

  // Add full year
  periods.push({
    label: `${currentYear}`,
    value: `year-${currentYear}`,
    startDate: formatDate(currentYear, 1, 1),
    endDate: formatDate(currentYear, 12, 31),
  });

  // Add previous year
  periods.push({
    label: `${currentYear - 1}`,
    value: `year-${currentYear - 1}`,
    startDate: formatDate(currentYear - 1, 1, 1),
    endDate: formatDate(currentYear - 1, 12, 31),
  });

  return periods;
};
