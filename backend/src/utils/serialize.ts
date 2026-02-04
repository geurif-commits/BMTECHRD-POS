import { Decimal } from '@prisma/client/runtime/library';

export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj instanceof Decimal || (obj && typeof obj === 'object' && 'toNumber' in obj)) {
    return Number(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimals) as unknown as T;
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = serializeDecimals(v);
    }
    return result as unknown as T;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }
  return obj;
}

export function mapTableForFrontend<T extends any>(table: T): T {
  if (!table || typeof table !== 'object') return table;
  
  if (Array.isArray(table)) {
    return table.map((item) => {
      const mapped = { ...item } as any;
      if ('tableNumber' in mapped && typeof mapped.tableNumber === 'number') {
        mapped.number = mapped.tableNumber;
        delete mapped.tableNumber;
      }
      return serializeDecimals(mapped);
    }) as unknown as T;
  }

  const mapped = { ...table } as any;
  if ('tableNumber' in mapped && typeof mapped.tableNumber === 'number') {
    mapped.number = mapped.tableNumber;
    delete mapped.tableNumber;
  }
  
  return serializeDecimals(mapped) as T;
}