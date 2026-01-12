import { create } from 'zustand';
import type { ExchangeRate } from '../types/models';
import { useAppStore } from './useAppStore';

interface ExchangeRateState {
  rates: ExchangeRate[];
}

interface ExchangeRateActions {
  setRates: (rates: ExchangeRate[]) => void;
  addRate: (rate: ExchangeRate) => void;
  resetRates: () => void;
}

export const useExchangeRateStore = create<ExchangeRateState & ExchangeRateActions>((set) => ({
  rates: [],

  setRates: (rates) => {
    set({ rates });
  },

  addRate: (rate) => {
    set((state) => {
      // Check if rate already exists for this month and currency pair
      const existingIndex = state.rates.findIndex(
        (r) =>
          r.month === rate.month &&
          r.fromCurrency === rate.fromCurrency &&
          r.toCurrency === rate.toCurrency
      );

      // If exists, update it; otherwise, add new rate
      if (existingIndex !== -1) {
        const updatedRates = [...state.rates];
        updatedRates[existingIndex] = rate;
        return { rates: updatedRates };
      } else {
        return { rates: [...state.rates, rate] };
      }
    });
    useAppStore.getState().setUnsavedChanges(true);
  },

  resetRates: () => {
    set({ rates: [] });
  },
}));
