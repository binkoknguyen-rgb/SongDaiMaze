/**
 * TRÒ CHƠI: SÔNG DÀI MAZE - DARK DECEPTION EDITION
 * File: game.js
 * Cập nhật:
 * 1. Quái vật tuần tra liên tục khắp mê cung, tuyệt đối không đứng canh bài phốt.
 * 2. Tăng số lượng quái qua các cấp: Lv1 (1 quái), Lv2 (2 quái), Lv3 (4 quái), Lv4 (6 quái).
 * 3. Nâng cấp Phân Thân: Lv3 (5 bản sao), Lv4 (10 bản sao). Quái trong mê cung bỏ toàn bộ skill.
 * 4. Nhạc nền riêng cho từng Level (level1_bgm -> level4_bgm, tự động dự phòng về dark_bgm.mp3), âm thanh quái dùng chung bgm.mp3.
 * 5. Cường hóa mạnh mẽ Boss Đấu Trường (Phase 1: 50.000 HP, Phase 2: 500.000 HP, tăng tốc độ, sát thương & tần suất tung chiêu).
 */

// ======================= 1. CẤU HÌNH 4 LEVEL MÊ CUNG DARK DECEPTION =======================
const MAX_SHIELDS = 3;                 // Tối đa cộng dồn 3 khiên
const SHIELD_KNOCKBACK_FORCE = 55;     // Lực đẩy lùi quái khi Khiên nổ (không xuyên tường)
const HELPER_PORTAL_SPEED_MULT = 1.25; // Tốc độ tăng thêm khi đồng minh chạy vào cổng

const LEVEL_CONFIGS = {
    1: {
        level: 1,
        name: "Level 1: Hành Lang Khởi Đầu",
        cols: 35,
        rows: 35,
        papers: 12,
        monsters: 1,             // Level 1: 1 Quái tuần tra
        monsterBaseSpeed: 7.35,  // Nhanh hơn người chơi (7.0) một chút
        monsterSpeedScale: 0,
        playerSpeedScale: 0,
        shields: 3,
        phones: 0,
        cloneCount: 0,
        cloneCooldown: 0,
        flankAI: false,
        bgmPrimary: 'assets/level1_bgm.mp3',
        bgmSecondary: 'level1_bgm.mp3',
        nextLevelTitle: "🎉 ĐÃ VƯỢT QUA LEVEL 1!",
        nextLevelSub: "Bước sang Level 2: Bản đồ Vừa (51x51) - Nhạc nền mới",
        nextLevelFeatures: `
            <p>👹 <b>Tăng số lượng Quái:</b> Xuất hiện <b>2 Quái vật</b> liên tục tuần tra khắp mê cung!</p>
            <p>⚡ <b>Quái tăng tốc:</b> Mỗi bài phốt nhặt được sẽ khiến đàn quái chạy nhanh hơn!</p>
            <p>📱 <b>Vật phẩm mới - Điện Thoại:</b> Triệu hồi Cộng đồng mạng đi gom bài phốt giúp bạn.</p>
        `
    },
    2: {
        level: 2,
        name: "Level 2: Mê Cung Sương Mù",
        cols: 51,
        rows: 51,
        papers: 25,
        monsters: 2,             // Level 2: 2 Quái tuần tra
        monsterBaseSpeed: 6.85,
        monsterSpeedScale: 0.06,
        playerSpeedScale: 0,
        shields: 4,
        phones: 4,
        cloneCount: 0,
        cloneCooldown: 0,
        flankAI: false,
        bgmPrimary: 'assets/level2_bgm.mp3',
        bgmSecondary: 'level2_bgm.mp3',
        nextLevelTitle: "🎉 ĐÃ VƯỢT QUA LEVEL 2!",
        nextLevelSub: "Bước sang Level 3: Bản đồ Lớn (71x71) - Nhạc nền mới",
        nextLevelFeatures: `
            <p>👹 <b>Bầy Quái Săn Mồi:</b> Tăng lên <b>4 Quái vật</b> phối hợp tuần tra và chặn đầu từ nhiều hướng!</p>
            <p>👤 <b>Mở khóa Kỹ năng Phân Thân:</b> Triệu hồi <b>5 bản sao</b> cùng lúc đánh lạc hướng quái (Phím F / Nút bấm).</p>
            <p>⚡ <b>Cơ chế Bứt tốc:</b> Cả Bạn và Quái đều được <b>tăng tốc độ</b> qua mỗi mốc bài phốt đã nhặt!</p>
        `
    },
    3: {
        level: 3,
        name: "Level 3: Ngục Tối Hỗn Loạn",
        cols: 71,
        rows: 71,
        papers: 40,
        monsters: 4,             // Level 3: 4 Quái tuần tra & bao vây
        monsterBaseSpeed: 6.75,
        monsterSpeedScale: 0.045,
        playerSpeedScale: 0.45,
        shields: 6,
        phones: 6,
        cloneCount: 5,           // Kỹ năng phân thân: 5 bản sao
        cloneCooldown: 2700,     // 45 giây hồi chiêu
        flankAI: true,
        bgmPrimary: 'assets/level3_bgm.mp3',
        bgmSecondary: 'level3_bgm.mp3',
        nextLevelTitle: "🎉 ĐÃ VƯỢT QUA LEVEL 3!",
        nextLevelSub: "Bước sang Level 4: Ác Mộng Khổng Lồ (91x91) - Nhạc nền mới",
        nextLevelFeatures: `
            <p>👹 <b>Đại Dịch Quái Vật (Dark Deception):</b> Tăng lên <b>6 Quái vật</b> rình rập khắp mọi ngả đường!</p>
            <p>👤 <b>Phân Thân Cực Đại:</b> Nâng cấp kỹ năng lên <b>10 bản sao</b> xuất hiện cùng lúc!</p>
            <p>🔥 <b>Thử thách cuối:</b> Thu thập đủ <b>50 bài phốt</b> và dẫn đoàn quân bản sao tiến vào Đấu Trường Boss!</p>
        `
    },
    4: {
        level: 4,
        name: "Level 4: Ác Mộng Dark Deception",
        cols: 91,
        rows: 91,
        papers: 50,
        monsters: 6,             // Level 4: 6 Quái tuần tra khắp bản đồ
        monsterBaseSpeed: 6.7,
        monsterSpeedScale: 0.04,
        playerSpeedScale: 0.55,
        shields: 8,
        phones: 8,
        cloneCount: 10,          // Nâng cấp phân thân: 10 bản sao
        cloneCooldown: 3600,     // 60 giây hồi chiêu
        flankAI: true,
        bgmPrimary: 'assets/level4_bgm.mp3',
        bgmSecondary: 'level4_bgm.mp3'
    }
};

let currentLevel = 1;
let savedHelpersForNextLevel = [];

// ======================= 2. TÀI NGUYÊN HÌNH ẢNH & HỆ THỐNG ÂM THANH 4 LEVEL =======================
const ASSETS = {
    monsterImg: 'assets/monster.jpg',
    bossPhase2Img: 'assets/boss_phase2.jpg',
    fallbackDarkBgmPrimary: 'assets/dark_bgm.mp3',
    fallbackDarkBgmSecondary: 'dark_bgm.mp3',
    monsterSoundPrimary: 'assets/bgm.mp3',
    monsterSoundSecondary: 'bgm.mp3',
    bossBgmPrimary: 'assets/boss_bgm.mp3',
    bossBgmSecondary: 'boss_bgm.mp3'
};

const monsterImage = new Image();
monsterImage.src = ASSETS.monsterImg;

const bossPhase2Image = new Image();
bossPhase2Image.src = ASSETS.bossPhase2Img;

// Quản lý 4 bản nhạc nền riêng cho 4 Level (Kèm cơ chế tự động dự phòng về dark_bgm.mp3 nếu thiếu file)
let levelBgmAudios = {};
let activeLevelBgm = null;

for (let lvl = 1; lvl <= 4; lvl++) {
    let cfg = LEVEL_CONFIGS[lvl];
    let aud = new Audio(cfg.bgmPrimary);
    aud.loop = true;
    aud.volume = 0.5;
    aud.stepFallback = 0;

    aud.addEventListener('error', () => {
        if (aud.stepFallback === 0) {
            aud.stepFallback = 1;
            aud.src = cfg.bgmSecondary;
            aud.load();
        } else if (aud.stepFallback === 1) {
            aud.stepFallback = 2;
            aud.src = ASSETS.fallbackDarkBgmPrimary;
            aud.load();
        } else if (aud.stepFallback === 2) {
            aud.stepFallback = 3;
            aud.src = ASSETS.fallbackDarkBgmSecondary;
            aud.load();
        }
    });
    levelBgmAudios[lvl] = aud;
}

// Âm thanh Quái vật dùng chung cho cả 4 Level (bgm.mp3)
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

function stopAllLevelBGMs() {
    for (let lvl = 1; lvl <= 4; lvl++) {
        try {
            levelBgmAudios[lvl].pause();
            levelBgmAudios[lvl].currentTime = 0;
        } catch (e) {}
    }
}

function playLevelBGM(lvl) {
    try {
        initAudioContext();
        bossBgmAudio.pause();
        stopAllLevelBGMs();

        activeLevelBgm = levelBgmAudios[lvl] || levelBgmAudios[1];
        let p = activeLevelBgm.play();
        if (p !== undefined) {
            p.catch(() => {
                const unlock = () => {
                    if (gameState === 'MAZE' && activeLevelBgm) {
                        activeLevelBgm.play().catch(() => {});
                    }
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
        stopAllLevelBGMs();
        monsterAudio.pause();
        monsterAudio.currentTime = 0;
        initAudioContext();
        bossBgmAudio.currentTime = 0;
        bossBgmAudio.play().catch(() => {});
    } catch (e) {}
}

function updateMonsterProximityAudio(minDist) {
    if (gameState !== 'MAZE') {
        if (!monsterAudio.paused) monsterAudio.pause();
        return;
    }

    const maxHearDist = 1150;
    if (minDist < maxHearDist) {
        let intensity = Math.max(0, 1.0 - (minDist / maxHearDist));
        let targetVol = Math.min(1.0, Math.pow(intensity, 1.2));
        monsterAudio.volume = targetVol;

        if (monsterAudio.paused && targetVol > 0.05) {
            monsterAudio.play().catch(() => {});
        }

        heartbeatTimer++;
        let beatInterval = Math.max(15, Math.floor(64 - intensity * 45));
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
        } else if (type === 'portal_open') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.exponentialRampToValueAtTime(990, now + 0.5);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'clone') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.22);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
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
        } else if (type === ' boss_skill') {
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

// ======================= 3. THIẾT LẬP CANVAS & BẢN ĐỒ ĐỘNG =======================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth || document.documentElement.clientWidth || 800;
    canvas.height = window.innerHeight || document.documentElement.clientHeight || 600;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const TILE_SIZE = 84; // Hành lang rộng 84px chuẩn Dark Deception
let COLS = 35;        
let ROWS = 35;        
let maze = [];
let screenShake = 0;

const MAX_BFS_TILES = 95 * 95;
const bfsVisited = new Uint8Array(MAX_BFS_TILES);
const bfsParentC = new Int16Array(MAX_BFS_TILES);
const bfsParentR = new Int16Array(MAX_BFS_TILES);
const bfsQueueC = new Int16Array(MAX_BFS_TILES);
const bfsQueueR = new Int16Array(MAX_BFS_TILES);

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

    // Đục thông 24% vách ngăn để tạo mạng lưới vòng lặp kiểu Dark Deception (ít ngõ cụt, dễ chạy thoát khi bị nhiều quái vây)
    for (let r = 2; r < rows - 2; r++) {
        for (let c = 2; c < cols - 2; c++) {
            if (grid[r][c] === 1 && Math.random() < 0.24) grid[r][c] = 0;
        }
    }

    // Đục thông các khu vực spawn cho 6 Quái vật
    const midC = Math.floor(cols / 2);
    const midR = Math.floor(rows / 2);
    const clearZones = [
        { rStart: rows - 5, rEnd: rows - 2, cStart: cols - 5, cEnd: cols - 2 }, // Dưới-Phải
        { rStart: 2, rEnd: 5, cStart: cols - 5, cEnd: cols - 2 },               // Trên-Phải
        { rStart: rows - 5, rEnd: rows - 2, cStart: 2, cEnd: 5 },               // Dưới-Trái
        { rStart: midR - 2, rEnd: midR + 2, cStart: midC - 2, cEnd: midC + 2 }, // Giữa bản đồ
        { rStart: midR - 2, rEnd: midR + 2, cStart: cols - 5, cEnd: cols - 2 }, // Giữa-Phải
        { rStart: rows - 5, rEnd: rows - 2, cStart: midC - 2, cEnd: midC + 2 }  // Dưới-Giữa
    ];

    for (let z of clearZones) {
        for (let r = z.rStart; r <= z.rEnd; r++) {
            for (let c = z.cStart; c <= z.cEnd; c++) {
                if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
                    grid[r][c] = 0;
                }
            }
        }
    }

    return grid;
}

const ARENA_SIZE = 35;
let arenaBounds = { minC: 0, maxC: 0, minR: 0, maxR: 0 };

function collapseMazeToArena() {
    COLS = 91;
    ROWS = 91;
    maze = Array.from({ length: ROWS }, () => Array(COLS).fill(1));

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
            if (r >= ROWS - 5 && c >= COLS - 5) continue;
            if (maze[r] && maze[r][c] === 0) {
                empty.push({ x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2, c, r });
            }
        }
    }
    return empty;
}

function findNearestOpenCell(col, row) {
    col = Math.max(1, Math.min(COLS - 2, col));
    row = Math.max(1, Math.min(ROWS - 2, row));
    if (maze[row] && maze[row][col] === 0) return [col, row];

    for (let rad = 1; rad <= 5; rad++) {
        for (let dr = -rad; dr <= rad; dr++) {
            for (let dc = -rad; dc <= rad; dc++) {
                let nr = row + dr, nc = col + dc;
                if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && maze[nr] && maze[nr][nc] === 0) {
                    return [nc, nr];
                }
            }
        }
    }
    return [1, 1];
}

function keepEntityInOpenMaze(entity) {
    let col = Math.floor(entity.x / TILE_SIZE);
    let row = Math.floor(entity.y / TILE_SIZE);
    if (row <= 0 || row >= ROWS - 1 || col <= 0 || col >= COLS - 1 || !maze[row] || maze[row][col] === 1) {
        let [openC, openR] = findNearestOpenCell(col, row);
        entity.x = openC * TILE_SIZE + TILE_SIZE / 2;
        entity.y = openR * TILE_SIZE + TILE_SIZE / 2;
    } else {
        resolveCircleTileCollisions(entity);
    }
}

function findPathBFS(startC, startR, targetC, targetR) {
    [startC, startR] = findNearestOpenCell(startC, startR);
    [targetC, targetR] = findNearestOpenCell(targetC, targetR);

    if (startC === targetC && startR === targetR) return [];

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
    baseSpeed: 7.0,
    speed: 7.0,
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

    // KỸ NĂNG PHÂN THÂN (Lv3: 5 bản sao, Lv4: 10 bản sao)
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

let mazeMonsters = [];

let exitPortal = {
    active: false,
    x: 0,
    y: 0,
    radius: 30
};

// Đối tượng Boss Siêu Cường Hóa trong Đấu Trường
let monster = {
    phase: 1,
    name: 'Trường Giang',
    x: 0,
    y: 0,
    radius: 30,
    baseSpeed: 6.8,
    speed: 6.8,
    angle: 0,
    hp: 50000,
    maxHp: 50000,
    damage: 450,
    attackCooldown: 0,
    postAttackPause: 0,
    isShielded: false,
    shieldTimer: 0,
    hasKiAura: false,
    kiParticles: [],

    skill1Cooldown: 180,
    skill2Cooldown: 300,
    skill3Cooldown: 500,

    teleportCooldown: 200,
    kiBlastCooldown: 180,
    kamehamehaCooldown: 380,
    kameChargingTimer: 0,
    kameBeamTimer: 0,
    kameAngle: 0,

    shockwaveRadius: 0,
    shockwaveActive: false,
    singleStrikeTarget: null,
    singleStrikeTimer: 0
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
    let cfg = LEVEL_CONFIGS[currentLevel];
    if (!cfg || cfg.cloneCount <= 0) return;

    if (player.cloneCooldown <= 0 && isPlaying && !isGameOver && !isVictory) {
        player.cloneCooldown = cfg.cloneCooldown;
        player.clonesToSpawn = cfg.cloneCount; // Lv3: 5 phân thân, Lv4: 10 phân thân
        player.cloneSpawnDelay = 0;

        notification.text = `👤 PHÂN THÂN CHI THUẬT (${cfg.cloneCount} BẢN SAO)! TỎA ĐI KHẮP MÊ CUNG!`;
        notification.timer = 160;
    }
}

function triggerPlayerDash() {
    if (gameState !== 'ARENA') return;
    if (player.dashCooldown <= 0 && !player.isDashing && isPlaying && !isGameOver && !isVictory) {
        player.isDashing = true;
        player.dashTimer = 15;
        player.dashCooldown = 210; // 3.5s hồi chiêu
        player.invulnerableTimer = 26;

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
        player.aoeCooldown = 420; // 7s hồi chiêu
        playSynthSound('player_aoe');
        screenShake = 24;

        hitEffects.push({
            x: player.x,
            y: player.y,
            radius: 15,
            maxRadius: 250,
            lineWidth: 6,
            color: '#facc15',
            alpha: 1.0
        });

        for (let fan of fans) {
            if (Math.hypot(fan.x - player.x, fan.y - player.y) < 250) {
                fan.hp -= player.damage * 4;
                addHitVisual(fan.x, fan.y, true, `-${player.damage * 4} 💥`, '#facc15');
            }
        }

        if (gameState === 'ARENA' && Math.hypot(monster.x - player.x, monster.y - player.y) < 250) {
            let actualDmg = monster.isShielded ? Math.floor(player.damage * 1.5) : (player.damage * 4);
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
        player.healCooldown = 540; // 9s hồi chiêu
        // Hồi 20% máu tối đa (tối thiểu 3.500 HP) để cân bằng với sát thương khủng của Boss Phase 2
        let healAmount = Math.max(3500, Math.floor(player.maxHp * 0.20));
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        playSynthSound('heal');
        notification.text = `💚 HỒI MÁU +${healAmount} HP! HIỆN CÓ: ${Math.floor(player.hp)}/${player.maxHp}`;
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

// JOYSTICK MOBILE
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
    const maxR = 50;
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

    input.dx = dx / dist;
    input.dy = dy / dist;
}

// ======================= 6. VẬT LÝ TRƯỢT TƯỜNG ĐẨY VUÔNG GÓC =======================
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

function updateSingleMonsterVision(m) {
    if (m.stunTimer > 0) {
        m.visionPolygon = [];
        return;
    }

    let rayCount = 30;
    let startAngle = m.angle - m.fov / 2;
    let stepAngle = m.fov / rayCount;

    m.visionPolygon = [];
    for (let i = 0; i <= rayCount; i++) {
        let a = startAngle + i * stepAngle;
        let hitPoint = castRayForVisionArea(m.x, m.y, a, m.visionRange);
        m.visionPolygon.push(hitPoint);
    }

    let allPrey = [player, ...mazeHelpers];
    let bestVisibleTarget = null;
    let minVisibleDist = Infinity;

    for (let target of allPrey) {
        let distToT = Math.hypot(target.x - m.x, target.y - m.y);
        if (distToT <= m.visionRange) {
            let angleToT = Math.atan2(target.y - m.y, target.x - m.x);
            let angleDiff = Math.atan2(Math.sin(angleToT - m.angle), Math.cos(angleToT - m.angle));

            if (Math.abs(angleDiff) <= m.fov / 2) {
                if (hasLineOfSight(m.x, m.y, target.x, target.y)) {
                    if (distToT < minVisibleDist) {
                        minVisibleDist = distToT;
                        bestVisibleTarget = target;
                    }
                }
            }
        }
    }

    if (bestVisibleTarget) {
        m.isChasing = true;
        m.lockedTarget = bestVisibleTarget;
        m.lostSightTimer = 0;

        if (LEVEL_CONFIGS[currentLevel].flankAI) {
            for (let otherM of mazeMonsters) {
                if (otherM !== m && !otherM.isChasing && otherM.stunTimer <= 0) {
                    otherM.isChasing = true;
                    otherM.lockedTarget = bestVisibleTarget;
                    otherM.lostSightTimer = 0;
                }
            }
        }
    }
}

// ======================= 7. SPAWN QUÁI VẬT TUẦN TRA TOÀN BẢN ĐỒ & CỔNG THOÁT HIỂM =======================
function spawnExitPortal() {
    let emptyTiles = getEmptyTiles();
    emptyTiles.sort((a, b) => Math.hypot(b.x - player.x, b.y - player.y) - Math.hypot(a.x - player.x, a.y - player.y));
    let chosen = emptyTiles[0] || { x: (COLS - 3) * TILE_SIZE, y: (ROWS - 3) * TILE_SIZE };

    exitPortal.x = chosen.x;
    exitPortal.y = chosen.y;
    exitPortal.radius = 30;
    exitPortal.active = true;

    for (let h of mazeHelpers) {
        h.targetPaper = null;
        h.currentPath = [];
        h.headingToPortal = true;
    }

    playSynthSound('portal_open');
    screenShake = 20;

    notification.text = `🌀 CỔNG ĐÃ MỞ! ĐỒNG MINH & PHÂN THÂN ĐANG RÚT VÀO CỔNG ĐỂ HỖ TRỢ MÀN SAU!`;
    notification.timer = 240;

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = '🌀 CỔNG ĐÃ MỞ! HÃY CHẠY THEO SỢI DÂY MÀU XANH LÁ ĐỂ QUA MÀN!';
        statusEl.style.color = '#22c55e';
    }
}

function createMazeMonster(index, cfg) {
    let midC = Math.floor(COLS / 2);
    let midR = Math.floor(ROWS / 2);
    let spawnPoints = [
        { x: (COLS - 3.5) * TILE_SIZE, y: (ROWS - 3.5) * TILE_SIZE }, // Góc dưới phải
        { x: (COLS - 3.5) * TILE_SIZE, y: 3.5 * TILE_SIZE },          // Góc trên phải
        { x: 3.5 * TILE_SIZE, y: (ROWS - 3.5) * TILE_SIZE },          // Góc dưới trái
        { x: midC * TILE_SIZE, y: midR * TILE_SIZE },                 // Trung tâm mê cung
        { x: (COLS - 3.5) * TILE_SIZE, y: midR * TILE_SIZE },         // Cạnh phải giữa
        { x: midC * TILE_SIZE, y: (ROWS - 3.5) * TILE_SIZE }          // Cạnh dưới giữa
    ];
    let pt = spawnPoints[index % spawnPoints.length];
    let roles = ['chaser', 'interceptor', 'flanker'];

    return {
        id: index,
        name: cfg.monsters > 1 ? `Trường Giang #${index + 1}` : 'Trường Giang',
        role: roles[index % roles.length],
        x: pt.x,
        y: pt.y,
        radius: 16,
        baseSpeed: cfg.monsterBaseSpeed,
        speed: cfg.monsterBaseSpeed,
        visionRange: 540,
        breakDistance: 460,
        lostSightTimer: 0,
        angle: 0,
        moveAngle: 0,
        fov: Math.PI * 1.33,
        visionPolygon: [],
        stunTimer: 0,
        isChasing: false,
        lockedTarget: null,
        currentPath: [],
        lastPathTime: index * 75,
        patrolTargetTile: null
    };
}

// THUẬT TOÁN TUẦN TRA KHẮP MÊ CUNG (KHÔNG BAO GIỜ ĐỨNG CANH BÀI PHỐT)
function assignMonsterPatrolPath(m) {
    let mCol = Math.floor(m.x / TILE_SIZE);
    let mRow = Math.floor(m.y / TILE_SIZE);
    let emptyTiles = getEmptyTiles();
    if (emptyTiles.length === 0) return;

    // Chọn một điểm đến nằm cách xa vị trí hiện tại ít nhất 35% chiều rộng mê cung
    // để buộc quái phải đi xuyên qua các hành lang khắp bản đồ như Dark Deception!
    let minPatrolDist = COLS * 0.35;
    let farTiles = emptyTiles.filter(t => Math.hypot(t.c - mCol, t.r - mRow) >= minPatrolDist);
    let pool = farTiles.length > 0 ? farTiles : emptyTiles;

    let chosen = pool[Math.floor(Math.random() * pool.length)];
    m.patrolTargetTile = chosen;
    m.currentPath = findPathBFS(mCol, mRow, chosen.c, chosen.r);
}

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
        speed: allyType === 'melee' ? 4.4 : 3.8,
        hp: allyType === 'melee' ? 2500 : 200,
        maxHp: allyType === 'melee' ? 2500 : 200,
        damage: allyType === 'ranged' ? 1200 : 80,
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
        speed: 4.3 + Math.random() * 0.8,
        hp: 400,     // Tăng máu Fan lên 400
        maxHp: 400,
        damage: 150, // Tăng sát thương Fan lên 150
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
            text: customText || '-150',
            color: customColor || '#ffffff',
            size: 13,
            life: 28,
            vy: -1.1
        });
    }
}

// ======================= 8. KHỞI TẠO LEVEL MÊ CUNG =======================
function initLevel(lvl) {
    resizeCanvas();
    currentLevel = lvl;
    let cfg = LEVEL_CONFIGS[currentLevel];

    COLS = cfg.cols;
    ROWS = cfg.rows;
    gameState = 'MAZE';
    maze = generateMaze(COLS, ROWS);
    let emptyTiles = getEmptyTiles();

    player.x = TILE_SIZE * 1.5;
    player.y = TILE_SIZE * 1.5;
    player.baseSpeed = 7.0;
    player.speed = player.baseSpeed;
    player.speedTier = 0;
    player.revealTimer = 0;
    player.invulnerableTimer = 0;
    player.cloneCooldown = 0;
    player.clonesToSpawn = 0;
    player.cloneSpawnDelay = 0;

    if (lvl === 1) {
        player.shields = 0;
        player.hp = 10000;
        player.maxHp = 10000;
        player.damage = 100;
        savedHelpersForNextLevel = [];
    }

    // Phát nhạc nền riêng của Level này
    playLevelBGM(currentLevel);

    exitPortal.active = false;
    mazeHelpers = [];
    hitEffects = [];
    damageTexts = [];
    clashShockwaves = [];

    // Triệu hồi các Phân thân & Đồng minh đã đi qua Cổng từ Level trước
    let carriedOverCount = savedHelpersForNextLevel.length;
    if (carriedOverCount > 0) {
        for (let saved of savedHelpersForNextLevel) {
            mazeHelpers.push({
                x: player.x,
                y: player.y,
                radius: player.radius,
                speed: player.speed * 0.94,
                angle: player.angle,
                color: player.color,
                name: player.name,
                targetPaper: null,
                currentPath: [],
                revealTimer: 0,
                stunTimer: 0,
                isClone: saved.isClone,
                headingToPortal: false
            });
        }
        savedHelpersForNextLevel = [];
    }

    // Khởi tạo Quái vật (Lv1: 1, Lv2: 2, Lv3: 4, Lv4: 6)
    mazeMonsters = [];
    for (let i = 0; i < cfg.monsters; i++) {
        let m = createMazeMonster(i, cfg);
        keepEntityInOpenMaze(m);
        assignMonsterPatrolPath(m);
        mazeMonsters.push(m);
    }

    // Phân bố đều Bài phốt khắp bản đồ
    papers = [];
    let gridCols = lvl === 1 ? 4 : (lvl === 2 ? 5 : (lvl === 3 ? 8 : 10));
    let gridRows = Math.ceil(cfg.papers / gridCols);
    let cellW = (COLS - 2) / gridCols;
    let cellH = (ROWS - 2) / gridRows;

    let availableTiles = [...emptyTiles];
    for (let gy = 0; gy < gridRows && papers.length < cfg.papers; gy++) {
        for (let gx = 0; gx < gridCols && papers.length < cfg.papers; gx++) {
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

    // Rải Khiên và Điện thoại
    mazeItems = [];
    availableTiles.sort(() => Math.random() - 0.5);
    let itemIdx = 0;

    for (let i = 0; i < cfg.shields; i++) {
        if (availableTiles[itemIdx]) {
            mazeItems.push({ x: availableTiles[itemIdx].x, y: availableTiles[itemIdx].y, type: 'shield', radius: 15 });
            itemIdx++;
        }
    }
    for (let i = 0; i < cfg.phones; i++) {
        if (availableTiles[itemIdx]) {
            mazeItems.push({ x: availableTiles[itemIdx].x, y: availableTiles[itemIdx].y, type: 'phone', radius: 15 });
            itemIdx++;
        }
    }

    isGameOver = false;
    isVictory = false;

    let skillsZone = document.getElementById('skills-zone');
    if (skillsZone) skillsZone.classList.add('hidden');

    let mazeSkillsZone = document.getElementById('maze-skills-zone');
    if (mazeSkillsZone) {
        if (cfg.cloneCount > 0) {
            mazeSkillsZone.classList.remove('hidden');
            let lbl = document.getElementById('clone-btn-label');
            if (lbl) lbl.innerText = `PHÂN THÂN (${cfg.cloneCount})`;
        } else {
            mazeSkillsZone.classList.add('hidden');
        }
    }

    updateMazeHUD();

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = `${cfg.name} (${cfg.monsters} Quái): Thu thập ${cfg.papers} bài phốt để mở Cổng!`;
        statusEl.style.color = '#f87171';
    }

    let modalEl = document.getElementById('game-modal');
    if (modalEl) modalEl.classList.add('hidden');
    let lvlModal = document.getElementById('level-up-modal');
    if (lvlModal) lvlModal.classList.add('hidden');
    let introEl = document.getElementById('boss-intro-modal');
    if (introEl) introEl.classList.add('hidden');

    if (carriedOverCount > 0) {
        notification.text = `🔥 ${cfg.name.toUpperCase()}! (${carriedOverCount} Bản sao đã qua cổng cùng bạn!)`;
    } else {
        notification.text = `🔥 BẮT ĐẦU ${cfg.name.toUpperCase()} (${cfg.monsters} QUÁI VẬT TUẦN TRA)!`;
    }
    notification.timer = 170;
}

function updateMazeHUD() {
    let cfg = LEVEL_CONFIGS[currentLevel];
    let collected = cfg.papers - papers.length;

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bài phốt: <b id="paper-count">${collected}</b>/${cfg.papers}`;

    let badgeLevel = document.getElementById('badge-level');
    if (badgeLevel) badgeLevel.innerHTML = `Mê Cung: <b style="color:#38bdf8">Level ${currentLevel}/4 (${cfg.monsters} Quái)</b>`;

    let badgeShield = document.getElementById('badge-shield');
    if (badgeShield) badgeShield.innerHTML = `🛡️ Khiên: <b style="color:#22c55e">${player.shields}</b>/${MAX_SHIELDS}`;
}

function onPortalEntered() {
    exitPortal.active = false;
    monsterAudio.pause();
    playSynthSound('win');

    for (let h of mazeHelpers) {
        savedHelpersForNextLevel.push({ isClone: h.isClone });
    }
    mazeHelpers = [];

    if (currentLevel < 4) {
        gameState = 'LEVEL_POPUP';
        let cfg = LEVEL_CONFIGS[currentLevel];
        let titleEl = document.getElementById('level-modal-title');
        let subEl = document.getElementById('level-modal-subtitle');
        let featEl = document.getElementById('level-modal-features');

        if (titleEl) titleEl.innerText = cfg.nextLevelTitle;
        if (subEl) subEl.innerText = cfg.nextLevelSub;
        if (featEl) {
            let bonusText = savedHelpersForNextLevel.length > 0
                ? `<p style="color:#4ade80; margin-top:6px;">🌀 <b>Đồng đội qua cổng:</b> <b>${savedHelpersForNextLevel.length} Phân thân / Đồng minh</b> đã vào cổng và sẵn sàng hỗ trợ bạn ở Level ${currentLevel + 1}!</p>`
                : '';
            featEl.innerHTML = cfg.nextLevelFeatures + bonusText;
        }

        let lvlModal = document.getElementById('level-up-modal');
        if (lvlModal) lvlModal.classList.remove('hidden');
    } else {
        gameState = 'BOSS_POPUP';
        let introEl = document.getElementById('boss-intro-modal');
        if (introEl) introEl.classList.remove('hidden');
    }
}

function proceedToNextLevel() {
    let lvlModal = document.getElementById('level-up-modal');
    if (lvlModal) lvlModal.classList.add('hidden');
    initLevel(currentLevel + 1);
}

// KHỞI TẠO ĐẤU TRƯỜNG BOSS SIÊU CƯỜNG HÓA
function startBossBattle() {
    let introEl = document.getElementById('boss-intro-modal');
    if (introEl) introEl.classList.add('hidden');

    collapseMazeToArena();
    gameState = 'ARENA';
    mazeItems = [];
    mazeHelpers = [];
    mazeMonsters = [];

    // CƯỜNG HÓA MẠNH MẼ BOSS PHASE 1 (50.000 HP, 450 DAME, TỐC ĐỘ 6.8)
    monster.phase = 1;
    monster.name = 'Trường Giang (Bạo Chúa Đấu Trường)';
    monster.radius = 30;
    monster.speed = 6.8;
    monster.hp = 50000;
    monster.maxHp = 50000;
    monster.damage = 450;
    monster.isShielded = false;
    monster.hasKiAura = false;
    monster.kiParticles = [];
    monster.skill1Cooldown = 180;
    monster.skill2Cooldown = 300;
    monster.skill3Cooldown = 500;

    player.hp = 15000;
    player.maxHp = 15000;
    player.damage = 250;
    player.speed = 7.4;
    player.arenaPapersCollected = 0;

    playBossBGM();

    let mazeSkillsZone = document.getElementById('maze-skills-zone');
    if (mazeSkillsZone) mazeSkillsZone.classList.add('hidden');

    let skillsZone = document.getElementById('skills-zone');
    if (skillsZone) skillsZone.classList.remove('hidden');

    let totalStartingAllies = 50 + savedHelpersForNextLevel.length;
    savedHelpersForNextLevel = [];

    allies = [];
    allyRespawnQueue = [];
    for (let i = 0; i < totalStartingAllies; i++) {
        spawnSingleAlly('melee');
    }

    fans = [];
    fanRespawnQueue = [];
    for (let i = 0; i < 50; i++) {
        spawnSingleFan();
    }

    medkits = [];
    for (let i = 0; i < 4; i++) {
        spawnMedkit();
    }

    let badgeTarget = document.getElementById('badge-target');
    if (badgeTarget) badgeTarget.innerHTML = `Bạn: <b id="player-hp-ui">${player.hp}</b>/${player.maxHp} HP`;

    let badgeLevel = document.getElementById('badge-level');
    if (badgeLevel) badgeLevel.innerHTML = `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b>`;

    let badgeShield = document.getElementById('badge-shield');
    if (badgeShield) badgeShield.innerHTML = `Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;

    let statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerText = '⚡ ĐẤU TRƯỜNG TỬ THẦN! BOSS ĐÃ ĐƯỢC CƯỜNG HÓA SỨC MẠNH CỰC ĐẠI!';
        statusEl.style.color = '#eab308';
    }

    playSynthSound('boss_skill');
}

// ======================= 9. VÒNG LẶP LOGIC (UPDATE) =======================
let lastFrameTime = performance.now();

function update() {
    if (!isPlaying || isGameOver || isVictory || gameState === 'LEVEL_POPUP' || gameState === 'BOSS_POPUP') return;

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
    if (notification.timer > 0) notification.timer--;

    // Hàng đợi xuất hiện tuần tự 5 hoặc 10 bản sao Phân thân
    if (player.clonesToSpawn > 0) {
        player.cloneSpawnDelay--;
        if (player.cloneSpawnDelay <= 0) {
            player.clonesToSpawn--;
            player.cloneSpawnDelay = 10; // Ra nhanh mỗi 0.16s

            mazeHelpers.push({
                x: player.x,
                y: player.y,
                radius: player.radius,
                speed: player.speed * 0.95,
                angle: player.angle,
                color: player.color,
                name: player.name,
                targetPaper: null,
                currentPath: [],
                revealTimer: 0,
                isClone: true,
                headingToPortal: exitPortal.active
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

    // Cập nhật nút hồi chiêu
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

    // --- A. DI CHUYỂN NGƯỜI CHƠI ---
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

    // --- B. LOGIC GIAI ĐOẠN 1: 4 LEVEL MÊ CUNG DARK DECEPTION ---
    if (gameState === 'MAZE') {
        let cfg = LEVEL_CONFIGS[currentLevel];
        if (player.revealTimer > 0) player.revealTimer--;

        let minMonsterDist = Infinity;
        for (let m of mazeMonsters) {
            let d = Math.hypot(m.x - player.x, m.y - player.y);
            if (d < minMonsterDist) minMonsterDist = d;
        }
        updateMonsterProximityAudio(minMonsterDist);

        // 1. Kiểm tra Người chơi bước vào Cổng Thoát Hiểm
        if (exitPortal.active) {
            if (Math.hypot(player.x - exitPortal.x, player.y - exitPortal.y) < player.radius + exitPortal.radius) {
                onPortalEntered();
                return;
            }
        }

        // 2. Nhặt vật phẩm (Giới hạn tối đa 3 Khiên)
        for (let i = mazeItems.length - 1; i >= 0; i--) {
            let item = mazeItems[i];
            if (Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + 6) {
                if (item.type === 'shield') {
                    if (player.shields >= MAX_SHIELDS) {
                        if (notification.timer <= 0) {
                            notification.text = `🛡️ ĐÃ ĐẦY ${MAX_SHIELDS}/${MAX_SHIELDS} KHIÊN! Không thể nhặt thêm cho tới khi khiên bị tiêu hao!`;
                            notification.timer = 90;
                        }
                        continue;
                    }
                    player.shields++;
                    mazeItems.splice(i, 1);
                    playSynthSound('item_pickup');
                    updateMazeHUD();
                    notification.text = `🛡️ ĐÃ NHẶT KHIÊN HỘ MỆNH! (Đang có: ${player.shields}/${MAX_SHIELDS})`;
                    notification.timer = 140;
                } else if (item.type === 'phone') {
                    mazeItems.splice(i, 1);
                    playSynthSound('item_pickup');
                    mazeHelpers.push({
                        x: player.x,
                        y: player.y,
                        radius: player.radius,
                        speed: player.speed * 0.94,
                        angle: player.angle,
                        color: player.color,
                        name: player.name,
                        targetPaper: null,
                        currentPath: [],
                        revealTimer: 0,
                        isClone: false,
                        headingToPortal: exitPortal.active
                    });
                    notification.text = `📱 ĐÃ DÙNG ĐIỆN THOẠI! TRIỆU HỒI ĐỒNG MINH ĐI NHẶT PHỐT GIÚP BẠN!`;
                    notification.timer = 150;
                }
            }
        }

        // 3. Cập nhật Phân thân & Đồng minh
        for (let hIdx = mazeHelpers.length - 1; hIdx >= 0; hIdx--) {
            let helper = mazeHelpers[hIdx];
            if (helper.revealTimer > 0) helper.revealTimer--;

            if (exitPortal.active) {
                let distToPortal = Math.hypot(helper.x - exitPortal.x, helper.y - exitPortal.y);
                if (distToPortal < helper.radius + exitPortal.radius) {
                    savedHelpersForNextLevel.push({ isClone: helper.isClone });
                    hitEffects.push({
                        x: exitPortal.x,
                        y: exitPortal.y,
                        radius: 10,
                        maxRadius: 45,
                        lineWidth: 3,
                        color: '#4ade80',
                        alpha: 1.0
                    });
                    playSynthSound('collect');
                    mazeHelpers.splice(hIdx, 1);
                    notification.text = `🌀 1 Bản sao đã vào Cổng chờ hỗ trợ bạn ở màn sau! (Đã lưu: ${savedHelpersForNextLevel.length})`;
                    notification.timer = 110;
                    continue;
                }

                if (!helper.headingToPortal || !helper.currentPath || helper.currentPath.length === 0) {
                    helper.headingToPortal = true;
                    let hCol = Math.floor(helper.x / TILE_SIZE);
                    let hRow = Math.floor(helper.y / TILE_SIZE);
                    let pCol = Math.floor(exitPortal.x / TILE_SIZE);
                    let pRow = Math.floor(exitPortal.y / TILE_SIZE);
                    helper.currentPath = findPathBFS(hCol, hRow, pCol, pRow);
                }

                let portalRunSpeed = helper.speed * HELPER_PORTAL_SPEED_MULT;
                if (helper.currentPath && helper.currentPath.length > 0) {
                    let nextNode = helper.currentPath[0];
                    let targetX = nextNode[0] * TILE_SIZE + TILE_SIZE / 2;
                    let targetY = nextNode[1] * TILE_SIZE + TILE_SIZE / 2;
                    let hDx = targetX - helper.x;
                    let hDy = targetY - helper.y;
                    let hDist = Math.hypot(hDx, hDy);

                    if (hDist > 1) helper.angle = Math.atan2(hDy, hDx);

                    if (hDist <= portalRunSpeed * dt) {
                        helper.x = targetX;
                        helper.y = targetY;
                        helper.currentPath.shift();
                    } else {
                        moveEntitySliding(helper, (hDx / hDist) * portalRunSpeed * dt, (hDy / hDist) * portalRunSpeed * dt);
                    }
                } else {
                    let hDx = exitPortal.x - helper.x;
                    let hDy = exitPortal.y - helper.y;
                    let hDist = Math.hypot(hDx, hDy) || 1;
                    helper.angle = Math.atan2(hDy, hDx);
                    moveEntitySliding(helper, (hDx / hDist) * portalRunSpeed * dt, (hDy / hDist) * portalRunSpeed * dt);
                }
            } else if (papers.length > 0) {
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
                        moveEntitySliding(helper, (hDx / hDist) * helper.speed * dt, (hDy / hDist) * helper.speed * dt);
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
                            moveEntitySliding(helper, (hDx / hDist) * helper.speed * dt, (hDy / hDist) * helper.speed * dt);
                        }
                    } else {
                        helper.currentPath = findPathBFS(hCol, hRow, pCol, pRow);
                    }
                }

                for (let i = papers.length - 1; i >= 0; i--) {
                    let p = papers[i];
                    if (Math.hypot(helper.x - p.x, helper.y - p.y) < helper.radius + 20) {
                        papers.splice(i, 1);
                        playSynthSound('collect');
                        helper.revealTimer = 300;
                        helper.targetPaper = null;

                        handlePaperCollected(false);
                        break;
                    }
                }
            }
        }

        // 4. Người chơi nhặt bài phốt
        for (let i = papers.length - 1; i >= 0; i--) {
            let p = papers[i];
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 20) {
                papers.splice(i, 1);
                playSynthSound('collect');
                player.revealTimer = 300;
                handlePaperCollected(true);
                break;
            }
        }

        // 5. Cập nhật từng Quái vật (ĐÃ BỎ SKILL QUÁI TRONG MÊ CUNG & TUẦN TRA LIÊN TỤC KHẮP MAP)
        for (let mIdx = 0; mIdx < mazeMonsters.length; mIdx++) {
            let m = mazeMonsters[mIdx];
            if (m.stunTimer > 0) m.stunTimer--;

            keepEntityInOpenMaze(m);

            // Khi Quái chạm vào Phân thân / Đồng minh: Tiêu diệt bản sao đó ngay
            for (let hIdx = mazeHelpers.length - 1; hIdx >= 0; hIdx--) {
                let h = mazeHelpers[hIdx];
                if (m.stunTimer <= 0 && Math.hypot(m.x - h.x, m.y - h.y) < m.radius + h.radius) {
                    if (m.lockedTarget === h) m.lockedTarget = null;
                    hitEffects.push({ x: h.x, y: h.y, radius: 8, maxRadius: 38, lineWidth: 3, color: '#38bdf8', alpha: 1.0 });
                    mazeHelpers.splice(hIdx, 1);
                    playSynthSound('player_hit');
                }
            }

            // Khi Quái chạm vào Người chơi thật
            let distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
            if (m.stunTimer <= 0 && distToPlayer < player.radius + m.radius) {
                if (player.shields > 0) {
                    player.shields--;
                    m.stunTimer = 300; // Choáng 5 giây
                    m.isChasing = false;
                    m.lockedTarget = null;
                    m.currentPath = [];
                    screenShake = 25;
                    playSynthSound('shield_break');
                    updateMazeHUD();

                    let pushDx = m.x - player.x;
                    let pushDy = m.y - player.y;
                    let pushDist = Math.hypot(pushDx, pushDy) || 1;
                    moveEntitySliding(m, (pushDx / pushDist) * SHIELD_KNOCKBACK_FORCE, (pushDy / pushDist) * SHIELD_KNOCKBACK_FORCE);
                    keepEntityInOpenMaze(m);

                    notification.text = `🛡️ KHIÊN HỘ MỆNH CỨU MẠNG! ${m.name.toUpperCase()} BỊ CHOÁNG 5 GIÂY! (Còn ${player.shields}/3)`;
                    notification.timer = 180;
                } else {
                    isGameOver = true;
                    playSynthSound('player_hit');
                    monsterAudio.pause();
                    showModal('BẠN ĐÃ BỊ BẮT!', `${m.name} đã tóm được ${player.name} tại ${cfg.name}.`);
                    return;
                }
            }

            updateSingleMonsterVision(m);

            // AI Lựa chọn mục tiêu & Tuần tra liên tục xuyên bản đồ
            if (m.stunTimer <= 0) {
                let mCol = Math.floor(m.x / TILE_SIZE);
                let mRow = Math.floor(m.y / TILE_SIZE);

                let allPrey = [player, ...mazeHelpers];
                let revealedPrey = allPrey.filter(p => p.revealTimer > 0);

                if (revealedPrey.length > 0) {
                    revealedPrey.sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y));
                    m.lockedTarget = revealedPrey[0];
                    m.isChasing = true;
                    m.lostSightTimer = 0;
                } else if (m.isChasing && m.lockedTarget) {
                    if (m.lockedTarget !== player && !mazeHelpers.includes(m.lockedTarget)) {
                        m.lockedTarget = null;
                        m.isChasing = false;
                    } else {
                        let distToCurrent = Math.hypot(m.lockedTarget.x - m.x, m.lockedTarget.y - m.y);
                        let hasLOS = hasLineOfSight(m.x, m.y, m.lockedTarget.x, m.lockedTarget.y);

                        if (!hasLOS) m.lostSightTimer++;
                        else m.lostSightTimer = 0;

                        if ((!hasLOS && distToCurrent > m.breakDistance) || m.lostSightTimer > 95) {
                            m.isChasing = false;
                            m.lockedTarget = null;
                            m.currentPath = [];
                            m.lostSightTimer = 0;
                        }
                    }
                } else {
                    m.isChasing = false;
                    m.lockedTarget = null;
                }

                if (m.isChasing && m.lockedTarget) {
                    if (now - m.lastPathTime > 260 || m.currentPath.length === 0) {
                        m.lastPathTime = now;
                        let tgt = m.lockedTarget;
                        let tCol = Math.floor(tgt.x / TILE_SIZE);
                        let tRow = Math.floor(tgt.y / TILE_SIZE);
                        let distToTgt = Math.hypot(tgt.x - m.x, tgt.y - m.y);

                        // AI BAO VÂY CHẶN ĐẦU Ở LEVEL 3 & 4
                        if (cfg.flankAI && distToTgt > TILE_SIZE * 3.5) {
                            if (m.role === 'interceptor') {
                                tCol += Math.round(Math.cos(tgt.angle || 0) * 5);
                                tRow += Math.round(Math.sin(tgt.angle || 0) * 5);
                            } else if (m.role === 'flanker') {
                                let perpAngle = (tgt.angle || 0) + Math.PI / 2;
                                tCol += Math.round(Math.cos(perpAngle) * 4);
                                tRow += Math.round(Math.sin(perpAngle) * 4);
                            }
                        }

                        m.currentPath = findPathBFS(mCol, mRow, tCol, tRow);
                    }
                } else {
                    // TUẦN TRA LIÊN TỤC KHẮP MÊ CUNG (KHÔNG BAO GIỜ ĐỨNG YÊN CANH BÀI PHỐT)
                    if (!m.currentPath || m.currentPath.length === 0) {
                        m.lastPathTime = now;
                        assignMonsterPatrolPath(m);
                    }
                }

                let moveSpeed = m.isChasing ? m.speed : (m.speed * 0.85);

                if (m.currentPath && m.currentPath.length > 0) {
                    let nextNode = m.currentPath[0];
                    let targetX = nextNode[0] * TILE_SIZE + TILE_SIZE / 2;
                    let targetY = nextNode[1] * TILE_SIZE + TILE_SIZE / 2;
                    let dx = targetX - m.x;
                    let dy = targetY - m.y;
                    let dist = Math.hypot(dx, dy);

                    if (dist > 1) {
                        m.moveAngle = Math.atan2(dy, dx);
                        m.angle = m.moveAngle;
                    }

                    if (dist <= moveSpeed * dt) {
                        m.x = targetX;
                        m.y = targetY;
                        m.currentPath.shift();
                    } else {
                        moveEntitySliding(m, (dx / dist) * moveSpeed * dt, (dy / dist) * moveSpeed * dt);
                    }
                }
            }
        }
        return;
    }

    // --- C. LOGIC GIAI ĐOẠN 2: ĐẤU TRƯỜNG BOSS SIÊU CƯỜNG HÓA ---
    if (monster.attackCooldown > 0) monster.attackCooldown--;
    if (monster.shieldTimer > 0) monster.shieldTimer--;
    if (monster.shieldTimer <= 0) monster.isShielded = false;

    for (let i = clashShockwaves.length - 1; i >= 0; i--) {
        let sw = clashShockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.22;
        sw.alpha -= 0.04;
        if (sw.alpha <= 0) clashShockwaves.splice(i, 1);
    }

    if (monster.hasKiAura) {
        for (let i = 0; i < 3; i++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 10 + Math.random() * 32;
            monster.kiParticles.push({
                x: monster.x + Math.cos(angle) * dist,
                y: monster.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 1.8,
                vy: -3.5 - Math.random() * 3,
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
                player.hp = Math.min(player.maxHp, player.hp + 2500);
                playSynthSound('heal');
            }
        }
    } else {
        medkits = [];
    }

    // Nhặt 10 Bài phốt Đấu trường ở Phase 2 (Tăng lên tới 250.000 HP và 5.000 Dame để đối đầu Boss 500.000 HP)
    if (monster.phase === 2) {
        for (let i = arenaPapers.length - 1; i >= 0; i--) {
            let ap = arenaPapers[i];
            if (Math.hypot(player.x - ap.x, player.y - ap.y) < player.radius + ap.radius + 6) {
                arenaPapers.splice(i, 1);
                player.arenaPapersCollected++;
                playSynthSound('collect');

                player.maxHp = 15000 + (player.arenaPapersCollected / 10) * 235000;
                player.damage = 250 + (player.arenaPapersCollected / 10) * 4750;
                player.hp = Math.min(player.maxHp, player.hp + 25000);

                if (player.arenaPapersCollected >= 10) {
                    notification.text = `⚡ ĐẠT 100% CẢNH GIỚI TỐI THƯỢNG (250.000 HP, 5.000 DAME)! HÃY TIÊU DIỆT MƯỜI KHÓ!`;
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
                    ally.attackCooldown = 70;
                    let angle = Math.atan2(dy, dx);
                    allyProjectiles.push({
                        x: ally.x,
                        y: ally.y,
                        vx: Math.cos(angle) * 8.0,
                        vy: Math.sin(angle) * 8.0,
                        damage: 1200,
                        radius: 10,
                        life: 90
                    });
                }
            } else {
                if (dist > tgt.radius + ally.radius) {
                    moveEntitySliding(ally, (dx / dist) * ally.speed * dt, (dy / dist) * ally.speed * dt);
                } else if (ally.attackCooldown <= 0) {
                    ally.attackCooldown = 45;
                    let actualDmg = (tgt === monster && monster.isShielded) ? 30 : 80;
                    tgt.hp -= actualDmg;
                    addHitVisual(tgt.x, tgt.y, false, `-${actualDmg}`);
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
            let actualDmg = monster.isShielded ? 400 : 1200;
            monster.hp = Math.max(0, monster.hp - actualDmg);
            addHitVisual(monster.x, monster.y, false, `-${actualDmg}`, '#38bdf8');
            allyProjectiles.splice(i, 1);
            continue;
        }

        for (let fan of fans) {
            if (Math.hypot(proj.x - fan.x, proj.y - fan.y) < fan.radius + proj.radius) {
                fan.hp -= 1200;
                addHitVisual(fan.x, fan.y, false, '-1200', '#38bdf8');
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
                    fan.attackCooldown = 45;
                    if (tgt === player) {
                        if (player.invulnerableTimer <= 0) {
                            player.hp -= fan.damage;
                            player.invulnerableTimer = 30;
                            addHitVisual(player.x, player.y, false, `-${fan.damage}`, '#ef4444');
                            playSynthSound('player_hit');
                        }
                    } else {
                        tgt.hp -= fan.damage;
                        addHitVisual(tgt.x, tgt.y, false, `-${fan.damage}`, '#ef4444');
                    }
                }
            }
        }
    }

    if (player.attackCooldown <= 0) {
        let distPtoM = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (distPtoM <= player.radius + monster.radius + 8) {
            player.attackCooldown = 24;
            let actualDmg = monster.isShielded ? Math.floor(player.damage * 0.35) : player.damage;
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
                    player.attackCooldown = 24;
                    fan.hp -= player.damage;
                    addHitVisual(fan.x, fan.y, true, `-${player.damage} 💥`, '#facc15');
                    playSynthSound('player_hit');
                    break;
                }
            }
        }
    }

    // CHUYỂN GIAO SANG PHASE 2 SIÊU CƯỜNG HÓA (500.000 HP, 4.500 DAME, TỐC ĐỘ 7.2)
    if (monster.phase === 1 && monster.hp <= 0) {
        monster.phase = 2;
        monster.name = 'Mười Khó (Thần Hủy Diệt Ki Aura)';
        monster.hp = 500000;
        monster.maxHp = 500000;
        monster.damage = 4500;
        monster.speed = 7.2;
        monster.hasKiAura = true;

        for (let fan of fans) {
            let isTank = Math.random() < 0.5;
            allies.push({
                x: fan.x,
                y: fan.y,
                radius: 14,
                speed: isTank ? 4.4 : 3.8,
                hp: isTank ? 2500 : 200,
                maxHp: isTank ? 2500 : 200,
                damage: isTank ? 80 : 1200,
                type: isTank ? 'melee' : 'ranged',
                attackCooldown: 0
            });
        }
        fans = [];
        fanRespawnQueue = [];

        spawnArenaPapers();

        screenShake = 60;
        playSynthSound('phase_change');

        notification.text = '🔥 PHASE 2: MƯỜI KHÓ THỨC TỈNH 500.000 HP & 4.500 DAME! HÃY NHẶT 10 BÀI PHỐT ĐỂ ĐỐI ĐẦU!';
        notification.timer = 260;

        let statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.innerText = '🔥 PHASE 2: MƯỜI KHÓ 500.000 HP! GOM 10 BÀI PHỐT ĐẤU TRƯỜNG NGAY!';
            statusEl.style.color = '#ef4444';
        }
    }

    let primaryTarget = player;
    let minBossTgtDist = Math.hypot(player.x - monster.x, player.y - monster.y);
    let nearbyEnemies = minBossTgtDist < 190 ? 1 : 0;

    for (let j = 0; j < allies.length; j++) {
        let a = allies[j];
        let d = Math.hypot(a.x - monster.x, a.y - monster.y);
        if (d < 190) nearbyEnemies++;
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

        if (bDist <= monster.radius + primaryTarget.radius + 8 && monster.attackCooldown <= 0) {
            if (primaryTarget === player) {
                if (player.invulnerableTimer <= 0) {
                    player.hp -= monster.damage;
                    player.invulnerableTimer = 45;
                    monster.attackCooldown = 45;
                    monster.postAttackPause = 14;
                    screenShake = 24;
                    playSynthSound('player_hit');

                    let knockDx = player.x - monster.x;
                    let knockDy = player.y - monster.y;
                    let kDist = Math.hypot(knockDx, knockDy) || 1;
                    moveEntitySliding(player, (knockDx / kDist) * 55, (knockDy / kDist) * 55);

                    if (player.arenaPapersCollected >= 5) {
                        triggerDBZClash((player.x + monster.x) / 2, (player.y + monster.y) / 2);
                    }
                }
            } else {
                primaryTarget.hp -= monster.damage;
                monster.attackCooldown = 25;
                playSynthSound('player_hit');
                let knockDx = primaryTarget.x - monster.x;
                let knockDy = primaryTarget.y - monster.y;
                let kDist = Math.hypot(knockDx, knockDy) || 1;
                moveEntitySliding(primaryTarget, (knockDx / kDist) * 40, (knockDy / kDist) * 40);
            }
        }
    }

    // Skill 3 Boss: Tẩy Trắng Hồi Phục Cực Mạnh (Phase 1: +5.000 HP, Phase 2: +40.000 HP)
    monster.skill3Cooldown--;
    if (monster.hp < monster.maxHp * 0.75 && monster.skill3Cooldown <= 0) {
        monster.skill3Cooldown = 520;
        monster.isShielded = true;
        monster.shieldTimer = 240;
        let healAmt = monster.phase === 2 ? 40000 : 50000 * 0.1;
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmt);
        playSynthSound('heal');
    }

    // Skill 2 Boss: Đại Sóng Gió Thị Phi (Sát thương diện rộng)
    monster.skill2Cooldown--;
    if ((nearbyEnemies >= 3 || Math.hypot(player.x - monster.x, player.y - monster.y) < 150) && monster.skill2Cooldown <= 0) {
        monster.skill2Cooldown = monster.phase === 2 ? 260 : 320;
        monster.shockwaveActive = true;
        monster.shockwaveRadius = 15;
        playSynthSound('boss_skill');
    }

    if (monster.shockwaveActive) {
        monster.shockwaveRadius += (monster.phase === 2 ? 18 : 13);
        let maxWave = monster.phase === 2 ? 450 : 320;

        let checkTargets = [player, ...allies];
        for (let target of checkTargets) {
            let d = Math.hypot(target.x - monster.x, target.y - monster.y);
            if (Math.abs(d - monster.shockwaveRadius) < 22) {
                let waveDmg = monster.phase === 2 ? 6500 : 750;
                if (target === player) {
                    if (player.invulnerableTimer <= 0) {
                        player.hp -= waveDmg;
                        player.invulnerableTimer = 40;
                    }
                } else {
                    target.hp -= waveDmg;
                }
            }
        }
        if (monster.shockwaveRadius > maxWave) monster.shockwaveActive = false;
    }

    // Skill 1 Boss: Vỗ Mặt Hủy Diệt
    monster.skill1Cooldown--;
    if (primaryTarget && Math.hypot(primaryTarget.x - monster.x, primaryTarget.y - monster.y) < 200 && monster.skill1Cooldown <= 0) {
        monster.skill1Cooldown = monster.phase === 2 ? 150 : 200;
        monster.singleStrikeTarget = { x: primaryTarget.x, y: primaryTarget.y };
        monster.singleStrikeTimer = 25;
        let strikeDmg = monster.phase === 2 ? 8500 : 900;
        if (primaryTarget === player) {
            if (player.invulnerableTimer <= 0) {
                player.hp -= strikeDmg;
                player.invulnerableTimer = 45;
            }
        } else {
            primaryTarget.hp -= strikeDmg;
        }
        screenShake = 26;
        playSynthSound('boss_skill');
    }
    if (monster.singleStrikeTimer > 0) monster.singleStrikeTimer--;

    // BỘ KỸ NĂNG DRAGON BALL SIÊU CẤP Ở PHASE 2
    if (monster.phase === 2) {
        // 1. Dịch chuyển tức thời (Mỗi 3.3s) + Chém nổ ngay khi xuất hiện
        monster.teleportCooldown--;
        if (monster.teleportCooldown <= 0 && primaryTarget) {
            monster.teleportCooldown = 200;
            playSynthSound('teleport');

            // Ưu tiên dịch chuyển ra sau lưng Người chơi (60% cơ hội) hoặc mục tiêu gần nhất
            let teleTarget = Math.random() < 0.6 ? player : primaryTarget;
            let behindAngle = teleTarget.angle || 0;
            monster.x = teleTarget.x - Math.cos(behindAngle) * 60;
            monster.y = teleTarget.y - Math.sin(behindAngle) * 60;
            monster.angle = Math.atan2(teleTarget.y - monster.y, teleTarget.x - monster.x);
            keepEntityInOpenMaze(monster);

            hitEffects.push({ x: monster.x, y: monster.y, radius: 10, maxRadius: 95, lineWidth: 6, color: '#ef4444', alpha: 1.0 });
            if (Math.hypot(player.x - monster.x, player.y - monster.y) < 95 && player.invulnerableTimer <= 0) {
                player.hp -= 3500;
                player.invulnerableTimer = 35;
            }
        }

        // 2. Mưa 12 Chưởng Ki Tốc Độ Cao
        monster.kiBlastCooldown--;
        if (monster.kiBlastCooldown <= 0 && primaryTarget) {
            monster.kiBlastCooldown = 180;
            playSynthSound('boss_skill');

            let baseA = Math.atan2(player.y - monster.y, player.x - monster.x);
            for (let i = 0; i < 12; i++) {
                let a = baseA + ((i - 5.5) * 0.22);
                bossKiBlasts.push({
                    x: monster.x,
                    y: monster.y,
                    vx: Math.cos(a) * 10.5,
                    vy: Math.sin(a) * 10.5,
                    damage: 3200,
                    radius: 12,
                    life: 130
                });
            }
        }

        // 3. Đại Pháo Kamehameha (Tụ lực cực nhanh 0.55s, tia rộng 110px)
        monster.kamehamehaCooldown--;
        if (monster.kamehamehaCooldown <= 0 && monster.kameChargingTimer <= 0 && monster.kameBeamTimer <= 0) {
            monster.kamehamehaCooldown = 380;
            monster.kameChargingTimer = 35; // Tụ lực nhanh
            monster.kameAngle = Math.atan2(player.y - monster.y, player.x - monster.x);
        }

        if (monster.kameChargingTimer > 0) {
            monster.kameChargingTimer--;
            // Khóa hướng theo người chơi trong nửa đầu thời gian tụ lực
            if (monster.kameChargingTimer > 15) {
                monster.kameAngle = Math.atan2(player.y - monster.y, player.x - monster.x);
            }
            if (monster.kameChargingTimer <= 0) {
                monster.kameBeamTimer = 55;
                playSynthSound('kamehameha');
                screenShake = 38;
            }
        }

        if (monster.kameBeamTimer > 0) {
            monster.kameBeamTimer--;
            screenShake = Math.max(screenShake, 20);

            let beamLength = 1400;
            let beamWidth = 110;
            let checkTargets = [player, ...allies];
            for (let target of checkTargets) {
                let tDx = target.x - monster.x;
                let tDy = target.y - monster.y;
                let tDist = Math.hypot(tDx, tDy);
                let tAngle = Math.atan2(tDy, tDx);
                let angleDiff = Math.abs(Math.atan2(Math.sin(tAngle - monster.kameAngle), Math.cos(tAngle - monster.kameAngle)));

                if (tDist <= beamLength && angleDiff < (beamWidth / Math.max(40, tDist))) {
                    let kameDmg = 220;
                    if (target === player) {
                        if (player.invulnerableTimer <= 0) player.hp -= kameDmg;
                    } else {
                        target.hp -= kameDmg * 2;
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
                player.invulnerableTimer = 35;
                playSynthSound('player_hit');
                screenShake = 18;
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

    let badgeLevel = document.getElementById('badge-level');
    let badgeShield = document.getElementById('badge-shield');
    if (badgeLevel && badgeShield) {
        if (monster.phase === 2) {
            badgeLevel.innerHTML = `Quân ta: <b style="color:#38bdf8">${allies.length + 1}</b>`;
            badgeShield.innerHTML = `Phốt: <b style="color:#f59e0b">${player.arenaPapersCollected}/10</b>`;
        } else {
            badgeLevel.innerHTML = `Phe ta: <b style="color:#38bdf8">${allies.length + 1}</b>`;
            badgeShield.innerHTML = `Phe địch: <b style="color:#ef4444">${fans.length + 1}</b>`;
        }
    }

    if (player.hp <= 0) {
        isGameOver = true;
        playSynthSound('player_hit');
        try { bossBgmAudio.pause(); monsterAudio.pause(); } catch(e){}
        showModal('BẠN ĐÃ THẤT BẠI!', 'Bạn đã gục ngã trước sức mạnh hủy diệt của Boss Đấu Trường.');
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

// Xử lý chung khi nhặt bài phốt ở các Level Mê Cung
function handlePaperCollected(byPlayer) {
    let cfg = LEVEL_CONFIGS[currentLevel];
    let collected = cfg.papers - papers.length;
    updateMazeHUD();

    if (cfg.monsterSpeedScale > 0) {
        for (let m of mazeMonsters) {
            m.speed = m.baseSpeed + collected * cfg.monsterSpeedScale;
        }
    }

    if (cfg.playerSpeedScale > 0) {
        let stepSize = currentLevel === 3 ? 8 : 10;
        let newTier = Math.floor(collected / stepSize);
        if (newTier > player.speedTier) {
            player.speedTier = newTier;
            player.speed = player.baseSpeed + player.speedTier * cfg.playerSpeedScale;
            notification.text = `⚡ BỨT TỐC! Tốc độ của bạn và bầy quái cùng tăng lên! (${collected}/${cfg.papers})`;
            notification.timer = 160;
        }
    }

    if (papers.length === 0 && !exitPortal.active) {
        spawnExitPortal();
    } else if (byPlayer && notification.timer <= 0) {
        notification.text = `⚠️ BẠN BỊ LỘ VỊ TRÍ 5 GIÂY! (${collected}/${cfg.papers})`;
        notification.timer = 120;
    }
}

// ======================= 10. VẼ ĐỒ HỌA & MINI-MAP RADAR DARK DECEPTION =======================
function drawMinimap() {
    if (gameState !== 'MAZE') return;

    let isLandscapeMobile = window.innerHeight < 520;
    const radarR = isLandscapeMobile ? 56 : 78; 
    const pad = 14;
    const cx = canvas.width - radarR - pad;
    const cy = (isLandscapeMobile ? 55 : 82) + radarR;

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
            ctx.arc(cx + dx * scale, cy + dy * scale, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (exitPortal.active) {
        let dx = exitPortal.x - player.x;
        let dy = exitPortal.y - player.y;
        if (Math.hypot(dx, dy) <= radarWorldRange) {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(cx + dx * scale, cy + dy * scale, 5.0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let it of mazeItems) {
        let dx = it.x - player.x;
        let dy = it.y - player.y;
        if (Math.hypot(dx, dy) <= radarWorldRange) {
            ctx.fillStyle = it.type === 'shield' ? '#38bdf8' : '#c084fc';
            ctx.beginPath();
            ctx.arc(cx + dx * scale, cy + dy * scale, 3.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

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

    for (let m of mazeMonsters) {
        let mDx = m.x - player.x;
        let mDy = m.y - player.y;
        if (Math.hypot(mDx, mDy) <= radarWorldRange) {
            let pulse = 3.8 + Math.sin(Date.now() / 90) * 1.8;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.beginPath();
            ctx.arc(cx + mDx * scale, cy + mDy * scale, pulse + 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx + mDx * scale, cy + mDy * scale, pulse, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.fillStyle = '#00a8ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbc531';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(player.angle) * 8, cy + Math.sin(player.angle) * 8);
    ctx.lineTo(cx + Math.cos(player.angle + 2.5) * 4, cy + Math.sin(player.angle + 2.5) * 4);
    ctx.lineTo(cx + Math.cos(player.angle - 2.5) * 4, cy + Math.sin(player.angle - 2.5) * 4);
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

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`RADAR (LV.${currentLevel})`, cx, cy + radarR + 12);
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

    // --- A. VẼ BẢN ĐỒ (Phong cách neon đỏ/tím Dark Deception) ---
    let startC = Math.max(0, Math.floor((pX - canvas.width / 2) / TILE_SIZE) - 2);
    let endC = Math.min(COLS, Math.ceil((pX + canvas.width / 2) / TILE_SIZE) + 2);
    let startR = Math.max(0, Math.floor((pY - canvas.height / 2) / TILE_SIZE) - 2);
    let endR = Math.min(ROWS, Math.ceil((pY + canvas.height / 2) / TILE_SIZE) + 2);

    for (let r = startR; r < endR; r++) {
        for (let c = startC; c < endC; c++) {
            let x = c * TILE_SIZE;
            let y = r * TILE_SIZE;
            if (maze[r] && maze[r][c] === 1) {
                ctx.fillStyle = '#181826';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = currentLevel >= 3 ? '#991b1b' : '#0284c7';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = gameState === 'ARENA' ? (monster.phase === 2 ? '#160914' : '#0f172a') : '#060811';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = monster.phase === 2 ? '#450a2e' : '#151c2c';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // --- B. VẼ CỔNG THOÁT HIỂM & SỢI DÂY XANH DẪN ĐƯỜNG ---
    if (gameState === 'MAZE' && exitPortal.active) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pX, pY);
        let midX = (pX + exitPortal.x) / 2 + (Math.random() - 0.5) * 6;
        let midY = (pY + exitPortal.y) / 2 + (Math.random() - 0.5) * 6;
        ctx.quadraticCurveTo(midX, midY, exitPortal.x, exitPortal.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(exitPortal.x, exitPortal.y);
        let portalPulse = exitPortal.radius + Math.sin(Date.now() / 120) * 5;

        let pGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, portalPulse + 12);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.4, '#4ade80');
        pGrad.addColorStop(0.8, '#16a34a');
        pGrad.addColorStop(1, 'rgba(22, 163, 74, 0)');

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, portalPulse + 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, exitPortal.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('🌀 CỔNG THOÁT HIỂM', 0, -exitPortal.radius - 12);
        ctx.restore();
    }

    // --- C. VẼ BÀI PHỐT & VẬT PHẨM MÊ CUNG ---
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

    // --- D. VẼ PHÂN THÂN & ĐỒNG MINH TRONG MÊ CUNG ---
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

            ctx.font = 'bold 13px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(helper.name || player.name, 0, -helper.radius - 8);

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
            ctx.lineTo(player.radius - 4, -9);
            ctx.lineTo(player.radius - 4, 9);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // --- E. VẼ BẦY QUÁI VẬT TRONG MÊ CUNG ---
    if (gameState === 'MAZE') {
        for (let m of mazeMonsters) {
            if (m.visionPolygon && m.visionPolygon.length > 0) {
                ctx.save();
                let baseColor = m.isChasing ? '239, 68, 68' : '14, 165, 233';
                let grad = ctx.createRadialGradient(m.x, m.y, 15, m.x, m.y, m.visionRange);
                grad.addColorStop(0, `rgba(${baseColor}, ${m.isChasing ? 0.45 : 0.22})`);
                grad.addColorStop(0.7, `rgba(${baseColor}, ${m.isChasing ? 0.2 : 0.1})`);
                grad.addColorStop(1, `rgba(${baseColor}, 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                for (let pt of m.visionPolygon) ctx.lineTo(pt.x, pt.y);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            if (m.isChasing && m.lockedTarget) {
                let chaseTarget = m.lockedTarget;
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                let midX = (m.x + chaseTarget.x) / 2 + (Math.random() - 0.5) * 6;
                let midY = (m.y + chaseTarget.y) / 2 + (Math.random() - 0.5) * 6;
                ctx.quadraticCurveTo(midX, midY, chaseTarget.x, chaseTarget.y);
                ctx.stroke();
                ctx.restore();
            }

            ctx.save();
            ctx.translate(m.x, m.y);
            if (monsterImage.complete && monsterImage.naturalWidth > 0) {
                ctx.drawImage(monsterImage, -m.radius, -m.radius, m.radius * 2, m.radius * 2);
            } else {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            if (m.stunTimer > 0) {
                let stunAngle = Date.now() / 80;
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💫', Math.cos(stunAngle) * 22, -m.radius - 12 + Math.sin(stunAngle) * 6);
            }
            ctx.restore();

            ctx.font = 'bold 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f87171';
            ctx.fillText(m.name, m.x, m.y + m.radius + 15);
        }
    }

    // --- F. VẼ ĐẤU TRƯỜNG BOSS ---
    if (gameState === 'ARENA') {
        if (monster.phase === 2) {
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
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 7;
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

        if (monster.phase === 1) {
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

        if (monster.kameChargingTimer > 0) {
            ctx.save();
            let orbR = 14 + (35 - monster.kameChargingTimer) * 0.6;
            ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
            ctx.beginPath();
            ctx.arc(mX + Math.cos(monster.kameAngle) * 34, mY + Math.sin(monster.kameAngle) * 34, orbR + 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(mX + Math.cos(monster.kameAngle) * 34, mY + Math.sin(monster.kameAngle) * 34, orbR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (monster.kameBeamTimer > 0) {
            ctx.save();
            let bLen = 1400;
            let bW = 110;
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

        if (monster.hasKiAura) {
            ctx.save();
            let auraR = monster.radius + 22 + Math.sin(Date.now() / 50) * 5;
            let auraGrad = ctx.createRadialGradient(mX, mY, monster.radius, mX, mY, auraR + 18);
            auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
            auraGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.55)');
            auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(mX, mY, auraR + 18, 0, Math.PI * 2);
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
        }
        ctx.restore();

        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = monster.phase === 2 ? '#facc15' : '#f87171';
        ctx.fillText(monster.name, mX, mY + monster.radius + 16);
    }

    // --- G. VẼ NGƯỜI CHƠI & MŨI TÊN CHỈ HƯỚNG CỔNG THOÁT HIỂM ---
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

    if (gameState === 'MAZE' && player.shields > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
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

    if (gameState === 'MAZE' && exitPortal.active) {
        let angleToPortal = Math.atan2(exitPortal.y - pY, exitPortal.x - pX);
        let orbitDist = player.radius + 34 + Math.sin(Date.now() / 120) * 3;
        let arrowX = pX + Math.cos(angleToPortal) * orbitDist;
        let arrowY = pY + Math.sin(angleToPortal) * orbitDist;

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angleToPortal);

        ctx.fillStyle = '#22c55e';
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

    ctx.restore();

    // --- H. ÁNH SÁNG ĐÈN PIN DARK DECEPTION ---
    if (gameState === 'MAZE') {
        let isChased = mazeMonsters.some(m => m.isChasing && m.lockedTarget === player) || player.revealTimer > 0;
        let lightGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 160,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
        );
        lightGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lightGrad.addColorStop(0.55, isChased ? 'rgba(70, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.35)');
        lightGrad.addColorStop(1, isChased ? 'rgba(40, 0, 0, 0.96)' : 'rgba(0, 0, 0, 0.93)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- I. VẼ MINI-MAP RADAR ---
    drawMinimap();

    // --- K. THANH MÁU BOSS HUD ---
    if (gameState === 'ARENA') {
        ctx.save();
        let uiElem = document.getElementById('ui-container');
        let uiBottom = uiElem ? uiElem.getBoundingClientRect().bottom : 60;
        let barW = Math.min(520, canvas.width - 32);
        let barH = 14;
        let barX = (canvas.width - barW) / 2;
        let barY = uiBottom + 24;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.fillRect(barX - 6, barY - 20, barW + 12, barH + 26);
        ctx.strokeStyle = monster.phase === 2 ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 6, barY - 20, barW + 12, barH + 26);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = monster.phase === 2 ? '#facc15' : '#f87171';
        ctx.textAlign = 'left';
        let bossTitle = monster.phase === 2 
            ? '🔥 BOSS: MƯỜI KHÓ (THẦN HỦY DIỆT - 500.000 HP)' 
            : '👑 BOSS: TRƯỜNG GIANG (PHASE 1 - 50.000 HP)';
        ctx.fillText(bossTitle, barX, barY - 6);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${Math.floor(monster.hp)} / ${monster.maxHp} HP`, barX + barW, barY - 6);

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

    // --- L. BANNER THÔNG BÁO ---
    if (notification.timer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        let bannerW = Math.min(520, canvas.width - 32);
        let bannerH = 38;
        let bx = (canvas.width - bannerW) / 2;
        let by = gameState === 'ARENA' ? 145 : (window.innerHeight < 520 ? 58 : 75);
        ctx.fillRect(bx, by, bannerW, bannerH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bannerW, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(notification.text, canvas.width / 2, by + 24);
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
    initLevel(1);
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
        stopAllLevelBGMs();
    } catch(e){}
    initLevel(1);
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
