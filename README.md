# World Info Folders Extension

## Overview

The World Info Folders extension adds folder organization functionality to SillyTavern's World Info (Lorebook) system. This extension allows you to create named, collapsible folders to organize your World Info entries, making it easier to manage large lorebooks with many entries.

## Features

- **Create Folders**: Add named folders to organize your World Info entries
- **Collapsible Folders**: Folders can be collapsed and expanded to save space
- **Drag & Drop**: Move entries between folders and reorder folders with intuitive drag and drop
- **Folder Management**: Rename and delete folders as needed
- **Per-World Storage**: Folder organization is saved per World Info/Lorebook
- **Visual Feedback**: Clear visual indicators for drag operations and folder states

## Installation

1. Place the `world-info-folders` directory in your SillyTavern's extensions folder:
   ```
   SillyTavern/public/scripts/extensions/world-info-folders/
   ```

2. The extension should automatically load when you restart SillyTavern or refresh the page.

3. Verify installation by checking for the folder button (📁+) in the World Info interface.

## How to Use

### Creating a New Folder

1. **Open World Info**: Navigate to the World Info panel in SillyTavern
2. **Select a Lorebook**: Choose the lorebook you want to organize from the dropdown
3. **Click the Folder Button**: Look for the folder-plus icon (📁+) between the "New Entry" and "Fill empty Memo/Titles" buttons
4. **Name Your Folder**: Enter a descriptive name when prompted
5. **Folder Created**: Your new folder will appear in the entries list

### Moving Entries to Folders

**Method 1: Drag and Drop**
1. Click and drag any World Info entry
2. Drop it onto a folder or into the folder's content area
3. The entry will be moved to that folder

**Method 2: Drop on Folder Header**
1. Drag an entry to the folder's header bar
2. The folder will highlight when it's a valid drop target
3. Release to move the entry to that folder

### Managing Folders

#### Collapsing/Expanding Folders
- **Click the chevron icon** (▶/▼) next to the folder name to toggle collapse state
- Collapsed folders show a right-pointing arrow (▶)
- Expanded folders show a down-pointing arrow (▼)

#### Renaming Folders
1. **Double-click** on the folder name
2. Enter the new name in the prompt dialog
3. The folder will be renamed immediately

#### Deleting Folders
1. **Hover over a folder** to reveal the delete button (🗑️)
2. **Click the delete button**
3. **Confirm deletion** in the dialog
4. All entries in the folder will be moved back to the main list

### Reorganizing Folders

**Reordering Folders**
1. **Drag a folder** by its header bar
2. **Drop it** at the desired position in the list
3. Folders will reorder automatically

**Moving Entries Out of Folders**
1. **Drag an entry** from within a folder
2. **Drop it** on the main entries area (outside any folder)
3. The entry will be moved back to the unorganized list

## Interface Elements

### Folder Button Location
The folder creation button (📁+) is strategically placed between:
- **New Entry** button (for creating entries)
- **Fill empty Memo/Titles** button (for batch operations)

This placement makes it easy to find while maintaining the logical flow of World Info operations.

### Folder Structure
Each folder consists of:
- **Header Bar**: Contains collapse/expand icon, folder name, and delete button
- **Content Area**: Contains the World Info entries assigned to the folder
- **Drop Zone**: Visual feedback area for drag and drop operations

### Visual Indicators
- **Hover Effects**: Folders and buttons highlight when hovered
- **Drag States**: Visual feedback during drag operations
- **Empty Folders**: Show a "Drop entries here..." message when empty
- **Collapse States**: Icons change to indicate folder state

## Data Storage

### Where Data is Stored
- Folder configurations are stored in SillyTavern's extension settings
- Data is automatically saved when changes are made
- Each World Info/Lorebook has separate folder organization

### Data Structure
The extension stores:
- **Folder definitions**: Name, ID, and collapse state for each folder
- **Entry associations**: Which entries belong to which folders
- **Per-world organization**: Separate folder systems for each lorebook

## Troubleshooting

### Folder Button Not Appearing
1. **Refresh the page** to ensure the extension loads
2. **Check World Info is open** - the button only appears when World Info panel is active
3. **Verify extension installation** - ensure files are in the correct directory

### Drag and Drop Not Working
1. **Ensure entries are draggable** - some entries may need to be fully loaded first
2. **Try refreshing** the World Info view by switching to another lorebook and back
3. **Check for conflicts** with other extensions that modify drag behavior

### Folders Not Saving
1. **Check browser console** for any JavaScript errors
2. **Verify write permissions** for SillyTavern's settings storage
3. **Try creating a test folder** to confirm functionality

### Entries Not Moving Properly
1. **Ensure you're dropping in valid zones** - folder headers or content areas
2. **Wait for visual feedback** before releasing the drag
3. **Refresh the view** if entries appear in wrong locations

## Tips and Best Practices

### Organization Strategies
- **Group by Theme**: Create folders for different story themes or settings
- **Group by Character**: Organize entries by character or faction
- **Group by Priority**: Separate critical entries from optional background info
- **Group by Status**: Keep active entries separate from archived ones

### Performance Considerations
- **Large Lorebooks**: Use folders to keep commonly used entries easily accessible
- **Batch Operations**: Organize entries when initially creating them rather than reorganizing later
- **Naming Convention**: Use clear, descriptive folder names for easy identification

### Workflow Integration
1. **Plan your structure** before creating many entries
2. **Create folders first**, then add entries directly to them
3. **Review and reorganize** periodically as your lorebook grows
4. **Use collapse feature** to focus on specific areas while working

## Advanced Features

### Keyboard Shortcuts
While there are no specific keyboard shortcuts, the extension works with standard browser shortcuts:
- **Ctrl+Z**: May undo recent folder operations (browser dependent)
- **Escape**: Cancels ongoing drag operations

### Browser Compatibility
The extension works with all modern browsers that support:
- HTML5 drag and drop API
- CSS3 transitions and transforms
- ES6 JavaScript features

## Version History

### Version 1.0.0
- Initial release
- Basic folder creation and management
- Drag and drop functionality
- Collapse/expand features
- Per-world data storage

## Support and Feedback

If you encounter issues or have suggestions for improvements:

1. **Check the browser console** for error messages
2. **Verify your SillyTavern version** is compatible
3. **Report issues** to the SillyTavern community or extension maintainer
4. **Include details** about your setup and the specific problem

## Technical Details

### Dependencies
- SillyTavern core system
- World Info module
- Extension framework
- Modern browser with drag/drop support

### File Structure
```
world-info-folders/
├── manifest.json      # Extension metadata
├── index.js          # Main functionality
├── style.css         # Styling
└── README.md         # This documentation
```

### Integration Points
The extension integrates with:
- World Info UI components
- SillyTavern's extension system
- Settings storage system
- Event system for World Info updates

---

**Created for SillyTavern Community**
*Version 1.0.0*
