(() => {
const techniquesData = window.techniquesData;

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================
const state = {
    // Current Active Tab
    activeTab: 'catalog',

    // Catalog state
    catalog: {
        searchQuery: '',
        selectedCategory: 'all'
    },

    // Flashcards state
    flashcards: {
        deck: [],
        currentIndex: 0,
        selectedCategory: 'all', // 'all' or specific category ID
        isFlipped: false
    },

    // Quiz state
    quiz: {
        active: false,
        questions: [],
        currentIndex: 0,
        score: 0,
        selectedCategories: ['all'], // 'all' or array of category IDs
        limit: 10,
        mode: 'th-to-pt', // 'th-to-pt' or 'pt-to-th'
        hasAnswered: false,
        correctAnswerIndex: -1,
        rankEntries: [], // in-memory session ranking, reset on page reload
        lastRankEntry: null,
        historyEntries: [], // logged-in user's persisted rank_entries rows, refreshed on each ranking screen visit
        leaderboardEntries: [] // every trainee's cumulative total score via get_leaderboard(), refreshed on each ranking screen visit
    }
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
function init() {
    initTabs();
    initCatalog();
    initFlashcards();
    initQuiz();

    // Initialize Technique Modal close events
    const modal = document.getElementById('technique-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', closeTechniqueModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTechniqueModal();
            }
        });
    }
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTechniqueModal();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Pronounce Thai text using native SpeechSynthesis, online authentic Thai TTS, or local fallback
 */
function speakThai(text, script) {
    // 1. Try local Web Speech API if a native Thai voice is installed on the OS/Browser
    if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices.find(voice => 
            voice.lang.toLowerCase().includes('th') || 
            voice.name.toLowerCase().includes('thai')
        );

        if (thaiVoice) {
            window.speechSynthesis.cancel();
            const textToSpeak = script || text;
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'th-TH';
            utterance.voice = thaiVoice;
            utterance.rate = 0.85;
            utterance.pitch = 1.0;

            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
            return;
        }
    }

    // 2. Authentic Thai audio fallback (Google Translate TTS - tl=th)
    const thaiQuery = script || text;
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(thaiQuery)}`;
    
    if (window._currentThaiAudio) {
        try {
            window._currentThaiAudio.pause();
            window._currentThaiAudio.currentTime = 0;
        } catch(e) {}
    }

    const audio = new Audio();
    audio.referrerPolicy = "no-referrer";
    audio.src = audioUrl;
    window._currentThaiAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.warn('Online Thai audio play error, falling back to local TTS engine:', err);
            // 3. Secondary fallback: local browser SpeechSynthesis reading romanized text
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const fallbackUtterance = new SpeechSynthesisUtterance(text);
                fallbackUtterance.rate = 0.85;
                setTimeout(() => {
                    window.speechSynthesis.speak(fallbackUtterance);
                }, 50);
            }
        });
    }
}

// Pre-load voices for browsers that fetch asynchronously (like Chrome)
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
}

/**
 * Open Technique Modal showing the demonstration image for a strike
 */
function openTechniqueModal(item) {
    const modal = document.getElementById('technique-modal');
    if (!modal) return;

    const catInfo = techniquesData.categories[item.category];
    const category = document.getElementById('modal-category');
    const script = document.getElementById('modal-script');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const description = document.getElementById('modal-description');
    const image = document.getElementById('modal-image');
    const imageWrapper = modal.querySelector('.modal-image-wrapper');

    if (category) category.textContent = catInfo ? `${catInfo.icon} ${catInfo.title.split(' (')[0]}` : '';
    if (script) script.textContent = item.thScript;
    if (title) title.textContent = item.thName;
    if (subtitle) subtitle.textContent = item.ptName;
    if (description) description.textContent = item.notes || '';

    // Use the technique's own image when available, otherwise fall back to its category image
    if (image) {
        const src = item.image || (catInfo ? catInfo.image : '');
        image.src = src;
        image.alt = `Demonstração: ${item.ptName}`;
        // Clicking the image replays the pronunciation
        image.style.cursor = 'pointer';
        image.onclick = () => speakThai(item.thName, item.thScript);
    }
    if (imageWrapper) imageWrapper.style.display = 'block';

    modal.classList.add('active');
}

/**
 * Close the Technique Modal
 */
function closeTechniqueModal() {
    const modal = document.getElementById('technique-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==========================================================================
// TAB NAVIGATION LOGIC
// ==========================================================================
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Update active states in DOM
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) targetContent.classList.add('active');
            
            state.activeTab = targetTab;

            // Handle Tab-specific activations
            if (targetTab === 'flashcards') {
                setupFlashcardDeck();
            } else if (targetTab === 'quiz' && !state.quiz.active) {
                resetQuizToSetup();
            }
        });
    });
}

// ==========================================================================
// TAB 1: CATALOGUE LOGIC
// ==========================================================================
function initCatalog() {
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    
    // Populate Category Dropdown
    Object.values(techniquesData.categories).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon} ${cat.title}`;
        categoryFilter.appendChild(option);
    });

    // Render All Cards Initial
    renderCatalog();

    // Event Listeners
    categoryFilter.addEventListener('change', (e) => {
        state.catalog.selectedCategory = e.target.value;
        renderCatalog();
    });

    searchInput.addEventListener('input', (e) => {
        state.catalog.searchQuery = e.target.value.toLowerCase().trim();
        renderCatalog();
    });
}

function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';

    const filteredItems = techniquesData.items.filter(item => {
        // Filter by Category
        const matchesCategory = state.catalog.selectedCategory === 'all' || item.category === state.catalog.selectedCategory;
        
        // Filter by Search Query
        const matchesSearch = !state.catalog.searchQuery || 
            item.thName.toLowerCase().includes(state.catalog.searchQuery) ||
            item.ptName.toLowerCase().includes(state.catalog.searchQuery) ||
            (item.notes && item.notes.toLowerCase().includes(state.catalog.searchQuery));

        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <h3>Nenhuma técnica encontrada</h3>
                <p>Tente ajustar os filtros ou termo de pesquisa.</p>
            </div>
        `;
        return;
    }

    filteredItems.forEach(item => {
        const catInfo = techniquesData.categories[item.category];
        const card = document.createElement('div');
        card.className = `card cat-${item.category}`;
        card.innerHTML = `
            <div class="card-header">
                <span class="card-category">${catInfo ? catInfo.icon + ' ' + catInfo.title.split(' (')[0] : ''}</span>
                <div class="card-actions">
                    <button class="audio-btn" title="Ouvir pronúncia" aria-label="Ouvir pronúncia">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <p class="card-script">${item.thScript}</p>
                <h3 class="card-th">${item.thName}</h3>
                <p class="card-pt">${item.ptName}</p>
                ${item.notes ? `<p class="card-notes">${item.notes}</p>` : ''}
            </div>
        `;

        // Add Speech Event to Audio Button (does not open the modal)
        card.querySelector('.audio-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            speakThai(item.thName, item.thScript);
        });

        // Click card to open the technique modal and hear the pronunciation
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            openTechniqueModal(item);
            speakThai(item.thName, item.thScript);
        });

        grid.appendChild(card);
    });
}

// ==========================================================================
// TAB 2: FLASHCARDS LOGIC
// ==========================================================================
function initFlashcards() {
    const categorySelector = document.getElementById('fc-category-selector');
    const flashcard = document.getElementById('flashcard');
    const flipBtn = document.getElementById('fc-flip-btn');
    const prevBtn = document.getElementById('fc-prev-btn');
    const nextBtn = document.getElementById('fc-next-btn');
    const audioBtn = document.getElementById('fc-audio-btn');

    // Create "Todas" category option button
    const allBtn = document.createElement('button');
    allBtn.className = 'fc-option-btn active';
    allBtn.dataset.category = 'all';
    allBtn.textContent = 'Todas';
    categorySelector.appendChild(allBtn);

    // Populate other category buttons
    Object.values(techniquesData.categories).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'fc-option-btn';
        btn.dataset.category = cat.id;
        btn.textContent = `${cat.icon} ${cat.title.split(' (')[0]}`;
        categorySelector.appendChild(btn);
    });

    // Category selection event listener
    categorySelector.addEventListener('click', (e) => {
        const clickedBtn = e.target.closest('.fc-option-btn');
        if (!clickedBtn) return;

        // Toggle active states
        categorySelector.querySelectorAll('.fc-option-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');

        // Update state and deck
        state.flashcards.selectedCategory = clickedBtn.dataset.category;
        setupFlashcardDeck();
    });

    // Card Flipping interaction
    const triggerFlip = () => {
        state.flashcards.isFlipped = !state.flashcards.isFlipped;
        if (state.flashcards.isFlipped) {
            flashcard.classList.add('flipped');
            flipBtn.textContent = 'Ver Frente';
        } else {
            flashcard.classList.remove('flipped');
            flipBtn.textContent = 'Revelar';
        }
    };
    
    flashcard.addEventListener('click', triggerFlip);
    flipBtn.addEventListener('click', triggerFlip);

    // Prev/Next control buttons
    prevBtn.addEventListener('click', () => navigateFlashcard(-1));
    nextBtn.addEventListener('click', () => navigateFlashcard(1));

    // Audio pronunciation on flashcard
    audioBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent flipping when clicking sound
        const currentItem = state.flashcards.deck[state.flashcards.currentIndex];
        if (currentItem) speakThai(currentItem.thName, currentItem.thScript);
    });
}

function setupFlashcardDeck() {
    const category = state.flashcards.selectedCategory;
    
    // Filter techniques
    let items = techniquesData.items;
    if (category !== 'all') {
        items = items.filter(item => item.category === category);
    }
    
    // Shuffle the items for study
    state.flashcards.deck = shuffleArray(items);
    state.flashcards.currentIndex = 0;
    
    // Reset flip state
    state.flashcards.isFlipped = false;
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('fc-flip-btn').textContent = 'Revelar';

    updateFlashcardUI();
}

function navigateFlashcard(direction) {
    if (state.flashcards.deck.length === 0) return;

    // Apply modulo arithmetic for infinite rotation
    let newIndex = state.flashcards.currentIndex + direction;
    if (newIndex < 0) {
        newIndex = state.flashcards.deck.length - 1;
    } else if (newIndex >= state.flashcards.deck.length) {
        newIndex = 0;
    }

    state.flashcards.currentIndex = newIndex;
    
    // Reset flip state before showing new card
    state.flashcards.isFlipped = false;
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('fc-flip-btn').textContent = 'Revelar';

    // Small delay to allow flip transition to reset before text changes
    setTimeout(() => {
        updateFlashcardUI();
    }, 150);
}

function updateFlashcardUI() {
    const deck = state.flashcards.deck;
    const index = state.flashcards.currentIndex;
    
    const currentIndexEl = document.getElementById('fc-current-index');
    const totalCountEl = document.getElementById('fc-total-count');
    
    if (deck.length === 0) {
        currentIndexEl.textContent = '0';
        totalCountEl.textContent = '0';
        
        document.getElementById('fc-front-script').textContent = '';
        document.getElementById('fc-front-th').textContent = 'Sem técnicas';
        document.getElementById('fc-front-category').textContent = '-';
        document.getElementById('fc-back-image').src = '';
        document.getElementById('fc-back-th-sub').textContent = '';
        document.getElementById('fc-back-th-roman').textContent = '';
        document.getElementById('fc-back-pt').textContent = 'Nenhuma técnica cadastrada';
        document.getElementById('fc-back-notes').textContent = '';
        return;
    }

    currentIndexEl.textContent = index + 1;
    totalCountEl.textContent = deck.length;

    const item = deck[index];
    const catInfo = techniquesData.categories[item.category];
    const categoryTitle = catInfo ? catInfo.title.split(' (')[0] : '';

    // Populate front
    document.getElementById('fc-front-category').textContent = categoryTitle;
    document.getElementById('fc-front-script').textContent = item.thScript;
    document.getElementById('fc-front-th').textContent = item.thName;

    // Populate back
    document.getElementById('fc-back-category').textContent = categoryTitle;
    const backImage = document.getElementById('fc-back-image');
    backImage.src = catInfo ? catInfo.image : '';
    backImage.alt = categoryTitle;
    document.getElementById('fc-back-th-sub').textContent = item.thScript;
    document.getElementById('fc-back-th-roman').textContent = item.thName;
    document.getElementById('fc-back-pt').textContent = item.ptName;
    document.getElementById('fc-back-notes').textContent = item.notes || '';
}

// ==========================================================================
// TAB 3: QUIZ LOGIC
// ==========================================================================
function initQuiz() {
    const categoryGrid = document.getElementById('quiz-category-options');
    const limitOptions = document.getElementById('quiz-limit-options');
    const modeOptions = document.getElementById('quiz-mode-options');
    const startBtn = document.getElementById('start-quiz-btn');
    const cancelBtn = document.getElementById('quiz-cancel-btn');
    const nextBtn = document.getElementById('quiz-next-btn');
    const retryBtn = document.getElementById('quiz-retry-btn');
    const finishBtn = document.getElementById('quiz-finish-btn');
    const setupRankingBtn = document.getElementById('quiz-setup-ranking-btn');
    const resultsRankingBtn = document.getElementById('quiz-results-ranking-btn');
    const rankingBackBtn = document.getElementById('quiz-ranking-back-btn');
    const loginForm = document.getElementById('quiz-login-form');
    const logoutBtn = document.getElementById('quiz-logout-btn');
    const historyTabBtn = document.getElementById('quiz-history-tab-btn');
    const leaderboardTabBtn = document.getElementById('quiz-leaderboard-tab-btn');

    // Populate Quiz Setup Category options
    const allOption = document.createElement('button');
    allOption.className = 'quiz-setup-btn active';
    allOption.dataset.category = 'all';
    allOption.textContent = 'Todas as Categorias';
    categoryGrid.appendChild(allOption);

    Object.values(techniquesData.categories).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'quiz-setup-btn';
        btn.dataset.category = cat.id;
        btn.textContent = `${cat.icon} ${cat.title.split(' (')[0]}`;
        categoryGrid.appendChild(btn);
    });

    // Category options multi-select toggle logic
    categoryGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.quiz-setup-btn');
        if (!btn) return;

        const cat = btn.dataset.category;

        if (cat === 'all') {
            categoryGrid.querySelectorAll('.quiz-setup-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.quiz.selectedCategories = ['all'];
        } else {
            // Uncheck "all" if clicking specific
            const allBtn = categoryGrid.querySelector('[data-category="all"]');
            allBtn.classList.remove('active');
            
            btn.classList.toggle('active');
            
            // Build current list
            const activeBtns = Array.from(categoryGrid.querySelectorAll('.quiz-setup-btn.active'))
                                    .map(b => b.dataset.category);
            
            state.quiz.selectedCategories = activeBtns;

            // If nothing is selected, default back to All
            if (activeBtns.length === 0) {
                allBtn.classList.add('active');
                state.quiz.selectedCategories = ['all'];
            }
        }
    });

    // Limit options selector
    limitOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('.quiz-setup-btn');
        if (!btn) return;

        limitOptions.querySelectorAll('.quiz-setup-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.quiz.limit = btn.dataset.limit === 'all' ? 'all' : parseInt(btn.dataset.limit);
    });

    // Mode options selector
    modeOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('.quiz-setup-btn');
        if (!btn) return;

        modeOptions.querySelectorAll('.quiz-setup-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.quiz.mode = btn.dataset.mode;
    });

    // Main buttons event listeners
    startBtn.addEventListener('click', startQuiz);
    cancelBtn.addEventListener('click', resetQuizToSetup);
    nextBtn.addEventListener('click', nextQuestion);
    
    retryBtn.addEventListener('click', () => {
        document.getElementById('quiz-results-screen').style.display = 'none';
        startQuiz();
    });

    finishBtn.addEventListener('click', resetQuizToSetup);

    setupRankingBtn.addEventListener('click', showRanking);
    resultsRankingBtn.addEventListener('click', showRanking);
    rankingBackBtn.addEventListener('click', resetQuizToSetup);

    loginForm.addEventListener('submit', handleLoginSubmit);
    logoutBtn.addEventListener('click', handleLogoutClick);

    historyTabBtn.addEventListener('click', () => showRankingTab('history'));
    leaderboardTabBtn.addEventListener('click', () => showRankingTab('leaderboard'));
}

async function handleLoginSubmit(e) {
    e.preventDefault();

    const emailInput = document.getElementById('quiz-login-email');
    const passwordInput = document.getElementById('quiz-login-password');
    const errorEl = document.getElementById('quiz-login-error');
    const submitBtn = document.getElementById('quiz-login-submit');

    const email = emailInput.value;
    const password = passwordInput.value;

    const validation = window.Auth.validateLoginInput({ email, password });
    if (!validation.valid) {
        errorEl.textContent = validation.error;
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';
    submitBtn.disabled = true;

    const result = await window.Auth.signIn({ email, password });

    submitBtn.disabled = false;

    if (!result.success) {
        errorEl.textContent = 'Não foi possível entrar. Verifique seu email e senha.';
        errorEl.style.display = 'block';
        return;
    }

    emailInput.value = '';
    passwordInput.value = '';
    await updateRankingAuthUI();
}

async function handleLogoutClick() {
    await window.Auth.signOut();
    await updateRankingAuthUI();
}

/**
 * Toggle the ranking screen between the guest login prompt (with the
 * session-only ranking list) and the logged-in account view (with the
 * My History / Ranking Geral tabs), based on the current Supabase session.
 */
async function updateRankingAuthUI() {
    const guestCta = document.getElementById('quiz-ranking-guest-cta');
    const accountBox = document.getElementById('quiz-ranking-account');
    const accountName = document.getElementById('quiz-account-name');
    const sessionRanking = document.getElementById('quiz-session-ranking');
    const rankingTabs = document.getElementById('quiz-ranking-tabs');

    const session = await window.Auth.getSession();

    if (session) {
        guestCta.style.display = 'none';
        accountBox.style.display = 'block';
        sessionRanking.style.display = 'none';
        rankingTabs.style.display = 'block';
        const profile = await window.Auth.getCurrentProfile();
        accountName.textContent = profile ? profile.display_name : session.user.email;
        await loadHistory(session.user.id);
        await loadLeaderboard();
    } else {
        guestCta.style.display = 'block';
        accountBox.style.display = 'none';
        sessionRanking.style.display = 'block';
        rankingTabs.style.display = 'none';
    }
}

/**
 * Switch the logged-in ranking screen between the "Meu Histórico" (ticket #6)
 * and "Ranking Geral" (ticket #7) sub-views.
 */
function showRankingTab(tab) {
    const historyTabBtn = document.getElementById('quiz-history-tab-btn');
    const leaderboardTabBtn = document.getElementById('quiz-leaderboard-tab-btn');
    const historyContent = document.getElementById('quiz-history-content');
    const leaderboardContent = document.getElementById('quiz-leaderboard-content');

    const showHistory = tab === 'history';
    historyTabBtn.classList.toggle('active', showHistory);
    leaderboardTabBtn.classList.toggle('active', !showHistory);
    historyContent.style.display = showHistory ? 'block' : 'none';
    leaderboardContent.style.display = showHistory ? 'none' : 'block';
}

/**
 * Fetch the logged-in user's own persisted quiz attempts and render them.
 */
async function loadHistory(userId) {
    const rows = await window.Auth.getRankHistory(userId);
    state.quiz.historyEntries = rows.map(row =>
        window.QuizRanking.buildHistoryEntry(row, techniquesData.categories)
    );
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('quiz-history-list');
    const emptyState = document.getElementById('quiz-history-empty');
    list.innerHTML = '';

    if (state.quiz.historyEntries.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    const sortedEntries = window.QuizRanking.sortRankEntries(state.quiz.historyEntries);

    sortedEntries.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'quiz-ranking-entry';

        const isBest = window.QuizRanking.isNewPersonalBest(entry, state.quiz.historyEntries);
        const date = new Date(entry.timestamp);
        const dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        li.innerHTML = `
            <div class="quiz-ranking-entry-main">
                <span class="quiz-ranking-entry-pct">${entry.percentage}%</span>
                <span class="quiz-ranking-entry-score">${entry.score}/${entry.total}</span>
                ${isBest ? '<span class="quiz-ranking-badge">Recorde!</span>' : ''}
            </div>
            <div class="quiz-ranking-entry-meta">
                <span>${entry.categoriesLabel}</span>
                <span>${entry.modeLabel}</span>
                <span>${dateLabel} ${timeLabel}</span>
            </div>
        `;

        list.appendChild(li);
    });
}

/**
 * Escape a user-controlled string (e.g. a trainee's own display_name) before
 * interpolating it into an innerHTML template, to avoid stored XSS.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Fetch every trainee's cumulative total score (sum of score across all of
 * their saved attempts, via the get_leaderboard() RPC) and render them,
 * sorted highest-total-first (already sorted server-side).
 */
async function loadLeaderboard() {
    const rows = await window.Auth.getLeaderboard();
    state.quiz.leaderboardEntries = rows.map(row =>
        window.QuizRanking.formatLeaderboardEntry(row)
    );
    renderLeaderboard();
}

function renderLeaderboard() {
    const list = document.getElementById('quiz-leaderboard-list');
    const emptyState = document.getElementById('quiz-leaderboard-empty');
    list.innerHTML = '';

    if (state.quiz.leaderboardEntries.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    // Already sorted highest-cumulative-total-first by the get_leaderboard()
    // RPC server-side (ties broken by most attempts, then most recent activity).
    state.quiz.leaderboardEntries.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'quiz-ranking-entry';

        const attemptsLabel = entry.attemptsCount === 1
            ? '1 tentativa salva'
            : `${entry.attemptsCount} tentativas salvas`;

        li.innerHTML = `
            <div class="quiz-ranking-entry-main">
                <span class="quiz-ranking-entry-rank">#${index + 1}</span>
                <span class="quiz-ranking-entry-total">${entry.totalScore} pontos</span>
                ${index === 0 ? '<span class="quiz-ranking-badge">Líder</span>' : ''}
            </div>
            <div class="quiz-ranking-entry-meta">
                <span class="quiz-ranking-entry-name">${escapeHtml(entry.displayName)}</span>
                <span>${attemptsLabel}</span>
            </div>
        `;

        list.appendChild(li);
    });
}

function resetQuizToSetup() {
    state.quiz.active = false;
    document.getElementById('quiz-board').style.display = 'none';
    document.getElementById('quiz-results-screen').style.display = 'none';
    document.getElementById('quiz-ranking-screen').style.display = 'none';
    document.getElementById('quiz-setup').style.display = 'block';
}

function startQuiz() {
    // 1. Gather filtered items
    let pool = [];
    const selected = state.quiz.selectedCategories;

    if (selected.includes('all')) {
        pool = [...techniquesData.items];
    } else {
        pool = techniquesData.items.filter(item => selected.includes(item.category));
    }

    if (pool.length < 4) {
        alert('Selecione categorias que possuam pelo menos 4 técnicas juntas para que as alternativas de múltipla escolha funcionem corretamente!');
        return;
    }

    // 2. Setup quiz configurations
    state.quiz.active = true;
    state.quiz.score = 0;
    state.quiz.currentIndex = 0;
    
    // Shuffled question pool
    const shuffledPool = shuffleArray(pool);
    const count = state.quiz.limit === 'all' ? shuffledPool.length : Math.min(state.quiz.limit, shuffledPool.length);
    state.quiz.questions = shuffledPool.slice(0, count);

    // Hide setup screen, show quiz board
    document.getElementById('quiz-setup').style.display = 'none';
    document.getElementById('quiz-results-screen').style.display = 'none';
    document.getElementById('quiz-ranking-screen').style.display = 'none';
    document.getElementById('quiz-board').style.display = 'block';

    displayQuestion();
}

function displayQuestion() {
    state.quiz.hasAnswered = false;
    const currentQ = state.quiz.questions[state.quiz.currentIndex];
    
    // Update progress numbers
    document.getElementById('quiz-current-num').textContent = state.quiz.currentIndex + 1;
    document.getElementById('quiz-total-num').textContent = state.quiz.questions.length;
    document.getElementById('quiz-score').textContent = state.quiz.score;
    
    const pct = ((state.quiz.currentIndex) / state.quiz.questions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${pct}%`;

    // Clear feedback and hide Next button
    const feedbackText = document.getElementById('quiz-feedback-message');
    feedbackText.className = 'quiz-feedback-text';
    feedbackText.textContent = '';
    document.getElementById('quiz-next-btn').style.display = 'none';

    // Setup question display based on Mode
    const questionTextEl = document.getElementById('quiz-question-text');
    const questionScriptEl = document.getElementById('quiz-question-script');
    const instructionEl = document.getElementById('quiz-question-instruction');

    if (state.quiz.mode === 'th-to-pt') {
        instructionEl.textContent = 'Qual é a tradução desta técnica?';
        questionScriptEl.textContent = currentQ.thScript;
        questionTextEl.textContent = currentQ.thName;
        // Automatically speak Thai word on loading if mode is Thai
        speakThai(currentQ.thName, currentQ.thScript);
    } else {
        instructionEl.textContent = 'Qual é o nome em tailandês desta técnica?';
        questionScriptEl.textContent = '';
        questionTextEl.textContent = currentQ.ptName;
    }

    // Generate Multiple Choices (1 correct + 3 distractors)
    const optionsGrid = document.getElementById('quiz-options-grid');
    optionsGrid.innerHTML = '';

    // Find distractors from the *whole* techniques database that are NOT the correct item
    const allDistractors = techniquesData.items.filter(item => item.id !== currentQ.id);
    const selectedDistractors = shuffleArray(allDistractors).slice(0, 3);
    
    // Combine correct answer and distractors, then shuffle options
    const rawOptions = [currentQ, ...selectedDistractors];
    const shuffledOptions = shuffleArray(rawOptions);

    shuffledOptions.forEach((option, idx) => {
        const isCorrect = option.id === currentQ.id;
        if (isCorrect) {
            state.quiz.correctAnswerIndex = idx;
        }

        const btn = document.createElement('button');
        btn.className = 'quiz-option';

        // Show correct label based on mode
        if (state.quiz.mode === 'th-to-pt') {
            btn.textContent = option.ptName;
        } else {
            btn.innerHTML = `
                <span class="quiz-option-script">${option.thScript}</span>
                <span class="quiz-option-roman">${option.thName}</span>
            `;
        }

        btn.addEventListener('click', () => handleOptionClick(idx, btn, isCorrect));
        optionsGrid.appendChild(btn);
    });
}

function handleOptionClick(index, optionBtn, isCorrect) {
    if (state.quiz.hasAnswered) return;
    state.quiz.hasAnswered = true;

    const optionsGrid = document.getElementById('quiz-options-grid');
    const optionButtons = optionsGrid.querySelectorAll('.quiz-option');

    // Disable all options
    optionButtons.forEach(btn => btn.classList.add('disabled'));

    const feedbackText = document.getElementById('quiz-feedback-message');
    const currentQ = state.quiz.questions[state.quiz.currentIndex];

    if (isCorrect) {
        optionBtn.classList.add('correct');
        state.quiz.score++;
        document.getElementById('quiz-score').textContent = state.quiz.score;
        feedbackText.textContent = '✅ Correto! Excelente trabalho.';
        feedbackText.classList.add('correct');
        
        // Speak correct name in tailandês if it wasn't spoken yet
        if (state.quiz.mode === 'pt-to-th') {
            speakThai(currentQ.thName, currentQ.thScript);
        }
    } else {
        optionBtn.classList.add('incorrect');
        
        // Reveal correct one
        optionButtons[state.quiz.correctAnswerIndex].classList.add('correct');
        
        if (state.quiz.mode === 'th-to-pt') {
            feedbackText.textContent = `❌ Incorreto. O correto é: "${currentQ.ptName}"`;
        } else {
            feedbackText.textContent = `❌ Incorreto. O correto é: "${currentQ.thName}"`;
            speakThai(currentQ.thName, currentQ.thScript);
        }
        feedbackText.classList.add('incorrect');
    }

    // Show Next button
    document.getElementById('quiz-next-btn').style.display = 'inline-block';
}

function nextQuestion() {
    state.quiz.currentIndex++;
    
    if (state.quiz.currentIndex < state.quiz.questions.length) {
        displayQuestion();
    } else {
        // Finished Quiz! Update final progress bar to 100%
        document.getElementById('quiz-progress').style.width = '100%';
        setTimeout(showQuizResults, 300);
    }
}

async function showQuizResults() {
    document.getElementById('quiz-board').style.display = 'none';
    const resultsScreen = document.getElementById('quiz-results-screen');
    resultsScreen.style.display = 'block';

    const saveErrorEl = document.getElementById('quiz-save-error');
    saveErrorEl.style.display = 'none';

    const score = state.quiz.score;
    const total = state.quiz.questions.length;
    const pct = Math.round((score / total) * 100);

    document.getElementById('results-score-pct').textContent = `${pct}%`;
    document.getElementById('results-score-ratio').textContent = `${score} de ${total} acertos`;

    const messageEl = document.getElementById('results-message');
    if (pct === 100) {
        messageEl.textContent = '🏆 Incrível! Você acertou absolutamente tudo. Sawadee Krap/Ka!';
    } else if (pct >= 80) {
        messageEl.textContent = '🔥 Excelente! Você já domina a maior parte do vocabulário do 1º Khan.';
    } else if (pct >= 50) {
        messageEl.textContent = '👍 Bom trabalho. Continue praticando para fixar os nomes mais complexos.';
    } else {
        messageEl.textContent = '💪 Não desanime! O Muay Thai exige repetição. Refaça o treino e tente novamente.';
    }

    const selectedCategories = state.quiz.selectedCategories;
    const mode = state.quiz.mode;

    const entry = window.QuizRanking.buildRankEntry({
        score,
        total,
        selectedCategories,
        categories: techniquesData.categories,
        mode,
        timestamp: Date.now()
    });
    state.quiz.rankEntries.push(entry);
    state.quiz.lastRankEntry = entry;

    const session = await window.Auth.getSession();
    if (!window.Auth.shouldPersistAttempt(session)) return;

    const { error } = await window.Auth.saveRankEntry({
        userId: session.user.id,
        score,
        total,
        percentage: entry.percentage,
        selectedCategories: selectedCategories.join(','),
        mode
    });

    const errorMessage = window.QuizRanking.mapSaveError(error);
    if (errorMessage) {
        saveErrorEl.textContent = errorMessage;
        saveErrorEl.style.display = 'block';
    }
}

/**
 * Show the session ranking screen, listing every completed quiz run sorted best-to-worst
 */
function showRanking() {
    document.getElementById('quiz-setup').style.display = 'none';
    document.getElementById('quiz-board').style.display = 'none';
    document.getElementById('quiz-results-screen').style.display = 'none';
    document.getElementById('quiz-ranking-screen').style.display = 'block';

    updateRankingAuthUI();
    renderRanking();
}

function renderRanking() {
    const list = document.getElementById('quiz-ranking-list');
    const emptyState = document.getElementById('quiz-ranking-empty');
    list.innerHTML = '';

    if (state.quiz.rankEntries.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    const sortedEntries = window.QuizRanking.sortRankEntries(state.quiz.rankEntries);

    sortedEntries.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'quiz-ranking-entry';

        const isNewest = entry === state.quiz.lastRankEntry;
        const date = new Date(entry.timestamp);
        const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        li.innerHTML = `
            <div class="quiz-ranking-entry-main">
                <span class="quiz-ranking-entry-pct">${entry.percentage}%</span>
                <span class="quiz-ranking-entry-score">${entry.score}/${entry.total}</span>
                ${isNewest ? '<span class="quiz-ranking-badge">Novo!</span>' : ''}
            </div>
            <div class="quiz-ranking-entry-meta">
                <span>${entry.categoriesLabel}</span>
                <span>${entry.modeLabel}</span>
                <span>${timeLabel}</span>
            </div>
        `;

        list.appendChild(li);
    });
}
})();
