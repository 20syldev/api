import { toDataURL } from 'qrcode';

/**
 * Generate a QR code for the provided URL.
 *
 * @param {string} url - The URL to encode in the QR code
 * @returns {Promise<string>} - Base64 encoded QR code image
 * @throws {Error} - If URL is invalid or QR code generation fails
 */
export default async function qrcode(url) {
    // Input validation
    if (!url || typeof url !== 'string') throw new Error('Please provide a valid URL');

    try {
        // Generate QR code
        return await toDataURL(url);
    } catch (error) {
        throw new Error(`Failed to generate QR code: ${error.message}`);
    }
}