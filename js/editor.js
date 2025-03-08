/**
 * Emoji RPG Builder - Editor
 * Handles the game editor functionality
 */

import { GameEngine } from './engine.js';
import { Layer } from './engine/layer.js';
import emojiData from './emoji-data.js';
import storageSystem from './storage.js';

class Editor {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentLayerId = null;
        this.selectedEntity = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.gridSize = 32;
        this.snapToGrid = true;
        this.showGrid = true;
        this.zoomLevel = 1;
        this.currentEmojiCategory = 'all';
        this.emojiSearchTerm = '';
        this.editorMode = 'place'; // 'place', 'select', 'delete'
    }

    /**
     * Initialize the editor
     */
    init() {
        // Initialize the editor canvas
        this.initCanvas();

        // Initialize the emoji palette
        this.initEmojiPalette();

        // Initialize the layers panel
        this.initLayersPanel();

        // Initialize the properties panel
        this.initPropertiesPanel();

        // Initialize the editor controls
        this.initEditorControls();

        // Create default layers if none exist
        if (this.gameEngine.layers.length === 0) {
            this.createDefaultLayers();
        }

        // Select the first layer
        if (this.gameEngine.layers.length > 0) {
            this.selectLayer(this.gameEngine.layers[0].id);
        }

        console.log('Editor initialized');
    }

    /**
     * Initialize the editor canvas
     */
    initCanvas() {
        // Get the canvas container
        this.canvasContainer = document.getElementById('editorCanvas');
        if (!this.canvasContainer) {
            console.error('Editor canvas container not found');
            return;
        }

        // Attach the game engine's canvas to the container
        this.gameEngine.renderSystem.attachTo(this.canvasContainer);

        // Add event listeners for canvas interaction
        this.addCanvasEventListeners();

        // Draw the grid
        this.drawGrid();
    }

    /**
     * Add event listeners to the canvas
     */
    addCanvasEventListeners() {
        const canvas = this.gameEngine.renderSystem.canvas;

        // Mouse down event
        canvas.addEventListener('mousedown', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / this.zoomLevel;
            const y = (event.clientY - rect.top) / this.zoomLevel;

            this.handleCanvasMouseDown(x, y);
        });

        // Mouse move event
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / this.zoomLevel;
            const y = (event.clientY - rect.top) / this.zoomLevel;

            this.handleCanvasMouseMove(x, y);
        });

        // Mouse up event
        canvas.addEventListener('mouseup', () => {
            this.handleCanvasMouseUp();
        });

        // Mouse leave event
        canvas.addEventListener('mouseleave', () => {
            this.handleCanvasMouseUp();
        });

        // Touch events for mobile support
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                const touch = event.touches[0];
                const x = (touch.clientX - rect.left) / this.zoomLevel;
                const y = (touch.clientY - rect.top) / this.zoomLevel;

                this.handleCanvasMouseDown(x, y);
            }
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (event.touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                const touch = event.touches[0];
                const x = (touch.clientX - rect.left) / this.zoomLevel;
                const y = (touch.clientY - rect.top) / this.zoomLevel;

                this.handleCanvasMouseMove(x, y);
            }
        });

        canvas.addEventListener('touchend', () => {
            this.handleCanvasMouseUp();
        });

        canvas.addEventListener('touchcancel', () => {
            this.handleCanvasMouseUp();
        });
    }

    /**
     * Handle mouse down on the canvas
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     */
    handleCanvasMouseDown(x, y) {
        // Check if we have a current layer
        if (!this.currentLayerId) return;

        // Get the current layer
        const currentLayer = this.gameEngine.layers.find(layer => layer.id === this.currentLayerId);
        if (!currentLayer || currentLayer.locked) return;

        // Check if we're in place mode
        if (this.editorMode === 'place' && this.currentEmoji) {
            // Place a new entity
            const entityId = 'entity_' + Date.now();
            const gridX = this.snapToGrid ? Math.floor(x / this.gridSize) * this.gridSize : x;
            const gridY = this.snapToGrid ? Math.floor(y / this.gridSize) * this.gridSize : y;

            const entity = this.gameEngine.createEntity({
                id: entityId,
                emoji: this.currentEmoji,
                x: gridX,
                y: gridY,
                width: this.gridSize,
                height: this.gridSize,
                behavior: { type: 'static' }
            });

            currentLayer.addEntity(entity);

            // Select the new entity
            this.selectEntity(entity);

            // Render the game
            this.gameEngine.render();

            return;
        }

        // Check if we're in select or delete mode
        if (this.editorMode === 'select' || this.editorMode === 'delete') {
            // Find the entity under the cursor
            const entity = this.findEntityAt(x, y);

            if (entity) {
                if (this.editorMode === 'select') {
                    // Select the entity
                    this.selectEntity(entity);

                    // Start dragging
                    this.isDragging = true;
                    this.dragStartX = x;
                    this.dragStartY = y;
                    this.dragOffsetX = x - entity.x;
                    this.dragOffsetY = y - entity.y;
                } else if (this.editorMode === 'delete') {
                    // Delete the entity
                    this.deleteEntity(entity);
                }
            } else {
                // Deselect if clicking on empty space
                this.deselectEntity();
            }

            // Render the game
            this.gameEngine.render();
        }
    }

    /**
     * Handle mouse move on the canvas
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     */
    handleCanvasMouseMove(x, y) {
        // Check if we're dragging an entity
        if (this.isDragging && this.selectedEntity) {
            // Calculate new position
            let newX = x - this.dragOffsetX;
            let newY = y - this.dragOffsetY;

            // Snap to grid if enabled
            if (this.snapToGrid) {
                newX = Math.floor(newX / this.gridSize) * this.gridSize;
                newY = Math.floor(newY / this.gridSize) * this.gridSize;
            }

            // Update entity position
            this.selectedEntity.x = newX;
            this.selectedEntity.y = newY;

            // Render the game
            this.gameEngine.render();
        }
    }

    /**
     * Handle mouse up on the canvas
     */
    handleCanvasMouseUp() {
        // Stop dragging
        this.isDragging = false;
    }

    /**
     * Find an entity at the given coordinates
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {Entity|null} The entity at the coordinates or null if none found
     */
    findEntityAt(x, y) {
        // Check each layer in reverse order (top to bottom)
        for (let i = this.gameEngine.layers.length - 1; i >= 0; i--) {
            const layer = this.gameEngine.layers[i];

            // Skip invisible layers
            if (!layer.visible) continue;

            // Check each entity in the layer
            for (let j = layer.entities.length - 1; j >= 0; j--) {
                const entity = layer.entities[j];

                // Check if the coordinates are within the entity bounds
                if (
                    x >= entity.x &&
                    x <= entity.x + entity.width &&
                    y >= entity.y &&
                    y <= entity.y + entity.height
                ) {
                    return entity;
                }
            }
        }

        return null;
    }

    /**
     * Draw the grid on the canvas
     */
    drawGrid() {
        if (!this.showGrid) return;

        const canvas = this.gameEngine.renderSystem.canvas;
        const context = this.gameEngine.renderSystem.context;
        const width = canvas.width;
        const height = canvas.height;

        context.save();
        context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        context.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= width; x += this.gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += this.gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        context.restore();
    }

    /**
     * Initialize the emoji palette
     */
    initEmojiPalette() {
        // Get the emoji palette container
        this.emojiPalette = document.getElementById('emojiPalette');
        if (!this.emojiPalette) {
            console.error('Emoji palette container not found');
            return;
        }

        // Get the emoji search input
        this.emojiSearch = document.getElementById('emojiSearch');
        if (this.emojiSearch) {
            this.emojiSearch.addEventListener('input', () => {
                this.emojiSearchTerm = this.emojiSearch.value.toLowerCase();
                this.updateEmojiPalette();
            });
        }

        // Get the emoji category buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                categoryButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                // Update current category
                this.currentEmojiCategory = button.dataset.category;

                // Update the emoji palette
                this.updateEmojiPalette();
            });
        });

        // Initial update of the emoji palette
        this.updateEmojiPalette();
    }

    /**
     * Update the emoji palette based on the current category and search term
     */
    updateEmojiPalette() {
        // Clear the emoji palette
        this.emojiPalette.innerHTML = '';

        // Get the emojis to display
        let emojisToDisplay = [];

        if (this.currentEmojiCategory === 'all') {
            // Get all emojis from all categories
            Object.values(emojiData.categories).forEach(category => {
                emojisToDisplay = emojisToDisplay.concat(category.emojis);
            });
        } else {
            // Get emojis from the selected category
            const category = emojiData.categories[this.currentEmojiCategory];
            if (category) {
                emojisToDisplay = category.emojis;
            }
        }

        // Filter by search term if provided
        if (this.emojiSearchTerm) {
            emojisToDisplay = emojisToDisplay.filter(emoji =>
                emoji.name.toLowerCase().includes(this.emojiSearchTerm)
            );
        }

        // Add emojis to the palette
        emojisToDisplay.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'emoji-item';
            emojiElement.textContent = emoji.emoji;
            emojiElement.title = emoji.name;

            // Add click event to select the emoji
            emojiElement.addEventListener('click', () => {
                this.selectEmoji(emoji.emoji);
            });

            // Add drag event for mobile
            emojiElement.setAttribute('draggable', 'true');
            emojiElement.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', emoji.emoji);
                this.selectEmoji(emoji.emoji);
            });

            this.emojiPalette.appendChild(emojiElement);
        });
    }

    /**
     * Select an emoji from the palette
     * @param {string} emoji - The emoji to select
     */
    selectEmoji(emoji) {
        this.currentEmoji = emoji;
        this.editorMode = 'place';

        // Update UI to show the selected emoji
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => btn.classList.remove('active'));

        const placeButton = document.querySelector('.mode-btn[data-mode="place"]');
        if (placeButton) {
            placeButton.classList.add('active');
        }

        console.log(`Selected emoji: ${emoji}`);
    }

    /**
     * Initialize the layers panel
     */
    initLayersPanel() {
        // Get the layers list container
        this.layersList = document.getElementById('layersList');
        if (!this.layersList) {
            console.error('Layers list container not found');
            return;
        }

        // Get the add layer button
        const addLayerBtn = document.getElementById('addLayerBtn');
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', () => {
                this.addNewLayer();
            });
        }

        // Get the delete layer button
        const deleteLayerBtn = document.getElementById('deleteLayerBtn');
        if (deleteLayerBtn) {
            deleteLayerBtn.addEventListener('click', () => {
                this.deleteCurrentLayer();
            });
        }

        // Update the layers list
        this.updateLayersList();
    }

    /**
     * Update the layers list in the UI
     */
    updateLayersList() {
        // Clear the layers list
        this.layersList.innerHTML = '';

        // Add each layer to the list
        this.gameEngine.layers.forEach(layer => {
            const layerItem = document.createElement('li');
            layerItem.className = 'layer-item';
            layerItem.dataset.layerId = layer.id;

            if (layer.id === this.currentLayerId) {
                layerItem.classList.add('active');
            }

            // Create visibility toggle
            const visibilitySpan = document.createElement('span');
            visibilitySpan.className = 'layer-visibility';
            const visibilityIcon = document.createElement('i');
            visibilityIcon.className = layer.visible ? 'fas fa-eye' : 'fas fa-eye-slash';
            visibilitySpan.appendChild(visibilityIcon);

            // Add click event to toggle visibility
            visibilitySpan.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleLayerVisibility(layer.id);
            });

            // Create layer name
            const nameSpan = document.createElement('span');
            nameSpan.className = 'layer-name';
            nameSpan.textContent = layer.name;

            // Create drag handle
            const dragHandleSpan = document.createElement('span');
            dragHandleSpan.className = 'layer-drag-handle';
            const dragIcon = document.createElement('i');
            dragIcon.className = 'fas fa-grip-lines';
            dragHandleSpan.appendChild(dragIcon);

            // Add elements to layer item
            layerItem.appendChild(visibilitySpan);
            layerItem.appendChild(nameSpan);
            layerItem.appendChild(dragHandleSpan);

            // Add click event to select the layer
            layerItem.addEventListener('click', () => {
                this.selectLayer(layer.id);
            });

            // Add drag and drop functionality for reordering
            layerItem.setAttribute('draggable', 'true');

            layerItem.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', layer.id);
                layerItem.classList.add('dragging');
            });

            layerItem.addEventListener('dragend', () => {
                layerItem.classList.remove('dragging');
            });

            layerItem.addEventListener('dragover', (event) => {
                event.preventDefault();
                layerItem.classList.add('drag-over');
            });

            layerItem.addEventListener('dragleave', () => {
                layerItem.classList.remove('drag-over');
            });

            layerItem.addEventListener('drop', (event) => {
                event.preventDefault();
                layerItem.classList.remove('drag-over');

                const draggedLayerId = event.dataTransfer.getData('text/plain');
                this.reorderLayers(draggedLayerId, layer.id);
            });

            this.layersList.appendChild(layerItem);
        });
    }

    /**
     * Select a layer
     * @param {string} layerId - The ID of the layer to select
     */
    selectLayer(layerId) {
        // Update current layer ID
        this.currentLayerId = layerId;

        // Deselect any selected entity
        this.deselectEntity();

        // Update the layers list
        this.updateLayersList();

        console.log(`Selected layer: ${layerId}`);
    }

    /**
     * Toggle the visibility of a layer
     * @param {string} layerId - The ID of the layer to toggle
     */
    toggleLayerVisibility(layerId) {
        const layer = this.gameEngine.layers.find(layer => layer.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;

            // Update the layers list
            this.updateLayersList();

            // Render the game
            this.gameEngine.render();

            console.log(`Toggled visibility of layer: ${layerId}`);
        }
    }

    /**
     * Reorder layers by dragging
     * @param {string} draggedLayerId - The ID of the dragged layer
     * @param {string} targetLayerId - The ID of the target layer
     */
    reorderLayers(draggedLayerId, targetLayerId) {
        if (draggedLayerId === targetLayerId) return;

        // Find the indices of the dragged and target layers
        const draggedIndex = this.gameEngine.layers.findIndex(layer => layer.id === draggedLayerId);
        const targetIndex = this.gameEngine.layers.findIndex(layer => layer.id === targetLayerId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove the dragged layer
        const [draggedLayer] = this.gameEngine.layers.splice(draggedIndex, 1);

        // Insert it at the target position
        this.gameEngine.layers.splice(targetIndex, 0, draggedLayer);

        // Update the layers list
        this.updateLayersList();

        // Render the game
        this.gameEngine.render();

        console.log(`Reordered layers: ${draggedLayerId} -> ${targetLayerId}`);
    }

    /**
     * Add a new layer
     */
    addNewLayer() {
        // Generate a unique ID
        const layerId = 'layer_' + Date.now();

        // Create a new layer
        const layer = new Layer(layerId, `Layer ${this.gameEngine.layers.length + 1}`);

        // Add the layer to the game engine
        this.gameEngine.layers.push(layer);

        // Select the new layer
        this.selectLayer(layerId);

        // Update the layers list
        this.updateLayersList();

        console.log(`Added new layer: ${layerId}`);
    }

    /**
     * Delete the current layer
     */
    deleteCurrentLayer() {
        if (!this.currentLayerId) return;

        // Don't delete if it's the only layer
        if (this.gameEngine.layers.length <= 1) {
            console.warn('Cannot delete the only layer');
            return;
        }

        // Find the index of the current layer
        const layerIndex = this.gameEngine.layers.findIndex(layer => layer.id === this.currentLayerId);

        if (layerIndex === -1) return;

        // Remove the layer
        this.gameEngine.layers.splice(layerIndex, 1);

        // Select another layer
        const newIndex = Math.min(layerIndex, this.gameEngine.layers.length - 1);
        this.selectLayer(this.gameEngine.layers[newIndex].id);

        // Update the layers list
        this.updateLayersList();

        // Render the game
        this.gameEngine.render();

        console.log(`Deleted layer: ${this.currentLayerId}`);
    }

    /**
     * Create default layers if none exist
     */
    createDefaultLayers() {
        // Create a background layer
        const backgroundLayer = new Layer('layer_background', 'Background');
        this.gameEngine.layers.push(backgroundLayer);

        // Create a gameplay layer
        const gameplayLayer = new Layer('layer_gameplay', 'Gameplay');
        this.gameEngine.layers.push(gameplayLayer);

        console.log('Created default layers');
    }

    /**
     * Initialize the properties panel
     */
    initPropertiesPanel() {
        // Get the properties panel container
        this.propertiesPanel = document.getElementById('propertiesPanel');
        if (!this.propertiesPanel) {
            console.error('Properties panel container not found');
            return;
        }

        // Update the properties panel
        this.updatePropertiesPanel();
    }

    /**
     * Update the properties panel based on the selected entity
     */
    updatePropertiesPanel() {
        // Clear the properties panel
        this.propertiesPanel.innerHTML = '';

        // If no entity is selected, show a message
        if (!this.selectedEntity) {
            const message = document.createElement('div');
            message.className = 'no-selection-message';
            message.textContent = 'Select an emoji to edit its properties';
            this.propertiesPanel.appendChild(message);
            return;
        }

        // Create a form for the properties
        const form = document.createElement('form');
        form.className = 'properties-form';

        // Add position properties
        this.addPropertyGroup(form, 'Position', [
            {
                label: 'X',
                type: 'number',
                value: this.selectedEntity.x,
                onChange: (value) => {
                    this.selectedEntity.x = Number(value);
                    this.gameEngine.render();
                }
            },
            {
                label: 'Y',
                type: 'number',
                value: this.selectedEntity.y,
                onChange: (value) => {
                    this.selectedEntity.y = Number(value);
                    this.gameEngine.render();
                }
            }
        ]);

        // Add size properties
        this.addPropertyGroup(form, 'Size', [
            {
                label: 'Width',
                type: 'number',
                value: this.selectedEntity.width,
                onChange: (value) => {
                    this.selectedEntity.width = Number(value);
                    this.gameEngine.render();
                }
            },
            {
                label: 'Height',
                type: 'number',
                value: this.selectedEntity.height,
                onChange: (value) => {
                    this.selectedEntity.height = Number(value);
                    this.gameEngine.render();
                }
            }
        ]);

        // Add behavior properties
        this.addBehaviorProperties(form);

        // Add a button to edit behavior in a modal
        const editBehaviorBtn = document.createElement('button');
        editBehaviorBtn.className = 'btn primary';
        editBehaviorBtn.textContent = 'Edit Behavior';
        editBehaviorBtn.addEventListener('click', (event) => {
            event.preventDefault();
            this.openBehaviorModal();
        });

        form.appendChild(editBehaviorBtn);

        // Add the form to the properties panel
        this.propertiesPanel.appendChild(form);
    }

    /**
     * Add a property group to the form
     * @param {HTMLFormElement} form - The form to add the group to
     * @param {string} title - The title of the group
     * @param {Array} properties - The properties to add
     */
    addPropertyGroup(form, title, properties) {
        const group = document.createElement('div');
        group.className = 'property-group';

        // Add title
        const titleElement = document.createElement('h4');
        titleElement.textContent = title;
        group.appendChild(titleElement);

        // Add properties
        properties.forEach(property => {
            const label = document.createElement('label');
            label.textContent = property.label;

            const input = document.createElement('input');
            input.type = property.type;
            input.value = property.value;

            input.addEventListener('change', () => {
                property.onChange(input.value);
            });

            group.appendChild(label);
            group.appendChild(input);
        });

        form.appendChild(group);
    }

    /**
     * Add behavior properties to the form
     * @param {HTMLFormElement} form - The form to add the properties to
     */
    addBehaviorProperties(form) {
        const group = document.createElement('div');
        group.className = 'property-group';

        // Add title
        const titleElement = document.createElement('h4');
        titleElement.textContent = 'Behavior';
        group.appendChild(titleElement);

        // Add behavior type
        const label = document.createElement('label');
        label.textContent = 'Type';

        const select = document.createElement('select');

        // Add behavior options
        const behaviorTypes = [
            { value: 'static', text: 'Static (Non-moving)' },
            { value: 'player', text: 'Player Controlled' },
            { value: 'ai', text: 'AI Controlled' },
            { value: 'collectible', text: 'Collectible' },
            { value: 'obstacle', text: 'Obstacle' },
            { value: 'trigger', text: 'Trigger' }
        ];

        behaviorTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.text;

            if (this.selectedEntity.behavior && this.selectedEntity.behavior.type === type.value) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            const behaviorType = select.value;
            this.changeBehaviorType(behaviorType);
        });

        group.appendChild(label);
        group.appendChild(select);

        form.appendChild(group);
    }

    /**
     * Change the behavior type of the selected entity
     * @param {string} behaviorType - The new behavior type
     */
    changeBehaviorType(behaviorType) {
        if (!this.selectedEntity) return;

        // Create a new behavior based on the type
        const behaviorData = { type: behaviorType };
        this.selectedEntity.behavior = this.gameEngine.createBehavior(behaviorData);

        // Update the properties panel
        this.updatePropertiesPanel();

        console.log(`Changed behavior type to: ${behaviorType}`);
    }

    /**
     * Open the behavior modal for detailed editing
     */
    openBehaviorModal() {
        if (!this.selectedEntity) return;

        // Get the behavior modal
        const modal = document.getElementById('behaviorModal');
        if (!modal) {
            console.error('Behavior modal not found');
            return;
        }

        // Show the modal
        modal.classList.add('active');

        // Get the behavior type select
        const behaviorType = document.getElementById('behaviorType');
        if (behaviorType) {
            // Set the selected behavior type
            behaviorType.value = this.selectedEntity.behavior.type;

            // Update behavior properties
            this.updateBehaviorProperties();

            // Add change event
            behaviorType.addEventListener('change', () => {
                this.updateBehaviorProperties();
            });
        }

        // Get the save button
        const saveBtn = document.getElementById('saveBehaviorBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveBehaviorFromModal();
                modal.classList.remove('active');
            });
        }

        // Get the cancel button
        const cancelBtn = document.getElementById('cancelBehaviorBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // Get the close button
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
    }

    /**
     * Update the behavior properties in the modal
     */
    updateBehaviorProperties() {
        // Get the behavior type
        const behaviorType = document.getElementById('behaviorType').value;

        // Get the behavior properties container
        const propertiesContainer = document.getElementById('behaviorProperties');
        if (!propertiesContainer) return;

        // Clear the container
        propertiesContainer.innerHTML = '';

        // Add properties based on the behavior type
        switch (behaviorType) {
            case 'player':
                this.addBehaviorProperty(propertiesContainer, 'speed', 'Speed', 'number', 5);
                this.addBehaviorProperty(propertiesContainer, 'jumpHeight', 'Jump Height', 'number', 10);
                break;

            case 'ai':
                this.addBehaviorProperty(propertiesContainer, 'pattern', 'Movement Pattern', 'select', 'patrol', [
                    { value: 'patrol', text: 'Patrol (Left-Right)' },
                    { value: 'circle', text: 'Circle' },
                    { value: 'random', text: 'Random' }
                ]);
                this.addBehaviorProperty(propertiesContainer, 'speed', 'Speed', 'number', 2);
                break;

            case 'collectible':
                this.addBehaviorProperty(propertiesContainer, 'value', 'Value', 'number', 1);
                this.addBehaviorProperty(propertiesContainer, 'effect', 'Effect', 'select', 'score', [
                    { value: 'score', text: 'Score' },
                    { value: 'health', text: 'Health' },
                    { value: 'speed', text: 'Speed Boost' }
                ]);
                break;

            case 'obstacle':
                this.addBehaviorProperty(propertiesContainer, 'solid', 'Solid', 'checkbox', true);
                break;

            case 'trigger':
                this.addBehaviorProperty(propertiesContainer, 'action', 'Action', 'select', 'none', [
                    { value: 'none', text: 'None' },
                    { value: 'win', text: 'Win Game' },
                    { value: 'lose', text: 'Lose Game' },
                    { value: 'nextLevel', text: 'Next Level' },
                    { value: 'teleport', text: 'Teleport' }
                ]);

                // Add teleport target coordinates if action is teleport
                if (this.selectedEntity &&
                    this.selectedEntity.behavior &&
                    this.selectedEntity.behavior.action === 'teleport') {
                    this.addBehaviorProperty(propertiesContainer, 'targetX', 'Target X', 'number', 0);
                    this.addBehaviorProperty(propertiesContainer, 'targetY', 'Target Y', 'number', 0);
                }
                break;
        }
    }

    /**
     * Add a behavior property to the container
     * @param {HTMLElement} container - The container to add the property to
     * @param {string} name - The name of the property
     * @param {string} label - The label for the property
     * @param {string} type - The type of the property (number, text, checkbox, select)
     * @param {*} defaultValue - The default value for the property
     * @param {Array} [options] - Options for select type
     */
    addBehaviorProperty(container, name, label, type, defaultValue, options) {
        const group = document.createElement('div');
        group.className = 'property-group';

        // Add label
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        group.appendChild(labelElement);

        let input;

        // Create input based on type
        if (type === 'select' && options) {
            input = document.createElement('select');

            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;

                if (this.selectedEntity &&
                    this.selectedEntity.behavior &&
                    this.selectedEntity.behavior[name] === option.value) {
                    optionElement.selected = true;
                } else if (option.value === defaultValue) {
                    optionElement.selected = true;
                }

                input.appendChild(optionElement);
            });
        } else if (type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';

            if (this.selectedEntity &&
                this.selectedEntity.behavior &&
                this.selectedEntity.behavior[name] !== undefined) {
                input.checked = this.selectedEntity.behavior[name];
            } else {
                input.checked = defaultValue;
            }
        } else {
            input = document.createElement('input');
            input.type = type;

            if (this.selectedEntity &&
                this.selectedEntity.behavior &&
                this.selectedEntity.behavior[name] !== undefined) {
                input.value = this.selectedEntity.behavior[name];
            } else {
                input.value = defaultValue;
            }
        }

        // Add data attribute for property name
        input.dataset.propertyName = name;

        group.appendChild(input);
        container.appendChild(group);
    }

    /**
     * Save behavior properties from the modal
     */
    saveBehaviorFromModal() {
        if (!this.selectedEntity) return;

        // Get the behavior type
        const behaviorType = document.getElementById('behaviorType').value;

        // Create behavior data object
        const behaviorData = {
            type: behaviorType
        };

        // Get all inputs with property names
        const inputs = document.querySelectorAll('#behaviorProperties [data-property-name]');

        // Add each property to the behavior data
        inputs.forEach(input => {
            const propertyName = input.dataset.propertyName;
            let value;

            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'number') {
                value = Number(input.value);
            } else {
                value = input.value;
            }

            behaviorData[propertyName] = value;
        });

        // Create the behavior
        this.selectedEntity.behavior = this.gameEngine.createBehavior(behaviorData);

        // Update the properties panel
        this.updatePropertiesPanel();

        console.log('Saved behavior properties:', behaviorData);
    }

    /**
     * Select an entity
     * @param {Entity} entity - The entity to select
     */
    selectEntity(entity) {
        // Deselect current entity if any
        this.deselectEntity();

        // Select the new entity
        this.selectedEntity = entity;
        entity.selected = true;

        // Update the properties panel
        this.updatePropertiesPanel();

        console.log(`Selected entity: ${entity.id}`);
    }

    /**
     * Deselect the currently selected entity
     */
    deselectEntity() {
        if (this.selectedEntity) {
            this.selectedEntity.selected = false;
            this.selectedEntity = null;

            // Update the properties panel
            this.updatePropertiesPanel();

            console.log('Deselected entity');
        }
    }

    /**
     * Delete an entity
     * @param {Entity} entity - The entity to delete
     */
    deleteEntity(entity) {
        // Find the layer containing the entity
        const layer = this.gameEngine.layers.find(layer =>
            layer.entities.includes(entity)
        );

        if (layer) {
            // Remove from layer
            layer.removeEntity(entity);

            // Remove from engine entities list
            const index = this.gameEngine.entities.indexOf(entity);
            if (index !== -1) {
                this.gameEngine.entities.splice(index, 1);
            }

            // Deselect if it's the selected entity
            if (this.selectedEntity === entity) {
                this.deselectEntity();
            }

            console.log(`Deleted entity: ${entity.id}`);
        }
    }

    /**
     * Initialize the editor controls
     */
    initEditorControls() {
        // Get the grid toggle
        const gridToggle = document.getElementById('gridToggle');
        if (gridToggle) {
            gridToggle.checked = this.showGrid;
            gridToggle.addEventListener('change', () => {
                this.showGrid = gridToggle.checked;
                this.gameEngine.render();
                this.drawGrid();
            });
        }

        // Get the snap toggle
        const snapToggle = document.getElementById('snapToggle');
        if (snapToggle) {
            snapToggle.checked = this.snapToGrid;
            snapToggle.addEventListener('change', () => {
                this.snapToGrid = snapToggle.checked;
            });
        }

        // Get the zoom controls
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomLevel = document.getElementById('zoomLevel');

        if (zoomInBtn && zoomOutBtn && zoomLevel) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomLevel = Math.min(this.zoomLevel + 0.1, 3);
                zoomLevel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
                this.updateZoom();
            });

            zoomOutBtn.addEventListener('click', () => {
                this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
                zoomLevel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
                this.updateZoom();
            });
        }

        // Add editor mode buttons if they exist
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                modeButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                // Update editor mode
                this.editorMode = button.dataset.mode;

                console.log(`Changed editor mode to: ${this.editorMode}`);
            });
        });
    }

    /**
     * Update the zoom level
     */
    updateZoom() {
        const canvas = this.gameEngine.renderSystem.canvas;

        // Apply zoom transformation
        canvas.style.transform = `scale(${this.zoomLevel})`;
        canvas.style.transformOrigin = 'top left';

        // Render the game
        this.gameEngine.render();

        // Draw the grid
        this.drawGrid();

        console.log(`Zoom level set to: ${this.zoomLevel}`);
    }
}

// Create a global instance of the editor
let editor;

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the game engine
    const gameEngine = new GameEngine();
    gameEngine.init();

    // Create and initialize the editor
    editor = new Editor(gameEngine);
    editor.init();

    // Initialize the storage system
    storageSystem.init();

    // Load the current game if available
    const currentGame = storageSystem.loadCurrentGame();
    if (currentGame) {
        gameEngine.loadGame(currentGame);
        editor.updateLayersList();

        // Select the first layer if available
        if (gameEngine.layers.length > 0) {
            editor.selectLayer(gameEngine.layers[0].id);
        }
    }

    // Set up event listeners for the app controls
    setupAppControls(gameEngine);
});

/**
 * Set up event listeners for the app controls
 * @param {GameEngine} gameEngine - The game engine
 */
function setupAppControls(gameEngine) {
    // Get the editor and player mode buttons
    const editorBtn = document.getElementById('editorBtn');
    const playerBtn = document.getElementById('playerBtn');

    // Get the editor and player mode containers
    const editorMode = document.getElementById('editorMode');
    const playerMode = document.getElementById('playerMode');

    if (editorBtn && playerBtn && editorMode && playerMode) {
        // Switch to editor mode
        editorBtn.addEventListener('click', () => {
            editorBtn.classList.add('active');
            playerBtn.classList.remove('active');
            editorMode.classList.add('active');
            playerMode.classList.remove('active');
        });

        // Switch to player mode
        playerBtn.addEventListener('click', () => {
            playerBtn.classList.add('active');
            editorBtn.classList.remove('active');
            playerMode.classList.add('active');
            editorMode.classList.remove('active');

            // Start the game
            gameEngine.start();
        });
    }

    // Get the new game button
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            if (confirm('Create a new game? Any unsaved changes will be lost.')) {
                // Reset the game engine
                gameEngine.reset();

                // Reset the editor
                editor.init();
            }
        });
    }

    // Get the save game button
    const saveGameBtn = document.getElementById('saveGameBtn');
    if (saveGameBtn) {
        saveGameBtn.addEventListener('click', () => {
            // Open the game settings modal
            const modal = document.getElementById('gameSettingsModal');
            if (modal) {
                modal.classList.add('active');

                // Get the save button
                const saveSettingsBtn = document.getElementById('saveSettingsBtn');
                if (saveSettingsBtn) {
                    saveSettingsBtn.addEventListener('click', () => {
                        saveGameWithSettings();
                        modal.classList.remove('active');
                    });
                }

                // Get the cancel button
                const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
                if (cancelSettingsBtn) {
                    cancelSettingsBtn.addEventListener('click', () => {
                        modal.classList.remove('active');
                    });
                }

                // Get the close button
                const closeBtn = modal.querySelector('.close-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        modal.classList.remove('active');
                    });
                }
            }
        });
    }

    // Get the load game button
    const loadGameBtn = document.getElementById('loadGameBtn');
    if (loadGameBtn) {
        loadGameBtn.addEventListener('click', () => {
            // Get the list of saved games
            const savedGames = storageSystem.getSavedGamesList();

            if (savedGames.length === 0) {
                alert('No saved games found.');
                return;
            }

            // Create a simple prompt to select a game
            const gameName = prompt('Enter the name of the game to load:\n\nAvailable games: ' + savedGames.join(', '));

            if (gameName) {
                const gameData = storageSystem.loadGame(gameName);

                if (gameData) {
                    // Load the game
                    gameEngine.loadGame(gameData);

                    // Update the editor
                    editor.updateLayersList();

                    // Select the first layer if available
                    if (gameEngine.layers.length > 0) {
                        editor.selectLayer(gameEngine.layers[0].id);
                    }
                } else {
                    alert(`Game "${gameName}" not found.`);
                }
            }
        });
    }

    // Get the export game button
    const exportGameBtn = document.getElementById('exportGameBtn');
    if (exportGameBtn) {
        exportGameBtn.addEventListener('click', () => {
            // Export the game to a JSON file
            const gameData = gameEngine.exportGame();
            storageSystem.exportGame(gameData);
        });
    }

    // Get the import game button
    const importGameBtn = document.getElementById('importGameBtn');
    if (importGameBtn) {
        importGameBtn.addEventListener('click', () => {
            // Create a file input for importing
            const input = storageSystem.createImportInput((gameData) => {
                if (gameData) {
                    // Load the game
                    gameEngine.loadGame(gameData);

                    // Update the editor
                    editor.updateLayersList();

                    // Select the first layer if available
                    if (gameEngine.layers.length > 0) {
                        editor.selectLayer(gameEngine.layers[0].id);
                    }
                } else {
                    alert('Failed to import game.');
                }
            });

            // Trigger the file input
            input.click();
        });
    }

    // Get the player controls
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (playBtn && pauseBtn && resetBtn) {
        // Play button
        playBtn.addEventListener('click', () => {
            gameEngine.start();
        });

        // Pause button
        pauseBtn.addEventListener('click', () => {
            gameEngine.pause();
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            gameEngine.stop();

            // Reload the current game
            const gameData = gameEngine.exportGame();
            gameEngine.loadGame(gameData);

            // Start the game again
            gameEngine.start();
        });

        // Fullscreen button
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const gameContainer = document.querySelector('.game-container');

                if (gameContainer) {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        gameContainer.requestFullscreen();
                    }
                }
            });
        }
    }
}

/**
 * Save the game with settings from the modal
 */
function saveGameWithSettings() {
    // Get the game title
    const gameTitleInput = document.getElementById('gameTitle');
    const gameTitle = gameTitleInput ? gameTitleInput.value : 'Untitled Game';

    // Get the game author
    const gameAuthorInput = document.getElementById('gameAuthor');
    const gameAuthor = gameAuthorInput ? gameAuthorInput.value : 'Anonymous';

    // Get the game description
    const gameDescriptionInput = document.getElementById('gameDescription');
    const gameDescription = gameDescriptionInput ? gameDescriptionInput.value : '';

    // Get the game dimensions
    const gameWidthInput = document.getElementById('gameWidth');
    const gameWidth = gameWidthInput ? Number(gameWidthInput.value) : 800;

    const gameHeightInput = document.getElementById('gameHeight');
    const gameHeight = gameHeightInput ? Number(gameHeightInput.value) : 600;

    // Get the game physics settings
    const gameGravityInput = document.getElementById('gameGravity');
    const gameGravity = gameGravityInput ? Number(gameGravityInput.value) / 10 : 0.5;

    const gameFrictionInput = document.getElementById('gameFriction');
    const gameFriction = gameFrictionInput ? Number(gameFrictionInput.value) : 0.1;

    // Update the game engine settings
    editor.gameEngine.settings.width = gameWidth;
    editor.gameEngine.settings.height = gameHeight;
    editor.gameEngine.settings.gravity = gameGravity;
    editor.gameEngine.settings.friction = gameFriction;

    // Export the game data
    const gameData = editor.gameEngine.exportGame();

    // Update metadata
    gameData.metadata.title = gameTitle;
    gameData.metadata.author = gameAuthor;
    gameData.metadata.description = gameDescription;

    // Save the game
    storageSystem.saveGame(gameTitle, gameData);

    // Save as current game
    storageSystem.saveCurrentGame(gameData);

    console.log(`Game "${gameTitle}" saved successfully`);
}
