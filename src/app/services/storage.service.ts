import { Injectable } from "@angular/core";

/**
 * Service for handling data storage in localStorage and sessionStorage.
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
    this.write(localStorage, key, value);
  }

  /**
   * Retrieves data from localStorage.
   * @param key Storage key.
   * @returns Stored data or null if not found.
   */
  public getItem<T>(key: string): T | null {
    return this.read<T>(localStorage, key);
  }

  /**
   * Saves data to sessionStorage.
   * @param key Storage key.
   * @param value Data to store.
   */
  public setSessionItem<T>(key: string, value: T): void {
    this.write(sessionStorage, key, value);
  }

  /**
   * Retrieves data from sessionStorage.
   * @param key Storage key.
   * @returns Stored data or null if not found.
   */
  public getSessionItem<T>(key: string): T | null {
    return this.read<T>(sessionStorage, key);
  }

  private write<T>(storage: Storage, key: string, value: T): void {
    storage.setItem(key, JSON.stringify(value));
  }

  private read<T>(storage: Storage, key: string): T | null {
    const data: string | null = storage.getItem(key);
    return data && data !== "undefined" ? (JSON.parse(data) as T) : null;
  }
}
