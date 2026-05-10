import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import ip from '../../src/modules/v4/ip.js';

describe('ip', () => {
    describe('IPv4 — type detection', () => {
        test('public IP returns public type and class A', () => {
            const result = ip('8.8.8.8');
            assert.equal(result.version, 'IPv4');
            assert.equal(result.type, 'public');
            assert.equal(result.class, 'A');
        });

        test('private 10.x.x.x', () => {
            const result = ip('10.0.0.1');
            assert.equal(result.type, 'private');
            assert.equal(result.range, '10.0.0.0/8');
        });

        test('private 172.16-31.x.x', () => {
            const result = ip('172.16.0.1');
            assert.equal(result.type, 'private');
            assert.equal(result.range, '172.16.0.0/12');
        });

        test('private 192.168.x.x', () => {
            const result = ip('192.168.1.1');
            assert.equal(result.type, 'private');
            assert.equal(result.class, 'C');
            assert.equal(result.range, '192.168.0.0/16');
        });

        test('loopback 127.0.0.1', () => {
            const result = ip('127.0.0.1');
            assert.equal(result.type, 'loopback');
            assert.equal(result.range, '127.0.0.0/8');
        });

        test('link-local 169.254.x.x', () => {
            const result = ip('169.254.1.1');
            assert.equal(result.type, 'link-local');
        });

        test('multicast 224.x.x.x', () => {
            const result = ip('224.0.0.1');
            assert.equal(result.type, 'multicast');
        });

        test('broadcast 255.255.255.255', () => {
            const result = ip('255.255.255.255');
            assert.equal(result.type, 'broadcast');
            assert.equal(result.class, 'E');
        });
    });

    describe('IPv4 — representations', () => {
        test('binary of 192.168.1.1', () => {
            const result = ip('192.168.1.1');
            assert.equal(result.binary, '11000000.10101000.00000001.00000001');
        });

        test('decimal of 192.168.1.1', () => {
            const result = ip('192.168.1.1');
            assert.equal(result.decimal, 3232235777);
        });

        test('decimal of 8.8.8.8', () => {
            const result = ip('8.8.8.8');
            assert.equal(result.decimal, 134744072);
        });

        test('reverse DNS of 192.168.1.1', () => {
            const result = ip('192.168.1.1');
            assert.equal(result.reverse, '1.1.168.192.in-addr.arpa');
        });

        test('class B for 128.x', () => {
            assert.equal(ip('128.0.0.1').class, 'B');
        });

        test('class C for 192.x (non-private)', () => {
            assert.equal(ip('200.0.0.1').class, 'C');
        });
    });

    describe('IPv6', () => {
        test('loopback ::1', () => {
            const result = ip('::1');
            assert.equal(result.version, 'IPv6');
            assert.equal(result.type, 'loopback');
            assert.equal(result.range, '::1/128');
        });

        test('link-local fe80::1', () => {
            const result = ip('fe80::1');
            assert.equal(result.type, 'link-local');
            assert.equal(result.range, 'fe80::/10');
        });

        test('unique-local fc00::1', () => {
            const result = ip('fc00::1');
            assert.equal(result.type, 'private');
            assert.equal(result.range, 'fc00::/7');
        });

        test('multicast ff02::1', () => {
            const result = ip('ff02::1');
            assert.equal(result.type, 'multicast');
        });

        test(':: expansion produces 8 groups', () => {
            const result = ip('::1');
            assert.equal(result.ip.split(':').length, 8);
        });

        test('reverse DNS ends in .ip6.arpa', () => {
            const result = ip('::1');
            assert.ok(result.reverse.endsWith('.ip6.arpa'));
        });
    });

    describe('errors', () => {
        test('throws on empty string', () => {
            assert.throws(() => ip(''), /required/);
        });

        test('throws on invalid IPv4 octet > 255', () => {
            assert.throws(() => ip('256.0.0.1'), /Invalid IPv4/);
        });

        test('throws on incomplete IPv4', () => {
            assert.throws(() => ip('192.168.1'), /Invalid IPv4/);
        });

        test('throws on plain string', () => {
            assert.throws(() => ip('notanip'), /Invalid IP address format/);
        });
    });
});
