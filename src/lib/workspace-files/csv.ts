function sanitizeCsvCell(value: string): string {
  return value.replace(/\u0000/g, "").replace(/\r\n?/g, " ");
}

export function parseCsvRows(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(sanitizeCsvCell(cell));
    cell = "";
  };

  const pushRow = () => {
    const hasData = row.length > 0 || cell.length > 0;
    if (!hasData) return;
    pushCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        const next = source[index + 1];
        if (next === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      pushCell();
      continue;
    }

    if (char === "\n") {
      pushRow();
      continue;
    }

    cell += char;
  }

  if (inQuotes || cell.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows;
}

function shouldQuoteCsvCell(value: string): boolean {
  return (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    /^\s|\s$/.test(value)
  );
}

function serializeCsvCell(value: string): string {
  const normalized = sanitizeCsvCell(value);
  if (!shouldQuoteCsvCell(normalized)) {
    return normalized;
  }

  return `"${normalized.replace(/"/g, '""')}"`;
}

export function serializeCsvRows(rows: string[][]): string[] {
  return rows.map((row) => row.map(serializeCsvCell).join(","));
}
