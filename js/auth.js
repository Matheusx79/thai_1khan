/**
 * Auth for the ranking screen's login/logout: a thin wrapper around the
 * Supabase client (js/data/techniques.js style window-global IIFE), plus the
 * pure validateLoginInput helper covered by tests/auth.test.js.
 */
(() => {
const SUPABASE_URL = 'https://erakgnfgjhejnwonnvca.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9L2aZcVlSJ1lUkW7YD_ReQ_LYu3zbLf';

// Guarded so this module can still be imported under vitest, where the
// supabase-js CDN script is never loaded.
const client = typeof supabase !== 'undefined'
    ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

function validateLoginInput({ email, password }) {
    if (!email || !email.trim()) {
        return { valid: false, error: 'Informe seu email.' };
    }
    if (!password || !password.trim()) {
        return { valid: false, error: 'Informe sua senha.' };
    }
    if (!email.includes('@')) {
        return { valid: false, error: 'Informe um email válido.' };
    }
    return { valid: true };
}

async function signIn({ email, password }) {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}

async function signOut() {
    await client.auth.signOut();
}

async function getSession() {
    const { data } = await client.auth.getSession();
    return data.session;
}

async function getCurrentProfile() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    const { data, error } = await client
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

    if (error) return null;
    return data;
}

function shouldPersistAttempt(session) {
    return Boolean(session);
}

async function saveRankEntry({ userId, score, total, percentage, selectedCategories, mode }) {
    const { error } = await client
        .from('rank_entries')
        .insert({
            user_id: userId,
            score,
            total,
            percentage,
            selected_categories: selectedCategories,
            mode
        });
    return { error };
}

/**
 * Fetch every rank_entries row belonging to the given user, newest first.
 * RLS already restricts this to the caller's own rows; returns [] on error
 * so the "My History" view can render an empty state rather than throw.
 */
async function getRankHistory(userId) {
    const { data, error } = await client
        .from('rank_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data;
}

/**
 * Fetch the leaderboard: one row per trainee, their single best attempt,
 * already sorted best-to-worst server-side. Bypasses per-row RLS via the
 * SECURITY DEFINER get_leaderboard() function. Returns [] on error so the
 * "Ranking Geral" view can render an empty state rather than throw.
 */
async function getLeaderboard() {
    const { data, error } = await client.rpc('get_leaderboard');
    if (error) return [];
    return data;
}

globalThis.Auth = {
    validateLoginInput,
    signIn,
    signOut,
    getSession,
    getCurrentProfile,
    shouldPersistAttempt,
    saveRankEntry,
    getRankHistory,
    getLeaderboard
};
})();
