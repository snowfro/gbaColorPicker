// Wait for the DOM and the parent script to load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Pixel editor script loaded.");

    // --- DOM Elements ---
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
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
        downloadLink.download = 'pixel-art.png';
        downloadLink.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        console.log("PNG download complete");
    }
    
    function downloadPaletteAsJSON() {
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
            
            // Add to palette array
            paletteArray.push({
                color_15bit: hex15bit,
                color_hex: hex8bit,
                rgb: [r8, g8, b8]
            });
        });
        
        // Sort the palette (optional - by 15-bit value)
        paletteArray.sort((a, b) => parseInt(a.color_15bit, 16) - parseInt(b.color_15bit, 16));
        
        // Create JSON object with metadata
        const paletteJSON = {
            format: "GBA 15-bit (RGB555)",
            palette: paletteArray,
            total_colors: paletteArray.length
        };
        
        // Convert to JSON string
        const jsonString = JSON.stringify(paletteJSON, null, 2); // Pretty-print with 2-space indentation
        
        // Create the download blob and link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.download = 'palette.json';
        downloadLink.href = blobUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL to avoid memory leaks
        URL.revokeObjectURL(blobUrl);
        console.log("Palette JSON download complete");
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

    downloadPngBtn.addEventListener('click', downloadCanvasAsPNG);
    downloadJsonBtn.addEventListener('click', downloadPaletteAsJSON);

    // --- Initialization ---
    setupCanvas();
    setActiveTool('pencil');
    console.log("Pixel editor initialized.");
}); 