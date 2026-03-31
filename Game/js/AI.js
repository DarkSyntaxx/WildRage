/**
 * Adaptive AI Controller with:
 * - Pattern tracking (learns what attacks the opponent uses most)
 * - Combo awareness (blocks when under a combo)
 * - Adaptive difficulty (plays smarter when losing)
 * - Jump-attack state
 * - Taunt state at full rage
 */
export class AIController {
    constructor(aiPlayer, opponent, difficulty = 'medium') {
        this.player = aiPlayer;
        this.opponent = opponent;
        this.difficulty = difficulty;
        this.tick = 0;
        this.intent = {};
        this.state = 'approach';
        this.stateTimer = 0;
        this.attackCooldownTimer = 0;

        // Pattern tracker: counts each attack the opponent uses
        this.opponentPatterns = { punch: 0, kick: 0, crouchKick: 0, special: 0 };
        this.lastOpponentAttack = null;

        // Adaptive parameters (will be tuned at runtime)
        this._setDifficulty(difficulty);
    }

    _setDifficulty(difficulty) {
        if (difficulty === 'insane') {
            this.reactSpeed = 3;
            this.blockChance = 0.85;
            this.attackRate = 0.85;
            this.retreatChance = 0.25;
        } else if (difficulty === 'hard') {
            this.reactSpeed = 6;
            this.blockChance = 0.65;
            this.attackRate = 0.65;
            this.retreatChance = 0.15;
        } else if (difficulty === 'easy') {
            this.reactSpeed = 30;
            this.blockChance = 0.1;
            this.attackRate = 0.3;
            this.retreatChance = 0.05;
        } else {
            this.reactSpeed = 15;
            this.blockChance = 0.35;
            this.attackRate = 0.5;
            this.retreatChance = 0.1;
        }
    }

    update(opponentComboHits = 0) {
        if (this.player.isDead || this.opponent.isDead) return;
        this.tick++;
        if (this.attackCooldownTimer > 0) this.attackCooldownTimer--;
        if (this.stateTimer > 0) this.stateTimer--;

        // Track opponent attack patterns
        if (this.opponent.isAttacking && this.opponent.attackType !== this.lastOpponentAttack) {
            this.lastOpponentAttack = this.opponent.attackType;
            if (this.opponentPatterns[this.opponent.attackType] !== undefined) {
                this.opponentPatterns[this.opponent.attackType]++;
            }
        } else if (!this.opponent.isAttacking) {
            this.lastOpponentAttack = null;
        }

        // Adaptive difficulty: if AI health is low vs opponent, get smarter
        this._adaptDifficulty();

        // Combo awareness: force block if opponent on 3+ hit combo
        if (opponentComboHits >= 3 && !this.player.isBlocking && this.stateTimer <= 0) {
            this.state = 'block';
            this.stateTimer = this.reactSpeed * 3;
        }

        if (this.tick % this.reactSpeed === 0) {
            this.decideState();
        }

        this.executeState();
        this.player.handleInput(this.intent);
    }

    _adaptDifficulty() {
        // Only adapt every 120 ticks to avoid jitter
        if (this.tick % 120 !== 0) return;
        const healthGap = this.player.health - this.opponent.health;
        if (healthGap < -30) {
            // AI is losing badly — get smarter
            this.reactSpeed = Math.max(4, this.reactSpeed - 1);
            this.blockChance = Math.min(0.9, this.blockChance + 0.05);
        } else if (healthGap > 30) {
            // AI is winning — relax a bit (makes it feel fair)
            this.reactSpeed = Math.min(20, this.reactSpeed + 1);
        }
    }

    _getFavoredCounterAttack() {
        // Counter the opponent's most-used attack
        const p = this.opponentPatterns;
        const mostUsed = Object.entries(p).sort((a, b) => b[1] - a[1])[0];
        if (!mostUsed || mostUsed[1] < 3) return null; // Not enough data yet
        const attack = mostUsed[0];
        // Counter low attacks (crouchKick) with jump; counter punch/kick with crouchKick
        if (attack === 'crouchKick') return 'jump_attack';
        if (attack === 'punch' || attack === 'kick') return 'crouchKick';
        return null;
    }

    decideState() {
        const dist = this.opponent.position.x - this.player.position.x;
        const absDist = Math.abs(dist);

        if (this.stateTimer > 0 && (this.state === 'block' || this.state === 'retreat')) return;

        // Priority 1: Block when opponent is attacking nearby
        if (this.opponent.isAttacking && absDist < 200 && Math.random() < this.blockChance) {
            this.state = 'block';
            this.stateTimer = this.reactSpeed * 2;
            return;
        }

        // Priority 2: Taunt when at full rage (cinematic moment before special)
        if (this.player.isRageActive && Math.random() < 0.15 && this.difficulty !== 'easy') {
            this.state = 'taunt';
            this.stateTimer = 20;
            return;
        }

        // Priority 3: Use special when rage is full and in range
        if (this.player.isRageActive && absDist < 250 && absDist > 50 && this.attackCooldownTimer <= 0) {
            this.state = 'special';
            return;
        }

        // Priority 4: Pattern-based counter attack
        const counter = this._getFavoredCounterAttack();
        if (counter && absDist < 180 && this.attackCooldownTimer <= 0) {
            this.state = counter === 'jump_attack' ? 'jump_attack' : 'attack_counter';
            return;
        }

        // Priority 5: Normal attack when in range
        if (absDist < 130 && this.attackCooldownTimer <= 0) {
            if (Math.random() < this.attackRate) {
                // Occasionally do a jump attack for variety
                if (Math.random() < 0.2 && this.player.isGrounded) {
                    this.state = 'jump_attack';
                } else {
                    this.state = 'attack';
                }
                return;
            }
        }

        // Priority 6: Occasional retreat
        if (absDist < 80 && Math.random() < this.retreatChance) {
            this.state = 'retreat';
            this.stateTimer = this.reactSpeed;
            return;
        }

        this.state = 'approach';
    }

    executeState() {
        const dist = this.opponent.position.x - this.player.position.x;

        this.intent = { left: false, right: false, down: false, jump: false, block: false };

        switch (this.state) {
            case 'approach':
                if (dist > 0) this.intent.right = true;
                else this.intent.left = true;
                if (Math.random() < 0.03 && this.player.isGrounded) this.intent.jump = true;
                break;

            case 'attack':
                if (this.attackCooldownTimer > 0) { this.state = 'approach'; break; }
                const rng = Math.random();
                if (rng > 0.6) {
                    this.intent.down = true;
                    this.player.attack('crouchKick');
                } else if (rng > 0.25) {
                    this.player.attack('kick');
                } else {
                    this.player.attack('punch');
                }
                this.attackCooldownTimer = this.reactSpeed;
                this.state = Math.random() < this.retreatChance ? 'retreat' : 'approach';
                break;

            case 'attack_counter':
                if (this.attackCooldownTimer > 0) { this.state = 'approach'; break; }
                this.intent.down = true;
                this.player.attack('crouchKick');
                this.attackCooldownTimer = this.reactSpeed;
                this.state = 'retreat';
                this.stateTimer = this.reactSpeed;
                break;

            case 'jump_attack':
                if (this.player.isGrounded) {
                    this.intent.jump = true;
                } else {
                    // Mid-air: move toward opponent and kick
                    if (dist > 0) this.intent.right = true;
                    else this.intent.left = true;
                    if (!this.player.isGrounded && this.attackCooldownTimer <= 0) {
                        this.player.attack('kick');
                        this.attackCooldownTimer = this.reactSpeed;
                        this.state = 'approach';
                    }
                }
                break;

            case 'special':
                this.player.attack('special');
                this.attackCooldownTimer = this.reactSpeed * 2;
                this.state = 'retreat';
                this.stateTimer = this.reactSpeed;
                break;

            case 'taunt':
                // Stand still, face opponent — emote fires from main.js if AI taunts
                this.intent = { left: false, right: false, down: false, jump: false, block: false };
                if (this.stateTimer <= 0) {
                    this.state = 'special'; // Execute special right after taunt
                }
                break;

            case 'block':
                this.intent.block = true;
                if (this.opponent.attackType === 'crouchKick' || this.opponent.isCrouching) {
                    this.intent.down = true;
                }
                break;

            case 'retreat':
                if (dist > 0) this.intent.left = true;
                else this.intent.right = true;
                break;

            case 'idle':
            default:
                break;
        }
    }
}
