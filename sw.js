const CACHE = 'countdown-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
];

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
  { text: "You are stronger than you think.", author: "Unknown" },
  { text: "Every day is a second chance.", author: "Unknown" },
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch (offline first) ──────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  // Only handle same-origin or cached requests
  if (!e.request.url.startsWith(self.location.origin) &&
      !e.request.url.startsWith('https://api.quotable.io')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        // Cache successful same-origin responses
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
      return cached || network;
    })
  );
});

// ── Periodic Background Sync (daily quote) ────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'daily-quote') {
    e.waitUntil(sendDailyQuote());
  }
});

// ── Push (from server) ────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let payload = { title: 'Daily Motivation 💫', body: 'Open the app for today\'s quote.' };
  try { payload = e.data?.json() || payload; } catch {}
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: './icons/icon.svg',
      badge: './icons/icon.svg',
      tag: 'daily-quote',
      renotify: true,
      data: { url: './' },
      actions: [{ action: 'open', title: 'Open App' }],
    })
  );
});

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('index.html') || c.url.endsWith('/'));
      if (existing) return existing.focus();
      return clients.openWindow(e.notification.data?.url || './');
    })
  );
});

// ── Helpers ────────────────────────────────────────────────────────────────
async function sendDailyQuote() {
  let quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  try {
    const res = await fetch('https://api.quotable.io/random?tags=motivational,success', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      quote = { text: data.content, author: data.author };
    }
  } catch {}

  return self.registration.showNotification('Daily Motivation 💫', {
    body: `"${quote.text}" — ${quote.author}`,
    icon: './icons/icon.svg',
    badge: './icons/icon.svg',
    tag: 'daily-quote',
    renotify: true,
    data: { url: './' },
  });
}
