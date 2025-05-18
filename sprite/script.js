document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    const pencilToolBtn = document.getElementById('pencil-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const undoButton = document.getElementById('undo-button');
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

    const GBA_FULL_PALETTE_ARRAY = [ "0x0000",
        "0x533F",
        "0x4ADE",
        "0x3E9C",
        "0x0CCA",
        "0x6545",
        "0x6318",
        "0x3CA3",
        "0x154F",
        "0x14BC",
        "0x2B9F",
        "0x4A52",
        "0x294A",
        "0x5B5C",
        "0x29F4",
        "0x0421",
        "0x0000",
        "0x7FFF",
        "0x6B5A",
        "0x5294",
        "0x39CE",
        "0x2108",
        "0x0C63",
        "0x29D2",
        "0x2150",
        "0x49CC",
        "0x21E8",
        "0x7F34",
        "0x16DC",
        "0x20C6",
        "0x6B9C",
        "0x0421",
        "0x0000",
        "0x53FF",
        "0x03FF",
        "0x029F",
        "0x015F",
        "0x001F",
        "0x0014",
        "0x7F34",
        "0x7DEA",
        "0x50A5",
        "0x7FFF",
        "0x6B5A",
        "0x56B5",
        "0x3DEF",
        "0x2108",
        "0x0000",
        "0x0000",
        "0x7FFF",
        "0x5AD6",
        "0x3DEF",
        "0x18C6",
        "0x001F",
        "0x03E0",
        "0x7C00",
        "0x03FF",
        "0x42DC",
        "0x1550",
        "0x2A16",
        "0x01FF",
        "0x7C14",
        "0x7FE0",
        "0x0421",
        "0x0000",
        "0x1725",
        "0x228A",
        "0x0DE3",
        "0x164F",
        "0x154F",
        "0x0CCA",
        "0x0466",
        "0x211E",
        "0x2B9F",
        "0x79EA",
        "0x21D4",
        "0x5252",
        "0x3F8F",
        "0x0942",
        "0x0421",
        "0x0000",
        "0x001F",
        "0x01FF",
        "0x03FF",
        "0x03EF",
        "0x03E0",
        "0x3FE0",
        "0x7FE0",
        "0x7DE0",
        "0x7C00",
        "0x7C0F",
        "0x7C1F",
        "0x65FF",
        "0x7FFF",
        "0x5AD6",
        "0x2108",
        "0x001F",
        "0x2D7F",
        "0x5ADF",
        "0x001A",
        "0x253A",
        "0x4A5A",
        "0x0016",
        "0x2116",
        "0x3DF6",
        "0x0011",
        "0x18D1",
        "0x3191",
        "0x000C",
        "0x108C",
        "0x252C",
        "0x7FFF",
        "0x021F",
        "0x2EBF",
        "0x5B5F",
        "0x01BA",
        "0x265A",
        "0x4ADA",
        "0x0176",
        "0x21F6",
        "0x3E56",
        "0x0131",
        "0x1991",
        "0x31D1",
        "0x00CC",
        "0x110C",
        "0x256C",
        "0x739C",
        "0x039F",
        "0x2FBF",
        "0x5BDF",
        "0x031A",
        "0x273A",
        "0x4B5A",
        "0x0296",
        "0x22B6",
        "0x3EB6",
        "0x0211",
        "0x1A11",
        "0x3231",
        "0x016C",
        "0x118C",
        "0x258C",
        "0x6739",
        "0x03F0",
        "0x2FF5",
        "0x5BFA",
        "0x034D",
        "0x2752",
        "0x4B56",
        "0x02CB",
        "0x22CF",
        "0x3ED2",
        "0x0229",
        "0x1A2C",
        "0x322E",
        "0x0186",
        "0x1188",
        "0x258B",
        "0x5AD6",
        "0x23E0",
        "0x43EB",
        "0x63F6",
        "0x1F40",
        "0x3749",
        "0x5352",
        "0x16C0",
        "0x2EC8",
        "0x46CF",
        "0x1220",
        "0x2626",
        "0x362C",
        "0x0D80",
        "0x1984",
        "0x2989",
        "0x4E73",
        "0x7FE0",
        "0x7FEB",
        "0x7FF6",
        "0x6B40",
        "0x6B49",
        "0x6B52",
        "0x5AC0",
        "0x5AC8",
        "0x5ACF",
        "0x4620",
        "0x4626",
        "0x462C",
        "0x3180",
        "0x3184",
        "0x3189",
        "0x3DEF",
        "0x7D80",
        "0x7E6B",
        "0x7F36",
        "0x6960",
        "0x6A09",
        "0x6AD2",
        "0x5920",
        "0x59A8",
        "0x5A4F",
        "0x44E0",
        "0x4546",
        "0x45CC",
        "0x30A0",
        "0x3104",
        "0x3149",
        "0x318C",
        "0x7C06",
        "0x7D6F",
        "0x7ED8",
        "0x6805",
        "0x692D",
        "0x6A54",
        "0x5804",
        "0x590A",
        "0x59F1",
        "0x4403",
        "0x44C8",
        "0x458D",
        "0x3002",
        "0x3086",
        "0x3129",
        "0x2529",
        "0x7C19",
        "0x7D7B",
        "0x7EDD",
        "0x6815",
        "0x6937",
        "0x6A59",
        "0x5811",
        "0x5913",
        "0x59F4",
        "0x440E",
        "0x44CF",
        "0x4590",
        "0x300A",
        "0x308B",
        "0x312C",
        "0x18C6",
        "0x4C1F",
        "0x5D7F",
        "0x6EDF",
        "0x401A",
        "0x4D3A",
        "0x5E5A",
        "0x3416",
        "0x4116",
        "0x4DF6",
        "0x2811",
        "0x34D1",
        "0x3D91",
        "0x1C0C",
        "0x248C",
        "0x2D2C",
        "0x0C63"]

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
    function downloadCanvasAsPNG() { /* ... (logic from draw/script.js, ensure it uses GRID_WIDTH, GRID_HEIGHT, gbaIntToGba5, and gbaRgb5ToRgb8) ... */ 
        let filename = (artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite') + '.png';
        const tempCanvas = document.createElement('canvas'); tempCanvas.width = GRID_WIDTH; tempCanvas.height = GRID_HEIGHT; const tempCtx = tempCanvas.getContext('2d'); tempCtx.imageSmoothingEnabled = false;
        for (let y = 0; y < GRID_HEIGHT; y++) { for (let x = 0; x < GRID_WIDTH; x++) { const colorInt = pixelGrid[y][x]; if (colorInt !== null) { const gba5 = gbaIntToGba5(colorInt); const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5); tempCtx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`; tempCtx.fillRect(x, y, 1, 1); } } }
        const downloadLink = document.createElement('a'); downloadLink.download = filename; downloadLink.href = tempCanvas.toDataURL('image/png'); document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
    }

    // New function to download bitmap string
    function downloadBitmapString() {
        let filename = (artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite_bitmap') + '.txt';
        let bitmapString = "";

        if (typeof GBA_FULL_PALETTE_ARRAY === 'undefined' || !Array.isArray(GBA_FULL_PALETTE_ARRAY)) {
            console.error("GBA_FULL_PALETTE_ARRAY is not defined or not an array.");
            alert("Error: Palette data is missing. Cannot generate bitmap string.");
            return;
        }

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const colorInt = pixelGrid[y][x];
                if (colorInt === null) {
                    bitmapString += "00";
                } else {
                    const gba5 = gbaIntToGba5(colorInt);
                    const gbaHexColorString = gbaRgb5ToHex15(gba5.r5, gba5.g5, gba5.b5);
                    
                    // --- DOWNLOAD DEBUG LOGIC --- 
                    let determinedPaletteIndex = -1;
                    let foundViaIteration = false;

                    // Iterative check for the 96-255 range first (most robust)
                    for (let i = 96; i <= 255; i++) {
                        if (GBA_FULL_PALETTE_ARRAY[i] === gbaHexColorString) {
                            determinedPaletteIndex = i;
                            foundViaIteration = true;
                            break;
                        }
                    }
                    // ---- END DOWNLOAD DEBUG LOGIC ----

                    if (determinedPaletteIndex !== -1) { // Relies on the iterative search success
                        bitmapString += determinedPaletteIndex.toString(16).padStart(2, '0').toUpperCase();
                    } else {
                        // This means the color on canvas was not one of the 160 general palette colors (indices 96-255)
                        console.warn(`DOWNLOAD: Color ${gbaHexColorString} at (x:${x},y:${y}) was not found in GBA_FULL_PALETTE_ARRAY[96-255]. Writing '00'.`);
                        bitmapString += "00"; 
                    }
                }
            }
        }

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

            const expectedLength = GRID_WIDTH * GRID_HEIGHT * 2; // 16*32*2 = 1024
            const sanitizedContent = content.replace(/\s+/g, ''); // Remove any whitespace

            if (sanitizedContent.length !== expectedLength) {
                alert(`Error: Bitmap string has incorrect length. Expected ${expectedLength} characters, got ${sanitizedContent.length}.`);
                return;
            }

            if (!/^[0-9A-Fa-f]+$/.test(sanitizedContent)) {
                alert("Error: Bitmap string contains invalid characters. Only hex characters (0-9, A-F) are allowed.");
                return;
            }

            // Clear existing grid and history
            setupPixelGridData(); // This clears pixelGrid, usedColors, and updates display
            history = []; // Clear undo history explicitly

            let currentPosition = 0;
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const byteHex = sanitizedContent.substring(currentPosition, currentPosition + 2).toUpperCase();
                    currentPosition += 2;
                    const paletteIndex = parseInt(byteHex, 16);
                    
                    if (byteHex === "00") {
                        pixelGrid[y][x] = null;
                    } else if (paletteIndex >= 96 && paletteIndex <= 255) {
                        if (GBA_FULL_PALETTE_ARRAY && GBA_FULL_PALETTE_ARRAY[paletteIndex]) {
                            const gbaHexColorString = GBA_FULL_PALETTE_ARRAY[paletteIndex];
                            const colorInt = gbaHex15ToInt(gbaHexColorString);
                            pixelGrid[y][x] = colorInt;
                            trackUsedColor(colorInt, true); 
                        } else {
                            console.warn(`Invalid palette index ${paletteIndex} (hex: ${byteHex}) at (x:${x}, y:${y}) or GBA_FULL_PALETTE_ARRAY missing. Using transparent.`);
                            pixelGrid[y][x] = null;
                        }
                    } else {
                        console.warn(`Invalid byte value "${byteHex}" (index ${paletteIndex}) in bitmap string at (x:${x}, y:${y}). Expected 00 or index 96-255. Using transparent.`);
                        pixelGrid[y][x] = null;
                    }
                }
            }
            redrawAll();
            updateUsedColorsPaletteDisplay(); // Ensure used colors palette is updated after loading
        };

        reader.onerror = () => {
            alert("Error reading file.");
        };

        reader.readAsText(file);
        event.target.value = null; // Reset file input to allow re-uploading the same file
    }

    // --- Tool Selection & Event Listeners (from draw/script.js) ---
    function setActiveTool(tool) { selectedTool = tool; pencilToolBtn.classList.toggle('active', tool === 'pencil'); eraserToolBtn.classList.toggle('active', tool === 'eraser'); }
    pencilToolBtn.addEventListener('click', () => setActiveTool('pencil'));
    eraserToolBtn.addEventListener('click', () => setActiveTool('eraser'));
    undoButton.addEventListener('click', undo);
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