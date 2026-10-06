export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: 'wigs', label: 'Wigs' },
  { id: 'extensions', label: 'Extensions' },
  { id: 'care', label: 'Hair Care' },
];

export const CATEGORIES_WITH_ALL: Category[] = [
  { id: 'all', label: 'All' },
  ...CATEGORIES,
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}