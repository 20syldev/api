import { toDataURL } from 'qrcode';

export default async function qrcode(url) {
    const qrcode = await toDataURL(url);
    return qrcode;
}