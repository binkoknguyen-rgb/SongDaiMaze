/**
 * TRÒ CHƠI: SÔNG DÀI MAZE
 * File: game.js (Bản sửa dứt điểm lỗi màn hình đen & Tối ưu hiển thị ánh sáng)
 */

// ======================= 1. TÀI NGUYÊN HÌNH ẢNH & ÂM THANH =======================
const ASSETS = {
    monsterImg: 'assets/monster.jpg',
    bgmPrimary: 'assets/bgm.mp3',
    bgmSecondary: 'bgm.mp3'
};

const monsterImage = new Image();
monsterImage.src = ASSETS.monsterImg;

let bgmAudio = new Audio(ASSETS.bgmPrimary);
bgmAudio.loop = true;
bgmAudio.volume = 0.55;

bgmAudio.addEventListener('error', () => {
    if (bgmAudio.src.includes('assets/bgm.mp3')) {
        bgmAudio.src = ASSETS.bgmSecondary;
        bgmAudio.load();
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
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'lose') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.6);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
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

// ======================= 2. KHO LỜI THOẠI TRƯỜNG GIANG =======================
const MONSTER_LINES = {
    spotPlayer: (name) => `${name} ơi, anh thấy em rồi! Đừng hòng chạy!`,
    onAngry: [
        (name) => `Sao em dám bóc phốt anh hả ${name}?!`,
        (name) => `${name}, anh không bỏ qua chuyện này đâu!`,
        (name) => `${name} em đâu rồi, ra mặt cho anh!`,
        (name) => `Chờ đó ${name}, anh tới đây!`
    ],
    patrol: [
        (name) => `${name} em đâu rồi?`,
        (name) => `Trốn ở đâu rồi ${name}?`,
        (name) => `Đừng đi sau lưng anh đấy!`
    ],
    checkBack: () => `Ai ở sau lưng đó?!`,
    loseTrack: () => `Ủa, chạy xa dữ vậy?!`,
    stepOnTrap: () => `gì vậy !?`,
    frightenedStart: (name) => `Thôi xong rồi, tha cho anh đi ${name} ơi!`,
    frightenedRun: [
        () => `Đừng lại gần đây!`,
        (name) => `Anh xin lỗi mà, tha cho anh!`,
        () => `Cứu Trường Giang với bà con ơi!`,
        (name) => `Tha một lần này thôi ${name}!`
    ],
    onHit: () => `Á á, đau quá ! Cứu với!`
};

// ======================= 3. THIẾT LẬP CANVAS =======================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ======================= 4. BẢN ĐỒ MÊ CUNG 41 x 41 =======================
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
            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && grid[nr][nc] === 0 && !visited[nr][nc]) {
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
            if ((door.c === pCol && door.r === pRow) || (door.c === mCol && door.r === mRow)) continue;
            maze[door.r][door.c] = 1;
            if (!canReach(pCol, pRow, mCol, mRow, maze)) {
                maze[door.r][door.c] = 0;
                continue;
            }
        } else {
            maze[door.r][door.c] = 0;
        }
        changedCount++;
    }
    monster.currentPath = [];
}

function getEmptyTiles() {
    let empty = [];
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (maze[r][c] === 0) {
                empty.push({ x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2, c, r });
            }
        }
    }
    return empty;
}

// ======================= 5. THUẬT TOÁN TÌM ĐƯỜNG BFS =======================
function findPathBFS(startC, startR, targetC, targetR) {
    if (startC === targetC && startR === targetR) return [];
    if (startC < 0 || startC >= COLS || startR < 0 || startR >= ROWS) return [];
    if (targetC < 0 || targetC >= COLS || targetR < 0 || targetR >= ROWS) return [];
    if (maze[startR][startC] === 1 || maze[targetR][targetC] === 1) return [];

    let queue = [[startC, startR]];
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let parent = {};
    visited[startR][startC] = true;
    let found = false;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    while (queue.length > 0) {
        let [currC, currR] = queue.shift();
        if (currC === targetC && currR === targetR) {
            found = true;
            break;
        }
        for (let [dc, dr] of dirs) {
            let nc = currC + dc;
            let nr = currR + dr;
            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && maze[nr][nc] === 0 && !visited[nr][nc]) {
                visited[nr][nc] = true;
                parent[`${nc},${nr}`] = [currC, currR];
                queue.push([nc, nr]);
            }
        }
    }
    if (!found) return [];

    let path = [];
    let step = [targetC, targetR];
    while (step) {
        let key = `${step[0]},${step[1]}`;
        if (step[0] === startC && step[1] === startR) break;
        path.unshift(step);
        step = parent[key];
    }
    return path;
}

// ======================= 6. ĐỐI TƯỢNG TRONG GAME =======================
let player = {
    name: 'Người Chơi',
    color: '#00a8ff',
    x: 0,
    y: 0,
    radius: 15,
    baseSpeed: 5.6,
    speed: 5.6,
    angle: 0,
    teleportCooldown: 0
};

let monster = {
    name: 'Trường Giang',
    x: 0,
    y: 0,
    radius: 22,
    baseSpeed: 4.3,
    speed: 4.3,
    visionRange: 550,
    breakDistance: 760,
    
    angle: 0,
    moveAngle: 0,
    fov: Math.PI * 1.33,
    visionPolygon: [],
    
    isCheckingBack: false,
    checkBackTimer: 0,
    checkBackCooldown: 250,

    isChasing: false,
    isFrightened: false,
    hp: 200,
    maxHp: 200,
    hitCooldown: 0,
    teleportCooldown: 0,

    patrolTarget: null,
    currentPath: [],
    
    speechText: '',
    speechTimer: 0,
    sayCooldown: 120
};

let notification = { text: '', timer: 0 };
let papers = [];
let teleporters = [];
let isGameOver = false;
let isVictory = false;
let isPlaying = false;

// ======================= 7. HỆ THỐNG ĐIỀU KHIỂN =======================
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
    const maxR = 40;
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

// ======================= 8. VA CHẠM & TẦM NHÌN =======================
function isWall(x, y) {
    let col = Math.floor(x / TILE_SIZE);
    let row = Math.floor(y / TILE_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
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
    let step = 12;
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
    let rayCount = 55;
    let startAngle = monster.angle - monster.fov / 2;
    let stepAngle = monster.fov / rayCount;

    monster.visionPolygon = [];
    for (let i = 0; i <= rayCount; i++) {
        let a = startAngle + i * stepAngle;
        let hitPoint = castRayForVisionArea(monster.x, monster.y, a, monster.visionRange);
        monster.visionPolygon.push(hitPoint);
    }

    if (!monster.isFrightened) {
        let distToP = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distToP <= monster.visionRange) {
            let angleToP = Math.atan2(player.y - monster.y, player.x - monster.x);
            let angleDiff = Math.atan2(Math.sin(angleToP - monster.angle), Math.cos(angleToP - monster.angle));

            if (Math.abs(angleDiff) <= monster.fov / 2) {
                if (hasLineOfSight(monster.x, monster.y, player.x, player.y)) {
                    if (!monster.isChasing) {
                        triggerMonsterSpeak(MONSTER_LINES.spotPlayer(player.name), 150);
                    }
                    monster.isChasing = true;
                }
            }
        }
    }
}

// ======================= 9. KHỞI TẠO BẪY BEGARRITO =======================
function setupTeleportTraps(emptyTiles) {
    teleporters = [];
    for (let i = 0; i < 5; i++) {
        if (emptyTiles.length < 2) break;
        let t1 = emptyTiles.pop();
        let t2 = emptyTiles.pop();
        let isOneWay = i >= 3;

        teleporters.push({ x: t1.x, y: t1.y, targetX: t2.x, targetY: t2.y, isOneWay: isOneWay, isRevealed: false });
        if (!isOneWay) {
            teleporters.push({ x: t2.x, y: t2.y, targetX: t1.x, targetY: t1.y, isOneWay: false, isRevealed: false });
        }
    }
}

// ======================= 10. RẢI 10 BÀI PHỐT KHÔNG GẦN NHAU =======================
function spawnSpacedPapers(emptyTiles, count) {
    let result = [];
    let pool = [...emptyTiles].sort(() => Math.random() - 0.5);
    const MIN_DISTANCE = 320;

    for (let candidate of pool) {
        if (result.length >= count) break;
        if (Math.hypot(candidate.x - player.x, candidate.y - player.y) < 280) continue;

        let tooClose = false;
        for (let placed of result) {
            if (Math.hypot(candidate.x - placed.x, candidate.y - placed.y) < MIN_DISTANCE) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            result.push(candidate);
        }
    }

    while (result.length < count && pool.length > 0) {
        let t = pool.pop();
        if (!result.some(p => p.x === t.x && p.y === t.y)) {
            result.push(t);
        }
    }

    return result;
}

function triggerMonsterSpeak(text, duration = 160) {
    monster.speechText = text;
    monster.speechTimer = duration;
}

// ======================= 11. KHỞI TẠO GAME (BẢO VỆ AN TOÀN TUYỆT ĐỐI) =======================
function initGame() {
    maze = generateMaze(COLS, ROWS);
    let emptyTiles = getEmptyTiles();

    let pTile = emptyTiles.shift();
    player.x = pTile.x;
    player.y = pTile.y;
    player.speed = player.baseSpeed;
    player.teleportCooldown = 0;

    let mTile = emptyTiles.pop();
    monster.x = mTile.x;
    monster.y = mTile.y;
    monster.angle = 0;
    monster.moveAngle = 0;
    monster.speed = monster.baseSpeed;
    monster.isChasing = false;
    monster.isFrightened = false;
    monster.hp = 200;
    monster.hitCooldown = 0;
    monster.teleportCooldown = 0;
    monster.isCheckingBack = false;
    monster.checkBackTimer = 0;
    monster.checkBackCooldown = 250;
    monster.patrolTarget = null;
    monster.currentPath = [];
    monster.speechText = '';
    monster.speechTimer = 0;
    monster.sayCooldown = 150;

    notification.text = '';
    notification.timer = 0;

    emptyTiles.sort(() => Math.random() - 0.5);
    setupTeleportTraps(emptyTiles);

    papers = spawnSpacedPapers(emptyTiles, 10);

    isGameOver = false;
    isVictory = false;
    shiftTimer = SHIFT_INTERVAL;
    lastShiftTimestamp = Date.now();

    // Cập nhật DOM an toàn (Kiểm tra tồn tại trước khi gán để không bị crash)
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
}

// ======================= 12. VÒNG LẶP LOGIC (UPDATE) =======================
let lastPathCalcTime = 0;

function update() {
    if (!isPlaying || isGameOver || isVictory) return;

    let now = Date.now();
    let elapsed = Math.floor((now - lastShiftTimestamp) / 1000);
    shiftTimer = Math.max(0, SHIFT_INTERVAL - elapsed);

    let timerEl = document.getElementById('shift-timer-display');
    if (timerEl) timerEl.innerText = `${shiftTimer}s`;

    if (shiftTimer <= 0) {
        smartMazeShift();
        lastShiftTimestamp = now;
        shiftTimer = SHIFT_INTERVAL;
    }

    if (screenShake > 0) screenShake *= 0.9;
    if (player.teleportCooldown > 0) player.teleportCooldown--;
    if (monster.teleportCooldown > 0) monster.teleportCooldown--;
    if (monster.hitCooldown > 0) monster.hitCooldown--;
    if (notification.timer > 0) notification.timer--;

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

    // --- B. XỬ LÝ BẪY DỊCH CHUYỂN ---
    for (let trap of teleporters) {
        if (player.teleportCooldown <= 0 && Math.hypot(player.x - trap.x, player.y - trap.y) < 10) {
            trap.isRevealed = true;
            let targetTrap = teleporters.find(t => t.x === trap.targetX && t.y === trap.targetY);
            if (targetTrap) targetTrap.isRevealed = true;

            player.x = trap.targetX;
            player.y = trap.targetY;
            player.teleportCooldown = 120;
            screenShake = 20;
            break;
        }

        if (monster.teleportCooldown <= 0 && Math.hypot(monster.x - trap.x, monster.y - trap.y) < 14) {
            trap.isRevealed = true;
            let targetTrap = teleporters.find(t => t.x === trap.targetX && t.y === trap.targetY);
            if (targetTrap) targetTrap.isRevealed = true;

            monster.x = trap.targetX;
            monster.y = trap.targetY;
            monster.teleportCooldown = 120;
            monster.currentPath = [];
            triggerMonsterSpeak(MONSTER_LINES.stepOnTrap(), 100);
            break;
        }
    }

    // --- C. THU THẬP BÀI PHỐT (10 BÀI) ---
    for (let i = papers.length - 1; i >= 0; i--) {
        let p = papers[i];
        if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 18) {
            papers.splice(i, 1);
            playSynthSound('collect');

            let collected = 10 - papers.length;
            let countEl = document.getElementById('paper-count');
            if (countEl) countEl.innerText = collected;

            monster.speed = monster.baseSpeed + collected * 0.18;

            if (papers.length > 0) {
                notification.text = 'TRƯỜNG GIANG ĐANG TỨC GIẬN VÌ BỊ PHỐT!';
                notification.timer = 150;
                let randomAngry = MONSTER_LINES.onAngry[Math.floor(Math.random() * MONSTER_LINES.onAngry.length)];
                triggerMonsterSpeak(randomAngry(player.name), 150);
            } else {
                monster.isFrightened = true;
                monster.isChasing = false;
                player.speed = monster.speed;

                notification.text = 'BẠN ĐÃ LÀ KẺ ĐI SĂN! HÃY HẠ GỤC TRƯỜNG GIANG (200 HP)!';
                notification.timer = 260;
                let statusEl = document.getElementById('game-status');
                if (statusEl) {
                    statusEl.innerText = 'TRUY SÁT TRƯỜNG GIANG! CHẠM 4 LẦN (-50 HP MỖI ĐÒN)!';
                    statusEl.style.color = '#2ecc71';
                }

                triggerMonsterSpeak(MONSTER_LINES.frightenedStart(player.name), 220);
            }
        }
    }

    let distToPlayer = Math.hypot(player.x - monster.x, player.y - monster.y);

    // --- D. SỢI CHỈ ĐỎ DAI DẲNG ---
    if (monster.isChasing && !monster.isFrightened) {
        let hasLOS = hasLineOfSight(monster.x, monster.y, player.x, player.y);
        if (!hasLOS && distToPlayer > monster.breakDistance) {
            monster.isChasing = false;
            monster.currentPath = [];
            triggerMonsterSpeak(MONSTER_LINES.loseTrack(), 130);
        }
    }

    updateMonsterVisionArea();

    // --- E. TẤN CÔNG / BỊ BẮT (200 HP) ---
    if (distToPlayer < player.radius + monster.radius) {
        if (!monster.isFrightened) {
            isGameOver = true;
            playSynthSound('lose');
            try { bgmAudio.pause(); } catch(e){}
            showModal('BẠN ĐÃ BỊ BẮT!', `Trường Giang đã tóm được ${player.name}.`);
            return;
        } else {
            if (monster.hitCooldown <= 0) {
                monster.hp -= 50;
                monster.hitCooldown = 80;
                screenShake = 25;
                playSynthSound('hit');

                if (monster.hp <= 0) {
                    isVictory = true;
                    playSynthSound('win');
                    try { bgmAudio.pause(); } catch(e){}
                    showModal('CHIẾN THẮNG TUYỆT ĐỐI!', `Bạn đã đánh bại Trường Giang và vạch trần mọi bài phốt!`);
                    return;
                } else {
                    notification.text = `TRƯỜNG GIANG BỊ TẤN CÔNG! CÒN ${monster.hp}/200 HP!`;
                    notification.timer = 150;
                    triggerMonsterSpeak(MONSTER_LINES.onHit(), 150);
                }
            }
        }
    }

    // --- F. QUAY ĐẦU CHECK SAU LƯNG ---
    if (!monster.isChasing && !monster.isFrightened) {
        monster.checkBackCooldown--;
        if (monster.checkBackCooldown <= 0 && !monster.isCheckingBack) {
            monster.isCheckingBack = true;
            monster.checkBackTimer = 75;
            monster.angle = monster.moveAngle + Math.PI;
            triggerMonsterSpeak(MONSTER_LINES.checkBack(), 75);
        }

        if (monster.isCheckingBack) {
            monster.checkBackTimer--;
            if (monster.checkBackTimer <= 0) {
                monster.isCheckingBack = false;
                monster.angle = monster.moveAngle;
                monster.checkBackCooldown = 260 + Math.random() * 200;
            }
        }
    }

    // --- G. THOẠI ĐỊNH KỲ ---
    if (monster.speechTimer > 0) {
        monster.speechTimer--;
    } else {
        monster.sayCooldown--;
        if (monster.sayCooldown <= 0) {
            monster.sayCooldown = 300 + Math.random() * 150;
            if (monster.isFrightened) {
                let randomFright = MONSTER_LINES.frightenedRun[Math.floor(Math.random() * MONSTER_LINES.frightenedRun.length)];
                triggerMonsterSpeak(randomFright(player.name), 160);
            } else {
                let randomPatrol = MONSTER_LINES.patrol[Math.floor(Math.random() * MONSTER_LINES.patrol.length)];
                triggerMonsterSpeak(randomPatrol(player.name), 160);
            }
        }
    }

    // --- H. AI DI CHUYỂN ---
    let mCol = Math.floor(monster.x / TILE_SIZE);
    let mRow = Math.floor(monster.y / TILE_SIZE);

    if (now - lastPathCalcTime > 160 || monster.currentPath.length === 0) {
        lastPathCalcTime = now;

        if (monster.isFrightened) {
            let revealedTraps = teleporters.filter(t => t.isRevealed);
            let bestTrap = null;
            let currentDistToPlayer = Math.hypot(monster.x - player.x, monster.y - player.y);

            for (let trap of revealedTraps) {
                let destDistToPlayer = Math.hypot(trap.targetX - player.x, trap.targetY - player.y);
                let trapDistToMonster = Math.hypot(trap.x - monster.x, trap.y - monster.y);
                if (trapDistToMonster < 500 && destDistToPlayer > currentDistToPlayer + 250) {
                    bestTrap = trap;
                    break;
                }
            }

            if (bestTrap) {
                let tCol = Math.floor(bestTrap.x / TILE_SIZE);
                let tRow = Math.floor(bestTrap.y / TILE_SIZE);
                monster.currentPath = findPathBFS(mCol, mRow, tCol, tRow);
            } else {
                let empty = getEmptyTiles();
                empty.sort((a, b) => {
                    let distA = Math.hypot(a.x - player.x, a.y - player.y);
                    let distB = Math.hypot(b.x - player.x, b.y - player.y);
                    return distB - distA;
                });
                let fleeTarget = empty[0] || empty[Math.floor(Math.random() * 5)];
                monster.currentPath = findPathBFS(mCol, mRow, fleeTarget.c, fleeTarget.r);
            }
        } else if (monster.isChasing) {
            let pCol = Math.floor(player.x / TILE_SIZE);
            let pRow = Math.floor(player.y / TILE_SIZE);
            monster.currentPath = findPathBFS(mCol, mRow, pCol, pRow);
        } else {
            let needNewTarget = false;
            if (!monster.patrolTarget) {
                needNewTarget = true;
            } else {
                let distToTarget = Math.hypot(monster.x - monster.patrolTarget.x, monster.y - monster.patrolTarget.y);
                if (distToTarget < 35) {
                    needNewTarget = true;
                }
            }

            if (needNewTarget) {
                let empty = getEmptyTiles();
                monster.patrolTarget = (papers.length > 0 && Math.random() < 0.75) 
                    ? papers[Math.floor(Math.random() * papers.length)] 
                    : empty[Math.floor(Math.random() * empty.length)];
            }

            let tCol = Math.floor(monster.patrolTarget.x / TILE_SIZE);
            let tRow = Math.floor(monster.patrolTarget.y / TILE_SIZE);
            monster.currentPath = findPathBFS(mCol, mRow, tCol, tRow);

            if (!monster.currentPath || monster.currentPath.length === 0) {
                monster.patrolTarget = null;
            }
        }
    }

    let moveSpeed = (monster.isChasing || monster.isFrightened) ? monster.speed : (monster.speed * 0.8);

    if (!monster.isCheckingBack && monster.currentPath && monster.currentPath.length > 0) {
        let targetNode = monster.currentPath[0];
        let targetX = targetNode[0] * TILE_SIZE + TILE_SIZE / 2;
        let targetY = targetNode[1] * TILE_SIZE + TILE_SIZE / 2;

        let dx = targetX - monster.x;
        let dy = targetY - monster.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 1) {
            monster.moveAngle = Math.atan2(dy, dx);
            monster.angle = monster.moveAngle;
        }

        if (dist <= moveSpeed) {
            monster.x = targetX;
            monster.y = targetY;
            monster.currentPath.shift();
        } else {
            monster.x += (dx / dist) * moveSpeed;
            monster.y += (dy / dist) * moveSpeed;
        }
    } 
    else if (!monster.isCheckingBack) {
        if (monster.isChasing && !monster.isFrightened) {
            let directDx = player.x - monster.x;
            let directDy = player.y - monster.y;
            let directDist = Math.hypot(directDx, directDy);
            if (directDist > 1) {
                monster.moveAngle = Math.atan2(directDy, directDx);
                monster.angle = monster.moveAngle;
                moveEntitySliding(monster, (directDx / directDist) * moveSpeed, (directDy / directDist) * moveSpeed);
            }
        } else if (!monster.isFrightened) {
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            let openSteps = [];
            for (let [dc, dr] of dirs) {
                let nc = mCol + dc;
                let nr = mRow + dr;
                if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && maze[nr][nc] === 0) {
                    openSteps.push({ x: nc * TILE_SIZE + TILE_SIZE / 2, y: nr * TILE_SIZE + TILE_SIZE / 2 });
                }
            }
            if (openSteps.length > 0) {
                let nextStep = openSteps[Math.floor(Math.random() * openSteps.length)];
                let wDx = nextStep.x - monster.x;
                let wDy = nextStep.y - monster.y;
                let wDist = Math.hypot(wDx, wDy);
                if (wDist > 1) {
                    monster.moveAngle = Math.atan2(wDy, wDx);
                    monster.angle = monster.moveAngle;
                    moveEntitySliding(monster, (wDx / wDist) * (moveSpeed * 0.7), (wDy / wDist) * (moveSpeed * 0.7));
                }
            }
        }
    }
}

// ======================= 13. VẼ ĐỒ HỌA (SÁNG RÕ NÉT - KHÔNG BỊ ĐEN HÌNH) =======================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) return;

    let shakeX = (Math.random() - 0.5) * screenShake;
    let shakeY = (Math.random() - 0.5) * screenShake;

    let camX = canvas.width / 2 - player.x + shakeX;
    let camY = canvas.height / 2 - player.y + shakeY;

    ctx.save();
    ctx.translate(camX, camY);

    // --- A. VẼ MÊ CUNG TƯƠNG PHẢN CAO RÕ RÀNG ---
    let startC = Math.max(0, Math.floor((player.x - canvas.width / 2) / TILE_SIZE) - 1);
    let endC = Math.min(COLS, Math.ceil((player.x + canvas.width / 2) / TILE_SIZE) + 1);
    let startR = Math.max(0, Math.floor((player.y - canvas.height / 2) / TILE_SIZE) - 1);
    let endR = Math.min(ROWS, Math.ceil((player.y + canvas.height / 2) / TILE_SIZE) + 1);

    for (let r = startR; r < endR; r++) {
        for (let c = startC; c < endC; c++) {
            let x = c * TILE_SIZE;
            let y = r * TILE_SIZE;
            if (maze[r][c] === 1) {
                // Tường màu xanh đậm có viền xanh dương neon nổi bật
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else {
                // Đường đi màu xanh đen công nghệ sạch sẽ
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // --- B. VẼ KHU VỰC TẦM NHÌN ---
    if (monster.visionPolygon && monster.visionPolygon.length > 0) {
        ctx.save();
        let baseColor = monster.isFrightened ? '52, 211, 153' : (monster.isChasing ? '239, 68, 68' : '14, 165, 233');

        let grad = ctx.createRadialGradient(
            monster.x, monster.y, 15,
            monster.x, monster.y, monster.visionRange
        );
        grad.addColorStop(0, `rgba(${baseColor}, ${monster.isChasing ? 0.45 : 0.25})`);
        grad.addColorStop(0.7, `rgba(${baseColor}, ${monster.isChasing ? 0.2 : 0.12})`);
        grad.addColorStop(1, `rgba(${baseColor}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(monster.x, monster.y);

        for (let pt of monster.visionPolygon) {
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(${baseColor}, 0.6)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // --- C. VẼ BẪY BEGARRITO (NHỎ GỌN) ---
    let trapSpin = Date.now() / 380;
    for (let trap of teleporters) {
        if (!trap.isRevealed) continue;

        ctx.save();
        ctx.translate(trap.x, trap.y);
        let color = trap.isOneWay ? '#e67e22' : '#9b59b6';
        ctx.rotate(trapSpin * (trap.isOneWay ? -1 : 1));
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // --- D. VẼ 10 BÀI PHỐT PHÁT SÁNG ---
    let floatVal = Math.sin(Date.now() / 180) * 4;
    for (let p of papers) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
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

    // --- E. SỢI CHỈ ĐỎ DAI DẲNG ---
    if (monster.isChasing && !monster.isFrightened) {
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(monster.x, monster.y);
        let midX = (monster.x + player.x) / 2 + (Math.random() - 0.5) * 6;
        let midY = (monster.y + player.y) / 2 + (Math.random() - 0.5) * 6;
        ctx.quadraticCurveTo(midX, midY, player.x, player.y);
        ctx.stroke();
        ctx.restore();
    }

    // --- F. VẼ QUÁI VẬT, THANH MÁU 200 HP & LỜI THOẠI ---
    if (monsterImage.complete && monsterImage.naturalWidth > 0) {
        ctx.save();
        ctx.translate(monster.x, monster.y);
        ctx.shadowColor = monster.isFrightened ? '#34d399' : (monster.isChasing ? '#ef4444' : '#0ea5e9');
        ctx.shadowBlur = 18;
        ctx.drawImage(monsterImage, -26, -26, 52, 52);
        ctx.restore();
    } else {
        // Hình vẽ dự phòng sắc nét nếu ảnh chưa kịp tải lên GitHub
        ctx.fillStyle = monster.isFrightened ? '#10b981' : (monster.isChasing ? '#ef4444' : '#a855f7');
        ctx.beginPath();
        ctx.arc(monster.x, monster.y, monster.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = monster.isFrightened ? '#34d399' : '#f87171';
    ctx.fillText(monster.name, monster.x, monster.y + monster.radius + 15);

    // Thanh máu 200 HP
    if (monster.isFrightened) {
        ctx.save();
        let barW = 60;
        let barH = 8;
        let barX = monster.x - barW / 2;
        let barY = monster.y - monster.radius - 24;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        let currentW = (monster.hp / monster.maxHp) * barW;
        ctx.fillStyle = monster.hp > 100 ? '#2ecc71' : (monster.hp > 50 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(barX, barY, currentW, barH);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        for (let s = 1; s <= 3; s++) {
            ctx.beginPath();
            ctx.moveTo(barX + (barW / 4) * s, barY);
            ctx.lineTo(barX + (barW / 4) * s, barY + barH);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Bong bóng lời thoại
    if (monster.speechTimer > 0 && monster.speechText) {
        ctx.save();
        ctx.font = 'bold 13px -apple-system, sans-serif';
        let textMetrics = ctx.measureText(monster.speechText);
        let boxW = textMetrics.width + 24;
        let boxH = 28;
        let boxX = monster.x - boxW / 2;
        let boxY = monster.y - monster.radius - (monster.isFrightened ? 52 : 42);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = monster.isFrightened ? '#10b981' : (monster.isChasing ? '#ef4444' : '#334155');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(monster.x - 6, boxY + boxH);
        ctx.lineTo(monster.x, boxY + boxH + 6);
        ctx.lineTo(monster.x + 6, boxY + boxH);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = monster.isFrightened ? '#065f46' : (monster.isChasing ? '#b91c1c' : '#1e293b');
        ctx.textAlign = 'center';
        ctx.fillText(monster.speechText, monster.x, boxY + 18);
        ctx.restore();
    }

    // --- G. VẼ NGƯỜI CHƠI ---
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(player.name, 0, -player.radius - 8);

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
    ctx.restore();

    // --- H. HIỆU ỨNG ÁNH SÁNG ĐÈN PIN (ĐÃ MỞ RỘNG BÁN KÍNH LÊN 180PX ĐỂ KHÔNG BỊ ĐEN HÌNH) ---
    let lightGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 180, // Tăng vầng sáng rõ từ 85 lên 180px
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.85
    );
    lightGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    lightGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.35)');
    lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- I. BANNER THÔNG BÁO TỨC GIẬN ---
    if (notification.timer > 0) {
        ctx.save();
        ctx.fillStyle = monster.isFrightened ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.92)';
        let bannerW = Math.min(540, canvas.width - 40);
        let bannerH = 42;
        let bx = (canvas.width - bannerW) / 2;
        ctx.roundRect(bx, 75, bannerW, bannerH, 8);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(notification.text, canvas.width / 2, 102);
        ctx.restore();
    }
}

// ======================= 14. GIAO DIỆN & KHỞI CHẠY AN TOÀN =======================
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

    // Chạy game trước để chắc chắn Canvas được vẽ
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
    playBGM();
    initGame();
}

function gameLoop() {
    try {
        update();
        draw();
    } catch (e) {
        console.error("Lỗi trong vòng lặp game:", e);
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
