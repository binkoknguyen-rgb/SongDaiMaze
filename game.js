/**
 * TRÒ CHƠI: SÔNG DÀI MAZE
 * File: game.js
 * Cập nhật:
 * 1. Chống kẹt quái vật trong mê cung (Anti-Stuck Watchdog).
 * 2. Cộng đồng mạng hồi sinh sau 5 giây (Hàng đợi hồi sinh).
 * 3. Hiệu ứng đánh trúng phân biệt (Người chơi: Vàng cam rực lửa / Cộng đồng mạng: Bạc trắng).
 * 4. Cục máu hồi 500 HP.
 * 5. Nhạc nền riêng cho trận đánh Boss (assets/boss_bgm.mp3).
 */

// ======================= 1. TÀI NGUYÊN HÌNH ẢNH & ÂM THANH KÉP =======================
const ASSETS = {
    monsterImg: 'assets/monster.jpg',
    bgmPrimary: 'assets/bgm.mp3',
    bgmSecondary: 'bgm.mp3',
    bossBgmPrimary: 'assets/boss_bgm.mp3', // Bạn thêm file boss_bgm.mp3 vào thư mục assets/
    bossBgmSecondary: 'boss_bgm.mp3'
};

const monsterImage = new Image();
monsterImage.src = ASSETS.monsterImg;

// Nhạc nền mê cung
let bgmAudio = new Audio(ASSETS.bgmPrimary);
bgmAudio.loop = true;
bgmAudio.volume = 0.5;
bgmAudio.addEventListener('error', () => {
    if (bgmAudio.src.includes('assets/bgm.mp3')) {
        bgmAudio.src = ASSETS.bgmSecondary;
        bgmAudio.load();
    }
});

// Nhạc nền trận đấu Boss
let bossBgmAudio = new Audio(ASSETS.bossBgmPrimary);
bossBgmAudio.loop = true;
bossBgmAudio.volume = 0.65;
bossBgmAudio.addEventListener('error', () => {
    if (bossBgmAudio.src.includes('assets/boss_bgm.mp3')) {
        bossBgmAudio.src = ASSETS.bossBgmSecondary;
        bossBgmAudio.load();
    }
});

let audioCtx = null;

function initAudioContext() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {}
}

function playBGM() {
    try {
        initAudioContext();
        let p = bgmAudio.play();
        if (p !== undefined) {
            p.catch(() => {
                const unlock = () => {
                    bgmAudio.play().catch(() => {});
                    window.removeEventListener('click', unlock);
                    window.removeEventListener('touchstart', unlock);
                };
                window.addEventListener('click', unlock);
                window.addEventListener('touchstart', unlock);
            });
        }
    } catch (e) {}
}

function playBossBGM() {
    try {
        bgmAudio.pause();
        initAudioContext();
        bossBgmAudio.currentTime = 0;
        bossBgmAudio.play().catch(() => {});
    } catch (e) {}
}

function playSynthSound(type) {
    try {
        if (!audioCtx) return;
        let now = audioCtx.currentTime;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'collect') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'heal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'player_hit') {
            // Âm thanh uy lực khi người chơi đánh trúng
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'ally_hit') {
            // Âm thanh gọn nhẹ khi đồng minh đánh trúng
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'boss_skill') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.15);
            osc.frequency.setValueAtTime(783.99, now + 0.3);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    } catch (e) {}
}

// ======================= 2. THIẾT LẬP CANVAS =======================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth || document.documentElement.clientWidth || 800;
    canvas.height = window.innerHeight || document.documentElement.clientHeight || 600;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ======================= 3. BẢN ĐỒ MÊ CUNG & ĐẤU TRƯỜNG =======================
const TILE_SIZE = 64;   
const COLS = 41;        
const ROWS = 41;        
let maze = [];
let shiftCandidates = [];

const SHIFT_INTERVAL = 18;
let shiftTimer = SHIFT_INTERVAL;
let lastShiftTimestamp = Date.now();
let screenShake = 0;

function generateMaze(cols, rows) {
    let grid = Array.from({ length: rows }, () => Array(cols).fill(1));
    shiftCandidates = [];

    function carve(x, y) {
        grid[y][x] = 0;
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
        for (let [dx, dy] of dirs) {
            let nx = x + dx;
            let ny = y + dy;
            if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
                grid[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }
    carve(1, 1);

    for (let r = 2; r < rows - 2; r++) {
        for (let c = 2; c < cols - 2; c++) {
            if (grid[r][c] === 1 && Math.random() < 0.09) grid[r][c] = 0;
        }
    }

    for (let r = 2; r < rows - 2; r++) {
        for (let c = 2; c < cols - 2; c++) {
            if ((grid[r - 1][c] === 0 && grid[r + 1][c] === 0) || (grid[r][c - 1] === 0 && grid[r][c + 1] === 0)) {
                shiftCandidates.push({ c, r });
            }
        }
    }
    return grid;
}

function collapseMazeToArena() {
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            maze[r][c] = 0;
        }
    }
    teleporters = [];
    screenShake = 35;
}

function getEmptyTiles() {
    let empty = [];
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (maze[r] && maze[r][c] === 0) {
                empty.push({ x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2, c, r });
            }
        }
    }
    return empty;
}

function isPaperOnTile(col, row) {
    return papers.some(p => Math.floor(p.x / TILE_SIZE) === col && Math.floor(p.y / TILE_SIZE) === row);
}

function canReach(startC, startR, targetC, targetR, grid) {
    if (startC === targetC && startR === targetR) return true;
    let queue = [[startC, startR]];
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    visited[startR][startC] = true;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (queue.length > 0) {
        let [currC, currR] = queue.shift();
        if (currC === targetC && currR === targetR) return true;
        for (let [dc, dr] of dirs) {
            let nc = currC + dc;
            let nr = currR + dr;
            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && grid[nr] && grid[nr][nc] === 0 && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.push([nc, nr]);
            }
        }
    }
    return false;
}

function smartMazeShift() {
    screenShake = 18;
    let pCol = Math.floor(player.x / TILE_SIZE);
    let pRow = Math.floor(player.y / TILE_SIZE);
    let mCol = Math.floor(monster.x / TILE_SIZE);
    let mRow = Math.floor(monster.y / TILE_SIZE);

    let shuffled = [...shiftCandidates].sort(() => Math.random() - 0.5);
    let changedCount = 0;

    for (let door of shuffled) {
        if (changedCount >= 10) break;
        let currentVal = maze[door.r][door.c];
        let newVal = currentVal === 0 ? 1 : 0;

        if (newVal === 1) {
            if ((door.c === pCol && door.r === pRow) || (door.c === mCol && door.r === mRow) || isPaperOnTile(door.c, door.r)) {
                continue;
            }
            maze[door.r][door.c] = 1;
            let isPathSafe = canReach(pCol, pRow, mCol, mRow, maze);
            if (isPathSafe) {
                for (let p of papers) {
                    if (!canReach(pCol, pRow, Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE), maze)) {
                        isPathSafe = false;
                        break;
                    }
                }
            }
            if (!isPathSafe) {
                maze[door.r][door.c] = 0;
                continue;
            }
        } else {
            maze[door.r][door.c] = 0;
        }
        changedCount++;
    }

    for (let p of papers) {
        let prCol = Math.floor(p.x / TILE_SIZE);
        let prRow = Math.floor(p.y / TILE_SIZE);
        if (maze[prRow] && maze[prRow][prCol] === 1) {
            maze[prRow][prCol] = 0;
        }
    }
    monster.currentPath = [];
}

// ======================= 4. ĐỐI TƯỢNG VÀ THỰC THỂ GAME =======================
let gameState = 'MAZE';

let player = {
    name: 'Người Chơi',
    color: '#00a8ff',
    x: 120,
    y: 120,
    radius: 16,
    baseSpeed: 5.6,
    speed: 5.6,
    angle: 0,
    hp: 1000,
    maxHp: 1000,
    damage: 100,
    attackCooldown: 0,
    teleportCooldown: 0
};

let monster = {
    name: 'Trường Giang',
    x: 1300,
    y: 1300,
    lastX: 1300,
    lastY: 1300,
    stuckCounter: 0, // Bộ đếm kiểm tra kẹt
    radius: 28,
    baseSpeed: 4.2,
    speed: 4.2,
    visionRange: 550,
    breakDistance: 760,
    angle: 0,
    moveAngle: 0,
    fov: Math.PI * 1.33,
    visionPolygon: [],

    hp: 10000,
    maxHp: 10000,
    damage: 100,
    attackCooldown: 0,
    isShielded: false,
    shieldTimer: 0,

    skill1Cooldown: 300,
    skill2Cooldown: 550,
    skill3Cooldown: 850,

    shockwaveRadius: 0,
    shockwaveActive: false,
    singleStrikeTarget: null,
    singleStrikeTimer: 0,

    isChasing: false,
    patrolTarget: null,
    currentPath: [],
    speechText: '',
    speechTimer: 0
};

// Quản lý Cộng đồng mạng và Hàng đợi hồi sinh 5 giây
let allies = [];
const ALLY_COUNT = 20;
let allyRespawnQueue = []; // Mỗi phần tử là số khung hình đếm lùi (300 frames = 5s)

// Danh sách vật phẩm hồi máu
let medkits = [];
let medkitSpawnTimer = 0;

// Hệ thống hiệu ứng đánh trúng & chữ số sát thương
let hitEffects = [];
let damageTexts = [];

let notification = { text: '', timer: 0 };
let papers = [];
let teleporters = [];
let isGameOver = false;
let isVictory = false;
let isPlaying = false;

// ======================= 5. HỆ THỐNG ĐIỀU KHIỂN =======================
let input = { dx: 0, dy: 0, isMouseDown: false, mouseX: 0, mouseY: 0 };

window.addEventListener('mousedown', (e) => {
    input.isMouseDown = true;
    input.mouseX = e.clientX;
    input.mouseY = e.clientY;
});
window.addEventListener('mousemove', (e) => {
    input.mouseX = e.clientX;
    input.mouseY = e.clientY;
});
window.addEventListener('mouseup', () => { input.isMouseDown = false; });

const joystickZone = document.getElementById('joystick-zone');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
let touchId = null;
let joystickCenter = { x: 0, y: 0 };

if (joystickZone) {
    joystickZone.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        handleJoystick(touch.clientX, touch.clientY);
    });

    joystickZone.addEventListener('touchmove', (e) => {
        for (let t of e.changedTouches) {
            if (t.identifier === touchId) {
                handleJoystick(t.clientX, t.clientY);
                break;
            }
        }
    });

    function resetJoystick() {
        touchId = null;
        input.dx = 0;
        input.dy = 0;
        if (joystickStick) joystickStick.style.transform = `translate(-50%, -50%)`;
    }

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);
}

function handleJoystick(cx, cy) {
    const maxR = 55;
    let dx = cx - joystickCenter.x;
    let dy = cy - joystickCenter.y;
    let dist = Math.hypot(dx, dy);
    if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
    }
    if (joystickStick) {
        joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    input.dx = dx / maxR;
    input.dy = dy / maxR;
}

// ======================= 6. VA CHẠM & TẦM NHÌN =======================
function isWall(x, y) {
    let col = Math.floor(x / TILE_SIZE);
    let row = Math.floor(y / TILE_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
    if (!maze[row]) return true;
    return maze[row][col] === 1;
}

function moveEntitySliding(entity, vx, vy) {
    let newX = entity.x + vx;
    let newY = entity.y + vy;
    let r = entity.radius;
    if (!isWall(newX + Math.sign(vx) * r, entity.y)) entity.x = newX;
    if (!isWall(entity.x, newY + Math.sign(vy) * r)) entity.y = newY;
}

function hasLineOfSight(x1, y1, x2, y2) {
    let dist = Math.hypot(x2 - x1, y2 - y1);
    let steps = Math.floor(dist / 14);
    for (let i = 1; i < steps; i++) {
        let cx = x1 + (x2 - x1) * (i / steps);
        let cy = y1 + (y2 - y1) * (i / steps);
        if (isWall(cx, cy)) return false;
    }
    return true;
}

function castRayForVisionArea(startX, startY, angle, maxDist) {
    let step = 14;
    let curDist = 0;
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);

    while (curDist < maxDist) {
        curDist += step;
        let cx = startX + cos * curDist;
        let cy = startY + sin * curDist;
        if (isWall(cx, cy)) return { x: cx, y: cy };
    }
    return { x: startX + cos * maxDist, y: startY + sin * maxDist };
}

function updateMonsterVisionArea() {
    let rayCount = 45;
    let startAngle = monster.angle - monster.fov / 2;
    let stepAngle = monster.fov / rayCount;

    monster.visionPolygon = [];
    for (let i = 0; i <= rayCount; i++) {
        let a = startAngle + i * stepAngle;
        let hitPoint = castRayForVisionArea(monster.x, monster.y, a, monster.visionRange);
        monster.visionPolygon.push(hitPoint);
    }

    if (gameState === 'MAZE') {
        let distToP = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distToP <= monster.visionRange) {
            let angleToP = Math.atan2(player.y - monster.y, player.x - monster.x);
            let angleDiff = Math.atan2(Math.sin(angleToP - monster.angle), Math.cos(angleToP - monster.angle));

            if (Math.abs(angleDiff) <= monster.fov / 2) {
                if (hasLineOfSight(monster.x, monster.y, player.x, player.y)) {
                    if (!monster.isChasing) {
                        triggerMonsterSpeak(`${player.name} ơi, anh thấy em rồi!`, 140);
                    }
                    monster.isChasing = true;
                }
            }
        }
    }
}

// ======================= 7. ĐỒNG MINH, TÚI CỨU THƯƠNG & HIỆU ỨNG =======================
function spawnSingleAlly() {
    let side = Math.floor(Math.random() * 4);
    let ax = 120, ay = 120;
    let maxW = (COLS - 2) * TILE_SIZE;
    let maxH = (ROWS - 2) * TILE_SIZE;

    if (side === 0) { ax = 120 + Math.random() * (maxW - 120); ay = 120; }
    else if (side === 1) { ax = maxW; ay = 120 + Math.random() * (maxH - 120); }
    else if (side === 2) { ax = 120 + Math.random() * (maxW - 120); ay = maxH; }
    else { ax = 120; ay = 120 + Math.random() * (maxH - 120); }

    allies.push({
        x: ax,
        y: ay,
        radius: 14,
        speed: 3.8 + Math.random() * 0.8,
        hp: 100,
        maxHp: 100,
        damage: 50,
        attackCooldown: 0
    });
}

function spawnMedkit() {
    let maxW = (COLS - 3) * TILE_SIZE;
    let maxH = (ROWS - 3) * TILE_SIZE;
    medkits.push({
        x: 160 + Math.random() * (maxW - 160),
        y: 160 + Math.random() * (maxH - 160),
        radius: 15
    });
}

// Thêm hiệu ứng chém/nổ và chữ số sát thương bay lên
function addHitVisual(x, y, isPlayer) {
    if (isPlayer) {
        // Người chơi đánh: Vòng sóng bộc phá hoàng kim rực sáng
        hitEffects.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 55,
            lineWidth: 6,
            color: '#facc15', // Vàng hoàng kim
            alpha: 1.0
        });
        damageTexts.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y - 25,
            text: '-100 💥',
            color: '#facc15',
            size: 20,
            life: 40,
            vy: -1.6
        });
    } else {
        // Đồng minh đánh: Hoa lửa bạc trắng gọn nhẹ
        hitEffects.push({
            x: x,
            y: y,
            radius: 6,
            maxRadius: 26,
            lineWidth: 3,
            color: '#e2e8f0', // Trắng bạc
            alpha: 0.9
        });
        damageTexts.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y - 15,
            text: '-50',
            color: '#ffffff',
            size: 14,
            life: 28,
            vy: -1.1
        });
    }
}

function triggerMonsterSpeak(text, duration = 160) {
    monster.speechText = text;
    monster.speechTimer = duration;
}

// ======================= 8. KHỞI TẠO GAME =======================
function initGame() {
    resizeCanvas();
    gameState = 'MAZE';
    maze = generateMaze(COLS, ROWS);
    let emptyTiles = getEmptyTiles();

    player.x = 120;
    player.y = 120;
    player.hp = 1000;
    player.maxHp = 1000;
    player.speed = player.baseSpeed;
    player.attackCooldown = 0;

    monster.x = (COLS - 3) * TILE_SIZE;
    monster.y = (ROWS - 3) * TILE_SIZE;
    monster.lastX = monster.x;
    monster.lastY = monster.y;
    monster.stuckCounter = 0;
    monster.hp = 10000;
    monster.maxHp = 10000;
    monster.speed = monster.baseSpeed;
    monster.isChasing = false;
    monster.isShielded = false;
    monster.shieldTimer = 0;
    monster.shockwaveActive = false;
    monster.singleStrikeTimer = 0;
    monster.skill1Cooldown = 300;
    monster.skill2Cooldown = 550;
    monster.skill3Cooldown = 850;

    allies = [];
    allyRespawnQueue = [];
    medkits = [];
    hitEffects = [];
    damageTexts = [];
    medkitSpawnTimer = 0;
    notification.text = '';
    notification.timer = 0;

    emptyTiles.sort(() => Math.random() - 0.5);
    papers = [];
    for (let i = 0; i < 10; i++) {
        if (emptyTiles[i]) papers.push(emptyTiles[i]);
    }

    teleporters = [];
    for (let i = 10; i < 20; i += 2) {
        if (emptyTiles[i + 1]) {
            let t1 = emptyTiles[i];
            let t2 = emptyTiles[i + 1];
            teleporters.push({ x: t1.x, y: t1.y, targetX: t2.x, targetY: t2.y, isOneWay: false, isRevealed: false });
            teleporters.push({ x: t2.x, y: t2.y, targetX: t1.x, targetY: t1.y, isOneWay: false, isRevealed: false });
        }
    }

    isGameOver = false;
    isVictory = false;
    shiftTimer = SHIFT_INTERVAL;
    lastShiftTimestamp = Date.now();

    let countEl = document.getElementById('paper-count');
    if (countEl) countEl.innerText = '0';
    let timerEl = document.getElementById('shift-timer-display');
    if (timerEl) timerEl.innerText = `${shiftTimer}s`;
    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = 'Thu thập 10 bài phốt! Cẩn thận các bẫy ẩn!';
        statusEl.style.color = '#f87171';
    }
    let modalEl = document.getElementById('game-modal');
    if (modalEl) modalEl.classList.add('hidden');
    let introEl = document.getElementById('boss-intro-modal');
    if (introEl) introEl.classList.add('hidden');
}

function startBossBattle() {
    let introEl = document.getElementById('boss-intro-modal');
    if (introEl) introEl.classList.add('hidden');

    collapseMazeToArena();
    gameState = 'ARENA';

    // Bắt đầu phát bản nhạc đánh Boss riêng
    playBossBGM();

    // Triệu tập 20 đồng minh ban đầu
    allies = [];
    allyRespawnQueue = [];
    for (let i = 0; i < ALLY_COUNT; i++) {
        spawnSingleAlly();
    }

    // Thả sẵn 3 túi cứu thương
    for (let i = 0; i < 3; i++) {
        spawnMedkit();
    }

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bạn: <b id="player-hp-ui">${player.hp}</b>/1000 HP`;
    let badgeTimer = document.getElementById('badge-timer');
    if (badgeTimer) badgeTimer.innerHTML = `Cộng đồng: <b style="color:#38bdf8">${allies.length}</b>`;
    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = 'ĐẠI CHIẾN BOSS! TIÊU DIỆT TRƯỜNG GIANG (10.000 HP)!';
        statusEl.style.color = '#eab308';
    }

    triggerMonsterSpeak(`Phen này tao quyết chiến với tụi bây!`, 180);
    playSynthSound('boss_skill');
}

// ======================= 9. VÒNG LẶP LOGIC (UPDATE) =======================
function update() {
    if (!isPlaying || isGameOver || isVictory || gameState === 'BOSS_POPUP') return;

    let now = Date.now();
    if (screenShake > 0) screenShake *= 0.9;
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (monster.attackCooldown > 0) monster.attackCooldown--;
    if (monster.shieldTimer > 0) monster.shieldTimer--;
    if (monster.shieldTimer <= 0) monster.isShielded = false;
    if (notification.timer > 0) notification.timer--;

    // Cập nhật hiệu ứng nổ và chữ số sát thương
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        let eff = hitEffects[i];
        eff.radius += (eff.maxRadius - eff.radius) * 0.25;
        eff.alpha -= 0.05;
        if (eff.alpha <= 0) hitEffects.splice(i, 1);
    }
    for (let i = damageTexts.length - 1; i >= 0; i--) {
        let txt = damageTexts[i];
        txt.y += txt.vy;
        txt.life--;
        if (txt.life <= 0) damageTexts.splice(i, 1);
    }

    // --- A. DI CHUYỂN NGƯỜI CHƠI ---
    let moveX = 0, moveY = 0;
    if (input.isMouseDown) {
        let sx = canvas.width / 2;
        let sy = canvas.height / 2;
        let dx = input.mouseX - sx;
        let dy = input.mouseY - sy;
        let dist = Math.hypot(dx, dy);
        if (dist > 15) {
            moveX = dx / dist;
            moveY = dy / dist;
        }
    } else if (input.dx !== 0 || input.dy !== 0) {
        moveX = input.dx;
        moveY = input.dy;
    }

    if (moveX !== 0 || moveY !== 0) {
        player.angle = Math.atan2(moveY, moveX);
        moveEntitySliding(player, moveX * player.speed, moveY * player.speed);
    }

    // --- B. LOGIC GIAI ĐOẠN 1: MÊ CUNG ---
    if (gameState === 'MAZE') {
        let elapsed = Math.floor((now - lastShiftTimestamp) / 1000);
        shiftTimer = Math.max(0, SHIFT_INTERVAL - elapsed);
        let timerEl = document.getElementById('shift-timer-display');
        if (timerEl) timerEl.innerText = `${shiftTimer}s`;

        if (shiftTimer <= 0) {
            smartMazeShift();
            lastShiftTimestamp = now;
            shiftTimer = SHIFT_INTERVAL;
        }

        // Nhặt bài phốt
        for (let i = papers.length - 1; i >= 0; i--) {
            let p = papers[i];
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 18) {
                papers.splice(i, 1);
                playSynthSound('collect');

                let collected = 10 - papers.length;
                let countEl = document.getElementById('paper-count');
                if (countEl) countEl.innerText = collected;

                if (papers.length > 0) {
                    notification.text = 'TRƯỜNG GIANG ĐANG TỨC GIẬN VÌ BỊ PHỐT!';
                    notification.timer = 140;
                } else {
                    // ĐỦ 10 BÀI PHỐT -> HIỆN POPUP ĐẤU TRƯỜNG
                    gameState = 'BOSS_POPUP';
                    let introEl = document.getElementById('boss-intro-modal');
                    if (introEl) introEl.classList.remove('hidden');
                    return;
                }
            }
        }

        // Bị bắt trong mê cung
        let distToPlayer = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distToPlayer < player.radius + monster.radius) {
            isGameOver = true;
            playSynthSound('player_hit');
            showModal('BẠN ĐÃ BỊ BẮT!', `Trường Giang đã tóm được ${player.name} trong bóng tối.`);
            return;
        }

        updateMonsterVisionArea();

        // CƠ CHẾ CHỐNG KẸT QUÁI VẬT TRONG MÊ CUNG (ANTI-STUCK WATCHDOG)
        let movedDist = Math.hypot(monster.x - monster.lastX, monster.y - monster.lastY);
        if (movedDist < 1.0) {
            monster.stuckCounter++;
            if (monster.stuckCounter > 45) { // Đứng yên quá 45 frames (~0.7s) -> Bị kẹt góc
                // Tự động tìm ô trống lân cận để giải kẹt
                let mCol = Math.floor(monster.x / TILE_SIZE);
                let mRow = Math.floor(monster.y / TILE_SIZE);
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (let [dc, dr] of dirs) {
                    let nc = mCol + dc;
                    let nr = mRow + dr;
                    if (nc >= 1 && nc < COLS - 1 && nr >= 1 && nr < ROWS - 1 && maze[nr] && maze[nr][nc] === 0) {
                        monster.x = nc * TILE_SIZE + TILE_SIZE / 2;
                        monster.y = nr * TILE_SIZE + TILE_SIZE / 2;
                        monster.stuckCounter = 0;
                        monster.currentPath = [];
                        break;
                    }
                }
            }
        } else {
            monster.stuckCounter = 0;
        }
        monster.lastX = monster.x;
        monster.lastY = monster.y;

        // Quái vật di chuyển dí người chơi
        let mDx = player.x - monster.x;
        let mDy = player.y - monster.y;
        let mDist = Math.hypot(mDx, mDy);
        if (monster.isChasing && mDist > 1) {
            monster.moveAngle = Math.atan2(mDy, mDx);
            monster.angle = monster.moveAngle;
            moveEntitySliding(monster, (mDx / mDist) * monster.speed, (mDy / mDist) * monster.speed);
        }
        return;
    }

    // --- C. LOGIC GIAI ĐOẠN 2: ĐẠI CHIẾN ĐẤU TRƯỜNG ---
    // 1. HÀNG ĐỢI HỒI SINH CỘNG ĐỒNG MẠNG SAU 5 GIÂY (300 FRAMES)
    for (let i = allyRespawnQueue.length - 1; i >= 0; i--) {
        allyRespawnQueue[i]--;
        if (allyRespawnQueue[i] <= 0) {
            allyRespawnQueue.splice(i, 1);
            if (allies.length < ALLY_COUNT) {
                spawnSingleAlly();
            }
        }
    }

    // 2. Thả túi máu cứu thương 500 HP
    medkitSpawnTimer++;
    if (medkitSpawnTimer > 380 && medkits.length < 5) {
        medkitSpawnTimer = 0;
        spawnMedkit();
    }

    // 3. Người chơi nhặt túi cứu thương (+500 HP)
    for (let i = medkits.length - 1; i >= 0; i--) {
        let m = medkits[i];
        if (Math.hypot(player.x - m.x, player.y - m.y) < player.radius + m.radius + 6) {
            medkits.splice(i, 1);
            player.hp = Math.min(player.maxHp, player.hp + 500); // Hồi 500 HP
            playSynthSound('heal');
            notification.text = `+500 HP! MÁU HIỆN TẠI: ${player.hp}/1000`;
            notification.timer = 120;
        }
    }

    // 4. Đồng minh vây ráp và tấn công Boss
    for (let i = allies.length - 1; i >= 0; i--) {
        let ally = allies[i];
        if (ally.attackCooldown > 0) ally.attackCooldown--;

        let dx = monster.x - ally.x;
        let dy = monster.y - ally.y;
        let dist = Math.hypot(dx, dy);

        if (dist > monster.radius + ally.radius) {
            moveEntitySliding(ally, (dx / dist) * ally.speed, (dy / dist) * ally.speed);
        } else {
            if (ally.attackCooldown <= 0) {
                ally.attackCooldown = 55;
                let actualDmg = monster.isShielded ? 25 : 50;
                monster.hp = Math.max(0, monster.hp - actualDmg);
                addHitVisual(monster.x + (Math.random() - 0.5) * 30, monster.y + (Math.random() - 0.5) * 30, false);
                playSynthSound('ally_hit');
            }
        }
    }

    // 5. Người chơi tấn công Boss (Có hiệu ứng vàng cam uy lực & -100 💥)
    let distPtoM = Math.hypot(player.x - monster.x, player.y - monster.y);
    if (distPtoM <= player.radius + monster.radius + 6) {
        if (player.attackCooldown <= 0) {
            player.attackCooldown = 28;
            let actualDmg = monster.isShielded ? 50 : 100;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            screenShake = 16;
            addHitVisual(monster.x, monster.y, true); // Hiệu ứng đặc biệt của người chơi
            playSynthSound('player_hit');
        }
    }

    // 6. Boss Trường Giang tấn công & dùng 3 Skill
    let targets = [player, ...allies];
    targets.sort((a, b) => Math.hypot(a.x - monster.x, a.y - monster.y) - Math.hypot(b.x - monster.x, b.y - monster.y));
    let primaryTarget = targets[0];

    if (primaryTarget) {
        let bDx = primaryTarget.x - monster.x;
        let bDy = primaryTarget.y - monster.y;
        let bDist = Math.hypot(bDx, bDy);
        if (bDist > 1) {
            monster.angle = Math.atan2(bDy, bDx);
            moveEntitySliding(monster, (bDx / bDist) * monster.speed, (bDy / bDist) * monster.speed);
        }

        if (bDist <= monster.radius + primaryTarget.radius + 4 && monster.attackCooldown <= 0) {
            monster.attackCooldown = 40;
            primaryTarget.hp -= 100;
            playSynthSound('player_hit');
            screenShake = 18;
        }
    }

    // Skill 1: Vỗ Mặt (Đơn mục tiêu - 200 dame)
    monster.skill1Cooldown--;
    if (monster.skill1Cooldown <= 0 && primaryTarget) {
        monster.skill1Cooldown = 320;
        monster.singleStrikeTarget = { x: primaryTarget.x, y: primaryTarget.y };
        monster.singleStrikeTimer = 25;
        primaryTarget.hp -= 200;
        screenShake = 22;
        playSynthSound('boss_skill');
        triggerMonsterSpeak(`Nhận lấy cú vỗ mặt này!`, 90);
    }
    if (monster.singleStrikeTimer > 0) monster.singleStrikeTimer--;

    // Skill 2: Sóng Gió Thị Phi (Đa mục tiêu - 150 dame)
    monster.skill2Cooldown--;
    if (monster.skill2Cooldown <= 0) {
        monster.skill2Cooldown = 560;
        monster.shockwaveActive = true;
        monster.shockwaveRadius = 10;
        playSynthSound('boss_skill');
        triggerMonsterSpeak(`Sóng gió thị phi nổi lên!`, 110);
    }
    if (monster.shockwaveActive) {
        monster.shockwaveRadius += 10;
        for (let target of targets) {
            let d = Math.hypot(target.x - monster.x, target.y - monster.y);
            if (Math.abs(d - monster.shockwaveRadius) < 15) {
                target.hp -= 150;
            }
        }
        if (monster.shockwaveRadius > 280) monster.shockwaveActive = false;
    }

    // Skill 3: Tẩy Trắng (Kháng 50% dame, hồi 800 HP)
    monster.skill3Cooldown--;
    if (monster.skill3Cooldown <= 0) {
        monster.skill3Cooldown = 850;
        monster.isShielded = true;
        monster.shieldTimer = 240;
        monster.hp = Math.min(monster.maxHp, monster.hp + 800);
        playSynthSound('heal');
        triggerMonsterSpeak(`Anh tẩy trắng thành công rồi!`, 120);
    }

    // 7. Đồng minh chết -> Đưa vào hàng đợi 5 giây (300 frames)
    for (let i = allies.length - 1; i >= 0; i--) {
        if (allies[i].hp <= 0) {
            allies.splice(i, 1);
            allyRespawnQueue.push(300); // Bắt đầu đếm ngược 5 giây để hồi sinh
        }
    }

    // Cập nhật giao diện
    let hpUi = document.getElementById('player-hp-ui');
    if (hpUi) hpUi.innerText = Math.max(0, player.hp);
    let badgeTimer = document.getElementById('badge-timer');
    if (badgeTimer) badgeTimer.innerHTML = `Cộng đồng: <b style="color:#38bdf8">${allies.length}</b>/20`;

    // Kiểm tra kết thúc
    if (player.hp <= 0) {
        isGameOver = true;
        playSynthSound('player_hit');
        try { bossBgmAudio.pause(); } catch(e){}
        showModal('BẠN ĐÃ THẤT BẠI!', 'Bạn đã bị hạ gục tại Đấu trường.');
        return;
    }

    if (monster.hp <= 0) {
        isVictory = true;
        playSynthSound('win');
        try { bossBgmAudio.pause(); } catch(e){}
        showModal('CHIẾN THẮNG TUYỆT ĐỐI!', 'Bạn và cộng đồng mạng đã đánh bại trường giang');
        return;
    }
}

// ======================= 10. VẼ ĐỒ HỌA ĐẤU TRƯỜNG & CHIÊU THỨC =======================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) return;

    let pX = player.x || 120;
    let pY = player.y || 120;
    let mX = monster.x || 1300;
    let mY = monster.y || 1300;

    let shakeX = (Math.random() - 0.5) * screenShake;
    let shakeY = (Math.random() - 0.5) * screenShake;

    let camX = canvas.width / 2 - pX + shakeX;
    let camY = canvas.height / 2 - pY + shakeY;

    ctx.save();
    ctx.translate(camX, camY);

    // --- A. VẼ BẢN ĐỒ / ĐẤU TRƯỜNG ---
    let startC = Math.max(0, Math.floor((pX - canvas.width / 2) / TILE_SIZE) - 2);
    let endC = Math.min(COLS, Math.ceil((pX + canvas.width / 2) / TILE_SIZE) + 2);
    let startR = Math.max(0, Math.floor((pY - canvas.height / 2) / TILE_SIZE) - 2);
    let endR = Math.min(ROWS, Math.ceil((pY + canvas.height / 2) / TILE_SIZE) + 2);

    for (let r = startR; r < endR; r++) {
        for (let c = startC; c < endC; c++) {
            let x = c * TILE_SIZE;
            let y = r * TILE_SIZE;
            if (maze[r] && maze[r][c] === 1) {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = gameState === 'ARENA' ? '#0f172a' : '#0b1329';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // --- B. VẼ BÀI PHỐT (MÊ CUNG) ---
    if (gameState === 'MAZE') {
        let floatVal = Math.sin(Date.now() / 180) * 4;
        for (let p of papers) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.arc(p.x, p.y + floatVal, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(p.x - 8, p.y - 11 + floatVal, 16, 22);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x - 8, p.y - 11 + floatVal, 16, 22);

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(p.x - 5, p.y - 6 + floatVal, 10, 2);
            ctx.fillRect(p.x - 5, p.y - 1 + floatVal, 10, 2);
            ctx.fillRect(p.x - 5, p.y + 4 + floatVal, 8, 2);
        }
    }

    // --- C. VẼ TÚI CỨU THƯƠNG 500 HP [+] XANH ---
    if (gameState === 'ARENA') {
        for (let m of medkits) {
            ctx.save();
            ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
            ctx.beginPath();
            ctx.arc(m.x, m.y, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Chữ thập trắng
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(m.x - 2.5, m.y - 8, 5, 16);
            ctx.fillRect(m.x - 8, m.y - 2.5, 16, 5);
            ctx.restore();
        }
    }

    // --- D. VẼ HIỆU ỨNG CHIÊU THỨC BOSS ---
    if (gameState === 'ARENA') {
        if (monster.shockwaveActive) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(mX, mY, monster.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (monster.singleStrikeTimer > 0 && monster.singleStrikeTarget) {
            ctx.save();
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(mX, mY);
            ctx.lineTo(monster.singleStrikeTarget.x, monster.singleStrikeTarget.y);
            ctx.stroke();
            ctx.restore();
        }

        if (monster.isShielded) {
            ctx.save();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(mX, mY, monster.radius + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- E. VẼ CỘNG ĐỒNG MẠNG (HÌNH TRÒN TRẮNG) ---
    if (gameState === 'ARENA') {
        for (let ally of allies) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ally.x, ally.y, ally.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();

            let bW = 24, bH = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(ally.x - bW / 2, ally.y - ally.radius - 8, bW, bH);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(ally.x - bW / 2, ally.y - ally.radius - 8, (ally.hp / ally.maxHp) * bW, bH);
            ctx.restore();
        }
    }

    // --- F. VẼ QUÁI VẬT TRƯỜNG GIANG & THANH MÁU ---
    if (monsterImage.complete && monsterImage.naturalWidth > 0) {
        ctx.save();
        ctx.translate(mX, mY);
        ctx.drawImage(monsterImage, -monster.radius, -monster.radius, monster.radius * 2, monster.radius * 2);
        ctx.restore();
    } else {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(mX, mY, monster.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f87171';
    ctx.fillText(monster.name, mX, mY + monster.radius + 16);

    // Thanh máu Boss 10.000 HP
    if (gameState === 'ARENA') {
        ctx.save();
        let barW = 110, barH = 10;
        let barX = mX - barW / 2;
        let barY = mY - monster.radius - 22;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barW, barH);

        let currentW = (monster.hp / monster.maxHp) * barW;
        ctx.fillStyle = monster.isShielded ? '#fbbf24' : '#ef4444';
        ctx.fillRect(barX, barY, currentW, barH);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${monster.hp}/10000`, mX, barY - 4);
        ctx.restore();
    }

    // Lời thoại Boss
    if (monster.speechTimer > 0 && monster.speechText) {
        ctx.save();
        ctx.font = 'bold 13px -apple-system, sans-serif';
        let textMetrics = ctx.measureText(monster.speechText);
        let boxW = textMetrics.width + 24;
        let boxH = 28;
        let boxX = mX - boxW / 2;
        let boxY = mY - monster.radius - (gameState === 'ARENA' ? 44 : 32);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.beginPath();
        ctx.moveTo(mX - 6, boxY + boxH);
        ctx.lineTo(mX, boxY + boxH + 6);
        ctx.lineTo(mX + 6, boxY + boxH);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#b91c1c';
        ctx.textAlign = 'center';
        ctx.fillText(monster.speechText, mX, boxY + 18);
        ctx.restore();
    }

    // --- G. VẼ NGƯỜI CHƠI ---
    ctx.save();
    ctx.translate(pX, pY);

    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(player.name, 0, -player.radius - (gameState === 'ARENA' ? 16 : 8));

    if (gameState === 'ARENA') {
        let pBarW = 44, pBarH = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(-pBarW / 2, -player.radius - 12, pBarW, pBarH);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-pBarW / 2, -player.radius - 12, (player.hp / player.maxHp) * pBarW, pBarH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-pBarW / 2, -player.radius - 12, pBarW, pBarH);
    }

    ctx.rotate(player.angle);
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#fbc531';
    ctx.beginPath();
    ctx.moveTo(player.radius + 10, 0);
    ctx.lineTo(player.radius - 4, -9);
    ctx.lineTo(player.radius - 4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- H. VẼ HIỆU ỨNG ĐÁNH TRÚNG & CHỮ SỐ SÁT THƯƠNG ---
    for (let eff of hitEffects) {
        ctx.save();
        ctx.strokeStyle = eff.color;
        ctx.lineWidth = eff.lineWidth;
        ctx.globalAlpha = Math.max(0, eff.alpha);
        ctx.beginPath();
        ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    for (let txt of damageTexts) {
        ctx.save();
        ctx.font = `bold ${txt.size}px -apple-system, sans-serif`;
        ctx.fillStyle = txt.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
    }

    ctx.restore(); // Phục hồi góc Camera

    // --- I. ĐÈN PIN TRONG MÊ CUNG ---
    if (gameState === 'MAZE') {
        let lightGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 220,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.9
        );
        lightGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lightGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.25)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- K. BANNER THÔNG BÁO ---
    if (notification.timer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        let bannerW = Math.min(540, canvas.width - 40);
        let bannerH = 42;
        let bx = (canvas.width - bannerW) / 2;
        ctx.fillRect(bx, 75, bannerW, bannerH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, 75, bannerW, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(notification.text, canvas.width / 2, 102);
        ctx.restore();
    }
}

// ======================= 11. GIAO DIỆN & VÒNG LẶP CHÍNH =======================
const colorDots = document.querySelectorAll('.color-dot');
colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        player.color = dot.getAttribute('data-color');
    });
});

function onStartGameClicked() {
    let nameInput = document.getElementById('player-name-input');
    if (nameInput && nameInput.value.trim()) {
        player.name = nameInput.value.trim();
    }

    let startModal = document.getElementById('start-modal');
    if (startModal) startModal.classList.add('hidden');

    let uiContainer = document.getElementById('ui-container');
    if (uiContainer) uiContainer.classList.remove('hidden');

    isPlaying = true;
    initGame();
    playBGM();
}

function showModal(title, desc) {
    let tEl = document.getElementById('modal-title');
    if (tEl) tEl.innerText = title;
    let dEl = document.getElementById('modal-desc');
    if (dEl) dEl.innerText = desc;
    let mEl = document.getElementById('game-modal');
    if (mEl) mEl.classList.remove('hidden');
}

function restartGame() {
    try { bossBgmAudio.pause(); } catch(e){}
    playBGM();
    initGame();
}

function gameLoop() {
    try {
        update();
    } catch (e) {}

    try {
        draw();
    } catch (e) {}

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
