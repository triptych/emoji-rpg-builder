/**
 * Emoji RPG Builder - Storage System
 * Handles saving, loading, importing, and exporting game data
 */

export class StorageSystem {
    constructor() {
        this.localStorageKey = 'emoji-rpg-games';
        this.currentGameKey = 'emoji-rpg-current-game';
    }

    /**
     * Initialize the storage system
     */
    init() {
        // Check if local storage is available
        if (!this.isLocalStorageAvailable()) {
            console.warn('Local storage is not available. Save/load functionality will be limited to file operations.');
        } else {
            console.log('Storage system initialized with local storage support.');
        }
    }

    /**
     * Check if local storage is available
     * @returns {boolean} True if local storage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Save a game to local storage
     * @param {string} name - The name of the game
     * @param {Object} gameData - The game data to save
     * @returns {boolean} True if the game was saved successfully
     */
    saveGame(name, gameData) {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot save game: local storage is not available');
            return false;
        }

        try {
            // Add metadata
            const saveData = {
                ...gameData,
                metadata: {
                    ...gameData.metadata,
                    name: name,
                    savedAt: new Date().toISOString()
                }
            };

            // Get existing saved games
            const savedGames = this.getSavedGames();

            // Add or update the game
            savedGames[name] = saveData;

            // Save back to local storage
            localStorage.setItem(this.localStorageKey, JSON.stringify(savedGames));

            console.log(`Game "${name}" saved successfully`);
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    /**
     * Load a game from local storage
     * @param {string} name - The name of the game to load
     * @returns {Object|null} The game data or null if not found
     */
    loadGame(name) {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot load game: local storage is not available');
            return null;
        }

        try {
            // Get saved games
            const savedGames = this.getSavedGames();

            // Check if the game exists
            if (!savedGames[name]) {
                console.error(`Game "${name}" not found`);
                return null;
            }

            console.log(`Game "${name}" loaded successfully`);
            return savedGames[name];
        } catch (error) {
            console.error('Error loading game:', error);
            return null;
        }
    }

    /**
     * Delete a game from local storage
     * @param {string} name - The name of the game to delete
     * @returns {boolean} True if the game was deleted successfully
     */
    deleteGame(name) {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot delete game: local storage is not available');
            return false;
        }

        try {
            // Get saved games
            const savedGames = this.getSavedGames();

            // Check if the game exists
            if (!savedGames[name]) {
                console.error(`Game "${name}" not found`);
                return false;
            }

            // Delete the game
            delete savedGames[name];

            // Save back to local storage
            localStorage.setItem(this.localStorageKey, JSON.stringify(savedGames));

            console.log(`Game "${name}" deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error deleting game:', error);
            return false;
        }
    }

    /**
     * Get all saved games from local storage
     * @returns {Object} An object containing all saved games
     */
    getSavedGames() {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot get saved games: local storage is not available');
            return {};
        }

        try {
            const savedGamesJson = localStorage.getItem(this.localStorageKey);
            return savedGamesJson ? JSON.parse(savedGamesJson) : {};
        } catch (error) {
            console.error('Error getting saved games:', error);
            return {};
        }
    }

    /**
     * Get a list of saved game names
     * @returns {string[]} An array of saved game names
     */
    getSavedGamesList() {
        const savedGames = this.getSavedGames();
        return Object.keys(savedGames);
    }

    /**
     * Save the current game state
     * @param {Object} gameData - The current game data
     * @returns {boolean} True if the game was saved successfully
     */
    saveCurrentGame(gameData) {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot save current game: local storage is not available');
            return false;
        }

        try {
            localStorage.setItem(this.currentGameKey, JSON.stringify(gameData));
            console.log('Current game state saved');
            return true;
        } catch (error) {
            console.error('Error saving current game state:', error);
            return false;
        }
    }

    /**
     * Load the current game state
     * @returns {Object|null} The current game data or null if not found
     */
    loadCurrentGame() {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot load current game: local storage is not available');
            return null;
        }

        try {
            const gameDataJson = localStorage.getItem(this.currentGameKey);
            if (!gameDataJson) {
                console.log('No current game state found');
                return null;
            }

            console.log('Current game state loaded');
            return JSON.parse(gameDataJson);
        } catch (error) {
            console.error('Error loading current game state:', error);
            return null;
        }
    }

    /**
     * Clear the current game state
     * @returns {boolean} True if the current game state was cleared successfully
     */
    clearCurrentGame() {
        if (!this.isLocalStorageAvailable()) {
            console.error('Cannot clear current game: local storage is not available');
            return false;
        }

        try {
            localStorage.removeItem(this.currentGameKey);
            console.log('Current game state cleared');
            return true;
        } catch (error) {
            console.error('Error clearing current game state:', error);
            return false;
        }
    }

    /**
     * Export a game to a JSON file
     * @param {Object} gameData - The game data to export
     * @param {string} [filename] - Optional filename (defaults to game title)
     * @returns {boolean} True if the game was exported successfully
     */
    exportGame(gameData, filename) {
        try {
            // Use the game title as the filename if not provided
            const name = filename || (gameData.metadata?.title || 'emoji-rpg-game');
            const safeFilename = name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.json';

            // Convert game data to JSON string
            const gameDataJson = JSON.stringify(gameData, null, 2);

            // Create a blob and download link
            const blob = new Blob([gameDataJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create a temporary link element and trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = safeFilename;
            document.body.appendChild(a);
            a.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            console.log(`Game exported as "${safeFilename}"`);
            return true;
        } catch (error) {
            console.error('Error exporting game:', error);
            return false;
        }
    }

    /**
     * Import a game from a JSON file
     * @param {File} file - The JSON file to import
     * @returns {Promise<Object|null>} A promise that resolves to the imported game data or null if failed
     */
    importGame(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                console.error('No file provided for import');
                reject(new Error('No file provided'));
                return;
            }

            if (!file.name.endsWith('.json')) {
                console.error('File must be a JSON file');
                reject(new Error('Invalid file format'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const gameData = JSON.parse(event.target.result);
                    console.log('Game imported successfully');
                    resolve(gameData);
                } catch (error) {
                    console.error('Error parsing imported game data:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    /**
     * Create a file input element for importing games
     * @param {Function} onImport - Callback function to handle the imported game data
     * @returns {HTMLInputElement} The file input element
     */
    createImportInput(onImport) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.importGame(file)
                    .then(gameData => {
                        if (onImport && typeof onImport === 'function') {
                            onImport(gameData);
                        }
                    })
                    .catch(error => {
                        console.error('Import failed:', error);
                        if (onImport && typeof onImport === 'function') {
                            onImport(null, error);
                        }
                    });
            }
        });

        document.body.appendChild(input);
        return input;
    }
}

// Create and export a global instance of the storage system
const storageSystem = new StorageSystem();
export default storageSystem;
