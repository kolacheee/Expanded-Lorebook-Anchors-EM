(function () {
    const extensionName = "ExpandedLorebookAnchorsEM";
    const extensionVersion = "1.0.0";
    constSt_settings = {{
        "name": extensionName,
        "version": extensionVersion,
        "is_user_script": true
    }};

    // Part 1: Modify the UI on settings load
    function modifyUI() {
        // Find the original Dialogue Examples container
        const originalContainer = document.querySelector('#dialogue_examples_block');
        if (!originalContainer) {
            console.warn(`${extensionName}: Original dialogue examples block not found.`);
            return;
        }

        // Only run modification if it hasn't been done already
        if (document.querySelector('#dialogue_examples_before_block')) {
            return;
        }

        console.log(`${extensionName}: Modifying UI.`);

        // 1. Rename the existing "Chat Examples" to "Example Messages (after)"
        const originalLabel = originalContainer.querySelector('label[for="dialogue_examples"]');
        if (originalLabel) {
            originalLabel.textContent = "Example Messages (after) (↓EM)";
        }
        const originalTextarea = originalContainer.querySelector('#dialogue_examples');
        if (originalTextarea) {
            // Update associated properties to align with the new preset structure
            originalTextarea.id = "dialogue_examples_after";
            originalTextarea.setAttribute('data-setting', 'dialogueExamples↓');
        }

        // Rename the container itself for clarity
        originalContainer.id = 'dialogue_examples_after_block';

        // 2. Create the new "Example Messages (before)" block
        const beforeContainer = document.createElement('div');
        beforeContainer.id = 'dialogue_examples_before_block';
        beforeContainer.className = 'inline-drawer';

        const beforeLabel = document.createElement('label');
        beforeLabel.setAttribute('for', 'dialogue_examples_before');
        beforeLabel.textContent = "Example Messages (before) (↑EM)";
        beforeLabel.style.marginTop = '10px'; // Add some spacing

        const beforeTextarea = document.createElement('textarea');
        beforeTextarea.id = 'dialogue_examples_before';
        beforeTextarea.className = 'text_pole';
        beforeTextarea.setAttribute('rows', '8');
        beforeTextarea.setAttribute('data-setting', 'dialogueExamples↑'); // This is the key for preset saving

        beforeContainer.appendChild(beforeLabel);
        beforeContainer.appendChild(beforeTextarea);

        // 3. Insert the new block before the 'after' block
        originalContainer.parentNode.insertBefore(beforeContainer, originalContainer);

        // Re-initialize event listeners for the new textarea
        $(beforeTextarea).on('input', function () {
            const preset = get_current_preset_name();
            const value = $(this).val();
            const setting = $(this).data('setting');
            if (preset) {
                set_preset_value(preset, setting, value, false);
            }
        });

        // Add a mutation observer to ensure our changes stick, especially after UI reloads/character changes
        const parentOfContainers = originalContainer.parentNode;
        const observer = new MutationObserver((mutationsList, observer) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // If the original block is re-added, re-run our modification logic
                    if (!document.querySelector('#dialogue_examples_before_block') && document.querySelector('#dialogue_examples_block')) {
                         modifyUI();
                         // We can disconnect after re-running to prevent infinite loops, or be more selective.
                         // For now, this is simple and effective.
                    }
                }
            }
        });
        observer.observe(parentOfContainers, { childList: true, subtree: true });
    }

    function addPresetIntegration() {
        if (typeof get_preset_value !== 'function' || typeof set_preset_value !== 'function') {
            console.warn(`${extensionName}: Preset functions not available.`);
            return;
        }

        // Override the function that populates textareas to include our new fields
        const originalPopulate = window.populate_preset_textareas;
        window.populate_preset_textareas = function(preset) {
            // Call the original function first
            originalPopulate.apply(this, arguments);

            // Now, handle our custom fields
            const beforeValue = get_preset_value(preset, "dialogueExamples↑", "");
            $('#dialogue_examples_before').val(beforeValue);

            // The original function handles the old 'dialogueExamples'. We need to make sure
            // presets using the new format 'dialogueExamples↓' also work.
            const afterValue = get_preset_value(preset, "dialogueExamples↓", null);
            if (afterValue !== null) {
                // If the preset has the new key, use it.
                 $('#dialogue_examples_after').val(afterValue);
            } else {
                 // Fallback for older presets: if 'dialogueExamples↓' doesn't exist,
                 // the original function will have already populated it from 'dialogueExamples'.
            }
        };

        if (Array.isArray(window.preset_settings_fields)) {
            if (!window.preset_settings_fields.includes("dialogueExamples↑")) {
                window.preset_settings_fields.push("dialogueExamples↑");
            }
            if (!window.preset_settings_fields.includes("dialogueExamples↓")) {
                window.preset_settings_fields.push("dialogueExamples↓");
            }
        }
    }

    // Part 3: Execute the script
    $(document).ready(function () {
        // Use a small delay to ensure the UI is fully loaded
        setTimeout(function() {
            modifyUI();
            addPresetIntegration();

            $(document).on('settings_changed', function() {
                modifyUI();
            });
        }, 500);
    });
})();
