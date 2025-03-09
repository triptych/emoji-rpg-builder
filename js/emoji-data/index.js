/**
 * Emoji RPG Builder - Emoji Data Manifest
 * Imports and combines all emoji category data
 */

import peopleEmojis from './people.js';
import natureEmojis from './nature.js';
import foodEmojis from './food.js';
import activitiesEmojis from './activities.js';
import travelEmojis from './travel.js';
import objectsEmojis from './objects.js';
import symbolsEmojis from './symbols.js';

const emojiData = {
    categories: {
        people: {
            name: "People & Faces",
            emojis: peopleEmojis
        },
        nature: {
            name: "Animals & Nature",
            emojis: natureEmojis
        },
        food: {
            name: "Food & Drink",
            emojis: foodEmojis
        },
        activities: {
            name: "Activities & Sports",
            emojis: activitiesEmojis
        },
        travel: {
            name: "Travel & Places",
            emojis: travelEmojis
        },
        objects: {
            name: "Objects",
            emojis: objectsEmojis
        },
        symbols: {
            name: "Symbols",
            emojis: symbolsEmojis
        }
    }
};

export default emojiData;
