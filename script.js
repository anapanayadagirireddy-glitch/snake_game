const canvas = document.querySelector('#board');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const highScoreEl = document.querySelector('#high-score');
const overlay = document.querySelector('#overlay');
const title = document.querySelector('#overlay-title');
const copy = document.querySelector('#overlay-text');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const boardFrame = document.querySelector('.board-frame');
const chickAlert = document.createElement('div');
chickAlert.className = 'chick-alert';
chickAlert.innerHTML = '<b>♩</b> Chick spotted!';
boardFrame.append(chickAlert);

const cells = 20, unit = canvas.width / cells;
let snake, frog, chick, direction, queuedDirection, score, timer, chickSpawnTimer, chickMissTimer, growth = 0;
let running = false, paused = false;
let highScore = Number(localStorage.getItem('verdant-high-score') || 0);
highScoreEl.textContent = highScore;
copy.textContent = 'Find the frogs — and catch the rare chick before it hops away.';

function randomSpot() {
  let spot;
  do spot = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
  while (snake.some(part => part.x === spot.x && part.y === spot.y) || (frog && spot.x === frog.x && spot.y === frog.y));
  return spot;
}
function reset() {
  snake = [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }];
  direction = { x: 1, y: 0 }; queuedDirection = direction;
  frog = randomSpot(); chick = null; score = 0; growth = 0;
  scoreEl.textContent = score; draw();
}
function roundedRect(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function drawFrog(x, y) {
  ctx.fillStyle = 'rgba(23,64,43,.13)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 10, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4c8e4e'; ctx.beginPath(); ctx.ellipse(x, y + 2, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 7, y - 5, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 7, y - 5, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eff3d9'; ctx.beginPath(); ctx.arc(x - 7, y - 6, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 7, y - 6, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#18342d'; ctx.beginPath(); ctx.arc(x - 7, y - 6, 1.1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 7, y - 6, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#235f3e'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y + 2, 4, .15, Math.PI - .15); ctx.stroke();
}
function drawChick(x, y) {
  ctx.fillStyle = 'rgba(116,78,18,.16)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 10, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4c957'; ctx.beginPath(); ctx.arc(x, y + 2, 10, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 6, y - 7, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e69b31'; ctx.beginPath(); ctx.moveTo(x + 12, y - 6); ctx.lineTo(x + 18, y - 3); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#553d25'; ctx.beginPath(); ctx.arc(x + 8, y - 9, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d18b29'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 3, y + 11); ctx.lineTo(x - 3, y + 15); ctx.moveTo(x + 3, y + 11); ctx.lineTo(x + 3, y + 15); ctx.stroke();
}
function draw() {
  ctx.clearRect(0, 0, 600, 600); ctx.fillStyle = '#e4ecde'; ctx.fillRect(0, 0, 600, 600); ctx.strokeStyle = 'rgba(47,115,85,.09)'; ctx.lineWidth = 1;
  for (let i = 1; i < cells; i++) { ctx.beginPath(); ctx.moveTo(i * unit, 0); ctx.lineTo(i * unit, 600); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * unit); ctx.lineTo(600, i * unit); ctx.stroke(); }
  drawFrog(frog.x * unit + 15, frog.y * unit + 15);
  if (chick) drawChick(chick.x * unit + 15, chick.y * unit + 15);
  snake.forEach((part, index) => { const gap = index ? 3 : 2; roundedRect(part.x * unit + gap, part.y * unit + gap, unit - gap * 2, unit - gap * 2, index ? 5 : 7, index ? '#c53d42' : '#8b2025'); if (!index) { ctx.fillStyle = '#fff8ed'; const ex = part.x * unit + (direction.x === 1 ? 14 : direction.x === -1 ? 7 : 10), ey = part.y * unit + (direction.y === 1 ? 14 : direction.y === -1 ? 7 : 10); ctx.beginPath(); ctx.arc(ex, ey, 1.7, 0, Math.PI * 2); ctx.fill(); } });
}

function speed() { return score < 6 ? 190 : score < 12 ? 135 : score < 18 ? 100 : 75; }
function startTicker() { clearInterval(timer); timer = setInterval(tick, speed()); }
function scheduleChick() {
  clearTimeout(chickSpawnTimer); clearTimeout(chickMissTimer);
  chickSpawnTimer = setTimeout(showChick, 8000);
}
function showChick() {
  if (!running || paused) return;
  chick = randomSpot(); chickAlert.classList.add('show'); draw();
  chickMissTimer = setTimeout(() => { chick = null; chickAlert.classList.remove('show'); draw(); scheduleChick(); }, 5500);
}
function collectChick() {
  chick = null; growth += 2; clearTimeout(chickMissTimer); chickAlert.classList.remove('show'); scheduleChick();
}
function tick() {
  direction = queuedDirection;
  const head = { x: (snake[0].x + direction.x + cells) % cells, y: (snake[0].y + direction.y + cells) % cells };
  if (snake.slice(0, -1).some(part => part.x === head.x && part.y === head.y)) return endGame();
  snake.unshift(head);
  if (head.x === frog.x && head.y === frog.y) { score++; scoreEl.textContent = score; frog = randomSpot(); growth++; if (score > highScore) { highScore = score; highScoreEl.textContent = highScore; localStorage.setItem('verdant-high-score', highScore); } if (score % 6 === 0) startTicker(); }
  if (chick && head.x === chick.x && head.y === chick.y) collectChick();
  if (growth > 0) growth--; else snake.pop();
  draw();
}
function startGame() { clearInterval(timer); clearTimeout(chickSpawnTimer); clearTimeout(chickMissTimer); reset(); running = true; paused = false; overlay.classList.add('hidden'); pauseButton.textContent = 'Pause'; startTicker(); scheduleChick(); }
function endGame() { clearInterval(timer); clearTimeout(chickSpawnTimer); clearTimeout(chickMissTimer); running = false; chickAlert.classList.remove('show'); title.textContent = 'Your garden rests.'; copy.textContent = `You found ${score} ${score === 1 ? 'frog' : 'frogs'}. A new path is waiting.`; startButton.innerHTML = 'Grow again <span>→</span>'; overlay.classList.remove('hidden'); }
function togglePause() { if (!running) return; paused = !paused; if (paused) { clearInterval(timer); clearTimeout(chickSpawnTimer); clearTimeout(chickMissTimer); pauseButton.textContent = 'Resume'; title.textContent = 'Taking a breath.'; copy.textContent = 'Your garden will wait for you.'; startButton.innerHTML = 'Resume <span>→</span>'; overlay.classList.remove('hidden'); } else { overlay.classList.add('hidden'); startTicker(); pauseButton.textContent = 'Pause'; scheduleChick(); } }
function changeDirection(name) { const moves = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }, next = moves[name]; if (next && next.x !== -direction.x && next.y !== -direction.y) queuedDirection = next; }
startButton.addEventListener('click', () => paused ? togglePause() : startGame()); pauseButton.addEventListener('click', togglePause);
document.addEventListener('keydown', event => { const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }; if (keys[event.key]) { event.preventDefault(); changeDirection(keys[event.key]); } if (event.code === 'Space') { event.preventDefault(); togglePause(); } });
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => changeDirection(button.dataset.direction)));
let touchStart; canvas.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]; }, { passive: true }); canvas.addEventListener('touchend', event => { if (!touchStart) return; const end = event.changedTouches[0], dx = end.clientX - touchStart.clientX, dy = end.clientY - touchStart.clientY; if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) changeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); }, { passive: true });
reset();
