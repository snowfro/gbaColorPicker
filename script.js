document.addEventListener('DOMContentLoaded', () => {
    const svBox = document.getElementById('saturation-value-box');
    const hueSlider = document.getElementById('hue-slider');
    const hueBlocksContainer = document.getElementById('hue-blocks-container');
    const colorPreview = document.getElementById('selected-color-preview');
    const value15bitSpan = document.getElementById('selected-color-value-15bit');
    const valueHex8bitSpan = document.getElementById('selected-color-value-hex8bit');
    const valueRgb8bitSpan = document.getElementById('selected-color-value-rgb8bit');

    // Restore HSV state variables
    let hue = 0; // 0-360
    let saturation = 0; // 0-1 (Start at black/grey corner)
    let value = 0; // 0-1
    const numHueBlocks = 32;
    const numSvBlocksPerSide = 32;
    let currentHueBlockIndex = 0; // ADDED: Track selected hue block index

    let isDraggingHue = false;
    let isDraggingSV = false; // Need this back for SV box dragging

    // --- Color Conversion Functions ---

    // Restore hsvToRgb
    function hsvToRgb(h, s, v) {
        let r, g, b;
        let i = Math.floor(h / 60);
        let f = h / 60 - i;
        let p = v * (1 - s);
        let q = v * (1 - f * s);
        let t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // Restore rgb8ToGbaRgb5
    function rgb8ToGbaRgb5(r8, g8, b8) {
        const r5 = Math.round(r8 / 255 * 31);
        const g5 = Math.round(g8 / 255 * 31);
        const b5 = Math.round(b8 / 255 * 31);
        return {
            r5: Math.max(0, Math.min(31, r5)),
            g5: Math.max(0, Math.min(31, g5)),
            b5: Math.max(0, Math.min(31, b5))
        };
    }

    // gbaRgb5ToRgb8 remains the same
    function gbaRgb5ToRgb8(r5, g5, b5) {
        const r8 = (r5 << 3) | (r5 >> 2);
        const g8 = (g5 << 3) | (g5 >> 2);
        const b8 = (b5 << 3) | (b5 >> 2);
        return { r: r8, g: g8, b: b8 };
    }

    // gbaRgb5ToHex15 remains the same
    function gbaRgb5ToHex15(r5, g5, b5) {
        const value15bit = (b5 << 10) | (g5 << 5) | r5;
        return `0x${value15bit.toString(16).toUpperCase().padStart(4, '0')}`;
    }

    // --- UI Update Function ---

    // MODIFIED: Updates based on current HSV, displays nearest GBA
    function updateColorDisplay() {
        // Calculate the target 8-bit color based on HSV state
        const rgb8Target = hsvToRgb(hue, saturation, value);

        // Find the nearest GBA 5-bit components
        const gba5 = rgb8ToGbaRgb5(rgb8Target.r, rgb8Target.g, rgb8Target.b);

        // Convert the *actual GBA color* back to 8-bit for display
        const gba8Display = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);

        // Get 15-bit hex value of the GBA color
        const hex15 = gbaRgb5ToHex15(gba5.r5, gba5.g5, gba5.b5);

        // ADDED: Convert 8-bit GBA color components to standard hex
        const rHex = gba8Display.r.toString(16).padStart(2, '0');
        const gHex = gba8Display.g.toString(16).padStart(2, '0');
        const bHex = gba8Display.b.toString(16).padStart(2, '0');
        const hex8bit = `#${rHex}${gHex}${bHex}`.toUpperCase();

        // Update preview and text
        colorPreview.style.backgroundColor = `rgb(${gba8Display.r}, ${gba8Display.g}, ${gba8Display.b})`;
        value15bitSpan.textContent = hex15;
        valueHex8bitSpan.textContent = hex8bit;
        valueRgb8bitSpan.textContent = `(RGB: ${gba8Display.r}, ${gba8Display.g}, ${gba8Display.b})`;
    }

    // --- Grid Generation ---

    // MODIFIED: Generates SV grid based on *current hue*
    // Displays nearest GBA color for each S/V block position
    function generateSvGrid(currentHue) {
        svBox.innerHTML = ''; // Clear previous grid
        const fragment = document.createDocumentFragment();

        for (let vStep = 0; vStep < numSvBlocksPerSide; vStep++) { // Value rows (0=bottom, 31=top)
            for (let sStep = 0; sStep < numSvBlocksPerSide; sStep++) { // Saturation columns (0=left, 31=right)
                const blockSat = sStep / (numSvBlocksPerSide - 1);
                const blockVal = (numSvBlocksPerSide - 1 - vStep) / (numSvBlocksPerSide - 1); // Invert vStep for top=high

                const block = document.createElement('div');
                block.classList.add('sv-block');

                // Calculate target color for this S/V position
                const rgb8Target = hsvToRgb(currentHue, blockSat, blockVal);
                // Find nearest GBA color
                const gba5 = rgb8ToGbaRgb5(rgb8Target.r, rgb8Target.g, rgb8Target.b);
                // Get displayable 8-bit version of the GBA color
                const gba8Display = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);

                block.style.backgroundColor = `rgb(${gba8Display.r}, ${gba8Display.g}, ${gba8Display.b})`;

                // Store the *target* S/V values this block represents
                block.dataset.sat = blockSat.toFixed(5); // Store as string
                block.dataset.val = blockVal.toFixed(5);

                // Remove old listener, add listener to update S/V state on click
                // block.addEventListener('mousedown', svBlockClickHandler);

                fragment.appendChild(block);
            }
        }
        svBox.appendChild(fragment);
    }

    // MODIFIED: Generate Hue slider blocks (full spectrum)
    function generateHueBlocks() {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < numHueBlocks; i++) {
            // Calculate hue for the middle of the block
            const blockHue = (i + 0.5) / numHueBlocks * 360;
            // Find the nearest GBA color at full saturation/value for this hue
            const rgb8Target = hsvToRgb(blockHue, 1, 1);
            const gba5 = rgb8ToGbaRgb5(rgb8Target.r, rgb8Target.g, rgb8Target.b);
            const gba8Display = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);

            const block = document.createElement('div');
            block.classList.add('hue-block');
            block.style.backgroundColor = `rgb(${gba8Display.r}, ${gba8Display.g}, ${gba8Display.b})`;
            // Store the representative hue for this block
            block.dataset.hue = blockHue;

            fragment.appendChild(block);
        }
        hueBlocksContainer.appendChild(fragment);
    }

    // --- Event Handlers ---

    // ADDED: Handles clicks and drags on the SV box
    function handleSvUpdate(event) {
        const rect = svBox.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        x = Math.max(0, Math.min(rect.width, x));
        y = Math.max(0, Math.min(rect.height, y));

        // Update saturation and value state based on position
        saturation = x / rect.width;
        value = 1 - (y / rect.height); // Y=0 is top, corresponds to Value=1

        updateColorDisplay(); // Update preview based on new S/V
    }

    // MODIFIED: Updates hue state ONLY when block index changes
    function handleHueUpdate(event) {
        const rect = hueSlider.getBoundingClientRect();
        let y = event.clientY - rect.top;
        y = Math.max(0, Math.min(rect.height - 1, y)); // Clamp to valid range

        // Calculate the index of the block the cursor is currently over
        const blockIndex = Math.floor((y / rect.height) * numHueBlocks);

        // Only proceed if the block index has changed
        if (blockIndex !== currentHueBlockIndex) {
            currentHueBlockIndex = blockIndex; // Update the tracked index

            // Calculate the representative hue for the center of the new block
            const newHue = (currentHueBlockIndex + 0.5) / numHueBlocks * 360;
            hue = Math.max(0, Math.min(360, newHue));
            if (hue >= 360) hue = 0; // Wrap around just in case

            // Regenerate SV grid for the new hue
            generateSvGrid(hue);
            updateColorDisplay(); // Update preview based on new Hue
        }
    }

    // Add listeners for SV Box dragging
    svBox.addEventListener('mousedown', (e) => {
        isDraggingSV = true;
        handleSvUpdate(e);
    });

    // Hue Slider listeners
    hueSlider.addEventListener('mousedown', (e) => {
        isDraggingHue = true;
        // Trigger initial update immediately on mousedown
        // handleHueUpdate will check if the block actually changed
        handleHueUpdate(e);
    });

    // Global listeners for dragging
    window.addEventListener('mousemove', (e) => {
        if (isDraggingSV) {
            handleSvUpdate(e);
        }
        if (isDraggingHue) {
            // handleHueUpdate now includes the check, safe to call repeatedly
            handleHueUpdate(e);
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingSV = false;
        isDraggingHue = false;
    });

    // --- Initial Setup ---
    // Initialize the index based on the starting hue (0)
    currentHueBlockIndex = Math.floor((hue / 360) * numHueBlocks);
    generateHueBlocks();
    generateSvGrid(hue); // Generate initial grid for Hue=0
    updateColorDisplay(); // Update display for initial state
}); 