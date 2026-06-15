/**
 * Date utilities for tests
 */

export function today(): string {
  return formatDate(new Date());
}

export function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
