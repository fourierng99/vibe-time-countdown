// ── Sky background ─────────────────────────────────────────────────────────
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');

let W = 0, H = 0;

function resizeSky() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeSky();
window.addEventListener('resize', resizeSky);

// Accent colors kept for confetti
const COLORS = ['#7c5cfc', '#fc5c8a', '#a78bfa', '#f472b6'];

// ── Sky colour keyframes ───────────────────────────────────────────────────
const SKY_KF = [
  [0,  [2,3,20],      [8,8,28]],
  [4,  [4,4,22],      [10,8,38]],
  [5,  [14,10,48],    [70,30,70]],
  [6,  [28,50,120],   [255,110,40]],
  [7,  [50,110,190],  [255,155,70]],
  [9,  [35,125,215],  [130,185,235]],
  [12, [18,96,195],   [96,165,225]],
  [16, [28,98,188],   [118,178,228]],
  [17, [55,75,155],   [255,130,50]],
  [18, [115,35,75],   [255,70,25]],
  [19, [55,18,75],    [110,42,90]],
  [21, [12,8,40],     [22,12,55]],
  [24, [2,3,20],      [8,8,28]],
];

function lerpRGB(a, b, t) {
  return [a[0]+(b[0]-a[0])*t|0, a[1]+(b[1]-a[1])*t|0, a[2]+(b[2]-a[2])*t|0];
}
function rgb([r,g,b]) { return `rgb(${r},${g},${b})`; }

function getSkyColors(h) {
  let i = 0;
  while (i < SKY_KF.length - 2 && SKY_KF[i+1][0] <= h) i++;
  const [ha,ta,ba] = SKY_KF[i], [hb,tb,bb] = SKY_KF[i+1];
  const t = (h-ha)/(hb-ha);
  return { top: lerpRGB(ta,tb,t), bot: lerpRGB(ba,bb,t) };
}

function getWeatherSkyColors(baseColors, weather) {
  const grey = { top:[50,52,62], bot:[70,72,85] };
  const dark  = { top:[18,18,25], bot:[30,30,42] };
  switch (weather) {
    case 'cloudy': return { top:lerpRGB(baseColors.top,grey.top,.35), bot:lerpRGB(baseColors.bot,grey.bot,.30) };
    case 'rainy':  return { top:lerpRGB(baseColors.top,grey.top,.65), bot:lerpRGB(baseColors.bot,grey.bot,.60) };
    case 'stormy': return { top:lerpRGB(baseColors.top,dark.top,.80), bot:lerpRGB(baseColors.bot,dark.bot,.75) };
    case 'foggy':  return { top:lerpRGB(baseColors.top,[110,118,138],.45), bot:lerpRGB(baseColors.bot,[140,148,165],.55) };
    case 'snowy':  return { top:lerpRGB(baseColors.top,[80,88,110],.40), bot:lerpRGB(baseColors.bot,[120,128,148],.45) };
    default: return baseColors;
  }
}

function getDarkness(h) {
  if (h >= 7 && h <= 17) return 0;
  if (h > 17 && h < 19)  return (h-17)/2;
  if (h >= 19 || h < 5)  return 1;
  return 1-(h-5)/2;
}

// ── Stars ─────────────────────────────────────────────────────────────────
const STARS = Array.from({length:220}, () => ({
  x:Math.random(), y:Math.random()*0.72,
  r:Math.random()*1.4+0.3,
  phase:Math.random()*Math.PI*2,
  speed:0.6+Math.random()*2,
}));

// ── Clouds ────────────────────────────────────────────────────────────────
const CLOUDS = Array.from({length:7}, () => ({
  x:Math.random()*1.4-0.2, y:0.06+Math.random()*0.28,
  sc:0.45+Math.random()*0.95, sp:0.000016+Math.random()*0.000024,
}));

function drawCloud(cx, cy, sc, alpha=0.88) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc*0.55);
  ctx.beginPath();
  [[-30,0,38],[20,-12,48],[70,0,32],[0,-22,32],[48,-26,38]].forEach(([x,y,r]) => ctx.arc(x,y,r,0,Math.PI*2));
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.shadowColor='rgba(140,160,255,0.2)';
  ctx.shadowBlur=10;
  ctx.fill();
  ctx.restore();
}

// ── Rain ──────────────────────────────────────────────────────────────────
const RAIN = Array.from({length:350}, () => ({
  x:Math.random(), y:Math.random(),
  len:14+Math.random()*18,
  speed:7+Math.random()*7,
  alpha:0.25+Math.random()*0.45,
}));

function drawRain(intensity, dt) {
  ctx.save();
  ctx.strokeStyle='rgba(180,210,255,1)';
  ctx.lineWidth=1.2;
  const count = Math.floor(RAIN.length * intensity);
  for (let i=0;i<count;i++) {
    const d=RAIN[i];
    d.y += d.speed*intensity*dt*0.055;
    d.x += 0.4*dt*0.055;
    if (d.y>1) { d.y=-0.05; d.x=Math.random(); }
    if (d.x>1) d.x=0;
    ctx.globalAlpha = d.alpha*intensity;
    ctx.beginPath();
    ctx.moveTo(d.x*W, d.y*H);
    ctx.lineTo(d.x*W+d.len*0.28, d.y*H+d.len);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Snow ──────────────────────────────────────────────────────────────────
const SNOW = Array.from({length:180}, () => ({
  x:Math.random(), y:Math.random(),
  r:1.5+Math.random()*2.8,
  vx:(Math.random()-0.5)*0.4,
  vy:0.4+Math.random()*1.4,
  alpha:0.5+Math.random()*0.5,
  phase:Math.random()*Math.PI*2,
}));

function drawSnow(dt, ts) {
  ctx.fillStyle='white';
  SNOW.forEach(s => {
    s.y += s.vy*dt*0.028;
    s.x += s.vx*dt*0.028 + Math.sin(ts*0.0005+s.phase)*0.0008;
    if (s.y>1) { s.y=-0.02; s.x=Math.random(); }
    if (s.x<0) s.x=1; if (s.x>1) s.x=0;
    ctx.globalAlpha=s.alpha;
    ctx.beginPath();
    ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha=1;
}

// ── Lightning ─────────────────────────────────────────────────────────────
let lightTimer=0, lightFlash=0;

function updateLightning(dt) {
  lightTimer -= dt;
  if (lightTimer<=0) {
    lightTimer = 2500+Math.random()*5000;
    lightFlash = 0.85;
  }
  if (lightFlash>0) {
    ctx.fillStyle=`rgba(220,230,255,${lightFlash*0.28})`;
    ctx.fillRect(0,0,W,H);
    lightFlash = Math.max(0, lightFlash-0.07);
  }
}

// ── Fog ───────────────────────────────────────────────────────────────────
function drawFog(ts) {
  const drift = Math.sin(ts*0.0003)*0.04;
  const fg = ctx.createLinearGradient(0, H*0.25, 0, H);
  fg.addColorStop(0,'rgba(175,188,215,0)');
  fg.addColorStop(0.4+drift,'rgba(175,188,215,0.32)');
  fg.addColorStop(1,'rgba(175,188,215,0.62)');
  ctx.fillStyle=fg;
  ctx.fillRect(0,0,W,H);
}

// ── Weather state ─────────────────────────────────────────────────────────
// 'auto'|'clear'|'cloudy'|'rainy'|'stormy'|'snowy'|'foggy'
let userWeather  = localStorage.getItem('userWeather') || 'auto';
let autoWeather  = 'clear';  // fetched from API
let weatherTemp  = null;     // °C from API

const WEATHER_SIM_CYCLE = ['clear','cloudy','rainy','stormy','snowy','foggy'];
const WEATHER_META = {
  clear:  { icon:'☀️',  label:'Clear'   },
  cloudy: { icon:'⛅',  label:'Cloudy'  },
  rainy:  { icon:'🌧',  label:'Rainy'   },
  stormy: { icon:'⛈',  label:'Stormy'  },
  snowy:  { icon:'❄️',  label:'Snowy'   },
  foggy:  { icon:'🌫',  label:'Foggy'   },
};

function activeWeather() {
  return userWeather === 'auto' ? autoWeather : userWeather;
}

// Weather API (Open-Meteo, no key needed)
function weatherCodeToState(code) {
  if (code===0||code===1)           return 'clear';
  if (code===2||code===3)           return 'cloudy';
  if (code===45||code===48)         return 'foggy';
  if (code>=51&&code<=67||code>=80&&code<=82) return 'rainy';
  if (code>=71&&code<=77||code===85||code===86) return 'snowy';
  if (code>=95)                     return 'stormy';
  return 'clear';
}

async function getCoords() {
  // 1. Try browser geolocation (needs https / localhost)
  if (navigator.geolocation && location.protocol !== 'file:') {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch {}
  }
  // 2. IP-based fallbacks (no permission needed, work on file://)
  const GEO_APIS = [
    { url: 'https://ipwho.is/',              parse: d => ({ lat: d.latitude,  lon: d.longitude }) },
    { url: 'https://freeipapi.com/api/json', parse: d => ({ lat: d.latitude,  lon: d.longitude }) },
    { url: 'https://ipinfo.io/json',         parse: d => { const [la,lo]=d.loc.split(','); return { lat:+la, lon:+lo }; } },
  ];
  for (const { url, parse } of GEO_APIS) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) continue;
      const d = await r.json();
      const coords = parse(d);
      if (coords.lat && coords.lon) return coords;
    } catch {}
  }
  throw new Error('All geo APIs failed');
}

async function fetchWeather() {
  const wsLabel = document.getElementById('ws-label');
  if (wsLabel) wsLabel.textContent = 'Fetching…';
  try {
    const { lat, lon } = await getCoords();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m&timezone=auto`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('weather API error');
    const data = await res.json();
    autoWeather = weatherCodeToState(data.current.weather_code);
    weatherTemp = Math.round(data.current.temperature_2m);
    updateWeatherStatus();
  } catch {
    if (wsLabel) wsLabel.textContent = 'Unavailable';
  }
}

function updateWeatherStatus() {
  const aw = activeWeather();
  const meta = WEATHER_META[aw] || { icon:'🌤', label:'' };
  const wsIcon  = document.getElementById('ws-icon');
  const wsLabel = document.getElementById('ws-label');
  const wsTemp  = document.getElementById('ws-temp');
  if (!wsIcon) return;
  wsIcon.textContent  = meta.icon;
  wsLabel.textContent = userWeather==='auto' && !simMode ? `${meta.label} · auto` : meta.label;
  wsTemp.textContent  = weatherTemp!==null ? `${weatherTemp}°C` : '';
}

// ── Simulation state ──────────────────────────────────────────────────────
let simMode   = false;
let simHour   = 0;
const SIM_DURATION_MS = 12000; // 12 real seconds = 24 sim hours

const btnSim   = document.getElementById('btn-sim');
const simClock = document.getElementById('sim-clock');

btnSim.addEventListener('click', () => {
  simMode = !simMode;
  if (simMode) {
    const now = new Date();
    simHour = now.getHours() + now.getMinutes()/60;
    btnSim.classList.add('active');
    simClock.classList.add('visible');
  } else {
    btnSim.classList.remove('active');
    simClock.classList.remove('visible');
    updateWeatherStatus();
  }
});

function fmtHour(h) {
  const hh=Math.floor(h)%24, mm=Math.floor((h%1)*60);
  const ampm=hh<12?'AM':'PM', h12=hh%12||12;
  return `${h12}:${String(mm).padStart(2,'0')} ${ampm}`;
}

// ── Weather picker ─────────────────────────────────────────────────────────
document.querySelectorAll('.btn-w').forEach(btn => {
  // set active state on load (skip random button)
  if (btn.dataset.w !== 'random') {
    btn.classList.toggle('active', btn.dataset.w === userWeather);
  }

  btn.addEventListener('click', () => {
    if (btn.dataset.w === 'random') {
      btn.classList.add('spin');
      btn.addEventListener('animationend', () => btn.classList.remove('spin'), { once: true });

      const options = WEATHER_SIM_CYCLE;
      const picked  = options[Math.floor(Math.random() * options.length)];
      userWeather   = picked;
      localStorage.setItem('userWeather', picked);

      document.querySelectorAll('.btn-w:not(.btn-w-random)').forEach(b => b.classList.remove('active'));
      document.querySelector(`.btn-w[data-w="${picked}"]`)?.classList.add('active');
      updateWeatherStatus();
      return;
    }

    userWeather = btn.dataset.w;
    localStorage.setItem('userWeather', userWeather);
    document.querySelectorAll('.btn-w:not(.btn-w-random)').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (userWeather === 'auto') fetchWeather();
    else updateWeatherStatus();
  });
});

// ── Celestial positions ────────────────────────────────────────────────────
function getSunPos(h) {
  const rise=5.5, set=18.5;
  if (h<rise||h>set) return null;
  const t=(h-rise)/(set-rise);
  return { x:W*t, y:H*0.65-Math.sin(Math.PI*t)*(H*0.65-H*0.10), t };
}
function getMoonPos(h) {
  const nh = h>=19 ? h-19 : h+5;
  if (nh>=10) return null;
  const t=nh/10;
  return { x:W*t, y:H*0.60-Math.sin(Math.PI*t)*(H*0.60-H*0.10), t };
}

// ── Main render loop ──────────────────────────────────────────────────────
let lastTs=0;

function drawSky(ts) {
  const dt = ts-lastTs; lastTs=ts;

  // Advance simulation (time only — weather stays as user set)
  if (simMode) {
    simHour = (simHour+(dt/SIM_DURATION_MS)*24)%24;
    const wIcon = WEATHER_META[activeWeather()]?.icon || '';
    simClock.textContent = fmtHour(simHour) + '  ' + wIcon;
  }

  const hour    = simMode ? simHour : (() => { const n=new Date(); return n.getHours()+n.getMinutes()/60+n.getSeconds()/3600; })();
  const dark    = getDarkness(hour);
  const weather = activeWeather();
  const baseCol = getSkyColors(hour);
  const colors  = getWeatherSkyColors(baseCol, weather);
  const horizon = H*0.65;

  // Sky gradient
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, rgb(colors.top));
  grad.addColorStop(1, rgb(colors.bot));
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  // Stars (hidden in rainy/stormy)
  const starDark = weather==='rainy'||weather==='stormy' ? 0 : dark;
  if (starDark>0.02) {
    STARS.forEach(s => {
      const twinkle=0.55+0.45*Math.sin(ts*0.001*s.speed+s.phase);
      ctx.globalAlpha=starDark*twinkle*0.9;
      ctx.beginPath();
      ctx.arc(s.x*W, s.y*H, s.r,0,Math.PI*2);
      ctx.fillStyle='#ffffff'; ctx.fill();
    });
    ctx.globalAlpha=1;
  }

  // Moon (hidden in storm)
  const moon = getMoonPos(hour);
  if (moon && dark>0.05 && weather!=='stormy') {
    const ma=Math.min(1,dark*1.6)*Math.sin(Math.PI*moon.t);
    const mg=ctx.createRadialGradient(moon.x,moon.y,0,moon.x,moon.y,90);
    mg.addColorStop(0,`rgba(200,215,255,${ma*0.28})`);
    mg.addColorStop(1,'rgba(180,200,255,0)');
    ctx.fillStyle=mg; ctx.fillRect(moon.x-90,moon.y-90,180,180);
    ctx.globalAlpha=ma;
    ctx.beginPath(); ctx.arc(moon.x,moon.y,21,0,Math.PI*2); ctx.fillStyle='#d8e8ff'; ctx.fill();
    ctx.beginPath(); ctx.arc(moon.x+7,moon.y-2,16,0,Math.PI*2); ctx.fillStyle='rgba(160,185,235,0.45)'; ctx.fill();
    ctx.globalAlpha=1;
  }

  // Sun (hidden when cloudy/rainy/stormy)
  const sun = getSunPos(hour);
  if (sun && weather!=='rainy' && weather!=='stormy') {
    const sunVis = weather==='cloudy' ? 0.4 : weather==='foggy' ? 0.55 : 1;
    const sa=Math.min(1,(1-dark)*2.2)*Math.sin(Math.PI*sun.t)*sunVis;
    if (sa>0.01) {
      const sg=ctx.createRadialGradient(sun.x,sun.y,0,sun.x,sun.y,130);
      sg.addColorStop(0,`rgba(255,220,80,${sa*0.5})`);
      sg.addColorStop(0.35,`rgba(255,170,40,${sa*0.18})`);
      sg.addColorStop(1,'rgba(255,100,20,0)');
      ctx.fillStyle=sg; ctx.fillRect(sun.x-130,sun.y-130,260,260);
      ctx.globalAlpha=sa;
      ctx.beginPath(); ctx.arc(sun.x,sun.y,28,0,Math.PI*2);
      const disc=ctx.createRadialGradient(sun.x-4,sun.y-4,0,sun.x,sun.y,28);
      disc.addColorStop(0,'#ffffcc'); disc.addColorStop(1,'#ffbb00');
      ctx.fillStyle=disc; ctx.fill();
      ctx.globalAlpha=1;
    }
  }

  // Horizon glow (sunrise/sunset) — only on clear/cloudy
  const inTransit=(hour>5&&hour<7.2)||(hour>16.8&&hour<19);
  if (inTransit && weather==='clear'||inTransit && weather==='cloudy') {
    const isRise=hour<12;
    const t=isRise?(hour-5)/2.2:(hour-16.8)/2.2;
    const gx=isRise?W*0.15:W*0.85;
    const hg=ctx.createRadialGradient(gx,horizon,0,gx,horizon,H*0.55);
    const intens=Math.sin(Math.PI*t)*0.55;
    hg.addColorStop(0,`rgba(255,120,20,${intens})`);
    hg.addColorStop(0.5,`rgba(255,55,15,${intens*0.3})`);
    hg.addColorStop(1,'rgba(255,55,10,0)');
    ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);
  }

  // Clouds — density by weather
  const cloudAlphaMap  = { clear:0.82, cloudy:0.95, rainy:0.88, stormy:0.92, snowy:0.85, foggy:0.78 };
  const cloudCountMap  = { clear:6, cloudy:7, rainy:6, stormy:6, snowy:5, foggy:5 };
  const cloudDarkMap   = { clear:1, cloudy:0.82, rainy:0.65, stormy:0.45, snowy:0.88, foggy:0.9 };
  if (dark<0.95||weather==='cloudy'||weather==='rainy'||weather==='stormy'||weather==='snowy'||weather==='foggy') {
    const cloudBase = (1-dark)*0.85 + (weather!=='clear'?0.5:0);
    const cnt = cloudCountMap[weather]||6;
    const alpha = cloudAlphaMap[weather]||0.82;
    const dark2 = cloudDarkMap[weather]||1;
    ctx.globalAlpha = Math.min(1, cloudBase) * alpha;
    CLOUDS.slice(0,cnt).forEach(c => {
      c.x += c.sp*dt; if (c.x>1.35) c.x=-0.35;
      drawCloud(c.x*W, c.y*H, c.sc, dark2);
    });
    ctx.globalAlpha=1;
  }

  // Weather effects
  if (weather==='rainy')  drawRain(0.7, dt);
  if (weather==='stormy') { drawRain(1.0, dt); updateLightning(dt); }
  if (weather==='snowy')  drawSnow(dt, ts);
  if (weather==='foggy')  drawFog(ts);

  requestAnimationFrame(drawSky);
}

requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(drawSky); });

// Kick off weather fetch immediately
fetchWeather();

// ── Theme toggle ───────────────────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = themeToggle.querySelector('.theme-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'light' ? 'dark' : 'light');
});

// Apply saved theme on load
applyTheme(localStorage.getItem('theme') || 'dark');

// ── State ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'countdown_state';

let targetDate = null;
let eventName  = '';
let createdAt  = null;
let ticker     = null;

// ── Elements ───────────────────────────────────────────────────────────────
const setupScreen    = document.getElementById('setup-screen');
const countdownScreen = document.getElementById('countdown-screen');
const doneScreen     = document.getElementById('done-screen');

const form        = document.getElementById('setup-form');
const inputName   = document.getElementById('event-name');
const inputDate   = document.getElementById('event-date');

const displayTitle = document.getElementById('display-title');
const displayDate  = document.getElementById('display-date');

const numDays    = document.getElementById('num-days');
const numHours   = document.getElementById('num-hours');
const numMins    = document.getElementById('num-minutes');
const numSecs    = document.getElementById('num-seconds');

const boxDays    = document.getElementById('box-days');
const boxHours   = document.getElementById('box-hours');
const boxMins    = document.getElementById('box-minutes');
const boxSecs    = document.getElementById('box-seconds');

const progressBar   = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');

const quoteLoading  = document.getElementById('quote-loading');
const quoteContent  = document.getElementById('quote-content');
const quoteText     = document.getElementById('quote-text');
const quoteAuthor   = document.getElementById('quote-author');
const btnQuoteRefresh = document.getElementById('btn-quote-refresh');

const doneTitle  = document.getElementById('done-title');
const doneSub    = document.getElementById('done-sub');

// ── Helpers ────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function showScreen(name) {
  [setupScreen, countdownScreen, doneScreen].forEach(s => s.classList.add('hidden'));
  const el = { setup: setupScreen, countdown: countdownScreen, done: doneScreen }[name];
  el.classList.remove('hidden');
  el.style.animation = 'none';
  // force reflow
  void el.offsetHeight;
  el.style.animation = '';
}

let prevVals = { d: null, h: null, m: null, s: null };

function animateFlip(box, numEl, newVal) {
  box.classList.remove('flip');
  void box.offsetHeight;
  numEl.textContent = newVal;
  box.classList.add('flip');
}

function setUnit(box, numEl, key, newVal) {
  if (prevVals[key] !== newVal) {
    animateFlip(box, numEl, newVal);
    prevVals[key] = newVal;
  }
}

function formatDateStr(d) {
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Quotes ─────────────────────────────────────────────────────────────────
const FALLBACK_QUOTES = [
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
];

async function fetchQuote() {
  quoteLoading.classList.remove('hidden');
  quoteContent.classList.add('hidden');
  btnQuoteRefresh.classList.add('spinning');

  try {
    const res = await fetch('https://api.quotable.io/random?tags=motivational,success,education', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    showQuote(data.content, data.author);
  } catch {
    // Fallback to local quotes
    const q = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    showQuote(q.text, q.author);
  }
}

function showQuote(text, author) {
  quoteText.textContent = `"${text}"`;
  quoteAuthor.textContent = `— ${author}`;
  quoteLoading.classList.add('hidden');
  quoteContent.classList.remove('hidden');
  btnQuoteRefresh.classList.remove('spinning');
}

btnQuoteRefresh.addEventListener('click', fetchQuote);

// ── Save / load ────────────────────────────────────────────────────────────
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    targetDate: targetDate ? targetDate.toISOString() : null,
    eventName,
    createdAt: createdAt ? createdAt.toISOString() : null,
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.targetDate) return false;
    targetDate = new Date(data.targetDate);
    eventName  = data.eventName || '';
    createdAt  = data.createdAt ? new Date(data.createdAt) : new Date();
    return true;
  } catch { return false; }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
  targetDate = null;
  eventName  = '';
  createdAt  = null;
}

// ── Tick ───────────────────────────────────────────────────────────────────
function tick() {
  const now  = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    clearInterval(ticker);
    showDone();
    return;
  }

  const totalDiff = targetDate - createdAt;
  const elapsed   = now - createdAt;
  const pct       = totalDiff > 0 ? Math.min(100, (elapsed / totalDiff) * 100) : 0;

  const d  = Math.floor(diff / 86400000);
  const h  = Math.floor((diff % 86400000) / 3600000);
  const m  = Math.floor((diff % 3600000)  / 60000);
  const s  = Math.floor((diff % 60000)    / 1000);

  setUnit(boxDays,  numDays,  'd', pad(d));
  setUnit(boxHours, numHours, 'h', pad(h));
  setUnit(boxMins,  numMins,  'm', pad(m));
  setUnit(boxSecs,  numSecs,  's', pad(s));

  // Update real-time clock
  const now2 = new Date();
  const h2=now2.getHours(), m2=now2.getMinutes(), s2=now2.getSeconds();
  const ampm2=h2<12?'AM':'PM', h122=h2%12||12;
  const ctEl=document.getElementById('clock-time');
  const caEl=document.getElementById('clock-ampm');
  if (ctEl) ctEl.textContent=`${h122}:${String(m2).padStart(2,'0')}:${String(s2).padStart(2,'0')}`;
  if (caEl) caEl.textContent=ampm2;

  progressBar.style.width = pct + '%';
  progressLabel.textContent = `${pct.toFixed(1)}% of the time has passed`;
}

// ── Show screens ───────────────────────────────────────────────────────────
function startCountdown() {
  displayTitle.textContent = eventName || 'My big day';
  displayDate.textContent  = formatDateStr(targetDate);
  doneTitle.textContent    = eventName ? `${eventName} is here!` : "It's here!";
  doneSub.textContent      = formatDateStr(targetDate);

  prevVals = { d: null, h: null, m: null, s: null };
  showScreen('countdown');
  fetchQuote();
  showNotifBanner();
  fetchWeather();
  triggerOpenAppNotif();
  tick();
  clearInterval(ticker);
  ticker = setInterval(tick, 1000);
}

function showDone() {
  showScreen('done');
  launchConfetti();
}

function reset() {
  clearInterval(ticker);
  clearState();
  inputDate.value = '';
  inputName.value = '';
  showScreen('setup');
}

// ── Form submit ────────────────────────────────────────────────────────────
// set min date to tomorrow
(function setMinDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  inputDate.min = tomorrow.toISOString().split('T')[0];
})();

form.addEventListener('submit', e => {
  e.preventDefault();
  const raw = inputDate.value;
  if (!raw) return;

  // treat the chosen date as midnight local time
  const [y, mo, d] = raw.split('-').map(Number);
  targetDate = new Date(y, mo - 1, d, 0, 0, 0, 0);

  if (targetDate <= new Date()) {
    inputDate.setCustomValidity('Please pick a future date.');
    inputDate.reportValidity();
    return;
  }
  inputDate.setCustomValidity('');

  eventName = inputName.value.trim() || 'My big day';
  createdAt = new Date();
  saveState();
  startCountdown();
});

// ── Reset buttons ──────────────────────────────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', reset);
document.getElementById('btn-reset-done').addEventListener('click', reset);

// ── Confetti ───────────────────────────────────────────────────────────────
function launchConfetti() {
  const COUNT = 160;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position:fixed;
      left:${Math.random()*100}vw;
      top:-10px;
      width:${6+Math.random()*6}px;
      height:${6+Math.random()*6}px;
      background:${COLORS[Math.floor(Math.random()*COLORS.length)]};
      border-radius:${Math.random()>.5?'50%':'3px'};
      pointer-events:none;
      z-index:9999;
      opacity:1;
      transform:rotate(${Math.random()*360}deg);
      animation:fall ${1.5+Math.random()*2}s ease-in ${Math.random()*1.5}s forwards;
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }

  if (!document.getElementById('confetti-style')) {
    const s = document.createElement('style');
    s.id = 'confetti-style';
    s.textContent = `
      @keyframes fall {
        to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── PWA: Service Worker ────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ── PWA: Notifications ─────────────────────────────────────────────────────
const notifBanner   = document.getElementById('notif-banner');
const btnNotifEnable  = document.getElementById('btn-notif-enable');
const btnNotifDismiss = document.getElementById('btn-notif-dismiss');

function showNotifBanner() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') { setupPeriodicSync(); return; }
  if (Notification.permission === 'denied') return;
  if (localStorage.getItem('notif_dismissed')) return;
  notifBanner.classList.remove('hidden');
}

btnNotifDismiss.addEventListener('click', () => {
  notifBanner.classList.add('hidden');
  localStorage.setItem('notif_dismissed', '1');
});

btnNotifEnable.addEventListener('click', async () => {
  const perm = await Notification.requestPermission();
  notifBanner.classList.add('hidden');
  if (perm === 'granted') {
    setupPeriodicSync();
    triggerOpenAppNotif(); // show one immediately as confirmation
  }
});

async function setupPeriodicSync() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await reg.periodicSync.register('daily-quote', { minInterval: 24 * 60 * 60 * 1000 });
      }
    }
  } catch {}
}

// Fallback: show a notification when the app is opened (once per day)
async function triggerOpenAppNotif() {
  if (Notification.permission !== 'granted') return;
  const today = new Date().toDateString();
  if (localStorage.getItem('last_notif_date') === today) return;
  localStorage.setItem('last_notif_date', today);

  let quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  try {
    const res = await fetch('https://api.quotable.io/random?tags=motivational,success', { signal: AbortSignal.timeout(4000) });
    if (res.ok) { const d = await res.json(); quote = { text: d.content, author: d.author }; }
  } catch {}

  const reg = await navigator.serviceWorker.ready;
  reg.showNotification('Daily Motivation 💫', {
    body: `"${quote.text}" — ${quote.author}`,
    icon: './icons/icon.svg',
    badge: './icons/icon.svg',
    tag: 'daily-quote',
    data: { url: './' },
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
if (loadState()) {
  if (targetDate <= new Date()) {
    showDone();
  } else {
    startCountdown();
  }
} else {
  showScreen('setup');
}
