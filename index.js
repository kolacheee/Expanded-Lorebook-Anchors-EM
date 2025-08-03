(function() {
    'use strict';
    
    console.log('World Info Folders: Extension starting...');
    
    // Simple polling function to wait for elements
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const element = document.querySelector(selector);
            
            if (element) {
                clearInterval(interval);
                console.log(`World Info Folders: Found ${selector} after ${attempts} attempts`);
                callback(element);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.log(`World Info Folders: Could not find ${selector} after ${maxAttempts} attempts`);
            }
        }, 200);
    }
    
    function createFolderButton() {
        console.log('World Info Folders: Creating folder button...');
        
        const newEntryButton = document.querySelector('#world_info_new');
        if (!newEntryButton) {
            console.log('World Info Folders: New entry button not found');
            return;
        }
        
        // Check if button already exists
        if (document.querySelector('#world_info_new_folder')) {
            console.log('World Info Folders: Button already exists');
            return;
        }
        
        // Create the button element
        const folderButton = document.createElement('div');
        folderButton.id = 'world_info_new_folder';
        folderButton.className = 'menu_button';
        folderButton.title = 'Create New Folder';
        folderButton.innerHTML = '📁'; // Using emoji as fallback
        folderButton.style.cssText = `
            display: inline-block;
            margin-left: 10px;
            padding: 8px;
            cursor: pointer;
            background: var(--main-text);
            color: var(--main-bg);
            border-radius: 4px;
            font-size: 16px;
            line-height: 1;
            vertical-align: middle;
        `;
        
        // Insert the button
        newEntryButton.parentNode.insertBefore(folderButton, newEntryButton.nextSibling);
        
        console.log('World Info Folders: Button created and inserted');
        
        // Add click handler
        folderButton.addEventListener('click', function() {
            console.log('World Info Folders: Button clicked');
            createFolder();
        });
        
        return folderButton;
    }
    
    function createFolder() {
        console.log('World Info Folders: Creating new folder...');
        
        const entriesList = document.querySelector('#world_info_entries_list');
        if (!entriesList) {
            console.log('World Info Folders: Entries list not found');
            return;
        }
        
        // Create folder container
        const folder = document.createElement('div');
        folder.className = 'world-info-folder';
        folder.style.cssText = `
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-bottom: 8px;
            background: var(--secondary-bg);
        `;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'world-info-folder-header';
        header.style.cssText = `
            padding: 8px 12px;
            background: var(--tertiary-bg);
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        `;
        
        // Create folder name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'world-info-folder-name';
        nameSpan.textContent = 'New Folder';
        nameSpan.contentEditable = true;
        nameSpan.style.cssText = `
            font-weight: 500;
            color: var(--main-text);
            outline: none;
            border: none;
            background: transparent;
            flex: 1;
        `;
        
        // Create toggle indicator
        const toggle = document.createElement('span');
        toggle.textContent = '▼';
        toggle.style.cssText = `
            color: var(--main-text);
            font-size: 12px;
            margin-left: 8px;
        `;
        
        header.appendChild(nameSpan);
        header.appendChild(toggle);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'world-info-folder-content';
        content.style.cssText = `
            padding: 8px;
            background: var(--secondary-bg);
            min-height: 40px;
            display: block;
        `;
        content.innerHTML = '<div style="color: var(--secondary-text); font-style: italic; text-align: center; padding: 20px;">Drag world info entries here</div>';
        
        // Add toggle functionality
        header.addEventListener('click', function(e) {
            if (e.target === nameSpan) return; // Don't toggle when editing name
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.textContent = '▼';
            } else {
                content.style.display = 'none';
                toggle.textContent = '▶';
            }
        });
        
        // Handle name editing
        nameSpan.addEventListener('blur', function() {
            if (!nameSpan.textContent.trim()) {
                nameSpan.textContent = 'New Folder';
            }
        });
        
        nameSpan.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameSpan.blur();
            }
        });
        
        // Assemble folder
        folder.appendChild(header);
        folder.appendChild(content);
        
        // Add to entries list
        entriesList.insertBefore(folder, entriesList.firstChild);
        
        console.log('World Info Folders: Folder created successfully');
        
        // Focus name for editing
        setTimeout(() => {
            nameSpan.focus();
            const range = document.createRange();
            range.selectNodeContents(nameSpan);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }, 100);
    }
    
    // Initialize extension
    function init() {
        console.log('World Info Folders: Initializing...');
        
        // Wait for the world info new button to appear
        waitForElement('#world_info_new', function() {
            console.log('World Info Folders: World info panel found, creating button...');
            createFolderButton();
        });
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('World Info Folders: Extension loaded');
})();