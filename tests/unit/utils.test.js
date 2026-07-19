import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should handle falsy values', () => {
        expect(cn('bg-red-500', false, null, undefined, 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should resolve tailwind conflicts', () => {
        expect(cn('p-4', 'p-6')).toBe('p-6');
    });
});
