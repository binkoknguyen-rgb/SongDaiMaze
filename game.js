/**
 * TRÒ CHƠI: SÔNG DÀI MAZE
 * File: game.js
 * Cập nhật:
 * 1. Khắc phục triệt để lỗi mất nhạc Phase 3 (Cơ chế tự động fallback thông minh).
 * 2. Loại bỏ hoàn toàn bong bóng lời thoại / chú thích trên đầu Boss.
 * 3. Bảo toàn trọn vẹn: Map 81x81, 10 bài phốt mê cung phát sáng, Phase 3 Solo 1v1, kỹ năng người chơi mượt mà.
 */

// ======================= 1. TÀI NGUYÊN HÌNH ẢNH & HỆ THỐNG ÂM THANH DỰ PHÒNG =======================
const ASSETS = {
    monsterImg: 'assets/monster.jpg',
    bossPhase2Img: 'assets/boss_phase2.jpg',
    bgmPrimary: 'assets/bgm.mp3',
    bgmSecondary: 'bgm.mp3',
    bossBgmPrimary: 'assets/boss_bgm.mp3',
    bossBgmSecondary: 'boss_bgm.mp3',
    phase3BgmPrimary: 'assets/phase3_bgm.mp3',
    phase3BgmSecondary: 'phase3_bgm.mp3'
};

const monsterImage = new Image();
monsterImage.src = ASSETS.monsterImg;

const bossPhase2Image = new Image();
bossPhase2Image.src = ASSETS.bossPhase2Img;

// Nhạc nền Mê Cung
let bgmAudio = new Audio(ASSETS.bgmPrimary);
bgmAudio.loop = true;
bgmAudio.volume = 0.5;
bgmAudio.addEventListener('error', () => {
    if (bgmAudio.src.includes('assets/bgm.mp3')) {
        bgmAudio.src = ASSETS.bgmSecondary;
        bgmAudio.load();
    }
});

// Nhạc nền Đấu Trường Phase 1 & 2
let bossBgmAudio = new Audio(ASSETS.bossBgmPrimary);
bossBgmAudio.loop = true;
bossBgmAudio.volume = 0.65;
bossBgmAudio.addEventListener('error', () => {
    if (bossBgmAudio.src.includes('assets/boss_bgm.mp3')) {
        bossBgmAudio.src = ASSETS.bossBgmSecondary;
        bossBgmAudio.load();
    }
});

// Nhạc nền Quyết Chiến Phase 3 Solo (Kèm cơ chế chống mất tiếng)
let phase3BgmAudio = new Audio(ASSETS.phase3BgmPrimary);
phase3BgmAudio.loop = true;
phase3BgmAudio.volume = 0.75;

phase3BgmAudio.addEventListener('error', () => {
    if (phase3BgmAudio.src.includes('assets/phase3_bgm.mp3')) {
        // Thử tìm tại thư mục gốc
        phase3BgmAudio.src = ASSETS.phase3BgmSecondary;
        phase3BgmAudio.load();
        phase3BgmAudio.play().catch(() => {
            // Nếu vẫn không có file, tự động phát tiếp nhạc boss_bgm để không bao giờ bị mất nhạc!
            bossBgmAudio.play().catch(() => {});
        });
    } else {
        // Cả 2 đường dẫn đều chưa có file phase3_bgm.mp3 -> Tiếp tục phát boss_bgm
        bossBgmAudio.play().catch(() => {});
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
        phase3BgmAudio.pause();
        initAudioContext();
        bossBgmAudio.currentTime = 0;
        bossBgmAudio.play().catch(() => {});
    } catch (e) {}
}

function playPhase3BGM() {
    try {
        initAudioContext();
        bgmAudio.pause();
        
        let playPromise = phase3BgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Nhạc Phase 3 phát thành công -> Dừng hẳn nhạc cũ
                bossBgmAudio.pause();
            }).catch(() => {
                // Không mở được file Phase 3 -> Giữ nguyên nhạc Boss tiếp tục chạy
                bossBgmAudio.play().catch(() => {});
            });
        }
    } catch (e) {
        bossBgmAudio.play().catch(() => {});
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

// ======================= 3. BẢN ĐỒ MÊ CUNG 81 x 81 & TỐI ƯU BFS =======================
const TILE_SIZE = 64;   
const COLS = 81;        
const ROWS = 81;        
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

    for (let r = 2; r < rows - 2; r++) {
        for (let c = 2; c < cols - 2; c++) {
            if (grid[r][c] === 1 && Math.random() < 0.12) grid[r][c] = 0;
        }
    }

    // Đục thông khu vực 4x4 góc dưới cùng bên phải cho Trường Giang spawn
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
    x: 120,
    y: 120,
    radius: 14,
    baseSpeed: 7.2,
    speed: 7.2,
    angle: 0,
    hp: 10000,
    maxHp: 10000,
    damage: 100,
    attackCooldown: 0,
    revealTimer: 0,
    invulnerableTimer: 0,
    shields: 0,
    hasDetector: false,
    arenaPapersCollected: 0,

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
    baseSpeed: 6.0,
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

    hasKiAura: false,
    kiParticles: [],

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
    currentPath: [],
    speechText: '',
    speechTimer: 0
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

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        triggerPlayerDash();
    } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
        triggerPlayerAOE();
    } else if (e.code === 'KeyR') {
        triggerPlayerHeal();
    }
});

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

            if (player.arenaPapersCollected >= 5 || monster.phase === 3) {
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

    if (dist < 10) {
        input.dx = 0;
        input.dy = 0;
        joystickStick.style.transform = `translate(-50%, -50%)`;
        return;
    }

    if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
    }

    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    let speedNorm = Math.min(1.0, (dist - 10) / (maxR * 0.65));
    input.dx = (dx / dist) * speedNorm;
    input.dy = (dy / dist) * speedNorm;
}

// ======================= 6. VA CHẠM & TRƯỢT GÓC TƯỜNG =======================
function isWall(x, y) {
    let col = Math.floor(x / TILE_SIZE);
    let row = Math.floor(y / TILE_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
    if (!maze[row]) return true;
    return maze[row][col] === 1;
}

function moveEntitySliding(entity, vx, vy) {
    let r = entity.radius;
    let newX = entity.x + vx;
    let newY = entity.y + vy;

    let canMoveX = !isWall(newX + Math.sign(vx) * r, entity.y) &&
                   !isWall(newX + Math.sign(vx) * r, entity.y - r * 0.7) &&
                   !isWall(newX + Math.sign(vx) * r, entity.y + r * 0.7);

    if (canMoveX) entity.x = newX;

    let canMoveY = !isWall(entity.x, newY + Math.sign(vy) * r) &&
                   !isWall(entity.x - r * 0.7, newY + Math.sign(vy) * r) &&
                   !isWall(entity.x + r * 0.7, newY + Math.sign(vy) * r);

    if (canMoveY) entity.y = newY;
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
                    monster.isChasing = true;
                }
            }
        }
    }
}

// ======================= 7. SPAWN QUÂN ĐOÀN & VẬT PHẨM =======================
function spawnSingleAlly(forcedType = null) {
    let side = Math.floor(Math.random() * 4);
    let ax = 120, ay = 120;
    let maxW = (COLS - 2) * TILE_SIZE;
    let maxH = (ROWS - 2) * TILE_SIZE;

    if (side === 0) { ax = 120 + Math.random() * (maxW - 120); ay = 120; }
    else if (side === 1) { ax = maxW; ay = 120 + Math.random() * (maxH - 120); }
    else if (side === 2) { ax = 120 + Math.random() * (maxW - 120); ay = maxH; }
    else { ax = 120; ay = 120 + Math.random() * (maxH - 120); }

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

function spawnArenaPapers() {
    arenaPapers = [];
    let maxW = (COLS - 4) * TILE_SIZE;
    let maxH = (ROWS - 4) * TILE_SIZE;
    for (let i = 0; i < 10; i++) {
        arenaPapers.push({
            x: 200 + Math.random() * (maxW - 200),
            y: 200 + Math.random() * (maxH - 200),
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

// Hàm làm rỗng (Đã loại bỏ toàn bộ chú thích trên đầu Boss)
function triggerMonsterSpeak(text, duration = 160) {}

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
    monster.baseSpeed = 6.0;
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
    monster.hasKiAura = false;
    monster.kiParticles = [];

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

    emptyTiles.sort(() => Math.random() - 0.5);

    papers = [];
    for (let i = 0; i < 10; i++) {
        if (emptyTiles[i]) papers.push(emptyTiles[i]);
    }

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

    // Ẩn cụm nút kỹ năng trong Mê Cung
    let skillsZone = document.getElementById('skills-zone');
    if (skillsZone) skillsZone.classList.add('hidden');

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bài phốt: <b id="paper-count">0</b>/10`;

    let badgeStatusMode = document.getElementById('badge-status-mode') || document.getElementById('badge-timer');
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

    // Hiện cụm nút kỹ năng trong Đấu Trường
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
        statusEl.innerText = '⚡ ĐẠI CHIẾN 51 VS 51! TỔNG PHẢN CÔNG TRƯỜNG GIANG!';
        statusEl.style.color = '#eab308';
    }

    playSynthSound('boss_skill');
}

// CHUYỂN GIAO SANG PHASE 3 SOLO 1V1
function triggerPhase3Solo() {
    monster.phase = 3;
    monster.name = 'Mười Khó (Bản Năng Vô Cực)';
    monster.hp = 100000;
    monster.maxHp = 100000;
    monster.damage = 1800;
    monster.speed = 6.2;
    monster.hasKiAura = true;

    player.maxHp = 100000;
    player.hp = 100000;
    player.damage = 1800;

    // Giải tán toàn bộ quân đoàn
    allies = [];
    fans = [];
    allyRespawnQueue = [];
    fanRespawnQueue = [];
    medkits = [];
    arenaPapers = [];

    // Chuyển sang nhạc nền Phase 3
    playPhase3BGM();

    screenShake = 60;
    playSynthSound('phase_change');

    notification.text = '⚡ BƯỚC VÀO PHASE 3: SOLO 1 VS 1 TỐI THƯỢNG! SỨC MẠNH CÂN BẰNG 100.000 HP & 1.800 DAME!';
    notification.timer = 280;

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = '⚡ PHASE 3: SOLO 1 VS 1 TUYỆT ĐỐI! KHÔNG KHOAN NHƯỢNG!';
        statusEl.style.color = '#eab308';
    }
}

// ======================= 9. VÒNG LẶP LOGIC (UPDATE) =======================
let lastMonsterPathTime = 0;

function update() {
    if (!isPlaying || isGameOver || isVictory || gameState === 'BOSS_POPUP') return;

    let now = Date.now();
    if (screenShake > 0) screenShake *= 0.9;
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.invulnerableTimer > 0) player.invulnerableTimer--;
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.aoeCooldown > 0) player.aoeCooldown--;
    if (player.healCooldown > 0) player.healCooldown--;

    if (monster.attackCooldown > 0) monster.attackCooldown--;
    if (monster.shieldTimer > 0) monster.shieldTimer--;
    if (monster.shieldTimer <= 0) monster.isShielded = false;
    if (monster.stunTimer > 0) monster.stunTimer--;
    if (notification.timer > 0) notification.timer--;

    // Sóng âm DBZ
    for (let i = clashShockwaves.length - 1; i >= 0; i--) {
        let sw = clashShockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.22;
        sw.alpha -= 0.04;
        if (sw.alpha <= 0) clashShockwaves.splice(i, 1);
    }

    // Ki Aura
    if (monster.hasKiAura) {
        for (let i = 0; i < 2; i++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 10 + Math.random() * 32;
            monster.kiParticles.push({
                x: monster.x + Math.cos(angle) * dist,
                y: monster.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -3 - Math.random() * 3,
                size: 3 + Math.random() * 5,
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

    // --- A. DI CHUYỂN NGƯỜI CHƠI ---
    if (player.isDashing) {
        player.dashTimer--;
        let dashSpd = player.speed * 2.8;
        moveEntitySliding(player, player.dashDx * dashSpd, player.dashDy * dashSpd);
        if (player.dashTimer <= 0) player.isDashing = false;
    } else {
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
    }

    // --- B. LOGIC GIAI ĐOẠN 1: MÊ CUNG ---
    if (gameState === 'MAZE') {
        if (player.revealTimer > 0) {
            player.revealTimer--;
            monster.isChasing = true;
        }

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
                        lastPathTime: 0,
                        revealTimer: 0
                    });
                    notification.text = `📱 ĐÃ TRIỆU HỒI CỘNG ĐỒNG MẠNG ĐI GOM BÀI PHỐT GIÚP!`;
                    notification.timer = 160;
                } else if (item.type === 'detector') {
                    player.hasDetector = true;
                    notification.text = `📡 ĐÃ KÍCH HOẠT MÁY DÒ TOÀN NĂNG (DÒ BÀI PHỐT & VẬT PHẨM)!`;
                    notification.timer = 180;
                }
            }
        }

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

                    if (now - helper.lastPathTime > 400 || helper.currentPath.length === 0) {
                        helper.lastPathTime = now;
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

            // Đồng minh nhặt phốt -> Đồng minh bị lộ 5s
            for (let i = papers.length - 1; i >= 0; i--) {
                let p = papers[i];
                if (Math.hypot(helper.x - p.x, helper.y - p.y) < helper.radius + 18) {
                    papers.splice(i, 1);
                    playSynthSound('collect');

                    let collected = 10 - papers.length;
                    let countEl = document.getElementById('paper-count');
                    if (countEl) countEl.innerText = collected;

                    monster.speed = 6.0 + collected * 0.25;

                    helper.revealTimer = 300;
                    player.revealTimer = 0;
                    monster.isChasing = true;

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

                monster.speed = 6.0 + collected * 0.25;

                if (papers.length > 0) {
                    player.revealTimer = 300;
                    notification.text = `⚠️ BẠN BỊ LỘ VỊ TRÍ 5 GIÂY! TỐC ĐỘ QUÁI: ${monster.speed.toFixed(1)}!`;
                    notification.timer = 150;
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
                let anyHelperRevealed = mazeHelpers.some(h => h.revealTimer > 0);
                if (!anyHelperRevealed) {
                    monster.isChasing = false;
                    monster.currentPath = [];
                    monster.patrolTarget = null;
                    monster.lostSightTimer = 0;
                }
            }
        }

        // Khiên hộ mệnh cứu mạng
        if (monster.stunTimer <= 0 && distToPlayer < player.radius + monster.radius) {
            if (player.shields > 0) {
                player.shields--;
                monster.stunTimer = 300; // Stun 5s
                monster.isChasing = false;
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

        // Di chuyển của quái trong mê cung
        if (monster.stunTimer <= 0) {
            let mCol = Math.floor(monster.x / TILE_SIZE);
            let mRow = Math.floor(monster.y / TILE_SIZE);

            if (now - lastMonsterPathTime > 250) {
                lastMonsterPathTime = now;

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

    // --- C. LOGIC GIAI ĐOẠN 2 & 3: ĐẤU TRƯỜNG ---
    if (monster.phase < 3) {
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
    }

    // Chỉ có cục máu rơi ở Phase 1. Từ Phase 2 & 3: Không còn cục máu rơi!
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

    // Nhặt 10 bài phốt Đấu trường ở Phase 2
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

                notification.text = `⚡ BÀI PHỐT (${player.arenaPapersCollected}/10)! SỨC MẠNH: ${Math.floor(player.damage)} DAME, MÁU: ${Math.floor(player.maxHp)} HP!`;
                notification.timer = 150;

                // NHẶT ĐỦ 10 BÀI PHỐT -> ĐẠT 100% SỨC MẠNH BOSS VÀ KÍCH HOẠT PHASE 3 SOLO!
                if (player.arenaPapersCollected >= 10) {
                    triggerPhase3Solo();
                    return;
                }
            }
        }
    }

    // Đồng minh tấn công (Phase 1 & 2)
    if (monster.phase < 3) {
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
                    if (dist > 320) {
                        moveEntitySliding(ally, (dx / dist) * ally.speed, (dy / dist) * ally.speed);
                    } else if (dist < 180) {
                        moveEntitySliding(ally, -(dx / dist) * ally.speed, -(dy / dist) * ally.speed);
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
                        moveEntitySliding(ally, (dx / dist) * ally.speed, (dy / dist) * ally.speed);
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
    }

    // Đạn ném bài phốt của đồng minh
    for (let i = allyProjectiles.length - 1; i >= 0; i--) {
        let proj = allyProjectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
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

    // Fan trung thành tấn công (Phase 1)
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
    }

    // Người chơi tấn công thường
    if (player.attackCooldown <= 0) {
        let distPtoM = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distPtoM <= player.radius + monster.radius + 8) {
            player.attackCooldown = 26;
            let actualDmg = monster.isShielded ? Math.floor(player.damage / 2) : player.damage;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            screenShake = 16;
            addHitVisual(monster.x, monster.y, true);
            playSynthSound('player_hit');

            if (player.arenaPapersCollected >= 5 || monster.phase === 3) {
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

    // Chuyển giao Phase 2
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
    // Phase 2 bị hạ gục -> TỰ ĐỘNG BƯỚC VÀO PHASE 3 SOLO!
    else if (monster.phase === 2 && monster.hp <= 0) {
        triggerPhase3Solo();
        return;
    }

    // AI và kỹ năng Boss
    let primaryTarget = player;
    let minBossTgtDist = Math.hypot(player.x - monster.x, player.y - monster.y);
    let nearbyEnemies = minBossTgtDist < 180 ? 1 : 0;

    if (monster.phase < 3) {
        for (let j = 0; j < allies.length; j++) {
            let a = allies[j];
            let d = Math.hypot(a.x - monster.x, a.y - monster.y);
            if (d < 180) nearbyEnemies++;
            if (d < minBossTgtDist) {
                minBossTgtDist = d;
                primaryTarget = a;
            }
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
            moveEntitySliding(monster, (bDx / bDist) * monster.speed, (bDy / bDist) * monster.speed);
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

                    if (player.arenaPapersCollected >= 5 || monster.phase === 3) {
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

    // KỸ NĂNG TẨY TRẮNG: PHASE 2 & 3 HỒI MÁU NÂNG LÊN 10.000 HP!
    monster.skill3Cooldown--;
    if (monster.hp < monster.maxHp * 0.7 && monster.skill3Cooldown <= 0) {
        monster.skill3Cooldown = 750;
        monster.isShielded = true;
        monster.shieldTimer = 240;
        let healAmt = monster.phase >= 2 ? 10000 : 1000; // Hồi 10.000 HP
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmt);
        playSynthSound('heal');
    }

    // KỸ NĂNG SÓNG GIÓ THỊ PHI
    monster.skill2Cooldown--;
    if ((nearbyEnemies >= 4 || Math.hypot(player.x - monster.x, player.y - monster.y) < 130) && monster.skill2Cooldown <= 0) {
        monster.skill2Cooldown = 520;
        monster.shockwaveActive = true;
        monster.shockwaveRadius = 10;
        playSynthSound('boss_skill');
    }

    if (monster.shockwaveActive) {
        monster.shockwaveRadius += (monster.phase >= 2 ? 16 : 10);
        let maxWave = monster.phase >= 2 ? 380 : 280;

        let checkTargets = monster.phase === 3 ? [player] : [player, ...allies];
        for (let target of checkTargets) {
            let d = Math.hypot(target.x - monster.x, target.y - monster.y);
            if (Math.abs(d - monster.shockwaveRadius) < 18) {
                let waveDmg = monster.phase >= 2 ? 2500 : 150;
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

    // KỸ NĂNG VỖ MẶT
    monster.skill1Cooldown--;
    if (primaryTarget && Math.hypot(primaryTarget.x - monster.x, primaryTarget.y - monster.y) < 180 && monster.skill1Cooldown <= 0) {
        monster.skill1Cooldown = 300;
        monster.singleStrikeTarget = { x: primaryTarget.x, y: primaryTarget.y };
        monster.singleStrikeTimer = 25;
        let strikeDmg = monster.phase >= 2 ? 3500 : 200;
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

    // KỸ NĂNG DRAGON BALL (PHASE 2 & 3)
    if (monster.phase >= 2) {
        // 1. Dịch chuyển tức thời
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

        // 2. Chưởng Ki liên hoàn
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

        // 3. Tia Kamehameha
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
            let checkTargets = monster.phase === 3 ? [player] : [player, ...allies];
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

    // Xử lý đạn Chưởng Ki
    for (let i = bossKiBlasts.length - 1; i >= 0; i--) {
        let kb = bossKiBlasts[i];
        kb.x += kb.vx;
        kb.y += kb.vy;
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

        if (monster.phase < 3) {
            for (let ally of allies) {
                if (Math.hypot(kb.x - ally.x, kb.y - ally.y) < kb.radius + ally.radius) {
                    ally.hp -= kb.damage;
                    bossKiBlasts.splice(i, 1);
                    break;
                }
            }
        }

        if (kb.life <= 0) bossKiBlasts.splice(i, 1);
    }

    // Quản lý tử trận đồng minh
    if (monster.phase < 3) {
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
    }

    // Cập nhật UI
    let hpUi = document.getElementById('player-hp-ui');
    if (hpUi) hpUi.innerText = Math.max(0, Math.floor(player.hp));

    let badgeStatusMode = document.getElementById('badge-status-mode') || document.getElementById('badge-timer');
    if (badgeStatusMode) {
        if (monster.phase === 3) {
            badgeStatusMode.innerHTML = `⚔️ <b style="color:#eab308">SOLO 1 VS 1 TỐI THƯỢNG</b>`;
        } else if (monster.phase === 2) {
            badgeStatusMode.innerHTML = `Quân ta: <b style="color:#38bdf8">${allies.length + 1}</b> | Phốt: <b style="color:#f59e0b">${player.arenaPapersCollected}/10</b>`;
        } else {
            badgeStatusMode.innerHTML = `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b> vs Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;
        }
    }

    if (player.hp <= 0) {
        isGameOver = true;
        playSynthSound('player_hit');
        try { bossBgmAudio.pause(); phase3BgmAudio.pause(); } catch(e){}
        showModal('BẠN ĐÃ THẤT BẠI!', 'Bạn đã bị đánh bại trước sức mạnh thức tỉnh của Trường Giang.');
        return;
    }

    if (monster.phase === 3 && monster.hp <= 0) {
        isVictory = true;
        playSynthSound('win');
        try { bossBgmAudio.pause(); phase3BgmAudio.pause(); } catch(e){}
        showModal('CHIẾN THẮNG TUYỆT ĐỐI!', 'Bạn đã đánh bại Trường Giang trong trận Solo đỉnh cao!');
        return;
    }
}

// ======================= 10. VẼ ĐỒ HỌA (LOẠI BỎ TOÀN BỘ CHÚ THÍCH CỦA BOSS) =======================
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
                ctx.fillStyle = gameState === 'ARENA' ? (monster.phase >= 2 ? '#160914' : '#0f172a') : '#0b1329';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = monster.phase >= 2 ? '#450a2e' : '#1e293b';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // --- B. VẼ 10 BÀI PHỐT MÊ CUNG ---
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
            } else if (item.type === 'detector') {
                ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('📡', -8, 5);
            }
            ctx.restore();
        }
    }

    // --- D. VẼ ĐỒNG MINH TRONG MÊ CUNG ---
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

    // --- E. VẼ 10 BÀI PHỐT ĐẤU TRƯỜNG Ở PHASE 2 ---
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

    // --- F. VẼ SÓNG ÂM DBZ & TẦM NHÌN ---
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

    // --- G. VẼ SỢI CHỈ ĐỎ TRUY ĐUỔI TRONG MÊ CUNG ---
    if (gameState === 'MAZE' && monster.isChasing) {
        let chaseTarget = player;
        let helperRevealed = mazeHelpers.find(h => h.revealTimer > 0);
        if (helperRevealed && player.revealTimer <= 0) {
            chaseTarget = helperRevealed;
        }

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

    // --- H. VẼ TÚI CỨU THƯƠNG (CHỈ Ở PHASE 1) ---
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

    // --- I. VẼ ĐẠN NÉM PHỐT & CHƯỞNG KI ---
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

    // --- L. VẼ ĐỒNG MINH VÀ FAN (CHỈ Ở PHASE 1 & 2) ---
    if (gameState === 'ARENA' && monster.phase < 3) {
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

    // --- M. VẼ QUÁI VẬT & KI AURA (ĐÃ LOẠI BỎ TOÀN BỘ CHÚ THÍCH/LỜI THOẠI) ---
    if (monster.hasKiAura) {
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

    let currentBossImg = (monster.phase >= 2 && bossPhase2Image.complete && bossPhase2Image.naturalWidth > 0)
        ? bossPhase2Image
        : (monsterImage.complete && monsterImage.naturalWidth > 0 ? monsterImage : null);

    if (currentBossImg) {
        ctx.drawImage(currentBossImg, -monster.radius, -monster.radius, monster.radius * 2, monster.radius * 2);
    } else {
        ctx.fillStyle = monster.phase >= 2 ? '#b91c1c' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, monster.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = monster.phase >= 2 ? '#facc15' : '#ffffff';
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
    ctx.fillStyle = monster.phase >= 2 ? '#facc15' : '#f87171';
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

    // --- P. MÁY DÒ TOÀN NĂNG (DÒ BÀI PHỐT & VẬT PHẨM MÊ CUNG) ---
    if (gameState === 'MAZE' && player.hasDetector) {
        let targetsToDetect = [];
        for (let p of papers) targetsToDetect.push({ x: p.x, y: p.y, type: 'paper' });
        for (let it of mazeItems) targetsToDetect.push({ x: it.x, y: it.y, type: it.type });

        if (targetsToDetect.length > 0) {
            let nearestTgt = null;
            let minDist = Infinity;
            for (let t of targetsToDetect) {
                let d = Math.hypot(t.x - pX, t.y - pY);
                if (d < minDist) {
                    minDist = d;
                    nearestTgt = t;
                }
            }

            for (let t of targetsToDetect) {
                let isNearest = (t === nearestTgt);
                let angleToT = Math.atan2(t.y - pY, t.x - pX);
                let orbitDist = isNearest ? (player.radius + 32 + Math.sin(Date.now() / 140) * 3) : (player.radius + 24);

                let arrowX = pX + Math.cos(angleToT) * orbitDist;
                let arrowY = pY + Math.sin(angleToT) * orbitDist;

                ctx.save();
                ctx.translate(arrowX, arrowY);
                ctx.rotate(angleToT);

                let arrowColor = '#f59e0b';
                if (t.type === 'shield') arrowColor = '#38bdf8';
                else if (t.type === 'phone') arrowColor = '#c084fc';

                ctx.fillStyle = isNearest ? arrowColor : 'rgba(255, 255, 255, 0.7)';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = isNearest ? 1.8 : 1;

                ctx.beginPath();
                ctx.moveTo(isNearest ? 11 : 7, 0);
                ctx.lineTo(isNearest ? -7 : -5, isNearest ? -7 : -4);
                ctx.lineTo(isNearest ? -3 : -2, 0);
                ctx.lineTo(isNearest ? -7 : -5, isNearest ? 7 : 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }
    } else if (gameState === 'ARENA') {
        // Mũi tên đỏ chỉ Boss trong Đấu trường
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

        // Mũi tên chỉ bài phốt Đấu trường ở Phase 2
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

    // --- R. ÁNH SÁNG ĐÈN PIN MÊ CUNG ---
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

    // --- S. TRẠNG THÁI VẬT PHẨM MÊ CUNG ---
    if (gameState === 'MAZE') {
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`🛡️ Khiên: ${player.shields}/3`, 20, 85);
        ctx.fillText(`📡 Máy dò: ${player.hasDetector ? 'ĐÃ MỞ (DÒ TẤT CẢ)' : 'CHƯA CÓ'}`, 20, 105);
        ctx.restore();
    }

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
        ctx.strokeStyle = monster.phase >= 2 ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 6, barY - 22, barW + 12, barH + 28);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = monster.phase >= 2 ? '#facc15' : '#f87171';
        ctx.textAlign = 'left';
        let bossTitle = monster.phase === 3 ? '⚡ BOSS: MƯỜI KHÓ (BẢN NĂNG VÔ CỰC - SOLO 1V1)' : 
                       (monster.phase === 2 ? '🔥 BOSS: MƯỜI KHÓ (KI AURA X10 SỨC MẠNH)' : '👑 BOSS: TRƯỜNG GIANG (PHASE 1)');
        ctx.fillText(bossTitle, barX, barY - 7);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${Math.floor(monster.hp)} / ${monster.maxHp} HP`, barX + barW, barY - 7);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barW, barH);

        let currentHpRatio = Math.max(0, monster.hp / monster.maxHp);

        if (monster.isShielded) {
            ctx.fillStyle = '#fbbf24';
        } else if (monster.phase >= 2) {
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
    try { bossBgmAudio.pause(); phase3BgmAudio.pause(); } catch(e){}
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
