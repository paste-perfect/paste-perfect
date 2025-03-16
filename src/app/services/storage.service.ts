import { Injectable } from "@angular/core";

/**
 * Service for handling data storage in localStorage.
 * Provides methods to save and retrieve typed data.
 */
@Injectable({
  providedIn: "root",
})
export class StorageService {
  /**
   * Saves data to localStorage.
   * @param key Storage key.
   * @param value Data to store.
   */
  public setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieves data from localStorage.
   * @param key Storage key.
   * @returns Stored data or null if not found.
   */
  public getItem<T>(key: string): T | null {
    const data: string | null = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  }
}
