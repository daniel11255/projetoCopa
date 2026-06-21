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
  // Anfitriões (CONCACAF)
  { id: 1,  name: 'Estados Unidos',    code: 'us' },
  { id: 2,  name: 'Canadá',            code: 'ca' },
  { id: 3,  name: 'México',            code: 'mx' },
  // CONMEBOL
  { id: 4,  name: 'Brasil',            code: 'br' },
  { id: 5,  name: 'Argentina',         code: 'ar' },
  { id: 6,  name: 'Colômbia',          code: 'co' },
  { id: 7,  name: 'Uruguai',           code: 'uy' },
  { id: 8,  name: 'Equador',           code: 'ec' },
  { id: 9,  name: 'Venezuela',         code: 've' },
  // UEFA
  { id: 10, name: 'Alemanha',          code: 'de' },
  { id: 11, name: 'França',            code: 'fr' },
  { id: 12, name: 'Espanha',           code: 'es' },
  { id: 13, name: 'Inglaterra',        code: 'gb-eng' },
  { id: 14, name: 'Portugal',          code: 'pt' },
  { id: 15, name: 'Holanda',           code: 'nl' },
  { id: 16, name: 'Itália',            code: 'it' },
  { id: 17, name: 'Bélgica',           code: 'be' },
  { id: 18, name: 'Áustria',           code: 'at' },
  { id: 19, name: 'Suíça',             code: 'ch' },
  { id: 20, name: 'Croácia',           code: 'hr' },
  { id: 21, name: 'Sérvia',            code: 'rs' },
  { id: 22, name: 'Escócia',           code: 'gb-sct' },
  { id: 23, name: 'Dinamarca',         code: 'dk' },
  { id: 24, name: 'Turquia',           code: 'tr' },
  { id: 25, name: 'Hungria',           code: 'hu' },
  { id: 26, name: 'Eslováquia',        code: 'sk' },
  // CAF (África)
  { id: 27, name: 'Marrocos',          code: 'ma' },
  { id: 28, name: 'Senegal',           code: 'sn' },
  { id: 29, name: 'Egito',             code: 'eg' },
  { id: 30, name: 'Nigéria',           code: 'ng' },
  { id: 31, name: 'África do Sul',     code: 'za' },
  { id: 32, name: 'R.D. Congo',        code: 'cd' },
  { id: 33, name: 'Argélia',           code: 'dz' },
  { id: 34, name: 'Tunísia',           code: 'tn' },
  { id: 35, name: 'Gana',              code: 'gh' },
  // AFC (Ásia)
  { id: 36, name: 'Japão',             code: 'jp' },
  { id: 37, name: 'Coreia do Sul',     code: 'kr' },
  { id: 38, name: 'Irã',               code: 'ir' },
  { id: 39, name: 'Austrália',         code: 'au' },
  { id: 40, name: 'Arábia Saudita',    code: 'sa' },
  { id: 41, name: 'Jordânia',          code: 'jo' },
  { id: 42, name: 'Emirados Árabes',   code: 'ae' },
  { id: 43, name: 'Uzbequistão',       code: 'uz' },
  // CONCACAF (restante)
  { id: 44, name: 'Jamaica',           code: 'jm' },
  { id: 45, name: 'Panamá',            code: 'pa' },
  { id: 46, name: 'Honduras',          code: 'hn' },
  // OFC
  { id: 47, name: 'Nova Zelândia',     code: 'nz' },
  // Playoff intercontinental
  { id: 48, name: 'Paraguai',          code: 'py' },
];

// =====================================================
// CONFIGURAÇÃO DA ROLETA
// =====================================================

const ITEM_W     = 150;   // largura total de cada item (px) – igual a --item-w do CSS + margens
const NUM_COPIES = 12;    // cópias do array base na faixa
const COPY_SIZE  = TEAMS.length; // 48
const TOTAL_ITEMS = NUM_COPIES * COPY_SIZE; // 576

// =====================================================
// ESTADO DO JOGO
// =====================================================

const state = {
  playerName:    '',
  remaining:     [],       // seleções ainda não sorteadas
  drawn:         [],       // seleções já sorteadas
  history:       [],       // histórico de sorteios desta sessão
  correct:       0,
  wrong:         0,
  streak:        0,
  bestStreak:    0,
  totalSpins:    0,
  currentWinner: null,
  startTime:      null,  // definido no PRIMEIRO spin (não ao iniciar o jogo)
  pausedAt:       null,  // instante em que o timer foi pausado
  totalPausedMs:  0,     // total de ms pausados
  soundEnabled:   true,
  spinning:       false,
  revealed:       false,
  answered:       false,
};

// =====================================================
// ESTADO DA ROLETA
// =====================================================

let stripOrderBase = [];  // ordem base embaralhada dos times
let stripOrder = [];       // faixa completa (NUM_COPIES vezes a base)
let currentOffset = 0;    // deslocamento atual da faixa (px)
let animFrameId = null;   // ID do requestAnimationFrame

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

/** Toca um tom simples */
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
  } catch (e) { /* silencia erros de áudio */ }
}

/** Som de tick acelerado durante o giro */
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

/** Som ao parar */
function playStopSound() {
  playTone(880, 0.25);
  setTimeout(() => playTone(1100, 0.35), 150);
  setTimeout(() => playTone(1320, 0.5), 300);
}

/** Som de acerto */
function playCorrectSound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 110));
}

/** Som de erro */
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
// VIBRAÇÃO (dispositivos móveis)
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

/** Atualiza ou insere o jogador no ranking */
function updateRanking() {
  const ranking = loadRanking();
  const pct = state.totalSpins > 0 ? Math.round(state.correct / state.totalSpins * 100) : 0;

  const idx = ranking.findIndex(r => r.name.toLowerCase() === state.playerName.toLowerCase());

  if (idx >= 0) {
    const r = ranking[idx];
    r.totalGames  += 1;
    r.totalCorrect += state.correct;
    r.totalWrong   += state.wrong;
    r.bestStreak   = Math.max(r.bestStreak, state.bestStreak);
    r.bestPct      = Math.max(r.bestPct, pct);
    r.lastPlayed   = Date.now();
  } else {
    ranking.push({
      name:         state.playerName,
      totalGames:   1,
      totalCorrect: state.correct,
      totalWrong:   state.wrong,
      bestStreak:   state.bestStreak,
      bestPct:      pct,
      lastPlayed:   Date.now(),
    });
  }

  // Ordena por % de acerto (decrescente) e depois por acertos totais
  ranking.sort((a, b) => b.bestPct - a.bestPct || b.totalCorrect - a.totalCorrect);
  saveRanking(ranking);
}

// =====================================================
// CONSTRUÇÃO DA FAIXA DA ROLETA
// =====================================================

/** Embaralha os times e constrói a faixa com NUM_COPIES cópias */
function buildStrip() {
  stripOrderBase = shuffle(TEAMS);
  stripOrder = [];
  for (let i = 0; i < NUM_COPIES; i++) stripOrder.push(...stripOrderBase);

  const track = document.getElementById('roulette-track');
  track.innerHTML = '';

  // Define largura total explícita para evitar quebra de linha no flex
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

  // Posição inicial: centraliza no início da cópia 3 (índice 2 * COPY_SIZE)
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
// ANIMAÇÃO IDLE (rolagem lenta contínua)
// =====================================================

function startIdle() {
  cancelAnimationFrame(animFrameId);
  state.spinning = false;

  const IDLE_SPEED  = 0.6; // px por frame
  // Reset quando ultrapassar a 6ª cópia: volta 3 cópias (posição visual idêntica)
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
// EASING (curva de animação do giro)
// =====================================================

/**
 * Curva de slot machine:
 * 0–15%  → acelera (ease-in)
 * 15–55% → gira rápido (linear)
 * 55–100% → desacelera (ease-out cúbico)
 */
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

/** Calcula o offset que centraliza determinado team em determinada cópia */
function calcOffset(teamId, copyIndex) {
  const posInBase = stripOrderBase.findIndex(t => t.id === teamId);
  const stripIdx  = copyIndex * COPY_SIZE + posInBase;
  const containerW = getContainerWidth();
  return stripIdx * ITEM_W - containerW / 2 + ITEM_W / 2;
}

/** Encontra o offset-alvo, garantindo rotações suficientes */
function findTargetOffset(team) {
  const MIN_ADVANCE = 4 * COPY_SIZE * ITEM_W; // mínimo de 4 voltas

  for (let copy = 0; copy < NUM_COPIES; copy++) {
    const offset = calcOffset(team.id, copy);
    if (offset > currentOffset + MIN_ADVANCE) {
      return offset;
    }
  }
  // Fallback: última cópia disponível
  return calcOffset(team.id, NUM_COPIES - 1);
}

/** Tira o winner da faixa visualmente (destaque) */
function highlightWinner(teamId) {
  document.querySelectorAll('.flag-item').forEach(el => {
    el.classList.remove('winner');
  });
  const containerW = getContainerWidth();
  const centerAbsolute = currentOffset + containerW / 2; // px no strip

  // Encontra o item mais próximo do centro
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

/** Executa o giro da roleta */
function doSpin() {
  if (state.spinning) return;
  if (state.remaining.length === 0) { showGameOver(); return; }

  // Inicia o timer apenas no primeiro giro
  if (!state.startTime) {
    state.startTime = Date.now();
    startTimer();
  } else {
    resumeTimer(); // retoma após pausa
  }

  // Limpa estado visual do sorteio anterior
  document.querySelectorAll('.flag-item.winner').forEach(el => el.classList.remove('winner'));
  hideResultControls();

  // Escolhe o vencedor
  const winner = state.remaining[Math.floor(Math.random() * state.remaining.length)];
  state.currentWinner = winner;
  state.totalSpins++;
  state.spinning = true;

  cancelAnimationFrame(animFrameId);
  hideResultControls();
  startSpinSound();
  vibrate([50, 30, 50]);

  // Botão de girar desativado
  setSpinButtonEnabled(false);

  const startOffset = currentOffset;
  const targetOffset = findTargetOffset(winner);
  const totalDelta = targetOffset - startOffset;
  const DURATION = 5000; // ms
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
      // Roleta parou
      currentOffset = targetOffset;
      setTrackOffset(currentOffset);
      onSpinComplete(winner);
    }
  }

  animFrameId = requestAnimationFrame(frame);
}

/** Chamado quando a roleta para */
function onSpinComplete(winner) {
  stopSpinSound();
  playStopSound();
  vibrate([100]);

  state.spinning = false;
  state.revealed  = false;
  state.answered  = false;

  // Remove o vencedor dos restantes
  state.remaining = state.remaining.filter(t => t.id !== winner.id);
  state.drawn.push(winner);

  highlightWinner(winner.id);
  updateInfoBar();
  showResultControls();
  pauseTimer();    // pausa enquanto jogador decide
  startIdle();     // volta a rolar devagar
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
}

function showResultControls() {
  document.getElementById('game-controls').classList.add('hidden');
  document.getElementById('result-controls').classList.remove('hidden');

  // Atualiza imagem e badges
  const winner = state.currentWinner;
  document.getElementById('spotlight-flag-img').src = getFlagUrl(winner.code);
  document.getElementById('spotlight-flag-img').alt = winner.name;
  document.getElementById('spotlight-badge').textContent = `Sorteio #${state.drawn.length}`;
  document.getElementById('spotlight-remaining').textContent =
    `${state.remaining.length} ${state.remaining.length === 1 ? 'restante' : 'restantes'}`;

  // Reset do nome
  document.getElementById('country-name-blur').classList.remove('hidden');
  document.getElementById('country-name-reveal').classList.add('hidden');
  document.getElementById('country-name-reveal').textContent = '';

  // Reset botão revelar
  const btnReveal = document.getElementById('btn-reveal');
  btnReveal.textContent = 'Mostrar nome da bandeira';
  btnReveal.classList.remove('revealed');
  btnReveal.disabled = false;

  // Acertou/Errou bloqueados até revelar
  document.getElementById('btn-correct').disabled = true;
  document.getElementById('btn-wrong').disabled   = true;

  // Girar novamente bloqueado até responder
  document.getElementById('btn-spin-again').disabled = true;

  // Oculta feedback anterior
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
  // doSpin() já faz a limpeza; esta função fica para uso externo (botão Girar principal)
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
    <div class="gameover-stat">
      <div class="gameover-stat-value" style="color:#FFDF00">${pct}%</div>
      <div class="gameover-stat-label">Aproveit.</div>
    </div>
    <div class="gameover-stat">
      <div class="gameover-stat-value" style="color:#ff9ff3">${state.bestStreak}</div>
      <div class="gameover-stat-label">Melhor seq.</div>
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
        <div class="stat-label">% de acertos</div>
        <div class="stat-value highlight">${pct}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sequência atual</div>
        <div class="stat-value">${state.streak} 🔥</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Melhor sequência</div>
        <div class="stat-value highlight">${state.bestStreak} ⭐</div>
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

function renderRanking() {
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
  const rows = ranking.map((r, i) => `
    <tr>
      <td><span class="rank-medal">${medals[i] || (i + 1)}</span></td>
      <td class="rank-name">${r.name}</td>
      <td>${r.totalGames}</td>
      <td style="color:#4dce7a">${r.totalCorrect}</td>
      <td style="color:#ff6b6b">${r.totalWrong}</td>
      <td><span class="rank-badge">${r.bestPct}%</span></td>
      <td>${r.bestStreak} ⭐</td>
    </tr>
  `).join('');

  document.getElementById('ranking-body').innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jogador</th>
          <th>Partidas</th>
          <th>Acertos</th>
          <th>Erros</th>
          <th>Melhor %</th>
          <th>Seq.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
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
// MODAL: ERROU – Estatísticas + Comparação de Ranking
// =====================================================

function renderWrongModal() {
  const pct = state.totalSpins > 0 ? Math.round(state.correct / state.totalSpins * 100) : 0;
  const elapsed = getElapsedSeconds();
  const ranking = loadRanking();

  // Cria entrada provisória do jogador atual para comparar
  const currentEntry = {
    name:         state.playerName,
    bestPct:      pct,
    totalCorrect: state.correct,
    totalWrong:   state.wrong,
    bestStreak:   state.bestStreak,
    isCurrent:    true,
  };

  // Monta lista de comparação (ranking salvo + jogador atual)
  const others = ranking.filter(r => r.name.toLowerCase() !== state.playerName.toLowerCase());
  const combined = [...others, currentEntry]
    .sort((a, b) => b.bestPct - a.bestPct || b.totalCorrect - a.totalCorrect);

  const currentPos = combined.findIndex(r => r.isCurrent);
  const medals = ['🥇', '🥈', '🥉'];

  // Exibe até 5 jogadores ao redor do atual (2 acima, atual, 2 abaixo)
  const rangeStart = Math.max(0, currentPos - 2);
  const rangeEnd   = Math.min(combined.length, currentPos + 3);
  const slice = combined.slice(rangeStart, rangeEnd);

  const rows = slice.map((r, localIdx) => {
    const globalIdx = rangeStart + localIdx;
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
      <div class="wrong-stat">
        <div class="wrong-stat-value" style="color:#FFDF00">${pct}%</div>
        <div class="wrong-stat-label">Aproveit.</div>
      </div>
      <div class="wrong-stat">
        <div class="wrong-stat-value">${state.bestStreak}⭐</div>
        <div class="wrong-stat-label">Melhor seq.</div>
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
  state.startTime     = null;   // inicia no primeiro giro
  state.pausedAt      = null;
  state.totalPausedMs = 0;

  // Mostra tela de jogo
  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');

  document.getElementById('display-name').textContent = state.playerName;

  updateInfoBar();
  buildStrip();
  startIdle();
  // startTimer() é chamado no primeiro doSpin()
  setSpinButtonEnabled(true);
  hideResultControls();
}

function returnToWelcome() {
  cancelAnimationFrame(animFrameId);
  stopTimer();
  stopSpinSound();

  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-welcome').classList.add('active');

  // Fecha todos os modais
  ['modal-stats', 'modal-ranking', 'modal-history', 'modal-gameover', 'modal-wrong'].forEach(closeModal);
}

// =====================================================
// EVENT LISTENERS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

  // ----- Tela de boas-vindas -----
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

    // Verifica nome duplicado no ranking
    const ranking = loadRanking();
    const exists  = ranking.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      const continuar = confirm(
        `⚠️ O nome "${name}" já existe no ranking.\n\nDeseja continuar jogando como "${name}"?\n(Seus acertos serão somados ao histórico existente)\n\nClique em Cancelar para escolher outro nome.`
      );
      if (!continuar) {
        inputName.select();
        return;
      }
    }

    startGame(name);
  });

  document.getElementById('btn-ranking-welcome').addEventListener('click', () => {
    renderRanking();
    openModal('modal-ranking');
  });

  // ----- Header do jogo -----
  document.getElementById('btn-sound').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const btn = document.getElementById('btn-sound');
    btn.textContent = state.soundEnabled ? '🔊' : '🔇';
    btn.classList.toggle('muted', !state.soundEnabled);
  });

  document.getElementById('btn-stats').addEventListener('click', () => {
    renderStats();
    openModal('modal-stats');
  });

  document.getElementById('btn-history-btn').addEventListener('click', () => {
    renderHistory();
    openModal('modal-history');
  });

  document.getElementById('btn-ranking-game').addEventListener('click', () => {
    renderRanking();
    openModal('modal-ranking');
  });

  // ----- Roleta -----
  document.getElementById('btn-spin').addEventListener('click', () => {
    if (state.remaining.length === 0) { showGameOver(); return; }
    doSpin();
  });

  // ----- Revelar nome da bandeira -----
  document.getElementById('btn-reveal').addEventListener('click', () => {
    if (state.revealed) return;
    state.revealed = true;

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

  // ----- Controles de resultado -----
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
    document.getElementById('btn-spin-again').disabled = false;
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
    document.getElementById('btn-spin-again').disabled = false;

    // Modal com estatísticas + comparativo
    setTimeout(() => { renderWrongModal(); openModal('modal-wrong'); }, 450);
  });

  // Girar novamente – gira direto sem precisar clicar em "Girar"
  document.getElementById('btn-spin-again').addEventListener('click', () => {
    doSpin();
  });

  // Novo jogador (header) – salva ranking antes de sair
  document.getElementById('btn-new-player').addEventListener('click', () => {
    if (confirm('Deseja trocar de jogador? Seu progresso será salvo no ranking.')) {
      if (state.playerName) updateRanking();
      returnToWelcome();
    }
  });

  // "Fechar e continuar" no modal de erro – salva e volta ao menu
  document.getElementById('btn-wrong-close').addEventListener('click', () => {
    closeModal('modal-wrong');
    if (state.playerName) updateRanking();
    returnToWelcome();
  });

  // Resetar todos os dados
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('⚠️ Tem certeza? Isso apagará TODO o ranking e dados de TODOS os jogadores permanentemente!')) {
      localStorage.removeItem(LS_KEY);
      alert('✅ Dados resetados com sucesso!');
    }
  });

  // ----- Botões de fechar modal (overlay e ✕) -----
  document.addEventListener('click', e => {
    const closeTarget = e.target.dataset.close;
    if (closeTarget) closeModal(closeTarget);
  });

  // ----- Fim de jogo -----
  document.getElementById('btn-play-again').addEventListener('click', () => {
    closeModal('modal-gameover');
    returnToWelcome();
  });

  document.getElementById('btn-gameover-ranking').addEventListener('click', () => {
    closeModal('modal-gameover');
    renderRanking();
    openModal('modal-ranking');
  });

  // ----- Ajuste ao redimensionar (atualiza posição) -----
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('screen-game').classList.contains('active')) {
        // Recalcula posição mantendo offset proporcional
        const containerW = getContainerWidth();
        setTrackOffset(currentOffset);
      }
    }, 200);
  });

}); // fim DOMContentLoaded
