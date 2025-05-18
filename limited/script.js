document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements for Color Info ---
    const selectedColorPreview = document.getElementById('selected-color-preview');
    const value15bitSpan = document.getElementById('selected-color-value-15bit');
    const valueHex8bitSpan = document.getElementById('selected-color-value-hex8bit');
    const valueRgb8bitSpan = document.getElementById('selected-color-value-rgb8bit');
    const dedicatedPalettesSection = document.getElementById('dedicated-palettes-section');
    const generalHuePalettesSection = document.getElementById('general-hue-palettes-section');
    const downloadJsonButton = document.getElementById('download-json-button');
    const downloadStripPngButton = document.getElementById('download-strip-png-button');

    // --- Color Conversion Functions (from parent script.js) ---
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

    function gbaRgb5ToRgb8(r5, g5, b5) {
        const r8 = (r5 << 3) | (r5 >> 2); // Equivalent to r5 * 255 / 31
        const g8 = (g5 << 3) | (g5 >> 2); // Equivalent to g5 * 255 / 31
        const b8 = (b5 << 3) | (b5 >> 2); // Equivalent to b5 * 255 / 31
        return { r: r8, g: g8, b: b8 };
    }

    function gbaRgb5ToHex15(r5, g5, b5) {
        const value15bit = (b5 << 10) | (g5 << 5) | r5;
        return `0x${value15bit.toString(16).toUpperCase().padStart(4, '0')}`;
    }

    // --- Palette Generation Logic ---
    const PALETTE_NAMES = [
        "Palette 0 (Protagonist)", "Palette 1 (Rock)", "Palette 2 (Sky/Celestial)",
        "Palette 3 (Items)", "Palette 4 (Flora/Fauna)", "Palette 5 (Aux)",
        "Palette 6 (General Red)",         // Hue 0°
        "Palette 7 (General Orange)",      // Hue 30°
        "Palette 8 (General Yellow)",      // Hue 55°
        "Palette 9 (General Lime Green)",  // Hue 90°
        "Palette 10 (General Green-Cyan)", // Hue 135°
        "Palette 11 (General Cyan)",       // Hue 180°
        "Palette 12 (General Azure)",      // Hue 216°
        "Palette 13 (General Blue)",       // Hue 252°
        "Palette 14 (General Violet)",     // Hue 288°
        "Palette 15 (General Magenta)"     // Hue 324°
    ];

    const STATIC_PALETTE_0_GBA5 = [ // Protagonist: Skin tones, neutral colors
        {r5:31, g5:25, b5:20}, {r5:30, g5:22, b5:18}, {r5:28, g5:20, b5:15}, // Skins
        {r5:10, g5:6, b5:3},   {r5:5, g5:10, b5:25},  {r5:24, g5:24, b5:24}, // Hair, Eyes, Shirt
        {r5:3, g5:5, b5:15},   {r5:15, g5:10, b5:5},  {r5:28, g5:5, b5:5},   // Pants, Shoes, Accent Red
        {r5:31, g5:28, b5:10}, {r5:18, g5:18, b5:18}, {r5:10, g5:10, b5:10}, // Accent Gold, Mid Gray, Dark Gray
        {r5:28, g5:26, b5:22}, {r5:20, g5:15, b5:10}, {r5:1, g5:1, b5:1}    // Beige, Light Brown, NearBlack Outline
    ];

    const STATIC_PALETTE_1_GBA5 = [ // Rock: Grayscale, mineral colors
        {r5:31, g5:31, b5:31}, {r5:26, g5:26, b5:26}, {r5:20, g5:20, b5:20}, // Grays
        {r5:14, g5:14, b5:14}, {r5:8, g5:8, b5:8},   {r5:3, g5:3, b5:3},     // Grays
        {r5:18, g5:14, b5:10}, {r5:16, g5:10, b5:8},  {r5:12, g5:14, b5:18}, // Brown, Reddish, Bluish Stone
        {r5:8, g5:15, b5:8},   {r5:20, g5:25, b5:31}, {r5:28, g5:22, b5:5},   // Mossy, Crystal, Gold Vein
        {r5:6, g5:6, b5:8},   {r5:28, g5:28, b5:26}, {r5:1, g5:1, b5:1}    // Dark Shadow, Highlight, NearBlack Crack
    ];

    const STATIC_PALETTE_2_GBA5 = [
        {r5:31, g5:31, b5:20}, {r5:31, g5:31, b5:0}, {r5:31, g5:20, b5:0}, 
        {r5:31, g5:10, b5:0}, {r5:31, g5:0, b5:0}, {r5:20, g5:0, b5:0}, 
        {r5:20, g5:25, b5:31}, {r5:10, g5:15, b5:31}, {r5:5, g5:5, b5:20},
        {r5:31, g5:31, b5:31}, {r5:26, g5:26, b5:26}, {r5:21, g5:21, b5:21},
        {r5:15, g5:15, b5:15}, {r5:8, g5:8, b5:8}, {r5:0, g5:0, b5:0}
    ];

    const STATIC_PALETTE_3_GBA5 = [ // Items: Grayscale, primary, tan/brown
        {r5:31, g5:31, b5:31}, {r5:22, g5:22, b5:22}, {r5:15, g5:15, b5:15}, // Grays
        {r5:6, g5:6, b5:6},   {r5:31, g5:0, b5:0},   {r5:0, g5:31, b5:0},    // Gray, Red, Green
        {r5:0, g5:0, b5:31},   {r5:31, g5:31, b5:0}, {r5:28, g5:22, b5:16}, // Blue, Yellow, Tan
        {r5:16, g5:10, b5:5},  {r5:22, g5:16, b5:10}, {r5:31, g5:15, b5:0},  // Brown, Light Brown, Orange
        {r5:20, g5:0, b5:31},  {r5:0, g5:31, b5:31},  {r5:1, g5:1, b5:1}     // Purple, Cyan, NearBlack Detail
    ];

    const STATIC_PALETTE_4_GBA5 = [ // Flora/Fauna: Greens, browns
        {r5:5, g5:25, b5:5},   {r5:10, g5:20, b5:8},  {r5:3, g5:15, b5:3},   // Leaf Greens
        {r5:15, g5:18, b5:5},  {r5:15, g5:10, b5:5},  {r5:10, g5:6, b5:3},    // Olive, Wood Browns
        {r5:6, g5:3, b5:1},    {r5:30, g5:8, b5:8},   {r5:31, g5:28, b5:10}, // Dark Wood, Flower Red, Yellow
        {r5:10, g5:15, b5:30}, {r5:20, g5:14, b5:8},  {r5:18, g5:18, b5:20}, // Flower Blue, Fur Brown, Gray
        {r5:15, g5:28, b5:15}, {r5:2, g5:10, b5:2},   {r5:1, g5:1, b5:1}     // Highlight Green, Shadow, NearBlack
    ];

    const STATIC_PALETTE_5_GBA5 = [ // Aux: Rainbow
        {r5:31, g5:0, b5:0},   {r5:31, g5:15, b5:0},  {r5:31, g5:31, b5:0}, // Red, Orange, Yellow
        {r5:15, g5:31, b5:0},  {r5:0, g5:31, b5:0},   {r5:0, g5:31, b5:15},  // Lime, Green, Spring Green
        {r5:0, g5:31, b5:31},   {r5:0, g5:15, b5:31},  {r5:0, g5:0, b5:31},    // Cyan, Sky Blue, Blue
        {r5:15, g5:0, b5:31},  {r5:31, g5:0, b5:31},  {r5:31, g5:15, b5:25}, // Violet, Magenta, Pink
        {r5:31, g5:31, b5:31}, {r5:22, g5:22, b5:22}, {r5:8, g5:8, b5:8}     // White, Light Gray, Dark Gray
    ];

    const GENERAL_HUES_DEG = [0, 30, 55, 90, 135, 180, 216, 252, 288, 324];

    // Store GBA 5-bit colors for all palettes for JSON export
    let allPalettesGba5 = Array(16).fill(null).map(() => Array(16).fill(null)); 

    function updateColorInfo(gba5Color, displayRgb8Color) {
        selectedColorPreview.style.backgroundColor = `rgb(${displayRgb8Color.r}, ${displayRgb8Color.g}, ${displayRgb8Color.b})`;
        value15bitSpan.textContent = gbaRgb5ToHex15(gba5Color.r5, gba5Color.g5, gba5Color.b5);
        
        const rHex = displayRgb8Color.r.toString(16).padStart(2, '0');
        const gHex = displayRgb8Color.g.toString(16).padStart(2, '0');
        const bHex = displayRgb8Color.b.toString(16).padStart(2, '0');
        valueHex8bitSpan.textContent = `#${rHex}${gHex}${bHex}`.toUpperCase();
        
        valueRgb8bitSpan.textContent = `(RGB: ${displayRgb8Color.r}, ${displayRgb8Color.g}, ${displayRgb8Color.b})`;
    }

    function createColorBlock(gba5Color, displayRgb8Color, isTransparent = false) {
        const block = document.createElement('div');
        block.classList.add('color-block');
        if (isTransparent) {
            block.classList.add('transparent-block');
            block.title = 'Transparent (Index 0)';
        } else {
            block.style.backgroundColor = `rgb(${displayRgb8Color.r}, ${displayRgb8Color.g}, ${displayRgb8Color.b})`;
            block.title = `${gbaRgb5ToHex15(gba5Color.r5, gba5Color.g5, gba5Color.b5)} (R:${gba5Color.r5}, G:${gba5Color.g5}, B:${gba5Color.b5})`;
        }
        block.addEventListener('click', () => {
            if (!isTransparent) {
                updateColorInfo(gba5Color, displayRgb8Color);
            }
        });
        return block;
    }

    function generatePaletteVisualization() {
        if (!dedicatedPalettesSection || !generalHuePalettesSection) {
            console.error('Palette section containers not found!');
            return;
        }
        dedicatedPalettesSection.innerHTML = '<h2 class="section-title">Dedicated Palettes (0-5)</h2>'; 
        generalHuePalettesSection.innerHTML = '<h2 class="section-title">General Hue Palettes (6-15)</h2>';

        const blackGba5 = { r5: 0, g5: 0, b5: 0 }; // Used for initial color info

        for (let palIdx = 0; palIdx < 16; palIdx++) {
            const paletteGroup = document.createElement('div');
            paletteGroup.classList.add('palette-group');

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('palette-title');
            
            const fullName = PALETTE_NAMES[palIdx] || `Palette ${palIdx}`;
            let mainTitle = fullName;
            let subTitle = '';

            const openParenIndex = fullName.indexOf('(');
            const closeParenIndex = fullName.indexOf(')');

            if (openParenIndex !== -1 && closeParenIndex > openParenIndex) {
                mainTitle = fullName.substring(0, openParenIndex).trim();
                subTitle = fullName.substring(openParenIndex + 1, closeParenIndex).trim();
                titleDiv.innerHTML = `${mainTitle}<br><span class="palette-subtitle">${subTitle}</span>`;
            } else {
                titleDiv.textContent = mainTitle;
            }
            
            paletteGroup.appendChild(titleDiv);

            const paletteGrid = document.createElement('div');
            paletteGrid.classList.add('palette-grid');
            let currentPaletteColorsGba5 = [];

            if (palIdx <= 5) {
                paletteGrid.appendChild(createColorBlock(null, null, true));
                allPalettesGba5[palIdx][0] = {r5:0, g5:0, b5:0}; // Placeholder for transparent
                let staticSet;
                if (palIdx === 0) staticSet = STATIC_PALETTE_0_GBA5;
                else if (palIdx === 1) staticSet = STATIC_PALETTE_1_GBA5;
                else if (palIdx === 2) staticSet = STATIC_PALETTE_2_GBA5;
                else if (palIdx === 3) staticSet = STATIC_PALETTE_3_GBA5;
                else if (palIdx === 4) staticSet = STATIC_PALETTE_4_GBA5;
                else if (palIdx === 5) staticSet = STATIC_PALETTE_5_GBA5;
                
                staticSet.forEach((gba5, i) => {
                    currentPaletteColorsGba5.push(gba5);
                    allPalettesGba5[palIdx][i+1] = gba5;
                    const displayRgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                    paletteGrid.appendChild(createColorBlock(gba5, displayRgb8));
                });
            } else { // palIdx >= 6 && palIdx <= 15
                const hue = GENERAL_HUES_DEG[palIdx - 6];
                const numValueSteps = 5;
                const numSatSteps = 3;
                let hueVariationsGba5 = [];

                for (let vIdx = 0; vIdx < numValueSteps; vIdx++) {
                    const val = 1.0 - (vIdx * (0.6 / (numValueSteps -1))); 
                    for (let sIdx = 0; sIdx < numSatSteps; sIdx++) {
                        const sat = 1.0 - (sIdx * (0.7 / (numSatSteps-1))); 
                        
                        const targetRgb8 = hsvToRgb(hue, sat, val);
                        const gba5Color = rgb8ToGbaRgb5(targetRgb8.r, targetRgb8.g, targetRgb8.b);
                        hueVariationsGba5.push(gba5Color);
                    }
                }

                hueVariationsGba5.forEach((gba5, i) => {
                    currentPaletteColorsGba5.push(gba5);
                    allPalettesGba5[palIdx][i] = gba5;
                    const displayRgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
                    paletteGrid.appendChild(createColorBlock(gba5, displayRgb8));
                });

                const grayIndex = palIdx - 6; 
                const minGrayLevel = 3; 
                const maxGrayLevel = 31; 
                const numGeneralHues = GENERAL_HUES_DEG.length;
                let grayLevelStep = 0;
                if (numGeneralHues > 1) {
                    grayLevelStep = (maxGrayLevel - minGrayLevel) / (numGeneralHues - 1);
                }
                const grayLevel = Math.round(maxGrayLevel - (grayIndex * grayLevelStep));
                const grayscaleGba5 = { r5: grayLevel, g5: grayLevel, b5: grayLevel };
                currentPaletteColorsGba5.push(grayscaleGba5);
                allPalettesGba5[palIdx][15] = grayscaleGba5;
                const grayscaleRgb8 = gbaRgb5ToRgb8(grayscaleGba5.r5, grayscaleGba5.g5, grayscaleGba5.b5);
                paletteGrid.appendChild(createColorBlock(grayscaleGba5, grayscaleRgb8));
            }
            paletteGroup.appendChild(paletteGrid);
            if (palIdx <= 5) {
                dedicatedPalettesSection.appendChild(paletteGroup);
            } else {
                generalHuePalettesSection.appendChild(paletteGroup);
            }
        }
        updateColorInfo({r5:0,g5:0,b5:0}, gbaRgb5ToRgb8(0,0,0)); // Initial display
    }

    function downloadAllPalettesAsJson() {
        let linearColorArrayHex = [];
        for (let palIdx = 0; palIdx < 16; palIdx++) {
            for (let colorIdx = 0; colorIdx < 16; colorIdx++) {
                const gba5 = allPalettesGba5[palIdx][colorIdx];
                if (gba5) { // Should always have a gba5 object here
                    linearColorArrayHex.push(gbaRgb5ToHex15(gba5.r5, gba5.g5, gba5.b5));
                } else {
                     // This case should ideally not be hit if allPalettesGba5 is populated correctly
                    linearColorArrayHex.push("0x0000"); // Fallback for any unexpectedly missing color
                }
            }
        }

        const jsonData = JSON.stringify(linearColorArrayHex, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gba_full_palette_set.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('JSON download initiated.');
    }

    function generateAndDownloadHueStripPng() {
        const allGeneralHueColorsRaw = [];
        // Palettes 6 through 15 are indices 6 through 15 in allPalettesGba5
        for (let palIdx = 6; palIdx <= 15; palIdx++) {
            if (allPalettesGba5[palIdx]) {
                for (let colorIdx = 0; colorIdx < 16; colorIdx++) {
                    const gba5 = allPalettesGba5[palIdx][colorIdx];
                    if (gba5) { 
                        allGeneralHueColorsRaw.push(gba5);
                    } else {
                        allGeneralHueColorsRaw.push({r5:0, g5:0, b5:0}); 
                    }
                }
            }
        }

        if (allGeneralHueColorsRaw.length !== 160) {
            console.error('Error: Expected 160 raw general hue colors, got', allGeneralHueColorsRaw.length);
            alert('Could not generate PNG strip: Raw color data incomplete.');
            return;
        }

        const stripColors = [];
        // Add pure black as the first color
        stripColors.push({r5:0, g5:0, b5:0});

        // Add the first 159 colors from the general hue palettes
        for (let i = 0; i < 159; i++) {
            stripColors.push(allGeneralHueColorsRaw[i]);
        }

        // At this point, stripColors should have 1 (black) + 159 (hues) = 160 colors.

        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');

        stripColors.forEach((gba5, index) => {
            const rgb8 = gbaRgb5ToRgb8(gba5.r5, gba5.g5, gba5.b5);
            ctx.fillStyle = `rgb(${rgb8.r}, ${rgb8.g}, ${rgb8.b})`;
            ctx.fillRect(index, 0, 1, 1);
        });

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'general_hues_strip.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(dataUrl); // Clean up blob from memory, not strictly needed for dataURLs but good practice if it were a blob URL
            console.log('PNG strip download initiated.');
        } catch (e) {
            console.error('Error generating PNG:', e);
            alert('Failed to generate PNG. See console for details.');
        }
    }

    if (downloadJsonButton) {
        downloadJsonButton.addEventListener('click', downloadAllPalettesAsJson);
    }
    if (downloadStripPngButton) {
        downloadStripPngButton.addEventListener('click', generateAndDownloadHueStripPng);
    }

    generatePaletteVisualization();
    console.log('GBA 16-Color Palette Explorer Initialized with Sections');
}); 