import { toDataURL } from 'qrcode';

export default async function qrcode(url: string): Promise<string> {
    if (!url || typeof url !== 'string') throw new Error('Please provide a valid URL');

    try {
        return await toDataURL(url);
    } catch (error) {
        throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
    }
}
