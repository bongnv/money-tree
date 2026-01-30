import type { MoneyTreeDB } from '../db/database';
import type { Account } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { AccountType, CurrencyCode } from '../types/enums';
import { generateId } from '../utils/id.utils';

export interface AccountFormData {
  name: string;
  type: AccountType;
  currencyCode: CurrencyCode;
  initialBalance: string;
  description?: string;
  isActive: boolean;
}

export interface AccountValidationError {
  field: keyof AccountFormData;
  message: string;
}

const addTimestamps = (entity: Partial<Account>, isUpdate = false): Partial<Account> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Account>): Partial<Account> => ({
  ...entity,
  isDeleted: true,
});

export class AccountService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<Account[]> {
    return await this.db.accounts.toArray();
  }

  async getById(id: string): Promise<Account | undefined> {
    return await this.db.accounts.get(id);
  }

  async getActive(): Promise<Account[]> {
    return await this.db.accounts
      .filter((account) => account.isActive && !account.isDeleted)
      .toArray();
  }

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId();
    const account = addTimestamps({
      ...data,
      id,
      isActive: data.isActive ?? true,
      isDeleted: false,
    });

    await this.db.accounts.add(account as Account);
    await this.syncMetadata.setLastModified();
    return id;
  }

  async update(
    id: string,
    data: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.accounts.get(id);
    if (!existing) {
      throw new Error(`Account with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.accounts.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.accounts.get(id);
    if (!existing) {
      throw new Error(`Account with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.accounts.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async unarchive(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  }

  /**
   * Validate account form data
   * @param formData Form data to validate
   * @returns Array of validation errors
   */
  validateAccountForm(formData: AccountFormData): AccountValidationError[] {
    const errors: AccountValidationError[] = [];

    // Validate name
    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Account name is required' });
    }

    // Validate type
    if (!formData.type) {
      errors.push({ field: 'type', message: 'Account type is required' });
    }

    // Validate currency
    if (!formData.currencyCode) {
      errors.push({ field: 'currencyCode', message: 'Currency is required' });
    }

    // Validate initial balance is a number
    const balance = parseFloat(formData.initialBalance);
    if (isNaN(balance)) {
      errors.push({ field: 'initialBalance', message: 'Initial balance must be a valid number' });
    }

    return errors;
  }

  /**
   * Transform form data to Account entity
   * @param formData Form data to transform
   * @returns Account data ready for create/update
   */
  transformFormToAccount(
    formData: AccountFormData
  ): Omit<Account, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: formData.name.trim(),
      type: formData.type,
      currencyCode: formData.currencyCode,
      initialBalance: parseFloat(formData.initialBalance),
      description: formData.description?.trim() || undefined,
      isActive: formData.isActive,
      isDeleted: false,
    };
  }
}
