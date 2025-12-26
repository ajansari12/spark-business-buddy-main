import { useState, useMemo } from 'react';

export interface SearchFilters {
  query: string;
  categories?: string[];
  dateRange?: { start: Date; end: Date };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

interface UseSearchOptions<T> {
  items: T[];
  searchFields: (keyof T)[];
  filterFn?: (item: T, filters: SearchFilters) => boolean;
}

/**
 * Advanced Search and Filter Hook
 * Provides search, filter, and sort functionality for any list
 */
export function useSearch<T>({ items, searchFields, filterFn }: UseSearchOptions<T>) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sortBy: '',
    sortOrder: 'desc',
  });

  // Search and filter logic
  const filteredItems = useMemo(() => {
    let results = [...items];

    // Apply search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          if (Array.isArray(value)) {
            return value.some((v) => String(v).toLowerCase().includes(query));
          }
          return false;
        });
      });
    }

    // Apply custom filter function
    if (filterFn) {
      results = results.filter((item) => filterFn(item, filters));
    }

    // Apply sorting
    if (filters.sortBy) {
      results.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof T];
        const bValue = b[filters.sortBy as keyof T];

        if (aValue === undefined || bValue === undefined) return 0;

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return results;
  }, [items, filters, searchFields, filterFn]);

  // Helper functions
  const setQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  };

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      sortBy: '',
      sortOrder: 'desc',
    });
  };

  const clearQuery = () => {
    setFilters((prev) => ({ ...prev, query: '' }));
  };

  return {
    filteredItems,
    filters,
    setQuery,
    setSort,
    setFilter,
    setFilters,
    clearFilters,
    clearQuery,
    totalItems: items.length,
    filteredCount: filteredItems.length,
    hasActiveFilters: filters.query !== '' || Object.keys(filters).some(k => k !== 'query' && k !== 'sortBy' && k !== 'sortOrder' && filters[k]),
  };
}

/**
 * Pagination Hook
 * Works with useSearch for paginated results
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to page 1 when items change
  useMemo(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    previousPage,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, items.length),
    totalItems: items.length,
  };
}

/**
 * Combined Search with Pagination Hook
 */
export function useSearchWithPagination<T>(
  options: UseSearchOptions<T>,
  itemsPerPage: number = 10
) {
  const search = useSearch(options);
  const pagination = usePagination(search.filteredItems, itemsPerPage);

  return {
    ...search,
    ...pagination,
  };
}
