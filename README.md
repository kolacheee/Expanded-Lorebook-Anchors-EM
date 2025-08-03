# World Info Folders Extension for SillyTavern

This extension adds the ability to create collapsible, draggable folders within the World Info UI to better organize your lorebook entries in SillyTavern.

## Features

- ✅ **Create Folders**: Add named folders to organize your World Info entries
- ✅ **Collapsible**: Expand/collapse folders to save space
- ✅ **Draggable**: Drag and drop both folders and entries to reorganize
- ✅ **Persistent**: Folder structure is saved and restored between sessions
- ✅ **Editable Names**: Click on folder names to rename them
- ✅ **Visual Integration**: Matches SillyTavern's theme and styling

## Installation

### Method 1: Manual Installation

1. Download or clone this extension to your SillyTavern extensions directory:
   ```
   [SillyTavern Directory]/public/scripts/extensions/third-party/World Info Folders/
   ```

2. Ensure the folder structure looks like this:
   ```
   World Info Folders/
   ├── manifest.json
   ├── index.js
   ├── style.css
   ├── img/
   │   └── folder.svg
   └── README.md
   ```

3. Restart SillyTavern or reload the page

4. Go to Extensions > Extension Management and enable "World Info Folders"

### Method 2: Git Clone

```bash
cd [SillyTavern Directory]/public/scripts/extensions/third-party/
git clone [repository-url] "World Info Folders"
```

## Usage Guide

### Creating a New Folder

1. **Navigate to World Info**: Open any character and go to the World Info section
2. **Click "New Folder"**: Look for the folder icon button next to the "New Entry" button
3. **Name Your Folder**: Enter a descriptive name when prompted
4. **Folder Created**: Your new folder will appear at the top of the entries list

### Managing Folders

#### Renaming Folders
- Click directly on the folder name text
- Edit the name inline
- Press Enter or click elsewhere to save

#### Collapsing/Expanding Folders
- Click the triangle arrow (▶) next to the folder name
- Collapsed folders hide their contents to save space
- The arrow rotates to indicate the current state

#### Deleting Folders
- Hover over a folder header to reveal the delete button (×)
- Click the × button
- Confirm deletion when prompted
- **Note**: Entries inside the folder will be moved back to the main list

### Working with Entries

#### Moving Entries to Folders
1. **Drag and Drop**: Click and drag any World Info entry onto a folder
2. **Drop Zone**: You'll see a highlighted drop zone when hovering over a folder
3. **Release**: Drop the entry into the folder content area

#### Moving Entries Between Folders
- Drag entries from one folder and drop them into another
- Entries can also be dragged back to the main list

#### Visual Feedback
- Entries being dragged will appear slightly transparent
- Folders highlight when you're dragging an entry over them
- Drop zones provide clear visual indicators

### Organizing Your World Info

#### Recommended Folder Structure

**By Category:**
- 📁 Characters
- 📁 Locations  
- 📁 Events
- 📁 Items/Objects
- 📁 Rules/Mechanics

**By Story Arc:**
- 📁 Act 1 - Introduction
- 📁 Act 2 - Development
- 📁 Act 3 - Climax
- 📁 Epilogue

**By Relationship:**
- 📁 Family Members
- 📁 Friends
- 📁 Enemies
- 📁 Organizations

### Advanced Tips

#### Keyboard Shortcuts
- **Enter**: Confirm folder name when editing
- **Escape**: Cancel folder name editing (browser dependent)

#### Drag and Drop Tips
- Folders themselves can be dragged to reorder them
- You can drag multiple entries by selecting them (if supported by your browser)
- Hold items briefly before dragging for better control

#### Performance Considerations
- Large numbers of folders (50+) may impact performance
- Consider using nested organizational strategies instead of many top-level folders
- Collapsed folders load faster than expanded ones

## Troubleshooting

### Common Issues

#### Extension Not Loading
- **Check Installation Path**: Ensure the extension is in the correct directory
- **Verify Files**: Make sure all required files (manifest.json, index.js, style.css) are present
- **Reload**: Try refreshing the page or restarting SillyTavern
- **Browser Console**: Check for error messages in the browser's developer console

#### New Folder Button Not Appearing
- **World Info Open**: Make sure you're in the World Info section of a character
- **UI Loaded**: Wait a few seconds for the UI to fully load
- **Extension Enabled**: Verify the extension is enabled in Extension Management

#### Drag and Drop Not Working
- **Browser Compatibility**: Ensure you're using a modern browser (Chrome, Firefox, Edge)
- **JavaScript Enabled**: Verify JavaScript is enabled in your browser
- **Conflicting Extensions**: Try disabling other extensions temporarily to test

#### Folders Not Saving
- **Local Storage**: Check if your browser allows local storage
- **Private Mode**: Folders may not persist in incognito/private browsing mode
- **Storage Quota**: Ensure you haven't exceeded browser storage limits

### Performance Issues

#### Slow Loading
- **Too Many Folders**: Consider consolidating folders if you have many
- **Large Entries**: Very large World Info entries may slow down drag operations
- **Browser Resources**: Close unnecessary tabs and applications

### Debug Mode

To enable debug logging:
1. Open browser developer console (F12)
2. Look for messages starting with `[World Info Folders]`
3. These messages will help identify loading and functionality issues

## Technical Details

### Files Structure

- **manifest.json**: Extension metadata and configuration
- **index.js**: Main extension logic and functionality
- **style.css**: Styling and theme integration
- **img/folder.svg**: Folder icon graphic
- **README.md**: This documentation file

### Data Storage

The extension uses browser localStorage to persist:
- Folder names and IDs
- Folder collapsed/expanded states
- Entry-to-folder associations
- Folder ordering

### Browser Compatibility

**Fully Supported:**
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

**Partially Supported:**
- Older browsers may have limited drag-and-drop functionality

### Extension Dependencies

This extension requires:
- SillyTavern 1.8.0 or later
- Modern browser with ES6 support
- Local storage enabled

## Changelog

### Version 1.0.0
- Initial release
- Basic folder creation and management
- Drag and drop functionality
- Collapsible folders
- Theme integration
- Persistent storage

## Contributing

To contribute to this extension:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with SillyTavern
5. Submit a pull request

### Development Setup

1. Clone the repository into your SillyTavern extensions directory
2. Make changes to the source files
3. Reload SillyTavern to test changes
4. Use browser developer tools for debugging

## Support

If you encounter issues:

1. Check this README for solutions
2. Look for existing issues in the repository
3. Create a new issue with:
   - SillyTavern version
   - Browser and version
   - Detailed description of the problem
   - Console error messages (if any)

## License

This extension is released under the MIT License. See the repository for full license details.

---

**Happy organizing!** 📁✨