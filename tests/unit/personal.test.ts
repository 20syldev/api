import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import personal from '../../src/modules/v4/personal.js';

describe('personal', () => {
    test('returns expected fields', () => {
        const result = personal();
        const fields = [
            'name',
            'email',
            'phone',
            'job',
            'language',
            'card',
            'cvc',
            'expiration',
            'address',
            'birthday',
            'civil_status',
            'social_profiles',
            'emergency_contacts',
            'subscriptions',
            'pets',
        ];
        for (const f of fields) {
            assert.ok(f in result, `missing field: ${f}`);
        }
    });

    test('card has 4 groups of 4 digits', () => {
        const result = personal();
        assert.match(result.card as string, /^\d{4} \d{4} \d{4} \d{4}$/);
    });

    test('cvc is 3 digits', () => {
        const result = personal();
        const cvc = result.cvc as number;
        assert.ok(cvc >= 100 && cvc <= 999);
    });

    test('expiration MM/YY format', () => {
        const result = personal();
        assert.match(result.expiration as string, /^\d{2}\/\d{2}$/);
    });

    test('phone has international code', () => {
        const result = personal();
        assert.match(result.phone as string, /^\+\d+ /);
    });

    test('social_profiles has 4 platforms', () => {
        const result = personal();
        const social = result.social_profiles as Record<string, string>;
        assert.ok('twitter' in social);
        assert.ok('facebook' in social);
        assert.ok('linkedin' in social);
        assert.ok('instagram' in social);
    });

    test('emergency_contacts non-empty', () => {
        const result = personal();
        const contacts = result.emergency_contacts as unknown[];
        assert.ok(contacts.length >= 1);
    });
});
