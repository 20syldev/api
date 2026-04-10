import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import domain from '../../src/modules/v4/domain.js';

describe('domain', () => {
    test('returns expected fields', () => {
        const result = domain();
        assert.ok('domain' in result);
        assert.ok('full_domain' in result);
        assert.ok('ip_address' in result);
        assert.ok('dns_servers' in result);
        assert.ok('country' in result);
    });

    test('domain has TLD', () => {
        const result = domain();
        assert.match(
            result.domain as string,
            /\.(com|fr|eu|dev|net|org|io|tech|biz|info|co|app|store|online|shop|tv)$/,
        );
    });

    test('full_domain starts with subdomain', () => {
        const result = domain();
        const full = result.full_domain as string;
        const dom = result.domain as string;
        assert.ok(full.endsWith(dom));
    });

    test('ip_address is non-empty array', () => {
        const result = domain();
        const ips = result.ip_address as string[];
        assert.ok(Array.isArray(ips));
        assert.ok(ips.length >= 1);
    });

    test('seo_score in range 0..99', () => {
        const result = domain();
        const score = result.seo_score as number;
        assert.ok(score >= 0 && score < 100);
    });

    test('ssl_certified is boolean', () => {
        const result = domain();
        assert.equal(typeof result.ssl_certified, 'boolean');
    });
});
