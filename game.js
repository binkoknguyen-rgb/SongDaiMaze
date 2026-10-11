/**
 * TRÒ CHƠI: SÔNG DÀI MAZE
 * File: game.js
 * Cập nhật:
 * 1. Sửa lỗi đánh fan: Đòn đánh thường và kỹ năng của người chơi tiêu diệt fan chuẩn xác.
 * 2. Giảm sức mạnh "Tẩy Trắng": Phase 1 hồi 1.000 HP, Phase 2 hồi 1.500 HP.
 * 3. Đồng minh nhặt bài phốt: Chỉ đồng minh bị lộ 5s, Trường Giang truy đuổi đồng minh.
 * 4. Tốc độ Trường Giang mê cung: Khởi điểm 6.0 (nhanh hơn người chơi), tăng dần tới 8.5.
 * 5. Mũi tên đỏ chỉ vị trí Boss trong Đấu trường.
 * 6. Túi máu Đấu trường tăng hồi phục: Phase 1 hồi 1.500 HP, Phase 2 hồi 2.500 HP.
 * 7. Bổ sung kỹ năng người chơi: Lướt thần tốc (Dash - 4s) và Bão phẫn nộ AOE (8s).
 */

// ======================= 1. TÀI NGUYÊN HÌNH ẢNH & ÂM THANH =======================
const ASSETS = {
    monsterImg: 'assets/monster.jpg',
    bossPhase2Img: 'assets/boss_phase2.jpg',
    bgmPrimary: 'assets/bgm.mp3',
    bgmSecondary: 'bgm.mp3',
    bossBgmPrimary: 'assets/boss_bgm.mp3',
    bossBgmSecondary: 'boss_bgm.mp3'
};

const monsterImage = new Image();
monsterImage.src = ASSETS.monsterImg;

const bossPhase2Image = new Image();
bossPhase2Image.src = ASSETS.bossPhase2Img;

let bgmAudio = new Audio(ASSETS.bgmPrimary);
bgmAudio.loop = true;
bgmAudio.volume = 0.5;
bgmAudio.addEventListener('error', () => {
    if (bgmAudio.src.includes('assets/bgm.mp3')) {
        bgmAudio.src = ASSETS.bgmSecondary;
        bgmAudio.load();
    }
});

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
        } else if (type === 'item_pickup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'shield_break') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.4);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'heal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'player_hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'player_aoe') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.3);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'dash') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'ally_hit') {
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
        } else if (type === 'phase_change') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.linearRampToValueAtTime(600, now + 0.8);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            osc.start(now);
            osc.stop(now + 0.8);
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

// ======================= 3. BẢN ĐỒ MÊ CUNG MỞ RỘNG (81 x 81) =======================
const TILE_SIZE = 64;   
const COLS = 81;        
const ROWS = 81;        
let maze = [];
let screenShake = 0;

function generateMaze(cols, rows) {
    let grid = Array.from({ length: rows }, () => Array(cols).fill(1));

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
            if (grid[r][c] === 1 && Math.random() < 0.12) grid[r][c] = 0;
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
    screenShake = 40;
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

function findPathBFS(startC, startR, targetC, targetR) {
    if (startC === targetC && startR === targetR) return [];
    if (startC < 0 || startC >= COLS || startR < 0 || startR >= ROWS) return [];
    if (targetC < 0 || targetC >= COLS || targetR < 0 || targetR >= ROWS) return [];
    if (!maze[startR] || !maze[targetR] || maze[startR][startC] === 1 || maze[targetR][targetC] === 1) return [];

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
            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && maze[nr] && maze[nr][nc] === 0 && !visited[nr][nc]) {
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

// ======================= 4. ĐỐI TƯỢNG VÀ THỰC THỂ =======================
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
    hp: 10000,
    maxHp: 10000,
    damage: 100,
    attackCooldown: 0,
    revealTimer: 0,
    invulnerableTimer: 0,
    shields: 0,
    hasDetector: false,

    // KỸ NĂNG NGƯỜI CHƠI
    dashCooldown: 0,     // 4s = 240 frames
    isDashing: false,
    dashTimer: 0,
    aoeCooldown: 0       // 8s = 480 frames
};

let monster = {
    phase: 1,
    name: 'Trường Giang',
    x: 2600,
    y: 2600,
    radius: 16,
    baseSpeed: 6.0,      // Ban đầu nhanh hơn người chơi (6.0 > 5.6)
    speed: 6.0,
    visionRange: 550,
    breakDistance: 430,
    lostSightTimer: 0,
    angle: 0,
    moveAngle: 0,
    fov: Math.PI * 1.33,
    visionPolygon: [],

    hp: 10000,
    maxHp: 10000,
    damage: 100,
    attackCooldown: 0,
    postAttackPause: 0,
    stunTimer: 0,
    isShielded: false,
    shieldTimer: 0,

    skill1Cooldown: 280,
    skill2Cooldown: 500,
    skill3Cooldown: 700,
    phase2DashCooldown: 340,
    phase2RadialCooldown: 420,
    phase2VortexCooldown: 600,

    isDashing: false,
    dashTimer: 0,
    dashTarget: { x: 0, y: 0 },
    vortexActive: false,
    vortexTimer: 0,
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

// VẬT PHẨM MÊ CUNG
let mazeItems = [];
let mazeHelpers = [];

// ĐẠI CHIẾN 51 VS 51
const ALLY_COUNT = 50;
const FAN_COUNT = 50;
const RESPAWN_DELAY_FRAMES = 1800; // 30 GIÂY

let allies = [];
let allyRespawnQueue = [];

let fans = [];
let fanRespawnQueue = [];

let bossProjectiles = [];
let medkits = [];
let medkitSpawnTimer = 0;

let hitEffects = [];
let damageTexts = [];
let notification = { text: '', timer: 0 };
let papers = [];
let isGameOver = false;
let isVictory = false;
let isPlaying = false;

// ======================= 5. HỆ THỐNG ĐIỀU KHIỂN & KỸ NĂNG NGƯỜI CHƠI =======================
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

// Bắt phím kích hoạt kỹ năng trên PC: Space = Lướt, E / Q = Bão Phẫn Nộ
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        triggerPlayerDash();
    } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
        triggerPlayerAOE();
    }
});

function triggerPlayerDash() {
    if (player.dashCooldown <= 0 && !player.isDashing && isPlaying && !isGameOver && !isVictory) {
        player.isDashing = true;
        player.dashTimer = 16;
        player.dashCooldown = 240; // 4 giây hồi chiêu
        player.invulnerableTimer = 20; // Bất tử khi lướt
        playSynthSound('dash');
    }
}

function triggerPlayerAOE() {
    if (player.aoeCooldown <= 0 && isPlaying && !isGameOver && !isVictory) {
        player.aoeCooldown = 480; // 8 giây hồi chiêu
        playSynthSound('player_aoe');
        screenShake = 22;

        // Hiệu ứng sóng bộc phá hoàng kim bán kính 220px
        hitEffects.push({
            x: player.x,
            y: player.y,
            radius: 15,
            maxRadius: 220,
            lineWidth: 6,
            color: '#facc15',
            alpha: 1.0
        });

        // Gây sát thương lên Fan trung thành xung quanh
        for (let fan of fans) {
            if (Math.hypot(fan.x - player.x, fan.y - player.y) < 220) {
                fan.hp -= 600; // Tiêu diệt ngay các fan trúng đòn
                addHitVisual(fan.x, fan.y, true, '-600 💥', '#facc15');
            }
        }

        // Gây sát thương lên Boss nếu ở trong tầm
        if (gameState === 'ARENA' && Math.hypot(monster.x - player.x, monster.y - player.y) < 220) {
            let actualDmg = monster.isShielded ? 300 : 600;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            addHitVisual(monster.x, monster.y, true, `-${actualDmg} 💥`, '#facc15');
        }
    }
}

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
    if (monster.stunTimer > 0) {
        monster.visionPolygon = [];
        return;
    }

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

// ======================= 7. SPAWN QUÂN ĐOÀN & VẬT PHẨM =======================
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

function spawnSingleFan() {
    let fx = monster.x + (Math.random() - 0.5) * 450;
    let fy = monster.y + (Math.random() - 0.5) * 450;
    let maxW = (COLS - 2) * TILE_SIZE;
    let maxH = (ROWS - 2) * TILE_SIZE;

    fx = Math.max(120, Math.min(maxW, fx));
    fy = Math.max(120, Math.min(maxH, fy));

    fans.push({
        x: fx,
        y: fy,
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
        radius: 16
    });
}

function addHitVisual(x, y, isPlayer, customText = null, customColor = null) {
    if (isPlayer) {
        hitEffects.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 60,
            lineWidth: 6,
            color: '#facc15',
            alpha: 1.0
        });
        damageTexts.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y - 25,
            text: customText || `-${player.damage} 💥`,
            color: customColor || '#facc15',
            size: 20,
            life: 40,
            vy: -1.6
        });
    } else {
        hitEffects.push({
            x: x,
            y: y,
            radius: 6,
            maxRadius: 26,
            lineWidth: 3,
            color: customColor || '#e2e8f0',
            alpha: 0.9
        });
        damageTexts.push({
            x: x + (Math.random() - 0.5) * 35,
            y: y - 15,
            text: customText || '-50',
            color: customColor || '#ffffff',
            size: 13,
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
    player.hp = 10000;
    player.maxHp = 10000;
    player.damage = 100;
    player.speed = player.baseSpeed;
    player.attackCooldown = 0;
    player.revealTimer = 0;
    player.invulnerableTimer = 0;
    player.shields = 0;
    player.hasDetector = false;
    player.dashCooldown = 0;
    player.isDashing = false;
    player.aoeCooldown = 0;

    monster.phase = 1;
    monster.name = 'Trường Giang';
    monster.x = (COLS - 3) * TILE_SIZE;
    monster.y = (ROWS - 3) * TILE_SIZE;
    monster.radius = 16;
    monster.baseSpeed = 6.0;      // TỐC ĐỘ BAN ĐẦU 6.0 (Nhanh hơn người chơi 5.6)
    monster.speed = 6.0;
    monster.breakDistance = 430;
    monster.lostSightTimer = 0;
    monster.hp = 10000;
    monster.maxHp = 10000;
    monster.damage = 100;
    monster.attackCooldown = 0;
    monster.postAttackPause = 0;
    monster.stunTimer = 0;
    monster.isChasing = false;
    monster.isShielded = false;
    monster.shieldTimer = 0;
    monster.shockwaveActive = false;
    monster.singleStrikeTimer = 0;
    monster.isDashing = false;
    monster.vortexActive = false;
    monster.currentPath = [];
    monster.patrolTarget = null;

    monster.skill1Cooldown = 280;
    monster.skill2Cooldown = 500;
    monster.skill3Cooldown = 700;
    monster.phase2DashCooldown = 340;
    monster.phase2RadialCooldown = 420;
    monster.phase2VortexCooldown = 600;

    allies = [];
    allyRespawnQueue = [];
    fans = [];
    fanRespawnQueue = [];
    medkits = [];
    hitEffects = [];
    damageTexts = [];
    bossProjectiles = [];
    mazeHelpers = [];
    medkitSpawnTimer = 0;
    notification.text = '';
    notification.timer = 0;

    emptyTiles.sort(() => Math.random() - 0.5);

    papers = [];
    for (let i = 0; i < 10; i++) {
        if (emptyTiles[i]) papers.push(emptyTiles[i]);
    }

    // 3 Khiên, 3 Điện thoại, 1 Máy dò
    mazeItems = [];
    let itemIdx = 10;
    for (let i = 0; i < 3; i++) {
        if (emptyTiles[itemIdx]) {
            mazeItems.push({ x: emptyTiles[itemIdx].x, y: emptyTiles[itemIdx].y, type: 'shield', radius: 15 });
            itemIdx++;
        }
    }
    for (let i = 0; i < 3; i++) {
        if (emptyTiles[itemIdx]) {
            mazeItems.push({ x: emptyTiles[itemIdx].x, y: emptyTiles[itemIdx].y, type: 'phone', radius: 15 });
            itemIdx++;
        }
    }
    if (emptyTiles[itemIdx]) {
        mazeItems.push({ x: emptyTiles[itemIdx].x, y: emptyTiles[itemIdx].y, type: 'detector', radius: 16 });
        itemIdx++;
    }

    isGameOver = false;
    isVictory = false;

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bài phốt: <b id="paper-count">0</b>/10`;

    let badgeStatusMode = document.getElementById('badge-status-mode');
    if (badgeStatusMode) badgeStatusMode.innerHTML = `Chế độ: <b>Mê Cung</b>`;

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = 'Thu thập đủ 10 bài phốt để qua màn tiếp theo!';
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
    monster.radius = 28;
    mazeItems = [];
    mazeHelpers = [];

    playBossBGM();

    allies = [];
    allyRespawnQueue = [];
    for (let i = 0; i < ALLY_COUNT; i++) {
        spawnSingleAlly();
    }

    fans = [];
    fanRespawnQueue = [];
    for (let i = 0; i < FAN_COUNT; i++) {
        spawnSingleFan();
    }

    for (let i = 0; i < 4; i++) {
        spawnMedkit();
    }

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bạn: <b id="player-hp-ui">${player.hp}</b>/10000 HP`;
    let badgeStatusMode = document.getElementById('badge-status-mode');
    if (badgeStatusMode) badgeStatusMode.innerHTML = `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b> vs Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;
    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = '⚡ ĐẠI CHIẾN 51 VS 51! TỔNG PHẢN CÔNG TRƯỜNG GIANG!';
        statusEl.style.color = '#eab308';
    }

    triggerMonsterSpeak(`50 Fan của tao đâu, tiễu trừ bọn chúng!`, 180);
    playSynthSound('boss_skill');
}

// ======================= 9. VÒNG LẶP LOGIC (UPDATE) =======================
let lastPathCalcTime = 0;

function update() {
    if (!isPlaying || isGameOver || isVictory || gameState === 'BOSS_POPUP') return;

    let now = Date.now();
    if (screenShake > 0) screenShake *= 0.9;
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.invulnerableTimer > 0) player.invulnerableTimer--;
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.aoeCooldown > 0) player.aoeCooldown--;

    if (monster.attackCooldown > 0) monster.attackCooldown--;
    if (monster.shieldTimer > 0) monster.shieldTimer--;
    if (monster.shieldTimer <= 0) monster.isShielded = false;
    if (monster.stunTimer > 0) monster.stunTimer--;
    if (notification.timer > 0) notification.timer--;

    // Cập nhật text nút hồi chiêu
    let dashCdText = document.getElementById('dash-cd-text');
    let dashBtn = document.getElementById('btn-skill-dash');
    if (dashCdText && dashBtn) {
        if (player.dashCooldown > 0) {
            dashCdText.innerText = `${Math.ceil(player.dashCooldown / 60)}s`;
            dashBtn.classList.add('disabled');
        } else {
            dashCdText.innerText = `SẴN SÀNG`;
            dashBtn.classList.remove('disabled');
        }
    }

    let aoeCdText = document.getElementById('aoe-cd-text');
    let aoeBtn = document.getElementById('btn-skill-aoe');
    if (aoeCdText && aoeBtn) {
        if (player.aoeCooldown > 0) {
            aoeCdText.innerText = `${Math.ceil(player.aoeCooldown / 60)}s`;
            aoeBtn.classList.add('disabled');
        } else {
            aoeCdText.innerText = `SẴN SÀNG`;
            aoeBtn.classList.remove('disabled');
        }
    }

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

    // --- A. DI CHUYỂN NGƯỜI CHƠI (Xử lý cả khi Lướt Thần Tốc) ---
    let currentSpeed = player.speed;
    if (player.isDashing) {
        player.dashTimer--;
        currentSpeed = player.speed * 2.8; // Tốc độ lướt gấp 2.8 lần
        if (player.dashTimer <= 0) player.isDashing = false;
    }

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
        moveEntitySliding(player, moveX * currentSpeed, moveY * currentSpeed);
    }

    // --- B. LOGIC GIAI ĐOẠN 1: MÊ CUNG ---
    if (gameState === 'MAZE') {
        if (player.revealTimer > 0) {
            player.revealTimer--;
            monster.isChasing = true;
        }

        // Nhặt vật phẩm mê cung
        for (let i = mazeItems.length - 1; i >= 0; i--) {
            let item = mazeItems[i];
            if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + 6) {
                mazeItems.splice(i, 1);
                playSynthSound('item_pickup');

                if (item.type === 'shield') {
                    player.shields++;
                    notification.text = `🛡️ ĐÃ NHẶT KHIÊN HỘ MỆNH! (Đang có: ${player.shields})`;
                    notification.timer = 150;
                } else if (item.type === 'phone') {
                    mazeHelpers.push({
                        x: player.x,
                        y: player.y,
                        radius: 14,
                        speed: 4.8,
                        currentPath: [],
                        revealTimer: 0
                    });
                    notification.text = `📱 ĐÃ TRIỆU HỒI CỘNG ĐỒNG MẠNG ĐI GOM BÀI PHỐT GIÚP!`;
                    notification.timer = 160;
                } else if (item.type === 'detector') {
                    player.hasDetector = true;
                    notification.text = `📡 ĐÃ KÍCH HOẠT MÁY DÒ BÀI PHỐT!`;
                    notification.timer = 180;
                }
            }
        }

        // Đồng minh trong mê cung đi nhặt bài phốt
        for (let hIdx = mazeHelpers.length - 1; hIdx >= 0; hIdx--) {
            let helper = mazeHelpers[hIdx];
            if (helper.revealTimer > 0) helper.revealTimer--;

            if (papers.length > 0) {
                let nearestP = null;
                let minDist = Infinity;
                for (let p of papers) {
                    let d = Math.hypot(p.x - helper.x, p.y - helper.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestP = p;
                    }
                }

                if (nearestP) {
                    let hCol = Math.floor(helper.x / TILE_SIZE);
                    let hRow = Math.floor(helper.y / TILE_SIZE);
                    let pCol = Math.floor(nearestP.x / TILE_SIZE);
                    let pRow = Math.floor(nearestP.y / TILE_SIZE);

                    if (now - lastPathCalcTime > 200 || helper.currentPath.length === 0) {
                        helper.currentPath = findPathBFS(hCol, hRow, pCol, pRow);
                    }

                    if (helper.currentPath && helper.currentPath.length > 0) {
                        let nextNode = helper.currentPath[0];
                        let targetX = nextNode[0] * TILE_SIZE + TILE_SIZE / 2;
                        let targetY = nextNode[1] * TILE_SIZE + TILE_SIZE / 2;
                        let hDx = targetX - helper.x;
                        let hDy = targetY - helper.y;
                        let hDist = Math.hypot(hDx, hDy);

                        if (hDist <= helper.speed) {
                            helper.x = targetX;
                            helper.y = targetY;
                            helper.currentPath.shift();
                        } else {
                            helper.x += (hDx / hDist) * helper.speed;
                            helper.y += (hDy / hDist) * helper.speed;
                        }
                    }
                }
            }

            // Đồng minh nhặt bài phốt -> CHỈ ĐỒNG MINH BỊ LỘ 5S!
            for (let i = papers.length - 1; i >= 0; i--) {
                let p = papers[i];
                if (Math.hypot(helper.x - p.x, helper.y - p.y) < helper.radius + 18) {
                    papers.splice(i, 1);
                    playSynthSound('collect');

                    let collected = 10 - papers.length;
                    let countEl = document.getElementById('paper-count');
                    if (countEl) countEl.innerText = collected;

                    monster.speed = 6.0 + collected * 0.25;

                    helper.revealTimer = 300; // 5s lộ vị trí cho đồng minh
                    player.revealTimer = 0;   // Người chơi KHÔNG bị lộ!

                    notification.text = `📢 CỘNG ĐỒNG MẠNG NHẶT PHỐT & BỊ LỘ 5S! TRƯỜNG GIANG ĐANG ĐUỔI THEO HỌ!`;
                    notification.timer = 150;

                    if (papers.length === 0) {
                        gameState = 'BOSS_POPUP';
                        let introEl = document.getElementById('boss-intro-modal');
                        if (introEl) introEl.classList.remove('hidden');
                        return;
                    }
                }
            }

            if (Math.hypot(monster.x - helper.x, monster.y - helper.y) < monster.radius + helper.radius) {
                mazeHelpers.splice(hIdx, 1);
                playSynthSound('player_hit');
                triggerMonsterSpeak(`Bắt được một đứa bóc phốt tao rồi!`, 130);
                continue;
            }
        }

        // Người chơi nhặt bài phốt -> Người chơi bị lộ 5s
        for (let i = papers.length - 1; i >= 0; i--) {
            let p = papers[i];
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 18) {
                papers.splice(i, 1);
                playSynthSound('collect');

                let collected = 10 - papers.length;
                let countEl = document.getElementById('paper-count');
                if (countEl) countEl.innerText = collected;

                // Tốc độ: 6.0 + 0.25 * bài phốt
                monster.speed = 6.0 + collected * 0.25;

                if (papers.length > 0) {
                    player.revealTimer = 300; // 5s lộ vị trí
                    notification.text = `⚠️ BẠN BỊ LỘ VỊ TRÍ 5 GIÂY! TỐC ĐỘ QUÁI: ${monster.speed.toFixed(1)}!`;
                    notification.timer = 150;
                    triggerMonsterSpeak(`Anh thấy em rồi ${player.name}, đừng hòng trốn!`, 130);
                } else {
                    gameState = 'BOSS_POPUP';
                    let introEl = document.getElementById('boss-intro-modal');
                    if (introEl) introEl.classList.remove('hidden');
                    return;
                }
            }
        }

        let distToPlayer = Math.hypot(player.x - monster.x, player.y - monster.y);

        if (monster.isChasing && player.revealTimer <= 0) {
            let hasLOS = hasLineOfSight(monster.x, monster.y, player.x, player.y);
            if (!hasLOS) monster.lostSightTimer++;
            else monster.lostSightTimer = 0;

            if ((!hasLOS && distToPlayer > monster.breakDistance) || monster.lostSightTimer > 90) {
                monster.isChasing = false;
                monster.currentPath = [];
                monster.patrolTarget = null;
                monster.lostSightTimer = 0;
                triggerMonsterSpeak(`Ủa, cắt đuôi lẹ dữ vậy?!`, 120);
            }
        }

        // Va chạm người chơi (Khiên hộ mệnh)
        if (monster.stunTimer <= 0 && distToPlayer < player.radius + monster.radius) {
            if (player.shields > 0) {
                player.shields--;
                monster.stunTimer = 300; // Stun 5 giây
                monster.isChasing = false;
                monster.currentPath = [];
                screenShake = 25;
                playSynthSound('shield_break');

                let pushDx = monster.x - player.x;
                let pushDy = monster.y - player.y;
                let pushDist = Math.hypot(pushDx, pushDy) || 1;
                monster.x += (pushDx / pushDist) * 55;
                monster.y += (pushDy / pushDist) * 55;

                triggerMonsterSpeak(`Á á, hoa mắt quá! Choáng rồi!`, 180);
                notification.text = `🛡️ KHIÊN HỘ MỆNH KÍCH HOẠT! TRƯỜNG GIANG BỊ CHOÁNG 5 GIÂY!`;
                notification.timer = 180;
            } else {
                isGameOver = true;
                playSynthSound('player_hit');
                showModal('BẠN ĐÃ BỊ BẮT!', `Trường Giang đã tóm được ${player.name} trong bóng tối.`);
                return;
            }
        }

        updateMonsterVisionArea();

        // Di chuyển của quái trong mê cung
        if (monster.stunTimer <= 0) {
            let mCol = Math.floor(monster.x / TILE_SIZE);
            let mRow = Math.floor(monster.y / TILE_SIZE);

            if (now - lastPathCalcTime > 150 || monster.currentPath.length === 0) {
                lastPathCalcTime = now;

                // Ưu tiên đuổi đồng minh bị lộ
                let targetChased = player;
                let helperRevealed = mazeHelpers.find(h => h.revealTimer > 0);
                if (helperRevealed && player.revealTimer <= 0) {
                    targetChased = helperRevealed;
                }

                if (monster.isChasing || player.revealTimer > 0 || helperRevealed) {
                    monster.isChasing = true;
                    let tCol = Math.floor(targetChased.x / TILE_SIZE);
                    let tRow = Math.floor(targetChased.y / TILE_SIZE);
                    monster.currentPath = findPathBFS(mCol, mRow, tCol, tRow);
                } else {
                    let needNewTarget = false;
                    if (!monster.patrolTarget || Math.hypot(monster.x - monster.patrolTarget.x, monster.y - monster.patrolTarget.y) < 35 || monster.currentPath.length === 0) {
                        needNewTarget = true;
                    }

                    if (needNewTarget) {
                        let empty = getEmptyTiles();
                        monster.patrolTarget = (papers.length > 0 && Math.random() < 0.6) 
                            ? papers[Math.floor(Math.random() * papers.length)] 
                            : empty[Math.floor(Math.random() * empty.length)];
                    }

                    if (monster.patrolTarget) {
                        let tCol = Math.floor(monster.patrolTarget.x / TILE_SIZE);
                        let tRow = Math.floor(monster.patrolTarget.y / TILE_SIZE);
                        monster.currentPath = findPathBFS(mCol, mRow, tCol, tRow);
                    }
                }
            }

            let moveSpeed = monster.isChasing ? monster.speed : (monster.speed * 0.75);

            if (monster.currentPath && monster.currentPath.length > 0) {
                let nextNode = monster.currentPath[0];
                let targetX = nextNode[0] * TILE_SIZE + TILE_SIZE / 2;
                let targetY = nextNode[1] * TILE_SIZE + TILE_SIZE / 2;
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
        }
        return;
    }

    // --- C. LOGIC GIAI ĐOẠN 2: ĐẠI CHIẾN 51 VS 51 ---
    for (let i = allyRespawnQueue.length - 1; i >= 0; i--) {
        allyRespawnQueue[i]--;
        if (allyRespawnQueue[i] <= 0) {
            allyRespawnQueue.splice(i, 1);
            if (allies.length < ALLY_COUNT) spawnSingleAlly();
        }
    }

    for (let i = fanRespawnQueue.length - 1; i >= 0; i--) {
        fanRespawnQueue[i]--;
        if (fanRespawnQueue[i] <= 0) {
            fanRespawnQueue.splice(i, 1);
            if (fans.length < FAN_COUNT) spawnSingleFan();
        }
    }

    medkitSpawnTimer++;
    if (medkitSpawnTimer > 350 && medkits.length < 6) {
        medkitSpawnTimer = 0;
        spawnMedkit();
    }

    // Nhặt túi cứu thương: Phase 1 hồi 1.500 HP, Phase 2 hồi 2.500 HP
    for (let i = medkits.length - 1; i >= 0; i--) {
        let m = medkits[i];
        if (Math.hypot(player.x - m.x, player.y - m.y) < player.radius + m.radius + 6) {
            medkits.splice(i, 1);
            let healAmount = monster.phase === 2 ? 2500 : 1500;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            playSynthSound('heal');
            notification.text = `+${healAmount} HP! MÁU HIỆN TẠI: ${player.hp}/${player.maxHp}`;
            notification.timer = 120;
        }
    }

    // Đồng minh đánh Boss hoặc Fan (50 dame)
    for (let i = allies.length - 1; i >= 0; i--) {
        let ally = allies[i];
        if (ally.attackCooldown > 0) ally.attackCooldown--;

        let enemyPool = [monster, ...fans];
        enemyPool.sort((a, b) => Math.hypot(a.x - ally.x, a.y - ally.y) - Math.hypot(b.x - ally.x, b.y - ally.y));
        let tgt = enemyPool[0];

        if (tgt) {
            let dx = tgt.x - ally.x;
            let dy = tgt.y - ally.y;
            let dist = Math.hypot(dx, dy);

            if (dist > tgt.radius + ally.radius) {
                moveEntitySliding(ally, (dx / dist) * ally.speed, (dy / dist) * ally.speed);
            } else if (ally.attackCooldown <= 0) {
                ally.attackCooldown = 50;
                let actualDmg = (tgt === monster && monster.isShielded) ? 25 : 50;
                tgt.hp -= actualDmg;
                addHitVisual(tgt.x, tgt.y, false);
                playSynthSound('ally_hit');
            }
        }
    }

    // Fan trung thành đánh Người chơi hoặc Đồng minh (50 dame)
    for (let i = fans.length - 1; i >= 0; i--) {
        let fan = fans[i];
        if (fan.attackCooldown > 0) fan.attackCooldown--;

        let playerPool = [player, ...allies];
        playerPool.sort((a, b) => Math.hypot(a.x - fan.x, a.y - fan.y) - Math.hypot(b.x - fan.x, b.y - fan.y));
        let tgt = playerPool[0];

        if (tgt) {
            let dx = tgt.x - fan.x;
            let dy = tgt.y - fan.y;
            let dist = Math.hypot(dx, dy);

            if (dist > tgt.radius + fan.radius) {
                moveEntitySliding(fan, (dx / dist) * fan.speed, (dy / dist) * fan.speed);
            } else if (fan.attackCooldown <= 0) {
                fan.attackCooldown = 50;
                if (tgt === player) {
                    if (player.invulnerableTimer <= 0) {
                        player.hp -= 50;
                        player.invulnerableTimer = 35;
                        addHitVisual(player.x, player.y, false, '-50', '#ef4444');
                        playSynthSound('player_hit');
                    }
                } else {
                    tgt.hp -= 50;
                    addHitVisual(tgt.x, tgt.y, false, '-50', '#ef4444');
                }
            }
        }
    }

    // SỬA LỖI ĐÁNH FAN: Người chơi tấn công thường trúng cả Boss lẫn Fan trung thành
    if (player.attackCooldown <= 0) {
        // Tấn công Boss
        let distPtoM = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distPtoM <= player.radius + monster.radius + 8) {
            player.attackCooldown = 26;
            let actualDmg = monster.isShielded ? Math.floor(player.damage / 2) : player.damage;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            screenShake = 16;
            addHitVisual(monster.x, monster.y, true);
            playSynthSound('player_hit');
        }

        // Tấn công Fan trung thành lân cận
        for (let fan of fans) {
            if (Math.hypot(player.x - fan.x, player.y - fan.y) <= player.radius + fan.radius + 8) {
                player.attackCooldown = 26;
                fan.hp -= player.damage; // Tiêu diệt Fan ngay
                addHitVisual(fan.x, fan.y, true, `-${player.damage} 💥`, '#facc15');
                playSynthSound('player_hit');
                break;
            }
        }
    }

    // Kích hoạt Phase 2 Mười Khó
    if (monster.phase === 1 && monster.hp <= 0) {
        monster.phase = 2;
        monster.name = 'Mười Khó';
        monster.hp = 10000;
        monster.maxHp = 10000;
        monster.damage = 180;
        monster.speed = 5.6;

        player.hp = 10000;
        player.maxHp = 10000;
        player.damage = 180;

        screenShake = 45;
        playSynthSound('phase_change');
        triggerMonsterSpeak(`MƯỜI KHÓ XUẤT TRẬN! CẢ HAI TA CÙNG TOÀN LỰC!`, 220);

        notification.text = '🔥 PHASE 2: CẢ BẠN VÀ MƯỜI KHÓ ĐỀU TĂNG LÊN 10.000 HP & 180 DAME! TÚI MÁU HỒI 2500 HP!';
        notification.timer = 240;

        let statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.innerText = '🔥 PHASE 2 ĐẠI CHIẾN: BẠN & MƯỜI KHÓ CÙNG BỨT PHÁ 10.000 HP!';
            statusEl.style.color = '#ef4444';
        }
    }

    // AI của Boss
    let bossTargets = [player, ...allies];
    bossTargets.sort((a, b) => Math.hypot(a.x - monster.x, a.y - monster.y) - Math.hypot(b.x - monster.x, b.y - monster.y));
    let primaryTarget = bossTargets[0];
    let nearbyEnemies = bossTargets.filter(t => Math.hypot(t.x - monster.x, t.y - monster.y) < 160).length;

    if (primaryTarget) {
        let bDx = primaryTarget.x - monster.x;
        let bDy = primaryTarget.y - monster.y;
        let bDist = Math.hypot(bDx, bDy);

        if (monster.postAttackPause > 0) {
            monster.postAttackPause--;
        } else if (!monster.isDashing && bDist > 1) {
            monster.angle = Math.atan2(bDy, bDx);
            moveEntitySliding(monster, (bDx / bDist) * monster.speed, (bDy / bDist) * monster.speed);
        }

        if (bDist <= monster.radius + primaryTarget.radius + 6 && monster.attackCooldown <= 0) {
            if (primaryTarget === player) {
                if (player.invulnerableTimer <= 0) {
                    player.hp -= monster.damage;
                    player.invulnerableTimer = 60;
                    monster.attackCooldown = 65;
                    monster.postAttackPause = 24;
                    screenShake = 20;
                    playSynthSound('player_hit');

                    let knockDx = player.x - monster.x;
                    let knockDy = player.y - monster.y;
                    let kDist = Math.hypot(knockDx, knockDy) || 1;
                    moveEntitySliding(player, (knockDx / kDist) * 45, (knockDy / kDist) * 45);
                }
            } else {
                primaryTarget.hp -= monster.damage;
                monster.attackCooldown = 40;
                playSynthSound('player_hit');
                let knockDx = primaryTarget.x - monster.x;
                let knockDy = primaryTarget.y - monster.y;
                let kDist = Math.hypot(knockDx, knockDy) || 1;
                moveEntitySliding(primaryTarget, (knockDx / kDist) * 30, (knockDy / kDist) * 30);
            }
        }
    }

    // SKILL 3: GIẢM SỨC MẠNH TẨY TRẮNG (Phase 1 hồi 1.000 HP, Phase 2 hồi 1.500 HP)
    monster.skill3Cooldown--;
    if (monster.hp < monster.maxHp * 0.7 && monster.skill3Cooldown <= 0) {
        monster.skill3Cooldown = 750;
        monster.isShielded = true;
        monster.shieldTimer = 240;
        let healAmt = monster.phase === 2 ? 1500 : 1000; // ĐÃ GIẢM SỨC MẠNH CÂN BẰNG
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmt);
        playSynthSound('heal');
        triggerMonsterSpeak(monster.phase === 2 ? `Mười Khó Hồi Năng Lượng!` : `Anh Tẩy Trắng một chút thôi!`, 130);
    }

    // SKILL 2: SÓNG GIÓ THỊ PHI
    monster.skill2Cooldown--;
    if ((nearbyEnemies >= 3 || Math.hypot(player.x - monster.x, player.y - monster.y) < 110) && monster.skill2Cooldown <= 0) {
        monster.skill2Cooldown = 520;
        monster.shockwaveActive = true;
        monster.shockwaveRadius = 10;
        playSynthSound('boss_skill');
        triggerMonsterSpeak(monster.phase === 2 ? `Đại Sóng Gió Quét Sạch!` : `Sóng gió thị phi nổi lên!`, 110);
    }

    if (monster.shockwaveActive) {
        monster.shockwaveRadius += (monster.phase === 2 ? 14 : 10);
        let maxWave = monster.phase === 2 ? 350 : 280;
        for (let target of bossTargets) {
            let d = Math.hypot(target.x - monster.x, target.y - monster.y);
            if (Math.abs(d - monster.shockwaveRadius) < 16) {
                let waveDmg = monster.phase === 2 ? 250 : 150;
                if (target === player) {
                    if (player.invulnerableTimer <= 0) {
                        player.hp -= waveDmg;
                        player.invulnerableTimer = 45;
                    }
                } else {
                    target.hp -= waveDmg;
                }
            }
        }
        if (monster.shockwaveRadius > maxWave) monster.shockwaveActive = false;
    }

    // SKILL 1: VỖ MẶT
    monster.skill1Cooldown--;
    if (primaryTarget && Math.hypot(primaryTarget.x - monster.x, primaryTarget.y - monster.y) < 180 && monster.skill1Cooldown <= 0) {
        monster.skill1Cooldown = 300;
        monster.singleStrikeTarget = { x: primaryTarget.x, y: primaryTarget.y };
        monster.singleStrikeTimer = 25;
        let strikeDmg = monster.phase === 2 ? 350 : 200;
        if (primaryTarget === player) {
            if (player.invulnerableTimer <= 0) {
                player.hp -= strikeDmg;
                player.invulnerableTimer = 50;
            }
        } else {
            primaryTarget.hp -= strikeDmg;
        }
        screenShake = 22;
        playSynthSound('boss_skill');
        triggerMonsterSpeak(monster.phase === 2 ? `Mười Khó Vỗ Mặt Tối Thượng!` : `Nhận lấy cú vỗ mặt này!`, 90);
    }
    if (monster.singleStrikeTimer > 0) monster.singleStrikeTimer--;

    // SKILL PHASE 2: LƯỚT CHÉM, BÃO ĐĨA BAY, HỐ ĐEN
    if (monster.phase === 2) {
        monster.phase2DashCooldown--;
        if (primaryTarget && Math.hypot(primaryTarget.x - monster.x, primaryTarget.y - monster.y) > 250 && monster.phase2DashCooldown <= 0 && !monster.isDashing) {
            monster.phase2DashCooldown = 320;
            monster.isDashing = true;
            monster.dashTimer = 22;
            monster.dashTarget = { x: primaryTarget.x, y: primaryTarget.y };
            playSynthSound('boss_skill');
            triggerMonsterSpeak(`Lướt chém thần tốc!`, 90);
        }

        if (monster.isDashing) {
            monster.dashTimer--;
            let dDx = monster.dashTarget.x - monster.x;
            let dDy = monster.dashTarget.y - monster.y;
            let dDist = Math.hypot(dDx, dDy);
            if (dDist > 10 && monster.dashTimer > 0) {
                moveEntitySliding(monster, (dDx / dDist) * 15, (dDy / dDist) * 15);
                for (let t of bossTargets) {
                    if (Math.hypot(t.x - monster.x, t.y - monster.y) < monster.radius + t.radius + 10) {
                        if (t === player) {
                            if (player.invulnerableTimer <= 0) player.hp -= 4;
                        } else {
                            t.hp -= 4;
                        }
                    }
                }
            } else {
                monster.isDashing = false;
            }
        }

        monster.phase2RadialCooldown--;
        if (monster.phase2RadialCooldown <= 0) {
            monster.phase2RadialCooldown = 420;
            playSynthSound('boss_skill');
            triggerMonsterSpeak(`Mưa đĩa bay nộ khí!`, 100);
            for (let i = 0; i < 12; i++) {
                let angle = (i * Math.PI) / 6;
                bossProjectiles.push({
                    x: monster.x,
                    y: monster.y,
                    vx: Math.cos(angle) * 7.0,
                    vy: Math.sin(angle) * 7.0,
                    radius: 8,
                    life: 140
                });
            }
        }

        monster.phase2VortexCooldown--;
        if (monster.phase2VortexCooldown <= 0) {
            monster.phase2VortexCooldown = 650;
            monster.vortexActive = true;
            monster.vortexTimer = 90;
            playSynthSound('boss_skill');
            triggerMonsterSpeak(`Hố Đen Thị Phi: Tất cả quy tụ về đây!`, 120);
        }

        if (monster.vortexActive) {
            monster.vortexTimer--;
            for (let t of bossTargets) {
                let vDx = monster.x - t.x;
                let vDy = monster.y - t.y;
                let vDist = Math.hypot(vDx, vDy);
                if (vDist > 30) {
                    moveEntitySliding(t, (vDx / vDist) * 2.8, (vDy / vDist) * 2.8);
                }
            }
            if (monster.vortexTimer <= 0) {
                monster.vortexActive = false;
                screenShake = 30;
                playSynthSound('player_hit');
                for (let t of bossTargets) {
                    if (Math.hypot(t.x - monster.x, t.y - monster.y) < 180) {
                        if (t === player) {
                            if (player.invulnerableTimer <= 0) {
                                player.hp -= 200;
                                player.invulnerableTimer = 50;
                            }
                        } else {
                            t.hp -= 200;
                        }
                    }
                }
            }
        }
    }

    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
        let proj = bossProjectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;

        if (Math.hypot(proj.x - player.x, proj.y - player.y) < proj.radius + player.radius) {
            if (player.invulnerableTimer <= 0) {
                player.hp -= 120;
                player.invulnerableTimer = 40;
                playSynthSound('player_hit');
                screenShake = 14;
            }
            bossProjectiles.splice(i, 1);
            continue;
        }

        for (let ally of allies) {
            if (Math.hypot(proj.x - ally.x, proj.y - ally.y) < proj.radius + ally.radius) {
                ally.hp -= 120;
                bossProjectiles.splice(i, 1);
                break;
            }
        }

        if (proj.life <= 0) bossProjectiles.splice(i, 1);
    }

    // Xử lý tử trận
    for (let i = allies.length - 1; i >= 0; i--) {
        if (allies[i].hp <= 0) {
            allies.splice(i, 1);
            allyRespawnQueue.push(RESPAWN_DELAY_FRAMES);
        }
    }

    for (let i = fans.length - 1; i >= 0; i--) {
        if (fans[i].hp <= 0) {
            fans.splice(i, 1);
            fanRespawnQueue.push(RESPAWN_DELAY_FRAMES);
        }
    }

    // Cập nhật UI
    let hpUi = document.getElementById('player-hp-ui');
    if (hpUi) hpUi.innerText = Math.max(0, player.hp);
    let badgeStatusMode = document.getElementById('badge-status-mode');
    if (badgeStatusMode) badgeStatusMode.innerHTML = `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b> vs Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;

    if (player.hp <= 0) {
        isGameOver = true;
        playSynthSound('player_hit');
        try { bossBgmAudio.pause(); } catch(e){}
        showModal('BẠN ĐÃ THẤT BẠI!', 'Bạn đã bị hạ gục tại Đấu trường.');
        return;
    }

    if (monster.phase === 2 && monster.hp <= 0) {
        isVictory = true;
        playSynthSound('win');
        try { bossBgmAudio.pause(); } catch(e){}
        showModal('CHIẾN THẮNG TUYỆT ĐỐI!', 'bạn và cộng đồng mạng đã đánh bại trường giang');
        return;
    }
}

// ======================= 10. VẼ ĐỒ HỌA & MŨI TÊN CHỈ BOSS ĐẤU TRƯỜNG =======================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) return;

    let pX = player.x || 120;
    let pY = player.y || 120;
    let mX = monster.x || 2600;
    let mY = monster.y || 2600;

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
                ctx.fillStyle = gameState === 'ARENA' ? (monster.phase === 2 ? '#1a0d17' : '#0f172a') : '#0b1329';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = monster.phase === 2 ? '#3b122d' : '#1e293b';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // --- B. VẼ VẬT PHẨM MÊ CUNG ---
    if (gameState === 'MAZE') {
        let itemFloat = Math.sin(Date.now() / 160) * 3;
        for (let item of mazeItems) {
            ctx.save();
            ctx.translate(item.x, item.y + itemFloat);

            if (item.type === 'shield') {
                ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0284c7';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(10, -6);
                ctx.lineTo(8, 6);
                ctx.lineTo(0, 12);
                ctx.lineTo(-8, 6);
                ctx.lineTo(-10, -6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText('🛡️', 0, 4);
            } else if (item.type === 'phone') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#7e22ce';
                ctx.strokeStyle = '#fbc531';
                ctx.lineWidth = 1.8;
                ctx.fillRect(-7, -12, 14, 24);
                ctx.strokeRect(-7, -12, 14, 24);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-4, -8, 8, 14);

                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('📱', 0, 4);
            } else if (item.type === 'detector') {
                ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.stroke();

                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText('📡', 0, 4);
            }
            ctx.restore();
        }
    }

    // --- C. VẼ ĐỒNG MINH TRONG MÊ CUNG ---
    if (gameState === 'MAZE') {
        for (let helper of mazeHelpers) {
            ctx.save();
            ctx.translate(helper.x, helper.y);

            if (helper.revealTimer > 0) {
                let pingR = 20 + (300 - helper.revealTimer) % 25;
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, pingR, 0, Math.PI * 2);
                ctx.stroke();

                ctx.font = 'bold 10px sans-serif';
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'center';
                ctx.fillText('⚠️ BỊ LỘ!', 0, -helper.radius - 8);
            }

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, helper.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.fillText('CĐM', 0, 3);
            ctx.restore();
        }
    }

    // --- D. VẼ NÓN TẦM NHÌN TRONG MÊ CUNG ---
    if (gameState === 'MAZE' && monster.visionPolygon && monster.visionPolygon.length > 0) {
        ctx.save();
        let baseColor = monster.isChasing ? '239, 68, 68' : '14, 165, 233';
        let grad = ctx.createRadialGradient(mX, mY, 15, mX, mY, monster.visionRange);
        grad.addColorStop(0, `rgba(${baseColor}, ${monster.isChasing ? 0.45 : 0.22})`);
        grad.addColorStop(0.7, `rgba(${baseColor}, ${monster.isChasing ? 0.2 : 0.1})`);
        grad.addColorStop(1, `rgba(${baseColor}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(mX, mY);
        for (let pt of monster.visionPolygon) ctx.lineTo(pt.x, pt.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(${baseColor}, 0.55)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // --- E. VẼ BÀI PHỐT (MÊ CUNG) ---
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

    // --- F. VẼ SỢI CHỈ ĐỎ TRUY ĐUỔI TRONG MÊ CUNG ---
    if (gameState === 'MAZE' && monster.isChasing) {
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(mX, mY);
        let midX = (mX + pX) / 2 + (Math.random() - 0.5) * 6;
        let midY = (mY + pY) / 2 + (Math.random() - 0.5) * 6;
        ctx.quadraticCurveTo(midX, midY, pX, pY);
        ctx.stroke();
        ctx.restore();
    }

    // --- G. VẼ TÚI CỨU THƯƠNG [+] XANH (ĐẤU TRƯỜNG) ---
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

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(m.x - 2.5, m.y - 8, 5, 16);
            ctx.fillRect(m.x - 8, m.y - 2.5, 16, 5);
            ctx.restore();
        }
    }

    // --- H. VẼ CHIÊU THỨC BOSS ---
    for (let proj of bossProjectiles) {
        ctx.save();
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    if (gameState === 'ARENA') {
        if (monster.vortexActive) {
            ctx.save();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(mX, mY, 180, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (monster.shockwaveActive) {
            ctx.save();
            ctx.strokeStyle = monster.phase === 2 ? 'rgba(239, 68, 68, 0.95)' : 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = monster.phase === 2 ? 8 : 6;
            ctx.beginPath();
            ctx.arc(mX, mY, monster.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (monster.singleStrikeTimer > 0 && monster.singleStrikeTarget) {
            ctx.save();
            ctx.strokeStyle = monster.phase === 2 ? '#ef4444' : '#f87171';
            ctx.lineWidth = monster.phase === 2 ? 8 : 5;
            ctx.beginPath();
            ctx.moveTo(mX, mY);
            ctx.lineTo(monster.singleStrikeTarget.x, monster.singleStrikeTarget.y);
            ctx.stroke();
            ctx.restore();
        }

        if (monster.isShielded) {
            ctx.save();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 5;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(mX, mY, monster.radius + 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- I. VẼ QUÂN ĐOÀN 51 VS 51 ---
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

        for (let fan of fans) {
            ctx.save();
            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.arc(fan.x, fan.y, fan.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 2;
            ctx.stroke();

            let bW = 24, bH = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(fan.x - bW / 2, fan.y - fan.radius - 8, bW, bH);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(fan.x - bW / 2, fan.y - fan.radius - 8, (fan.hp / fan.maxHp) * bW, bH);
            ctx.restore();
        }
    }

    // --- K. VẼ QUÁI VẬT / BOSS ---
    ctx.save();
    ctx.translate(mX, mY);

    let currentBossImg = (monster.phase === 2 && bossPhase2Image.complete && bossPhase2Image.naturalWidth > 0)
        ? bossPhase2Image
        : (monsterImage.complete && monsterImage.naturalWidth > 0 ? monsterImage : null);

    if (currentBossImg) {
        if (monster.phase === 2) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 24;
        }
        ctx.drawImage(currentBossImg, -monster.radius, -monster.radius, monster.radius * 2, monster.radius * 2);
    } else {
        ctx.fillStyle = monster.phase === 2 ? '#b91c1c' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, monster.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = monster.phase === 2 ? '#facc15' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    if (monster.stunTimer > 0) {
        let stunAngle = Date.now() / 80;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💫', Math.cos(stunAngle) * 22, -monster.radius - 12 + Math.sin(stunAngle) * 6);
    }
    ctx.restore();

    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = monster.phase === 2 ? '#f87171' : '#f87171';
    ctx.fillText(monster.name, mX, mY + monster.radius + 16);

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

    // --- L. VẼ NGƯỜI CHƠI ---
    ctx.save();
    ctx.translate(pX, pY);

    if (player.revealTimer > 0) {
        let pingRadius = 25 + (300 - player.revealTimer) % 35;
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, pingRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ LỘ VỊ TRÍ (${Math.ceil(player.revealTimer / 60)}s)`, 0, -player.radius - 24);
        ctx.restore();
    }

    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(player.name, 0, -player.radius - (gameState === 'ARENA' ? 16 : 8));

    if (gameState === 'ARENA') {
        let pBarW = 50, pBarH = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(-pBarW / 2, -player.radius - 12, pBarW, pBarH);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-pBarW / 2, -player.radius - 12, (player.hp / player.maxHp) * pBarW, pBarH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-pBarW / 2, -player.radius - 12, pBarW, pBarH);
    }

    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.4;
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

    if (gameState === 'MAZE' && player.shields > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    // --- M. MŨI TÊN LA BÀN CHỈ BÀI PHỐT (MÊ CUNG) & CHỈ BOSS (ĐẤU TRƯỜNG) ---
    if (gameState === 'MAZE' && player.hasDetector && papers.length > 0) {
        let nearestPaper = null;
        let minDistance = Infinity;

        for (let p of papers) {
            let distToP = Math.hypot(p.x - pX, p.y - pY);
            if (distToP < minDistance) {
                minDistance = distToP;
                nearestPaper = p;
            }
        }

        for (let p of papers) {
            let isNearest = (p === nearestPaper);
            let angleToPaper = Math.atan2(p.y - pY, p.x - pX);
            let orbitDist = isNearest ? (player.radius + 32 + Math.sin(Date.now() / 140) * 3) : (player.radius + 24);

            let arrowX = pX + Math.cos(angleToPaper) * orbitDist;
            let arrowY = pY + Math.sin(angleToPaper) * orbitDist;

            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angleToPaper);

            if (isNearest) {
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#f59e0b';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.8;

                ctx.beginPath();
                ctx.moveTo(11, 0);
                ctx.lineTo(-7, -7);
                ctx.lineTo(-3, 0);
                ctx.lineTo(-7, 7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(7, 0);
                ctx.lineTo(-5, -4);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-5, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
    } else if (gameState === 'ARENA') {
        // MŨI TÊN CHỈ VỊ TRÍ TRƯỜNG GIANG TRONG ĐẤU TRƯỜNG 51 VS 51
        let angleToBoss = Math.atan2(mY - pY, mX - pX);
        let orbitDist = player.radius + 36 + Math.sin(Date.now() / 120) * 3;
        let arrowX = pX + Math.cos(angleToBoss) * orbitDist;
        let arrowY = pY + Math.sin(angleToBoss) * orbitDist;

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angleToBoss);

        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // --- N. VẼ HIỆU ỨNG ĐÁNH TRÚNG ---
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

    ctx.restore();

    // --- O. ÁNH SÁNG ĐÈN PIN TRONG MÊ CUNG ---
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

    // --- P. TRẠNG THÁI VẬT PHẨM TRÊN MÀN HÌNH MÊ CUNG ---
    if (gameState === 'MAZE') {
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`🛡️ Khiên: ${player.shields}/3`, 20, 85);
        ctx.fillText(`📡 Máy dò: ${player.hasDetector ? 'ĐÃ BẬT' : 'CHƯA CÓ'}`, 20, 105);
        ctx.restore();
    }

    // --- Q. THANH MÁU BOSS HUD TRÊN MOBILE ---
    if (gameState === 'ARENA') {
        ctx.save();
        let barW = Math.min(520, canvas.width - 32);
        let barH = 16;
        let barX = (canvas.width - barW) / 2;
        let barY = 95;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.fillRect(barX - 6, barY - 22, barW + 12, barH + 28);
        ctx.strokeStyle = monster.phase === 2 ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 6, barY - 22, barW + 12, barH + 28);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = monster.phase === 2 ? '#f87171' : '#fde047';
        ctx.textAlign = 'left';
        let bossTitle = monster.phase === 2 ? '🔥 BOSS: MƯỜI KHÓ (PHASE 2 - NỘ KHÍ)' : '👑 BOSS: TRƯỜNG GIANG (PHASE 1)';
        ctx.fillText(bossTitle, barX, barY - 7);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${monster.hp} / ${monster.maxHp} HP`, barX + barW, barY - 7);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barW, barH);

        let currentHpRatio = Math.max(0, monster.hp / monster.maxHp);
        ctx.fillStyle = monster.isShielded
            ? '#fbbf24'
            : (monster.phase === 2 ? '#dc2626' : '#ea580c');
        ctx.fillRect(barX, barY, currentHpRatio * barW, barH);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.lineWidth = 1;
        for (let s = 1; s < 10; s++) {
            ctx.beginPath();
            ctx.moveTo(barX + (barW / 10) * s, barY);
            ctx.lineTo(barX + (barW / 10) * s, barY + barH);
            ctx.stroke();
        }
        ctx.restore();
    }

    // --- R. BANNER THÔNG BÁO ---
    if (notification.timer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        let bannerW = Math.min(520, canvas.width - 32);
        let bannerH = 40;
        let bx = (canvas.width - bannerW) / 2;
        let by = gameState === 'ARENA' ? 150 : 75;
        ctx.fillRect(bx, by, bannerW, bannerH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bannerW, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(notification.text, canvas.width / 2, by + 25);
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
