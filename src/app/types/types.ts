/**
 * Represents a collection of optional style properties.
 */
export type StyleProperties = Partial<{
  color: string;
  "font-family": string;
  "font-size": string;
  "font-style": string;
  "font-variant": string;
  "font-weight": string;
}>;

/**
 * Represents an array of key-value pairs derived from an object type.
 *
 * @template T - The object type from which key-value pairs are extracted.
 */
export type Entries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];
