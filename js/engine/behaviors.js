/**
 * Emoji RPG Builder - Behavior Classes
 * Defines different behaviors for game entities
 */

/**
 * Base behavior class
 */
export class Behavior {
    constructor(type) {
        this.type = type;
        this.collidable = false;
    }

    /**
     * Update the entity
     * @param {Entity} entity - The entity to update
     * @param {GameEngine} engine - The game engine
     * @param {number} deltaTime - The time elapsed since the last update
     */
    update(entity, engine, deltaTime) {
        // Base update method, to be overridden by subclasses
    }

    /**
     * Handle collision with another entity
     * @param {Entity} entity - This entity
     * @param {Entity} otherEntity - The other entity
     * @param {GameEngine} engine - The game engine
     */
    onCollision(entity, otherEntity, engine) {
        // Base collision method, to be overridden by subclasses
    }

    /**
     * Export behavior data
     * @returns {Object} The behavior data
     */
    export() {
        return {
            type: this.type
        };
    }
}

/**
 * Static behavior (non-moving objects)
 */
export class StaticBehavior extends Behavior {
    constructor() {
        super('static');
        this.collidable = true;
    }
}

/**
 * Player-controlled behavior
 */
export class PlayerBehavior extends Behavior {
    constructor(speed = 5, jumpHeight = 10) {
        super('player');
        this.speed = speed;
        this.jumpHeight = jumpHeight;
        this.jumping = false;
        this.collidable = true;
    }

    /**
     * Process input for the player
     * @param {Entity} entity - The player entity
     * @param {InputSystem} inputSystem - The input system
     * @param {GameEngine} engine - The game engine
     */
    processInput(entity, inputSystem, engine) {
        // Horizontal movement
        let moveX = 0;
        if (inputSystem.isKeyPressed('ArrowLeft') || inputSystem.isKeyPressed('a')) {
            moveX -= this.speed;
        }
        if (inputSystem.isKeyPressed('ArrowRight') || inputSystem.isKeyPressed('d')) {
            moveX += this.speed;
        }

        // Vertical movement
        let moveY = 0;
        if (inputSystem.isKeyPressed('ArrowUp') || inputSystem.isKeyPressed('w')) {
            moveY -= this.speed;
        }
        if (inputSystem.isKeyPressed('ArrowDown') || inputSystem.isKeyPressed('s')) {
            moveY += this.speed;
        }

        // Apply movement
        entity.move(moveX, moveY);

        // Keep player within bounds
        if (entity.x < 0) entity.x = 0;
        if (entity.y < 0) entity.y = 0;
        if (entity.x + entity.width > engine.settings.width) {
            entity.x = engine.settings.width - entity.width;
        }
        if (entity.y + entity.height > engine.settings.height) {
            entity.y = engine.settings.height - entity.height;
        }
    }

    /**
     * Update the player entity
     * @param {Entity} entity - The player entity
     * @param {GameEngine} engine - The game engine
     * @param {number} deltaTime - The time elapsed since the last update
     */
    update(entity, engine, deltaTime) {
        // Apply gravity if jumping
        if (this.jumping) {
            entity.velocityY += engine.settings.gravity;
            entity.y += entity.velocityY;

            // Check if landed
            if (entity.y + entity.height >= engine.settings.height) {
                entity.y = engine.settings.height - entity.height;
                entity.velocityY = 0;
                this.jumping = false;
            }
        }
    }

    /**
     * Handle collision with another entity
     * @param {Entity} entity - This entity
     * @param {Entity} otherEntity - The other entity
     * @param {GameEngine} engine - The game engine
     */
    onCollision(entity, otherEntity, engine) {
        // Handle collision based on the other entity's behavior
        if (otherEntity.behavior) {
            if (otherEntity.behavior instanceof ObstacleBehavior && otherEntity.behavior.solid) {
                // Simple collision resolution with solid obstacles
                // This is a very basic implementation and could be improved

                // Calculate overlap
                const overlapX = Math.min(
                    entity.x + entity.width - otherEntity.x,
                    otherEntity.x + otherEntity.width - entity.x
                );
                const overlapY = Math.min(
                    entity.y + entity.height - otherEntity.y,
                    otherEntity.y + otherEntity.height - entity.y
                );

                // Resolve collision by moving in the direction of least overlap
                if (overlapX < overlapY) {
                    if (entity.x < otherEntity.x) {
                        entity.x = otherEntity.x - entity.width;
                    } else {
                        entity.x = otherEntity.x + otherEntity.width;
                    }
                } else {
                    if (entity.y < otherEntity.y) {
                        entity.y = otherEntity.y - entity.height;
                        entity.velocityY = 0;
                        this.jumping = false;
                    } else {
                        entity.y = otherEntity.y + otherEntity.height;
                        entity.velocityY = 0;
                    }
                }
            }
        }
    }

    /**
     * Export behavior data
     * @returns {Object} The behavior data
     */
    export() {
        return {
            ...super.export(),
            speed: this.speed,
            jumpHeight: this.jumpHeight
        };
    }
}

/**
 * AI-controlled behavior
 */
export class AIBehavior extends Behavior {
    constructor(pattern = 'patrol', speed = 2) {
        super('ai');
        this.pattern = pattern;
        this.speed = speed;
        this.direction = 1;
        this.timer = 0;
        this.collidable = true;
    }

    /**
     * Update the AI entity
     * @param {Entity} entity - The AI entity
     * @param {GameEngine} engine - The game engine
     * @param {number} deltaTime - The time elapsed since the last update
     */
    update(entity, engine, deltaTime) {
        this.timer += deltaTime;

        switch (this.pattern) {
            case 'patrol':
                // Simple left-right patrol
                entity.x += this.speed * this.direction;

                // Change direction at edges
                if (entity.x <= 0 || entity.x + entity.width >= engine.settings.width) {
                    this.direction *= -1;
                }
                break;

            case 'circle':
                // Move in a circular pattern
                const radius = 50;
                const centerX = entity.x;
                const centerY = entity.y;
                const angle = this.timer * this.speed;

                entity.x = centerX + Math.cos(angle) * radius;
                entity.y = centerY + Math.sin(angle) * radius;
                break;

            case 'random':
                // Change direction randomly
                if (Math.random() < 0.02) {
                    this.direction = Math.random() * 2 * Math.PI;
                }

                // Move in the current direction
                entity.x += Math.cos(this.direction) * this.speed;
                entity.y += Math.sin(this.direction) * this.speed;

                // Bounce off edges
                if (entity.x <= 0 || entity.x + entity.width >= engine.settings.width) {
                    this.direction = Math.PI - this.direction;
                }
                if (entity.y <= 0 || entity.y + entity.height >= engine.settings.height) {
                    this.direction = -this.direction;
                }
                break;
        }
    }

    /**
     * Export behavior data
     * @returns {Object} The behavior data
     */
    export() {
        return {
            ...super.export(),
            pattern: this.pattern,
            speed: this.speed
        };
    }
}

/**
 * Collectible behavior
 */
export class CollectibleBehavior extends Behavior {
    constructor(value = 1, effect = 'score') {
        super('collectible');
        this.value = value;
        this.effect = effect;
        this.collidable = true;
    }

    /**
     * Handle collision with another entity
     * @param {Entity} entity - This entity
     * @param {Entity} otherEntity - The other entity
     * @param {GameEngine} engine - The game engine
     */
    onCollision(entity, otherEntity, engine) {
        // Only interact with player entities
        if (otherEntity.behavior instanceof PlayerBehavior) {
            // Apply effect based on type
            switch (this.effect) {
                case 'score':
                    engine.gameState.score += this.value;
                    break;

                case 'health':
                    // If player has health property, increase it
                    if (otherEntity.health !== undefined) {
                        otherEntity.health += this.value;
                    }
                    break;

                case 'speed':
                    // If player has speed property, increase it
                    if (otherEntity.behavior.speed !== undefined) {
                        otherEntity.behavior.speed += this.value;
                    }
                    break;
            }

            // Remove the collectible
            const layer = engine.layers.find(layer =>
                layer.entities.includes(entity)
            );
            if (layer) {
                layer.removeEntity(entity);
            }

            // Remove from engine entities list
            const index = engine.entities.indexOf(entity);
            if (index !== -1) {
                engine.entities.splice(index, 1);
            }
        }
    }

    /**
     * Export behavior data
     * @returns {Object} The behavior data
     */
    export() {
        return {
            ...super.export(),
            value: this.value,
            effect: this.effect
        };
    }
}

/**
 * Obstacle behavior
 */
export class ObstacleBehavior extends Behavior {
    constructor(solid = true) {
        super('obstacle');
        this.solid = solid;
        this.collidable = true;
    }

    /**
     * Export behavior data
     * @returns {Object} The behavior data
     */
    export() {
        return {
            ...super.export(),
            solid: this.solid
        };
    }
}

/**
 * Trigger behavior
 */
export class TriggerBehavior extends Behavior {
    constructor(action = 'none') {
        super('trigger');
        this.action = action;
        this.triggered = false;
        this.collidable = true;
    }

    /**
     * Handle collision with another entity
     * @param {Entity} entity - This entity
     * @param {Entity} otherEntity - The other entity
     * @param {GameEngine} engine - The game engine
     */
    onCollision(entity, otherEntity, engine) {
        // Only trigger once and only with player entities
        if (!this.triggered && otherEntity.behavior instanceof PlayerBehavior) {
            this.triggered = true;

            // Perform action based on type
            switch (this.action) {
                case 'win':
                    // Trigger win condition
                    console.log('Win condition triggered!');
                    engine.gameState.running = false;
                    // Dispatch a custom event that can be listened for
                    window.dispatchEvent(new CustomEvent('game:win'));
                    break;

                case 'lose':
                    // Trigger lose condition
                    console.log('Lose condition triggered!');
                    engine.gameState.running = false;
                    // Dispatch a custom event that can be listened for
                    window.dispatchEvent(new CustomEvent('game:lose'));
                    break;

                case 'nextLevel':
                    // Trigger next level
                    console.log('Next level triggered!');
                    // Dispatch a custom event that can be listened for
                    window.dispatchEvent(new CustomEvent('game:nextLevel'));
                    break;

                case 'teleport':
                    // Teleport the player to a specific location
                    // This would require additional properties like targetX and targetY
                    if (entity.targetX !== undefined && entity.targetY !== undefined) {
                        otherEntity.setPosition(entity.targetX, entity.targetY);
                    }
                    break;

                default:
                    console.log(`Trigger action '${this.action}' activated`);
                    // Dispatch a custom event with the action name
                    window.dispatchEvent(new CustomEvent('game:trigger', {
                        detail: { action: this.action }
                    }));
                    break;
            }
        }
    }

    /**
     * Export behavior data
     * @returns {Object} The behavior data
     */
    export() {
        return {
            ...super.export(),
            action: this.action
        };
    }
}
