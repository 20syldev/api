export interface DiceResult {
    roll: string;
    count: number;
    sides: number;
    modifier: number;
    results: number[];
    total: number;
}

export default function dice(roll: string): DiceResult {
    if (!roll) throw new Error('A roll notation is required (e.g. 2d6+3)');
    if (typeof roll !== 'string') throw new Error('Roll must be a string');

    const match = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(roll.trim().replace(/\s+/g, '+'));
    if (!match) throw new Error('Invalid notation. Use NdX or NdX+M (e.g. 2d6+3)');

    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2]!, 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    if (count < 1 || count > 100) throw new Error('Number of dice must be between 1 and 100');
    if (sides < 2 || sides > 1000) throw new Error('Number of sides must be between 2 and 1000');

    const results: number[] = [];
    for (let i = 0; i < count; i++) {
        results.push(1 + Math.floor(Math.random() * sides));
    }

    const total = results.reduce((a, b) => a + b, 0) + modifier;

    return {
        roll: `${count}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
        count,
        sides,
        modifier,
        results,
        total,
    };
}
