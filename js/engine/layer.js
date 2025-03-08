/**
 * Emoji RPG Builder - Layer Class
 * Represents a layer in the game for organizing entities
 */

export class Layer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.entities = [];
        this.visible = true;
        this.locked = false;
    }

    /**
     * Add an entity to the layer
     * @param {Entity} entity - The entity to add
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * Remove an entity from the layer
     * @param {Entity} entity - The entity to remove
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Get an entity by ID
     * @param {string} id - The entity ID
     * @returns {Entity|null} The entity or null if not found
     */
    getEntityById(id) {
        return this.entities.find(entity => entity.id === id) || null;
    }
}
