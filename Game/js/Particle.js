/**
 * Enhanced Particle system supporting typed particles:
 * spark, fire, smoke, energy, trail
 * Each type has unique physics, rendering, and decay behavior.
 */
export class Particle {
    constructor({ position, velocity, color = '#fff', radius = 4, type = 'spark' }) {
        this.position = { x: position.x, y: position.y };
        this.velocity = { x: velocity.x, y: velocity.y };
        this.color = color;
        this.radius = radius;
        this.type = type;
        this.alpha = 1;
        this.initialRadius = radius;

        // Type-specific configuration
        switch (type) {
            case 'fire':
                this.decay = 0.015;
                this.gravity = -0.15; // rises
                this.drag = 0.94;
                this.growthRate = 0.06;
                break;
            case 'smoke':
                this.decay = 0.008;
                this.gravity = -0.04;
                this.drag = 0.92;
                this.growthRate = 0.12;
                break;
            case 'energy':
                this.decay = 0.035;
                this.gravity = 0;
                this.drag = 0.88;
                this.growthRate = -0.05; // shrinks
                break;
            case 'trail':
                this.decay = 0.06;
                this.gravity = 0.08;
                this.drag = 0.9;
                this.growthRate = -0.04;
                break;
            default: // spark
                this.decay = 0.025;
                this.gravity = 0.35;
                this.drag = 0.96;
                this.growthRate = -0.05;
        }
    }

    tick(timeScale = 1) {
        this.position.x += this.velocity.x * timeScale;
        this.position.y += this.velocity.y * timeScale;
        this.velocity.x *= this.drag;
        this.velocity.y = this.velocity.y * this.drag + this.gravity * timeScale;
        this.alpha -= this.decay * timeScale;
        this.radius = Math.max(0.1, this.radius + this.growthRate * timeScale);
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);

        if (this.type === 'smoke') {
            // Smoke: soft grey circles
            const grad = ctx.createRadialGradient(
                this.position.x, this.position.y, 0,
                this.position.x, this.position.y, this.radius
            );
            grad.addColorStop(0, `rgba(180,180,180,${this.alpha * 0.6})`);
            grad.addColorStop(1, `rgba(100,100,100,0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'fire') {
            // Fire: warm gradient glow
            const grad = ctx.createRadialGradient(
                this.position.x, this.position.y, 0,
                this.position.x, this.position.y, this.radius
            );
            grad.addColorStop(0, `rgba(255,255,120,${this.alpha})`);
            grad.addColorStop(0.5, `rgba(255,90,0,${this.alpha * 0.7})`);
            grad.addColorStop(1, `rgba(255,0,0,0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'energy') {
            // Energy: glowing ring
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Spark / Trail: bright solid dot with glow
            ctx.shadowBlur = this.type === 'trail' ? 8 : 15;
            ctx.shadowColor = this.color;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
