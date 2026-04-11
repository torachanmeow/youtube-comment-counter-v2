/** メモリ効率の良いコレクション。CircularBuffer（固定長リングバッファ）・LRUSet・LRUMap */
export class CircularBuffer<T> {
  readonly maxSize: number;
  private _buf: (T | undefined)[];
  private _head = 0;
  private _size = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this._buf = new Array(maxSize);
  }

  push(item: T): void {
    const idx = (this._head + this._size) % this.maxSize;
    this._buf[idx] = item;
    if (this._size < this.maxSize) {
      this._size++;
    } else {
      this._head = (this._head + 1) % this.maxSize;
    }
  }

  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._size; i++) {
      result.push(this._buf[(this._head + i) % this.maxSize] as T);
    }
    return result;
  }

  forEach(fn: (item: T) => void): void {
    for (let i = 0; i < this._size; i++) {
      fn(this._buf[(this._head + i) % this.maxSize] as T);
    }
  }

  clone(): CircularBuffer<T> {
    const copy = new CircularBuffer<T>(this.maxSize);
    copy._buf = [...this._buf];
    copy._head = this._head;
    copy._size = this._size;
    return copy;
  }

  clear(): void {
    this._buf = new Array(this.maxSize);
    this._head = 0;
    this._size = 0;
  }

  get size(): number {
    return this._size;
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

  clone(): LRUSet {
    const copy = new LRUSet(this.maxSize);
    this._map.forEach((_, key) => copy._map.set(key, true));
    return copy;
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

  clone(): LRUMap<T> {
    const copy = new LRUMap<T>(this.maxSize);
    this._map.forEach((v, k) => copy._map.set(k, v));
    return copy;
  }

  clear(): void {
    this._map.clear();
  }

  get size(): number {
    return this._map.size;
  }
}
