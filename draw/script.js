// Wait for the DOM and the parent script to load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Pixel editor script loaded.");

    // Check if the parent script initialized the color picker properly
    if (!window.colorPickerInitialized && 
        !document.getElementById('selected-color-preview')?.style?.backgroundColor) {
        console.error("Parent color picker script might not have initialized properly!");
        
        // Try to create a notification for the user
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'orange';
        errorMsg.style.padding = '20px';
        errorMsg.style.border = '1px solid orange';
        errorMsg.style.marginBottom = '10px';
        errorMsg.innerHTML = '<strong>Warning:</strong> Color picker not initialized. The editor may not work correctly.';
        document.body.prepend(errorMsg);
    }

    // --- DOM Elements ---
    const canvas = document.getElementById('pixel-canvas');
    console.log("Canvas element found:", !!canvas);
    
    if (!canvas) {
        console.error("Canvas element not found! Check HTML structure.");
        // Try to create a notification for the user
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '20px';
        errorMsg.style.border = '1px solid red';
        errorMsg.innerHTML = '<strong>Error:</strong> Canvas element not found. Please check browser console for details.';
        document.body.prepend(errorMsg);
        return; // Exit initialization if canvas is missing
    }
    
    const ctx = canvas.getContext('2d');
    console.log("Canvas context:", !!ctx);
    const canvasContainer = document.getElementById('canvas-container');
    const pencilToolBtn = document.getElementById('pencil-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const undoButton = document.getElementById('undo-button');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadJsonBtn = document.getElementById('download-json');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    const resizeButton = document.getElementById('resize-button');
    const appContainer = document.querySelector('.app-container');
    const usedColorsGrid = document.getElementById('used-colors-grid');
    const artworkTitle = document.getElementById('artwork-title');

    const selectedColorPreview = document.getElementById('selected-color-preview');
    const selectedColor15BitSpan = document.getElementById('selected-color-value-15bit');
    
    // --- Random Title Generator ---
    const adjectives = [
        "Cosmic", "Pixel", "Digital", "Retro", "Neon", "Mystic", 
        "Crystal", "Ancient", "Vibrant", "Silent", "Binary", "Eternal",
        "Golden", "Stellar", "Infinite", "Dreamy", "Hidden", "Glowing"
    ];
    
    const nouns = [
        "Harmony", "Galaxy", "Depths", "Dreams", "Kingdom", "Adventure",
        "Journey", "Realm", "Legends", "Forest", "Nebula", "Frontier",
        "Portal", "Horizon", "Odyssey", "Vision", "Islands", "Voyage"
    ];
    
    function generateRandomTitle() {
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${randomAdj} ${randomNoun}`;
    }
    
    // Initialize with random title if it has the default text
    if (artworkTitle && artworkTitle.textContent.includes("Cosmic Harmony")) {
        artworkTitle.childNodes[0].nodeValue = generateRandomTitle() + " ";
    }
    
    // Make title editable on click
    if (artworkTitle) {
        // Mouse click event for title editing
        artworkTitle.addEventListener('click', function(e) {
            // Only proceed if we clicked on the text or edit icon
            if (e.target === this || e.target.classList.contains('edit-icon')) {
                const currentTitle = this.childNodes[0].nodeValue.trim();
                const newTitle = prompt("Enter a new title for your artwork:", currentTitle);
                
                if (newTitle !== null && newTitle.trim() !== "") {
                    this.childNodes[0].nodeValue = newTitle.trim() + " ";
                }
            }
        });
        
        // Touch event for title editing
        artworkTitle.addEventListener('touchend', function(e) {
            e.preventDefault();
            // Prevent double-firing with click event
            e.stopPropagation();
            
            // Only proceed if we tapped on the text or edit icon
            if (e.target === this || e.target.classList.contains('edit-icon')) {
                const currentTitle = this.childNodes[0].nodeValue.trim();
                const newTitle = prompt("Enter a new title for your artwork:", currentTitle);
                
                if (newTitle !== null && newTitle.trim() !== "") {
                    this.childNodes[0].nodeValue = newTitle.trim() + " ";
                }
            }
        }, { passive: false });
    }

    // --- Grid & Drawing State ---
    let gridWidth = parseInt(widthInput.value, 10);
    let gridHeight = parseInt(heightInput.value, 10);
    const pixelSize = 20;
    let selectedTool = 'pencil';
    let isDrawing = false;
    let pixelGrid;
    let usedColors = new Set();
    
    // --- Undo History ---
    let history = [];
    const MAX_HISTORY = 20; // Limit history to prevent memory issues
    
    // --- Initialize Pixel Grid Data ---
    function setupGrid() {
        pixelGrid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));
        usedColors.clear();
        updateUsedColorsPalette();
        console.log(`Pixel grid initialized: ${gridWidth}x${gridHeight}`);
        
        // Clear history when setting up a new grid
        history = [];
    }
    
    // Save current state to history
    function saveToHistory() {
        // Create a deep copy of the current grid
        const gridCopy = pixelGrid.map(row => [...row]);
        
        // Save to history
        history.push({
            grid: gridCopy,
            colors: new Set(usedColors)
        });
        
        // Trim history if it gets too large
        if (history.length > MAX_HISTORY) {
            history.shift();
        }
    }
    
    // Perform undo operation
    function undo() {
        if (history.length === 0) {
            console.log("Nothing to undo");
            return;
        }
        
        // Get the last state
        const lastState = history.pop();
        
        // Restore grid and used colors
        pixelGrid = lastState.grid;
        usedColors = lastState.colors;
        
        // Redraw and update UI
        redrawAll();
        updateUsedColorsPalette();
        console.log("Undo performed");
    }

    // --- ADDED: Used Colors Palette Functions ---
    
    // Update the used colors palette display
    function updateUsedColorsPalette() {
        usedColorsGrid.innerHTML = '';
        
        if (usedColors.size === 0) {
            const emptyMsg = document.createElement('span');
            emptyMsg.className = 'empty-palette-msg';
            emptyMsg.textContent = 'No colors used yet';
            emptyMsg.style.fontSize = '0.8em';
            emptyMsg.style.color = '#888';
            usedColorsGrid.appendChild(emptyMsg);
            return;
        }
        
        usedColors.forEach(color15bit => {
            const color = parseInt(color15bit, 16);
            const r5 = color & 0x1F;
            const g5 = (color >> 5) & 0x1F;
            const b5 = (color >> 10) & 0x1F;
            
            const r8 = (r5 << 3) | (r5 >> 2);
            const g8 = (g5 << 3) | (g5 >> 2);
            const b8 = (b5 << 3) | (b5 >> 2);
            
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = `rgb(${r8}, ${g8}, ${b8})`;
            swatch.dataset.color15bit = color15bit;
            
            swatch.addEventListener('click', () => {
                const hexValue = `0x${color15bit.toUpperCase()}`;
                selectedColor15BitSpan.textContent = hexValue;
                selectedColorPreview.style.backgroundColor = `rgb(${r8}, ${g8}, ${b8})`;
                
                const rgbSpan = document.getElementById('selected-color-value-rgb8bit');
                if (rgbSpan) {
                    rgbSpan.textContent = `(RGB: ${r8}, ${g8}, ${b8})`;
                }
                
                const hex8bitSpan = document.getElementById('selected-color-value-hex8bit');
                if (hex8bitSpan) {
                    const hexString = `#${r8.toString(16).padStart(2, '0')}${g8.toString(16).padStart(2, '0')}${b8.toString(16).padStart(2, '0')}`.toUpperCase();
                    hex8bitSpan.textContent = hexString;
                }
            });
            
            usedColorsGrid.appendChild(swatch);
        });
    }
    
    // Add or remove a color from the used colors Set
    function trackUsedColor(color15bit, isAdding) {
        if (!color15bit && color15bit !== 0) return;
        
        const color15bitHex = color15bit.toString(16).padStart(4, '0');
        
        if (isAdding) {
            if (!usedColors.has(color15bitHex)) {
                usedColors.add(color15bitHex);
                updateUsedColorsPalette();
            }
        } else {
            let colorStillUsed = false;
            
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    if (pixelGrid[y][x] === color15bit) {
                        colorStillUsed = true;
                        break;
                    }
                }
                if (colorStillUsed) break;
            }
            
            if (!colorStillUsed) {
                usedColors.delete(color15bitHex);
                updateUsedColorsPalette();
            }
        }
    }

    // --- Layout Update Function ---
    function updateLayout() {
        if (!appContainer) return;

        if (gridWidth > gridHeight) {
            // Landscape: Picker left, palette middle, controls right on top row
            // Canvas on bottom spanning all columns
            console.log("Layout: Landscape");
            appContainer.style.gridTemplateAreas = 
                '"picker palette controls" ' +
                '"canvas canvas canvas"';
            appContainer.style.gridTemplateColumns = 'auto auto auto'; // Three columns
            appContainer.style.gridTemplateRows = 'auto 1fr'; // Two rows

        } else {
            // Portrait or Square: Stacked on left (picker, palette, controls), canvas on right
            console.log("Layout: Portrait/Square");
            appContainer.style.gridTemplateAreas = 
                '"picker  canvas" ' +
                '"palette canvas" ' +
                '"controls canvas"';
            appContainer.style.gridTemplateColumns = 'auto 1fr';
            appContainer.style.gridTemplateRows = 'auto auto auto'; // Three rows
        }
    }

    // --- Canvas Setup / Resize ---
    function setupCanvas() {
        gridWidth = parseInt(widthInput.value, 10) || 16;
        gridHeight = parseInt(heightInput.value, 10) || 16;

        const minW = parseInt(widthInput.min, 10) || 1;
        const maxW = parseInt(widthInput.max, 10) || 128;
        const minH = parseInt(heightInput.min, 10) || 1;
        const maxH = parseInt(heightInput.max, 10) || 128;
        gridWidth = Math.max(minW, Math.min(maxW, gridWidth));
        gridHeight = Math.max(minH, Math.min(maxH, gridHeight));
        widthInput.value = gridWidth;
        heightInput.value = gridHeight;

        setupGrid();

        canvas.width = gridWidth * pixelSize;
        canvas.height = gridHeight * pixelSize;
        ctx.imageSmoothingEnabled = false;

        canvasContainer.style.backgroundSize = `${pixelSize * 2}px ${pixelSize * 2}px`;
        const offset = pixelSize / 2;
        canvasContainer.style.backgroundPosition = `0 0, 0 ${offset}px, ${offset}px ${-offset}px, ${-offset}px 0px`;

        console.log(`Canvas setup/resized: ${canvas.width}x${canvas.height}`);
        redrawAll();

        updateLayout();
    }

    // --- Drawing Logic (Placeholders) ---
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellX = Math.floor(x / pixelSize);
        const cellY = Math.floor(y / pixelSize);
        return { cellX, cellY };
    }

    function drawPixel(cellX, cellY) {
        if (cellX < 0 || cellX >= gridWidth || cellY < 0 || cellY >= gridHeight) {
            return;
        }

        const prevColor = pixelGrid[cellY][cellX];

        const tempColorRgbString = selectedColorPreview.style.backgroundColor;
        
        let color15bit = null;
        if (selectedColor15BitSpan && selectedColor15BitSpan.textContent) {
            color15bit = parseInt(selectedColor15BitSpan.textContent, 16);
        }

        if (selectedTool === 'pencil') {
            ctx.fillStyle = tempColorRgbString;
            ctx.fillRect(cellX * pixelSize, cellY * pixelSize, pixelSize, pixelSize);
            
            pixelGrid[cellY][cellX] = color15bit;
            
            trackUsedColor(color15bit, true);
            
        } else if (selectedTool === 'eraser') {
            ctx.clearRect(cellX * pixelSize, cellY * pixelSize, pixelSize, pixelSize);
            
            if (prevColor !== null) {
                pixelGrid[cellY][cellX] = null;
                
                trackUsedColor(prevColor, false);
            }
        }
    }

    // --- Redraw Function ---
    function redrawAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const color15bit = pixelGrid[y][x];
                if (color15bit !== null) {
                    // Get the RGB components
                    const r5 = color15bit & 0x1F;
                    const g5 = (color15bit >> 5) & 0x1F;
                    const b5 = (color15bit >> 10) & 0x1F;
                    
                    // Convert to 8-bit
                    const r8 = (r5 << 3) | (r5 >> 2);
                    const g8 = (g5 << 3) | (g5 >> 2);
                    const b8 = (b5 << 3) | (b5 >> 2);
                    
                    // Set fill color and draw
                    ctx.fillStyle = `rgb(${r8}, ${g8}, ${b8})`;
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            }
        }
        console.log("Redrawn canvas");
    }

    // --- Export Functions ---
    function downloadCanvasAsPNG() {
        // Get current artwork title for the filename
        let filename = 'pixel-art.png'; // Default filename
        if (artworkTitle && artworkTitle.childNodes[0].nodeValue) {
            // Get title text and clean it for use as a filename
            const titleText = artworkTitle.childNodes[0].nodeValue.trim();
            if (titleText) {
                // Replace spaces and special chars with underscores, remove any non-alphanumeric chars
                const safeFilename = titleText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                filename = `${safeFilename}.png`;
            }
        }
        
        // Create a temporary canvas at actual pixel size (1:1)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gridWidth;
        tempCanvas.height = gridHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = false; // Disable anti-aliasing
        
        // Iterate through the grid and draw each pixel at 1:1 scale
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const color15bit = pixelGrid[y][x];
                if (color15bit !== null) {
                    // Get color components
                    const r5 = color15bit & 0x1F;
                    const g5 = (color15bit >> 5) & 0x1F;
                    const b5 = (color15bit >> 10) & 0x1F;
                    
                    // Convert to 8-bit
                    const r8 = (r5 << 3) | (r5 >> 2);
                    const g8 = (g5 << 3) | (g5 >> 2);
                    const b8 = (b5 << 3) | (b5 >> 2);
                    
                    // Draw a single pixel
                    tempCtx.fillStyle = `rgb(${r8}, ${g8}, ${b8})`;
                    tempCtx.fillRect(x, y, 1, 1);
                }
                // Transparent pixels are already transparent by default
            }
        }
        
        // Create the download link
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        console.log(`PNG download complete: ${filename}`);
    }
    
    function downloadPaletteAsJSON() {
        // Get current artwork title for the filename
        let filename = 'palette.json'; // Default filename
        if (artworkTitle && artworkTitle.childNodes[0].nodeValue) {
            // Get title text and clean it for use as a filename
            const titleText = artworkTitle.childNodes[0].nodeValue.trim();
            if (titleText) {
                // Replace spaces and special chars with underscores, remove any non-alphanumeric chars
                const safeFilename = titleText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                filename = `${safeFilename}_palette.json`;
            }
        }
        
        // Prepare the palette data
        const paletteArray = [];
        
        usedColors.forEach(colorHex => {
            // Parse the hex string back to an integer
            const color15bit = parseInt(colorHex, 16);
            
            // Extract color components
            const r5 = color15bit & 0x1F;
            const g5 = (color15bit >> 5) & 0x1F;
            const b5 = (color15bit >> 10) & 0x1F;
            
            // Convert to 8-bit
            const r8 = (r5 << 3) | (r5 >> 2);
            const g8 = (g5 << 3) | (g5 >> 2);
            const b8 = (b5 << 3) | (b5 >> 2);
            
            // Create 8-bit hex representation
            const hex8bit = `#${r8.toString(16).padStart(2, '0')}${g8.toString(16).padStart(2, '0')}${b8.toString(16).padStart(2, '0')}`.toUpperCase();
            
            // Create 15-bit hex representation
            const hex15bit = `0x${colorHex.toUpperCase()}`;
            
            // Create the grit-compatible format - this is the key difference
            // Grit typically expects format 0x8000 | (b5 << 10) | (g5 << 5) | r5
            // Note: The 0x8000 bit is sometimes used in GBA to indicate opacity
            const gritHex = `0x${((0x8000 | (b5 << 10) | (g5 << 5) | r5)).toString(16).toUpperCase()}`;
            
            // Add to palette array
            paletteArray.push({
                color_15bit: hex15bit,
                color_hex: hex8bit,
                grit_format: gritHex,
                gba_components: {
                    r: r5,
                    g: g5, 
                    b: b5
                },
                rgb: [r8, g8, b8]
            });
        });
        
        // Sort the palette (optional - by 15-bit value)
        paletteArray.sort((a, b) => parseInt(a.color_15bit, 16) - parseInt(b.color_15bit, 16));
        
        // Create JSON object with metadata
        const paletteJSON = {
            format: "GBA 15-bit (RGB555)",
            title: artworkTitle ? artworkTitle.childNodes[0].nodeValue.trim() : "Untitled",
            palette: paletteArray,
            total_colors: paletteArray.length,
            notes: "For use with grit, use the grit_format field or the individual r,g,b components in gba_components"
        };
        
        // Convert to JSON string
        const jsonString = JSON.stringify(paletteJSON, null, 2); // Pretty-print with 2-space indentation
        
        // Create the download blob and link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = blobUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL to avoid memory leaks
        URL.revokeObjectURL(blobUrl);
        console.log(`JSON download complete: ${filename}`);
    }
    
    function downloadGbaHeader() {
        // Get current artwork title for the filename
        let filename = 'palette.h'; // Default filename
        let variableName = 'gba_palette'; // Default variable name
        
        if (artworkTitle && artworkTitle.childNodes[0].nodeValue) {
            // Get title text and clean it for use as a filename and variable name
            const titleText = artworkTitle.childNodes[0].nodeValue.trim();
            if (titleText) {
                // Replace spaces and special chars with underscores, remove any non-alphanumeric chars
                const safeName = titleText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                filename = `${safeName}_palette.h`;
                variableName = `${safeName}_palette`;
            }
        }
        
        // Collect the palette in GBA-compatible format
        const gbaColors = [];
        
        usedColors.forEach(colorHex => {
            // Parse the hex string back to an integer
            const color15bit = parseInt(colorHex, 16);
            
            // Extract color components
            const r5 = color15bit & 0x1F;
            const g5 = (color15bit >> 5) & 0x1F;
            const b5 = (color15bit >> 10) & 0x1F;
            
            // Create the GBA color in the correct format (with alpha bit set)
            // This is the format grit expects: 0x8000 | (b << 10) | (g << 5) | r
            const gbaColor = 0x8000 | (b5 << 10) | (g5 << 5) | r5;
            
            gbaColors.push(gbaColor);
        });
        
        // Sort the palette (optional)
        gbaColors.sort((a, b) => a - b);
        
        // Create the C header content
        let headerContent = `// GBA Palette: ${artworkTitle ? artworkTitle.childNodes[0].nodeValue.trim() : "Untitled"}\n`;
        headerContent += `// Generated by GBA Pixel Art Editor\n`;
        headerContent += `// Total colors: ${gbaColors.length}\n\n`;
        
        headerContent += `#ifndef ${variableName.toUpperCase()}_H\n`;
        headerContent += `#define ${variableName.toUpperCase()}_H\n\n`;
        
        headerContent += `// Define the palette in GBA-compatible format\n`;
        headerContent += `// RGB555 format with alpha bit (0x8000) set\n`;
        headerContent += `const unsigned short ${variableName}[${gbaColors.length}] = {\n`;
        
        // Add each color as a hex value
        gbaColors.forEach((color, index) => {
            if (index > 0 && index % 8 === 0) {
                headerContent += '\n    '; // Add a newline every 8 colors for readability
            } else if (index > 0) {
                headerContent += ' ';
            } else {
                headerContent += '    ';
            }
            
            headerContent += `0x${color.toString(16).toUpperCase().padStart(4, '0')}`;
            
            if (index < gbaColors.length - 1) {
                headerContent += ',';
            }
        });
        
        headerContent += '\n};\n\n';
        
        // Add some helper macros for the most common colors (optional)
        if (gbaColors.length > 0) {
            headerContent += `// Some helper macros for commonly used colors\n`;
            headerContent += `#define ${variableName.toUpperCase()}_SIZE ${gbaColors.length}\n`;
            
            // If there are 16 or fewer colors, create a macro for each color index
            if (gbaColors.length <= 16) {
                headerContent += `// Color index macros\n`;
                for (let i = 0; i < gbaColors.length; i++) {
                    headerContent += `#define ${variableName.toUpperCase()}_COLOR_${i} ${i}\n`;
                }
            }
        }
        
        headerContent += `\n#endif // ${variableName.toUpperCase()}_H\n`;
        
        // Create the download blob and link
        const blob = new Blob([headerContent], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = blobUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL to avoid memory leaks
        URL.revokeObjectURL(blobUrl);
        console.log(`GBA palette header download complete: ${filename}`);
    }

    // --- Tool Selection Logic ---
    function setActiveTool(tool) {
        selectedTool = tool;
        pencilToolBtn.classList.toggle('active', tool === 'pencil');
        eraserToolBtn.classList.toggle('active', tool === 'eraser');
        console.log("Tool selected:", selectedTool);
    }

    // --- Event Listeners ---
    pencilToolBtn.addEventListener('click', () => setActiveTool('pencil'));
    eraserToolBtn.addEventListener('click', () => setActiveTool('eraser'));
    undoButton.addEventListener('click', undo);

    resizeButton.addEventListener('click', setupCanvas);

    // --- Mouse Events ---
    canvas.addEventListener('mousedown', (e) => {
        // Save current state before drawing
        saveToHistory();
        
        isDrawing = true;
        drawPixel(getCoords(e).cellX, getCoords(e).cellY);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            drawPixel(getCoords(e).cellX, getCoords(e).cellY);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });

    // --- Touch Events for Mobile/iPad ---
    canvas.addEventListener('touchstart', (e) => {
        // Prevent default to stop scrolling
        e.preventDefault();
        
        // Save current state before drawing
        saveToHistory();
        
        isDrawing = true;
        
        // Convert touch position to canvas coordinates
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        drawPixel(getCoords(mouseEvent).cellX, getCoords(mouseEvent).cellY);
    }, { passive: false }); // passive: false is needed to make preventDefault() work

    canvas.addEventListener('touchmove', (e) => {
        // Prevent default to stop scrolling
        e.preventDefault();
        
        if (isDrawing) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            
            drawPixel(getCoords(mouseEvent).cellX, getCoords(mouseEvent).cellY);
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDrawing = false;
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        isDrawing = false;
    }, { passive: false });

    downloadPngBtn.addEventListener('click', downloadCanvasAsPNG);
    downloadJsonBtn.addEventListener('click', downloadPaletteAsJSON);
    const downloadGbaBtn = document.getElementById('download-gba');
    if (downloadGbaBtn) {
        downloadGbaBtn.addEventListener('click', downloadGbaHeader);
    }

    // --- Initialization ---
    setupCanvas();
    setActiveTool('pencil');
    console.log("Pixel editor initialized.");
}); 