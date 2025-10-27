const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const playerLabel = document.getElementById('player-label');
const finalScoreEl = document.getElementById('final-score');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const form = document.getElementById('player-form');
const restartBtn = document.getElementById('restart');
const leaderboardTable = document.querySelector('#leaderboard tbody');

const COLS = 5;
const ROWS = 10;
const BLOCK_SIZE = 30;
const LEVEL_STEP = 600;
const STORAGE_KEY = 'web-tetris-scores';

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(20, 20);

const COLORS = {
    I: '#38bdf8',
    J: '#6366f1',
    L: '#f97316',
    O: '#facc15',
    S: '#34d399',
    T: '#a855f7',
    Z: '#f43f5e'
};

const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

let dropCounter = 0;
let lastTime = 0;
let dropInterval = 500;
let paused = false;
let animationFrameId = null;
let playerName = '';

const arena = createMatrix(COLS, ROWS);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    next: null,
    score: 0,
    lines: 0,
    level: 1
};

function createMatrix(width, height) {
    return Array.from({ length: height }, () => Array(width).fill(0));
}

function createPiece(type) {
    return SHAPES[type].map(row => [...row]);
}

function randomPiece() {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const typedMatrix = createPiece(type).map(row => row.map(cell => (cell ? type : 0)));
    return { type, matrix: typedMatrix };
}

function collide(board, playerState) {
    const [m, o] = [playerState.matrix, playerState.pos];
    for (let y = 0; y < m.length; y += 1) {
        for (let x = 0; x < m[y].length; x += 1) {
            if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, playerState) {
    playerState.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + playerState.pos.y][x + playerState.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < y; x += 1) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function arenaSweep() {
    for (let y = arena.length - 1; y >= 0; y -= 1) {
        if (arena[y].every(value => value !== 0)) {
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            player.score += 100;
            player.lines += 1;
            y += 1;
        }
    }
}

function update(time = 0) {
    if (paused) {
        animationFrameId = requestAnimationFrame(update);
        return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter >= dropInterval) {
        playerDrop();
    }
    draw();
    animationFrameId = requestAnimationFrame(update);
}

function drawMatrix(matrix, offset, ctx = context, cellSize = 1) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, cellSize, cellSize);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#0b1120';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);

    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const offset = {
        x: Math.floor((4 - player.next.matrix[0].length) / 2),
        y: Math.floor((4 - player.next.matrix.length) / 2)
    };
    drawMatrix(player.next.matrix, offset, nextContext, 1);
}

function playerDrop() {
    player.pos.y += 1;
    if (collide(arena, player)) {
        player.pos.y -= 1;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function hardDrop() {
    while (!collide(arena, player)) {
        player.pos.y += 1;
    }
    player.pos.y -= 1;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerReset() {
    if (!player.next) {
        player.next = randomPiece();
    }
    const piece = player.next;
    player.matrix = piece.matrix.map(row => [...row]);
    player.next = randomPiece();

    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.ceil(player.matrix[0].length / 2);

    if (collide(arena, player)) {
        gameOver();
    }
}

function updateScore() {
    const newLevel = 1 + Math.floor(player.score / LEVEL_STEP);
    if (newLevel !== player.level) {
        player.level = newLevel;
        dropInterval = Math.max(120, 1000 - (player.level - 1) * 100);
    }

    scoreEl.textContent = player.score;
    linesEl.textContent = player.lines;
    levelEl.textContent = player.level;
}

function resetGameState() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    dropCounter = 0;
    lastTime = 0;
    paused = false;
    player.next = null;
    updateScore();
}

function startGame(name) {
    playerName = name;
    playerLabel.textContent = name;
    resetGameState();
    playerReset();

    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(update);
}

function togglePause() {
    paused = !paused;
}

function gameOver() {
    cancelAnimationFrame(animationFrameId);
    merge(arena, player);
    draw();
    finalScoreEl.textContent = `Очки: ${player.score}`;
    persistScore();
    renderLeaderboard();
    gameOverScreen.classList.remove('hidden');
}

function persistScore() {
    const payload = {
        name: playerName,
        score: player.score,
        date: new Date().toLocaleDateString()
    };
    const scores = loadScores();
    scores.push(payload);
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function loadScores() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Не удалось загрузить таблицу рекордов', error);
        return [];
    }
}

function renderLeaderboard() {
    const scores = loadScores();
    leaderboardTable.innerHTML = '';
    scores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.date}</td>
        `;
        leaderboardTable.appendChild(row);
    });
}

form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('player-name').toString().trim() || 'Игрок';
    startScreen.classList.add('hidden');
    startGame(name);
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startGame(playerName);
});

document.addEventListener('keydown', event => {
    if (startScreen.classList.contains('hidden') && gameOverScreen.classList.contains('hidden')) {
        switch (event.code) {
            case 'ArrowLeft':
                playerMove(-1);
                break;
            case 'ArrowRight':
                playerMove(1);
                break;
            case 'ArrowDown':
                playerDrop();
                break;
            case 'ArrowUp':
                playerRotate(1);
                break;
            case 'Space':
                hardDrop();
                break;
            case 'KeyP':
                togglePause();
                break;
            default:
                break;
        }
    }
});

renderLeaderboard();
