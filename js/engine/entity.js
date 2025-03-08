/**
 * Emoji RPG Builder - Entity Class
 * Represents a game entity with position, size, and behavior
 */

export class Entity {
    constructor(id, emoji, x, y, width, height) {
        this.id = id;
        this.emoji = emoji;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.behavior = null;
        this.selected = false;
    }

    /**
     * Move the entity
     * @param {number} dx - The x distance to move
     * @param {number} dy - The y distance to move
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    /**
     * Set the entity's position
     * @param {number} x - The x position
     * @param {number} y - The y position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set the entity's velocity
     * @param {number} vx - The x velocity
     * @param {number} vy - The y velocity
     */
    setVelocity(vx, vy) {
        this.velocityX = vx;
        this.velocityY = vy;
    }
}
