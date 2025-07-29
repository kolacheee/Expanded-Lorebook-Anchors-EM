(function () {
    const extensionName = "ExpandedLorebookAnchorsEM";
    const extensionVersion = "1.0.0";
    const extensionAuthor = "kolache & pancat";

    // Data keys for saving/loading
    const KEY_BEFORE_EXAMPLES = 'dialogueExamples_before'; // Corresponds to ↑EM
    const KEY_AFTER_EXAMPLES = 'dialogueExamples_after';   // Corresponds to ↓EM / original dialogueExamples

    let characterComment = ''; // To store the original character comment

    // Function to log messages to the console for debugging
    function log(message) {
        console.log(`[${extensionName}] ${message}`);
    }

    // Main mutation function to alter the UI
    function alterChatExampleUI() {
        // Target the container for the "AI Response Configuration" section
        const responseConfigContainer = document.querySelector('#response_config');
        if (!responseConfigContainer) {
            //log("Response config container not found. Retrying...");
            return false;
        }

        // Find the original 'Chat Examples' textarea and its container
        const originalTextarea = document.querySelector('#dialogue_examples');
        const originalFormGroup = originalTextarea?.closest('.form-group');

        if (!originalTextarea || !originalFormGroup) {
            //log("Original 'Chat Examples' elements not found. Retrying...");
            return false;
        }

        // Check if our extension has already run to prevent duplication
        if (document.querySelector('#dialogue_examples_before')) {
            //log("UI already altered. Skipping.");
            return true;
        }

        log("Found target elements. Proceeding with UI modification.");

        // 1. Rename the existing "Chat Examples" to "Example Messages (after)"
        const originalLabel = originalFormGroup.querySelector('label[for="dialogue_examples"]');
        if (originalLabel) {
            originalLabel.textContent = 'Example Messages (after)';
            log("Renamed original label.");
        }
        originalTextarea.setAttribute('placeholder', 'Example dialogue placed *after* lorebook entries using ↑EM and before entries using ↓EM.');

        // 2. We need to handle the character comment. SillyTavern uses this to populate the text area.
        // The original logic is tied to `characters[selected_character].data.description`. We'll need to separate them.
        characterComment = characters[selected_character]?.data?.comment || '';

        // 3. Create the new "Example Messages (before)" section
        const newFormGroup = document.createElement('div');
        newFormGroup.className = 'form-group';

        const newLabel = document.createElement('label');
        newLabel.setAttribute('for', 'dialogue_examples_before');
        newLabel.textContent = 'Example Messages (before)';

        const newTextarea = document.createElement('textarea');
        newTextarea.id = 'dialogue_examples_before';
        newTextarea.className = 'text_pole';
        newTextarea.setAttribute('rows', '8');
        newTextarea.setAttribute('placeholder', 'Example dialogue placed *before* all other example-related lorebook entries (those using ↑EM and ↓EM).');

        newFormGroup.appendChild(newLabel);
        newFormGroup.appendChild(newTextarea);

        // 4. Insert the new section before the original one
        originalFormGroup.parentNode.insertBefore(newFormGroup, originalFormGroup);
        log("Created and inserted 'Example Messages (before)' UI components.");

        // 5. Add event listener to the new textarea to save its content
        newTextarea.addEventListener('change', () => {
            if (selected_character !== -1) {
                characters[selected_character].data[KEY_BEFORE_EXAMPLES] = newTextarea.value;
                log(`Saved content for 'before' examples for character: ${characters[selected_character].data.name}`);
            }
        });

        // 6. Modify the original textarea's change event to save to the correct key (`comment`)
        // The original saves to `.comment` not `.dialogue_examples` in character data, so we must respect that.
        originalTextarea.addEventListener('change', () => {
             if (selected_character !== -1) {
                // The original/after examples are stored in the character comment field.
                characters[selected_character].data.comment = originalTextarea.value;
                log(`Saved content for 'after' examples to character comment for: ${characters[selected_character].data.name}`);
            }
        });


        // Now, we need to load the correct data into the textareas.
        loadDataIntoFields();

        return true;
    }

    // Function to load data when a character is loaded or UI is first drawn
    function loadDataIntoFields() {
        if (selected_character === -1) return;

        const charData = characters[selected_character].data;
        log(`Loading data for character: ${charData.name}`);

        const beforeTextarea = document.querySelector('#dialogue_examples_before');
        const afterTextarea = document.querySelector('#dialogue_examples'); // This is the original textarea

        if (beforeTextarea) {
            beforeTextarea.value = charData[KEY_BEFORE_EXAMPLES] || '';
            log("Loaded 'before' examples data.");
        }

        if (afterTextarea) {
            // The "after" examples are stored in the character's comment section.
            afterTextarea.value = charData.comment || '';
            log("Loaded 'after' examples data from character comment.");
        }
    }


    // Function to populate generation settings (like presets) from loaded data
    function populateGenerationSettings(settings) {
        log("Populating generation settings from preset.");
        const beforeTextarea = document.querySelector('#dialogue_examples_before');

        if(settings.dialogueExamples_before) {
            log("Preset contains 'dialogueExamples_before'.");
            if (beforeTextarea) {
                beforeTextarea.value = settings.dialogueExamples_before;
                beforeTextarea.dispatchEvent(new Event('change'));
            } else {
                // If UI isn't ready, store it temporarily
                if (selected_character !== -1) {
                    characters[selected_character].data[KEY_BEFORE_EXAMPLES] = settings.dialogueExamples_before;
                }
            }
        }
        // The original 'dialogueExamples' or 'comment' in a preset will be handled by SillyTavern's core logic for the 'after' field.
    }


    // Function to update generation settings before saving (to a preset)
    function updateGenerationSettings(settings) {
        log("Updating generation settings for saving.");
        const beforeTextarea = document.querySelector('#dialogue_examples_before');
        if (beforeTextarea) {
            settings.dialogueExamples_before = beforeTextarea.value;
        }

        // We don't need to add `dialogueExamples` or `comment` here because SillyTavern's core save logic already handles it.
        return settings;
    }

    // Overriding the function that formats the context
    // This is the core logic that makes the ↑EM anchor work correctly.
    const originalFormatContent = window.formatContent;
    window.formatContent = function(context, main_api, is_instruct) {
        if (selected_character !== -1) {
            const charData = characters[selected_character].data;
            const beforeExamples = charData[KEY_BEFORE_EXAMPLES] || '';

            if (beforeExamples.trim() !== '') {
                log("Injecting 'before' examples into the context.");
                const beforeExamplesBlock = `\n${beforeExamples.trim()}\n`;
                // We find the ↑EM marker and prepend our text to it.
                // This ensures anything in the lorebook set to ↑EM still appears after this block.
                context = context.replace(new RegExp(lorebook_entries_placement_regex.em_0, "g"), `${beforeExamplesBlock}${lorebook_entries_placement_string.em_0}`);
            }
        }
        // Call the original function to handle the rest of the formatting, including ↓EM.
        return originalFormatContent(context, main_api, is_instruct);
    };

    // Use a MutationObserver to watch for when the relevant UI elements are added to the DOM.
    // This is more robust than a simple `setInterval`.
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (alterChatExampleUI()) {
                    observer.disconnect(); // Stop observing once we've successfully modified the UI.
                    log("UI modification complete. Observer disconnected.");
                }
            }
        }
    });

    // Start observing the main application container for changes.
    observer.observe(document.getElementById('app'), { childList: true, subtree: true });

    // We also need to re-apply data loading when the character changes.
    $(document).on('characterSelected', loadDataIntoFields);

    // Hook into SillyTavern's preset loading/saving mechanisms.
    // These events are custom to SillyTavern.
    $(document).on('generationSettingsApplied', (event, settings) => {
        populateGenerationSettings(settings);
    });

    $(document).on('generationSettingsUpdated', (event, settings) => {
        updateGenerationSettings(settings);
    });

    log(`Extension ${extensionName} v${extensionVersion} by ${extensionAuthor} loaded.`);
})();
