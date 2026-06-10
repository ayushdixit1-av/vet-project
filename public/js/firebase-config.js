const API_URL = window.location.origin;

async function fetchFirebaseConfig() {
  try {
    const res = await fetch(`${API_URL}/api/firebase-config`);
    const config = await res.json();
    return config;
  } catch (e) {
    console.warn('Failed to fetch Firebase config from server, using defaults');
    return null;
  }
}

let firebaseReady = false;

async function initFirebase() {
  if (firebaseReady) return;
  
  const config = await fetchFirebaseConfig();
  
  const firebaseConfig = config && config.apiKey ? config : {
    apiKey: "AIzaSyB28sa1hfakfQm-7PskrUJEcI8Fhu8XMds",
    authDomain: "login1-140f4.firebaseapp.com",
    projectId: "login1-140f4",
    storageBucket: "login1-140f4.firebasestorage.app",
    messagingSenderId: "805102805360",
    appId: "1:805102805360:web:7019d891c406f972da2fb5"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  firebaseReady = true;
}

let auth_ = null;
let firebaseInitPromise = null;

async function ensureFirebase() {
  if (firebaseInitPromise) return firebaseInitPromise;
  firebaseInitPromise = (async () => {
    await initFirebase();
    auth_ = firebase.auth();
  })();
  return firebaseInitPromise;
}

ensureFirebase();

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('vetcrack_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function blogApiRequest(endpoint, options = {}) {
  return apiRequest(`/blogs${endpoint}`, options);
}

function placeholderImg(text, w = 400, h = 250, bg = '1a1a2e', fg = '00ff88') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect fill="#${bg}" width="${w}" height="${h}"/><text fill="#${fg}" font-family="Arial,sans-serif" font-size="${Math.round(Math.min(w,h)/12)}" text-anchor="middle" x="50%" y="50%" dominant-baseline="middle">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
