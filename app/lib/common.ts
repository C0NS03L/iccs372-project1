export function bigIntReplacer(_key: string, value: unknown): string | unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
