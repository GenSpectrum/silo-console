import { describe, expect, it } from 'vitest';
import { buildConsoleShareHash, buildConsoleShareUrl, normalizeServerUrl } from './serverUrl';

describe('normalizeServerUrl', () => {
    it('trims whitespace and trailing slashes', () => {
        expect(normalizeServerUrl(' https://example.org/silo/// ')).toBe('https://example.org/silo');
    });

    it('removes query strings and fragments', () => {
        expect(normalizeServerUrl('https://example.org/silo?x=1#fragment')).toBe('https://example.org/silo');
    });

    it('rejects unsupported protocols and invalid URLs', () => {
        expect(() => normalizeServerUrl('ftp://example.org/silo')).toThrow('HTTP or HTTPS');
        expect(() => normalizeServerUrl('example.org/silo')).toThrow();
    });
});

describe('buildConsoleShareUrl', () => {
    it('shares the server and query while preserving the deployed path', () => {
        const url = buildConsoleShareUrl(
            'https://example.org/silo-console/console?old=value#section',
            'https://silo.example.org/api',
            'default.limit(10)',
        );
        expect(url).toBe(
            'https://example.org/silo-console/console#server=https%3A%2F%2Fsilo.example.org%2Fapi&query=default.limit%2810%29',
        );
    });

    it('omits an empty query', () => {
        const url = buildConsoleShareUrl('https://example.org/console', 'https://silo.example.org', '  ');
        expect(url).toBe('https://example.org/console#server=https%3A%2F%2Fsilo.example.org');
    });
});

describe('buildConsoleShareHash', () => {
    it('encodes a server and query for an in-app console link', () => {
        expect(buildConsoleShareHash('https://silo.example.org/api', "default.filter(country = 'Switzerland')")).toBe(
            '#server=https%3A%2F%2Fsilo.example.org%2Fapi&query=default.filter%28country+%3D+%27Switzerland%27%29',
        );
    });
});
