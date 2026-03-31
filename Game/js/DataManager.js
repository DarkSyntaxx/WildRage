/**
 * DataManager — Persistent progression, coins, achievements, XP, levels.
 * Schema v4: adds charXP, charLevel, survivalBest, tournamentWins fields.
 */
export const DataManager = {
    storageKey: 'DojoFightersState',
    
    data: {
        wins: 0,
        losses: 0,
        rank: 'White Belt',
        unlocked: ['ninja', 'brawler', 'monk'],
        coins: 100,
        skins: {
            ninja: ['default'], brawler: ['default'], monk: ['default'],
            cyborg: ['default'], assassin: ['default']
        },
        storyProgress: 0,
        achievements: [],
        score: 0,
        charXP: { ninja: 0, brawler: 0, monk: 0, cyborg: 0, assassin: 0 },
        charLevel: { ninja: 1, brawler: 1, monk: 1, cyborg: 1, assassin: 1 },
        survivalBest: 0,
        tournamentWins: 0
    },

    // Level thresholds: index = level-1, value = XP required to reach that level
    LEVEL_THRESHOLDS: [0, 100, 250, 500, 1000],
    MAX_LEVEL: 5,

    init() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.data = { ...this.data, ...parsed };
                // Schema forward-compatibility
                if (!this.data.unlocked) this.data.unlocked = ['ninja', 'brawler', 'monk'];
                if (this.data.coins === undefined) this.data.coins = 100;
                if (!this.data.skins) this.data.skins = { ninja: ['default'], brawler: ['default'], monk: ['default'], cyborg: ['default'], assassin: ['default'] };
                if (this.data.storyProgress === undefined) this.data.storyProgress = 0;
                if (!this.data.achievements) this.data.achievements = [];
                if (this.data.score === undefined) this.data.score = 0;
                if (!this.data.charXP) this.data.charXP = { ninja: 0, brawler: 0, monk: 0, cyborg: 0, assassin: 0 };
                if (!this.data.charLevel) this.data.charLevel = { ninja: 1, brawler: 1, monk: 1, cyborg: 1, assassin: 1 };
                if (this.data.survivalBest === undefined) this.data.survivalBest = 0;
                if (this.data.tournamentWins === undefined) this.data.tournamentWins = 0;
            } catch(e) {
                console.warn('[DataManager] Failed to parse stored data, resetting.', e);
                this.save();
            }
        } else {
            this.save();
        }
    },

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    },

    // === XP & LEVELING ===

    addXP(charId, amount) {
        if (!this.data.charXP[charId]) this.data.charXP[charId] = 0;
        if (!this.data.charLevel[charId]) this.data.charLevel[charId] = 1;
        const currentLevel = this.data.charLevel[charId];
        if (currentLevel >= this.MAX_LEVEL) return { leveledUp: false, newLevel: currentLevel };

        this.data.charXP[charId] += amount;
        const nextThreshold = this.LEVEL_THRESHOLDS[currentLevel];
        let leveledUp = false;

        if (this.data.charXP[charId] >= nextThreshold) {
            this.data.charLevel[charId]++;
            this.data.charXP[charId] -= nextThreshold;
            leveledUp = true;
        }

        this.save();
        return { leveledUp, newLevel: this.data.charLevel[charId] };
    },

    getXPProgress(charId) {
        const level = this.data.charLevel[charId] || 1;
        if (level >= this.MAX_LEVEL) return { xp: 0, needed: 0, progress: 1 };
        const xp = this.data.charXP[charId] || 0;
        const needed = this.LEVEL_THRESHOLDS[level];
        return { xp, needed, progress: xp / needed };
    },

    getCharLevel(charId) {
        return this.data.charLevel[charId] || 1;
    },

    // === ACHIEVEMENTS ===

    awardAchievement(id) {
        if (!this.data.achievements.includes(id)) {
            this.data.achievements.push(id);
            this.save();
            return true;
        }
        return false;
    },

    // === LEADERBOARD ===

    getLeaderboard() {
        const bots = [
            { name: 'KageFighter99', score: 12500 },
            { name: 'RyuZen', score: 8400 },
            { name: 'NeonStriker', score: 6200 },
            { name: 'IronFist', score: 4100 },
            { name: 'ShadowClaw', score: 2500 }
        ];
        const local = { name: 'YOU (P1)', score: this.data.score, isLocal: true };
        return [...bots, local].sort((a, b) => b.score - a.score);
    },

    // === UNLOCKS & SKINS ===

    isUnlocked(charId) { return this.data.unlocked.includes(charId); },

    hasSkin(charId, skinId) {
        if (!this.data.skins[charId]) this.data.skins[charId] = ['default'];
        return this.data.skins[charId].includes(skinId);
    },

    buyCharacter(charId, cost) {
        if (this.data.coins >= cost && !this.isUnlocked(charId)) {
            this.data.coins -= cost;
            this.data.unlocked.push(charId);
            if (!this.data.skins[charId]) this.data.skins[charId] = ['default'];
            this.save();
            return true;
        }
        return false;
    },

    buySkin(charId, skinId, cost) {
        if (this.data.coins >= cost && !this.hasSkin(charId, skinId)) {
            this.data.coins -= cost;
            this.data.skins[charId].push(skinId);
            this.save();
            return true;
        }
        return false;
    },

    // === RANK ===

    updateRank() {
        const w = this.data.wins;
        if (w >= 50) this.data.rank = 'Grandmaster';
        else if (w >= 25) this.data.rank = 'Black Belt';
        else if (w >= 10) this.data.rank = 'Purple Belt';
        else if (w >= 5) this.data.rank = 'Blue Belt';
        else this.data.rank = 'White Belt';
    },

    checkUnlocks() {
        let unlocks = [];
        if (this.data.wins >= 2 && !this.data.unlocked.includes('cyborg')) {
            this.data.unlocked.push('cyborg');
            unlocks.push('GOLD CYBORG');
        }
        if (this.data.wins >= 5 && !this.data.unlocked.includes('assassin')) {
            this.data.unlocked.push('assassin');
            unlocks.push('VOID ASSASSIN');
        }
        return unlocks;
    },

    // === MATCH RESULT ===

    addMatchResult(won, isStory = false, isPerfect = false, maxCombo = 0, charId = null) {
        let earnedCoins = 0;
        let earnedScore = 0;
        let earnedXP = 0;

        if (won) {
            this.data.wins++;
            earnedCoins += 50;
            earnedScore += 100;
            earnedXP += 60;
            if (isStory) { this.data.storyProgress++; earnedScore += 50; earnedXP += 30; }
        } else {
            this.data.losses++;
            earnedCoins += 10;
            earnedScore += 10;
            earnedXP += 20;
        }

        if (isPerfect && won) { earnedCoins += 20; earnedScore += 50; earnedXP += 25; }
        if (maxCombo >= 5) { earnedCoins += 10; earnedScore += maxCombo * 5; earnedXP += maxCombo * 3; }

        this.data.coins += earnedCoins;
        this.data.score += earnedScore;

        let levelUpResult = null;
        if (charId) levelUpResult = this.addXP(charId, earnedXP);

        this.updateRank();
        const newUnlocks = this.checkUnlocks();
        this.save();

        return { unlocks: newUnlocks, coins: earnedCoins, xp: earnedXP, levelUp: levelUpResult };
    }
};
