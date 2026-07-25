/**
 * Pure helpers for the session-based quiz ranking screen.
 * Follows the same window-global IIFE pattern as js/data/techniques.js.
 */
(() => {
function formatModeLabel(mode) {
    return mode === 'pt-to-th' ? 'Português ➡️ Thai' : 'Thai ➡️ Português';
}

function formatCategoriesLabel(selectedCategories, categories) {
    if (selectedCategories.includes('all')) return 'Todas';
    return selectedCategories
        .map(id => categories[id] ? categories[id].title.split(' (')[0] : id)
        .join(', ');
}

function buildRankEntry({ score, total, selectedCategories, categories, mode, timestamp }) {
    return {
        score,
        total,
        percentage: Math.round((score / total) * 100),
        categoriesLabel: formatCategoriesLabel(selectedCategories, categories),
        modeLabel: formatModeLabel(mode),
        timestamp
    };
}

function sortRankEntries(entries) {
    return [...entries].sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        if (b.score !== a.score) return b.score - a.score;
        return b.timestamp - a.timestamp;
    });
}

function mapSaveError(error) {
    if (!error) return null;
    return 'Não foi possível salvar seu resultado. Verifique sua conexão.';
}

function buildHistoryEntry(row, categories) {
    const selectedCategories = row.selected_categories.split(',');
    return {
        score: row.score,
        total: row.total,
        percentage: row.percentage,
        categoriesLabel: formatCategoriesLabel(selectedCategories, categories),
        modeLabel: formatModeLabel(row.mode),
        timestamp: new Date(row.created_at).getTime()
    };
}

function isNewPersonalBest(entry, allEntries) {
    return sortRankEntries(allEntries)[0] === entry;
}

/**
 * Format a raw get_leaderboard() RPC row (one best attempt per trainee,
 * already sorted server-side) into a display entry, mirroring
 * buildHistoryEntry but keeping the trainee's display name.
 */
function formatLeaderboardEntry(row, categories) {
    const selectedCategories = row.selected_categories.split(',');
    return {
        displayName: row.display_name,
        score: row.score,
        total: row.total,
        percentage: row.percentage,
        categoriesLabel: formatCategoriesLabel(selectedCategories, categories),
        modeLabel: formatModeLabel(row.mode),
        timestamp: new Date(row.created_at).getTime()
    };
}

globalThis.QuizRanking = {
    formatModeLabel,
    formatCategoriesLabel,
    buildRankEntry,
    sortRankEntries,
    mapSaveError,
    buildHistoryEntry,
    isNewPersonalBest,
    formatLeaderboardEntry
};
})();
