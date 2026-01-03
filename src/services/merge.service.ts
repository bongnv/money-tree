import type {
  DataFile,
  Account,
  Category,
  TransactionType,
  Transaction,
  ManualAsset,
  Budget,
} from '../types/models';

/**
 * Represents a conflict that requires user resolution
 */
export interface Conflict {
  type: 'account' | 'category' | 'transactionType' | 'transaction' | 'asset' | 'budget';
  entityId: string;
  entityName: string;
  fileVersion: unknown; // The entity as it appears in the file
  appVersion: unknown; // The entity as it appears in the app
  conflictReason: 'both-modified' | 'delete-modify';
}

/**
 * Result of a three-way merge operation
 */
export interface MergeResult {
  merged: DataFile;
  conflicts: Conflict[];
  autoMergedCount: number;
}

/**
 * Compare two entities by stringifying and comparing
 */
function entitiesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Get entity name for display
 */
function getEntityName(entity: unknown, type: string): string {
  if (typeof entity === 'object' && entity !== null) {
    const obj = entity as Record<string, unknown>;
    if ('name' in obj && typeof obj.name === 'string') {
      return obj.name;
    }
    if ('description' in obj && typeof obj.description === 'string') {
      return obj.description;
    }
  }
  return `${type} (no name)`;
}

/**
 * Merge arrays of entities with conflict detection
 */
function mergeEntities<T extends { id: string }>(
  base: T[],
  fileVersion: T[],
  appVersion: T[],
  entityType: Conflict['type']
): { merged: T[]; conflicts: Conflict[] } {
  const conflicts: Conflict[] = [];
  const merged: T[] = [];
  const processedIds = new Set<string>();

  // Create maps for fast lookup
  const baseMap = new Map(base.map((e) => [e.id, e]));
  const fileMap = new Map(fileVersion.map((e) => [e.id, e]));
  const appMap = new Map(appVersion.map((e) => [e.id, e]));

  // Get all unique IDs
  const allIds = new Set([
    ...base.map((e) => e.id),
    ...fileVersion.map((e) => e.id),
    ...appVersion.map((e) => e.id),
  ]);

  for (const id of allIds) {
    processedIds.add(id);

    const baseEntity = baseMap.get(id);
    const fileEntity = fileMap.get(id);
    const appEntity = appMap.get(id);

    // Case 1: New in file only
    if (!baseEntity && fileEntity && !appEntity) {
      merged.push(fileEntity);
      continue;
    }

    // Case 2: New in app only
    if (!baseEntity && !fileEntity && appEntity) {
      merged.push(appEntity);
      continue;
    }

    // Case 3: New in both (different entities with same ID - unlikely but possible)
    if (!baseEntity && fileEntity && appEntity) {
      if (entitiesEqual(fileEntity, appEntity)) {
        merged.push(appEntity);
      } else {
        // Both added with same ID but different data - conflict
        conflicts.push({
          type: entityType,
          entityId: id,
          entityName: getEntityName(appEntity, entityType),
          fileVersion: fileEntity,
          appVersion: appEntity,
          conflictReason: 'both-modified',
        });
      }
      continue;
    }

    // Case 4: Deleted in file only
    if (baseEntity && !fileEntity && appEntity) {
      if (entitiesEqual(baseEntity, appEntity)) {
        // Deleted in file, unchanged in app -> accept deletion
        continue;
      } else {
        // Deleted in file, modified in app -> conflict
        conflicts.push({
          type: entityType,
          entityId: id,
          entityName: getEntityName(appEntity, entityType),
          fileVersion: null,
          appVersion: appEntity,
          conflictReason: 'delete-modify',
        });
      }
      continue;
    }

    // Case 5: Deleted in app only
    if (baseEntity && fileEntity && !appEntity) {
      if (entitiesEqual(baseEntity, fileEntity)) {
        // Deleted in app, unchanged in file -> accept deletion
        continue;
      } else {
        // Deleted in app, modified in file -> conflict
        conflicts.push({
          type: entityType,
          entityId: id,
          entityName: getEntityName(fileEntity, entityType),
          fileVersion: fileEntity,
          appVersion: null,
          conflictReason: 'delete-modify',
        });
      }
      continue;
    }

    // Case 6: Deleted in both
    if (baseEntity && !fileEntity && !appEntity) {
      // Both deleted -> accept deletion
      continue;
    }

    // Case 7: Exists in all three versions
    if (baseEntity && fileEntity && appEntity) {
      const fileChanged = !entitiesEqual(baseEntity, fileEntity);
      const appChanged = !entitiesEqual(baseEntity, appEntity);

      if (!fileChanged && !appChanged) {
        // No changes -> use app version (they're the same)
        merged.push(appEntity);
      } else if (fileChanged && !appChanged) {
        // Changed in file only -> auto-merge file version
        merged.push(fileEntity);
      } else if (!fileChanged && appChanged) {
        // Changed in app only -> auto-merge app version
        merged.push(appEntity);
      } else {
        // Changed in both -> conflict
        conflicts.push({
          type: entityType,
          entityId: id,
          entityName: getEntityName(appEntity, entityType),
          fileVersion: fileEntity,
          appVersion: appEntity,
          conflictReason: 'both-modified',
        });
      }
    }
  }

  return { merged, conflicts };
}

/**
 * Perform three-way merge of data files
 * @param base - Original loaded data (before any edits)
 * @param fileVersion - Current file content
 * @param appVersion - Current app state
 * @returns Merge result with auto-merged data and conflicts
 */
export function performThreeWayMerge(
  base: DataFile,
  fileVersion: DataFile,
  appVersion: DataFile
): MergeResult {
  const allConflicts: Conflict[] = [];
  let autoMergedCount = 0;

  // Merge accounts
  const accountsResult = mergeEntities(
    base.accounts || [],
    fileVersion.accounts || [],
    appVersion.accounts || [],
    'account'
  );
  autoMergedCount += accountsResult.merged.length - accountsResult.conflicts.length;
  allConflicts.push(...accountsResult.conflicts);

  // Merge categories
  const categoriesResult = mergeEntities(
    base.categories || [],
    fileVersion.categories || [],
    appVersion.categories || [],
    'category'
  );
  autoMergedCount += categoriesResult.merged.length - categoriesResult.conflicts.length;
  allConflicts.push(...categoriesResult.conflicts);

  // Merge transaction types
  const transactionTypesResult = mergeEntities(
    base.transactionTypes || [],
    fileVersion.transactionTypes || [],
    appVersion.transactionTypes || [],
    'transactionType'
  );
  autoMergedCount += transactionTypesResult.merged.length - transactionTypesResult.conflicts.length;
  allConflicts.push(...transactionTypesResult.conflicts);

  // Merge year-specific data
  const allYears = new Set([
    ...Object.keys(base.years || {}),
    ...Object.keys(fileVersion.years || {}),
    ...Object.keys(appVersion.years || {}),
  ]);

  const mergedYears: DataFile['years'] = {};

  for (const year of allYears) {
    const baseYear = base.years?.[year];
    const fileYear = fileVersion.years?.[year];
    const appYear = appVersion.years?.[year];

    // Merge transactions for this year
    const transactionsResult = mergeEntities(
      baseYear?.transactions || [],
      fileYear?.transactions || [],
      appYear?.transactions || [],
      'transaction'
    );
    autoMergedCount += transactionsResult.merged.length - transactionsResult.conflicts.length;
    allConflicts.push(...transactionsResult.conflicts);

    // Merge manual assets for this year
    const assetsResult = mergeEntities(
      baseYear?.manualAssets || [],
      fileYear?.manualAssets || [],
      appYear?.manualAssets || [],
      'asset'
    );
    autoMergedCount += assetsResult.merged.length - assetsResult.conflicts.length;
    allConflicts.push(...assetsResult.conflicts);

    // Merge budgets for this year
    const budgetsResult = mergeEntities(
      baseYear?.budgets || [],
      fileYear?.budgets || [],
      appYear?.budgets || [],
      'budget'
    );
    autoMergedCount += budgetsResult.merged.length - budgetsResult.conflicts.length;
    allConflicts.push(...budgetsResult.conflicts);

    mergedYears[year] = {
      transactions: transactionsResult.merged as Transaction[],
      manualAssets: assetsResult.merged as ManualAsset[],
      budgets: budgetsResult.merged as Budget[],
    };
  }

  // For conflicts, we can't include them in merged data yet
  // They'll need to be resolved by the user first
  // For now, we use appVersion for conflicted entities
  // The dialog will show the conflict and let user choose

  const merged: DataFile = {
    version: appVersion.version,
    years: mergedYears,
    accounts: accountsResult.merged as Account[],
    categories: categoriesResult.merged as Category[],
    transactionTypes: transactionTypesResult.merged as TransactionType[],
    archivedYears: appVersion.archivedYears || [],
    lastModified: new Date().toISOString(),
  };

  return {
    merged,
    conflicts: allConflicts,
    autoMergedCount,
  };
}
