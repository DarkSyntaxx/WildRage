/**
 * Physics module managing robust bounding-box collisions,
 * gravity acceleration, and rigid mass Pushboxes for entities.
 */
export class Physics {
    constructor() {
        this.gravity = 0.7;
        this.groundY = 500; 
    }

    /**
     * Checks geometric intersections between dual Axis-Aligned Bounding Boxes.
     * @param {Object} rect1 Attacking Hitbox
     * @param {Object} rect2 Defending Hurtbox
     * @returns {Boolean} Intersection Status
     */
    checkCollision(rect1, rect2) {
        if(!rect1 || !rect2) return false;
        
        return (
            rect1.position.x < rect2.position.x + rect2.width &&
            rect1.position.x + rect1.width > rect2.position.x &&
            rect1.position.y < rect2.position.y + rect2.height &&
            rect1.position.y + rect1.height > rect2.position.y
        );
    }

    /**
     * Prevent solid character bodies from walking through each other
     * by resolving horizontal structural overlaps symmetrically.
     */
    resolvePushbox(p1, p2) {
        if (!p1 || !p2 || p1.isDead || p2.isDead) return;
        
        const b1 = p1.pushbox;
        const b2 = p2.pushbox;
        
        if (this.checkCollision(b1, b2)) {
            // Calculate lateral penetration depth relative to both facing axes
            const overlapX1 = (b1.position.x + b1.width) - b2.position.x;
            const overlapX2 = (b2.position.x + b2.width) - b1.position.x;
            
            // Deform minimally pushing entities away symmetrically
            if (overlapX1 < overlapX2) {
                const shift = overlapX1 / 2;
                p1.position.x -= shift;
                p2.position.x += shift;
            } else {
                const shift = overlapX2 / 2;
                p1.position.x += shift;
                p2.position.x -= shift;
            }
        }
    }
}
export const physics = new Physics();
