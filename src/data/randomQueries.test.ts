import { describe, expect, it } from 'vitest';
import { exercises } from './exercises';
import { getRandomSarsCov2Query, sarsCov2RandomQueries } from './randomQueries';

describe('sarsCov2RandomQueries', () => {
    it('contains ten unique queries with one or two leading comments', () => {
        expect(sarsCov2RandomQueries).toHaveLength(10);
        expect(new Set(sarsCov2RandomQueries).size).toBe(10);

        for (const query of sarsCov2RandomQueries) {
            const lines = query.split('\n');
            const commentCount = lines.findIndex((line) => !line.startsWith('--'));
            expect(commentCount).toBeGreaterThanOrEqual(1);
            expect(commentCount).toBeLessThanOrEqual(2);
            expect(lines[commentCount]).toBe('default');
        }
    });

    it('does not duplicate an exercise answer', () => {
        const exerciseAnswers = new Set(exercises.map((exercise) => normalizeQuery(exercise.answer)));
        for (const query of sarsCov2RandomQueries) expect(exerciseAnswers.has(normalizeQuery(query))).toBe(false);
    });

    it('can avoid immediately selecting the current query again', () => {
        const current = sarsCov2RandomQueries[0];
        expect(getRandomSarsCov2Query(current, () => 0)).toBe(sarsCov2RandomQueries[1]);
    });
});

function normalizeQuery(query: string) {
    return query
        .split('\n')
        .filter((line) => !line.startsWith('--'))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}
