# World Info Folders Extension

This extension for SillyTavern adds the ability to create collapsible, nameable, and draggable folders within the World Info tab. This helps organize your lorebook entries more effectively.

## Features

*   **Create Folders:** Add new folders to your World Info tab.
*   **Nameable:** Give each folder a unique name.
*   **Collapsible:** Expand or collapse folders to keep your workspace tidy.
*   **Draggable:** Drag and drop folders and lorebook entries to reorder them. Entries can be dragged into and out of folders.

## Installation

1.  **Download:** Place the `world-info-folders` directory into your `SillyTavern/public/scripts/extensions` directory.
2.  **Enable:**
    *   Start SillyTavern.
    *   Go to the Extensions panel (the puzzle piece icon).
    *   Find "World Info Folders" in the list and enable it.
3.  **Refresh:** Reload the SillyTavern UI.

## How to Use

### Creating a Folder

1.  Navigate to the "World Info" tab (the book icon).
2.  Next to the "New Entry" button, you will see a new folder icon. Click this button to create a new folder.
3.  A new folder named "New Folder" will appear at the top of your World Info entries.

### Naming a Folder

*   Click on the text "New Folder" inside the folder's header.
*   An input field will appear, allowing you to type a new name for the folder.
*   Press Enter or click outside the input field to save the new name.

### Collapsing and Expanding a Folder

*   Click anywhere on the folder's header (except on the name when you're editing it) to toggle it between collapsed and expanded states.
*   When a folder is collapsed, its contents (the lorebook entries inside) will be hidden.

### Organizing Entries and Folders

*   **Moving Entries into Folders:** Drag any lorebook entry and drop it inside the content area of an expanded folder.
*   **Moving Entries Out of Folders:** Drag an entry from within a folder and drop it outside, among other entries or into another folder.
*   **Reordering Folders:** Drag a folder by its header and drop it to a new position in the list of entries and other folders.

## Notes

*   This extension relies on the existing Drag and Drop functionality provided by SillyTavern and the SortableJS library.
*   The folder icon color is designed to match your SillyTavern theme's main text color. If it doesn't display correctly, you may need to adjust the `filter` property in the `style.css` file.