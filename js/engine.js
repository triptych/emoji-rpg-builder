/**
 * Emoji RPG Builder - Game Engine
 * Core game engine functionality for the Emoji RPG Builder
 */

import { Layer } from './engine/layer.js';
import { Entity } from './engine/entity.js';
import {
    Behavior,
    StaticBehavior,
    PlayerBehavior,
    AIBehavior,
    CollectibleBehavior,
    ObstacleBehavior,
    TriggerBehavior
} from './engine/behaviors.js';

class GameEngine {
    constructor() {
        this.entities = [];
        this.layers = [];
        this.gameState = {
            running: false,
            paused: false,
            score: 0,
            time: 0
        };
        this.settings = {
            gravity: 0.5,
            friction: 0.1,
            gridSize: 32,
            width: 800,
            height: 600
        };
        this.collisionSystem = new CollisionSystem(this);
        this.inputSystem = new InputSystem();
        this.renderSystem = new RenderSystem();
        this.lastTimestamp = 0;
        this.animationFrameId = null;
    }

    /**
     * Initialize the game engine
     * @param {Object} config - Configuration options
     */
    init(config = {}) {
        // Apply configuration options
        this.settings = { ...this.settings, ...config };

        // Initialize systems
        this.collisionSystem.init();
        this.inputSystem.init();
        this.renderSystem.init(this.settings.width, this.settings.height);

        console.log('Game Engine initialized with settings:', this.settings);
    }

    /**
     * Load a game from JSON data
     * @param {Object} gameData - The game data in JSON format
     */
    loadGame(gameData) {
        try {
            // Reset current game state
            this.reset();

            // Load game settings
            if (gameData.settings) {
                this.settings = { ...this.settings, ...gameData.settings };
            }

            // Load layers
            if (gameData.layers && Array.isArray(gameData.layers)) {
                gameData.layers.forEach(layerData => {
                    const layer = new Layer(layerData.id, layerData.name);
                    layer.visible = layerData.visible !== undefined ? layerData.visible : true;
                    layer.locked = layerData.locked !== undefined ? layerData.locked : false;

                    // Load entities in this layer
                    if (layerData.entities && Array.isArray(layerData.entities)) {
                        layerData.entities.forEach(entityData => {
                            const entity = this.createEntity(entityData);
                            layer.addEntity(entity);
                        });
                    }

                    this.layers.push(layer);
                });
            }

            console.log('Game loaded successfully:', gameData);
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            return false;
        }
    }

    /**
     * Create a game entity from data
     * @param {Object} entityData - The entity data
     * @returns {Entity} The created entity
     */
    createEntity(entityData) {
        const entity = new Entity(
            entityData.id,
            entityData.emoji,
            entityData.x,
            entityData.y,
            entityData.width || this.settings.gridSize,
            entityData.height || this.settings.gridSize
        );

        // Apply behavior if specified
        if (entityData.behavior) {
            entity.behavior = this.createBehavior(entityData.behavior);
        }

        this.entities.push(entity);
        return entity;
    }

    /**
     * Create a behavior for an entity
     * @param {Object} behaviorData - The behavior data
     * @returns {Behavior} The created behavior
     */
    createBehavior(behaviorData) {
        switch (behaviorData.type) {
            case 'static':
                return new StaticBehavior();
            case 'player':
                return new PlayerBehavior(behaviorData.speed || 5, behaviorData.jumpHeight || 10);
            case 'ai':
                return new AIBehavior(behaviorData.pattern || 'patrol', behaviorData.speed || 2);
            case 'collectible':
                return new CollectibleBehavior(behaviorData.value || 1, behaviorData.effect || 'score');
            case 'obstacle':
                return new ObstacleBehavior(behaviorData.solid !== undefined ? behaviorData.solid : true);
            case 'trigger':
                return new TriggerBehavior(behaviorData.action || 'none');
            default:
                console.warn(`Unknown behavior type: ${behaviorData.type}, using static behavior instead`);
                return new StaticBehavior();
        }
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.gameState.running) return;

        this.gameState.running = true;
        this.gameState.paused = false;
        this.lastTimestamp = performance.now();

        // Start the game loop
        this.gameLoop(this.lastTimestamp);

        console.log('Game started');
    }

    /**
     * Pause the game
     */
    pause() {
        this.gameState.paused = true;
        console.log('Game paused');
    }

    /**
     * Resume the game
     */
    resume() {
        if (!this.gameState.running) return;

        this.gameState.paused = false;
        this.lastTimestamp = performance.now();
        console.log('Game resumed');
    }

    /**
     * Stop the game
     */
    stop() {
        this.gameState.running = false;
        this.gameState.paused = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        console.log('Game stopped');
    }

    /**
     * Reset the game state
     */
    reset() {
        this.stop();
        this.entities = [];
        this.layers = [];
        this.gameState = {
            running: false,
            paused: false,
            score: 0,
            time: 0
        };
        console.log('Game reset');
    }

    /**
     * The main game loop
     * @param {number} timestamp - The current timestamp
     */
    gameLoop(timestamp) {
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        // Update game time
        this.gameState.time += deltaTime;

        // Update game state if not paused
        if (!this.gameState.paused) {
            this.update(deltaTime);
        }

        // Render the game
        this.render();

        // Continue the game loop if running
        if (this.gameState.running) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    /**
     * Update the game state
     * @param {number} deltaTime - The time elapsed since the last update
     */
    update(deltaTime) {
        // Update all entities
        this.entities.forEach(entity => {
            if (entity.behavior) {
                entity.behavior.update(entity, this, deltaTime);
            }
        });

        // Check for collisions
        this.collisionSystem.checkCollisions();

        // Process input
        this.inputSystem.processInput(this);
    }

    /**
     * Render the game
     */
    render() {
        // Clear the canvas
        this.renderSystem.clear();

        // Render each visible layer
        this.layers.forEach(layer => {
            if (layer.visible) {
                this.renderSystem.renderLayer(layer);
            }
        });
    }

    /**
     * Export the game to JSON
     * @returns {Object} The game data in JSON format
     */
    exportGame() {
        const gameData = {
            metadata: {
                title: 'Emoji RPG Game',
                author: 'User',
                description: 'A game created with Emoji RPG Builder',
                version: '1.0'
            },
            settings: { ...this.settings },
            layers: this.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                locked: layer.locked,
                entities: layer.entities.map(entity => ({
                    id: entity.id,
                    emoji: entity.emoji,
                    x: entity.x,
                    y: entity.y,
                    width: entity.width,
                    height: entity.height,
                    behavior: entity.behavior ? entity.behavior.export() : null
                }))
            }))
        };

        return gameData;
    }
}

/**
 * Collision detection and resolution system
 */
class CollisionSystem {
    constructor(engine) {
        this.engine = engine;
    }

    /**
     * Initialize the collision system
     */
    init() {
        // Initialization code for collision system
    }

    /**
     * Check for collisions between entities
     */
    checkCollisions() {
        const entities = this.engine.entities;

        // Simple collision detection between all entities
        for (let i = 0; i < entities.length; i++) {
            const entityA = entities[i];

            // Skip entities without collision behavior
            if (!entityA.behavior || !entityA.behavior.collidable) continue;

            for (let j = i + 1; j < entities.length; j++) {
                const entityB = entities[j];

                // Skip entities without collision behavior
                if (!entityB.behavior || !entityB.behavior.collidable) continue;

                // Check for collision
                if (this.checkCollision(entityA, entityB)) {
                    // Handle collision
                    this.handleCollision(entityA, entityB);
                }
            }
        }
    }

    /**
     * Check if two entities are colliding
     * @param {Entity} entityA - The first entity
     * @param {Entity} entityB - The second entity
     * @returns {boolean} True if the entities are colliding
     */
    checkCollision(entityA, entityB) {
        // Simple AABB collision detection
        return (
            entityA.x < entityB.x + entityB.width &&
            entityA.x + entityA.width > entityB.x &&
            entityA.y < entityB.y + entityB.height &&
            entityA.y + entityA.height > entityB.y
        );
    }

    /**
     * Handle collision between two entities
     * @param {Entity} entityA - The first entity
     * @param {Entity} entityB - The second entity
     */
    handleCollision(entityA, entityB) {
        // Let the behaviors handle the collision
        if (entityA.behavior && entityA.behavior.onCollision) {
            entityA.behavior.onCollision(entityA, entityB, this.engine);
        }

        if (entityB.behavior && entityB.behavior.onCollision) {
            entityB.behavior.onCollision(entityB, entityA, this.engine);
        }
    }
}

/**
 * Input handling system
 */
class InputSystem {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = { left: false, middle: false, right: false };
        this.touches = [];
        this.touchEnabled = 'ontouchstart' in window;
    }

    /**
     * Initialize the input system
     */
    init() {
        // Set up keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Set up mouse event listeners
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Set up touch event listeners if supported
        if (this.touchEnabled) {
            window.addEventListener('touchstart', this.handleTouchStart.bind(this));
            window.addEventListener('touchmove', this.handleTouchMove.bind(this));
            window.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }
    }

    /**
     * Process input for the game engine
     * @param {GameEngine} engine - The game engine
     */
    processInput(engine) {
        // Process input for player-controlled entities
        engine.entities.forEach(entity => {
            if (entity.behavior && entity.behavior instanceof PlayerBehavior) {
                entity.behavior.processInput(entity, this, engine);
            }
        });
    }

    /**
     * Check if a key is pressed
     * @param {string} key - The key to check
     * @returns {boolean} True if the key is pressed
     */
    isKeyPressed(key) {
        return this.keys[key] === true;
    }

    /**
     * Handle keydown event
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        this.keys[event.key] = true;
    }

    /**
     * Handle keyup event
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        this.keys[event.key] = false;
    }

    /**
     * Handle mousemove event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseMove(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }

    /**
     * Handle mousedown event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseDown(event) {
        switch (event.button) {
            case 0: this.mouseButtons.left = true; break;
            case 1: this.mouseButtons.middle = true; break;
            case 2: this.mouseButtons.right = true; break;
        }
    }

    /**
     * Handle mouseup event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseUp(event) {
        switch (event.button) {
            case 0: this.mouseButtons.left = false; break;
            case 1: this.mouseButtons.middle = false; break;
            case 2: this.mouseButtons.right = false; break;
        }
    }

    /**
     * Handle touchstart event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchStart(event) {
        this.touches = Array.from(event.touches);

        // Prevent default to avoid scrolling
        event.preventDefault();
    }

    /**
     * Handle touchmove event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchMove(event) {
        this.touches = Array.from(event.touches);

        // Prevent default to avoid scrolling
        event.preventDefault();
    }

    /**
     * Handle touchend event
     * @param {TouchEvent} event - The touch event
     */
    handleTouchEnd(event) {
        this.touches = Array.from(event.touches);
    }
}

/**
 * Rendering system
 */
class RenderSystem {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.width = 800;
        this.height = 600;
    }

    /**
     * Initialize the rendering system
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     */
    init(width, height) {
        this.width = width;
        this.height = height;

        // Create canvas if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
        }

        // Set canvas dimensions
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Render a layer
     * @param {Layer} layer - The layer to render
     */
    renderLayer(layer) {
        layer.entities.forEach(entity => {
            this.renderEntity(entity);
        });
    }

    /**
     * Render an entity
     * @param {Entity} entity - The entity to render
     */
    renderEntity(entity) {
        // Render the emoji
        this.context.font = `${entity.height}px Arial`;
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(entity.emoji, entity.x + entity.width / 2, entity.y + entity.height / 2);

        // Render selection outline if selected
        if (entity.selected) {
            this.context.strokeStyle = '#4a6baf';
            this.context.lineWidth = 2;
            this.context.strokeRect(entity.x, entity.y, entity.width, entity.height);
        }
    }

    /**
     * Attach the canvas to a container element
     * @param {HTMLElement} container - The container element
     */
    attachTo(container) {
        if (container && this.canvas) {
            container.appendChild(this.canvas);
        }
    }
}

/**
 * Export the GameEngine class
 */
export { GameEngine };
