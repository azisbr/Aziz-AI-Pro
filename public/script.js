const landingPage      = document.getElementById('landing-page');
const mainApp          = document.getElementById('main-app');
const enterAppBtn      = document.getElementById('enter-app-btn');
const form             = document.getElementById('search-form');
const input            = document.getElementById('question-input');
const resultContainer  = document.getElementById('result-container');
const welcomeScreen    = document.getElementById('welcome-screen');
const loading          = document.getElementById('loading');
const answerText       = document.getElementById('answer-text');
const sourcesList      = document.getElementById('sources-list');
const similarList      = document.getElementById('similar-list');
const historyList      = document.getElementById('history-list');
const userQueryDisplay = document.getElementById('user-query-display');
const menuToggle       = document.getElementById('menu-toggle');
const closeSidebarBtn  = document.getElementById('close-sidebar');
const sidebarOverlay   = document.getElementById('sidebar-overlay');
const copyBtn          = document.getElementById('copy-btn');

// Ripple
enterAppBtn.addEventListener('click', (e) => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = enterAppBtn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    enterAppBtn.appendChild(r);
    setTimeout(() => r.remove(), 600);
});

// Landing → App
enterAppBtn.addEventListener('click', () => {
    landingPage.classList.add('page-exit');
    setTimeout(() => {
        landingPage.style.display = 'none';
        mainApp.classList.remove('hidden-section');
        mainApp.classList.add('page-enter');
    }, 380);
});

// Sidebar
menuToggle.addEventListener('click', () => sidebarOverlay.classList.add('sidebar-visible'));
closeSidebarBtn.addEventListener('click', () => sidebarOverlay.classList.remove('sidebar-visible'));
sidebarOverlay.addEventListener('click', (e) => {
    if (e.target === sidebarOverlay) sidebarOverlay.classList.remove('sidebar-visible');
});

// Fill from cards
function fillSearch(text) {
    input.value = text;
    input.focus();
}

// Copy
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(answerText.textContent).then(() => {
        copyBtn.textContent = 'check';
        copyBtn.style.color = '#4a7a55';
        setTimeout(() => { copyBtn.textContent = 'content_copy'; copyBtn.style.color = ''; }, 1800);
    });
});

// History
let searchHistory = JSON.parse(localStorage.getItem('turboHistory')) || [];
renderHistory();

document.getElementById('clear-history').addEventListener('click', () => {
    searchHistory = [];
    localStorage.removeItem('turboHistory');
    renderHistory();
});

function renderHistory() {
    historyList.innerHTML = '';
    if (searchHistory.length === 0) {
        historyList.innerHTML = `<li style="justify-content:center;opacity:.4;cursor:default;font-size:.8rem;padding:16px 20px">No history yet</li>`;
        return;
    }
    searchHistory.forEach((q, i) => {
        const li = document.createElement('li');
        li.style.animationDelay = `${i * 0.04}s`;
        li.innerHTML = `<span class="material-icons-round">search</span>${q.length > 38 ? q.slice(0,38)+'…' : q}`;
        li.onclick = () => { performSearch(q); sidebarOverlay.classList.remove('sidebar-visible'); };
        historyList.appendChild(li);
    });
}

function addToHistory(question) {
    searchHistory = searchHistory.filter(i => i !== question);
    searchHistory.unshift(question);
    if (searchHistory.length > 10) searchHistory.pop();
    localStorage.setItem('turboHistory', JSON.stringify(searchHistory));
    renderHistory();
}

// Form submit
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) performSearch(query);
});

// Core search — turboseek (unchanged)
async function performSearch(question) {
    welcomeScreen.classList.add('hidden');
    resultContainer.classList.add('hidden');
    loading.classList.remove('hidden');

    userQueryDisplay.textContent = question;
    input.value = '';
    input.blur();
    document.getElementById('submit-btn').disabled = true;

    addToHistory(question);

    try {
        const response = await fetch(`/api?question=${encodeURIComponent(question)}`);
        const data = await response.json();
        if (response.ok) {
            displayResults(data);
        } else {
            showError(data.error || 'Something went wrong.');
        }
    } catch (error) {
        console.error(error);
        showError('Failed to fetch data. Please try again.');
    } finally {
        loading.classList.add('hidden');
        document.getElementById('submit-btn').disabled = false;
    }
}

function displayResults(data) {
    // Typewriter
    answerText.textContent = '';
    const text = data.answer || '';
    let i = 0;
    answerText.classList.add('typewriter');
    const t = setInterval(() => {
        if (i < text.length) { answerText.textContent += text[i]; i++; }
        else { clearInterval(t); answerText.classList.remove('typewriter'); }
    }, 12);

    // Sources
    sourcesList.innerHTML = '';
    if (data.sources?.length > 0) {
        data.sources.forEach((url, idx) => {
            const li = document.createElement('li');
            li.style.animationDelay = `${idx * 0.06}s`;
            const a = document.createElement('a');
            a.href = url; a.target = '_blank';
            try { a.textContent = new URL(url).hostname; } catch { a.textContent = url; }
            li.appendChild(a);
            sourcesList.appendChild(li);
        });
    } else {
        sourcesList.innerHTML = '<li><a href="#">No sources found.</a></li>';
    }

    // Similar
    similarList.innerHTML = '';
    if (data.similarQuestions?.length > 0) {
        data.similarQuestions.forEach((q, idx) => {
            const li = document.createElement('li');
            li.style.animationDelay = `${idx * 0.06}s`;
            li.textContent = q.question || q;
            li.onclick = () => performSearch(li.textContent);
            similarList.appendChild(li);
        });
    } else {
        similarList.innerHTML = '<li>No related questions.</li>';
    }

    resultContainer.classList.remove('hidden');
    setTimeout(() => {
        document.querySelector('.chat-area').scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function showError(msg) {
    answerText.textContent = '⚠ ' + msg;
    sourcesList.innerHTML = '';
    similarList.innerHTML = '';
    resultContainer.classList.remove('hidden');
}
