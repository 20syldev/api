import { MAX_CSV_LENGTH, MAX_CSV_ROWS } from '../../constants.js';

export interface CsvParseResult {
    action: 'parse';
    rows: Record<string, string>[];
    count: number;
}

export interface CsvFormatResult {
    action: 'format';
    csv: string;
    count: number;
}

export type CsvResult = CsvParseResult | CsvFormatResult;

/**
 * Parses a full CSV text into rows of fields, respecting quoted fields
 * (including escaped quotes and newlines inside quotes).
 *
 * @param text - Raw CSV text; CRLF and CR line endings are normalized to LF
 * @param delimiter - Field separator, a single character
 * @returns Array of rows, each row being an array of field values
 */
function parseRows(text: string, delimiter: string): string[][] {
    const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows: string[][] = [];
    let fields: string[] = [];
    let value = '';
    let inQuotes = false;
    let fieldStarted = false;

    const endField = (): void => {
        fields.push(value);
        value = '';
        fieldStarted = false;
    };

    const endRow = (): void => {
        if (fields.length > 0 || value !== '' || fieldStarted) {
            endField();
            rows.push(fields);
        }
        fields = [];
    };

    let i = 0;
    while (i < src.length) {
        const ch = src[i]!;
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    value += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i++;
                continue;
            }
            value += ch;
            i++;
            continue;
        }
        if (ch === '"' && value === '') {
            inQuotes = true;
            fieldStarted = true;
            i++;
            continue;
        }
        if (ch === delimiter) {
            endField();
            fieldStarted = true;
            i++;
            continue;
        }
        if (ch === '\n') {
            endRow();
            i++;
            continue;
        }
        value += ch;
        i++;
    }
    endRow();

    return rows;
}

/**
 * Escapes a value for CSV output. Wraps in quotes if it contains the delimiter, quotes, or newlines.
 *
 * @param value - Field value to escape
 * @param delimiter - Field separator used in the output
 * @returns The value, quoted with inner quotes doubled when escaping is needed
 */
function escapeField(value: string, delimiter: string): string {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

/**
 * Converts between CSV and JSON.
 * - `parse`: CSV string → array of objects
 * - `format`: array of objects → CSV string
 *
 * @param action - "parse" or "format"
 * @param data - Input payload: `csv` string for parse, `json` array of objects for format
 * @param options - `delimiter` (single character, default ",") and `headers` (parse only: use the first row as keys, default true)
 * @returns Parse result with the rows and their count, or format result with the CSV string and the row count
 * @throws Error if the action is invalid, the delimiter is not a single character, the input data is missing, or a size limit is exceeded
 */
export default function csv(
    action: string,
    data: { csv?: string; json?: Record<string, unknown>[] },
    options: { delimiter?: string; headers?: boolean } = {},
): CsvResult {
    if (!action || (action !== 'parse' && action !== 'format'))
        throw new Error('Please provide a valid action (?action=parse|format)');

    const delimiter = options.delimiter ?? ',';
    if (delimiter.length !== 1) throw new Error('Delimiter must be a single character');

    if (action === 'parse') {
        const text = data.csv;
        if (!text) throw new Error('Please provide CSV data (?csv={data})');
        if (text.length > MAX_CSV_LENGTH) throw new Error(`CSV cannot exceed ${MAX_CSV_LENGTH} characters`);

        const useHeaders = options.headers !== false;
        const allRows = parseRows(text, delimiter);

        if (allRows.length === 0) return { action: 'parse', rows: [], count: 0 };

        let headers: string[];
        let dataRows: string[][];

        if (useHeaders) {
            headers = allRows[0]!;
            dataRows = allRows.slice(1);
        } else {
            headers = allRows[0]!.map((_, i) => String(i));
            dataRows = allRows;
        }

        if (dataRows.length > MAX_CSV_ROWS) throw new Error(`CSV cannot exceed ${MAX_CSV_ROWS} rows`);

        const rows = dataRows.map((fields) => {
            const row: Record<string, string> = {};
            for (let i = 0; i < headers.length; i++) {
                row[headers[i]!] = fields[i] ?? '';
            }
            return row;
        });

        return { action: 'parse', rows, count: rows.length };
    }

    // action === 'format'
    const json = data.json;
    if (!json || !Array.isArray(json) || json.length === 0)
        throw new Error('Please provide a JSON array (?json=[...])');
    if (json.length > MAX_CSV_ROWS) throw new Error(`JSON cannot exceed ${MAX_CSV_ROWS} rows`);

    const headers = Object.keys(json[0]!);
    const headerLine = headers.map((h) => escapeField(h, delimiter)).join(delimiter);
    const dataLines = json.map((obj) =>
        headers.map((h) => escapeField(String(obj[h] ?? ''), delimiter)).join(delimiter),
    );

    const csvOutput = headerLine + '\n' + dataLines.join('\n');

    return { action: 'format', csv: csvOutput, count: json.length };
}
