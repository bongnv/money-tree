import type { MoneyTreeDB } from '../db/database';
import { db } from '../db/database';
import type { ExchangeRate } from '../types/models';

const addTimestamps = (entity: Partial<ExchangeRate>, isUpdate = false): Partial<ExchangeRate> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
  };
};

export class ExchangeRateService {
  constructor(private db: MoneyTreeDB) {}

  async getAll(): Promise<ExchangeRate[]> {
    return await this.db.exchangeRates.toArray();
  }

  async getById(id: string): Promise<ExchangeRate | undefined> {
    return await this.db.exchangeRates.get(id);
  }

  async getByMonth(month: string): Promise<ExchangeRate[]> {
    return await this.db.exchangeRates.where('month').equals(month).toArray();
  }

  async getByMonthAndCurrencies(
    month: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRate | undefined> {
    return await this.db.exchangeRates
      .where(['month', 'fromCurrency', 'toCurrency'])
      .equals([month, fromCurrency, toCurrency])
      .first();
  }

  async create(data: Omit<ExchangeRate, 'id' | 'createdAt'>): Promise<string> {
    const exchangeRate = addTimestamps(data);
    const id = await this.db.exchangeRates.add(exchangeRate as ExchangeRate);
    return id as string;
  }

  async update(id: string, data: Partial<Omit<ExchangeRate, 'id' | 'createdAt'>>): Promise<void> {
    const existing = await this.db.exchangeRates.get(id);
    if (!existing) {
      throw new Error(`ExchangeRate with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.exchangeRates.update(id, updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.exchangeRates.delete(id);
  }

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
  }
}

// Singleton instance for backward compatibility
export const exchangeRateService = new ExchangeRateService(db);
