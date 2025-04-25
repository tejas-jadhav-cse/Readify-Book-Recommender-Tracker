// Readify - Book Recommender & Tracker
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('resultsList');
const toReadList = document.getElementById('toReadList');
const clearListBtn = document.getElementById('clearList');
const darkModeToggle = document.getElementById('darkModeToggle');
const recommendationList = document.getElementById('recommendationList');

const TO_READ_KEY = 'readify-to-read';
const DARK_MODE_KEY = 'readify-dark-mode';

// --- Book Search ---
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  resultsList.innerHTML = '<p>Loading...</p>';
  const books = await fetchBooks(query);
  renderBooks(books, resultsList, true);
});

async function fetchBooks(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`;
  const res = await fetch(url);
  const data = await res.json();
  return data.docs.map(doc => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
    coverId: doc.cover_i,
    cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : '',
    description: doc.first_sentence ? (typeof doc.first_sentence === 'string' ? doc.first_sentence : doc.first_sentence[0]) : '',
  }));
}

// --- Render Books ---
function renderBooks(books, container, allowAdd = false) {
  if (!books.length) {
    container.innerHTML = '<p>No books found.</p>';
    return;
  }
  container.innerHTML = '';
  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <img src="${book.cover || 'https://via.placeholder.com/100x150?text=No+Cover'}" alt="${book.title}">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      ${book.description ? `<p style='font-size:0.9em;color:#888;'>${book.description}</p>` : ''}
    `;
    if (allowAdd) {
      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add to To-Read';
      addBtn.onclick = () => addToRead(book);
      card.appendChild(addBtn);
    }
    if (!allowAdd) {
      // Reading progress checkbox
      const progress = document.createElement('input');
      progress.type = 'checkbox';
      progress.checked = book.read || false;
      progress.title = 'Mark as read';
      progress.onchange = () => toggleRead(book.key, progress.checked);
      card.appendChild(progress);
      // Notes/quotes
      const note = document.createElement('textarea');
      note.placeholder = 'Save a quote or note...';
      note.value = book.note || '';
      note.onchange = () => saveNote(book.key, note.value);
      card.appendChild(note);
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => removeFromRead(book.key);
      card.appendChild(removeBtn);
    }
    container.appendChild(card);
  });
}

// --- To-Read List ---
function getToRead() {
  return JSON.parse(localStorage.getItem(TO_READ_KEY) || '[]');
}
function saveToRead(list) {
  localStorage.setItem(TO_READ_KEY, JSON.stringify(list));
}
function addToRead(book) {
  const list = getToRead();
  if (!list.find(b => b.key === book.key)) {
    list.push(book);
    saveToRead(list);
    renderToRead();
  }
}
function removeFromRead(key) {
  let list = getToRead();
  list = list.filter(b => b.key !== key);
  saveToRead(list);
  renderToRead();
}
function toggleRead(key, read) {
  const list = getToRead();
  const idx = list.findIndex(b => b.key === key);
  if (idx > -1) {
    list[idx].read = read;
    saveToRead(list);
  }
}
function saveNote(key, note) {
  const list = getToRead();
  const idx = list.findIndex(b => b.key === key);
  if (idx > -1) {
    list[idx].note = note;
    saveToRead(list);
  }
}
function renderToRead() {
  const list = getToRead();
  renderBooks(list, toReadList, false);
}
clearListBtn.onclick = () => {
  if (confirm('Clear your entire To-Read list?')) {
    saveToRead([]);
    renderToRead();
  }
};

// --- Recommendations ---
async function fetchRecommendations() {
  // Example: Top trending fiction
  const url = 'https://openlibrary.org/subjects/fiction.json?limit=8';
  const res = await fetch(url);
  const data = await res.json();
  return data.works.map(work => ({
    key: work.key,
    title: work.title,
    author: work.authors && work.authors.length ? work.authors.map(a => a.name).join(', ') : 'Unknown',
    coverId: work.cover_id,
    cover: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg` : '',
    description: work.subject ? work.subject.slice(0,2).join(', ') : '',
  }));
}
async function renderRecommendations() {
  const recs = await fetchRecommendations();
  renderBooks(recs, recommendationList, true);
}

// --- Dark Mode ---
function setDarkMode(on) {
  document.body.classList.toggle('dark', on);
  localStorage.setItem(DARK_MODE_KEY, on ? '1' : '0');
}
darkModeToggle.onclick = () => {
  setDarkMode(!document.body.classList.contains('dark'));
};
(function initDarkMode() {
  const dark = localStorage.getItem(DARK_MODE_KEY) === '1';
  setDarkMode(dark);
})();

// --- Init ---
renderToRead();
renderRecommendations();
