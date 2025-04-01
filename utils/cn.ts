/**
 * Combines multiple class strings into a single class string, preserving unique values.
 * Inspired by clsx and tailwind-merge libraries.
 */
type ClassValue = string | undefined | null | false | Record<string, boolean>;

export function cn(...inputs: ClassValue[]): string {
  const classes = inputs.flatMap((input) => {
    if (!input) return [];
    
    if (typeof input === 'string') {
      return input.trim().split(' ').filter(Boolean);
    }
    
    if (typeof input === 'object') {
      return Object.entries(input)
        .filter(([_, value]) => value)
        .map(([key]) => key);
    }
    
    return [];
  });
  
  return [...new Set(classes)].join(' ');
} 