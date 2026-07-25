import { describe, it, expect } from 'vitest';
import '../js/quiz-ranking.js';
const { formatModeLabel, formatCategoriesLabel, buildRankEntry, sortRankEntries, mapSaveError } = globalThis.QuizRanking;

describe('formatModeLabel', () => {
    it('labels th-to-pt mode as Thai to Portuguese', () => {
        expect(formatModeLabel('th-to-pt')).toBe('Thai ➡️ Português');
    });

    it('labels pt-to-th mode as Portuguese to Thai', () => {
        expect(formatModeLabel('pt-to-th')).toBe('Português ➡️ Thai');
    });
});

describe('formatCategoriesLabel', () => {
    const categories = {
        mahd: { title: 'Técnicas de Punho (MAHD)' },
        tee: { title: 'Técnicas de Chutes (TEE)' }
    };

    it('labels the "all" selection as Todas', () => {
        expect(formatCategoriesLabel(['all'], {})).toBe('Todas');
    });

    it('labels a single selected category by its title, without the parenthetical code', () => {
        expect(formatCategoriesLabel(['mahd'], categories)).toBe('Técnicas de Punho');
    });

    it('joins multiple selected categories with a comma', () => {
        expect(formatCategoriesLabel(['mahd', 'tee'], categories)).toBe('Técnicas de Punho, Técnicas de Chutes');
    });
});

describe('buildRankEntry', () => {
    it('captures score, percentage, categories label, mode label and timestamp', () => {
        const entry = buildRankEntry({
            score: 8,
            total: 10,
            selectedCategories: ['all'],
            categories: {},
            mode: 'th-to-pt',
            timestamp: 1700000000000
        });

        expect(entry).toEqual({
            score: 8,
            total: 10,
            percentage: 80,
            categoriesLabel: 'Todas',
            modeLabel: 'Thai ➡️ Português',
            timestamp: 1700000000000
        });
    });
});

describe('sortRankEntries', () => {
    it('sorts entries by percentage descending', () => {
        const worse = { percentage: 50, score: 5, timestamp: 1 };
        const better = { percentage: 90, score: 9, timestamp: 1 };

        expect(sortRankEntries([worse, better])).toEqual([better, worse]);
    });

    it('breaks a percentage tie by raw score descending', () => {
        const lowerScore = { percentage: 80, score: 4, timestamp: 1 };
        const higherScore = { percentage: 80, score: 8, timestamp: 1 };

        expect(sortRankEntries([lowerScore, higherScore])).toEqual([higherScore, lowerScore]);
    });

    it('breaks a percentage and score tie by most recent timestamp first', () => {
        const older = { percentage: 80, score: 8, timestamp: 100 };
        const newer = { percentage: 80, score: 8, timestamp: 200 };

        expect(sortRankEntries([older, newer])).toEqual([newer, older]);
    });

    it('does not mutate the input array', () => {
        const entries = [
            { percentage: 50, score: 5, timestamp: 1 },
            { percentage: 90, score: 9, timestamp: 1 }
        ];
        const original = [...entries];

        sortRankEntries(entries);

        expect(entries).toEqual(original);
    });
});

describe('mapSaveError', () => {
    it('returns null when there is no error', () => {
        expect(mapSaveError(null)).toBe(null);
    });

    it('returns a user-facing message when there is an error', () => {
        const error = { message: 'Failed to fetch' };
        expect(mapSaveError(error)).toBe('Não foi possível salvar seu resultado. Verifique sua conexão.');
    });
});
