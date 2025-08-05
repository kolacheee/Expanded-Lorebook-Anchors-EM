(function () {
    // Function to create the "New Folder" button and add it to the UI
    function addFolderUI() {
        // Create the button element with inline styles to ensure visibility
        const newFolderButton = document.createElement('div');
        newFolderButton.id = 'wif_new_folder_btn';
        newFolderButton.className = 'menu_button';
        newFolderButton.title = 'New Folder';
        newFolderButton.innerHTML = `
            <i class="fa-solid fa-folder-plus"></i>
            <span>New Folder</span>
        `;
        newFolderButton.style.display = 'inline-block';
        newFolderButton.style.visibility = 'visible';

        // Attach the click event listener
        newFolderButton.addEventListener('click', createNewFolder);

        // Find the "New Entry" button and insert the "New Folder" button after it
        const newEntryButton = document.getElementById('world_info_new_entry');
        if (newEntryButton && newEntryButton.parentNode) {
            newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);
            console.log('World Info Folders: "New Folder" button added successfully.');
        } else {
            console.error('World Info Folders: Could not find the "New Entry" button to anchor the "New Folder" button.');
        }
    }

    // The function to create a new folder, recovered from index.js
    function createNewFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        const FOLDER_PREFIX = 'wif_folder_';
        const newFolderUid = `${FOLDER_PREFIX}${Date.now()}`;
        const newFolderEntry = {
            uid: newFolderUid,
            key: [],
            keysecondary: [],
            comment: `Folder: ${folderName}`,
            content: '',
            constant: false,
            selective: true,
            order: Object.keys(window.world_info.entries).length,
            position: 0,
            disable: false,
            addMemo: false,
            excludeRecursion: false,
            delayUntilRecursion: false,
            displayIndex: Object.keys(window.world_info.entries).length,
            probability: 100,
            useProbability: false,
            group: '',
            groupOverride: false,
            groupWeight: 100,
            scanDepth: null,
            caseSensitive: null,
            matchWholeWords: null,
            useGroupScoring: null,
            automationId: '',
            role: 0,
            vectorized: false,
            folder: true,
            folderName: folderName,
            folderExpanded: true,
            folderIcon: 'fa-folder',
        };

        window.world_info.entries[newFolderUid] = newFolderEntry;
        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);
        console.log('World Info Folders: Created new folder:', folderName);
    }

    // Robustly wait for SillyTavern's dependencies to be ready
    function waitForDependencies() {
        const interval = setInterval(() => {
            if (
                typeof $ !== 'undefined' &&
                typeof window.world_info !== 'undefined' &&
                typeof window.eventSource !== 'undefined' &&
                typeof window.event_types !== 'undefined' &&
                typeof window.saveSettingsDebounced !== 'undefined' &&
                document.getElementById('world_info_new_entry') // Also wait for the anchor element to exist
            ) {
                clearInterval(interval);
                // Only add the button if it doesn't already exist
                if (!document.getElementById('wif_new_folder_btn')) {
                    addFolderUI();
                }
            }
        }, 250); // Check every 250ms
    }

    // Start the process
    waitForDependencies();
})();
