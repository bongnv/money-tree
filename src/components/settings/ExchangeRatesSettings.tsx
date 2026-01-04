import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { useAppStore } from '../../stores/useAppStore';

export const ExchangeRatesSettings: React.FC = () => {
  const currentYear = useAppStore((state) => state.currentYear);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const rates = useExchangeRateStore((state) => state.rates);
  const loading = useExchangeRateStore((state) => state.loading);
  const errors = useExchangeRateStore((state) => state.errors);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Count loading rates
  const loadingCount = useMemo(() => {
    return Object.values(loading).filter((isLoading) => isLoading).length;
  }, [loading]);

  // Count actual errors (non-empty error messages)
  const errorCount = useMemo(() => {
    return Object.values(errors).filter((error) => error && error.length > 0).length;
  }, [errors]);

  // Filter rates for selected year
  const yearRates = useMemo(() => {
    return rates.filter((rate) => rate.month.startsWith(String(selectedYear)));
  }, [rates, selectedYear]);

  // Group rates by currency pair and month
  const ratesByPairAndMonth = useMemo(() => {
    const grouped = new Map<string, Map<string, number>>();
    yearRates.forEach((rate) => {
      const pairKey = `${rate.fromCurrency}-${rate.toCurrency}`;
      if (!grouped.has(pairKey)) {
        grouped.set(pairKey, new Map());
      }
      grouped.get(pairKey)!.set(rate.month, rate.rate);
    });
    return grouped;
  }, [yearRates]);

  const months = [
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exchange Rates
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingCount > 0 && (
            <Chip
              label={`Fetching ${loadingCount} rate${loadingCount > 1 ? 's' : ''}...`}
              size="small"
              color="primary"
              icon={<CircularProgress size={16} sx={{ color: 'inherit' }} />}
            />
          )}
        </Box>

        {errorCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Some rates failed to fetch. Check console for details.
          </Alert>
        )}

        {ratesByPairAndMonth.size === 0 ? (
          <Alert severity="info">
            No exchange rates to USD found for {selectedYear}. Rates will be automatically fetched
            when viewing reports with foreign currency accounts.
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Currency Pair</TableCell>
                  {months.map((month) => (
                    <TableCell key={month} align="right">
                      {month.slice(0, 3)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(ratesByPairAndMonth.entries()).map(([pair, monthRates]) => {
                  const [fromCurr, toCurr] = pair.split('-');
                  return (
                    <TableRow key={pair}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {fromCurr.toUpperCase()} → {toCurr.toUpperCase()}
                        </Typography>
                      </TableCell>
                      {months.map((_, index) => {
                        const monthStr = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
                        const rate = monthRates.get(monthStr);
                        const loadingKey = `${monthStr}-${fromCurr}-${toCurr}`;
                        const isLoading = loading[loadingKey];
                        const error = errors[loadingKey];

                        return (
                          <TableCell key={monthStr} align="right">
                            {isLoading ? (
                              <CircularProgress size={16} />
                            ) : error ? (
                              <Chip label="Error" size="small" color="error" />
                            ) : rate !== undefined ? (
                              <Typography variant="body2">{rate.toFixed(4)}</Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Exchange rates to USD are automatically fetched from exchangerate-api.com when viewing
            reports and cached locally. Cross-currency conversions are calculated dynamically
            through USD. Rates are used to convert foreign currency transactions and balances to
            your base currency ({baseCurrency.toUpperCase()}).
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
