import { Sprite } from './Sprite.js';
import { physics } from './Physics.js';
import { audio } from './AudioManager.js';

/**
 * Controller class executing Frame-Based Combat Mechanics, Geometric Collision Tracking
 * (Hurtbox/Pushbox/Hitboxes), and Rage Buff configurations modeled after authentic arcade fighting logic circuits.
 */
export class Player extends Sprite {
    constructor({ position, velocity, color = '#ff4757', keys, isFacingLeft = false, sprites, archetype='balanced', playerId='p1' }) {
        super({
            position,
            imageSrc: sprites.idle.src,
            framesMax: sprites.idle.framesMax,
            scale: 1.5,
            offset: { x: 65, y: 47 } 
        });
        
        this.velocity = velocity;
        this.width = 50;
        this.height = 130; // Explicit fixed height — don't rely on image load
        this.knockbackVel = 0;
        this.baseColor = color; 
        
        // Advanced Combat Mechanics
        this.parryTimer = 0;
        this.parryWindow = 15; // Frames of perfect parry
        
        // Visual fx parameters
        this.isFacingLeft = isFacingLeft;
        this.playerId = playerId;
        this.archetype = archetype;
        this.keys = keys;
        
        this.isGrounded = false;
        
        // Archetype Physics Bounds
        if (this.archetype === 'fast') {
            this.speed = 8;
            this.jumpForce = -17;
            this.dmgMult = 0.85;
            this.width = 35;
        } else if (this.archetype === 'heavy') {
            this.speed = 3.5;
            this.jumpForce = -13;
            this.dmgMult = 1.3;
            this.width = 65;
        } else {
            this.speed = 5.5;
            this.jumpForce = -15;
            this.dmgMult = 1.0;
        }
        // Explicitly clamp height to a constant known value for all archetypes
        this.height = 130;

        this.health = 100;
        this.mana = 0; 
        this.rage = 0; 
        this.isRageActive = false; 
        this.isDead = false;
        
        this.pushbox = { position: { x: this.position.x + 10, y: this.position.y }, width: this.width - 20, height: 130 };
        this.hurtbox = { position: { x: this.position.x, y: this.position.y }, width: this.width, height: 130 };
        this.hitbox = { position: { x: this.position.x, y: this.position.y }, width: 120, height: 50 };
        
        this.isBlocking = false;
        this.isCrouching = false;
        this.hitStunDuration = 0;

        this.isAttacking = false;
        this.attackType = null;
        this.attackCooldown = false;
        this.hasHit = false; 
        this.isHitboxActive = false;

        this.attacks = {
            punch: { activeFrame: 1, type: 'high', baseDmg: 6 },
            kick: { activeFrame: 1, type: 'mid', baseDmg: 10 },
            crouchKick: { activeFrame: 1, type: 'low', baseDmg: 7 },
            special: { activeFrameRanges: [1, 2, 3], type: 'high', baseDmg: 22 }
        };

        this.sprites = sprites;
        for (const key in this.sprites) {
            this.sprites[key].image = new Image();
            this.sprites[key].image.src = this.sprites[key].src;
        }
    }

    reset(x, y, isFacingLeft) {
        this.position.x = x;
        this.position.y = physics.groundY - this.height; // Spawn on the ground
        this.velocity = { x: 0, y: 0 };
        this.health = 100;
        this.rage = 0;
        this.isRageActive = false;
        this.isDead = false;
        this.isBlocking = false;
        this.isCrouching = false;
        this.hitStunDuration = 0;
        this.isAttacking = false;
        this.attackType = null;
        this.attackCooldown = false;
        this.hasHit = false;
        this.isHitboxActive = false;
        this.isFacingLeft = isFacingLeft;
        this.switchSprite('idle');
    }

    switchSprite(sprite) {
        if (this.image === this.sprites.punch.image && this.framesCurrent < this.sprites.punch.framesMax - 1) return;
        if (this.image === this.sprites.kick.image && this.framesCurrent < this.sprites.kick.framesMax - 1) return;
        if (this.image === this.sprites.crouchKick.image && this.framesCurrent < this.sprites.crouchKick.framesMax - 1) return;
        if (this.image === this.sprites.special.image && this.framesCurrent < this.sprites.special.framesMax - 1) return;

        if (this.image !== this.sprites[sprite].image) {
            this.image = this.sprites[sprite].image;
            this.framesMax = this.sprites[sprite].framesMax;
            this.framesCurrent = 0;
        }
    }

    addRage(amount) {
        this.rage += amount;
        if (this.rage >= 100) {
            this.rage = 100;
            this.isRageActive = true;
        }
    }

    resolveHit(attackType, baseDmg) {
        if (this.isDead) return { blockStatus: 'none', dmg: baseDmg };
        
        if (this.parryTimer > 0) {
            // Perfect Parry executed!
            this.rage = Math.min(100, this.rage + 15);
            return { blockStatus: 'parry', dmg: 0 };
        }
        
        let blockStatus = 'none'; 
        let dmg = baseDmg;

        if (this.isBlocking) {
            const isCrouchBlocking = this.isCrouching;
            
            if (attackType === 'high' && isCrouchBlocking) {
                blockStatus = 'broken';
            } else if (attackType === 'low' && !isCrouchBlocking) {
                blockStatus = 'broken';
            } else {
                blockStatus = 'full';
                dmg = baseDmg * 0.15; // Reduced chip damage
            }
        }
        
        if (audio) {
            if (blockStatus === 'full') audio.block();
            else audio.hit(); 
        }
        
        this.health -= dmg;
        
        if (blockStatus === 'full' || blockStatus === 'parry') {
            this.hitStunDuration = 6;
        } else {
            this.hitStunDuration = 15; // Shorter hitstun for faster recovery
            this.isAttacking = false;
        }

        this.addRage(Math.min(dmg * 1.5, 15)); // Capped rage gain per hit
        this.mana = this.rage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
        
        return { blockStatus, dmg };
    }

    tick(canvasWidth, arenaWidth = 1024, timeScale = 1) {
        this.pushbox.position.x = this.position.x + 10;
        this.pushbox.position.y = this.position.y;
        
        this.hurtbox.position.x = this.position.x;
        if (this.isCrouching) {
            this.hurtbox.height = 80;
            this.hurtbox.position.y = this.position.y + 50;
        } else {
            this.hurtbox.height = 130;
            this.hurtbox.position.y = this.position.y;
        }
        
        this.isHitboxActive = false;
        
        if (this.isAttacking && this.attacks[this.attackType]) {
            const frameMetrics = this.attacks[this.attackType];
            
            if (this.attackType === 'special') {
                if (this.framesCurrent >= 1 && this.framesCurrent <= 3) this.isHitboxActive = true;
            } else {
                if (this.framesCurrent === frameMetrics.activeFrame) this.isHitboxActive = true;
            }
            
            // Scaled dynamically enforcing wide geometries per Archetype
            if (this.attackType === 'punch') {
                this.hitbox.width = 90 * this.width/50; this.hitbox.height = 30; this.hitbox.position.y = this.position.y + 20;
            } else if (this.attackType === 'kick') {
                this.hitbox.width = 130 * this.width/50; this.hitbox.height = 40; this.hitbox.position.y = this.position.y + 60;
            } else if (this.attackType === 'crouchKick') {
                this.hitbox.width = 140 * this.width/50; this.hitbox.height = 25; this.hitbox.position.y = this.position.y + 100;
            } else if (this.attackType === 'special') {
                this.hitbox.width = 250 * this.width/50; this.hitbox.height = 100; this.hitbox.position.y = this.position.y + 10;
            }
            
            if (this.isFacingLeft) this.hitbox.position.x = this.position.x - this.hitbox.width + this.width;
            else this.hitbox.position.x = this.position.x;
        }

        if (this.hitStunDuration > 0) {
            this.hitStunDuration -= timeScale;
            this.velocity.x = 0;
            this.switchSprite(this.isBlocking ? (this.isCrouching ? 'crouchBlock' : 'block') : (this.isCrouching ? 'crouch' : 'idle'));
        } else if (!this.isDead) {
            if (this.isAttacking) this.switchSprite(this.attackType);
            else if (this.isBlocking && this.isCrouching) this.switchSprite('crouchBlock');
            else if (this.isCrouching) this.switchSprite('crouch');
            else if (this.isBlocking) this.switchSprite('block');
            else if (this.velocity.y < 0) this.switchSprite('jump');
            else if (this.velocity.y > 0) this.switchSprite('jump'); 
            else if (this.velocity.x !== 0) this.switchSprite('walk');
            else this.switchSprite('idle');
        }

        if (!this.isDead) this.animateFrames(timeScale);
        if (this.isDead) return; 

        // Dash Attack Physics mapped directly into heavy/fast structs
        if (this.isAttacking && this.attackType === 'special' && this.archetype === 'fast' && this.isHitboxActive) {
            this.velocity.x = this.isFacingLeft ? -20 : 20; // Omni-dash
        }

        this.position.x += this.velocity.x * timeScale;
        this.position.y += this.velocity.y * timeScale;

        if (this.position.y + this.height + this.velocity.y * timeScale >= physics.groundY) {
            this.velocity.y = 0;
            this.position.y = physics.groundY - this.height;
            this.isGrounded = true;
        } else {
            this.velocity.y += physics.gravity * timeScale; 
            this.isGrounded = false;
        }

        if (this.position.x < 0) this.position.x = 0;
        else if (this.position.x + this.width > arenaWidth) this.position.x = arenaWidth - this.width;
    }

    attack(type) {
        if (this.attackCooldown || this.isDead || this.hitStunDuration > 0) return;
        if (type === 'special' && !this.isRageActive) return;
        
        if (type === 'special') {
            this.rage = 0; 
            this.mana = 0;
            this.isRageActive = false; 
        }

        this.isAttacking = true;
        this.attackType = type;
        this.attackCooldown = true;
        this.hasHit = false; 
        
        if (audio) {
            if (type === 'punch') audio.punch();
            else if (type === 'kick' || type === 'crouchKick') audio.kick();
            else if (type === 'special') audio.special();
        }

        const animLength = type === 'special' ? 450 : 180;
        const cooldownLength = type === 'special' ? 900 : 320; 

        setTimeout(() => { if (this.attackType === type) this.isAttacking = false; }, animLength); 
        setTimeout(() => { 
            this.attackCooldown = false;
            if (this.attackType === type) this.attackType = null;
        }, cooldownLength); 
    }

    handleInput(intent) {
        if (this.isDead || this.hitStunDuration > 0) {
            this.velocity.x = 0; 
            return;
        }

        if (this.isAttacking) {
            this.velocity.x = 0;
            return;
        }
        
        if (this.parryTimer > 0) this.parryTimer--;

        this.velocity.x = 0;
        
        if (intent.block && !this.isBlocking && this.position.y >= physics.groundY - this.height) {
            // Just entered block state
            this.parryTimer = this.parryWindow;
        }
        
        this.isBlocking = intent.block && this.position.y >= physics.groundY - this.height;
        this.isCrouching = intent.down;

        // Grounding physics blocking tracking vectors while defensive mapped
        if (this.isBlocking || this.isCrouching) return; 

        if (intent.left) {
            this.velocity.x = -this.speed;
            this.isFacingLeft = true;
        } else if (intent.right) {
            this.velocity.x = this.speed;
            this.isFacingLeft = false;
        }

        if (intent.jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }
}
