/**
 * Sprite module driving Base64 Image parsing, Fractional Frame Rate scaling,
 * scaling offsets, and rendering inversion schemas.
 */
export class Sprite {
    constructor({ position, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 } }) {
        this.position = position;
        
        // Native off-DOM rendering optimization
        this.image = new Image();
        if (imageSrc) this.image.src = imageSrc;
        
        this.scale = scale;
        this.framesMax = framesMax;
        
        // Loop trackers
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 8; // Governs raw animation tick-speed
        this.offset = offset;
        
        // Horizontal orientation
        this.isFacingLeft = false;
    }

    /**
     * Paints localized Sprite buffer mapping into Canvas viewport
     */
    draw(ctx) {
        // Prevent drawing null buffers
        if (!this.image.src || !this.image.complete) return;
        
        const frameW = this.image.width / this.framesMax;
        const frameH = this.image.height;
        
        ctx.save();
        
        // Horizontal Canvas Manipulation for Mirrored Combat
        if (this.isFacingLeft) {
            ctx.translate(this.position.x + 25, 0); 
            ctx.scale(-1, 1);
            ctx.translate(-(this.position.x + 25), 0);
        }

        // Guarantees pristine crispy pixel scaling regardless of browser aliasing constraints
        ctx.imageSmoothingEnabled = false; 
        
        ctx.drawImage(
            this.image,
            this.framesCurrent * frameW,
            0,
            frameW,
            frameH,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            frameW * this.scale,
            frameH * this.scale
        );
        
        ctx.restore();
    }

    /**
     * Fractional Loop aggregator managing smooth animations beneath Slow-Mo mechanics.
     */
    animateFrames(timeScale = 1) {
        this.framesElapsed += timeScale; 
        if (this.framesElapsed >= this.framesHold) {
            this.framesElapsed -= this.framesHold;
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                this.framesCurrent = 0; // Wrap condition
            }
        }
    }
}
