import { physics } from './Physics.js';
import { AssetGenerator } from './AssetGenerator.js';
import { Player } from './Player.js';
import { Particle } from './Particle.js';
import { AIController } from './AI.js';
import { audio } from './AudioManager.js';
import { DataManager } from './DataManager.js';
import { NetworkManager } from './NetworkManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;
const keys = {};

const arenaWidth = 1800; 
let camera = { x: 0 };
let debugMode = false;

document.addEventListener('click', () => { if(audio) audio.init(); }, {once:true});

DataManager.init();
document.getElementById('prof-rank').innerText = `RANK: ${DataManager.data.rank.toUpperCase()}`;
document.getElementById('prof-record').innerText = `W/L: ${DataManager.data.wins} - ${DataManager.data.losses}`;

const DOM = {
    uiLayer: document.getElementById('ui-layer'),
    gameContainer: document.getElementById('game-container'),
    mainMenu: document.getElementById('main-menu'),
    roster: document.getElementById('roster'),
    stageRoster: document.getElementById('stage-roster'),
    selectPrompt: document.getElementById('select-prompt'),
    btnFight: document.getElementById('btn-fight'),
    skinContainer: document.getElementById('skin-select-container'),
    skinOptions: document.getElementById('skin-options'),
    storeItems: document.getElementById('store-items'),
    storeCoinDisplay: document.getElementById('store-coin-display'),
    profCoins: document.getElementById('prof-coins'),
    storyRoster: document.getElementById('story-roster'),
    storyNodes: document.getElementById('story-nodes'),
    storyProgressContainer: document.getElementById('story-progress-container'),
    dialogueOverlay: document.getElementById('dialogue-overlay'),
    dialoguePortrait: document.getElementById('dialogue-portrait'),
    dialogueName: document.getElementById('dialogue-name'),
    dialogueText: document.getElementById('dialogue-text'),
    p1Health: document.getElementById('player1-health'),
    p2Health: document.getElementById('player2-health'),
    p1Rage: document.getElementById('player1-rage'),
    p2Rage: document.getElementById('player2-rage'),
    p1Combo: document.getElementById('p1-combo'),
    p2Combo: document.getElementById('p2-combo'),
    overlay: document.getElementById('overlay-text'),
    
    p1Win1: document.getElementById('p1-win-1'),
    p1Win2: document.getElementById('p1-win-2'),
    p2Win1: document.getElementById('p2-win-1'),
    p2Win2: document.getElementById('p2-win-2')
};

const STAGES = [
    { id: 'dojo', name: 'The Dojo', color: '#101018', accent: '#c0392b' },
    { id: 'cyberpunk', name: 'Neon City', color: '#0a0a2a', accent: '#00ffcc' },
    { id: 'desert', name: 'Wasteland', color: '#e67e22', accent: '#d35400' },
    { id: 'street', name: 'Midnight Alley', color: '#111', accent: '#2ecc71' }
];

let activeStageLayer1, activeStageLayer2, activeStageLayer3;
let selectedStageId = 'dojo';

function generateStageLayers(stage) {
    const l1 = document.createElement('canvas'); l1.width = arenaWidth; l1.height = canvas.height;
    const l2 = document.createElement('canvas'); l2.width = arenaWidth; l2.height = canvas.height;
    const l3 = document.createElement('canvas'); l3.width = arenaWidth; l3.height = canvas.height;
    
    const ctx1 = l1.getContext('2d');
    const ctx2 = l2.getContext('2d');
    const ctx3 = l3.getContext('2d');
    
    ctx3.fillStyle = stage.color; ctx3.fillRect(0, 0, arenaWidth, canvas.height);
    
    if (stage.id === 'dojo') {
        ctx3.fillStyle = '#1a1a24';
        for (let i=80; i<arenaWidth; i+= 300) {
            ctx3.fillRect(i, 80, 80, canvas.height - 80);
            ctx3.fillStyle = '#222230';
            ctx3.fillRect(i + 10, 80, 20, canvas.height - 80);
            ctx3.fillStyle = '#1a1a24';
        }
        ctx2.fillStyle = stage.accent; ctx2.fillRect(450, 0, 80, 250);
        ctx2.fillStyle = '#8e44ad'; ctx2.fillRect(1214, 0, 80, 250);
        ctx2.fillStyle = '#ebd534'; ctx2.fillRect(450, 240, 80, 10); ctx2.fillRect(1214, 240, 80, 10);
    } else if (stage.id === 'cyberpunk') {
        ctx3.fillStyle = '#111122';
        for(let i=0; i<arenaWidth; i+=120) { ctx3.fillRect(i+20, 50 + Math.random()*200, 80, 500); }
        ctx2.fillStyle = stage.accent; 
        for(let i=0; i<arenaWidth; i+=300) { ctx2.fillRect(i+50, 250, 5, 250); ctx2.fillRect(i+40, 250, 25, 5); }
    } else if (stage.id === 'desert') {
        ctx3.fillStyle = '#d35400'; ctx3.beginPath(); ctx3.arc(arenaWidth/2, 250, 150, 0, Math.PI*2); ctx3.fill();
        ctx2.fillStyle = '#c0392b'; ctx2.beginPath(); ctx2.moveTo(0, 450); ctx2.lineTo(400, 280); ctx2.lineTo(1000, 450); ctx2.lineTo(1500, 250); ctx2.lineTo(arenaWidth, 450); ctx2.fill();
    } else if (stage.id === 'street') {
        ctx3.fillStyle = '#2c3e50';
        for(let i=0; i<arenaWidth; i+=250) { ctx3.fillRect(i, 150, 200, 400); }
        ctx2.fillStyle = stage.accent; 
        for(let i=150; i<arenaWidth; i+=400) { 
            ctx2.fillRect(i, 150, 15, 350); 
            ctx2.fillStyle='rgba(46, 204, 113,0.15)'; ctx2.beginPath(); ctx2.moveTo(i+8, 150); ctx2.lineTo(i-120, 500); ctx2.lineTo(i+130, 500); ctx2.fill(); 
            ctx2.fillStyle=stage.accent; 
        }
    }
    
    const gY = physics.groundY;
    ctx1.fillStyle = '#2d2d3d'; ctx1.fillRect(0, gY, arenaWidth, canvas.height - gY);
    ctx1.fillStyle = '#4a4a5c'; ctx1.fillRect(0, gY, arenaWidth, 8);
    ctx1.fillStyle = '#222230';
    for (let i=0; i<arenaWidth; i+= 120) {
        ctx1.fillRect(i, gY + 20, 60, 10);
        ctx1.fillRect(i + 60, gY + 45, 60, 10);
    }
    
    activeStageLayer1 = l1; activeStageLayer2 = l2; activeStageLayer3 = l3;
}

window.audio = audio; 

window.nav = (screenId) => {
    if(audio) audio.punch();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'stage-select') buildStages();
    if (screenId === 'char-select') buildRoster();
    if (screenId === 'store') window.renderStore('characters');
    if (screenId === 'store-screen') window.renderStore('characters');
    if (screenId === 'story-mode') buildStoryUI();
    if (screenId === 'leaderboard-screen') window.renderLeaderboard();
    if (screenId === 'tournament-screen') buildTournamentRoster();
    if (screenId === 'main-menu') {
        DOM.gameContainer.style.opacity = '0';
        DOM.gameContainer.style.display = 'none';
        if (audio) audio.stopBGM();
    }
};

window.renderLeaderboard = () => {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    const board = DataManager.getLeaderboard();
    list.innerHTML = board.map((entry, index) => `
        <div class="lb-row ${entry.isLocal ? 'local-player' : ''}">
            <span class="lb-rank">#${index + 1}</span>
            <span class="lb-name">${entry.name}</span>
            <span class="lb-score">${entry.score} pts</span>
        </div>
    `).join('');
};

window.showAchievement = (id, text) => {
    if (DataManager.awardAchievement(id)) {
        if(audio) audio.special(); // Achievement sound
        document.getElementById('achievement-text').innerText = text;
        const toast = document.getElementById('achievement-toast');
        toast.style.display = 'block';
        setTimeout(() => toast.classList.add('toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.style.display = 'none', 500);
        }, 4000);
    }
};

window.startTrainingMode = () => {
    gameMode = 'training';
    window.nav('char-select');
};

let trainingAIToggled = false;
window.toggleTrainingAI = () => {
    trainingAIToggled = !trainingAIToggled;
    document.getElementById('btn-toggle-ai').innerText = `TOGGLE DUMMY AI: ${trainingAIToggled ? 'ON' : 'OFF'}`;
};

let gameMode = 'pve';
let remoteIntent = { left: false, right: false, down: false, jump: false, block: false };

window.setMode = (mode) => {
    gameMode = mode;
    window.nav('stage-select');
};

/**
 * Native P2P Subsystems dynamically configuring host states bypassing WebSockets securely natively
 */
window.networkHost = () => {
    document.getElementById('host-code-display').innerText = "GENERATING...";
    document.getElementById('btn-host-game').disabled = true;
    NetworkManager.initHost((code) => {
        document.getElementById('host-code-display').innerText = code;
    }, () => {
        document.getElementById('online-status').innerText = "OPPONENT CONNECTED! INITIALIZING...";
        setTimeout(() => {
            gameMode = 'online-host';
            window.nav('stage-select'); // Host retains absolute dominion selecting Arenas natively
        }, 1500);
    });
};

window.networkJoin = () => {
    const code = document.getElementById('join-code-input').value;
    if (!code || code.length < 4) return;
    document.getElementById('btn-join-game').disabled = true;
    document.getElementById('online-status').innerText = "CONNECTING DIRECTLY...";
    
    NetworkManager.initClient(code, () => {
        document.getElementById('online-status').innerText = "CONNECTED! WAITING FOR MATCH PARAMETERS...";
        gameMode = 'online-client'; // Wait cleanly matching Host structures transmitted globally
    }, (err) => {
        document.getElementById('online-status').innerText = "CONNECTION FAILED.";
        document.getElementById('btn-join-game').disabled = false;
    });
};

// Global P2P Deserializer routing remote abstractions into Engine execution spaces natively!
NetworkManager.onDataCallback = (data) => {
    if (data.type === 'stage_select') {
        selectedStageId = data.stage;
        buildRoster();
        window.nav('char-select');
    } else if (data.type === 'char_select') {
        if (gameMode === 'online-host') window.selectCharacter(data.char, true);
        else if (gameMode === 'online-client') window.selectCharacter(data.char, true);
    } else if (data.type === 'attack_trigger' && roundActive) {
        if (gameMode === 'online-host') player2.attack(data.attack);
        else if (gameMode === 'online-client') player1.attack(data.attack);
    } else if (data.type === 'start_game') {
        startGame();
    } else if (data.type === 'gamestate' && roundActive) {
        remoteIntent = data.intent;

        // Deterministic Positional Overriding preventing floating point drifts mapping P2P buffers
        if (gameMode === 'online-client' && data.corrections) {
            player1.position.x = data.corrections.p1x;
            player1.position.y = data.corrections.p1y;
            player2.position.x = data.corrections.p2x;
            player2.position.y = data.corrections.p2y;
            player1.health = data.corrections.p1h;
            player2.health = data.corrections.p2h;
        }
    }
};

function buildStages() {
    DOM.stageRoster.innerHTML = '';
    STAGES.forEach((stg, i) => {
        const card = document.createElement('div');
        card.className = 'stage-card';
        card.style.color = stg.accent;
        card.style.animationDelay = `${i * 0.08}s`;
        card.innerHTML = `<span style="font-size:28px; margin-bottom:6px;">${['🏯','🌃','🏜️','🌙'][i]}</span>${stg.name.toUpperCase()}`;
        card.onclick = () => {
            if (gameMode === 'online-client') return;
            selectedStageId = stg.id;
            if (gameMode === 'online-host') NetworkManager.send({ type: 'stage_select', stage: stg.id });
            buildRoster();
            window.nav('char-select');
        };
        DOM.stageRoster.appendChild(card);
    });
}

const CHARACTERS = [
    { id: 'ninja', name: 'Crimson Ninja', color: '#ff4757', archetype: 'fast' },
    { id: 'brawler', name: 'Azure Brawler', color: '#1e90ff', archetype: 'balanced' },
    { id: 'monk', name: 'Jade Monk', color: '#2ecc71', archetype: 'balanced' },
    { id: 'cyborg', name: 'Gold Cyborg', color: '#f1c40f', archetype: 'heavy' },
    { id: 'assassin', name: 'Void Assassin', color: '#9b59b6', archetype: 'fast' }
];

let globalSprites = {};
let spritesGenerated = false;
let p1SelectionId = null; let p2SelectionId = null;
let p1Skin = 'default'; let p2Skin = 'default';

// Store config
const STORE_ITEMS = {
    characters: [
        { id: 'cyborg', name: 'Gold Cyborg', cost: 200 },
        { id: 'assassin', name: 'Void Assassin', cost: 500 }
    ],
    skins: [
        { id: 'neon', name: 'Neon Variant', cost: 100 },
        { id: 'shadow', name: 'Shadow Variant', cost: 150 },
        { id: 'gold', name: 'Gold Variant', cost: 300 }
    ]
};

window.renderStore = (tab) => {
    document.querySelectorAll('.store-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab === 'characters' ? 'chars' : 'skins'}`).classList.add('active');
    
    DOM.storeCoinDisplay.innerText = `🪙 ${DataManager.data.coins}`;
    DOM.storeItems.innerHTML = '';
    
    if (tab === 'characters') {
        STORE_ITEMS.characters.forEach(item => {
            const isUnlocked = DataManager.isUnlocked(item.id);
            DOM.storeItems.innerHTML += `
                <div class="store-item" style="opacity: ${isUnlocked ? 0.5 : 1}">
                    <div style="color:white; font-family:'Orbitron'; font-size:20px;">${item.name}</div>
                    <div class="store-price">${isUnlocked ? 'OWNED' : '🪙 ' + item.cost}</div>
                    ${!isUnlocked ? `<button onclick="buyCharacter('${item.id}', ${item.cost})" style="margin-top:10px; width:100%;">PURCHASE</button>` : ''}
                </div>
            `;
        });
    } else {
        CHARACTERS.forEach(chr => {
            if (!DataManager.isUnlocked(chr.id)) return;
            STORE_ITEMS.skins.forEach(skin => {
                const hasSkin = DataManager.hasSkin(chr.id, skin.id);
                DOM.storeItems.innerHTML += `
                    <div class="store-item" style="opacity: ${hasSkin ? 0.5 : 1}">
                        <div style="color:${chr.color}; font-family:'Orbitron'; font-size:16px;">${chr.name}</div>
                        <div style="color:white; font-family:'Orbitron'; font-size:20px;">${skin.name}</div>
                        <div class="store-price">${hasSkin ? 'OWNED' : '🪙 ' + skin.cost}</div>
                        ${!hasSkin ? `<button onclick="buySkin('${chr.id}', '${skin.id}', ${skin.cost})" style="margin-top:10px; width:100%;">PURCHASE</button>` : ''}
                    </div>
                `;
            });
        });
    }
};

window.buyCharacter = (id, cost) => {
    if (DataManager.buyCharacter(id, cost)) {
        if (audio) audio.hit();
        updateProfileStats();
        window.renderStore('characters');
    } else {
        alert("Not enough coins!");
    }
};

window.buySkin = (charId, skinId, cost) => {
    if (DataManager.buySkin(charId, skinId, cost)) {
        if (audio) audio.hit();
        updateProfileStats();
        window.renderStore('skins');
    } else {
        alert("Not enough coins!");
    }
};

window.updateProfileStats = () => {
    document.getElementById('prof-rank').innerText = `RANK: ${DataManager.data.rank.toUpperCase()}`;
    document.getElementById('prof-record').innerText = `W/L: ${DataManager.data.wins} - ${DataManager.data.losses}`;
    DOM.profCoins.innerText = `🪙 ${DataManager.data.coins || 0}`;
};

function generatePortrait(color, archetype) {
    const c = document.createElement('canvas'); c.width = 80; c.height = 100;
    const px = c.getContext('2d');
    const w = archetype === 'heavy' ? 40 : (archetype === 'fast' ? 24 : 30);
    const h = archetype === 'heavy' ? 50 : 45;
    const ox = (80 - w) / 2;
    // Body
    px.fillStyle = color; px.fillRect(ox, 30, w, h);
    // Head
    px.fillRect(ox + w/2 - 8, 10, 16, 18);
    // Eyes
    px.fillStyle = '#fff'; px.fillRect(ox + w/2 - 5, 16, 4, 4); px.fillRect(ox + w/2 + 1, 16, 4, 4);
    px.fillStyle = '#111'; px.fillRect(ox + w/2 - 4, 17, 2, 2); px.fillRect(ox + w/2 + 2, 17, 2, 2);
    // Arms
    px.fillStyle = color;
    px.fillRect(ox - 8, 35, 8, 30);
    px.fillRect(ox + w, 35, 8, 30);
    // Legs
    px.fillRect(ox + 4, 80, 10, 18);
    px.fillRect(ox + w - 14, 80, 10, 18);
    // Belt
    px.fillStyle = '#111'; px.fillRect(ox, 56, w, 4);
    return c;
}

function buildRoster() {
    if (!spritesGenerated) {
        CHARACTERS.forEach(chr => { globalSprites[chr.id] = AssetGenerator.generate(chr.color, chr.archetype); });
        spritesGenerated = true;
    }
    
    DOM.selectPrompt.innerText = gameMode === 'online-client' ? "WAITING FOR HOST..." : "PLAYER 1 — SELECT";
    DOM.selectPrompt.style.color = 'var(--primary)';
    DOM.btnFight.style.display = 'none';
    DOM.skinContainer.style.display = 'none';
    p1SelectionId = null; 
    p2SelectionId = null;
    p1Skin = 'default'; p2Skin = 'default';
    DOM.roster.innerHTML = '';
    

    
    CHARACTERS.forEach((chr, i) => {
        const isLocked = !DataManager.isUnlocked(chr.id);
        const card = document.createElement('div');
        card.className = `char-card ${isLocked ? 'locked' : ''}`;
        card.id = `card-${chr.id}`;
        card.style.animationDelay = `${i * 0.06}s`;
        
        const portrait = generatePortrait(chr.color, chr.archetype);
        const xpInfo = DataManager.getXPProgress(chr.id);
        const level = DataManager.getCharLevel(chr.id);
        const xpPct = Math.round(xpInfo.progress * 100);
        
        card.innerHTML = `
            ${isLocked ? '<div class="lock-icon">🔒</div>' : ''}
            <div class="char-name" style="color:${chr.color};">${chr.name.toUpperCase()}</div>
            <div class="char-archetype">${chr.archetype.toUpperCase()}</div>
            ${!isLocked ? `<div class="char-level-label">LVL ${level}</div><div class="xp-bar-container"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>` : ''}
        `;
        portrait.className = 'char-portrait';
        card.appendChild(portrait);
        
        card.onclick = () => {
            if (isLocked) { alert('Fighter Locked! Advance your Rank by winning matches!'); return; }
            window.selectCharacter(chr.id);
        };
        DOM.roster.appendChild(card);
    });
}

window.selectCharacter = (id, isRemote = false) => {
    // Validate bounds ensuring networking conditions secure locked domains cleanly
    if (gameMode === 'online-host' && !isRemote && p1SelectionId) return;
    if (gameMode === 'online-client' && !isRemote && p2SelectionId) return;
    
    if (audio && !isRemote) audio.hit();
    
    if (!isRemote && (gameMode === 'online-host' || gameMode === 'online-client')) {
        NetworkManager.send({ type: 'char_select', char: id });
    }

    if (!p1SelectionId && (gameMode === 'pve' || gameMode === 'pvp' || gameMode === 'training' || gameMode === 'online-host' || (gameMode === 'online-client' && isRemote))) {
        p1SelectionId = id;
        document.getElementById(`card-${id}`).classList.add('selected-p1');

        if (gameMode === 'online-client') DOM.selectPrompt.innerText = "YOUR TURN SELECT!";
        else DOM.selectPrompt.innerText = "PLAYER 2 SELECT";
        DOM.selectPrompt.style.color = '#1e90ff';
        showSkinSelection(id, 1);
    } else if (!p2SelectionId) {
        p2SelectionId = id;
        document.getElementById(`card-${id}`).classList.add('selected-p2');
        DOM.selectPrompt.innerText = "FIGHTERS LOCKED!";
        DOM.selectPrompt.style.color = '#f1c40f';
        
        showSkinSelection(id, 2);
        
        if (gameMode !== 'online-client') {
            DOM.btnFight.style.display = 'inline-block';
        }
    }
};

function showSkinSelection(charId, playerNum) {
    const availableSkins = DataManager.data.skins[charId] || ['default'];
    if (availableSkins.length <= 1) return; // Only default skin, skip UI
    
    DOM.skinContainer.style.display = 'block';
    DOM.skinOptions.innerHTML = '';
    
    const colors = { 'default': CHARACTERS.find(c=>c.id===charId).color, 'neon': '#00ffcc', 'shadow': '#2d3436', 'gold': '#f1c40f' };
    
    availableSkins.forEach(skin => {
        const btn = document.createElement('div');
        btn.className = `skin-btn ${skin === 'default' ? 'selected' : ''}`;
        btn.style.background = colors[skin];
        btn.onclick = () => {
            document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (playerNum === 1) p1Skin = skin;
            else p2Skin = skin;
        };
        DOM.skinOptions.appendChild(btn);
    });
}

let player1, player2;
let roundNumber = 1; let p1Wins = 0, p2Wins = 0;
let roundActive = false, matchOver = false;

const particles = [];
let cameraShake = 0;

let timeScale = 1;
let timeScaleTarget = 1;
let accumulatedTime = 0;
let animationRunning = false;
let zoomTarget = 1; let currentZoom = 1;
let zoomFocus = { x: canvas.width/2, y: canvas.height/2 };
const p1ComboSys = { hits: 0, timer: 0 }; const p2ComboSys = { hits: 0, timer: 0 };
let aiController = null;

const p1Spawn = { x: 600, y: 0 };
const p2Spawn = { x: 1200, y: 0 };

// === EMOTE SYSTEM ===
const EMOTES = ['😤 Come on!', '⚡ Too slow!', '👊 My turn!', '🔥 Feel the heat!', '😎 Pathetic!'];
const emote1 = document.getElementById('p1-emote');
const emote2 = document.getElementById('p2-emote');
function fireEmote(el, player) {
    const myEmote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
    el.innerText = myEmote;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
}

// === SURVIVAL MODE STATE ===
let survivalWave = 0;
let survivalActive = false;

// === TIME ATTACK STATE ===
let timeAttackActive = false;
let timeAttackSeconds = 0;
let timeAttackP1Score = 0, timeAttackP2Score = 0;

// === TOURNAMENT STATE ===
let tournamentActive = false;
let tournamentBracket = [];
let tournamentMatchIndex = 0;
let tournamentPlayerChar = null;
let tournamentRosterEl = document.getElementById('tournament-roster');
let tournamentBracketEl = document.getElementById('tournament-bracket');

// === CINEMATIC HELPERS ===
const flashEl = document.getElementById('screen-flash');
const modeHud = document.getElementById('mode-hud');

function triggerScreenFlash(color = '#ffffff') {
    flashEl.style.background = color;
    flashEl.style.opacity = '0';
    flashEl.classList.remove('flash-active');
    void flashEl.offsetWidth;
    flashEl.classList.add('flash-active');
}

function emitFire(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle({
            position: { x: x + (Math.random()-0.5)*20, y: y + (Math.random()-0.5)*10 },
            velocity: { x: (Math.random()-0.5)*3, y: -(Math.random()*4+1) },
            radius: Math.random()*8+4,
            type: 'fire'
        }));
    }
}

function emitSmoke(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle({
            position: { x: x + (Math.random()-0.5)*30, y },
            velocity: { x: (Math.random()-0.5)*1.5, y: -(Math.random()*2) },
            radius: Math.random()*15+10,
            type: 'smoke'
        }));
    }
}

function emitEnergyRing(x, y, color = '#00ffcc') {
    const count = 20;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        particles.push(new Particle({
            position: { x, y },
            velocity: { x: Math.cos(angle)*5, y: Math.sin(angle)*5 },
            radius: 8,
            color,
            type: 'energy'
        }));
    }
}

function emitTrail(player, color) {
    particles.push(new Particle({
        position: { x: player.position.x + player.width/2, y: player.position.y + player.height/2 },
        velocity: { x: (Math.random()-0.5)*2, y: (Math.random()-0.5)*2 },
        radius: Math.random()*6+3,
        color: color || player.baseColor,
        type: 'trail'
    }));
}

function emitSparks(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push(new Particle({
            position: { x, y },
            velocity: { x: Math.cos(angle)*speed, y: Math.sin(angle)*speed - 2 },
            radius: Math.random()*3+1,
            color: color || '#f1c40f',
            type: 'spark'
        }));
    }
}

// === LEVEL UP TOAST ===
function showLevelUp(charName, newLevel) {
    const toast = document.getElementById('levelup-toast');
    document.getElementById('levelup-text').innerText = `${charName} → LVL ${newLevel}`;
    toast.style.display = 'block';
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.style.display = 'none', 500);
    }, 3500);
}

 

window.startGame = () => {
    if (audio) audio.punch();
    
    if (gameMode === 'online-host') { NetworkManager.send({ type: 'start_game' }); }
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    DOM.uiLayer.classList.remove('active');
    DOM.gameContainer.style.display = 'block';
    
    const stageData = STAGES.find(s => s.id === selectedStageId);
    generateStageLayers(stageData);

    setTimeout(() => {
        DOM.gameContainer.style.opacity = '1';
        if (audio) audio.playBGM();
    }, 200);

    const c1 = CHARACTERS.find(c => c.id === p1SelectionId);
    const c2 = CHARACTERS.find(c => c.id === p2SelectionId);

    // Generate specific skin overrides dynamically if needed
    if (p1Skin !== 'default' && !globalSprites[`${c1.id}_${p1Skin}`]) {
        globalSprites[`${c1.id}_${p1Skin}`] = AssetGenerator.generate(c1.color, c1.archetype, p1Skin);
    }
    if (p2Skin !== 'default' && !globalSprites[`${c2.id}_${p2Skin}`]) {
        globalSprites[`${c2.id}_${p2Skin}`] = AssetGenerator.generate(c2.color, c2.archetype, p2Skin);
    }

    player1 = new Player({
        position: { x: p1Spawn.x, y: physics.groundY - 130 }, velocity: { x: 0, y: 0 }, color: p1Skin === 'default' ? c1.color : (p1Skin==='neon'?'#00ffcc':p1Skin==='gold'?'#f1c40f':'#2d3436'), playerId: 'p1', archetype: c1.archetype,
        keys: { left: 'a', right: 'd', down: 's', jump: 'w', block: 'e', punch: 'f', kick: 'g', special: 'r' },
        sprites: p1Skin === 'default' ? globalSprites[c1.id] : globalSprites[`${c1.id}_${p1Skin}`]
    });

    player2 = new Player({
        position: { x: p2Spawn.x, y: physics.groundY - 130 }, velocity: { x: 0, y: 0 }, color: p2Skin === 'default' ? c2.color : (p2Skin==='neon'?'#00ffcc':p2Skin==='gold'?'#f1c40f':'#2d3436'), isFacingLeft: true, playerId: 'p2', archetype: c2.archetype,
        keys: { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', jump: 'ArrowUp', block: 'i', punch: 'k', kick: 'l', special: 'o' },
        sprites: p2Skin === 'default' ? globalSprites[c2.id] : globalSprites[`${c2.id}_${p2Skin}`]
    });

    roundNumber = 1; p1Wins = 0; p2Wins = 0;
    matchOver = false; accumulatedTime = 0;
    if (gameMode === 'pve') aiController = new AIController(player2, player1, 'hard');

    // Expose game state for debugging
    window.gameDebug = {
        get roundActive() { return roundActive; },
        get matchOver() { return matchOver; },
        get p1() { return player1; },
        get p2() { return player2; },
        get ai() { return aiController; },
        get mode() { return gameMode; },
        get keys() { return keys; }
    };
    
    if (gameMode === 'training') {
        document.getElementById('training-overlay').style.display = 'block';
        debugMode = true; // Show hitboxes natively
    } else {
        document.getElementById('training-overlay').style.display = 'none';
        debugMode = false;
    }
    


    console.log('[GAME] startGame complete. gameMode:', gameMode, 'matchOver:', matchOver);

    updateWinDots();
    startRoundSequence();
    if (!animationRunning) { animationRunning = true; animate(); }
};

window.addEventListener('keydown', (event) => {
    if (event.code === 'Backslash') debugMode = !debugMode;
    
    // Normalize single characters to lowercase to prevent CapsLock/Shift from breaking controls
    const k = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys[k] = true;
    keys[event.key] = true; // Still save original just in case P2 uses uppercase mapped keys
    
    if (!roundActive || !player1) return;
    
    // Emote keys
    if (k === 't') { fireEmote(emote1, player1); return; }
    if (event.key === ']') { fireEmote(emote2, player2); return; } 
    
    const fireAttack = (pId, type) => {
        if (pId === 'p1') {
            player1.attack(type);
            if (gameMode === 'online-host' || gameMode === 'online-client') NetworkManager.send({ type: 'attack_trigger', attack: type});
        }
        else if (pId === 'p2') player2.attack(type);
    };

    if (k === player1.keys.punch) fireAttack('p1', 'punch');
    if (k === player1.keys.kick) {
        if (keys[player1.keys.down] || keys[player1.keys.down.toUpperCase()]) fireAttack('p1', 'crouchKick');
        else fireAttack('p1', 'kick');
    }
    if (k === player1.keys.special) fireAttack('p1', 'special');
    
    if (gameMode === 'pvp') {
        const pk = event.key; // allow arrow keys perfectly
        if (pk === player2.keys.punch || pk.toLowerCase() === player2.keys.punch) fireAttack('p2', 'punch');
        if (pk === player2.keys.kick || pk.toLowerCase() === player2.keys.kick) {
            if (keys[player2.keys.down]) fireAttack('p2', 'crouchKick');
            else fireAttack('p2', 'kick');
        }
        if (pk === player2.keys.special || pk.toLowerCase() === player2.keys.special) fireAttack('p2', 'special');
    }
});

window.addEventListener('keyup', (event) => { 
    const k = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys[k] = false; 
    keys[event.key] = false; 
});

function drawShadow(player) {
    if (player.isDead) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    let altitudeRatio = Math.max(1, physics.groundY - (player.position.y + player.height));
    let shadowWidth = Math.max(10, 35 - (altitudeRatio * 0.1));
    ctx.ellipse(player.position.x + player.width / 2, physics.groundY, shadowWidth, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawRageAura(player) {
    if (player.isDead || !player.isRageActive) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 40; 
    ctx.shadowColor = '#ff4757';
    ctx.fillStyle = 'rgba(255, 71, 87, 0.4)'; 
    ctx.beginPath();
    ctx.ellipse(player.hurtbox.position.x + player.hurtbox.width/2, player.hurtbox.position.y + player.hurtbox.height/2, player.hurtbox.width, player.hurtbox.height, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawDebugHitboxes(player) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(46, 204, 113, 1)';
    ctx.strokeRect(player.hurtbox.position.x, player.hurtbox.position.y, player.hurtbox.width, player.hurtbox.height);
    ctx.strokeStyle = 'rgba(52, 152, 219, 1)';
    ctx.strokeRect(player.pushbox.position.x, player.pushbox.position.y, player.pushbox.width, player.pushbox.height);
    
    if (player.isHitboxActive) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        ctx.strokeStyle = 'rgba(231, 76, 60, 1)';
        ctx.fillRect(player.hitbox.position.x, player.hitbox.position.y, player.hitbox.width, player.hitbox.height);
        ctx.strokeRect(player.hitbox.position.x, player.hitbox.position.y, player.hitbox.width, player.hitbox.height);
    }
    ctx.restore();
}

function updateWinDots() {
    DOM.p1Win1.className = 1 <= p1Wins ? 'win-dot won' : 'win-dot';
    DOM.p1Win2.className = 2 <= p1Wins ? 'win-dot won' : 'win-dot';
    DOM.p2Win1.className = 1 <= p2Wins ? 'win-dot won' : 'win-dot';
    DOM.p2Win2.className = 2 <= p2Wins ? 'win-dot won' : 'win-dot';
}

function showOverlay(text, duration = null) {
    DOM.overlay.innerText = text;
    DOM.overlay.style.display = 'block';
    if (duration) setTimeout(() => { DOM.overlay.style.display = 'none'; }, duration);
}



function startRoundSequence() {
    roundActive = false; timeScaleTarget = 1; timeScale = 1; zoomTarget = 1;
    player1.reset(p1Spawn.x, p1Spawn.y, false);
    player2.reset(p2Spawn.x, p2Spawn.y, true);
    
    DOM.p1Health.style.width = '100%'; DOM.p2Health.style.width = '100%';
    DOM.p1Rage.style.width = '0%'; DOM.p2Rage.style.width = '0%';
    
    startRoundTimerSequence();
}

function startRoundTimerSequence() {
    showOverlay(`ROUND ${roundNumber}`);
    console.log('[GAME] Round sequence started. roundActive:', roundActive);
    setTimeout(() => {
        showOverlay('FIGHT!', 1000);
        roundActive = true;
        console.log('[GAME] FIGHT! roundActive is now:', roundActive, 'matchOver:', matchOver);
    }, 2000);
}


function handleCombatHit(attacker, defender, healthBarDOMKey, attackerComboSys) {
    if (attacker.isAttacking && attacker.isHitboxActive && !attacker.hasHit && physics.checkCollision(attacker.hitbox, defender.hurtbox)) {
        attacker.hasHit = true; 
        const atkProps = attacker.attacks[attacker.attackType];
        
        let dmgOffset = atkProps.baseDmg * attacker.dmgMult; 
        if (attacker.isRageActive) dmgOffset *= 1.2; // Reduced rage bonus
        
        const isCounter = defender.isAttacking && !defender.hasHit;
        if (isCounter) {
            dmgOffset *= 1.5; 
            timeScaleTarget = 0.2; // Slow-mo on counter hit
            setTimeout(() => { timeScaleTarget = 1.0; }, 600);
            showOverlay('COUNTER HIT!', 800, '#e74c3c');
        }
        
        // Combo damage scaling - diminishing returns
        const comboHits = attackerComboSys.hits;
        if (comboHits >= 4) dmgOffset *= 0.6;
        else if (comboHits >= 3) dmgOffset *= 0.75;
        else if (comboHits >= 2) dmgOffset *= 0.9;
        
        const resolution = defender.resolveHit(atkProps.type, dmgOffset);
        
        if (resolution.blockStatus === 'parry') {
            timeScaleTarget = 0.2; // Match the slow-mo hit
            setTimeout(() => { timeScaleTarget = 1.0; }, 600);
        }
        
        const hitX = defender.hurtbox.position.x + (defender.hurtbox.width / 2);
        const hitY = defender.hurtbox.position.y + 20; 
        
        if (resolution.blockStatus === 'full') {
            emitSparks(hitX, hitY, '#3498db', 10); 
            attackerComboSys.hits = 0; 
        } else if (resolution.blockStatus === 'parry') {
            emitSparks(hitX, hitY, '#00ffcc', 15);
            showOverlay('PARRY', 800, '#00ffcc');
            attackerComboSys.hits = 0;
            if (audio) audio.block();
        } else {
            attackerComboSys.hits++; attackerComboSys.timer = 60;
            if (attackerComboSys.hits === 5 && attacker.playerId === 'p1') window.showAchievement('combo5', '5-Hit Combo');
            emitSparks(hitX, hitY, '#f1c40f', 8);
            if (attacker.attackType === 'special') {
                // Cinematic special move: zoom, energy ring, fire + smoke
                cameraShake = 40;
                zoomTarget = 1.5;
                zoomFocus = { x: hitX, y: hitY };
                setTimeout(() => { zoomTarget = 1; }, 700);
                emitEnergyRing(hitX, hitY, attacker.baseColor || '#00ffcc');
                emitFire(hitX, hitY, 14);
                emitSmoke(hitX, hitY, 5);
                triggerScreenFlash(attacker.baseColor ? attacker.baseColor + '60' : 'rgba(255,200,0,0.3)');
                timeScaleTarget = 0.15;
                setTimeout(() => { timeScaleTarget = 1; }, 600);
            } else if (attacker.attackType === 'kick' || attacker.attackType === 'crouchKick') {
                cameraShake = 20;
                emitSparks(hitX, hitY, '#ff9000', 6);
            } else {
                cameraShake = 8;
            }
        }
        
        // Animated health bar damage flash
        const hpEl = healthBarDOMKey === 'player1-health' ? DOM.p1Health : DOM.p2Health;
        hpEl.classList.remove('damage-flash');
        void hpEl.offsetWidth; // Force reflow to re-trigger animation
        hpEl.classList.add('damage-flash');
        
        if (attacker.playerId === 'p1') DOM.p1Rage.style.width = attacker.rage + '%';
        else DOM.p2Rage.style.width = attacker.rage + '%';
        if (defender.playerId === 'p1') DOM.p1Rage.style.width = defender.rage + '%';
        else DOM.p2Rage.style.width = defender.rage + '%';
        
        // Rage full pulse
        DOM.p1Rage.classList.toggle('rage-full', player1.isRageActive);
        DOM.p2Rage.classList.toggle('rage-full', player2.isRageActive);
        
        if (healthBarDOMKey === 'player1-health') DOM.p1Health.style.width = defender.health + '%';
        else DOM.p2Health.style.width = defender.health + '%';
    }
}

function exitMatch() {
    DOM.overlay.style.display = 'none';
    survivalActive = false; survivalWave = 0;
    timeAttackActive = false; timeAttackP1Score = 0; timeAttackP2Score = 0;
    if (modeHud) { modeHud.innerText = ''; modeHud.style.display = 'none'; }
    updateProfileStats();
    window.nav('main-menu');
}

function endRound(winnerName) {
    if (gameMode === 'training') return; // Training never ends
    roundActive = false;
    
    // Final-hit DEEP slow-mo cinematic
    timeScaleTarget = 0.05;
    setTimeout(() => { timeScaleTarget = 1; }, 800);
    
    // Camera zoom in on the action
    zoomTarget = 1.4;
    zoomFocus.x = (player1.position.x + player2.position.x) / 2;

    // Cinematic flash on final blow
    if (winnerName === 'Player 1') triggerScreenFlash('rgba(255,100,50,0.6)');
    else if (winnerName === 'Player 2') triggerScreenFlash('rgba(30,144,255,0.6)');
    else triggerScreenFlash('rgba(255,255,255,0.4)');

    if (winnerName === 'Player 1') p1Wins++;
    else if (winnerName === 'Player 2') p2Wins++;
    updateWinDots();

    if (p1Wins >= 2 || p2Wins >= 2) {
        matchOver = true;

        const p1Won = p1Wins === 2;
        let matchResultObj = null;
        if (p1Won) {
            window.showAchievement('firstWin', 'First Blood');
            if (DataManager.data.wins >= 9) window.showAchievement('10wins', '10 Wins');
            if (player1.health >= 100) window.showAchievement('perfect', 'Perfect Win');
            showOverlay('PLAYER 1 WINS!');
            if (gameMode !== 'online-client') {
                matchResultObj = DataManager.addMatchResult(true, false, player1.health >= 100, p1ComboSys.hits, p1SelectionId);
            }
        } else {
            showOverlay('PLAYER 2 WINS!');
            if (gameMode !== 'online-client') {
                matchResultObj = DataManager.addMatchResult(false, false, player2.health >= 100, p2ComboSys.hits, p1SelectionId);
            }
        }

        // XP level-up check
        if (matchResultObj && matchResultObj.levelUp && matchResultObj.levelUp.leveledUp) {
            const charData = CHARACTERS.find(c => c.id === p1SelectionId);
            if (charData) setTimeout(() => showLevelUp(charData.name, matchResultObj.levelUp.newLevel), 2000);
        }



        // Default: show coin reward
        setTimeout(() => {
            if (matchResultObj && matchResultObj.coins > 0) {
                showOverlay(`EARNED 🪙 ${matchResultObj.coins}`);
            }
            setTimeout(() => { exitMatch(); }, 3000);
        }, 3000);
        return;
    }

    setTimeout(() => { if (winnerName === 'Draw') showOverlay('DRAW!'); else showOverlay(`${winnerName} WINS ROUND ${roundNumber}!`); }, 1500);
    roundNumber++; setTimeout(() => { startRoundSequence(); }, 4000);
}

function pollGamepads(p1Intent, p2Intent) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    if (gamepads[0]) {
        const gp = gamepads[0];
        if (gp.axes[0] < -0.4 || gp.buttons[14]?.pressed) p1Intent.left = true;
        if (gp.axes[0] > 0.4 || gp.buttons[15]?.pressed) p1Intent.right = true;
        if (gp.axes[1] > 0.4 || gp.buttons[13]?.pressed) p1Intent.down = true;
        if (gp.axes[1] < -0.4 || gp.buttons[12]?.pressed || gp.buttons[0]?.pressed) p1Intent.jump = true;
        
        if (gp.buttons[4]?.pressed || gp.buttons[6]?.pressed) p1Intent.block = true; 
        
        const fire = (type) => { 
            player1.attack(type); 
            if(gameMode==='online-host'||gameMode==='online-client') NetworkManager.send({type:'attack_trigger', attack:type});
        };
        
        if (gp.buttons[2]?.pressed) fire('punch');
        if (gp.buttons[3]?.pressed) { if(p1Intent.down) fire('crouchKick'); else fire('kick'); }
        if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) fire('special');
    }
    
    if (gamepads[1] && gameMode === 'pvp') {
        const gp = gamepads[1];
        if (gp.axes[0] < -0.4 || gp.buttons[14]?.pressed) p2Intent.left = true;
        if (gp.axes[0] > 0.4 || gp.buttons[15]?.pressed) p2Intent.right = true;
        if (gp.axes[1] > 0.4 || gp.buttons[13]?.pressed) p2Intent.down = true;
        if (gp.axes[1] < -0.4 || gp.buttons[12]?.pressed || gp.buttons[0]?.pressed) p2Intent.jump = true;
        
        if (gp.buttons[4]?.pressed || gp.buttons[6]?.pressed) p2Intent.block = true;
        
        if (gp.buttons[2]?.pressed) player2.attack('punch');
        if (gp.buttons[3]?.pressed) { if(p2Intent.down) player2.attack('crouchKick'); else player2.attack('kick'); }
        if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) player2.attack('special');
    }
}

let tickCount = 0;

function gameEngineTick(ts) {
    if (timeScale < timeScaleTarget) {
        timeScale += 0.02;
        if (timeScale > timeScaleTarget) timeScale = timeScaleTarget;
    } else if (timeScale > timeScaleTarget) {
        timeScale -= 0.05;
        if (timeScale < timeScaleTarget) timeScale = timeScaleTarget;
    }

    if (gameMode === 'training') {
        player1.health = 100;
        player2.health = 100;
        p1Wins = 0; p2Wins = 0;
        DOM.p1Health.style.width = '100%';
        DOM.p2Health.style.width = '100%';
    }

    if (roundActive && !matchOver) {
        tickCount++;
        let p1Intent = { left: false, right: false, down: false, jump: false, block: false };
        let p2Intent = { left: false, right: false, down: false, jump: false, block: false };

        // 1. Local Keyboard Vectors
        const k1L = player1.keys.left, k1R = player1.keys.right, k1D = player1.keys.down, k1U = player1.keys.jump, k1B = player1.keys.block;
        if (keys[k1L] || keys[k1L.toUpperCase()]) p1Intent.left = true;
        if (keys[k1R] || keys[k1R.toUpperCase()]) p1Intent.right = true;
        if (keys[k1D] || keys[k1D.toUpperCase()]) p1Intent.down = true;
        if (keys[k1U] || keys[k1U.toUpperCase()]) p1Intent.jump = true;
        if (keys[k1B] || keys[k1B.toUpperCase()]) p1Intent.block = true;
        
        if (gameMode === 'pvp') {
            const k2L = player2.keys.left, k2R = player2.keys.right, k2D = player2.keys.down, k2U = player2.keys.jump, k2B = player2.keys.block;
            if (keys[k2L] || (k2L.length===1&&keys[k2L.toUpperCase()])) p2Intent.left = true;
            if (keys[k2R] || (k2R.length===1&&keys[k2R.toUpperCase()])) p2Intent.right = true;
            if (keys[k2D] || (k2D.length===1&&keys[k2D.toUpperCase()])) p2Intent.down = true;
            if (keys[k2U] || (k2U.length===1&&keys[k2U.toUpperCase()])) p2Intent.jump = true;
            if (keys[k2B] || (k2B.length===1&&keys[k2B.toUpperCase()])) p2Intent.block = true;
        }

        try { pollGamepads(p1Intent, p2Intent); } catch(e) {}

        // WebRTC Multiplexing Vectors completely decoupling local/remote nodes synchronously natively!
        if (gameMode === 'online-host') {
            player1.handleInput(p1Intent);
            player2.handleInput(remoteIntent);
            
            // Sync intent over Network
            NetworkManager.send({ 
                type: 'gamestate', 
                intent: p1Intent,
                corrections: (tickCount % 10 === 0) ? { p1x: player1.position.x, p1y: player1.position.y, p2x: player2.position.x, p2y: player2.position.y, p1h: player1.health, p2h: player2.health } : null
            });
        } 
        else if (gameMode === 'online-client') {
            // Client plays character 2 locally, but uses network mapping intentionally
            player2.handleInput(p1Intent); // Local control routes to player 2
            player1.handleInput(remoteIntent); // Remote control routes to player 1
            
            NetworkManager.send({ type: 'gamestate', intent: p1Intent });
        }
        else {
            player1.handleInput(p1Intent);
            
            if (gameMode === 'training') {
                if (trainingAIToggled) {
                    if (!aiController) aiController = new AIController(player2, player1, 'hard'); 
                    aiController.update(p1ComboSys.hits);
                } // otherwise it stands still
            }
            if (gameMode === 'pve') {
                if (aiController) aiController.update(p1ComboSys.hits);
            }
            else { player2.handleInput(p2Intent); }
        }

        // === TRAIL PARTICLES (fast archetype while attacking) ===
        if (player1.isAttacking && player1.archetype === 'fast') emitTrail(player1, player1.baseColor);
        if (player2.isAttacking && player2.archetype === 'fast') emitTrail(player2, player2.baseColor);


    } else {
        player1.velocity.x = 0; player2.velocity.x = 0;
    }

    player1.tick(canvas.width, arenaWidth, ts);
    player2.tick(canvas.width, arenaWidth, ts);
    
    if (roundActive && !matchOver) physics.resolvePushbox(player1, player2);
    
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].tick(ts); if (particles[i].alpha <= 0) particles.splice(i, 1); }
    
    if (p1ComboSys.timer > 0) { p1ComboSys.timer -= timeScale; if (p1ComboSys.timer <= 0) p1ComboSys.hits = 0; }
    if (p2ComboSys.timer > 0) { p2ComboSys.timer -= timeScale; if (p2ComboSys.timer <= 0) p2ComboSys.hits = 0; }
    
    // Animated combo counter with pop effect
    const updateCombo = (el, sys) => {
        if (sys.hits > 1) {
            if (!el.classList.contains('active') || el.dataset.hits != sys.hits) {
                el.classList.remove('active');
                void el.offsetWidth;
                el.classList.add('active');
                el.dataset.hits = sys.hits;
            }
            el.innerText = sys.hits + ' HITS!';
        } else {
            el.classList.remove('active');
        }
    };
    updateCombo(DOM.p1Combo, p1ComboSys);
    updateCombo(DOM.p2Combo, p2ComboSys);

    if (roundActive && !matchOver) {
        handleCombatHit(player1, player2, 'player2-health', p1ComboSys);
        handleCombatHit(player2, player1, 'player1-health', p2ComboSys);
        if (player1.health <= 0 && player2.health <= 0) endRound('Draw');
        else if (player1.health <= 0) endRound('Player 2');
        else if (player2.health <= 0) endRound('Player 1');
    }
    
    const targetCamX = ((player1.position.x + player2.position.x) / 2) - (canvas.width / 2);
    camera.x += (targetCamX - camera.x) * 0.1;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > arenaWidth - canvas.width) camera.x = arenaWidth - canvas.width;
}

function renderEngine() {
    ctx.save();
    currentZoom += (zoomTarget - currentZoom) * 0.1;
    
    if (currentZoom > 1.01) {
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(currentZoom, currentZoom);
        const panX = -(zoomFocus.x - canvas.width/2 - camera.x) * (currentZoom - 1);
        const panY = -(zoomFocus.y - canvas.height/2) * (currentZoom - 1);
        ctx.translate(panX + (Math.random()-0.5)*cameraShake, panY + (Math.random()-0.5)*cameraShake);
    } else if (cameraShake > 0) {
        ctx.translate((Math.random() - 0.5) * cameraShake, (Math.random() - 0.5) * cameraShake);
    }
    
    cameraShake *= 0.85; if (cameraShake < 0.5) cameraShake = 0;

    ctx.drawImage(activeStageLayer3, -camera.x * 0.2, 0); 
    ctx.drawImage(activeStageLayer2, -camera.x * 0.5, 0); 
    ctx.drawImage(activeStageLayer1, -camera.x * 1.0, 0); 
    
    ctx.translate(-camera.x, 0); 
    
    drawShadow(player1); drawShadow(player2);
    drawRageAura(player1); drawRageAura(player2);

    player1.draw(ctx); player2.draw(ctx);
    for (let i = 0; i < particles.length; i++) particles[i].draw(ctx);
    
    if(debugMode){ drawDebugHitboxes(player1); drawDebugHitboxes(player2); }
    
    ctx.restore();
}

function animate() {
    window.requestAnimationFrame(animate);
    try {
        accumulatedTime += timeScale;
        while (accumulatedTime >= 1) { gameEngineTick(1); accumulatedTime -= 1; }
        renderEngine();
    } catch(e) {
        if (!window.hasAlertedError) {
            alert("ENGINE CRASH: " + e.message + "\\n" + e.stack);
            window.hasAlertedError = true;
        }
        console.error('[GAME] Error in animate loop:', e);
    }
}


