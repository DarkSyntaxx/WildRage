/**
 * Programmable Asset Generator that synthesizes game sprites dynamically rendering Context rects 
 * into base64 URLs. Eliminates dependency on external file networking and loading states.
 */
export const AssetGenerator = {
    /**
     * Instantiates an entire library of unique sprite sheets for a combatant.
     * @param {String} color Primary hex color styling for the synthesized entity
     * @param {String} archetype Defines physical geometry (fast, balanced, heavy)
     * @param {String} skinId Identifier for the alternate color palette (default, neon, shadow, gold)
     * @returns {Object} Mapped sprite-sheet properties
     */
    generate(color, archetype = 'balanced', skinId = 'default') {
        return {
            idle: { src: this.createSheet(color, 'idle', 4, archetype, skinId), framesMax: 4 },
            walk: { src: this.createSheet(color, 'walk', 4, archetype, skinId), framesMax: 4 },
            jump: { src: this.createSheet(color, 'jump', 2, archetype, skinId), framesMax: 2 },
            punch: { src: this.createSheet(color, 'punch', 3, archetype, skinId), framesMax: 3 },
            kick: { src: this.createSheet(color, 'kick', 3, archetype, skinId), framesMax: 3 },
            block: { src: this.createSheet(color, 'block', 2, archetype, skinId), framesMax: 2 },
            special: { src: this.createSheet(color, 'special', 4, archetype, skinId), framesMax: 4 },
            crouch: { src: this.createSheet(color, 'crouch', 1, archetype, skinId), framesMax: 1 },
            crouchBlock: { src: this.createSheet(color, 'crouchBlock', 1, archetype, skinId), framesMax: 1 },
            crouchKick: { src: this.createSheet(color, 'crouchKick', 3, archetype, skinId), framesMax: 3 }
        };
    },

    createSheet(color, act, frames, archetype, skinId = 'default') {
        const canvas = document.createElement('canvas');
        const frameW = 120;
        const frameH = 150;
        canvas.width = frames * frameW;
        canvas.height = frameH;
        const ctx = canvas.getContext('2d');
        
        // Archetype Dynamic Scaling Matrix
        let bW = 20; // Torso Width
        let hW = 30; // Head Scale
        let bOff = 5; // Torso Offset

        if (archetype === 'heavy') {
            bW = 34; hW = 36; bOff = -2;
        } else if (archetype === 'fast') {
            bW = 14; hW = 26; bOff = 6;
        }
        
        // Apply Skin Palette Overrides
        let pColor = color;
        let sColor = '#3498db'; // Special aura
        let aColor1 = '#f39c12'; // Punch fx
        let aColor2 = '#8e44ad'; // Kick fx
        
        if (skinId === 'neon') { pColor = '#00ffcc'; sColor = '#ff00ff'; aColor1 = '#ffff00'; aColor2 = '#00ffff'; }
        if (skinId === 'shadow') { pColor = '#2d3436'; sColor = '#eb4d4b'; aColor1 = '#636e72'; aColor2 = '#833471'; }
        if (skinId === 'gold') { pColor = '#f1c40f'; sColor = '#e67e22'; aColor1 = '#fff'; aColor2 = '#d35400'; }

        for (let i = 0; i < frames; i++) {
            ctx.save();
            ctx.translate(i * frameW, 0);
            
            ctx.fillStyle = pColor;
            ctx.imageSmoothingEnabled = false;

            let headY = 20;
            const headX = 40;
            
            // Standard oscillation logic defining breathing and stepping sequences
            if (act === 'idle') headY += (i % 2 === 0 ? 0 : 5);
            if (act === 'walk') headY += (i % 2 === 0 ? 0 : 5);
            if (act === 'jump') headY -= 10;
            
            // Crouch height compression maps directly to smaller Hurtboxes
            if (act === 'crouch' || act === 'crouchBlock' || act === 'crouchKick') {
                headY += 35; 
            }
            
            // Cinematic aura styling
            if (act === 'special') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(headX - 25, headY - 25, 80, 150);
                ctx.fillStyle = pColor; 
            }
            
            // Static Body components (Compressed torso on crouch states)
            ctx.fillRect(headX, headY, hW, hW); // Head Node
            
            if (act === 'crouch' || act === 'crouchBlock' || act === 'crouchKick') {
                ctx.fillRect(headX + bOff, headY + hW, bW, 25); 
            } else {
                ctx.fillRect(headX + bOff, headY + hW, bW, 50); 
            }
            
            // Dynamic upper limb matrices mapping
            if (act === 'punch' && i === 1) {
                ctx.fillStyle = aColor1;
                ctx.fillRect(headX + 25, headY + hW + 5, 50, 15);
            } else if (act === 'block' || act === 'crouchBlock') {
                ctx.fillStyle = pColor;
                ctx.fillRect(headX + 25, headY + hW + 5, 12, 35); // Guard Position Right
                ctx.fillRect(headX + 15, headY + hW + 5, 12, 35); // Guard Position Left
            } else if (act === 'special') {
                ctx.fillStyle = sColor; 
                if (i > 1) { ctx.fillRect(headX + 40, headY, 120, 100); } 
                else { ctx.fillRect(headX + 10, headY + 20, 40, 40); } 
            } else {
                ctx.fillStyle = pColor;
                ctx.fillRect(headX + 10, headY + hW + 5, 10, 40);
            }
            
            // Dynamic lower limb matrices
            if (act === 'kick' && i === 1) {
                ctx.fillStyle = aColor2;
                ctx.fillRect(headX + 15, headY + hW + 40, 60, 15);
            } else if (act === 'crouchKick' && i === 1) {
                ctx.fillStyle = aColor2;
                ctx.fillRect(headX + 15, headY + hW + 25, 65, 12); 
            } else if (act === 'walk') {
               const offset = i % 2 === 0 ? 10 : -10;
               ctx.fillRect(headX + 10 + offset, headY + hW + 50, 10, 40);
            } else if (act === 'crouch' || act === 'crouchBlock' || act === 'crouchKick') {
               ctx.fillRect(headX + 5, headY + hW + 25, 10, 25); // short legs folded
               ctx.fillRect(headX + 15, headY + hW + 25, 10, 25);
            } else {
                ctx.fillRect(headX + 5, headY + hW + 50, 10, 40);
                ctx.fillRect(headX + 15, headY + hW + 50, 10, 40);
            }
            
            // Optical receptors (Eyes)
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(headX + hW * 0.6, headY + 5, 8, 8);
            ctx.fillStyle = 'black';
            ctx.fillRect(headX + hW * 0.7, headY + 8, 4, 4);
            
            ctx.restore();
        }
        
        return canvas.toDataURL('image/png');
    }
};
