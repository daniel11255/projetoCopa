
/**
 * =====================================================
 * COPA DO MUNDO 2026 – JOGO DAS BANDEIRAS
 * script.js – Lógica principal do jogo
 * =====================================================
 */

// =====================================================
// DADOS: 48 seleções participantes
// =====================================================

const TEAMS = [
  // Grupo A
  { id:  1, name: 'México',            code: 'mx' },
  { id:  2, name: 'África do Sul',     code: 'za' },
  { id:  3, name: 'Coreia do Sul',     code: 'kr' },
  { id:  4, name: 'Tchéquia',          code: 'cz' },
  // Grupo B
  { id:  5, name: 'Canadá',            code: 'ca' },
  { id:  6, name: 'Bósnia-Herzegovina',code: 'ba' },
  { id:  7, name: 'Catar',             code: 'qa' },
  { id:  8, name: 'Suíça',             code: 'ch' },
  // Grupo C
  { id:  9, name: 'Brasil',            code: 'br' },
  { id: 10, name: 'Marrocos',          code: 'ma' },
  { id: 11, name: 'Haiti',             code: 'ht' },
  { id: 12, name: 'Escócia',           code: 'gb-sct' },
  // Grupo D
  { id: 13, name: 'Estados Unidos',    code: 'us' },
  { id: 14, name: 'Paraguai',          code: 'py' },
  { id: 15, name: 'Austrália',         code: 'au' },
  { id: 16, name: 'Turquia',           code: 'tr' },
  // Grupo E
  { id: 17, name: 'Alemanha',          code: 'de' },
  { id: 18, name: 'Curaçao',           code: 'cw' },
  { id: 19, name: 'Costa do Marfim',   code: 'ci' },
  { id: 20, name: 'Equador',           code: 'ec' },
  // Grupo F
  { id: 21, name: 'Holanda',           code: 'nl' },
  { id: 22, name: 'Japão',             code: 'jp' },
  { id: 23, name: 'Suécia',            code: 'se' },
  { id: 24, name: 'Tunísia',           code: 'tn' },
  // Grupo G
  { id: 25, name: 'Bélgica',           code: 'be' },
  { id: 26, name: 'Egito',             code: 'eg' },
  { id: 27, name: 'Irã',               code: 'ir' },
  { id: 28, name: 'Nova Zelândia',     code: 'nz' },
  // Grupo H
  { id: 29, name: 'Espanha',           code: 'es' },
  { id: 30, name: 'Cabo Verde',        code: 'cv' },
  { id: 31, name: 'Arábia Saudita',    code: 'sa' },
  { id: 32, name: 'Uruguai',           code: 'uy' },
  // Grupo I
  { id: 33, name: 'França',            code: 'fr' },
  { id: 34, name: 'Senegal',           code: 'sn' },
  { id: 35, name: 'Iraque',            code: 'iq' },
  { id: 36, name: 'Noruega',           code: 'no' },
  // Grupo J
  { id: 37, name: 'Argentina',         code: 'ar' },
  { id: 38, name: 'Argélia',           code: 'dz' },
  { id: 39, name: 'Áustria',           code: 'at' },
  { id: 40, name: 'Jordânia',          code: 'jo' },
  // Grupo K
  { id: 41, name: 'Portugal',          code: 'pt' },
  { id: 42, name: 'R.D. Congo',        code: 'cd' },
  { id: 43, name: 'Uzbequistão',       code: 'uz' },
  { id: 44, name: 'Colômbia',          code: 'co' },
  // Grupo L
  { id: 45, name: 'Inglaterra',        code: 'gb-eng' },
  { id: 46, name: 'Croácia',           code: 'hr' },
  { id: 47, name: 'Gana',              code: 'gh' },
  { id: 48, name: 'Panamá',            code: 'pa' },
];

// =====================================================
// CONFIGURAÇÃO DA ROLETA
// =====================================================

const ITEM_W     = 150;
const NUM_COPIES = 12;
const COPY_SIZE  = TEAMS.length;
const TOTAL_ITEMS = NUM_COPIES * COPY_SIZE;

// =====================================================
// ESTADO DO JOGO
// =====================================================

const state = {
  playerName:    '',
  remaining:     [],
  drawn:         [],
  history:       [],
  correct:       0,
  wrong:         0,
  streak:        0,
  bestStreak:    0,
  totalSpins:    0,
  currentWinner: null,
  startTime:      null,
  pausedAt:       null,
  totalPausedMs:  0,
  soundEnabled:   true,
  spinning:       false,
  revealed:       false,
  answered:       false,
};

// =====================================================
// ESTADO DA ROLETA
// =====================================================

let stripOrderBase = [];
let stripOrder = [];
let currentOffset = 0;
let animFrameId = null;

// =====================================================
// ÁUDIO (Web Audio API)
// =====================================================

let audioCtx = null;
let spinTickTimer = null;
let spinTickDelay = 180;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', gain = 0.25) {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function startSpinSound() {
  if (!state.soundEnabled) return;
  spinTickDelay = 180;
  const tick = () => {
    playTone(250 + Math.random() * 150, 0.04, 'square', 0.08);
    spinTickDelay = Math.max(25, spinTickDelay * 0.97);
    spinTickTimer = setTimeout(tick, spinTickDelay);
  };
  tick();
}

function stopSpinSound() {
  clearTimeout(spinTickTimer);
  spinTickTimer = null;
}

function playStopSound() {
  playTone(880, 0.25);
  setTimeout(() => playTone(1100, 0.35), 150);
  setTimeout(() => playTone(1320, 0.5), 300);
}

function playCorrectSound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 110));
}

function playWrongSound() {
  [350, 280, 220].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'sawtooth', 0.15), i * 130));
}

// =====================================================
// CONFETTI
// =====================================================

function launchConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#009c3b','#FFDF00','#002776','#ff6b6b','#4ecdc4','#ffffff','#ff9ff3'];
  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      const size = Math.random() * 10 + 6;
      p.style.cssText = `
        left: ${Math.random() * 100}vw;
        width: ${size}px;
        height: ${size * (Math.random() * 1.5 + 0.5)}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration: ${Math.random() * 2.5 + 2}s;
        animation-delay: ${Math.random() * 0.3}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), 4500);
    }, i * 12);
  }
}

// =====================================================
// VIBRAÇÃO
// =====================================================

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFlagUrl(code) {
  return `https://flagcdn.com/w160/${code}.png`;
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getElapsedSeconds() {
  if (!state.startTime) return 0;
  const pausedMs = state.totalPausedMs + (state.pausedAt ? Date.now() - state.pausedAt : 0);
  return Math.floor((Date.now() - state.startTime - pausedMs) / 1000);
}

function pauseTimer() {
  if (!state.pausedAt) state.pausedAt = Date.now();
}

function resumeTimer() {
  if (state.pausedAt) {
    state.totalPausedMs += Date.now() - state.pausedAt;
    state.pausedAt = null;
  }
}

// =====================================================
// TIMER DE JOGO
// =====================================================

let timerInterval = null;

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const el = document.getElementById('time-display');
    if (el) el.textContent = formatTime(getElapsedSeconds());
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// =====================================================
// LOCALSTROAGE – RANKING
// =====================================================

const LS_KEY = 'copa2026_ranking';

function loadRanking() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveRanking(ranking) {
  localStorage.setItem(LS_KEY, JSON.stringify(ranking));
}

function updateRanking() {
  const ranking = loadRanking();
  const pct = state.totalSpins > 0 ? Math.round(state.correct / state.totalSpins * 100) : 0;

  const idx = ranking.findIndex(r => r.name.toLowerCase() === state.playerName.toLowerCase());

  if (idx >= 0) {
    const r = ranking[idx];
    const elapsed = getElapsedSeconds();
    r.totalGames  += 1;
    r.totalCorrect += state.correct;
    r.totalWrong   += state.wrong;
    r.bestStreak   = Math.max(r.bestStreak, state.bestStreak);
    r.bestPct      = Math.max(r.bestPct, pct);
    r.lastPlayed   = Date.now();
    if (!r.bestTime || elapsed < r.bestTime) r.bestTime = elapsed;
  } else {
    ranking.push({
      name:         state.playerName,
      totalGames:   1,
      totalCorrect: state.correct,
      totalWrong:   state.wrong,
      bestStreak:   state.bestStreak,
      bestPct:      pct,
      lastPlayed:   Date.now(),
      bestTime:     getElapsedSeconds(),
    });
  }

  ranking.sort((a, b) => b.totalCorrect - a.totalCorrect || (a.bestTime || Infinity) - (b.bestTime || Infinity));
  saveRanking(ranking);
}

// =====================================================
// CONSTRUÇÃO DA FAIXA DA ROLETA
// =====================================================

function buildStrip() {
  stripOrderBase = shuffle(TEAMS);
  stripOrder = [];
  for (let i = 0; i < NUM_COPIES; i++) stripOrder.push(...stripOrderBase);

  const track = document.getElementById('roulette-track');
  track.innerHTML = '';

  track.style.width = (TOTAL_ITEMS * ITEM_W) + 'px';
  track.style.minWidth = (TOTAL_ITEMS * ITEM_W) + 'px';

  stripOrder.forEach((team) => {
    const item = document.createElement('div');
    item.className = 'flag-item';
    item.dataset.teamId = team.id;
    const img = document.createElement('img');
    img.src = getFlagUrl(team.code);
    img.alt = team.name;
    img.loading = 'lazy';
    item.appendChild(img);
    track.appendChild(item);
  });

  const containerW = getContainerWidth();
  const startCopy = 2;
  currentOffset = startCopy * COPY_SIZE * ITEM_W - containerW / 2 + ITEM_W / 2;
  setTrackOffset(currentOffset);
}

function getContainerWidth() {
  return document.getElementById('roulette-container').offsetWidth;
}

function setTrackOffset(offset) {
  document.getElementById('roulette-track').style.transform = `translateX(${-offset}px)`;
}

// =====================================================
// ANIMAÇÃO IDLE
// =====================================================

function startIdle() {
  cancelAnimationFrame(animFrameId);
  state.spinning = false;

  const IDLE_SPEED  = 0.6;
  const WRAP_AT     = 6 * COPY_SIZE * ITEM_W;
  const WRAP_JUMP   = 3 * COPY_SIZE * ITEM_W;

  function frame() {
    currentOffset += IDLE_SPEED;
    if (currentOffset > WRAP_AT) currentOffset -= WRAP_JUMP;
    setTrackOffset(currentOffset);
    animFrameId = requestAnimationFrame(frame);
  }

  animFrameId = requestAnimationFrame(frame);
}

// =====================================================
// EASING
// =====================================================

function slotEasing(t) {
  if (t < 0.15) {
    const p = t / 0.15;
    return p * p * 0.18;
  } else if (t < 0.55) {
    const p = (t - 0.15) / 0.40;
    return 0.18 + p * 0.45;
  } else {
    const p = (t - 0.55) / 0.45;
    return 0.63 + (1 - Math.pow(1 - p, 3)) * 0.37;
  }
}

// =====================================================
// SORTEIO E SPIN
// =====================================================

function calcOffset(teamId, copyIndex) {
  const posInBase = stripOrderBase.findIndex(t => t.id === teamId);
  const stripIdx  = copyIndex * COPY_SIZE + posInBase;
  const containerW = getContainerWidth();
  return stripIdx * ITEM_W - containerW / 2 + ITEM_W / 2;
}

function findTargetOffset(team) {
  const MIN_ADVANCE = 4 * COPY_SIZE * ITEM_W;

  for (let copy = 0; copy < NUM_COPIES; copy++) {
    const offset = calcOffset(team.id, copy);
    if (offset > currentOffset + MIN_ADVANCE) {
      return offset;
    }
  }
  return calcOffset(team.id, NUM_COPIES - 1);
}

function highlightWinner(teamId) {
  document.querySelectorAll('.flag-item').forEach(el => {
    el.classList.remove('winner');
  });
  const containerW = getContainerWidth();
  const centerAbsolute = currentOffset + containerW / 2;

  const items = document.querySelectorAll('.flag-item');
  let closest = null;
  let closestDist = Infinity;

  items.forEach((el, idx) => {
    if (parseInt(el.dataset.teamId) !== teamId) return;
    const itemCenter = idx * ITEM_W + ITEM_W / 2;
    const dist = Math.abs(itemCenter - centerAbsolute);
    if (dist < closestDist) { closestDist = dist; closest = el; }
  });

  if (closest) closest.classList.add('winner');
}

function doSpin() {
  if (state.spinning) return;
  if (state.remaining.length === 0) { showGameOver(); return; }

  document.querySelectorAll('.flag-item.winner').forEach(el => el.classList.remove('winner'));
  hideResultControls();

  const winner = state.remaining[Math.floor(Math.random() * state.remaining.length)];
  state.currentWinner = winner;
  state.totalSpins++;
  state.spinning = true;

  cancelAnimationFrame(animFrameId);
  hideResultControls();
  startSpinSound();
  vibrate([50, 30, 50]);

  setSpinButtonEnabled(false);

  const startOffset = currentOffset;
  const targetOffset = findTargetOffset(winner);
  const totalDelta = targetOffset - startOffset;
  const DURATION = 500;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / DURATION, 1);
    const eased = slotEasing(t);

    currentOffset = startOffset + eased * totalDelta;
    setTrackOffset(currentOffset);

    if (t < 1) {
      animFrameId = requestAnimationFrame(frame);
    } else {
      currentOffset = targetOffset;
      setTrackOffset(currentOffset);
      onSpinComplete(winner);
    }
  }

  animFrameId = requestAnimationFrame(frame);
}

function onSpinComplete(winner) {
  stopSpinSound();
  playStopSound();
  vibrate([100]);

  state.spinning = false;
  state.revealed  = false;
  state.answered  = false;

  state.remaining = state.remaining.filter(t => t.id !== winner.id);
  state.drawn.push(winner);

  highlightWinner(winner.id);
  updateInfoBar();
  setSpinButtonEnabled(true);
  showResultControls();
  if (!state.startTime) {
    state.startTime = Date.now();
    state.pausedAt = null;
    startTimer();
  } else {
    resumeTimer();
  }
  startIdle();
}

// =====================================================
// CONTROLES DE INTERFACE
// =====================================================

function setSpinButtonEnabled(enabled) {
  document.getElementById('btn-spin').disabled = !enabled;
}

function hideResultControls() {
  document.getElementById('result-controls').classList.add('hidden');
  document.getElementById('game-controls').classList.remove('hidden');
  document.getElementById('btn-spin-again').classList.add('hidden');
}

function showResultControls() {
  document.getElementById('game-controls').classList.add('hidden');
  document.getElementById('result-controls').classList.remove('hidden');

  const winner = state.currentWinner;
  document.getElementById('spotlight-flag-img').src = getFlagUrl(winner.code);
  document.getElementById('spotlight-flag-img').alt = winner.name;
  document.getElementById('spotlight-badge').textContent = `Sorteio #${state.drawn.length}`;
  document.getElementById('spotlight-remaining').textContent =
    `${state.remaining.length} ${state.remaining.length === 1 ? 'restante' : 'restantes'}`;

  document.getElementById('country-name-blur').classList.remove('hidden');
  document.getElementById('country-name-reveal').classList.add('hidden');
  document.getElementById('country-name-reveal').textContent = '';

  const btnReveal = document.getElementById('btn-reveal');
  btnReveal.textContent = 'Mostrar nome da bandeira';
  btnReveal.classList.remove('revealed', 'btn-spin-inline');
  btnReveal.disabled = false;
  btnReveal.onclick = null;

  document.getElementById('btn-correct').disabled = true;
  document.getElementById('btn-wrong').disabled   = true;

  const spinAgainBtn = document.getElementById('btn-spin-again');
  spinAgainBtn.disabled = true;
  spinAgainBtn.classList.add('hidden');

  const fb = document.getElementById('answer-feedback');
  fb.className = 'answer-feedback-inline hidden';
  fb.textContent = '';
}

function updateInfoBar() {
  document.getElementById('remaining-count').textContent = state.remaining.length;
  document.getElementById('drawn-count').textContent     = state.drawn.length;
  document.getElementById('streak-display').textContent  = `🔥 ${state.streak}`;
  document.getElementById('display-score').textContent =
    `✅ ${state.correct} \u00a0|\u00a0 ❌ ${state.wrong}`;
}

function prepareNewSpin() {
  hideResultControls();
  document.querySelectorAll('.flag-item.winner').forEach(el => el.classList.remove('winner'));
  setSpinButtonEnabled(true);
}

// =====================================================
// TELA DE GAME OVER
// =====================================================

function showGameOver() {
  stopTimer();
  updateRanking();

  const totalSpins = state.drawn.length;
  const pct = totalSpins > 0 ? Math.round(state.correct / totalSpins * 100) : 0;

  document.getElementById('gameover-player-name').textContent =
    `Parabéns, ${state.playerName}! Você sorteou todos os 48 países!`;

  document.getElementById('gameover-stats').innerHTML = `
    <div class="gameover-stat">
      <div class="gameover-stat-value" style="color:#4dce7a">${state.correct}</div>
      <div class="gameover-stat-label">Acertos</div>
    </div>
    <div class="gameover-stat">
      <div class="gameover-stat-value" style="color:#ff6b6b">${state.wrong}</div>
      <div class="gameover-stat-label">Erros</div>
    </div>
  `;

  openModal('modal-gameover');
  launchConfetti();
  playCorrectSound();
}

// =====================================================
// MODAIS
// =====================================================

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function renderStats() {
  const elapsed = getElapsedSeconds();
  const pct = state.totalSpins > 0 ? Math.round(state.correct / state.totalSpins * 100) : 0;

  document.getElementById('stats-body').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card full-width">
        <div class="stat-label">Jogador</div>
        <div class="stat-value highlight">${state.playerName}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total de sorteios</div>
        <div class="stat-value">${state.totalSpins}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Países restantes</div>
        <div class="stat-value">${state.remaining.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Acertos</div>
        <div class="stat-value green">${state.correct}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Erros</div>
        <div class="stat-value red">${state.wrong}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sequência atual</div>
        <div class="stat-value">${state.streak} 🔥</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Países sorteados</div>
        <div class="stat-value">${state.drawn.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tempo de jogo</div>
        <div class="stat-value">${formatTime(elapsed)}</div>
      </div>
      <div class="stat-card full-width">
        <div class="stat-label">Partida iniciada em</div>
        <div class="stat-value" style="font-size:15px">${state.startTime ? formatDate(state.startTime) : 'Ainda não iniciada'}</div>
      </div>
    </div>
  `;
}

// =====================================================
// EXPORTAR PDF DO RANKING
// =====================================================

function exportRankingPDF() {
  // Pede o nome do arquivo antes de gerar
  let fileName = prompt('Nome do arquivo PDF:', 'ranking-copa2026');
  if (fileName === null) return; // usuário cancelou
  fileName = fileName.trim() || 'ranking-copa2026';
  if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ranking = loadRanking();

  const GREEN  = [0, 156, 59];
  const YELLOW = [255, 223, 0];
  const DARK   = [20, 20, 40];
  const WHITE  = [255, 255, 255];
  const LIGHT  = [240, 240, 248];

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // Cabeçalho
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setFillColor(...YELLOW);
  doc.rect(0, 30, pageW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('Copa do Mundo 2026', pageW / 2, 13, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Jogo das Bandeiras — Ranking Oficial', pageW / 2, 22, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, 28, { align: 'center' });

  let y = 42;

  if (ranking.length === 0) {
    doc.setTextColor(...DARK);
    doc.setFontSize(12);
    doc.text('Nenhum jogador no ranking ainda.', pageW / 2, y, { align: 'center' });
    doc.save(fileName);
    return;
  }

  const posLabels = ['#1', '#2', '#3'];
  const accentColors = [
    [255, 215, 0],
    [192, 192, 192],
    [205, 127, 50],
  ];

  ranking.forEach((r, i) => {
    if (y + 42 > pageH - 14) {
      doc.addPage();
      y = 16;
    }

    const acertos = r.totalCorrect || 0;
    const erros   = r.totalWrong  || 0;
    const total   = acertos + erros;
    const pct     = total > 0 ? Math.round(acertos / total * 100) : 0;
    const tempo   = r.bestTime ? formatTime(r.bestTime) : '—';
    const pos     = posLabels[i] || `#${i + 1}`;
    const accent  = accentColors[i] || GREEN;

    doc.setFillColor(...(i % 2 === 0 ? LIGHT : WHITE));
    doc.roundedRect(margin, y, contentW, 36, 3, 3, 'F');

    doc.setFillColor(...accent);
    doc.rect(margin, y, 4, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...accent);
    doc.text(pos, margin + 10, y + 13, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(r.name, margin + 18, y + 9);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin + 18, y + 12, margin + contentW - 4, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 100);
    doc.text('Classificação:', margin + 18, y + 19);
    doc.text('Tempo:', margin + 18, y + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`${i + 1}º lugar`, margin + 46, y + 19);
    doc.text(tempo, margin + 46, y + 26);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 100);
    doc.text('Aproveitamento:', margin + 95, y + 19);
    doc.text('Partidas:', margin + 95, y + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`${pct}%  (${acertos}/${total} acertos)`, margin + 126, y + 19);
    doc.text(`${r.totalGames}`, margin + 126, y + 26);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 100);
    doc.text('Melhor sequência:', margin + 18, y + 33);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`${r.bestStreak || 0}`, margin + 60, y + 33);

    y += 42;
  });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Copa do Mundo 2026 – Jogo das Bandeiras', pageW / 2, pageH - 6, { align: 'center' });

  doc.save(fileName);
}

// =====================================================
// RANKING
// =====================================================

function renderRanking() {
  document.getElementById('ranking-modal-title').textContent = '🏅 Ranking';
  const ranking = loadRanking();

  if (ranking.length === 0) {
    document.getElementById('ranking-body').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏅</div>
        <p>Nenhum jogador no ranking ainda.</p>
        <p>Complete uma partida para aparecer aqui!</p>
      </div>
    `;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  const items = ranking.map((r, i) => {
    const medal = medals[i] || `#${i + 1}`;
    const acertos = r.totalCorrect || 0;
    const erros   = r.totalWrong  || 0;
    const total   = acertos + erros;
    return `
      <div class="player-list-item" data-player-index="${i}">
        <span class="pli-medal">${medal}</span>
        <div class="pli-info">
          <span class="pli-name">${r.name}</span>
          <span class="pli-sub">${r.totalGames} partida${r.totalGames !== 1 ? 's' : ''} · ${acertos}/${total} acertos</span>
        </div>
        <span class="pli-arrow">›</span>
      </div>
    `;
  }).join('');

  document.getElementById('ranking-body').innerHTML = `
    <div class="ranking-export-bar">
      <button class="btn-export-pdf" id="btn-export-pdf">📄 Exportar PDF</button>
    </div>
    <div class="player-list">${items}</div>
  `;

  document.getElementById('btn-export-pdf').addEventListener('click', exportRankingPDF);

  document.querySelectorAll('.player-list-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.playerIndex);
      renderPlayerDetail(ranking[idx], idx);
    });
  });
}

function renderPlayerDetail(player, rankIndex) {
  const medals = ['🥇', '🥈', '🥉'];
  const medal  = medals[rankIndex] || `#${rankIndex + 1}`;
  const acertos = player.totalCorrect || 0;
  const erros   = player.totalWrong   || 0;
  const total   = acertos + erros;
  const pct     = total > 0 ? Math.round(acertos / total * 100) : 0;

  document.getElementById('ranking-modal-title').textContent = '📊 Perfil';

  document.getElementById('ranking-body').innerHTML = `
    <div class="player-detail">
      <button class="btn-back-ranking">← Voltar ao Ranking</button>
      <div class="player-detail-header">
        <div class="player-detail-medal">${medal}</div>
        <div class="player-detail-name">${player.name}</div>
      </div>
      <div class="player-detail-grid">
        <div class="pd-card">
          <div class="pd-value" style="color:#FFDF00">${player.totalGames}</div>
          <div class="pd-label">Partidas</div>
        </div>
        <div class="pd-card">
          <div class="pd-value" style="color:#4dce7a">${acertos}</div>
          <div class="pd-label">Acertos</div>
        </div>
        <div class="pd-card">
          <div class="pd-value" style="color:#ff6b6b">${erros}</div>
          <div class="pd-label">Erros</div>
        </div>
        <div class="pd-card">
          <div class="pd-value" style="color:#a29bfe">${pct}%</div>
          <div class="pd-label">Aproveitamento</div>
        </div>
        <div class="pd-card pd-card-full">
          <div class="pd-value" style="color:#74b9ff">${player.bestTime ? formatTime(player.bestTime) : '—'}</div>
          <div class="pd-label">Melhor tempo</div>
        </div>
      </div>
    </div>
  `;

  document.querySelector('.btn-back-ranking').addEventListener('click', renderRanking);
}

function renderHistory() {
  if (state.history.length === 0) {
    document.getElementById('history-body').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <p>Nenhum sorteio realizado ainda.</p>
      </div>
    `;
    return;
  }

  const items = [...state.history].reverse().map((h, i) => `
    <div class="history-item">
      <span class="history-num">#${state.history.length - i}</span>
      <img class="history-flag" src="${getFlagUrl(h.team.code)}" alt="${h.team.name}" />
      <div class="history-info">
        <div class="history-country">${h.team.name}</div>
        <div class="history-time">${h.time}</div>
      </div>
      <span class="history-result">${h.result === 'correct' ? '✅' : h.result === 'wrong' ? '❌' : '⏭️'}</span>
    </div>
  `).join('');

  document.getElementById('history-body').innerHTML = `<div class="history-list">${items}</div>`;
}

// =====================================================
// MODAL: ERROU – Estatísticas + Ranking COMPLETO
// =====================================================

function renderWrongModal() {
  const pct = state.totalSpins > 0 ? Math.round(state.correct / state.totalSpins * 100) : 0;
  const elapsed = getElapsedSeconds();
  const ranking = loadRanking();

  const currentEntry = {
    name:         state.playerName,
    bestPct:      pct,
    totalCorrect: state.correct,
    totalWrong:   state.wrong,
    bestStreak:   state.bestStreak,
    isCurrent:    true,
  };

  const others = ranking.filter(r => r.name.toLowerCase() !== state.playerName.toLowerCase());
  const combined = [...others, currentEntry]
    .sort((a, b) => b.bestPct - a.bestPct || b.totalCorrect - a.totalCorrect);

  const medals = ['🥇', '🥈', '🥉'];

  // Exibe TODOS os jogadores do ranking completo
  const rows = combined.map((r, globalIdx) => {
    const isCurrent = !!r.isCurrent;
    const medal = medals[globalIdx] || `#${globalIdx + 1}`;
    const pctW = Math.max(4, r.bestPct);
    return `
      <tr class="${isCurrent ? 'current-player' : ''}">
        <td>${isCurrent ? '➤' : medal}</td>
        <td>${r.name}${isCurrent ? ' (você)' : ''}</td>
        <td>
          ${r.bestPct}%
          <span class="pct-bar-wrap"><span class="pct-bar" style="width:${pctW}%"></span></span>
        </td>
        <td style="color:#4dce7a">${r.totalCorrect}</td>
        <td style="color:#ff6b6b">${r.totalWrong || 0}</td>
      </tr>
    `;
  }).join('');

  const rankingHtml = combined.length <= 1
    ? `<p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;padding:12px 0">
         Complete mais partidas para ver a comparação com outros jogadores.
       </p>`
    : `<table class="wrong-ranking-table">
        <thead>
          <tr><th>#</th><th>Jogador</th><th>Melhor %</th><th>Acertos</th><th>Erros</th></tr>
        </thead>
        <tbody>${rows}</tbody>
       </table>`;

  document.getElementById('wrong-body').innerHTML = `
    <p class="wrong-section-title">Sua partida até agora</p>
    <div class="wrong-stats-row">
      <div class="wrong-stat">
        <div class="wrong-stat-value" style="color:#4dce7a">${state.correct}</div>
        <div class="wrong-stat-label">Acertos</div>
      </div>
      <div class="wrong-stat">
        <div class="wrong-stat-value" style="color:#ff6b6b">${state.wrong}</div>
        <div class="wrong-stat-label">Erros</div>
      </div>
    </div>
    <div class="wrong-stats-row">
      <div class="wrong-stat">
        <div class="wrong-stat-value">${state.remaining.length}</div>
        <div class="wrong-stat-label">Países restantes</div>
      </div>
      <div class="wrong-stat">
        <div class="wrong-stat-value">${formatTime(elapsed)}</div>
        <div class="wrong-stat-label">Tempo de jogo</div>
      </div>
      <div class="wrong-stat">
        <div class="wrong-stat-value">${state.totalSpins}</div>
        <div class="wrong-stat-label">Sorteios</div>
      </div>
    </div>
    <p class="wrong-section-title">Comparação com outros jogadores</p>
    ${rankingHtml}
  `;
}

// =====================================================
// INÍCIO DO JOGO
// =====================================================

function startGame(name) {
  state.playerName  = name.trim();
  state.remaining   = [...TEAMS];
  state.drawn       = [];
  state.history     = [];
  state.correct     = 0;
  state.wrong       = 0;
  state.streak      = 0;
  state.bestStreak  = 0;
  state.totalSpins  = 0;
  state.currentWinner = null;
  state.revealed      = false;
  state.answered      = false;
  state.startTime     = null;
  state.pausedAt      = null;
  state.totalPausedMs = 0;

  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');

  document.getElementById('display-name').textContent = state.playerName;

  updateInfoBar();
  buildStrip();
  startIdle();
  setSpinButtonEnabled(true);
  hideResultControls();
}

function returnToWelcome() {
  cancelAnimationFrame(animFrameId);
  stopTimer();
  stopSpinSound();

  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-welcome').classList.add('active');

  ['modal-ranking', 'modal-history', 'modal-gameover', 'modal-wrong'].forEach(closeModal);
}

// =====================================================
// EVENT LISTENERS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

  const inputName = document.getElementById('player-name');
  const btnStart  = document.getElementById('btn-start');

  inputName.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnStart.click();
  });

  btnStart.addEventListener('click', () => {
    const name = inputName.value.trim();
    if (!name) {
      inputName.style.borderColor = '#e74c3c';
      inputName.focus();
      setTimeout(() => inputName.style.borderColor = '', 1500);
      return;
    }

    const ranking = loadRanking();
    const exists  = ranking.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      inputName.style.borderColor = '#e74c3c';
      const errEl = document.getElementById('name-error');
      errEl.textContent = `❌ O nome "${name}" já existe no ranking. Escolha um nome diferente.`;
      errEl.classList.remove('hidden');
      inputName.select();
      setTimeout(() => {
        inputName.style.borderColor = '';
        errEl.classList.add('hidden');
      }, 3000);
      return;
    }

    startGame(name);
  });

  document.getElementById('btn-ranking-welcome').addEventListener('click', () => {
    renderRanking();
    openModal('modal-ranking');
  });

  document.getElementById('btn-sound').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const btn = document.getElementById('btn-sound');
    btn.textContent = state.soundEnabled ? '🔊' : '🔇';
    btn.classList.toggle('muted', !state.soundEnabled);
  });

  document.getElementById('btn-spin').addEventListener('click', () => {
    if (state.remaining.length === 0) { showGameOver(); return; }
    doSpin();
  });

  document.getElementById('btn-reveal').addEventListener('click', () => {
    if (state.revealed) return;
    state.revealed = true;
    pauseTimer();

    document.getElementById('country-name-blur').classList.add('hidden');
    const reveal = document.getElementById('country-name-reveal');
    reveal.textContent = state.currentWinner.name.toUpperCase();
    reveal.classList.remove('hidden');

    const btnReveal = document.getElementById('btn-reveal');
    btnReveal.textContent = '✅ Nome revelado';
    btnReveal.classList.add('revealed');
    btnReveal.disabled = true;

    document.getElementById('btn-correct').disabled = false;
    document.getElementById('btn-wrong').disabled   = false;
  });

  document.getElementById('btn-correct').addEventListener('click', () => {
    if (!state.revealed || state.answered) return;
    state.answered = true;
    state.correct++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);

    state.history.push({
      team:   state.currentWinner,
      result: 'correct',
      time:   new Date().toLocaleTimeString('pt-BR'),
    });

    updateInfoBar();
    playCorrectSound();
    vibrate([50, 30, 100]);
    launchConfetti();

    document.getElementById('btn-correct').disabled = true;
    document.getElementById('btn-wrong').disabled   = true;
    const fb = document.getElementById('answer-feedback');
    fb.textContent = '✅ Acerto registrado!';
    fb.className = 'answer-feedback-inline is-correct';

    if (state.remaining.length === 0) {
      setTimeout(() => showGameOver(), 600);
    } else {
      const btnReveal = document.getElementById('btn-reveal');
      btnReveal.textContent = '🎰 Girar novamente';
      btnReveal.classList.remove('revealed');
      btnReveal.classList.add('btn-spin-inline');
      btnReveal.disabled = false;
      btnReveal.onclick = () => doSpin();
    }
  });

  document.getElementById('btn-wrong').addEventListener('click', () => {
    if (!state.revealed || state.answered) return;
    state.answered = true;
    state.wrong++;
    state.streak = 0;

    state.history.push({
      team:   state.currentWinner,
      result: 'wrong',
      time:   new Date().toLocaleTimeString('pt-BR'),
    });

    updateInfoBar();
    playWrongSound();
    vibrate([200]);

    document.getElementById('btn-correct').disabled = true;
    document.getElementById('btn-wrong').disabled   = true;
    const fb = document.getElementById('answer-feedback');
    fb.textContent = '❌ Erro registrado!';
    fb.className = 'answer-feedback-inline is-wrong';

    setTimeout(() => { renderWrongModal(); openModal('modal-wrong'); }, 450);
  });

  document.getElementById('btn-spin-again').addEventListener('click', () => {
    doSpin();
  });

  document.getElementById('btn-wrong-close').addEventListener('click', () => {
    closeModal('modal-wrong');
    if (state.playerName) updateRanking();
    returnToWelcome();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('⚠️ Tem certeza? Isso apagará TODO o ranking e dados de TODOS os jogadores permanentemente!')) {
      localStorage.removeItem(LS_KEY);
      alert('✅ Dados resetados com sucesso!');
    }
  });

  document.addEventListener('click', e => {
    const closeTarget = e.target.dataset.close;
    if (closeTarget) closeModal(closeTarget);
  });

  document.getElementById('btn-play-again').addEventListener('click', () => {
    closeModal('modal-gameover');
    returnToWelcome();
  });

  document.getElementById('btn-gameover-ranking').addEventListener('click', () => {
    closeModal('modal-gameover');
    renderRanking();
    openModal('modal-ranking');
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('screen-game').classList.contains('active')) {
        setTrackOffset(currentOffset);
      }
    }, 200);
  });

}); // fim DOMContentLoaded
