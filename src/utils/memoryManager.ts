export class CircularBuffer<T> {
  readonly maxSize: number;
  private _items: T[] = [];

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    this._items.push(item);
    if (this._items.length > this.maxSize) {
      this._items.shift();
    }
  }

  getAll(): T[] {
    return [...this._items];
  }

  forEach(fn: (item: T) => void): void {
    this._items.forEach(fn);
  }

  clear(): void {
    this._items = [];
  }

  get size(): number {
    return this._items.length;
  }
}

export class LRUSet {
  readonly maxSize: number;
  private _map = new Map<string, true>();

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  add(item: string): void {
    this._map.delete(item);
    this._map.set(item, true);
    if (this._map.size > this.maxSize) {
      const first = this._map.keys().next().value;
      if (first !== undefined) this._map.delete(first);
    }
  }

  has(item: string): boolean {
    return this._map.has(item);
  }

  forEach(fn: (key: string) => void): void {
    this._map.forEach((_, key) => fn(key));
  }

  clear(): void {
    this._map.clear();
  }

  get size(): number {
    return this._map.size;
  }
}

export class LRUMap<T> {
  readonly maxSize: number;
  private _map = new Map<string, T>();

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T): void {
    this._map.delete(key);
    this._map.set(key, value);
    if (this._map.size > this.maxSize) {
      const first = this._map.keys().next().value;
      if (first !== undefined) this._map.delete(first);
    }
  }

  get(key: string): T | undefined {
    return this._map.get(key);
  }

  has(key: string): boolean {
    return this._map.has(key);
  }

  forEach(fn: (value: T, key: string) => void): void {
    this._map.forEach(fn);
  }

  clear(): void {
    this._map.clear();
  }

  get size(): number {
    return this._map.size;
  }
}
