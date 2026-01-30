import { renderHook, act } from '@testing-library/react';
import { useFilterState } from './useFilterState';

describe('useFilterState', () => {
  interface TestFilters {
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    category: string[];
  }

  const initialFilters: TestFilters = {
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    category: [],
  };

  describe('initialization', () => {
    it('should initialize with provided filters', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.appliedFilters).toEqual(initialFilters);
      expect(result.current.hasChanges).toBe(false);
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.hasUnappliedChanges).toBe(false);
    });
  });

  describe('setFilter', () => {
    it('should update a single filter', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('search', 'test query');
      });

      expect(result.current.filters.search).toBe('test query');
      expect(result.current.hasChanges).toBe(true);
      expect(result.current.hasUnappliedChanges).toBe(true);
    });

    it('should not affect other filters', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.filters.status).toBe('active');
      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.category).toEqual([]);
    });

    it('should handle array filter updates', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('category', ['food', 'transport']);
      });

      expect(result.current.filters.category).toEqual(['food', 'transport']);
    });
  });

  describe('setMultipleFilters', () => {
    it('should update multiple filters at once', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setMultipleFilters({
          search: 'test',
          status: 'active',
          category: ['food'],
        });
      });

      expect(result.current.filters.search).toBe('test');
      expect(result.current.filters.status).toBe('active');
      expect(result.current.filters.category).toEqual(['food']);
      expect(result.current.hasChanges).toBe(true);
    });

    it('should partially update filters', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setMultipleFilters({ search: 'test' });
      });

      expect(result.current.filters.search).toBe('test');
      expect(result.current.filters.status).toBe('all'); // unchanged
    });

    it('should merge with existing filters', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('search', 'first');
        result.current.setMultipleFilters({ status: 'active' });
      });

      expect(result.current.filters.search).toBe('first');
      expect(result.current.filters.status).toBe('active');
    });
  });

  describe('applyFilters', () => {
    it('should apply current filters', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('search', 'test');
      });

      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.appliedFilters.search).toBe('test');
      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.hasUnappliedChanges).toBe(false);
    });

    it('should sync filters and appliedFilters', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setMultipleFilters({
          search: 'test',
          status: 'active',
        });
      });

      expect(result.current.hasUnappliedChanges).toBe(true);

      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.hasUnappliedChanges).toBe(false);
      expect(result.current.filters).toEqual(result.current.appliedFilters);
    });
  });

  describe('resetFilters', () => {
    it('should reset both filters and appliedFilters to initial state', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setMultipleFilters({
          search: 'test',
          status: 'active',
        });
      });

      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.appliedFilters).toEqual(initialFilters);
      expect(result.current.hasChanges).toBe(false);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should clear all filter changes', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('search', 'test');
        result.current.setFilter('status', 'active');
        result.current.setFilter('category', ['food', 'transport']);
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual(initialFilters);
    });
  });

  describe('resetToInitial', () => {
    it('should reset filters but not apply immediately', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setMultipleFilters({
          search: 'test',
          status: 'active',
        });
      });

      act(() => {
        result.current.applyFilters();
      });

      act(() => {
        result.current.resetToInitial();
      });

      expect(result.current.filters).toEqual(initialFilters);
      // Applied filters should still have old values
      expect(result.current.appliedFilters.search).toBe('test');
      expect(result.current.hasUnappliedChanges).toBe(true);
    });
  });

  describe('clearFilter', () => {
    it('should clear a single filter to its initial value', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setMultipleFilters({
          search: 'test',
          status: 'active',
        });
      });

      act(() => {
        result.current.clearFilter('search');
      });

      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.status).toBe('active'); // unchanged
    });

    it('should clear array filter', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('category', ['food', 'transport']);
        result.current.clearFilter('category');
      });

      expect(result.current.filters.category).toEqual([]);
    });

    it('should use initial value for clearing', () => {
      const customInitial: TestFilters = {
        ...initialFilters,
        status: 'pending',
      };

      const { result } = renderHook(() => useFilterState(customInitial));

      act(() => {
        result.current.setFilter('status', 'active');
        result.current.clearFilter('status');
      });

      expect(result.current.filters.status).toBe('pending');
    });
  });

  describe('computed properties', () => {
    describe('hasChanges', () => {
      it('should be false initially', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        expect(result.current.hasChanges).toBe(false);
      });

      it('should be true when filters differ from initial', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
        });

        expect(result.current.hasChanges).toBe(true);
      });

      it('should be false after resetting', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
          result.current.resetFilters();
        });

        expect(result.current.hasChanges).toBe(false);
      });
    });

    describe('hasActiveFilters', () => {
      it('should be false initially', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        expect(result.current.hasActiveFilters).toBe(false);
      });

      it('should be true when appliedFilters differ from initial', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
        });

        act(() => {
          result.current.applyFilters();
        });

        expect(result.current.hasActiveFilters).toBe(true);
      });

      it('should be false even when filters change but not applied', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
        });

        expect(result.current.hasActiveFilters).toBe(false);
      });
    });

    describe('hasUnappliedChanges', () => {
      it('should be false initially', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        expect(result.current.hasUnappliedChanges).toBe(false);
      });

      it('should be true when filters differ from appliedFilters', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
        });

        expect(result.current.hasUnappliedChanges).toBe(true);
      });

      it('should be false after applying', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
        });

        act(() => {
          result.current.applyFilters();
        });

        expect(result.current.hasUnappliedChanges).toBe(false);
      });

      it('should be true after applying and then changing', () => {
        const { result } = renderHook(() => useFilterState(initialFilters));

        act(() => {
          result.current.setFilter('search', 'test');
        });

        act(() => {
          result.current.applyFilters();
        });

        act(() => {
          result.current.setFilter('search', 'different');
        });

        expect(result.current.hasUnappliedChanges).toBe(true);
      });
    });
  });

  describe('complex workflows', () => {
    it('should handle full filter workflow', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      // User makes changes
      act(() => {
        result.current.setFilter('search', 'test');
        result.current.setFilter('status', 'active');
      });

      expect(result.current.hasChanges).toBe(true);
      expect(result.current.hasUnappliedChanges).toBe(true);

      // User applies filters
      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.hasUnappliedChanges).toBe(false);

      // User makes more changes
      act(() => {
        result.current.setFilter('search', 'updated');
      });

      expect(result.current.hasUnappliedChanges).toBe(true);

      // User resets
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.appliedFilters).toEqual(initialFilters);
      expect(result.current.hasChanges).toBe(false);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should handle apply-cancel-reapply workflow', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      // Apply filters
      act(() => {
        result.current.setFilter('search', 'test');
      });

      act(() => {
        result.current.applyFilters();
      });

      const appliedState = result.current.appliedFilters;

      // Make changes but cancel (reset to previous applied)
      act(() => {
        result.current.setFilter('search', 'different');
        result.current.resetToInitial();
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.appliedFilters).toEqual(appliedState);

      // Reapply to sync
      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.filters).toEqual(result.current.appliedFilters);
    });

    it('should handle selective filter clearing', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      // Set multiple filters
      act(() => {
        result.current.setMultipleFilters({
          search: 'test',
          status: 'active',
          category: ['food'],
        });
      });

      act(() => {
        result.current.applyFilters();
      });

      // Clear only search
      act(() => {
        result.current.clearFilter('search');
      });

      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.appliedFilters.search).toBe('');
      expect(result.current.appliedFilters.status).toBe('active');
      expect(result.current.appliedFilters.category).toEqual(['food']);
    });

    it('should handle instant apply (no explicit apply button)', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      // Each change is immediately applied
      act(() => {
        result.current.setFilter('search', 'test');
      });

      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.hasUnappliedChanges).toBe(false);

      act(() => {
        result.current.setFilter('status', 'active');
      });

      act(() => {
        result.current.applyFilters();
      });

      expect(result.current.hasUnappliedChanges).toBe(false);
      expect(result.current.appliedFilters.search).toBe('test');
      expect(result.current.appliedFilters.status).toBe('active');
    });
  });

  describe('edge cases', () => {
    it('should handle empty initial filters', () => {
      const emptyFilters = {} as Record<string, never>;
      const { result } = renderHook(() => useFilterState(emptyFilters));

      expect(result.current.filters).toEqual({});
      expect(result.current.hasChanges).toBe(false);
    });

    it('should handle complex nested objects in filters', () => {
      interface ComplexFilters {
        dateRange: { from: string; to: string };
        categories: string[];
      }

      const complexInitial: ComplexFilters = {
        dateRange: { from: '', to: '' },
        categories: [],
      };

      const { result } = renderHook(() => useFilterState(complexInitial));

      act(() => {
        result.current.setFilter('dateRange', { from: '2024-01-01', to: '2024-12-31' });
      });

      expect(result.current.filters.dateRange.from).toBe('2024-01-01');
    });

    it('should detect changes in array filters by content', () => {
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.setFilter('category', ['food']);
        result.current.setFilter('category', []);
      });

      expect(result.current.hasChanges).toBe(false); // Back to initial empty array
    });
  });
});
