/**
 * Normalize Prism dependencies to always be an array.
 * If the input is a string, wrap it in an array.
 * If it's already an array, return it as is.
 * If undefined or any other type, return an empty array.
 */
export function normalizeToArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}
