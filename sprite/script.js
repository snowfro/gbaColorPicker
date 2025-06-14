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

    // --- General Hue Palette Generation (from limited/script.js, adapted) ---
    const PALETTE_NAMES_GENERAL = [
        "Red", "Orange + Skin", "Yellow", "Lime Green", "Green-Cyan",
        "Cyan", "Azure", "Blue", "Violet", "Magenta"
    ];
    const GENERAL_HUES_DEG = [0, 30, 55, 90, 135, 180, 216, 252, 288, 324];

    // Define specific skin-tone colors to replace certain colors in Orange palette (hue 30°)
    const SKIN_TONE_REPLACEMENTS_GBA5 = [
        {r5: 30, g5: 28, b5: 25}, // R: 249, G: 229, B: 205 -> 0x679E
        {r5: 29, g5: 22, b5: 17}, // R: 235, G: 182, B: 138 -> 0x46DD
        {r5: 24, g5: 16, b5: 11}, // R: 201, G: 132, B: 93  -> 0x2E18
        {r5: 20, g5: 12, b5: 9},  // R: 164, G: 98, B: 72   -> 0x2594
        {r5: 15, g5: 8, b5: 6}    // R: 122, G: 62, B: 51   -> 0x190F
    ];

    // Define new hair colors for palette updates
    const NEW_HAIR_COLORS_GBA5 = {
        burgundy: {r5: 23, g5: 7, b5: 3},    // R: 190, G: 55, B: 25 -> 0x0CF7
        darkBrown: {r5: 10, g5: 7, b5: 4},   // R: 84, G: 58, B: 35 -> 0x10EA
        beige: {r5: 29, g5: 29, b5: 21},     // R: 240, G: 236, B: 173 -> 0x57BD
        white: {r5: 31, g5: 31, b5: 31}      // R: 255, G: 255, B: 255 -> 0x7FFF
    };

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

            // Special handling for Orange palette (palIdx === 1) - replace specific colors with skin tones
            if (palIdx === 1) {
                // Clear the grid and regenerate with skin-tone replacements
                paletteGrid.innerHTML = '';
                let colorIndex = 0;
                const replacementPositions = [2, 7, 9, 12, 13];
                
                for (let vIdx = 0; vIdx < numValueSteps; vIdx++) {
                    const val = 1.0 - (vIdx * (0.6 / (numValueSteps - 1)));
                    for (let sIdx = 0; sIdx < numSatSteps; sIdx++) {
                        const sat = 1.0 - (sIdx * (0.7 / (numSatSteps - 1)));
                        let gba5;
                        
                        // Check if this position should be replaced with a skin tone
                        const replacementIndex = replacementPositions.indexOf(colorIndex);
                        if (replacementIndex !== -1 && replacementIndex < SKIN_TONE_REPLACEMENTS_GBA5.length) {
                            gba5 = SKIN_TONE_REPLACEMENTS_GBA5[replacementIndex];
                        } else {
                            const targetRgb8 = hsvToRgb(hue, sat, val);
                            gba5 = rgb8ToGbaRgb5(targetRgb8.r, targetRgb8.g, targetRgb8.b);
                        }
                        
                        paletteGrid.appendChild(createPaletteColorBlock(gba5, gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5)));
                        colorIndex++;
                    }
                }
            }

            // Special handling for Yellow palette (palIdx === 2) - replace position 2 with beige
            if (palIdx === 2) {
                // Clear the grid and regenerate with beige replacement
                paletteGrid.innerHTML = '';
                let colorIndex = 0;
                
                for (let vIdx = 0; vIdx < numValueSteps; vIdx++) {
                    const val = 1.0 - (vIdx * (0.6 / (numValueSteps - 1)));
                    for (let sIdx = 0; sIdx < numSatSteps; sIdx++) {
                        const sat = 1.0 - (sIdx * (0.7 / (numSatSteps - 1)));
                        let gba5;
                        
                        // Check if this is position 2 (beige replacement)
                        if (colorIndex === 2) {
                            gba5 = NEW_HAIR_COLORS_GBA5.beige;
                        } else {
                            const targetRgb8 = hsvToRgb(hue, sat, val);
                            gba5 = rgb8ToGbaRgb5(targetRgb8.r, targetRgb8.g, targetRgb8.b);
                        }
                        
                        paletteGrid.appendChild(createPaletteColorBlock(gba5, gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5)));
                        colorIndex++;
                    }
                }
            }

            const grayIndex = palIdx;
            const minGrayLevel = 3; const maxGrayLevel = 31;
            let grayLevelStep = 0;
            if (GENERAL_HUES_DEG.length > 1) grayLevelStep = (maxGrayLevel - minGrayLevel) / (GENERAL_HUES_DEG.length - 1);
            
            // Calculate original grayscale value for this palette
            const originalGrayLevel = Math.round(maxGrayLevel - (grayIndex * grayLevelStep));
            let finalGrayscaleGba5;

            // Implement color chain movements and new color replacements
            if (palIdx === 0) { // Red palette - replace with burgundy
                finalGrayscaleGba5 = NEW_HAIR_COLORS_GBA5.burgundy;
            } else if (palIdx === 1) { // Orange + Skin palette - replace with dark brown
                finalGrayscaleGba5 = NEW_HAIR_COLORS_GBA5.darkBrown;
            } else if (palIdx === 2) { // Yellow palette - gets white (moved from chain)
                finalGrayscaleGba5 = NEW_HAIR_COLORS_GBA5.white;
            } else if (palIdx === 3) { // Lime Green palette - gets yellow's original gray
                const yellowGrayIndex = 2; // Yellow is palIdx 2
                const yellowOriginalGray = Math.round(maxGrayLevel - (yellowGrayIndex * grayLevelStep));
                finalGrayscaleGba5 = { r5: yellowOriginalGray, g5: yellowOriginalGray, b5: yellowOriginalGray };
            } else if (palIdx === 4) { // Green-Cyan palette - gets lime green's original gray
                const limeGreenGrayIndex = 3; // Lime Green is palIdx 3
                const limeGreenOriginalGray = Math.round(maxGrayLevel - (limeGreenGrayIndex * grayLevelStep));
                finalGrayscaleGba5 = { r5: limeGreenOriginalGray, g5: limeGreenOriginalGray, b5: limeGreenOriginalGray };
            } else if (palIdx === 5) { // Cyan palette - gets green-cyan's original gray
                const greenCyanGrayIndex = 4; // Green-Cyan is palIdx 4
                const greenCyanOriginalGray = Math.round(maxGrayLevel - (greenCyanGrayIndex * grayLevelStep));
                finalGrayscaleGba5 = { r5: greenCyanOriginalGray, g5: greenCyanOriginalGray, b5: greenCyanOriginalGray };
            } else if (palIdx === 6) { // Azure palette - gets cyan's original gray
                const cyanGrayIndex = 5; // Cyan is palIdx 5
                const cyanOriginalGray = Math.round(maxGrayLevel - (cyanGrayIndex * grayLevelStep));
                finalGrayscaleGba5 = { r5: cyanOriginalGray, g5: cyanOriginalGray, b5: cyanOriginalGray };
            } else {
                // For Blue (7), Violet (8), Magenta (9) - keep original grayscale
                finalGrayscaleGba5 = { r5: originalGrayLevel, g5: originalGrayLevel, b5: originalGrayLevel };
            }

            paletteGrid.appendChild(createPaletteColorBlock(finalGrayscaleGba5, gbaRgb5ToRgb8(finalGrayscaleGba5.r5, finalGrayscaleGba5.g5, finalGrayscaleGba5.b5)));
            
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
    function downloadCanvasAsPNG() { /* ... (logic from draw/script.js, ensure it uses GRID_WIDTH, GRID_HEIGHT, gbaIntToGba5, and gbaRgb5ToRgb8) ... */ 
        let filename = (artworkTitleElement.childNodes[0].nodeValue.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sprite') + '.png';
        const tempCanvas = document.createElement('canvas'); tempCanvas.width = GRID_WIDTH; tempCanvas.height = GRID_HEIGHT; const tempCtx = tempCanvas.getContext('2d'); tempCtx.imageSmoothingEnabled = false;
        for (let y = 0; y < GRID_HEIGHT; y++) { for (let x = 0; x < GRID_WIDTH; x++) { const colorInt = pixelGrid[y][x]; if (colorInt !== null) { const gba5 = gbaIntToGba5(colorInt); const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5); tempCtx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`; tempCtx.fillRect(x, y, 1, 1); } } }
        const downloadLink = document.createElement('a'); downloadLink.download = filename; downloadLink.href = tempCanvas.toDataURL('image/png'); document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
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
    function init() {
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
        console.log('GBA Self-Sprite Editor with Animation Initialized.');
    }

    init();
}); 