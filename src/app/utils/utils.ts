import { Entries } from "@types";

/**
 * Retrieves the entries (key-value pairs) of an object as a strongly typed array.
 *
 * @template T - The object type being processed.
 * @param obj - The object from which to extract entries.
 * @returns An array of key-value pairs from the object.
 *
 * @example
 * const obj = { a: 1, b: 2 };
 * const entries = getEntries(obj);
 * // entries: [ ['a', 1], ['b', 2] ]
 */
export const getEntries = <T extends object>(obj: T): Entries<T> => Object.entries(obj) as Entries<T>;
