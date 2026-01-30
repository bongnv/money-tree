import type { MoneyTreeDB } from '../db/database';
import type { Budget } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { BudgetPeriod, CurrencyCode } from '../types/enums';
import { generateId } from '../utils/id.utils';

export interface BudgetFormData {
  transactionTypeId: string;
  amount: string;
  currencyCode: string;
  period: string;
  startDate: string;
  endDate: string;
}

export interface BudgetValidationError {
  field: keyof BudgetFormData;
  message: string;
}

const addTimestamps = (entity: Partial<Budget>, isUpdate = false): Partial<Budget> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Budget>): Partial<Budget> => ({
  ...entity,
  isDeleted: true,
});

export class BudgetService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<Budget[]> {
    return await this.db.budgets.toArray();
  }

  async getById(id: string): Promise<Budget | undefined> {
    return await this.db.budgets.get(id);
  }

  async getActive(): Promise<Budget[]> {
    return await this.db.budgets.filter((budget) => !budget.isDeleted).toArray();
  }

  async create(
    data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const id = generateId();
    const budget = addTimestamps({
      ...data,
      id,
      isDeleted: false,
    });

    await this.db.budgets.add(budget as Budget);
    await this.syncMetadata.setLastModified();
    return id;
  }

  async update(
    id: string,
    data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.budgets.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.budgets.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }

  validateBudgetForm(formData: BudgetFormData): BudgetValidationError[] {
    const errors: BudgetValidationError[] = [];

    if (!formData.transactionTypeId) {
      errors.push({ field: 'transactionTypeId', message: 'Transaction type is required' });
    }

    if (!formData.currencyCode) {
      errors.push({ field: 'currencyCode', message: 'Currency is required' });
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    if (!formData.period) {
      errors.push({ field: 'period', message: 'Period is required' });
    }

    if (!formData.startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    }

    if (!formData.endDate) {
      errors.push({ field: 'endDate', message: 'End date is required' });
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.push({ field: 'endDate', message: 'End date must be on or after start date' });
    }

    return errors;
  }

  transformFormToBudget(
    formData: BudgetFormData
  ): Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
    return {
      transactionTypeId: formData.transactionTypeId,
      amount: parseFloat(formData.amount),
      currencyCode: formData.currencyCode as CurrencyCode,
      period: formData.period as BudgetPeriod,
      startDate: formData.startDate,
      endDate: formData.endDate,
    };
  }
}
