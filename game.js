/**
 * TRÒ CHƠI: SÔNG DÀI MAZE - DARK DECEPTION EDITION
 * File: game.js
 * Cập nhật:
 * 1. Vật lý di chuyển mới (Circle-Tile Depenetration): Trượt tường và bo góc cua siêu mượt ở mọi góc độ.
 * 2. Phân thân & Đồng minh có đặc tính giống hệt người chơi: Quái không phân biệt được thật/giả, phải tự chọn mục tiêu.
 * 3. Cơ chế Quái khắc chế Phân thân/Đồng minh:
 *    - Kỹ năng "Tiếng Gầm Phá Ảo Ảnh": Sóng âm hủy diệt phân thân trong bán kính 480px và làm choáng phân thân ở xa.
 *    - Nội tại "Cuồng Nộ Phẫn Uất": Khi bắt nhầm phân thân, quái tăng tốc mạnh trong 5 giây.
 */

// ======================= 1. TÀI NGUYÊN HÌNH ẢNH & ÂM THANH =======================
const ASSETS = {
    monsterImg: 'assets/monster.jpg',
    bossPhase2Img: 'assets/boss_phase2.jpg',
    darkBgmPrimary: 'assets/dark_bgm.mp3',
    darkBgmSecondary: 'dark_bgm.mp3',
    monsterSoundPrimary: 'assets/bgm.mp3',
    monsterSoundSecondary: 'bgm.mp3',
    bossBgmPrimary: 'assets/boss_bgm.mp3',
    bossBgmSecondary: 'boss_bgm.mp3'
};

const monsterImage = new Image();
monsterImage.src = ASSETS.monsterImg;

const bossPhase2Image = new Image();
bossPhase2Image.src = ASSETS.bossPhase2Img;

// Nhạc nền u tối cho Mê Cung
let darkBgmAudio = new Audio(ASSETS.darkBgmPrimary);
darkBgmAudio.loop = true;
darkBgmAudio.volume = 0.5;
darkBgmAudio.addEventListener('error', () => {
    if (darkBgmAudio.src.includes('assets/dark_bgm.mp3')) {
        darkBgmAudio.src = ASSETS.darkBgmSecondary;
        darkBgmAudio.load();
    }
});

// Âm thanh của Quái vật trong Mê Cung (bgm.mp3)
let monsterAudio = new Audio(ASSETS.monsterSoundPrimary);
monsterAudio.loop = true;
monsterAudio.volume = 0;
monsterAudio.addEventListener('error', () => {
    if (monsterAudio.src.includes('assets/bgm.mp3')) {
        monsterAudio.src = ASSETS.monsterSoundSecondary;
        monsterAudio.load();
    }
});

// Nhạc nền Đấu trường Boss
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
let heartbeatTimer = 0;

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
        bossBgmAudio.pause();
        let p = darkBgmAudio.play();
        if (p !== undefined) {
            p.catch(() => {
                const unlock = () => {
                    darkBgmAudio.play().catch(() => {});
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
        darkBgmAudio.pause();
        monsterAudio.pause();
        monsterAudio.currentTime = 0;
        initAudioContext();
        bossBgmAudio.currentTime = 0;
        bossBgmAudio.play().catch(() => {});
    } catch (e) {}
}

function updateMonsterProximityAudio(dist) {
    if (gameState !== 'MAZE') {
        if (!monsterAudio.paused) monsterAudio.pause();
        return;
    }

    const maxHearDist = 1100;
    if (dist < maxHearDist) {
        let intensity = Math.max(0, 1.0 - (dist / maxHearDist));
        let targetVol = Math.min(1.0, Math.pow(intensity, 1.2));
        monsterAudio.volume = targetVol;

        if (monsterAudio.paused && targetVol > 0.05) {
            monsterAudio.play().catch(() => {});
        }

        heartbeatTimer++;
        let beatInterval = Math.max(16, Math.floor(65 - intensity * 45));
        if (heartbeatTimer >= beatInterval && audioCtx) {
            heartbeatTimer = 0;
            try {
                let now = audioCtx.currentTime;
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(55 + intensity * 25, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

                let vol = 0.15 + intensity * 0.4;
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

                osc.start(now);
                osc.stop(now + 0.12);
            } catch (e) {}
        }
    } else {
        monsterAudio.volume = 0;
    }
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
        } else if (type === 'clone') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.22);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'roar') {
            // Âm thanh Tiếng Gầm Phá Ảo Ảnh của Quái
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.55);
            gain.gain.setValueAtTime(0.55, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
            osc.start(now);
            osc.stop(now + 0.55);
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
        } else if (type === 'dash' || type === 'teleport') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(750, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'dbz_clash') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'kamehameha') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.linearRampToValueAtTime(320, now + 0.6);
            gain.gain.setValueAtTime(0.65, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (type === 'phase_change') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.linearRampToValueAtTime(700, now + 1.0);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
            osc.start(now);
            osc.stop(now + 1.0);
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

// ======================= 3. BẢN ĐỒ MÊ CUNG 91x91 & HÀNH LANG RỘNG 84px =======================
const TILE_SIZE = 84;
const COLS = 91;        
const ROWS = 91;        
let maze = [];
let screenShake = 0;

const BFS_TOTAL_TILES = COLS * ROWS;
const bfsVisited = new Uint8Array(BFS_TOTAL_TILES);
const bfsParentC = new Int16Array(BFS_TOTAL_TILES);
const bfsParentR = new Int16Array(BFS_TOTAL_TILES);
const bfsQueueC = new Int16Array(BFS_TOTAL_TILES);
const bfsQueueR = new Int16Array(BFS_TOTAL_TILES);

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

    // Đục thông 20% tường phụ để tạo nhiều ngã rẽ và hành lang rộng
    for (let r = 2; r < rows - 2; r++) {
        for (let c = 2; c < cols - 2; c++) {
            if (grid[r][c] === 1 && Math.random() < 0.20) grid[r][c] = 0;
        }
    }

    // Đục thông vùng 4x4 góc dưới bên phải cho Trường Giang
    for (let r = rows - 6; r <= rows - 2; r++) {
        for (let c = cols - 6; c <= cols - 2; c++) {
            grid[r][c] = 0;
        }
    }
    grid[rows - 7][cols - 4] = 0;
    grid[rows - 8][cols - 4] = 0;
    grid[rows - 4][cols - 7] = 0;
    grid[rows - 4][cols - 8] = 0;

    return grid;
}

const ARENA_SIZE = 35;
let arenaBounds = { minC: 0, maxC: 0, minR: 0, maxR: 0 };

function collapseMazeToArena() {
    let midC = Math.floor(COLS / 2);
    let midR = Math.floor(ROWS / 2);
    let half = Math.floor(ARENA_SIZE / 2);

    arenaBounds.minC = midC - half;
    arenaBounds.maxC = midC + half;
    arenaBounds.minR = midR - half;
    arenaBounds.maxR = midR + half;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (r > arenaBounds.minR && r < arenaBounds.maxR && c > arenaBounds.minC && c < arenaBounds.maxC) {
                maze[r][c] = 0;
            } else {
                maze[r][c] = 1;
            }
        }
    }

    player.x = midC * TILE_SIZE;
    player.y = (midR + 8) * TILE_SIZE;

    monster.x = midC * TILE_SIZE;
    monster.y = (midR - 8) * TILE_SIZE;

    screenShake = 45;
}

function getEmptyTiles() {
    let empty = [];
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (r >= ROWS - 6 && c >= COLS - 6) continue;
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

    bfsVisited.fill(0);
    bfsParentC.fill(-1);
    bfsParentR.fill(-1);

    let head = 0;
    let tail = 0;

    bfsQueueC[tail] = startC;
    bfsQueueR[tail] = startR;
    tail++;

    let startIdx = startR * COLS + startC;
    bfsVisited[startIdx] = 1;

    let found = false;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (head < tail) {
        let currC = bfsQueueC[head];
        let currR = bfsQueueR[head];
        head++;

        if (currC === targetC && currR === targetR) {
            found = true;
            break;
        }

        for (let i = 0; i < 4; i++) {
            let nc = currC + dirs[i][0];
            let nr = currR + dirs[i][1];

            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && maze[nr] && maze[nr][nc] === 0) {
                let nIdx = nr * COLS + nc;
                if (!bfsVisited[nIdx]) {
                    bfsVisited[nIdx] = 1;
                    bfsParentC[nIdx] = currC;
                    bfsParentR[nIdx] = currR;
                    bfsQueueC[tail] = nc;
                    bfsQueueR[tail] = nr;
                    tail++;
                }
            }
        }
    }

    if (!found) return [];

    let path = [];
    let c = targetC, r = targetR;
    while (c !== startC || r !== startR) {
        path.unshift([c, r]);
        let idx = r * COLS + c;
        let prevC = bfsParentC[idx];
        let prevR = bfsParentR[idx];
        c = prevC;
        r = prevR;
    }
    return path;
}

// ======================= 4. ĐỐI TƯỢNG VÀ THỰC THỂ =======================
let gameState = 'MAZE';

let player = {
    name: 'Người Chơi',
    color: '#00a8ff',
    x: 126,
    y: 126,
    radius: 14,
    baseSpeed: 7.2,
    speed: 7.2,
    speedTier: 0,
    angle: 0,
    hp: 10000,
    maxHp: 10000,
    damage: 100,
    attackCooldown: 0,
    revealTimer: 0,
    invulnerableTimer: 0,
    shields: 0,
    arenaPapersCollected: 0,

    // KỸ NĂNG PHÂN THÂN
    cloneCooldown: 0,
    clonesToSpawn: 0,
    cloneSpawnDelay: 0,

    // KỸ NĂNG ĐẤU TRƯỜNG
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashDx: 0,
    dashDy: 0,
    aoeCooldown: 0,
    healCooldown: 0
};

let monster = {
    phase: 1,
    name: 'Trường Giang',
    x: 0,
    y: 0,
    radius: 16,
    baseSpeed: 6.2,
    speed: 6.2,
    visionRange: 550,
    breakDistance: 450,
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

    hasKiAura: false,
    kiParticles: [],

    // HỆ THỐNG KHẮC CHẾ PHÂN THÂN & LỰA CHỌN MỤC TIÊU TRONG MÊ CUNG
    lockedTarget: null,      // Mục tiêu đang bị khóa (Quái không biết thật hay giả)
    roarCooldown: 840,       // Tiếng Gầm Phá Ảo Ảnh (14 giây = 840 frames)
    roarWaveRadius: 0,
    roarWaveActive: false,
    enrageTimer: 0,          // Cuồng Nộ tăng tốc khi bắt nhầm phân thân (5 giây = 300 frames)

    // AI TUẦN TRA QUANH BÀI PHỐT
    patrolPaperTarget: null,
    patrolInspectTimer: 0,

    skill1Cooldown: 280,
    skill2Cooldown: 500,
    skill3Cooldown: 700,

    teleportCooldown: 360,
    kiBlastCooldown: 260,
    kamehamehaCooldown: 550,
    kameChargingTimer: 0,
    kameBeamTimer: 0,
    kameAngle: 0,

    shockwaveRadius: 0,
    shockwaveActive: false,
    singleStrikeTarget: null,
    singleStrikeTimer: 0,

    isChasing: false,
    patrolTarget: null,
    currentPath: []
};

let arenaPapers = [];
let allyProjectiles = [];
let bossKiBlasts = [];

let allies = [];
let allyRespawnQueue = [];
let fans = [];
let fanRespawnQueue = [];

const RESPAWN_DELAY_FRAMES = 1800;

let mazeItems = [];
let mazeHelpers = [];
let medkits = [];
let medkitSpawnTimer = 0;

let hitEffects = [];
let damageTexts = [];
let clashShockwaves = [];
let notification = { text: '', timer: 0 };
let papers = [];
let isGameOver = false;
let isVictory = false;
let isPlaying = false;

// ======================= 5. HỆ THỐNG ĐIỀU KHIỂN & KỸ NĂNG =======================
let input = { dx: 0, dy: 0, isMouseDown: false, mouseX: 0, mouseY: 0 };
let keysPressed = {};

window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    if (e.code === 'KeyF') {
        triggerPlayerClone();
    } else if (e.code === 'Space') {
        triggerPlayerDash();
    } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
        triggerPlayerAOE();
    } else if (e.code === 'KeyR') {
        triggerPlayerHeal();
    }
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
});

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

function triggerPlayerClone() {
    if (gameState !== 'MAZE') return;
    if (player.cloneCooldown <= 0 && isPlaying && !isGameOver && !isVictory) {
        player.cloneCooldown = 6000; // 100 giây hồi chiêu
        player.clonesToSpawn = 5;    // 5 bản sao ra nối tiếp nhau
        player.cloneSpawnDelay = 0;

        notification.text = `👤 ĐÃ KÍCH HOẠT 5 PHÂN THÂN ĐÁNH LẠC HƯỚNG QUÁI! (HỒI CHIÊU 100S)`;
        notification.timer = 180;
    }
}

function triggerPlayerDash() {
    if (gameState !== 'ARENA') return;
    if (player.dashCooldown <= 0 && !player.isDashing && isPlaying && !isGameOver && !isVictory) {
        player.isDashing = true;
        player.dashTimer = 14;
        player.dashCooldown = 240;
        player.invulnerableTimer = 22;

        if (input.dx !== 0 || input.dy !== 0) {
            let len = Math.hypot(input.dx, input.dy);
            player.dashDx = input.dx / len;
            player.dashDy = input.dy / len;
        } else {
            player.dashDx = Math.cos(player.angle);
            player.dashDy = Math.sin(player.angle);
        }
        playSynthSound('dash');
    }
}

function triggerPlayerAOE() {
    if (gameState !== 'ARENA') return;
    if (player.aoeCooldown <= 0 && isPlaying && !isGameOver && !isVictory) {
        player.aoeCooldown = 480;
        playSynthSound('player_aoe');
        screenShake = 24;

        hitEffects.push({
            x: player.x,
            y: player.y,
            radius: 15,
            maxRadius: 240,
            lineWidth: 6,
            color: '#facc15',
            alpha: 1.0
        });

        for (let fan of fans) {
            if (Math.hypot(fan.x - player.x, fan.y - player.y) < 240) {
                fan.hp -= player.damage * 3;
                addHitVisual(fan.x, fan.y, true, `-${player.damage * 3} 💥`, '#facc15');
            }
        }

        if (gameState === 'ARENA' && Math.hypot(monster.x - player.x, monster.y - player.y) < 240) {
            let actualDmg = monster.isShielded ? Math.floor(player.damage * 1.5) : (player.damage * 3);
            monster.hp = Math.max(0, monster.hp - actualDmg);
            addHitVisual(monster.x, monster.y, true, `-${actualDmg} 💥`, '#facc15');

            if (player.arenaPapersCollected >= 5) {
                triggerDBZClash((player.x + monster.x) / 2, (player.y + monster.y) / 2);
            }
        }
    }
}

function triggerPlayerHeal() {
    if (gameState !== 'ARENA') return;
    if (player.healCooldown <= 0 && isPlaying && !isGameOver && !isVictory) {
        player.healCooldown = 600;
        player.hp = Math.min(player.maxHp, player.hp + 2500);
        playSynthSound('heal');
        notification.text = `💚 TỰ HỒI MÁU +2500 HP! HIỆN CÓ: ${Math.floor(player.hp)}/${player.maxHp}`;
        notification.timer = 120;

        hitEffects.push({
            x: player.x,
            y: player.y,
            radius: 10,
            maxRadius: 60,
            lineWidth: 4,
            color: '#22c55e',
            alpha: 1.0
        });
    }
}

const btnClone = document.getElementById('btn-skill-clone');
const btnDash = document.getElementById('btn-skill-dash');
const btnAOE = document.getElementById('btn-skill-aoe');
const btnHeal = document.getElementById('btn-skill-heal');

function bindSkillTouch(btn, action) {
    if (!btn) return;
    const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };
    btn.addEventListener('touchstart', handler, { passive: false });
    btn.addEventListener('mousedown', handler);
}
bindSkillTouch(btnClone, triggerPlayerClone);
bindSkillTouch(btnDash, triggerPlayerDash);
bindSkillTouch(btnAOE, triggerPlayerAOE);
bindSkillTouch(btnHeal, triggerPlayerHeal);

function triggerDBZClash(cx, cy) {
    playSynthSound('dbz_clash');
    screenShake = 35;

    clashShockwaves.push({
        x: cx,
        y: cy,
        radius: 20,
        maxRadius: 380,
        lineWidth: 8,
        color: '#38bdf8',
        alpha: 1.0
    });

    let pushables = [...allies, ...fans];
    for (let entity of pushables) {
        let pDx = entity.x - cx;
        let pDy = entity.y - cy;
        let pDist = Math.hypot(pDx, pDy);
        if (pDist < 380 && pDist > 1) {
            moveEntitySliding(entity, (pDx / pDist) * 75, (pDy / pDist) * 75);
        }
    }
}

// CẦN ĐIỀU KHIỂN JOYSTICK MOBILE
const joystickZone = document.getElementById('joystick-zone');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
let joystickTouchId = null;
let joystickCenter = { x: 0, y: 0 };

if (joystickZone) {
    joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        handleJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (joystickTouchId === null) return;
        for (let t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                handleJoystick(t.clientX, t.clientY);
                break;
            }
        }
    }, { passive: false });

    function resetJoystick() {
        joystickTouchId = null;
        input.dx = 0;
        input.dy = 0;
        if (joystickStick) joystickStick.style.transform = `translate(-50%, -50%)`;
    }

    window.addEventListener('touchend', (e) => {
        for (let t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });
    window.addEventListener('touchcancel', (e) => {
        for (let t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });
}

function handleJoystick(cx, cy) {
    const maxR = 55;
    let dx = cx - joystickCenter.x;
    let dy = cy - joystickCenter.y;
    let dist = Math.hypot(dx, dy);

    if (dist < 6) {
        input.dx = 0;
        input.dy = 0;
        joystickStick.style.transform = `translate(-50%, -50%)`;
        return;
    }

    let clampedDist = Math.min(dist, maxR);
    let drawX = (dx / dist) * clampedDist;
    let drawY = (dy / dist) * clampedDist;

    joystickStick.style.transform = `translate(calc(-50% + ${drawX}px), calc(-50% + ${drawY}px))`;

    // Khi kéo vượt 6px là đạt 100% tốc độ ngay để không bao giờ bị cảm giác rùa bò
    input.dx = dx / dist;
    input.dy = dy / dist;
}

// ======================= 6. VẬT LÝ TRƯỢT TƯỜNG ĐẨY VUÔNG GÓC (SIÊU MƯỢT 100%) =======================
function resolveCircleTileCollisions(entity) {
    let r = entity.radius;
    let minCol = Math.floor((entity.x - r) / TILE_SIZE);
    let maxCol = Math.floor((entity.x + r) / TILE_SIZE);
    let minRow = Math.floor((entity.y - r) / TILE_SIZE);
    let maxRow = Math.floor((entity.y + r) / TILE_SIZE);

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || !maze[row] || maze[row][col] === 1) {
                let tileL = col * TILE_SIZE;
                let tileR = tileL + TILE_SIZE;
                let tileT = row * TILE_SIZE;
                let tileB = tileT + TILE_SIZE;

                let closeX = Math.max(tileL, Math.min(entity.x, tileR));
                let closeY = Math.max(tileT, Math.min(entity.y, tileB));

                let dx = entity.x - closeX;
                let dy = entity.y - closeY;
                let distSq = dx * dx + dy * dy;

                if (distSq < r * r) {
                    let dist = Math.sqrt(distSq);
                    if (dist > 0.0001) {
                        // Đẩy hình tròn trượt mượt dọc theo cạnh tường hoặc lăn tròn qua góc tường
                        let overlap = r - dist;
                        entity.x += (dx / dist) * overlap;
                        entity.y += (dy / dist) * overlap;
                    } else {
                        entity.x += 1;
                    }
                }
            }
        }
    }
}

function moveEntitySliding(entity, vx, vy) {
    let totalDist = Math.hypot(vx, vy);
    if (totalDist === 0) return;

    // Chia nhỏ bước nếu vận tốc lớn để chống xuyên tường và trượt mượt tuyệt đối
    let steps = Math.max(1, Math.ceil(totalDist / 4));
    let stepX = vx / steps;
    let stepY = vy / steps;

    for (let s = 0; s < steps; s++) {
        entity.x += stepX;
        entity.y += stepY;
        resolveCircleTileCollisions(entity);
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    let dist = Math.hypot(x2 - x1, y2 - y1);
    let steps = Math.floor(dist / 18);
    for (let i = 1; i < steps; i++) {
        let cx = x1 + (x2 - x1) * (i / steps);
        let cy = y1 + (y2 - y1) * (i / steps);
        let col = Math.floor(cx / TILE_SIZE);
        let row = Math.floor(cy / TILE_SIZE);
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS || !maze[row] || maze[row][col] === 1) return false;
    }
    return true;
}

function castRayForVisionArea(startX, startY, angle, maxDist) {
    let step = 18;
    let curDist = 0;
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);

    while (curDist < maxDist) {
        curDist += step;
        let cx = startX + cos * curDist;
        let cy = startY + sin * curDist;
        let col = Math.floor(cx / TILE_SIZE);
        let row = Math.floor(cy / TILE_SIZE);
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS || !maze[row] || maze[row][col] === 1) {
            return { x: cx, y: cy };
        }
    }
    return { x: startX + cos * maxDist, y: startY + sin * maxDist };
}

// QUÁI QUÉT TẦM NHÌN: KHÔNG PHÂN BIỆT ĐƯỢC NGƯỜI CHƠI VÀ PHÂN THÂN/ĐỒNG MINH
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
        // Danh sách tất cả mục tiêu có đặc tính giống nhau
        let allPrey = [player, ...mazeHelpers];
        let bestVisibleTarget = null;
        let minVisibleDist = Infinity;

        for (let target of allPrey) {
            let distToT = Math.hypot(target.x - monster.x, target.y - monster.y);
            if (distToT <= monster.visionRange) {
                let angleToT = Math.atan2(target.y - monster.y, target.x - monster.x);
                let angleDiff = Math.atan2(Math.sin(angleToT - monster.angle), Math.cos(angleToT - monster.angle));

                if (Math.abs(angleDiff) <= monster.fov / 2) {
                    if (hasLineOfSight(monster.x, monster.y, target.x, target.y)) {
                        if (distToT < minVisibleDist) {
                            minVisibleDist = distToT;
                            bestVisibleTarget = target;
                        }
                    }
                }
            }
        }

        // Nếu nhìn thấy mục tiêu trong nón tầm nhìn, quái sẽ chọn mục tiêu gần nhất để đuổi!
        if (bestVisibleTarget) {
            monster.isChasing = true;
            monster.lockedTarget = bestVisibleTarget;
            monster.lostSightTimer = 0;
        }
    }
}

// ======================= 7. SPAWN QUÂN ĐOÀN & VẬT PHẨM =======================
function spawnSingleAlly(forcedType = null) {
    let midC = Math.floor(COLS / 2);
    let midR = Math.floor(ROWS / 2);
    let ax = (midC + (Math.random() - 0.5) * (ARENA_SIZE - 4)) * TILE_SIZE;
    let ay = (midR + (Math.random() - 0.5) * (ARENA_SIZE - 4)) * TILE_SIZE;

    let allyType = forcedType || (monster.phase === 2 ? (Math.random() < 0.5 ? 'melee' : 'ranged') : 'melee');

    allies.push({
        x: ax,
        y: ay,
        radius: 14,
        speed: allyType === 'melee' ? 4.2 : 3.6,
        hp: allyType === 'melee' ? 2000 : 100,
        maxHp: allyType === 'melee' ? 2000 : 100,
        damage: allyType === 'ranged' ? 1000 : 50,
        type: allyType,
        attackCooldown: 0
    });
}

function spawnSingleFan() {
    let midC = Math.floor(COLS / 2);
    let midR = Math.floor(ROWS / 2);
    let fx = (midC + (Math.random() - 0.5) * (ARENA_SIZE - 4)) * TILE_SIZE;
    let fy = (midR + (Math.random() - 0.5) * (ARENA_SIZE - 4)) * TILE_SIZE;

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
    let midC = Math.floor(COLS / 2);
    let midR = Math.floor(ROWS / 2);
    medkits.push({
        x: (midC + (Math.random() - 0.5) * (ARENA_SIZE - 6)) * TILE_SIZE,
        y: (midR + (Math.random() - 0.5) * (ARENA_SIZE - 6)) * TILE_SIZE,
        radius: 16
    });
}

function spawnArenaPapers() {
    arenaPapers = [];
    let midC = Math.floor(COLS / 2);
    let midR = Math.floor(ROWS / 2);
    for (let i = 0; i < 10; i++) {
        arenaPapers.push({
            x: (midC + (Math.random() - 0.5) * (ARENA_SIZE - 6)) * TILE_SIZE,
            y: (midR + (Math.random() - 0.5) * (ARENA_SIZE - 6)) * TILE_SIZE,
            radius: 16
        });
    }
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
            text: customText || `-${Math.floor(player.damage)} 💥`,
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

// ======================= 8. KHỞI TẠO GAME =======================
function initGame() {
    resizeCanvas();
    gameState = 'MAZE';
    maze = generateMaze(COLS, ROWS);
    let emptyTiles = getEmptyTiles();

    player.x = TILE_SIZE * 1.5;
    player.y = TILE_SIZE * 1.5;
    player.hp = 10000;
    player.maxHp = 10000;
    player.damage = 100;
    player.baseSpeed = 7.2;
    player.speed = player.baseSpeed;
    player.speedTier = 0;
    player.attackCooldown = 0;
    player.revealTimer = 0;
    player.invulnerableTimer = 0;
    player.shields = 0;
    player.cloneCooldown = 0;
    player.clonesToSpawn = 0;
    player.cloneSpawnDelay = 0;
    player.arenaPapersCollected = 0;
    player.dashCooldown = 0;
    player.isDashing = false;
    player.aoeCooldown = 0;
    player.healCooldown = 0;

    monster.phase = 1;
    monster.name = 'Trường Giang';
    monster.x = (COLS - 4) * TILE_SIZE + TILE_SIZE / 2;
    monster.y = (ROWS - 4) * TILE_SIZE + TILE_SIZE / 2;
    monster.radius = 16;
    monster.baseSpeed = 6.2;
    monster.speed = 6.2;
    monster.breakDistance = 450;
    monster.lostSightTimer = 0;
    monster.hp = 10000;
    monster.maxHp = 10000;
    monster.damage = 100;
    monster.attackCooldown = 0;
    monster.postAttackPause = 0;
    monster.stunTimer = 0;
    monster.isChasing = false;
    monster.lockedTarget = null;
    monster.roarCooldown = 840;
    monster.roarWaveActive = false;
    monster.roarWaveRadius = 0;
    monster.enrageTimer = 0;
    monster.isShielded = false;
    monster.shieldTimer = 0;
    monster.hasKiAura = false;
    monster.kiParticles = [];

    monster.patrolPaperTarget = null;
    monster.patrolInspectTimer = 0;

    monster.skill1Cooldown = 280;
    monster.skill2Cooldown = 500;
    monster.skill3Cooldown = 700;
    monster.teleportCooldown = 360;
    monster.kiBlastCooldown = 260;
    monster.kamehamehaCooldown = 550;
    monster.kameChargingTimer = 0;
    monster.kameBeamTimer = 0;

    allies = [];
    allyRespawnQueue = [];
    fans = [];
    fanRespawnQueue = [];
    medkits = [];
    arenaPapers = [];
    allyProjectiles = [];
    bossKiBlasts = [];
    clashShockwaves = [];
    hitEffects = [];
    damageTexts = [];
    mazeHelpers = [];
    medkitSpawnTimer = 0;
    notification.text = '';
    notification.timer = 0;

    // PHÂN BỐ ĐỀU 50 BÀI PHỐT THEO LƯỚI 10x5
    papers = [];
    const gridCols = 10;
    const gridRows = 5;
    const cellW = (COLS - 2) / gridCols;
    const cellH = (ROWS - 2) / gridRows;

    let availableTiles = [...emptyTiles];

    for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
            let minC = 1 + gx * cellW;
            let maxC = 1 + (gx + 1) * cellW;
            let minR = 1 + gy * cellH;
            let maxR = 1 + (gy + 1) * cellH;

            let inSector = availableTiles.filter(t => t.c >= minC && t.c < maxC && t.r >= minR && t.r < maxR);
            if (inSector.length > 0) {
                let chosen = inSector[Math.floor(Math.random() * inSector.length)];
                papers.push({ x: chosen.x, y: chosen.y });
                let remIdx = availableTiles.indexOf(chosen);
                if (remIdx !== -1) availableTiles.splice(remIdx, 1);
            } else if (availableTiles.length > 0) {
                let fallback = availableTiles.splice(Math.floor(Math.random() * availableTiles.length), 1)[0];
                papers.push({ x: fallback.x, y: fallback.y });
            }
        }
    }

    // 6 KHIÊN VÀ 6 ĐIỆN THOẠI
    mazeItems = [];
    availableTiles.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 6; i++) {
        if (availableTiles[i]) {
            mazeItems.push({ x: availableTiles[i].x, y: availableTiles[i].y, type: 'shield', radius: 15 });
        }
    }
    for (let i = 6; i < 12; i++) {
        if (availableTiles[i]) {
            mazeItems.push({ x: availableTiles[i].x, y: availableTiles[i].y, type: 'phone', radius: 15 });
        }
    }

    isGameOver = false;
    isVictory = false;

    let skillsZone = document.getElementById('skills-zone');
    if (skillsZone) skillsZone.classList.add('hidden');

    let mazeSkillsZone = document.getElementById('maze-skills-zone');
    if (mazeSkillsZone) mazeSkillsZone.classList.remove('hidden');

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bài phốt: <b id="paper-count">0</b>/50`;

    let badgeStatusMode = document.getElementById('badge-status-mode') || document.getElementById('badge-timer');
    if (badgeStatusMode) badgeStatusMode.innerHTML = `Chế độ: <b>Mê Cung</b>`;

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = 'Thu thập đủ 50 bài phốt để qua màn tiếp theo! (Phím F: Phân Thân)';
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

    let mazeSkillsZone = document.getElementById('maze-skills-zone');
    if (mazeSkillsZone) mazeSkillsZone.classList.add('hidden');

    let skillsZone = document.getElementById('skills-zone');
    if (skillsZone) skillsZone.classList.remove('hidden');

    allies = [];
    allyRespawnQueue = [];
    for (let i = 0; i < 50; i++) {
        spawnSingleAlly('melee');
    }

    fans = [];
    fanRespawnQueue = [];
    for (let i = 0; i < 50; i++) {
        spawnSingleFan();
    }

    for (let i = 0; i < 4; i++) {
        spawnMedkit();
    }

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bạn: <b id="player-hp-ui">${player.hp}</b>/10000 HP`;

    let badgeStatusMode = document.getElementById('badge-status-mode') || document.getElementById('badge-timer');
    if (badgeStatusMode) badgeStatusMode.innerHTML = `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b> vs Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = '⚡ ĐẠI CHIẾN ĐẤU TRƯỜNG THU NHỎ! DỒN DẬP TẤN CÔNG!';
        statusEl.style.color = '#eab308';
    }

    playSynthSound('boss_skill');
}

// ======================= 9. VÒNG LẶP LOGIC (UPDATE) =======================
let lastMonsterPathTime = 0;
let lastFrameTime = performance.now();

function update() {
    if (!isPlaying || isGameOver || isVictory || gameState === 'BOSS_POPUP') return;

    let now = performance.now();
    let dt = Math.min((now - lastFrameTime) / 16.67, 1.5);
    lastFrameTime = now;

    if (screenShake > 0) screenShake *= 0.9;
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.invulnerableTimer > 0) player.invulnerableTimer--;
    if (player.cloneCooldown > 0) player.cloneCooldown--;
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.aoeCooldown > 0) player.aoeCooldown--;
    if (player.healCooldown > 0) player.healCooldown--;

    if (monster.attackCooldown > 0) monster.attackCooldown--;
    if (monster.shieldTimer > 0) monster.shieldTimer--;
    if (monster.shieldTimer <= 0) monster.isShielded = false;
    if (monster.stunTimer > 0) monster.stunTimer--;
    if (monster.enrageTimer > 0) monster.enrageTimer--;
    if (notification.timer > 0) notification.timer--;

    // XỬ LÝ HÀNG ĐỢI XUẤT HIỆN TUẦN TỰ 5 PHÂN THÂN (CÁCH NHAU 0.26S - ĐẶC TÍNH GIỐNG HỆT NGƯỜI CHƠI)
    if (player.clonesToSpawn > 0) {
        player.cloneSpawnDelay--;
        if (player.cloneSpawnDelay <= 0) {
            player.clonesToSpawn--;
            player.cloneSpawnDelay = 16;

            mazeHelpers.push({
                x: player.x,
                y: player.y,
                radius: player.radius,
                speed: player.speed * 0.92,
                angle: player.angle,
                color: player.color,
                name: player.name,
                targetPaper: null,
                currentPath: [],
                revealTimer: 0,
                stunTimer: 0,
                isClone: true
            });

            playSynthSound('clone');
            hitEffects.push({
                x: player.x,
                y: player.y,
                radius: 8,
                maxRadius: 42,
                lineWidth: 3,
                color: '#38bdf8',
                alpha: 1.0
            });
        }
    }

    // Âm thanh quái vật theo cự ly
    let distToMonster = Math.hypot(monster.x - player.x, monster.y - player.y);
    updateMonsterProximityAudio(distToMonster);

    // Sóng âm DBZ
    for (let i = clashShockwaves.length - 1; i >= 0; i--) {
        let sw = clashShockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.22;
        sw.alpha -= 0.04;
        if (sw.alpha <= 0) clashShockwaves.splice(i, 1);
    }

    // Ki Aura
    if (monster.hasKiAura || monster.enrageTimer > 0) {
        for (let i = 0; i < 2; i++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 10 + Math.random() * 28;
            monster.kiParticles.push({
                x: monster.x + Math.cos(angle) * dist,
                y: monster.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -3 - Math.random() * 3,
                size: 3 + Math.random() * 4,
                alpha: 1.0,
                color: Math.random() < 0.6 ? '#f59e0b' : '#ef4444'
            });
        }
        for (let i = monster.kiParticles.length - 1; i >= 0; i--) {
            let p = monster.kiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.05;
            if (p.alpha <= 0) monster.kiParticles.splice(i, 1);
        }
    }

    // Cập nhật text nút hồi chiêu
    let cloneCdText = document.getElementById('clone-cd-text');
    let btnCloneElem = document.getElementById('btn-skill-clone');
    if (cloneCdText && btnCloneElem) {
        if (player.cloneCooldown > 0) {
            cloneCdText.innerText = `${Math.ceil(player.cloneCooldown / 60)}s`;
            btnCloneElem.classList.add('disabled');
        } else {
            cloneCdText.innerText = `SẴN SÀNG`;
            btnCloneElem.classList.remove('disabled');
        }
    }

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

    let healCdText = document.getElementById('heal-cd-text');
    let healBtn = document.getElementById('btn-skill-heal');
    if (healCdText && healBtn) {
        if (player.healCooldown > 0) {
            healCdText.innerText = `${Math.ceil(player.healCooldown / 60)}s`;
            healBtn.classList.add('disabled');
        } else {
            healCdText.innerText = `SẴN SÀNG`;
            healBtn.classList.remove('disabled');
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

    // --- A. DI CHUYỂN NGƯỜI CHƠI (TRƯỢT VẬT LÝ SIÊU MƯỢT) ---
    if (player.isDashing) {
        player.dashTimer--;
        let dashSpd = player.speed * 2.8 * dt;
        moveEntitySliding(player, player.dashDx * dashSpd, player.dashDy * dashSpd);
        if (player.dashTimer <= 0) player.isDashing = false;
    } else {
        let moveX = 0, moveY = 0;

        if (keysPressed['KeyW'] || keysPressed['ArrowUp']) moveY -= 1;
        if (keysPressed['KeyS'] || keysPressed['ArrowDown']) moveY += 1;
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) moveX -= 1;
        if (keysPressed['KeyD'] || keysPressed['ArrowRight']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
            let norm = 1 / Math.SQRT2;
            moveX *= norm;
            moveY *= norm;
        } else if (moveX === 0 && moveY === 0) {
            if (input.isMouseDown) {
                let sx = canvas.width / 2;
                let sy = canvas.height / 2;
                let dx = input.mouseX - sx;
                let dy = input.mouseY - sy;
                let dist = Math.hypot(dx, dy);
                if (dist > 12) {
                    moveX = dx / dist;
                    moveY = dy / dist;
                }
            } else if (input.dx !== 0 || input.dy !== 0) {
                moveX = input.dx;
                moveY = input.dy;
            }
        }

        if (moveX !== 0 || moveY !== 0) {
            player.angle = Math.atan2(moveY, moveX);
            moveEntitySliding(player, moveX * player.speed * dt, moveY * player.speed * dt);
        }
    }

    // --- B. LOGIC GIAI ĐOẠN 1: MÊ CUNG ---
    if (gameState === 'MAZE') {
        if (player.revealTimer > 0) {
            player.revealTimer--;
        }

        // Người chơi nhặt vật phẩm
        for (let i = mazeItems.length - 1; i >= 0; i--) {
            let item = mazeItems[i];
            if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + 6) {
                mazeItems.splice(i, 1);
                playSynthSound('item_pickup');

                if (item.type === 'shield') {
                    player.shields++;
                    notification.text = `🛡️ ĐÃ NHẶT KHIÊN HỘ MỆNH! (Đang có: ${player.shields}/6)`;
                    notification.timer = 150;
                } else if (item.type === 'phone') {
                    mazeHelpers.push({
                        x: player.x,
                        y: player.y,
                        radius: player.radius,
                        speed: player.speed * 0.9,
                        angle: player.angle,
                        color: player.color,
                        name: player.name,
                        targetPaper: null,
                        currentPath: [],
                        revealTimer: 0,
                        stunTimer: 0,
                        isClone: false
                    });
                    notification.text = `📱 ĐÃ TRIỆU HỒI ĐỒNG MINH MANG ĐẶC TÍNH NGƯỜI CHƠI!`;
                    notification.timer = 160;
                }
            }
        }

        // --- CƠ CHẾ QUÁI KHẮC CHẾ PHÂN THÂN & ĐỒNG MINH: "TIẾNG GẦM PHÁ ẢO ẢNH" ---
        if (mazeHelpers.length > 0 && monster.stunTimer <= 0) {
            monster.roarCooldown--;
            if (monster.roarCooldown <= 0) {
                monster.roarCooldown = 840; // 14 giây hồi chiêu
                monster.roarWaveActive = true;
                monster.roarWaveRadius = 20;
                playSynthSound('roar');
                screenShake = 22;
                notification.text = `👹 TRƯỜNG GIANG GẦM LÊN PHÁ HỦY PHÂN THÂN QUANH HẮN!`;
                notification.timer = 150;
            }
        }

        if (monster.roarWaveActive) {
            monster.roarWaveRadius += 18 * dt;
            for (let hIdx = mazeHelpers.length - 1; hIdx >= 0; hIdx--) {
                let h = mazeHelpers[hIdx];
                let dToM = Math.hypot(h.x - monster.x, h.y - monster.y);
                if (Math.abs(dToM - monster.roarWaveRadius) < 25) {
                    if (dToM <= 480) {
                        // Trong bán kính 480px: Phân thân/Đồng minh bị sóng âm chấn tan biến ngay!
                        hitEffects.push({ x: h.x, y: h.y, radius: 8, maxRadius: 45, lineWidth: 4, color: '#ef4444', alpha: 1.0 });
                        if (monster.lockedTarget === h) monster.lockedTarget = null;
                        mazeHelpers.splice(hIdx, 1);
                    } else if (dToM <= 800) {
                        // Ở xa (480px - 800px): Bị hoảng sợ đứng khựng 2.5s và lộ vị trí!
                        h.stunTimer = 150;
                        h.revealTimer = 240;
                    }
                }
            }
            if (monster.roarWaveRadius > 800) {
                monster.roarWaveActive = false;
            }
        }

        // --- CẬP NHẬT DI CHUYỂN CỦA PHÂN THÂN & ĐỒNG MINH ---
        for (let hIdx = mazeHelpers.length - 1; hIdx >= 0; hIdx--) {
            let helper = mazeHelpers[hIdx];
            if (helper.revealTimer > 0) helper.revealTimer--;
            if (helper.stunTimer > 0) {
                helper.stunTimer--;
                continue;
            }

            // 1. Khóa mục tiêu bài phốt cố định (Tránh lỗi đi qua lại)
            if (!helper.targetPaper || !papers.includes(helper.targetPaper)) {
                let targetedPapers = mazeHelpers.map(h => h.targetPaper).filter(Boolean);
                let candidates = papers.filter(p => !targetedPapers.includes(p));
                if (candidates.length === 0) candidates = papers;

                if (candidates.length > 0) {
                    let bestP = null;
                    let minD = Infinity;
                    for (let p of candidates) {
                        let d = Math.hypot(p.x - helper.x, p.y - helper.y);
                        if (d < minD) { minD = d; bestP = p; }
                    }
                    helper.targetPaper = bestP;
                    let hCol = Math.floor(helper.x / TILE_SIZE);
                    let hRow = Math.floor(helper.y / TILE_SIZE);
                    let pCol = Math.floor(bestP.x / TILE_SIZE);
                    let pRow = Math.floor(bestP.y / TILE_SIZE);
                    helper.currentPath = findPathBFS(hCol, hRow, pCol, pRow);
                }
            }

            // 2. Di chuyển theo lộ trình
            if (helper.targetPaper && helper.currentPath && helper.currentPath.length > 0) {
                let nextNode = helper.currentPath[0];
                let targetX = nextNode[0] * TILE_SIZE + TILE_SIZE / 2;
                let targetY = nextNode[1] * TILE_SIZE + TILE_SIZE / 2;
                let hDx = targetX - helper.x;
                let hDy = targetY - helper.y;
                let hDist = Math.hypot(hDx, hDy);

                if (hDist > 1) helper.angle = Math.atan2(hDy, hDx);

                if (hDist <= helper.speed * dt) {
                    helper.x = targetX;
                    helper.y = targetY;
                    helper.currentPath.shift();
                } else {
                    helper.x += (hDx / hDist) * helper.speed * dt;
                    helper.y += (hDy / hDist) * helper.speed * dt;
                }
            } else if (helper.targetPaper) {
                let hCol = Math.floor(helper.x / TILE_SIZE);
                let hRow = Math.floor(helper.y / TILE_SIZE);
                let pCol = Math.floor(helper.targetPaper.x / TILE_SIZE);
                let pRow = Math.floor(helper.targetPaper.y / TILE_SIZE);

                if (hCol === pCol && hRow === pRow) {
                    let hDx = helper.targetPaper.x - helper.x;
                    let hDy = helper.targetPaper.y - helper.y;
                    let hDist = Math.hypot(hDx, hDy);
                    if (hDist > 1) {
                        helper.angle = Math.atan2(hDy, hDx);
                        helper.x += (hDx / hDist) * helper.speed * dt;
                        helper.y += (hDy / hDist) * helper.speed * dt;
                    }
                } else {
                    helper.currentPath = findPathBFS(hCol, hRow, pCol, pRow);
                }
            }

            // 3. Nhặt bài phốt
            for (let i = papers.length - 1; i >= 0; i--) {
                let p = papers[i];
                if (Math.hypot(helper.x - p.x, helper.y - p.y) < helper.radius + 20) {
                    papers.splice(i, 1);
                    playSynthSound('collect');

                    let collected = 50 - papers.length;
                    let countEl = document.getElementById('paper-count');
                    if (countEl) countEl.innerText = collected;

                    monster.speed = 6.2 + collected * 0.06;
                    helper.revealTimer = 300; // Bản sao bị lộ 5s
                    helper.targetPaper = null;

                    notification.text = `📢 BẢN SAO NHẶT PHỐT & THU HÚT SỰ CHÚ Ý CỦA QUÁI TRONG 5S!`;
                    notification.timer = 150;

                    if (papers.length === 0) {
                        gameState = 'BOSS_POPUP';
                        let introEl = document.getElementById('boss-intro-modal');
                        if (introEl) introEl.classList.remove('hidden');
                        return;
                    }
                    break;
                }
            }

            // 4. KHI QUÁI BẮT ĐƯỢC PHÂN THÂN/ĐỒNG MINH -> KÍCH HOẠT "CUỒNG NỘ PHẪN UẤT"
            if (monster.stunTimer <= 0 && Math.hypot(monster.x - helper.x, monster.y - helper.y) < monster.radius + helper.radius) {
                if (monster.lockedTarget === helper) monster.lockedTarget = null;
                mazeHelpers.splice(hIdx, 1);
                playSynthSound('player_hit');
                screenShake = 20;

                // Quái phát hiện bắt nhầm ảnh ảo -> Nổi điên tăng tốc trong 5 giây!
                monster.enrageTimer = 300;
                notification.text = `🔥 QUÁI BẮT NHẦM BẢN SAO VÀ NỔI ĐIÊN TĂNG TỐC TRONG 5 GIÂY!`;
                notification.timer = 160;
                continue;
            }
        }

        // Người chơi nhặt bài phốt -> Tăng tốc mỗi 10 bài & Lộ vị trí 5s
        for (let i = papers.length - 1; i >= 0; i--) {
            let p = papers[i];
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 18) {
                papers.splice(i, 1);
                playSynthSound('collect');

                let collected = 50 - papers.length;
                let countEl = document.getElementById('paper-count');
                if (countEl) countEl.innerText = collected;

                let newTier = Math.floor(collected / 10);
                if (newTier > player.speedTier) {
                    player.speedTier = newTier;
                    player.speed = player.baseSpeed + player.speedTier * 0.7;
                    notification.text = `⚡ TỐC ĐỘ TĂNG! (Cấp ${player.speedTier}/5: ${player.speed.toFixed(1)}) - Bạn chạy nhanh hơn!`;
                    notification.timer = 180;
                } else if (papers.length > 0) {
                    notification.text = `⚠️ BẠN BỊ LỘ VỊ TRÍ 5 GIÂY! (${collected}/50)`;
                    notification.timer = 140;
                }

                monster.speed = 6.2 + collected * 0.06;

                if (papers.length > 0) {
                    player.revealTimer = 300;
                } else {
                    gameState = 'BOSS_POPUP';
                    let introEl = document.getElementById('boss-intro-modal');
                    if (introEl) introEl.classList.remove('hidden');
                    return;
                }
            }
        }

        // Va chạm giữa Quái và Người chơi thật
        let distToPlayer = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (monster.stunTimer <= 0 && distToPlayer < player.radius + monster.radius) {
            if (player.shields > 0) {
                player.shields--;
                monster.stunTimer = 300; // Choáng 5 giây
                monster.isChasing = false;
                monster.lockedTarget = null;
                monster.currentPath = [];
                screenShake = 25;
                playSynthSound('shield_break');

                let pushDx = monster.x - player.x;
                let pushDy = monster.y - player.y;
                let pushDist = Math.hypot(pushDx, pushDy) || 1;
                monster.x += (pushDx / pushDist) * 55;
                monster.y += (pushDy / pushDist) * 55;

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

        // --- HỆ THỐNG AI QUÁI VẬT LỰA CHỌN MỤC TIÊU (KHÔNG PHÂN BIỆT ĐƯỢC THẬT/GIẢ) ---
        if (monster.stunTimer <= 0) {
            let mCol = Math.floor(monster.x / TILE_SIZE);
            let mRow = Math.floor(monster.y / TILE_SIZE);

            // Tìm tất cả mục tiêu đang bị lộ vị trí (Người chơi lẫn Phân thân/Đồng minh đều bình đẳng)
            let allPrey = [player, ...mazeHelpers];
            let revealedPrey = allPrey.filter(p => p.revealTimer > 0);

            if (revealedPrey.length > 0) {
                // Nếu có nhiều mục tiêu bị lộ, quái sẽ chọn mục tiêu GẦN NHẤT để rượt đuổi!
                revealedPrey.sort((a, b) => Math.hypot(a.x - monster.x, a.y - monster.y) - Math.hypot(b.x - monster.x, b.y - monster.y));
                monster.lockedTarget = revealedPrey[0];
                monster.isChasing = true;
                monster.lostSightTimer = 0;
            } else if (monster.isChasing && monster.lockedTarget) {
                // Kiểm tra xem mục tiêu đang khóa còn tồn tại trên bản đồ không
                if (monster.lockedTarget !== player && !mazeHelpers.includes(monster.lockedTarget)) {
                    monster.lockedTarget = null;
                    monster.isChasing = false;
                } else {
                    // Nếu có một phân thân khác chạy cắt mặt gần hơn trong tầm mắt, quái sẽ bị đánh lạc hướng sang phân thân đó!
                    let distToCurrent = Math.hypot(monster.lockedTarget.x - monster.x, monster.lockedTarget.y - monster.y);
                    let hasLOS = hasLineOfSight(monster.x, monster.y, monster.lockedTarget.x, monster.lockedTarget.y);

                    if (!hasLOS) monster.lostSightTimer++;
                    else monster.lostSightTimer = 0;

                    if ((!hasLOS && distToCurrent > monster.breakDistance) || monster.lostSightTimer > 90) {
                        monster.isChasing = false;
                        monster.lockedTarget = null;
                        monster.currentPath = [];
                        monster.lostSightTimer = 0;
                    }
                }
            } else {
                monster.isChasing = false;
                monster.lockedTarget = null;
            }

            if (monster.isChasing && monster.lockedTarget) {
                // ĐUỔI THEO MỤC TIÊU ĐÃ CHỌN
                monster.patrolInspectTimer = 0;
                if (now - lastMonsterPathTime > 250 || monster.currentPath.length === 0) {
                    lastMonsterPathTime = now;
                    let tCol = Math.floor(monster.lockedTarget.x / TILE_SIZE);
                    let tRow = Math.floor(monster.lockedTarget.y / TILE_SIZE);
                    monster.currentPath = findPathBFS(mCol, mRow, tCol, tRow);
                }
            } else {
                // TUẦN TRA CANH GÁC QUANH CÁC BÀI PHỐT
                if (monster.patrolInspectTimer > 0) {
                    monster.patrolInspectTimer--;
                    monster.angle += 0.04;
                } else {
                    if (now - lastMonsterPathTime > 300 || monster.currentPath.length === 0) {
                        lastMonsterPathTime = now;

                        if (papers.length > 0) {
                            if (!monster.patrolPaperTarget || Math.hypot(monster.x - monster.patrolPaperTarget.x, monster.y - monster.patrolPaperTarget.y) < 70) {
                                monster.patrolPaperTarget = papers[Math.floor(Math.random() * papers.length)];
                                monster.patrolInspectTimer = 150;
                            }

                            if (monster.patrolPaperTarget) {
                                let tCol = Math.floor(monster.patrolPaperTarget.x / TILE_SIZE);
                                let tRow = Math.floor(monster.patrolPaperTarget.y / TILE_SIZE);
                                monster.currentPath = findPathBFS(mCol, mRow, tCol, tRow);
                            }
                        } else {
                            let empty = getEmptyTiles();
                            let rand = empty[Math.floor(Math.random() * empty.length)];
                            if (rand) monster.currentPath = findPathBFS(mCol, mRow, rand.c, rand.r);
                        }
                    }
                }
            }

            // Tính tốc độ di chuyển (Tăng mạnh nếu đang trong trạng thái Cuồng Nộ sau khi bắt nhầm phân thân)
            let baseMoveSpeed = monster.isChasing ? monster.speed : (monster.speed * 0.78);
            let moveSpeed = monster.enrageTimer > 0 ? (baseMoveSpeed + 1.6) : baseMoveSpeed;

            if (monster.currentPath && monster.currentPath.length > 0 && monster.patrolInspectTimer <= 0) {
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

                if (dist <= moveSpeed * dt) {
                    monster.x = targetX;
                    monster.y = targetY;
                    monster.currentPath.shift();
                } else {
                    monster.x += (dx / dist) * moveSpeed * dt;
                    monster.y += (dy / dist) * moveSpeed * dt;
                }
            }
        }
        return;
    }

    // --- C. LOGIC GIAI ĐOẠN 2: ĐẤU TRƯỜNG THU NHỎ DỒN DẬP ---
    for (let i = allyRespawnQueue.length - 1; i >= 0; i--) {
        allyRespawnQueue[i]--;
        if (allyRespawnQueue[i] <= 0) {
            allyRespawnQueue.splice(i, 1);
            let targetCount = monster.phase === 2 ? 100 : 50;
            if (allies.length < targetCount) spawnSingleAlly();
        }
    }

    if (monster.phase === 1) {
        for (let i = fanRespawnQueue.length - 1; i >= 0; i--) {
            fanRespawnQueue[i]--;
            if (fanRespawnQueue[i] <= 0) {
                fanRespawnQueue.splice(i, 1);
                if (fans.length < 50) spawnSingleFan();
            }
        }
    }

    if (monster.phase === 1) {
        medkitSpawnTimer++;
        if (medkitSpawnTimer > 350 && medkits.length < 5) {
            medkitSpawnTimer = 0;
            spawnMedkit();
        }
        for (let i = medkits.length - 1; i >= 0; i--) {
            let m = medkits[i];
            if (Math.hypot(player.x - m.x, player.y - m.y) < player.radius + m.radius + 6) {
                medkits.splice(i, 1);
                player.hp = Math.min(player.maxHp, player.hp + 1500);
                playSynthSound('heal');
            }
        }
    } else {
        medkits = [];
    }

    if (monster.phase === 2) {
        for (let i = arenaPapers.length - 1; i >= 0; i--) {
            let ap = arenaPapers[i];
            if (Math.hypot(player.x - ap.x, player.y - ap.y) < player.radius + ap.radius + 6) {
                arenaPapers.splice(i, 1);
                player.arenaPapersCollected++;
                playSynthSound('collect');

                player.maxHp = 10000 + (player.arenaPapersCollected / 10) * 90000;
                player.damage = 180 + (player.arenaPapersCollected / 10) * 1620;
                player.hp = Math.min(player.maxHp, player.hp + 9000);

                if (player.arenaPapersCollected >= 10) {
                    notification.text = `⚡ BẠN ĐÃ ĐẠT 100% CẢNH GIỚI TỐI THƯỢNG (100.000 HP, 1.800 DAME)! HÃY TIÊU DIỆT MƯỜI KHÓ!`;
                } else {
                    notification.text = `⚡ BÀI PHỐT (${player.arenaPapersCollected}/10)! SỨC MẠNH: ${Math.floor(player.damage)} DAME, MÁU: ${Math.floor(player.maxHp)} HP!`;
                }
                notification.timer = 160;

                if (player.arenaPapersCollected === 5) {
                    notification.text = `💥 ĐẠT 5/10 SỨC MẠNH! MỞ KHÓA VA CHẠM SÓNG ÂM DRAGON BALL!`;
                    notification.timer = 220;
                }
            }
        }
    }

    for (let i = allies.length - 1; i >= 0; i--) {
        let ally = allies[i];
        if (ally.attackCooldown > 0) ally.attackCooldown--;

        let tgt = monster;
        let minDist = Math.hypot(monster.x - ally.x, monster.y - ally.y);

        if (monster.phase === 1) {
            for (let j = 0; j < fans.length; j++) {
                let f = fans[j];
                let d = Math.hypot(f.x - ally.x, f.y - ally.y);
                if (d < minDist) {
                    minDist = d;
                    tgt = f;
                }
            }
        }

        if (tgt) {
            let dx = tgt.x - ally.x;
            let dy = tgt.y - ally.y;
            let dist = minDist;

            if (ally.type === 'ranged') {
                if (dist > 300) {
                    moveEntitySliding(ally, (dx / dist) * ally.speed * dt, (dy / dist) * ally.speed * dt);
                } else if (dist < 160) {
                    moveEntitySliding(ally, -(dx / dist) * ally.speed * dt, -(dy / dist) * ally.speed * dt);
                }

                if (ally.attackCooldown <= 0) {
                    ally.attackCooldown = 75;
                    let angle = Math.atan2(dy, dx);
                    allyProjectiles.push({
                        x: ally.x,
                        y: ally.y,
                        vx: Math.cos(angle) * 7.5,
                        vy: Math.sin(angle) * 7.5,
                        damage: 1000,
                        radius: 10,
                        life: 90
                    });
                }
            } else {
                if (dist > tgt.radius + ally.radius) {
                    moveEntitySliding(ally, (dx / dist) * ally.speed * dt, (dy / dist) * ally.speed * dt);
                } else if (ally.attackCooldown <= 0) {
                    ally.attackCooldown = 45;
                    let actualDmg = (tgt === monster && monster.isShielded) ? 25 : 50;
                    tgt.hp -= actualDmg;
                    addHitVisual(tgt.x, tgt.y, false);
                    playSynthSound('ally_hit');
                }
            }
        }
    }

    for (let i = allyProjectiles.length - 1; i >= 0; i--) {
        let proj = allyProjectiles[i];
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life--;

        if (Math.hypot(proj.x - monster.x, proj.y - monster.y) < monster.radius + proj.radius) {
            let actualDmg = monster.isShielded ? 500 : 1000;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            addHitVisual(monster.x, monster.y, false, `-${actualDmg}`, '#38bdf8');
            allyProjectiles.splice(i, 1);
            continue;
        }

        for (let fan of fans) {
            if (Math.hypot(proj.x - fan.x, proj.y - fan.y) < fan.radius + proj.radius) {
                fan.hp -= 1000;
                addHitVisual(fan.x, fan.y, false, '-1000', '#38bdf8');
                allyProjectiles.splice(i, 1);
                break;
            }
        }

        if (proj.life <= 0) allyProjectiles.splice(i, 1);
    }

    if (monster.phase === 1) {
        for (let i = fans.length - 1; i >= 0; i--) {
            let fan = fans[i];
            if (fan.attackCooldown > 0) fan.attackCooldown--;

            let tgt = player;
            let minDist = Math.hypot(player.x - fan.x, player.y - fan.y);

            for (let j = 0; j < allies.length; j++) {
                let a = allies[j];
                let d = Math.hypot(a.x - fan.x, a.y - fan.y);
                if (d < minDist) {
                    minDist = d;
                    tgt = a;
                }
            }

            if (tgt) {
                let dx = tgt.x - fan.x;
                let dy = tgt.y - fan.y;
                let dist = minDist;

                if (dist > tgt.radius + fan.radius) {
                    moveEntitySliding(fan, (dx / dist) * fan.speed * dt, (dy / dist) * fan.speed * dt);
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
    }

    if (player.attackCooldown <= 0) {
        let distPtoM = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distPtoM <= player.radius + monster.radius + 8) {
            player.attackCooldown = 26;
            let actualDmg = monster.isShielded ? Math.floor(player.damage / 2) : player.damage;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            screenShake = 16;
            addHitVisual(monster.x, monster.y, true);
            playSynthSound('player_hit');

            if (player.arenaPapersCollected >= 5) {
                triggerDBZClash((player.x + monster.x) / 2, (player.y + monster.y) / 2);
            }
        }

        if (monster.phase === 1) {
            for (let fan of fans) {
                if (Math.hypot(player.x - fan.x, player.y - fan.y) <= player.radius + fan.radius + 8) {
                    player.attackCooldown = 26;
                    fan.hp -= player.damage;
                    addHitVisual(fan.x, fan.y, true, `-${player.damage} 💥`, '#facc15');
                    playSynthSound('player_hit');
                    break;
                }
            }
        }
    }

    if (monster.phase === 1 && monster.hp <= 0) {
        monster.phase = 2;
        monster.name = 'Mười Khó (Thức Tỉnh Ki)';
        monster.hp = 100000;
        monster.maxHp = 100000;
        monster.damage = 1800;
        monster.speed = 5.8;
        monster.hasKiAura = true;

        for (let fan of fans) {
            let isTank = Math.random() < 0.5;
            allies.push({
                x: fan.x,
                y: fan.y,
                radius: 14,
                speed: isTank ? 4.2 : 3.6,
                hp: isTank ? 2000 : 100,
                maxHp: isTank ? 2000 : 100,
                damage: isTank ? 50 : 1000,
                type: isTank ? 'melee' : 'ranged',
                attackCooldown: 0
            });
        }
        fans = [];
        fanRespawnQueue = [];

        spawnArenaPapers();

        screenShake = 55;
        playSynthSound('phase_change');

        notification.text = '🔥 PHASE 2: TRƯỜNG GIANG X10 SỨC MẠNH (100.000 HP, 1.800 DAME)! 50 FAN ĐỔI PHE! DÙNG SKILL HỒI MÁU!';
        notification.timer = 260;

        let statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.innerText = '🔥 PHASE 2: THỨC TỈNH KI AURA! 100 ĐỒNG MINH CHIẾN ĐẤU CÙNG BẠN!';
            statusEl.style.color = '#ef4444';
        }
    }

    let primaryTarget = player;
    let minBossTgtDist = Math.hypot(player.x - monster.x, player.y - monster.y);
    let nearbyEnemies = minBossTgtDist < 180 ? 1 : 0;

    for (let j = 0; j < allies.length; j++) {
        let a = allies[j];
        let d = Math.hypot(a.x - monster.x, a.y - monster.y);
        if (d < 180) nearbyEnemies++;
        if (d < minBossTgtDist) {
            minBossTgtDist = d;
            primaryTarget = a;
        }
    }

    if (primaryTarget && monster.kameChargingTimer <= 0 && monster.kameBeamTimer <= 0) {
        let bDx = primaryTarget.x - monster.x;
        let bDy = primaryTarget.y - monster.y;
        let bDist = minBossTgtDist;

        if (monster.postAttackPause > 0) {
            monster.postAttackPause--;
        } else if (bDist > 1) {
            monster.angle = Math.atan2(bDy, bDx);
            moveEntitySliding(monster, (bDx / bDist) * monster.speed * dt, (bDy / bDist) * monster.speed * dt);
        }

        if (bDist <= monster.radius + primaryTarget.radius + 6 && monster.attackCooldown <= 0) {
            if (primaryTarget === player) {
                if (player.invulnerableTimer <= 0) {
                    player.hp -= monster.damage;
                    player.invulnerableTimer = 60;
                    monster.attackCooldown = 65;
                    monster.postAttackPause = 24;
                    screenShake = 22;
                    playSynthSound('player_hit');

                    let knockDx = player.x - monster.x;
                    let knockDy = player.y - monster.y;
                    let kDist = Math.hypot(knockDx, knockDy) || 1;
                    moveEntitySliding(player, (knockDx / kDist) * 50, (knockDy / kDist) * 50);

                    if (player.arenaPapersCollected >= 5) {
                        triggerDBZClash((player.x + monster.x) / 2, (player.y + monster.y) / 2);
                    }
                }
            } else {
                primaryTarget.hp -= monster.damage;
                monster.attackCooldown = 40;
                playSynthSound('player_hit');
                let knockDx = primaryTarget.x - monster.x;
                let knockDy = primaryTarget.y - monster.y;
                let kDist = Math.hypot(knockDx, knockDy) || 1;
                moveEntitySliding(primaryTarget, (knockDx / kDist) * 35, (knockDy / kDist) * 35);
            }
        }
    }

    monster.skill3Cooldown--;
    if (monster.hp < monster.maxHp * 0.7 && monster.skill3Cooldown <= 0) {
        monster.skill3Cooldown = 750;
        monster.isShielded = true;
        monster.shieldTimer = 240;
        let healAmt = monster.phase === 2 ? 10000 : 1000;
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmt);
        playSynthSound('heal');
    }

    monster.skill2Cooldown--;
    if ((nearbyEnemies >= 4 || Math.hypot(player.x - monster.x, player.y - monster.y) < 130) && monster.skill2Cooldown <= 0) {
        monster.skill2Cooldown = 520;
        monster.shockwaveActive = true;
        monster.shockwaveRadius = 10;
        playSynthSound('boss_skill');
    }

    if (monster.shockwaveActive) {
        monster.shockwaveRadius += (monster.phase === 2 ? 16 : 10);
        let maxWave = monster.phase === 2 ? 380 : 280;

        let checkTargets = [player, ...allies];
        for (let target of checkTargets) {
            let d = Math.hypot(target.x - monster.x, target.y - monster.y);
            if (Math.abs(d - monster.shockwaveRadius) < 18) {
                let waveDmg = monster.phase === 2 ? 2500 : 150;
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

    monster.skill1Cooldown--;
    if (primaryTarget && Math.hypot(primaryTarget.x - monster.x, primaryTarget.y - monster.y) < 180 && monster.skill1Cooldown <= 0) {
        monster.skill1Cooldown = 300;
        monster.singleStrikeTarget = { x: primaryTarget.x, y: primaryTarget.y };
        monster.singleStrikeTimer = 25;
        let strikeDmg = monster.phase === 2 ? 3500 : 200;
        if (primaryTarget === player) {
            if (player.invulnerableTimer <= 0) {
                player.hp -= strikeDmg;
                player.invulnerableTimer = 50;
            }
        } else {
            primaryTarget.hp -= strikeDmg;
        }
        screenShake = 24;
        playSynthSound('boss_skill');
    }
    if (monster.singleStrikeTimer > 0) monster.singleStrikeTimer--;

    if (monster.phase === 2) {
        monster.teleportCooldown--;
        if (monster.teleportCooldown <= 0 && primaryTarget) {
            monster.teleportCooldown = 360;
            playSynthSound('teleport');

            let behindAngle = primaryTarget.angle || 0;
            monster.x = primaryTarget.x - Math.cos(behindAngle) * 65;
            monster.y = primaryTarget.y - Math.sin(behindAngle) * 65;
            monster.angle = Math.atan2(primaryTarget.y - monster.y, primaryTarget.x - monster.x);

            hitEffects.push({ x: monster.x, y: monster.y, radius: 10, maxRadius: 70, lineWidth: 5, color: '#38bdf8', alpha: 1.0 });
        }

        monster.kiBlastCooldown--;
        if (monster.kiBlastCooldown <= 0 && primaryTarget) {
            monster.kiBlastCooldown = 280;
            playSynthSound('boss_skill');

            let baseA = Math.atan2(primaryTarget.y - monster.y, primaryTarget.x - monster.x);
            for (let i = -2; i <= 2; i++) {
                let a = baseA + (i * 0.18);
                bossKiBlasts.push({
                    x: monster.x,
                    y: monster.y,
                    vx: Math.cos(a) * 8.5,
                    vy: Math.sin(a) * 8.5,
                    damage: 1500,
                    radius: 10,
                    life: 120
                });
            }
        }

        monster.kamehamehaCooldown--;
        if (monster.kamehamehaCooldown <= 0 && primaryTarget && monster.kameChargingTimer <= 0 && monster.kameBeamTimer <= 0) {
            monster.kamehamehaCooldown = 560;
            monster.kameChargingTimer = 60;
            monster.kameAngle = Math.atan2(primaryTarget.y - monster.y, primaryTarget.x - monster.x);
        }

        if (monster.kameChargingTimer > 0) {
            monster.kameChargingTimer--;
            if (monster.kameChargingTimer <= 0) {
                monster.kameBeamTimer = 50;
                playSynthSound('kamehameha');
                screenShake = 35;
            }
        }

        if (monster.kameBeamTimer > 0) {
            monster.kameBeamTimer--;
            screenShake = Math.max(screenShake, 18);

            let beamLength = 1200;
            let beamWidth = 85;
            let checkTargets = [player, ...allies];
            for (let target of checkTargets) {
                let tDx = target.x - monster.x;
                let tDy = target.y - monster.y;
                let tDist = Math.hypot(tDx, tDy);
                let tAngle = Math.atan2(tDy, tDx);
                let angleDiff = Math.abs(Math.atan2(Math.sin(tAngle - monster.kameAngle), Math.cos(tAngle - monster.kameAngle)));

                if (tDist <= beamLength && angleDiff < (beamWidth / tDist)) {
                    let kameDmg = 80;
                    if (target === player) {
                        if (player.invulnerableTimer <= 0) player.hp -= kameDmg;
                    } else {
                        target.hp -= kameDmg;
                    }
                }
            }
        }
    }

    for (let i = bossKiBlasts.length - 1; i >= 0; i--) {
        let kb = bossKiBlasts[i];
        kb.x += kb.vx * dt;
        kb.y += kb.vy * dt;
        kb.life--;

        if (Math.hypot(kb.x - player.x, kb.y - player.y) < kb.radius + player.radius) {
            if (player.invulnerableTimer <= 0) {
                player.hp -= kb.damage;
                player.invulnerableTimer = 40;
                playSynthSound('player_hit');
                screenShake = 16;
            }
            bossKiBlasts.splice(i, 1);
            continue;
        }

        for (let ally of allies) {
            if (Math.hypot(kb.x - ally.x, kb.y - ally.y) < kb.radius + ally.radius) {
                ally.hp -= kb.damage;
                bossKiBlasts.splice(i, 1);
                break;
            }
        }

        if (kb.life <= 0) bossKiBlasts.splice(i, 1);
    }

    for (let i = allies.length - 1; i >= 0; i--) {
        if (allies[i].hp <= 0) {
            allies.splice(i, 1);
            allyRespawnQueue.push(RESPAWN_DELAY_FRAMES);
        }
    }

    if (monster.phase === 1) {
        for (let i = fans.length - 1; i >= 0; i--) {
            if (fans[i].hp <= 0) {
                fans.splice(i, 1);
                fanRespawnQueue.push(RESPAWN_DELAY_FRAMES);
            }
        }
    }

    let hpUi = document.getElementById('player-hp-ui');
    if (hpUi) hpUi.innerText = Math.max(0, Math.floor(player.hp));

    let badgeStatusMode = document.getElementById('badge-status-mode') || document.getElementById('badge-timer');
    if (badgeStatusMode) {
        badgeStatusMode.innerHTML = monster.phase === 2 
            ? `Quân ta: <b style="color:#38bdf8">${allies.length + 1}</b> | Phốt: <b style="color:#f59e0b">${player.arenaPapersCollected}/10</b>`
            : `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b> vs Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;
    }

    if (player.hp <= 0) {
        isGameOver = true;
        playSynthSound('player_hit');
        try { bossBgmAudio.pause(); monsterAudio.pause(); } catch(e){}
        showModal('BẠN ĐÃ THẤT BẠI!', 'Bạn đã bị đánh bại trước sức mạnh thức tỉnh của Trường Giang.');
        return;
    }

    if (monster.phase === 2 && monster.hp <= 0) {
        isVictory = true;
        playSynthSound('win');
        try { bossBgmAudio.pause(); monsterAudio.pause(); } catch(e){}
        showModal('CHIẾN THẮNG TUYỆT ĐỐI!', 'Bạn và cộng đồng mạng đã đánh bại Mười Khó thức tỉnh!');
        return;
    }
}

// ======================= 10. VẼ ĐỒ HỌA & MINI-MAP RADAR DARK DECEPTION =======================
function drawMinimap() {
    if (gameState !== 'MAZE') return;

    const radarR = 85; 
    const pad = 16;
    const cx = canvas.width - radarR - pad;
    const cy = 85 + radarR;

    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, radarR, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(8, 14, 28, 0.94)';
    ctx.fillRect(cx - radarR, cy - radarR, radarR * 2, radarR * 2);

    const radarWorldRange = 12 * TILE_SIZE;
    const scale = radarR / radarWorldRange;

    let pCol = Math.floor(player.x / TILE_SIZE);
    let pRow = Math.floor(player.y / TILE_SIZE);

    ctx.fillStyle = '#1e293b';
    for (let r = pRow - 12; r <= pRow + 12; r++) {
        for (let c = pCol - 12; c <= pCol + 12; c++) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS && maze[r] && maze[r][c] === 1) {
                let tileCenterX = c * TILE_SIZE + TILE_SIZE / 2;
                let tileCenterY = r * TILE_SIZE + TILE_SIZE / 2;
                let distToP = Math.hypot(tileCenterX - player.x, tileCenterY - player.y);
                if (distToP <= radarWorldRange + 32) {
                    let rx = cx + (tileCenterX - player.x) * scale;
                    let ry = cy + (tileCenterY - player.y) * scale;
                    let size = TILE_SIZE * scale;
                    ctx.fillRect(rx - size / 2, ry - size / 2, size, size);
                }
            }
        }
    }

    ctx.fillStyle = '#f59e0b';
    for (let p of papers) {
        let dx = p.x - player.x;
        let dy = p.y - player.y;
        if (Math.hypot(dx, dy) <= radarWorldRange) {
            ctx.beginPath();
            ctx.arc(cx + dx * scale, cy + dy * scale, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let it of mazeItems) {
        let dx = it.x - player.x;
        let dy = it.y - player.y;
        if (Math.hypot(dx, dy) <= radarWorldRange) {
            ctx.fillStyle = it.type === 'shield' ? '#38bdf8' : '#c084fc';
            ctx.beginPath();
            ctx.arc(cx + dx * scale, cy + dy * scale, 4.0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Vẽ các bản sao trên Radar
    ctx.fillStyle = '#a855f7';
    for (let h of mazeHelpers) {
        let dx = h.x - player.x;
        let dy = h.y - player.y;
        if (Math.hypot(dx, dy) <= radarWorldRange) {
            ctx.beginPath();
            ctx.arc(cx + dx * scale, cy + dy * scale, 3.0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    let mDx = monster.x - player.x;
    let mDy = monster.y - player.y;
    if (Math.hypot(mDx, mDy) <= radarWorldRange) {
        let pulse = 4.0 + Math.sin(Date.now() / 90) * 2.0;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.beginPath();
        ctx.arc(cx + mDx * scale, cy + mDy * scale, pulse + 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx + mDx * scale, cy + mDy * scale, pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#00a8ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbc531';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(player.angle) * 9, cy + Math.sin(player.angle) * 9);
    ctx.lineTo(cx + Math.cos(player.angle + 2.5) * 4.5, cy + Math.sin(player.angle + 2.5) * 4.5);
    ctx.lineTo(cx + Math.cos(player.angle - 2.5) * 4.5, cy + Math.sin(player.angle - 2.5) * 4.5);
    ctx.closePath();
    ctx.fill();

    let sweepAngle = (Date.now() / 700) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * radarR, cy + Math.sin(sweepAngle) * radarR);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radarR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(2, 132, 199, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radarR * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR KHU VỰC', cx, cy + radarR + 13);
    ctx.restore();
}

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

    // --- A. VẼ BẢN ĐỒ ---
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
                ctx.fillStyle = gameState === 'ARENA' ? (monster.phase === 2 ? '#160914' : '#0f172a') : '#080d1a';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = monster.phase === 2 ? '#450a2e' : '#1e293b';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // --- B. VẼ 50 BÀI PHỐT MÊ CUNG ---
    if (gameState === 'MAZE') {
        let floatVal = Math.sin(Date.now() / 160) * 4;
        for (let p of papers) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.beginPath();
            ctx.arc(p.x, p.y + floatVal, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(p.x - 8, p.y - 12 + floatVal, 16, 24);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x - 8, p.y - 12 + floatVal, 16, 24);

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(p.x - 5, p.y - 7 + floatVal, 10, 2.5);
            ctx.fillRect(p.x - 5, p.y - 2 + floatVal, 10, 2.5);
            ctx.fillRect(p.x - 5, p.y + 3 + floatVal, 7, 2.5);
        }
    }

    // --- C. VẼ VẬT PHẨM MÊ CUNG ---
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
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('🛡️', -8, 5);
            } else if (item.type === 'phone') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('📱', -7, 5);
            }
            ctx.restore();
        }
    }

    // --- D. VẼ SÓNG TIẾNG GẦM PHÁ ẢO ẢNH CỦA QUÁI TRONG MÊ CUNG ---
    if (gameState === 'MAZE' && monster.roarWaveActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(mX, mY, monster.roarWaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // --- E. VẼ PHÂN THÂN & ĐỒNG MINH (NGOẠI HÌNH Y HỆT NGƯỜI CHƠI) ---
    if (gameState === 'MAZE') {
        for (let helper of mazeHelpers) {
            ctx.save();
            ctx.translate(helper.x, helper.y);

            if (helper.revealTimer > 0) {
                let pingR = 25 + (300 - helper.revealTimer) % 35;
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, pingR, 0, Math.PI * 2);
                ctx.stroke();

                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'center';
                ctx.fillText(`⚠️ LỘ VỊ TRÍ (${Math.ceil(helper.revealTimer / 60)}s)`, 0, -helper.radius - 24);
            }

            if (helper.stunTimer > 0) {
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💫', 0, -helper.radius - 18);
            }

            // Tên hiển thị giống hệt người chơi
            ctx.font = 'bold 13px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(helper.name || player.name, 0, -helper.radius - 8);

            // Hình tròn và mũi nhọn giống hệt người chơi để đánh lừa hoàn toàn thị giác
            ctx.rotate(helper.angle || 0);
            ctx.fillStyle = helper.color || player.color;
            ctx.beginPath();
            ctx.arc(0, 0, helper.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#fbc531';
            ctx.beginPath();
            ctx.moveTo(helper.radius + 10, 0);
            ctx.lineTo(helper.radius - 4, -9);
            ctx.lineTo(helper.radius - 4, 9);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // --- F. VẼ 10 BÀI PHỐT ĐẤU TRƯỜNG Ở PHASE 2 ---
    if (gameState === 'ARENA' && monster.phase === 2) {
        let pFloat = Math.sin(Date.now() / 140) * 4;
        for (let ap of arenaPapers) {
            ctx.save();
            ctx.translate(ap.x, ap.y + pFloat);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-7, -10, 14, 20);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(-7, -10, 14, 20);
            ctx.restore();
        }
    }

    // --- G. VẼ SÓNG ÂM DBZ & NÓN TẦM NHÌN ---
    for (let sw of clashShockwaves) {
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

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
        ctx.restore();
    }

    // --- H. VẼ SỢI CHỈ ĐỎ TRUY ĐUỔI NHẮM VÀO MỤC TIÊU QUÁI ĐANG CHỌN ---
    if (gameState === 'MAZE' && monster.isChasing && monster.lockedTarget) {
        let chaseTarget = monster.lockedTarget;
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(mX, mY);
        let midX = (mX + chaseTarget.x) / 2 + (Math.random() - 0.5) * 6;
        let midY = (mY + chaseTarget.y) / 2 + (Math.random() - 0.5) * 6;
        ctx.quadraticCurveTo(midX, midY, chaseTarget.x, chaseTarget.y);
        ctx.stroke();
        ctx.restore();
    }

    // --- I. VẼ TÚI CỨU THƯƠNG & ĐẠN ---
    if (gameState === 'ARENA' && monster.phase === 1) {
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

    for (let proj of allyProjectiles) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(proj.x - 6, proj.y - 8, 12, 16);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(proj.x - 6, proj.y - 8, 12, 16);
        ctx.restore();
    }

    for (let kb of bossKiBlasts) {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();
        ctx.arc(kb.x, kb.y, kb.radius + 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(kb.x, kb.y, kb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // --- K. VẼ TIA KAMEHAMEHA ---
    if (monster.kameChargingTimer > 0) {
        ctx.save();
        let orbR = 12 + (60 - monster.kameChargingTimer) * 0.4;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.beginPath();
        ctx.arc(mX + Math.cos(monster.kameAngle) * 32, mY + Math.sin(monster.kameAngle) * 32, orbR + 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(mX + Math.cos(monster.kameAngle) * 32, mY + Math.sin(monster.kameAngle) * 32, orbR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (monster.kameBeamTimer > 0) {
        ctx.save();
        let bLen = 1200;
        let bW = 85;
        let cosA = Math.cos(monster.kameAngle);
        let sinA = Math.sin(monster.kameAngle);
        let perpX = -sinA * (bW / 2);
        let perpY = cosA * (bW / 2);

        let grad = ctx.createLinearGradient(mX, mY, mX + cosA * bLen, mY + sinA * bLen);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#38bdf8');
        grad.addColorStop(1, '#0284c7');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(mX + perpX, mY + perpY);
        ctx.lineTo(mX + cosA * bLen + perpX, mY + sinA * bLen + perpY);
        ctx.lineTo(mX + cosA * bLen - perpX, mY + sinA * bLen - perpY);
        ctx.lineTo(mX - perpX, mY - perpY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // --- L. VẼ ĐỒNG MINH VÀ FAN TRONG ĐẤU TRƯỜNG ---
    if (gameState === 'ARENA') {
        for (let ally of allies) {
            ctx.save();
            ctx.fillStyle = ally.type === 'melee' ? '#f8fafc' : '#bae6fd';
            ctx.beginPath();
            ctx.arc(ally.x, ally.y, ally.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = ally.type === 'melee' ? '#94a3b8' : '#0284c7';
            ctx.lineWidth = ally.type === 'melee' ? 3 : 2;
            ctx.stroke();

            let bW = 24, bH = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(ally.x - bW / 2, ally.y - ally.radius - 8, bW, bH);
            ctx.fillStyle = ally.type === 'melee' ? '#38bdf8' : '#22c55e';
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

    // --- M. VẼ QUÁI VẬT & KI AURA / CUỒNG NỘ ---
    if (monster.hasKiAura || monster.enrageTimer > 0) {
        ctx.save();
        let auraR = monster.radius + 18 + Math.sin(Date.now() / 60) * 4;
        let auraGrad = ctx.createRadialGradient(mX, mY, monster.radius, mX, mY, auraR + 15);
        auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.85)');
        auraGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.5)');
        auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(mX, mY, auraR + 15, 0, Math.PI * 2);
        ctx.fill();

        for (let p of monster.kiParticles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(mX, mY);

    let currentBossImg = (monster.phase === 2 && bossPhase2Image.complete && bossPhase2Image.naturalWidth > 0)
        ? bossPhase2Image
        : (monsterImage.complete && monsterImage.naturalWidth > 0 ? monsterImage : null);

    if (currentBossImg) {
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
    ctx.fillStyle = monster.phase === 2 ? '#facc15' : '#f87171';
    ctx.fillText(monster.name, mX, mY + monster.radius + 16);

    // --- N. VẼ NGƯỜI CHƠI ---
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
    ctx.fillText(player.name, 0, -player.radius - (gameState === 'ARENA' ? 16 : 8));

    if (gameState === 'ARENA') {
        let pBarW = 54, pBarH = 6;
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
    ctx.restore();

    // Mũi tên chỉ Boss trong Đấu trường
    if (gameState === 'ARENA') {
        let angleToBoss = Math.atan2(mY - pY, mX - pX);
        let orbitDist = player.radius + 36 + Math.sin(Date.now() / 120) * 3;
        let arrowX = pX + Math.cos(angleToBoss) * orbitDist;
        let arrowY = pY + Math.sin(angleToBoss) * orbitDist;

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angleToBoss);

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

        if (monster.phase === 2 && arenaPapers.length > 0) {
            for (let ap of arenaPapers) {
                let aAngle = Math.atan2(ap.y - pY, ap.x - pX);
                let aDist = player.radius + 26;
                let ax = pX + Math.cos(aAngle) * aDist;
                let ay = pY + Math.sin(aAngle) * aDist;

                ctx.save();
                ctx.translate(ax, ay);
                ctx.rotate(aAngle);
                ctx.fillStyle = '#f59e0b';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-5, -4);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-5, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    // --- Q. VẼ HIỆU ỨNG SÁT THƯƠNG ---
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
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
    }

    ctx.restore(); // Phục hồi Camera

    // --- R. ÁNH SÁNG ĐÈN PIN DARK DECEPTION ---
    if (gameState === 'MAZE') {
        let isChased = (monster.isChasing && monster.lockedTarget === player) || player.revealTimer > 0;
        let lightGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 160,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
        );
        lightGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lightGrad.addColorStop(0.55, isChased ? 'rgba(70, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.35)');
        lightGrad.addColorStop(1, isChased ? 'rgba(40, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.92)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- S. VẼ MINI-MAP RADAR DARK DECEPTION ---
    drawMinimap();

    // --- T. THANH MÁU BOSS HUD ---
    if (gameState === 'ARENA') {
        ctx.save();
        let uiElem = document.getElementById('ui-container');
        let uiBottom = uiElem ? uiElem.getBoundingClientRect().bottom : 60;
        let barW = Math.min(520, canvas.width - 32);
        let barH = 16;
        let barX = (canvas.width - barW) / 2;
        let barY = uiBottom + 26;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.fillRect(barX - 6, barY - 22, barW + 12, barH + 28);
        ctx.strokeStyle = monster.phase === 2 ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 6, barY - 22, barW + 12, barH + 28);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = monster.phase === 2 ? '#facc15' : '#f87171';
        ctx.textAlign = 'left';
        let bossTitle = monster.phase === 2 
            ? '🔥 BOSS: MƯỜI KHÓ (KI AURA X10 SỨC MẠNH)' 
            : '👑 BOSS: TRƯỜNG GIANG (PHASE 1)';
        ctx.fillText(bossTitle, barX, barY - 7);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${Math.floor(monster.hp)} / ${monster.maxHp} HP`, barX + barW, barY - 7);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barW, barH);

        let currentHpRatio = Math.max(0, monster.hp / monster.maxHp);

        if (monster.isShielded) {
            ctx.fillStyle = '#fbbf24';
        } else if (monster.phase === 2) {
            let hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
            hpGrad.addColorStop(0, '#ea580c');
            hpGrad.addColorStop(1, '#f59e0b');
            ctx.fillStyle = hpGrad;
        } else {
            ctx.fillStyle = '#dc2626';
        }

        ctx.fillRect(barX, barY, currentHpRatio * barW, barH);
        ctx.restore();
    }

    // --- U. BANNER THÔNG BÁO ---
    if (notification.timer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        let bannerW = Math.min(520, canvas.width - 32);
        let bannerH = 40;
        let bx = (canvas.width - bannerW) / 2;
        let by = gameState === 'ARENA' ? 165 : 75;
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
    try { 
        bossBgmAudio.pause(); 
        monsterAudio.pause();
        monsterAudio.currentTime = 0;
    } catch(e){}
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
