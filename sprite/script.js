document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    const onionSkinCanvas = document.getElementById('onion-skin-canvas');
    const onionSkinCtx = onionSkinCanvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    const pencilToolBtn = document.getElementById('pencil-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const undoButton = document.getElementById('undo-button');
    const eyedropperToolBtn = document.getElementById('eyedropper-tool');
    
    // Animation Controls
    const frameABtn = document.getElementById('frame-a-btn');
    const frameBBtn = document.getElementById('frame-b-btn');
    const copyFrameBtn = document.getElementById('copy-frame-btn');
    const animatePreviewBtn = document.getElementById('animate-preview-btn');
    const onionSkinBtn = document.getElementById('onion-skin-btn');
    
    const downloadPngBtn = document.getElementById('download-png');
    const downloadBitmapBtn = document.getElementById('download-bitmap-btn');
    const uploadBitmapBtn = document.getElementById('upload-bitmap-btn');
    const bitmapFileInput = document.getElementById('bitmap-file-input');
    const artworkTitleElement = document.getElementById('artwork-title');

    // Color Info Display (from limited/script.js)
    const selectedColorPreview = document.getElementById('selected-color-preview');
    const value15bitSpan = document.getElementById('selected-color-value-15bit');
    const valueHex8bitSpan = document.getElementById('selected-color-value-hex8bit');
    const valueRgb8bitSpan = document.getElementById('selected-color-value-rgb8bit');
    const generalHuePalettesDisplay = document.getElementById('general-hue-palettes-display');

    // Used Colors Palette (from draw/script.js)
    const usedColorsGrid = document.getElementById('used-colors-grid');

    // --- Fixed Sprite Dimensions ---
    const GRID_WIDTH = 16;
    const GRID_HEIGHT = 32;
    const PIXEL_SIZE = 20; // Display size of each pixel on canvas

    // Fallback hardcoded array (used only if JSON loading fails)
  

    // Global palette array - will be loaded from JSON
    let GBA_FULL_PALETTE_ARRAY = null;

    // --- JSON Palette Loading ---
    async function loadPaletteFromJSON() {
        try {
            const response = await fetch('gba_full_palette_set_final.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            GBA_FULL_PALETTE_ARRAY = await response.json();
            console.log(`✅ Loaded ${GBA_FULL_PALETTE_ARRAY.length} colors from JSON`);
            return true;
        } catch (error) {
            console.error('❌ Failed to load palette JSON:', error);
            console.error('❌ No fallback palette available - sprite tool may not work properly');
            alert('Failed to load color palette! Please ensure gba_full_palette_set_final.json is in the sprite directory.');
            return false;
        }
    }

    // --- State Variables (from draw/script.js, adapted) ---
    let selectedTool = 'pencil';
    let isDrawing = false;
    let pixelGrid;
    let usedColors = new Set(); // Stores 15-bit hex strings of used colors
    let currentGba5Color = { r5: 0, g5: 0, b5: 0 }; // Default to black
    let currentDisplayRgb8Color = {r:0, g:0, b:0};

    // Undo/Redo 
    let history = [];
    const MAX_HISTORY = 20;

    // --- Animation Variables ---
    let frameAData = null; // 2D array for frame A
    let frameBData = null; // 2D array for frame B
    let frameAUsedColors = new Set(); // Used colors for frame A
    let frameBUsedColors = new Set(); // Used colors for frame B
    let frameAHistory = []; // Undo history for frame A
    let frameBHistory = []; // Undo history for frame B
    let currentFrame = 'A'; // 'A' or 'B'
    let onionSkinEnabled = false;
    let isAnimating = false;
    let animationInterval = null;

    // --- Color Conversion Functions (Shared) ---
    function hsvToRgb(h, s, v) { /* ... from limited/script.js ... */ 
        let r, g, b; let i = Math.floor(h / 60); let f = h / 60 - i; let p = v * (1 - s); let q = v * (1 - f * s); let t = v * (1 - (1 - f) * s);
        switch (i % 6) { case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break; }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    function rgb8ToGbaRgb5(r8, g8, b8) { /* ... from limited/script.js ... */
        const r5 = Math.round(r8 / 255 * 31); const g5 = Math.round(g8 / 255 * 31); const b5 = Math.round(b8 / 255 * 31);
        return { r5: Math.max(0, Math.min(31, r5)), g5: Math.max(0, Math.min(31, g5)), b5: Math.max(0, Math.min(31, b5)) };
    }
    function gbaRgb5ToRgb8(r5, g5, b5) { /* ... from limited/script.js ... */
        const r8 = (r5 << 3) | (r5 >> 2); const g8 = (g5 << 3) | (g5 >> 2); const b8 = (b5 << 3) | (b5 >> 2);
        return { r: r8, g: g8, b: b8 };
    }
    function gbaRgb5ToHex15(r5, g5, b5) { /* ... from limited/script.js ... */
        const value15bit = (b5 << 10) | (g5 << 5) | r5; return `0x${value15bit.toString(16).toUpperCase().padStart(4, '0')}`;
    }
    function gbaHex15ToInt(hex15) { return parseInt(hex15, 16); }
    function gbaIntToGba5(int15) { return { r5: int15 & 0x1F, g5: (int15 >> 5) & 0x1F, b5: (int15 >> 10) & 0x1F };}

    // --- Selected Color Info Update (from limited/script.js, modified) ---
    function updateSelectedColorDisplay(gba5Color, displayRgb8Color) {
        currentGba5Color = gba5Color;
        currentDisplayRgb8Color = displayRgb8Color;
        selectedColorPreview.style.backgroundColor = `rgb(${displayRgb8Color.r}, ${displayRgb8Color.g}, ${displayRgb8Color.b})`;
        value15bitSpan.textContent = gbaRgb5ToHex15(gba5Color.r5, gba5Color.g5, gba5Color.b5);
        const rHex = displayRgb8Color.r.toString(16).padStart(2, '0');
        const gHex = displayRgb8Color.g.toString(16).padStart(2, '0');
        const bHex = displayRgb8Color.b.toString(16).padStart(2, '0');
        valueHex8bitSpan.textContent = `#${rHex}${gHex}${bHex}`.toUpperCase();
        valueRgb8bitSpan.textContent = `(RGB: ${displayRgb8Color.r}, ${displayRgb8Color.g}, ${displayRgb8Color.b})`;
    }

    // --- Palette Generation (now uses JSON directly) ---
    // Note: All palette colors are now loaded from JSON file
    // No more algorithmic generation or special replacements needed

    function createPaletteColorBlock(gba5Color, displayRgb8Color) {
        const block = document.createElement('div');
        block.classList.add('color-block');
        block.style.backgroundColor = `rgb(${displayRgb8Color.r}, ${displayRgb8Color.g}, ${displayRgb8Color.b})`;
        block.title = `${gbaRgb5ToHex15(gba5Color.r5, gba5Color.g5, gba5Color.b5)} (R:${gba5Color.r5}, G:${gba5Color.g5}, B:${gba5Color.b5})`;
        block.addEventListener('click', () => {
            updateSelectedColorDisplay(gba5Color, displayRgb8Color);
        });
        return block;
    }

    function generateGeneralHuePalettes() {
        if (!generalHuePalettesDisplay) return;
        if (!GBA_FULL_PALETTE_ARRAY) {
            console.error('❌ Cannot generate palettes - JSON not loaded yet');
            return;
        }
        
        generalHuePalettesDisplay.innerHTML = '';

        // Generate only palettes 6-15 (indices 96-255) - these are available for sprite drawing
        for (let paletteIdx = 6; paletteIdx < 16; paletteIdx++) {
            const paletteGroup = document.createElement('div');
            paletteGroup.classList.add('palette-group');
            
            const titleDiv = document.createElement('div');
            titleDiv.classList.add('palette-title');
            
            // Use descriptive names for palettes 6-15 (sprite-available palettes)
            const paletteNames = [
                "Reds", "Oranges", "Yellows", "Lime Greens", "Green-Cyans",
                "Cyans", "Azures", "Blues", "Violets", "Magentas"
            ];
            // Adjust index since we're starting from palette 6 but array starts at 0
            const nameIndex = paletteIdx - 6;
            titleDiv.textContent = paletteNames[nameIndex] || `Palette ${paletteIdx}`;
            paletteGroup.appendChild(titleDiv);
            
            const paletteGrid = document.createElement('div');
            paletteGrid.classList.add('palette-grid');

            // Add 16 colors from this palette (indices paletteIdx*16 to paletteIdx*16+15)
            for (let colorIdx = 0; colorIdx < 16; colorIdx++) {
                const globalIndex = paletteIdx * 16 + colorIdx;
                
                if (globalIndex < GBA_FULL_PALETTE_ARRAY.length) {
                    const hexColor = GBA_FULL_PALETTE_ARRAY[globalIndex];
                    const colorInt = gbaHex15ToInt(hexColor);
                    const gba5 = gbaIntToGba5(colorInt);
                    const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                    
                    const colorBlock = createPaletteColorBlock(gba5, rgb8);
                    colorBlock.title = `Index ${globalIndex}: ${hexColor} (R:${gba5.r5}, G:${gba5.g5}, B:${gba5.b5})`;
                    paletteGrid.appendChild(colorBlock);
                }
            }
            
            paletteGroup.appendChild(paletteGrid);
            generalHuePalettesDisplay.appendChild(paletteGroup);
        }
        
        console.log('✅ Generated palettes directly from JSON array');
        
        // Set initial selected color to the first color from palette 6 (index 96)
        if (GBA_FULL_PALETTE_ARRAY.length > 96) {
            const firstAvailableColor = GBA_FULL_PALETTE_ARRAY[96]; // First color of palette 6
            const colorInt = gbaHex15ToInt(firstAvailableColor);
            const gba5 = gbaIntToGba5(colorInt);
            const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
            updateSelectedColorDisplay(gba5, rgb8);
        }
    }

    // --- Grid & Drawing Functions (from draw/script.js, adapted for fixed size) ---
    function setupPixelGridData() {
        // Initialize both frames
        frameAData = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
        frameBData = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
        
        // Reset used colors for both frames
        frameAUsedColors.clear();
        frameBUsedColors.clear();
        
        // Reset histories
        frameAHistory = [];
        frameBHistory = [];
        
        // Set current frame data
        pixelGrid = currentFrame === 'A' ? frameAData : frameBData;
        usedColors = currentFrame === 'A' ? frameAUsedColors : frameBUsedColors;
        history = currentFrame === 'A' ? frameAHistory : frameBHistory;
        
        updateUsedColorsPaletteDisplay();
    }
    function saveToHistory() { 
        const gridCopy = pixelGrid.map(row => [...row]); 
        history.push({grid: gridCopy, colors: new Set(usedColors)}); 
        if (history.length > MAX_HISTORY) { 
            history.shift(); 
        } 
        
        // Update the current frame's data reference
        if (currentFrame === 'A') {
            frameAData = pixelGrid;
            frameAUsedColors = usedColors;
            frameAHistory = history;
        } else {
            frameBData = pixelGrid;
            frameBUsedColors = usedColors;
            frameBHistory = history;
        }
    }
    function undo() { 
        if (history.length === 0) return; 
        const lastState = history.pop(); 
        pixelGrid = lastState.grid; 
        usedColors = lastState.colors; 
        
        // Update the current frame's data reference
        if (currentFrame === 'A') {
            frameAData = pixelGrid;
            frameAUsedColors = usedColors;
            frameAHistory = history;
        } else {
            frameBData = pixelGrid;
            frameBUsedColors = usedColors;
            frameBHistory = history;
        }
        
        redrawAll(); 
        updateUsedColorsPaletteDisplay();
        updateOnionSkin(); // Update onion skin when undoing
    }
    function redrawAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const colorInt = pixelGrid[y][x];
                if (colorInt !== null) {
                    const gba5 = gbaIntToGba5(colorInt);
                    const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                    ctx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`;
                    ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
                }
            }
        }
        updateOnionSkin(); // Update onion skin when redrawing
    }
    function drawPixel(cellX, cellY) {
        if (cellX < 0 || cellX >= GRID_WIDTH || cellY < 0 || cellY >= GRID_HEIGHT) return;
        
        // Handle eyedropper tool
        if (selectedTool === 'eyedropper') {
            const colorInt = pixelGrid[cellY][cellX];
            if (colorInt !== null) {
                const gba5 = gbaIntToGba5(colorInt);
                const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                updateSelectedColorDisplay(gba5, rgb8);
                // Switch back to pencil tool after sampling
                setActiveTool('pencil');
            }
            return;
        }
        
        const prevColorInt = pixelGrid[cellY][cellX]; // Capture the color before drawing
        const selectedColorInt = gbaHex15ToInt(gbaRgb5ToHex15(currentGba5Color.r5, currentGba5Color.g5, currentGba5Color.b5));

        if (selectedTool === 'pencil') {
            if (prevColorInt === selectedColorInt) return; // No change if color is the same

            ctx.fillStyle = `rgb(${currentDisplayRgb8Color.r}, ${currentDisplayRgb8Color.g}, ${currentDisplayRgb8Color.b})`;
            ctx.fillRect(cellX * PIXEL_SIZE, cellY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            pixelGrid[cellY][cellX] = selectedColorInt;
            trackUsedColor(selectedColorInt, true); // Track the newly added color

            // Now, check if the overwritten color needs to be removed from usedColors
            if (prevColorInt !== null && prevColorInt !== selectedColorInt) {
                trackUsedColor(prevColorInt, false);
            }

        } else if (selectedTool === 'eraser') {
            if (prevColorInt === null) return; // No change if already empty
            ctx.clearRect(cellX * PIXEL_SIZE, cellY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            pixelGrid[cellY][cellX] = null;
            trackUsedColor(prevColorInt, false);
        }
        
        // Update onion skin after drawing/erasing
        updateOnionSkin();
    }
    function getCoords(e) { /* ... from draw/script.js ... */ const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; return { cellX: Math.floor(x / PIXEL_SIZE), cellY: Math.floor(y / PIXEL_SIZE) }; }

    // --- Used Colors Palette (from draw/script.js, adapted) ---
    function updateUsedColorsPaletteDisplay() { 
        usedColorsGrid.innerHTML = ''; // Clear previous swatches
        const actualUsedColorsArray = Array.from(usedColors);

        if (actualUsedColorsArray.length === 0) {
            // Optional: Add a message or specific styling for empty state if desired
            // For now, it will just be an empty grid.
            return;
        }

        actualUsedColorsArray.forEach(colorHex15 => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';

            const colorInt = gbaHex15ToInt(colorHex15);
            const gba5 = gbaIntToGba5(colorInt);
            const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
            
            swatch.style.backgroundColor = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`;
            swatch.dataset.colorHex15 = colorHex15;
            swatch.title = `${colorHex15} (R:${gba5.r5},G:${gba5.g5},B:${gba5.b5})`; 
            swatch.addEventListener('click', () => { 
                updateSelectedColorDisplay(gba5, rgb8); 
            });
            usedColorsGrid.appendChild(swatch);
        });
    }
    function trackUsedColor(colorInt, isAdding) { 
        if (colorInt === null && !isAdding) return; 
        const colorHex15 = gbaRgb5ToHex15(gbaIntToGba5(colorInt).r5, gbaIntToGba5(colorInt).g5, gbaIntToGba5(colorInt).b5);
        if (isAdding) { 
            if (!usedColors.has(colorHex15)) { 
                usedColors.add(colorHex15); 
                updateUsedColorsPaletteDisplay(); 
            }
        } else { 
            let stillUsed = false; 
            for (let y = 0; y < GRID_HEIGHT; y++) { 
                for (let x = 0; x < GRID_WIDTH; x++) { 
                    if (pixelGrid[y][x] === colorInt) { 
                        stillUsed = true; 
                        break; 
                    }
                } 
                if (stillUsed) break; 
            } 
            if (!stillUsed) { 
                usedColors.delete(colorHex15); 
                updateUsedColorsPaletteDisplay(); 
            }
        }
    }

    // --- Export Functions (from draw/script.js, adapted) ---
    function downloadCanvasAsPNG() {
        // Helper function to check if a frame has any non-null pixels
        function frameHasData(frameData) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (frameData[y][x] !== null) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Helper function to draw a frame to a canvas context
        function drawFrameToCanvas(frameData, ctx, offsetX = 0, offsetY = 0) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const colorInt = frameData[y][x];
                    if (colorInt !== null) {
                        const gba5 = gbaIntToGba5(colorInt);
                        const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                        ctx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`;
                        ctx.fillRect(offsetX + x, offsetY + y, 1, 1);
                    }
                }
            }
        }

        // Check which frames have data
        const frameAHasData = frameHasData(frameAData);
        const frameBHasData = frameHasData(frameBData);
        
        let baseFilename = artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite';
        let filename, canvasWidth, canvasHeight;
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = false;
        
        if (frameAHasData && frameBHasData) {
            // Both frames have data - create side-by-side image
            filename = baseFilename + '_animation.png';
            canvasWidth = GRID_WIDTH * 2; // Two frames side by side
            canvasHeight = GRID_HEIGHT;
            
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            
            // Draw Frame A on the left
            drawFrameToCanvas(frameAData, tempCtx, 0, 0);
            
            // Draw Frame B on the right
            drawFrameToCanvas(frameBData, tempCtx, GRID_WIDTH, 0);
            
        } else if (frameAHasData) {
            // Only Frame A has data
            filename = baseFilename + '_frame_a.png';
            canvasWidth = GRID_WIDTH;
            canvasHeight = GRID_HEIGHT;
            
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            
            drawFrameToCanvas(frameAData, tempCtx, 0, 0);
            
        } else if (frameBHasData) {
            // Only Frame B has data
            filename = baseFilename + '_frame_b.png';
            canvasWidth = GRID_WIDTH;
            canvasHeight = GRID_HEIGHT;
            
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            
            drawFrameToCanvas(frameBData, tempCtx, 0, 0);
            
        } else {
            // No data in either frame
            alert("No pixel data to export. Please draw something first!");
            return;
        }
        
        // Download the PNG
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    // New function to download bitmap string
    function downloadBitmapString() {
        if (typeof GBA_FULL_PALETTE_ARRAY === 'undefined' || !Array.isArray(GBA_FULL_PALETTE_ARRAY)) {
            console.error("GBA_FULL_PALETTE_ARRAY is not defined or not an array.");
            alert("Error: Palette data is missing. Cannot generate bitmap string.");
            return;
        }

        // Helper function to check if a frame has any non-null pixels
        function frameHasData(frameData) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (frameData[y][x] !== null) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Helper function to generate bitmap string for a frame
        function generateFrameBitmapString(frameData) {
            let frameString = "";

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                    const colorInt = frameData[y][x];
                if (colorInt === null) {
                        frameString += "00";
                } else {
                    const gba5 = gbaIntToGba5(colorInt);
                    const gbaHexColorString = gbaRgb5ToHex15(gba5.r5, gba5.g5, gba5.b5);
                    
                    let determinedPaletteIndex = -1;

                        // Iterative check for the 96-255 range
                    for (let i = 96; i <= 255; i++) {
                        if (GBA_FULL_PALETTE_ARRAY[i] === gbaHexColorString) {
                            determinedPaletteIndex = i;
                            break;
                        }
                    }

                        if (determinedPaletteIndex !== -1) {
                            frameString += determinedPaletteIndex.toString(16).padStart(2, '0').toUpperCase();
                    } else {
                        console.warn(`DOWNLOAD: Color ${gbaHexColorString} at (x:${x},y:${y}) was not found in GBA_FULL_PALETTE_ARRAY[96-255]. Writing '00'.`);
                            frameString += "00"; 
                        }
                    }
                }
            }
            
            return frameString;
        }

        // Check which frames have data
        const frameAHasData = frameHasData(frameAData);
        const frameBHasData = frameHasData(frameBData);
        
        let bitmapString = "";
        let isDoubleFrame = false;
        let baseFilename = artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite_bitmap';
        
        if (frameAHasData && frameBHasData) {
            // Both frames have data - export as 2048 character string
            isDoubleFrame = true;
            bitmapString = generateFrameBitmapString(frameAData) + generateFrameBitmapString(frameBData);
            alert("Exporting two-frame animation (2048 characters)");
        } else if (frameAHasData) {
            // Only Frame A has data - export just Frame A
            bitmapString = generateFrameBitmapString(frameAData);
            alert("Exporting single frame A (1024 characters)");
        } else if (frameBHasData) {
            // Only Frame B has data - export just Frame B
            bitmapString = generateFrameBitmapString(frameBData);
            alert("Exporting single frame B (1024 characters)");
        } else {
            // No data in either frame
            alert("No pixel data to export. Please draw something first!");
            return;
        }
        
        // Create filename indicating single or double frame
        let filename = baseFilename + (isDoubleFrame ? '_animation' : '_single') + '.txt';

        const blob = new Blob([bitmapString], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Function to handle bitmap string upload --- 
    function handleBitmapFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (!content) {
                alert("Error: File is empty.");
                return;
            }

            const singleFrameLength = GRID_WIDTH * GRID_HEIGHT * 2; // 16*32*2 = 1024
            const twoFrameLength = singleFrameLength * 2; // 1024 * 2 = 2048
            const sanitizedContent = content.replace(/\s+/g, ''); // Remove any whitespace

            // Check if it's single frame or two frame
            let isDoubleFrame = false;
            if (sanitizedContent.length === singleFrameLength) {
                isDoubleFrame = false;
            } else if (sanitizedContent.length === twoFrameLength) {
                isDoubleFrame = true;
            } else {
                alert(`Error: Bitmap string has incorrect length. Expected ${singleFrameLength} characters (single frame) or ${twoFrameLength} characters (two frames), got ${sanitizedContent.length}.`);
                return;
            }

            if (!/^[0-9A-Fa-f]+$/.test(sanitizedContent)) {
                alert("Error: Bitmap string contains invalid characters. Only hex characters (0-9, A-F) are allowed.");
                return;
            }

            // Clear existing grid and history
            setupPixelGridData(); // This clears both frames, usedColors, and updates display
            
            // Load Frame A (always present)
            loadFrameFromString(sanitizedContent.substring(0, singleFrameLength), 'A');
            
            // Load Frame B if it's a two-frame sprite
            if (isDoubleFrame) {
                loadFrameFromString(sanitizedContent.substring(singleFrameLength), 'B');
                alert("Loaded two-frame sprite successfully!");
                        } else {
                alert("Loaded single-frame sprite into Frame A successfully!");
                        }
            
            // Ensure we're viewing Frame A after loading
            switchToFrame('A');
            redrawAll();
            updateUsedColorsPaletteDisplay();
            updateOnionSkin();
        };

        reader.onerror = () => {
            alert("Error reading file.");
        };

        reader.readAsText(file);
        event.target.value = null; // Reset file input to allow re-uploading the same file
    }
    
    // Helper function to load a frame from a bitmap string
    function loadFrameFromString(frameString, frameId) {
        const targetGrid = frameId === 'A' ? frameAData : frameBData;
        const targetColors = frameId === 'A' ? frameAUsedColors : frameBUsedColors;
        
        // Clear the target frame
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                targetGrid[y][x] = null;
            }
        }
        targetColors.clear();
        
        let currentPosition = 0;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const byteHex = frameString.substring(currentPosition, currentPosition + 2).toUpperCase();
                currentPosition += 2;
                const paletteIndex = parseInt(byteHex, 16);
                
                if (byteHex === "00") {
                    targetGrid[y][x] = null;
                } else if (paletteIndex >= 96 && paletteIndex <= 255) {
                    if (GBA_FULL_PALETTE_ARRAY && GBA_FULL_PALETTE_ARRAY[paletteIndex]) {
                        const gbaHexColorString = GBA_FULL_PALETTE_ARRAY[paletteIndex];
                        const colorInt = gbaHex15ToInt(gbaHexColorString);
                        targetGrid[y][x] = colorInt;
                        
                        // Track used colors for this frame
                        const colorHex15 = gbaRgb5ToHex15(gbaIntToGba5(colorInt).r5, gbaIntToGba5(colorInt).g5, gbaIntToGba5(colorInt).b5);
                        targetColors.add(colorHex15);
                    } else {
                        console.warn(`Invalid palette index ${paletteIndex} (hex: ${byteHex}) at (x:${x}, y:${y}) or GBA_FULL_PALETTE_ARRAY missing. Using transparent.`);
                        targetGrid[y][x] = null;
                    }
                } else {
                    console.warn(`Invalid byte value "${byteHex}" (index ${paletteIndex}) in bitmap string at (x:${x}, y:${y}). Expected 00 or index 96-255. Using transparent.`);
                    targetGrid[y][x] = null;
                }
            }
        }
    }

    // --- Tool Selection & Event Listeners (from draw/script.js) ---
    function setActiveTool(tool) { 
        selectedTool = tool; 
        pencilToolBtn.classList.toggle('active', tool === 'pencil'); 
        eraserToolBtn.classList.toggle('active', tool === 'eraser'); 
        eyedropperToolBtn.classList.toggle('active', tool === 'eyedropper');
    }
    eyedropperToolBtn.addEventListener('click', () => setActiveTool('eyedropper'));
    pencilToolBtn.addEventListener('click', () => setActiveTool('pencil'));
    eraserToolBtn.addEventListener('click', () => setActiveTool('eraser'));
    undoButton.addEventListener('click', undo);
    
    // Animation control event listeners
    frameABtn.addEventListener('click', () => switchToFrame('A'));
    frameBBtn.addEventListener('click', () => switchToFrame('B'));
    copyFrameBtn.addEventListener('click', copyOtherFrameToCurrent);
    animatePreviewBtn.addEventListener('click', startAnimationPreview);
    onionSkinBtn.addEventListener('click', toggleOnionSkin);
    
    downloadPngBtn.addEventListener('click', downloadCanvasAsPNG);
    downloadBitmapBtn.addEventListener('click', downloadBitmapString);
    uploadBitmapBtn.addEventListener('click', () => {
        if (confirm("This will replace the current sprite. Are you sure?")) {
            bitmapFileInput.click();
        }
    });
    bitmapFileInput.addEventListener('change', handleBitmapFileUpload);
    canvas.addEventListener('mousedown', (e) => { if (e.button !== 0) return; saveToHistory(); isDrawing = true; drawPixel(getCoords(e).cellX, getCoords(e).cellY); });
    canvas.addEventListener('mousemove', (e) => { if (isDrawing) { drawPixel(getCoords(e).cellX, getCoords(e).cellY); } });
    canvas.addEventListener('mouseup', () => { if(isDrawing) isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { if(isDrawing) isDrawing = false; });
    // Touch events (simplified for brevity, adapt from draw/script.js if full support needed)
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); saveToHistory(); isDrawing = true; const touch = e.touches[0]; drawPixel(getCoords(touch).cellX, getCoords(touch).cellY); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (isDrawing) { const touch = e.touches[0]; drawPixel(getCoords(touch).cellX, getCoords(touch).cellY); } }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); if(isDrawing) isDrawing = false; });
    canvas.addEventListener('touchcancel', (e) => { e.preventDefault(); if(isDrawing) isDrawing = false; });
    if (artworkTitleElement) { artworkTitleElement.addEventListener('click', function(e) { if (e.target === this || e.target.classList.contains('edit-icon')) { const currentTitle = this.childNodes[0].nodeValue.trim(); const newTitle = prompt("Sprite Name:", currentTitle); if (newTitle !== null && newTitle.trim() !== "") { this.childNodes[0].nodeValue = newTitle.trim() + " ";}}});}

    // --- Instructions Drawer Functions ---
    const instructionsBtn = document.getElementById('instructions-btn');
    const instructionsDrawer = document.getElementById('instructions-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');

    function openInstructionsDrawer() {
        instructionsDrawer.classList.add('open');
        drawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Load examples when drawer opens (only load once)
        if (!instructionsDrawer.dataset.examplesLoaded) {
            loadExamples();
            instructionsDrawer.dataset.examplesLoaded = 'true';
        }
    }

    function closeInstructionsDrawer() {
        instructionsDrawer.classList.remove('open');
        drawerOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Event listeners for drawer
    if (instructionsBtn) {
        instructionsBtn.addEventListener('click', openInstructionsDrawer);
    }
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeInstructionsDrawer);
    }
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeInstructionsDrawer);
    }

    // Close drawer with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && instructionsDrawer.classList.contains('open')) {
            closeInstructionsDrawer();
        }
    });

    // --- Examples Loading Functions ---
    async function loadExamples() {
        const examplesContainer = document.getElementById('examples-container');
        if (!examplesContainer) return;

        try {
            // Try to fetch the examples directory listing
            // Note: This approach works with a local server but may need adjustment for different setups
            const examples = await discoverExamples();
            
            if (examples.length === 0) {
                examplesContainer.innerHTML = '<div class="examples-loading">No examples found in the examples folder.</div>';
                return;
            }

            examplesContainer.innerHTML = '';
            
            examples.forEach(example => {
                const exampleItem = createExampleItem(example);
                examplesContainer.appendChild(exampleItem);
            });

        } catch (error) {
            console.error('Failed to load examples:', error);
            examplesContainer.innerHTML = '<div class="examples-loading">Unable to load examples. Make sure you\'re running a local server.</div>';
        }
    }

    async function discoverExamples() {
        // For now, we'll use a hardcoded list since directory listing requires server-side support
        // In the future, this could be enhanced to dynamically discover files
        const knownExamples = ['snowbro'];
        const examples = [];

        for (const exampleName of knownExamples) {
            try {
                // Check if both .txt and .png files exist
                const txtResponse = await fetch(`examples/${exampleName}.txt`);
                const pngResponse = await fetch(`examples/${exampleName}.png`);
                
                if (txtResponse.ok && pngResponse.ok) {
                    examples.push({
                        name: exampleName,
                        txtFile: `examples/${exampleName}.txt`,
                        pngFile: `examples/${exampleName}.png`
                    });
                }
            } catch (error) {
                console.warn(`Example ${exampleName} not found:`, error);
            }
        }

        return examples;
    }

    function createExampleItem(example) {
        const item = document.createElement('div');
        item.className = 'example-item';

        // Create the preview container
        const previewDiv = document.createElement('div');
        previewDiv.className = 'example-preview';
        
        // Create canvas for animation (correct 16x32 aspect ratio, scaled up 2x)
        const canvas = document.createElement('canvas');
        canvas.width = 32; // 16px * 2 scale
        canvas.height = 64; // 32px * 2 scale
        previewDiv.appendChild(canvas);

        // Create info section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'example-info';
        infoDiv.innerHTML = `<div class="example-name">${example.name}</div>`;

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = example.txtFile;
        downloadLink.download = `${example.name}.txt`;
        downloadLink.className = 'example-download';
        downloadLink.textContent = '📥 Download';

        // Assemble the item
        item.appendChild(previewDiv);
        item.appendChild(infoDiv);
        item.appendChild(downloadLink);

        // Start the animation
        startExampleAnimation(canvas, example.pngFile);

        return item;
    }

    async function startExampleAnimation(canvas, pngFile) {
        try {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            // Load the sprite sheet image
            const img = new Image();
            img.onload = () => {
                let showingFrameA = true;
                
                // Function to draw a frame
                const drawFrame = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    if (showingFrameA) {
                        // Draw Frame A (left half of the sprite sheet) - maintain 16x32 aspect ratio
                        ctx.drawImage(img, 0, 0, 16, 32, 0, 0, 32, 64);
                    } else {
                        // Draw Frame B (right half of the sprite sheet) - maintain 16x32 aspect ratio
                        ctx.drawImage(img, 16, 0, 16, 32, 0, 0, 32, 64);
                    }
                };
                
                // Initial draw
                drawFrame();
                
                // Animate between frames
                setInterval(() => {
                    showingFrameA = !showingFrameA;
                    drawFrame();
                }, 800); // 800ms interval for smooth animation
            };
            
            img.onerror = () => {
                // Fallback: draw a simple placeholder
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#999';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('?', canvas.width/2, canvas.height/2);
            };
            
            img.src = pngFile;
            
        } catch (error) {
            console.error('Failed to load example animation:', error);
        }
    }

    // --- Animation Functions ---
    function switchToFrame(frameId) {
        if (currentFrame === frameId) return;
        
        // Save current frame state
        if (currentFrame === 'A') {
            frameAData = pixelGrid;
            frameAUsedColors = usedColors;
            frameAHistory = history;
        } else {
            frameBData = pixelGrid;
            frameBUsedColors = usedColors;
            frameBHistory = history;
        }
        
        // Switch to new frame
        currentFrame = frameId;
        pixelGrid = currentFrame === 'A' ? frameAData : frameBData;
        usedColors = currentFrame === 'A' ? frameAUsedColors : frameBUsedColors;
        history = currentFrame === 'A' ? frameAHistory : frameBHistory;
        
        // Update UI
        frameABtn.classList.toggle('active', currentFrame === 'A');
        frameBBtn.classList.toggle('active', currentFrame === 'B');
        
        // Redraw canvas and update displays
        redrawAll();
        updateUsedColorsPaletteDisplay();
        updateOnionSkin();
    }
    
    function updateOnionSkin() {
        if (!onionSkinEnabled) {
            onionSkinCanvas.style.display = 'none';
            return;
        }
        
        onionSkinCanvas.style.display = 'block';
        onionSkinCtx.clearRect(0, 0, onionSkinCanvas.width, onionSkinCanvas.height);
        
        // Get the other frame's data
        const otherFrameData = currentFrame === 'A' ? frameBData : frameAData;
        
        // Draw the other frame with transparency
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const colorInt = otherFrameData[y][x];
                if (colorInt !== null) {
                    const gba5 = gbaIntToGba5(colorInt);
                    const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                    onionSkinCtx.fillStyle = `rgba(${rgb8.r}, ${rgb8.g}, ${rgb8.b}, 0.5)`;
                    onionSkinCtx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
                }
            }
        }
    }
    
    function toggleOnionSkin() {
        onionSkinEnabled = !onionSkinEnabled;
        document.body.classList.toggle('onion-skin-active', onionSkinEnabled);
        updateOnionSkin();
    }
    
    function startAnimationPreview() {
        if (isAnimating) {
            stopAnimationPreview();
            return;
        }
        
        isAnimating = true;
        document.body.classList.add('animating');
        animatePreviewBtn.textContent = '⏹️';
        animatePreviewBtn.title = 'Stop Animation';
        
        let showingA = true;
        animationInterval = setInterval(() => {
            if (showingA) {
                // Show frame A
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawFrame(frameAData);
            } else {
                // Show frame B
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawFrame(frameBData);
            }
            showingA = !showingA;
        }, 500); // 500ms interval for animation
    }
    
    function stopAnimationPreview() {
        if (!isAnimating) return;
        
        isAnimating = false;
        document.body.classList.remove('animating');
        animatePreviewBtn.textContent = '🎬';
        animatePreviewBtn.title = 'Preview Animation';
        
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        
        // Redraw current frame
        redrawAll();
    }
    
    function drawFrame(frameData) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const colorInt = frameData[y][x];
                if (colorInt !== null) {
                    const gba5 = gbaIntToGba5(colorInt);
                    const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                    ctx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`;
                    ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
                }
            }
        }
    }
    
    function copyOtherFrameToCurrent() {
        const otherFrame = currentFrame === 'A' ? 'B' : 'A';
        const otherFrameData = currentFrame === 'A' ? frameBData : frameAData;
        const otherFrameColors = currentFrame === 'A' ? frameBUsedColors : frameAUsedColors;
        
        // Show confirmation dialog
        const confirmed = confirm(`This will copy Frame ${otherFrame} to Frame ${currentFrame}, overwriting the current frame. Are you sure?`);
        if (!confirmed) return;
        
        // Save current state to history before copying
        saveToHistory();
        
        // Copy the other frame's data
        pixelGrid = otherFrameData.map(row => [...row]);
        usedColors = new Set(otherFrameColors);
        
        // Update the current frame's data references
        if (currentFrame === 'A') {
            frameAData = pixelGrid;
            frameAUsedColors = usedColors;
        } else {
            frameBData = pixelGrid;
            frameBUsedColors = usedColors;
        }
        
        // Redraw and update displays
        redrawAll();
        updateUsedColorsPaletteDisplay();
        updateOnionSkin();
    }

    // --- Initialization ---
    async function init() {
        // Load palette from JSON first
        console.log('🔄 Loading color palette...');
        await loadPaletteFromJSON();
        
        // Setup main canvas
        canvas.width = GRID_WIDTH * PIXEL_SIZE;
        canvas.height = GRID_HEIGHT * PIXEL_SIZE;
        ctx.imageSmoothingEnabled = false;
        
        // Setup onion skin canvas
        onionSkinCanvas.width = GRID_WIDTH * PIXEL_SIZE;
        onionSkinCanvas.height = GRID_HEIGHT * PIXEL_SIZE;
        onionSkinCtx.imageSmoothingEnabled = false;
        
        canvasContainer.style.backgroundSize = `${PIXEL_SIZE*2}px ${PIXEL_SIZE*2}px`;
        const offset = PIXEL_SIZE / 2;
        canvasContainer.style.backgroundPosition = `0 0, 0 ${offset}px, ${offset}px ${-offset}px, ${-offset}px 0px`;
        
        setupPixelGridData();
        generateGeneralHuePalettes(); // Generate and display the fixed palettes
        setActiveTool('pencil');
        redrawAll(); 
        updateOnionSkin(); // Initialize onion skin
        console.log('✅ GBA Self-Sprite Editor with Animation Initialized.');
    }

    init();
}); 