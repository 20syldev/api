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
 * Parses a single CSV line respecting quoted fields.
 */
const parseLine = (line: string, delimiter: string): string[] => {
    const fields: string[] = [];
    let i = 0;

    while (i <= line.length) {
        if (i === line.length) {
            fields.push('');
            break;
        }

        if (line[i] === '"') {
            let value = '';
            i++; // skip opening quote
            while (i < line.length) {
                if (line[i] === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        value += '"';
                        i += 2;
                    } else {
                        i++; // skip closing quote
                        break;
                    }
                } else {
                    value += line[i]!;
                    i++;
                }
            }
            fields.push(value);
            // skip delimiter after quoted field
            if (i < line.length && line[i] === delimiter) i++;
        } else {
            const next = line.indexOf(delimiter, i);
            if (next === -1) {
                fields.push(line.slice(i));
                break;
            }
            fields.push(line.slice(i, next));
            i = next + 1;
            // trailing delimiter means one more empty field
            if (i === line.length) {
                fields.push('');
                break;
            }
        }
    }

    return fields;
};

/**
 * Escapes a value for CSV output. Wraps in quotes if it contains the delimiter, quotes, or newlines.
 */
const escapeField = (value: string, delimiter: string): string => {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
};

/**
 * Converts between CSV and JSON.
 * - `parse`: CSV string → array of objects
 * - `format`: array of objects → CSV string
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
        const lines = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .filter((l) => l.length > 0);

        if (lines.length === 0) return { action: 'parse', rows: [], count: 0 };

        let headers: string[];
        let dataLines: string[];

        if (useHeaders) {
            headers = parseLine(lines[0]!, delimiter);
            dataLines = lines.slice(1);
        } else {
            const firstFields = parseLine(lines[0]!, delimiter);
            headers = firstFields.map((_, i) => String(i));
            dataLines = lines;
        }

        if (dataLines.length > MAX_CSV_ROWS) throw new Error(`CSV cannot exceed ${MAX_CSV_ROWS} rows`);

        const rows = dataLines.map((line) => {
            const fields = parseLine(line, delimiter);
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
