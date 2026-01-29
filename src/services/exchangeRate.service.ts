import { db } from '../db/database';
import type { ExchangeRate } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

const addTimestamps = (entity: Partial<ExchangeRate>, isUpdate = false): Partial<ExchangeRate> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
  };
};

export const exchangeRateService = {
  async getAll(): Promise<ExchangeRate[]> {
    return await db.exchangeRates.toArray();
  },

  async getById(id: string): Promise<ExchangeRate | undefined> {
    return await db.exchangeRates.get(id);
  },

  async getByMonth(month: string): Promise<ExchangeRate[]> {
    return await db.exchangeRates.where('month').equals(month).toArray();
  },

  async getByMonthAndCurrencies(
    month: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate | undefined> {
    return await db.exchangeRates
      .where(['month', 'fromCurrency', 'toCurrency'])
      .equals([month, fromCurrency, toCurrency])
      .first();
  },

  async create(data: Omit<ExchangeRate, 'id' | 'createdAt'>): Promise<string> {
    const exchangeRate = addTimestamps(data);
    const id = await db.exchangeRates.add(exchangeRate as ExchangeRate);
    await syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(id: string, data: Partial<Omit<ExchangeRate, 'id' | 'createdAt'>>): Promise<void> {
    const existing = await db.exchangeRates.get(id);
    if (!existing) {
      throw new Error(`ExchangeRate with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.exchangeRates.update(id, updated);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    await db.exchangeRates.delete(id);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async upsert(data: Omit<ExchangeRate, 'id' | 'createdAt'>): Promise<string> {
    const existing = await this.getByMonthAndCurrencies(
      data.month,
      data.fromCurrency,
      data.toCurrency
    );

    if (existing?.id) {
      await this.update(existing.id, data);
      return existing.id;
    }

    return await this.create(data);
  },
};
