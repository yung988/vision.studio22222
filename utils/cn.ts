/**
 * Combines multiple class strings into a single class string, preserving unique values.
 * Inspired by clsx and tailwind-merge libraries.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 