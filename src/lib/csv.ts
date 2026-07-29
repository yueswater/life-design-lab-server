/** Escapes a single CSV field per RFC 4180 — wraps in quotes if it contains a comma, quote, or newline. */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Builds a CSV string (with header row) from an array of records, in the given column order. */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(',')
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(String(row[c.key] ?? ''))).join(',')
  )
  return [headerLine, ...lines].join('\r\n')
}
