import { describe, it, expect } from 'vitest';
import '../js/quiz-ranking.js';
const { formatModeLabel, formatCategoriesLabel, buildRankEntry, sortRankEntries, mapSaveError, buildHistoryEntry, isNewPersonalBest, formatLeaderboardEntry, sumHistoryScores } = globalThis.QuizRanking;

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

describe('buildHistoryEntry', () => {
    it('formats a raw rank_entries row into a display entry', () => {
        const row = {
            id: 'abc-123',
            score: 4,
            total: 10,
            percentage: 40,
            selected_categories: 'all',
            mode: 'th-to-pt',
            created_at: '2024-11-14T12:00:00.000Z'
        };

        const entry = buildHistoryEntry(row, {});

        expect(entry).toEqual({
            score: 4,
            total: 10,
            percentage: 40,
            categoriesLabel: 'Todas',
            modeLabel: 'Thai ➡️ Português',
            timestamp: new Date('2024-11-14T12:00:00.000Z').getTime()
        });
    });
});

describe('formatLeaderboardEntry', () => {
    it('formats a raw get_leaderboard() row into a display entry with the cumulative total', () => {
        const row = {
            display_name: 'Smoke Test',
            total_score: 6,
            attempts_count: 2
        };

        const entry = formatLeaderboardEntry(row);

        expect(entry).toEqual({
            displayName: 'Smoke Test',
            totalScore: 6,
            attemptsCount: 2
        });
    });

    it('formats a single-attempt trainee the same way', () => {
        const row = {
            display_name: 'Smoke Test Two',
            total_score: 9,
            attempts_count: 1
        };

        const entry = formatLeaderboardEntry(row);

        expect(entry).toEqual({
            displayName: 'Smoke Test Two',
            totalScore: 9,
            attemptsCount: 1
        });
    });
});

describe('sumHistoryScores', () => {
    it('returns 0 for an empty array', () => {
        expect(sumHistoryScores([])).toBe(0);
    });

    it('returns that entry\'s score for a single entry', () => {
        const entry = { score: 7, total: 10, percentage: 70, categoriesLabel: 'Todas', modeLabel: 'Thai ➡️ Português', timestamp: 1 };
        expect(sumHistoryScores([entry])).toBe(7);
    });

    it('returns the total of all scores for multiple entries', () => {
        const entries = [
            { score: 4, total: 10, percentage: 40, categoriesLabel: 'Todas', modeLabel: 'Thai ➡️ Português', timestamp: 1 },
            { score: 2, total: 10, percentage: 20, categoriesLabel: 'Todas', modeLabel: 'Thai ➡️ Português', timestamp: 2 },
            { score: 9, total: 10, percentage: 90, categoriesLabel: 'Todas', modeLabel: 'Thai ➡️ Português', timestamp: 3 }
        ];
        expect(sumHistoryScores(entries)).toBe(15);
    });
});

describe('isNewPersonalBest', () => {
    it('returns true when the entry is the top-ranked entry among all entries', () => {
        const best = { percentage: 90, score: 9, timestamp: 100 };
        const worse = { percentage: 50, score: 5, timestamp: 100 };

        expect(isNewPersonalBest(best, [best, worse])).toBe(true);
    });

    it('returns false when another entry outranks it', () => {
        const best = { percentage: 90, score: 9, timestamp: 100 };
        const worse = { percentage: 50, score: 5, timestamp: 100 };

        expect(isNewPersonalBest(worse, [best, worse])).toBe(false);
    });

    it('does not throw when two entries tie for best and treats one of them as the best', () => {
        const tiedA = { percentage: 80, score: 8, timestamp: 100 };
        const tiedB = { percentage: 80, score: 8, timestamp: 100 };

        expect(() => isNewPersonalBest(tiedA, [tiedA, tiedB])).not.toThrow();
        expect(
            isNewPersonalBest(tiedA, [tiedA, tiedB]) || isNewPersonalBest(tiedB, [tiedA, tiedB])
        ).toBe(true);
    });
});
