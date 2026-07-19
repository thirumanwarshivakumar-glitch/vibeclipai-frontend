import { describe, it, expect } from 'vitest';

function buildPrompt(skeleton, formValues) {
    if (!skeleton) return '';
    let result = skeleton;
    for (const [key, value] of Object.entries(formValues || {})) {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        result = result.replace(regex, value);
    }
    return result;
}

describe('buildPrompt utility', () => {
    it('should replace dynamic values inside curly brackets', () => {
        const skeleton = 'Hello {name}, welcome to {place}!';
        const values = { name: 'Alice', place: 'VibeClipAI' };
        expect(buildPrompt(skeleton, values)).toBe('Hello Alice, welcome to VibeClipAI!');
    });

    it('should be case-insensitive', () => {
        const skeleton = 'Hello {NAME}!';
        const values = { name: 'Bob' };
        expect(buildPrompt(skeleton, values)).toBe('Hello Bob!');
    });

    it('should handle empty values or skeleton gracefully', () => {
        expect(buildPrompt('', { name: 'Bob' })).toBe('');
        expect(buildPrompt('Hello World', null)).toBe('Hello World');
    });
});
