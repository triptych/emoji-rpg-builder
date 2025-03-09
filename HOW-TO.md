# How to Use Emoji RPG Builder

This guide will walk you through the basics of using the Emoji RPG Builder to create your own emoji-based role-playing games.

## Getting Started

1. Open the Emoji RPG Builder in your web browser by opening the `index.html` file.
2. The application will load with the Editor mode active by default.

## Editor Mode

### Emoji Palette

- The left sidebar contains the emoji palette.
- Browse emojis by category using the category buttons.
- Use the search box to find specific emojis.
- Click on an emoji to select it for placement.

### Canvas

- The central area is your game canvas.
- Use the toolbar above the canvas to:
  - Toggle between place, select, and delete modes
  - Toggle grid visibility and snap-to-grid
  - Zoom in and out
- Click on the canvas to place the selected emoji.
- Use select mode to move emojis around.
- Use delete mode to remove emojis.

### Layers

- The right sidebar contains the layer management panel.
- Click the "+" button to add a new layer.
- Click the trash icon to delete the selected layer.
- Click on a layer to select it.
- Toggle the eye icon to show/hide a layer.
- Toggle the lock icon to lock/unlock a layer.
- Drag layers to reorder them.

### Properties

- The properties panel appears in the right sidebar when an emoji is selected.
- Assign behaviors to emojis by clicking the "Edit Behavior" button.
- Available behaviors:
  - Static: Non-moving objects
  - Player-controlled: Controlled by keyboard/touch
  - AI-controlled: Moves automatically in patterns
  - Collectible: Can be collected by the player
  - Obstacle: Blocks movement
  - Trigger: Activates events when touched

## Game Settings

1. Click the "Save" button in the header.
2. In the dialog that appears, enter:
   - Game Title
   - Author Name
   - Description
   - Dimensions (width and height)
   - Physics properties (gravity and friction)
3. Click "Save" to apply the settings.

## Testing Your Game

1. Click the "Play" button in the top-right corner to switch to Player mode.
2. Use the controls at the bottom of the screen:
   - Play: Start the game
   - Pause: Pause the game
   - Reset: Restart the game
   - Fullscreen: Toggle fullscreen mode
3. Control player emojis using the arrow keys or WASD.
4. Click the "Editor" button to return to editing.

## Saving and Loading

### Saving Your Game

1. Click the "Save" button in the header.
2. Your game will be saved to your browser's local storage.

### Exporting Your Game

1. Click the "Export" button in the header.
2. A JSON file will be downloaded containing your game data.

### Importing a Game

1. Click the "Import" button in the header.
2. Select a previously exported JSON file.
3. The game will be loaded into the editor.

## Creating a Complete Game

1. Create a background layer with scenery.
2. Add a gameplay layer with interactive elements.
3. Place a player-controlled emoji.
4. Add obstacles, collectibles, and triggers.
5. Set win/lose conditions using triggers.
6. Test your game in Player mode.
7. Adjust and refine as needed.
8. Save and export your finished game.

## Tips and Tricks

- Use layers to organize your game elements logically.
- Test your game frequently during development.
- Start with simple designs and gradually add complexity.
- Use the grid for precise placement of elements.
- Combine different behaviors to create interesting gameplay.
- Remember to set game properties like gravity and friction to match your game style.
