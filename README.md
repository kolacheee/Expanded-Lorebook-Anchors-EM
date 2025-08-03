# World Info Folders Extension

This extension adds collapsible and draggable folders to the World Info tab in SillyTavern, allowing you to organize your lorebook entries more effectively.

## Features

- **Create Folders**: Add new folders to categorize your World Info entries
- **Collapsible**: Click folder headers to expand/collapse content
- **Rename Folders**: Click on folder names to edit them inline
- **Drag & Drop**: Drag World Info entries into folders or reorder folders and entries
- **Visual Feedback**: Clear visual indicators for drag operations and empty folders

## Installation

1. Download or clone this extension
2. Place the `world-info-folders` directory in your SillyTavern installation at:
   ```
   SillyTavern/public/scripts/extensions/third-party/world-info-folders/
   ```
3. Restart SillyTavern
4. The extension will automatically load when you visit the World Info tab

## How to Use

### Creating a New Folder

1. Navigate to the **World Info** tab
2. Look for the folder icon button next to the "New Entry" button
3. Click the folder icon to create a new folder
4. The folder will appear with the name "New Folder" selected for editing

### Renaming Folders

1. Click directly on the folder name in the header
2. Type your desired name
3. Press Enter or click elsewhere to save the name

### Organizing Entries

- **Expanding/Collapsing**: Click anywhere on the folder header (except the name) to toggle visibility
- **Moving Entries**: Drag any World Info entry and drop it into an open folder
- **Reordering**: Drag folders and entries to reorder them in the list
- **Visual Cues**: Empty folders show "Drag world info entries here" as a hint

### Managing Folders

- Folders can be dragged to reorder them among other folders and entries
- Folders remember their open/closed state during the session
- Empty folders provide visual feedback when dragging entries

## Technical Details

- Uses SillyTavern's existing Sortable.js library for drag-and-drop functionality
- Integrates seamlessly with the existing World Info system
- Follows SillyTavern's styling conventions and color schemes
- No external dependencies required

## Compatibility

- Compatible with SillyTavern's current World Info system
- Works with existing World Info entries without modification
- Respects SillyTavern's theming system

## Troubleshooting

If the folder button doesn't appear:
1. Check the browser console for error messages
2. Ensure the extension files are in the correct directory
3. Restart SillyTavern completely
4. Verify that JavaScript is enabled in your browser

## Support

This extension was created to enhance the World Info organization experience in SillyTavern. For issues or feature requests, please refer to the SillyTavern community resources.