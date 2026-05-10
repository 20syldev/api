import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import agent from '../../src/modules/v4/agent.js';

const CHROME_MAC =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FIREFOX_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
const SAFARI_IPHONE =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const EDGE_WIN =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const IPAD =
    'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

describe('agent', () => {
    describe('browser detection', () => {
        test('Chrome on macOS', () => {
            const r = agent(CHROME_MAC);
            assert.equal(r.browser.name, 'Chrome');
            assert.equal(r.browser.major, '120');
        });

        test('Firefox on Windows', () => {
            const r = agent(FIREFOX_WIN);
            assert.equal(r.browser.name, 'Firefox');
            assert.equal(r.browser.major, '121');
        });

        test('Safari on iPhone', () => {
            const r = agent(SAFARI_IPHONE);
            assert.equal(r.browser.name, 'Safari');
        });

        test('Edge detected before Chrome (both present in UA)', () => {
            const r = agent(EDGE_WIN);
            assert.equal(r.browser.name, 'Edge');
        });

        test('unknown browser returns unknown', () => {
            const r = agent('UnknownBrowser/1.0');
            assert.equal(r.browser.name, 'unknown');
        });
    });

    describe('OS detection', () => {
        test('macOS from Chrome UA', () => {
            const r = agent(CHROME_MAC);
            assert.equal(r.os.name, 'macOS');
            assert.equal(r.os.version, '10.15.7');
        });

        test('Windows 10/11 from Firefox UA', () => {
            const r = agent(FIREFOX_WIN);
            assert.equal(r.os.name, 'Windows 10/11');
        });

        test('iOS from iPhone UA', () => {
            const r = agent(SAFARI_IPHONE);
            assert.equal(r.os.name, 'iOS');
            assert.equal(r.os.version, '17.0');
        });
    });

    describe('device detection', () => {
        test('desktop from Chrome macOS', () => {
            assert.equal(agent(CHROME_MAC).device.type, 'desktop');
        });

        test('mobile from iPhone UA', () => {
            assert.equal(agent(SAFARI_IPHONE).device.type, 'mobile');
        });

        test('tablet from iPad UA', () => {
            assert.equal(agent(IPAD).device.type, 'tablet');
        });

        test('Apple vendor from iPhone', () => {
            assert.equal(agent(SAFARI_IPHONE).device.vendor, 'Apple');
        });
    });

    describe('engine detection', () => {
        test('Chrome uses Blink', () => {
            assert.equal(agent(CHROME_MAC).engine.name, 'Blink');
        });

        test('Firefox uses Gecko', () => {
            assert.equal(agent(FIREFOX_WIN).engine.name, 'Gecko');
        });

        test('Edge uses Blink', () => {
            assert.equal(agent(EDGE_WIN).engine.name, 'Blink');
        });
    });

    describe('bot detection', () => {
        test('Googlebot is a bot', () => {
            assert.equal(agent(GOOGLEBOT).bot, true);
        });

        test('Chrome is not a bot', () => {
            assert.equal(agent(CHROME_MAC).bot, false);
        });
    });

    describe('errors', () => {
        test('throws on empty string', () => {
            assert.throws(() => agent(''), /required/);
        });
    });
});
