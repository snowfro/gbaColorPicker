document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    const pencilToolBtn = document.getElementById('pencil-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const undoButton = document.getElementById('undo-button');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadJsonBtn = document.getElementById('download-json');
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

    // --- Drawing State (from draw/script.js) ---
    let selectedTool = 'pencil';
    let isDrawing = false;
    let pixelGrid; // To store GBA 15-bit color values (integers)
    let usedColors = new Set(); // Stores 15-bit hex strings of used colors
    let currentGba5Color = { r5: 0, g5: 0, b5: 0 }; // Default to black
    let currentDisplayRgb8Color = {r:0, g:0, b:0};

    // --- Undo History (from draw/script.js) ---
    let history = [];
    const MAX_HISTORY = 20;

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

    // --- General Hue Palette Generation (from limited/script.js, adapted) ---
    const PALETTE_NAMES_GENERAL = [
        "Red", "Orange", "Yellow", "Lime Green", "Green-Cyan",
        "Cyan", "Azure", "Blue", "Violet", "Magenta"
    ];
    const GENERAL_HUES_DEG = [0, 30, 55, 90, 135, 180, 216, 252, 288, 324];

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
        generalHuePalettesDisplay.innerHTML = '';

        for (let palIdx = 0; palIdx < GENERAL_HUES_DEG.length; palIdx++) {
            const hue = GENERAL_HUES_DEG[palIdx];
            const paletteGroup = document.createElement('div');
            paletteGroup.classList.add('palette-group');
            const titleDiv = document.createElement('div');
            titleDiv.classList.add('palette-title');
            titleDiv.textContent = PALETTE_NAMES_GENERAL[palIdx] || `Hue ${Math.round(hue)}°`;
            paletteGroup.appendChild(titleDiv);
            const paletteGrid = document.createElement('div');
            paletteGrid.classList.add('palette-grid');

            const numValueSteps = 5;
            const numSatSteps = 3;
            for (let vIdx = 0; vIdx < numValueSteps; vIdx++) {
                const val = 1.0 - (vIdx * (0.6 / (numValueSteps - 1)));
                for (let sIdx = 0; sIdx < numSatSteps; sIdx++) {
                    const sat = 1.0 - (sIdx * (0.7 / (numSatSteps - 1)));
                    const targetRgb8 = hsvToRgb(hue, sat, val);
                    const gba5 = rgb8ToGbaRgb5(targetRgb8.r, targetRgb8.g, targetRgb8.b);
                    paletteGrid.appendChild(createPaletteColorBlock(gba5, gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5)));
                }
            }
            const grayIndex = palIdx;
            const minGrayLevel = 3; const maxGrayLevel = 31;
            let grayLevelStep = 0;
            if (GENERAL_HUES_DEG.length > 1) grayLevelStep = (maxGrayLevel - minGrayLevel) / (GENERAL_HUES_DEG.length - 1);
            const grayLevel = Math.round(maxGrayLevel - (grayIndex * grayLevelStep));
            const grayscaleGba5 = { r5: grayLevel, g5: grayLevel, b5: grayLevel };
            paletteGrid.appendChild(createPaletteColorBlock(grayscaleGba5, gbaRgb5ToRgb8(grayLevel, grayLevel, grayLevel)));
            
            paletteGroup.appendChild(paletteGrid);
            generalHuePalettesDisplay.appendChild(paletteGroup);
        }
        // Set initial selected color to the first color of the first general palette
        const firstHue = GENERAL_HUES_DEG[0];
        const firstVal = 1.0; const firstSat = 1.0;
        const initialRgb8 = hsvToRgb(firstHue,firstSat,firstVal);
        const initialGba5 = rgb8ToGbaRgb5(initialRgb8.r, initialRgb8.g, initialRgb8.b);
        updateSelectedColorDisplay(initialGba5, gbaRgb5ToRgb8(initialGba5.r5, initialGba5.g5, initialGba5.b5));
    }

    // --- Grid & Drawing Functions (from draw/script.js, adapted for fixed size) ---
    function setupPixelGridData() {
        pixelGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
        usedColors.clear();
        updateUsedColorsPaletteDisplay();
        history = [];
    }
    function saveToHistory() { /* ... from draw/script.js ... */ const gridCopy = pixelGrid.map(row => [...row]); history.push({grid: gridCopy, colors: new Set(usedColors)}); if (history.length > MAX_HISTORY) { history.shift(); } }
    function undo() { /* ... from draw/script.js ... */ if (history.length === 0) return; const lastState = history.pop(); pixelGrid = lastState.grid; usedColors = lastState.colors; redrawAll(); updateUsedColorsPaletteDisplay(); }
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
    }
    function drawPixel(cellX, cellY) {
        if (cellX < 0 || cellX >= GRID_WIDTH || cellY < 0 || cellY >= GRID_HEIGHT) return;
        const prevColorInt = pixelGrid[cellY][cellX];
        const selectedColorInt = gbaHex15ToInt(gbaRgb5ToHex15(currentGba5Color.r5, currentGba5Color.g5, currentGba5Color.b5));

        if (selectedTool === 'pencil') {
            if (pixelGrid[cellY][cellX] === selectedColorInt) return; // No change
            ctx.fillStyle = `rgb(${currentDisplayRgb8Color.r}, ${currentDisplayRgb8Color.g}, ${currentDisplayRgb8Color.b})`;
            ctx.fillRect(cellX * PIXEL_SIZE, cellY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            pixelGrid[cellY][cellX] = selectedColorInt;
            trackUsedColor(selectedColorInt, true);
        } else if (selectedTool === 'eraser') {
            if (prevColorInt === null) return; // No change
            ctx.clearRect(cellX * PIXEL_SIZE, cellY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            pixelGrid[cellY][cellX] = null;
            trackUsedColor(prevColorInt, false);
        }
    }
    function getCoords(e) { /* ... from draw/script.js ... */ const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; return { cellX: Math.floor(x / PIXEL_SIZE), cellY: Math.floor(y / PIXEL_SIZE) }; }

    // --- Used Colors Palette (from draw/script.js, adapted) ---
    function updateUsedColorsPaletteDisplay() { 
        usedColorsGrid.innerHTML = ''; // Clear previous swatches/placeholders
        const MAX_USED_SWATCHES = 15;
        const actualUsedColorsArray = Array.from(usedColors);

        for (let i = 0; i < MAX_USED_SWATCHES; i++) {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';

            if (i < actualUsedColorsArray.length) {
                // This is an actual used color
                const colorHex15 = actualUsedColorsArray[i];
                const colorInt = gbaHex15ToInt(colorHex15);
                const gba5 = gbaIntToGba5(colorInt);
                const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                
                swatch.style.backgroundColor = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`;
                swatch.dataset.colorHex15 = colorHex15;
                swatch.title = `${colorHex15} (R:${gba5.r5},G:${gba5.g5},B:${gba5.b5})`; // Add a title for hover info
                swatch.addEventListener('click', () => { 
                    updateSelectedColorDisplay(gba5, rgb8); 
                });
            } else {
                // This is a placeholder
                swatch.style.backgroundColor = 'transparent'; // Or a very light gray e.g., '#f0f0f0'
                swatch.title = "Empty slot";
            }
            usedColorsGrid.appendChild(swatch);
        }
    }
    function trackUsedColor(colorInt, isAdding) { /* ... (logic from draw/script.js, using hex strings for the Set) ... */
        if (colorInt === null && !isAdding) return; // Cannot remove null, only add valid colors
        const colorHex15 = gbaRgb5ToHex15(gbaIntToGba5(colorInt).r5, gbaIntToGba5(colorInt).g5, gbaIntToGba5(colorInt).b5);
        if (isAdding) { if (!usedColors.has(colorHex15)) { usedColors.add(colorHex15); updateUsedColorsPaletteDisplay(); } }
        else { let stillUsed = false; for (let y = 0; y < GRID_HEIGHT; y++) { for (let x = 0; x < GRID_WIDTH; x++) { if (pixelGrid[y][x] === colorInt) { stillUsed = true; break; } } if (stillUsed) break; } if (!stillUsed) { usedColors.delete(colorHex15); updateUsedColorsPaletteDisplay(); } }
    }

    // --- Export Functions (from draw/script.js, adapted) ---
    function downloadCanvasAsPNG() { /* ... (logic from draw/script.js, ensure it uses GRID_WIDTH, GRID_HEIGHT, gbaIntToGba5, and gbaRgb5ToRgb8) ... */ 
        let filename = (artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite') + '.png';
        const tempCanvas = document.createElement('canvas'); tempCanvas.width = GRID_WIDTH; tempCanvas.height = GRID_HEIGHT; const tempCtx = tempCanvas.getContext('2d'); tempCtx.imageSmoothingEnabled = false;
        for (let y = 0; y < GRID_HEIGHT; y++) { for (let x = 0; x < GRID_WIDTH; x++) { const colorInt = pixelGrid[y][x]; if (colorInt !== null) { const gba5 = gbaIntToGba5(colorInt); const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5); tempCtx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`; tempCtx.fillRect(x, y, 1, 1); } } }
        const downloadLink = document.createElement('a'); downloadLink.download = filename; downloadLink.href = tempCanvas.toDataURL('image/png'); document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
    }
    function downloadPaletteAsJSON() { /* ... (logic from draw/script.js, exports 'usedColors' set) ... */
        let filename = (artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite_palette') + '.json';
        const paletteArray = []; usedColors.forEach(hex15 => { const gba5 = gbaIntToGba5(gbaHex15ToInt(hex15)); const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5); paletteArray.push({ color_15bit: hex15, color_hex: `#${rgb8.r.toString(16).padStart(2,'0')}${rgb8.g.toString(16).padStart(2,'0')}${rgb8.b.toString(16).padStart(2,'0')}`.toUpperCase(), rgb: [rgb8.r, rgb8.g, rgb8.b] }); });
        paletteArray.sort((a,b) => gbaHex15ToInt(a.color_15bit) - gbaHex15ToInt(b.color_15bit));
        const jsonOutput = { title: artworkTitleElement.childNodes[0].nodeValue.trim(), format: "GBA 15-bit Used Colors", total_colors: paletteArray.length, palette: paletteArray };
        const jsonString = JSON.stringify(jsonOutput, null, 2); const blob = new Blob([jsonString], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // --- Tool Selection & Event Listeners (from draw/script.js) ---
    function setActiveTool(tool) { selectedTool = tool; pencilToolBtn.classList.toggle('active', tool === 'pencil'); eraserToolBtn.classList.toggle('active', tool === 'eraser'); }
    pencilToolBtn.addEventListener('click', () => setActiveTool('pencil'));
    eraserToolBtn.addEventListener('click', () => setActiveTool('eraser'));
    undoButton.addEventListener('click', undo);
    downloadPngBtn.addEventListener('click', downloadCanvasAsPNG);
    downloadJsonBtn.addEventListener('click', downloadPaletteAsJSON);
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


    // --- Initialization ---
    function init() {
        canvas.width = GRID_WIDTH * PIXEL_SIZE;
        canvas.height = GRID_HEIGHT * PIXEL_SIZE;
        ctx.imageSmoothingEnabled = false;
        canvasContainer.style.backgroundSize = `${PIXEL_SIZE*2}px ${PIXEL_SIZE*2}px`;
        const offset = PIXEL_SIZE / 2;
        canvasContainer.style.backgroundPosition = `0 0, 0 ${offset}px, ${offset}px ${-offset}px, ${-offset}px 0px`;
        
        setupPixelGridData();
        generateGeneralHuePalettes(); // Generate and display the fixed palettes
        setActiveTool('pencil');
        redrawAll(); 
        console.log('GBA Self-Sprite Editor Initialized.');
    }

    init();
}); 