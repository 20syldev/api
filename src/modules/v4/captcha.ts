import { createCanvas } from 'canvas';

export default function captcha(text: string): Buffer {
    if (!text) throw new Error('Text is required to generate a captcha.');

    const size = 60,
        font = '60px Comic Sans Ms',
        width = text.length * size,
        height = 120;
    const canvas = createCanvas(width, height),
        ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.lineWidth = Math.random() * 2;
        ctx.stroke();
    }

    let x = (canvas.width + 20 - width) / 2;

    for (let i = 0; i < text.length; i++) {
        const offsetX = Math.cos(i * 0.3) * 10,
            y = height / 2.5 + Math.floor(Math.random() * (height / 2));

        ctx.font = font;
        ctx.fillStyle = `rgb(${Math.floor(Math.random() * 192)}, ${Math.floor(Math.random() * 192)}, ${Math.floor(Math.random() * 192)})`;

        ctx.save();
        ctx.translate(x + size / 2, y);
        ctx.rotate((Math.random() - 0.5) * 0.5);
        ctx.fillText(text[i]!, -size / 2 + offsetX, 0);
        ctx.restore();

        x += size;
    }

    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = 'black';
        ctx.fillRect(Math.floor(Math.random() * width), Math.floor(Math.random() * height), 1.2, 1.2);
    }

    return canvas.toBuffer('image/png');
}
