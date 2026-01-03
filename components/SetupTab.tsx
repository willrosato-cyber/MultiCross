'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface Clue {
  number: number;
  text: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

interface SetupTabProps {
  onComplete: (pattern: number[][], clueNumbers: number[][], clues: { across: Clue[]; down: Clue[] }) => void;
  onPlay: () => void;
  gridSize: 15 | 21;
  onGridSizeChange: (size: 15 | 21) => void;
  onJoinGame: (code: string) => void;
}

export default function SetupTab({ onComplete, onPlay, gridSize, onGridSizeChange, onJoinGame }: SetupTabProps) {
  const GRID_SIZE = gridSize;
  
  const [patternText, setPatternText] = useState<string>(
    Array(gridSize).fill('1'.repeat(gridSize)).join('\n')
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [savedPattern, setSavedPattern] = useState<number[][] | null>(null);
  const [clueNumbers, setClueNumbers] = useState<number[][]>([]);
  const [cropCoords, setCropCoords] = useState({ x: 42, y: 6, width: 54, height: 42 });
  const [isCropping, setIsCropping] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [cluesText, setCluesText] = useState('');
  const [isParsingClues, setIsParsingClues] = useState(false);
  const [clueParseProgress, setClueParseProgress] = useState(0);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setIsCropping(false);
        // Reset crop to default (will be adjusted after image loads)
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetCropArea = () => {
    if (!imageRef.current) return;
    
    // Default crop based on user's preferred settings
    const img = imageRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // User's preferred crop area: X 42%, Y 6%, Width 54%, Height 42%
    setCropCoords({
      x: Math.floor(imgWidth * 0.42),
      y: Math.floor(imgHeight * 0.06),
      width: Math.floor(imgWidth * 0.54),
      height: Math.floor(imgHeight * 0.42),
    });
    setIsCropping(true);
    updateCroppedPreview(
      Math.floor(imgWidth * 0.42),
      Math.floor(imgHeight * 0.06),
      Math.floor(imgWidth * 0.54),
      Math.floor(imgHeight * 0.42)
    );
  };

  const updateCroppedPreview = (x: number, y: number, width: number, height: number) => {
    if (!imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(
      imageRef.current,
      x, y, width, height,
      0, 0, width, height
    );
    
    setCroppedPreview(canvas.toDataURL());
  };

  const preprocessImageForOCR = async (canvas: HTMLCanvasElement): Promise<string> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL();

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Increase contrast and convert to grayscale with adaptive thresholding
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Increase contrast: if it's closer to white, make it whiter; if closer to black, make it blacker
      let enhanced = gray;
      if (gray > 127) {
        enhanced = Math.min(255, gray * 1.2); // Brighten light areas
      } else {
        enhanced = Math.max(0, gray * 0.8);   // Darken dark areas
      }
      
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  const handleParseClues = async () => {
    if (!uploadedImage || !imageRef.current) {
      alert('Please upload an image first');
      return;
    }

    setIsParsingClues(true);
    setClueParseProgress(0);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // For NYT crosswords, clues are typically on the left side
      // Parse the entire clue area (left ~45% of image)
      const clueAreaWidth = Math.floor(img.naturalWidth * 0.45);
      const clueHeight = img.naturalHeight;

      canvas.width = clueAreaWidth;
      canvas.height = clueHeight;
      
      ctx.drawImage(
        img,
        0, 0, clueAreaWidth, clueHeight,  // Source: left portion with clues
        0, 0, clueAreaWidth, clueHeight   // Destination
      );
      
      const clueImageData = canvas.toDataURL();
      setClueParseProgress(10);

      // Preprocess image for better OCR: increase contrast and sharpness
      const preprocessedImage = await preprocessImageForOCR(canvas);
      setClueParseProgress(15);

      // Use Tesseract with settings optimized for structured lists
      const result = await Tesseract.recognize(
        preprocessedImage,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setClueParseProgress(15 + Math.round(m.progress * 75));
            }
          }
        }
      );

      setClueParseProgress(90);

      // Process the text to find ACROSS/DOWN boundaries
      const formattedClues = processCluesWithBoundaries(result.data);
      setCluesText(formattedClues);
      
      setClueParseProgress(100);
      alert('Clues parsed successfully! Review and edit as needed.');
      
    } catch (error) {
      console.error('Error parsing clues:', error);
      alert('Error parsing clues. Please enter them manually.');
    } finally {
      setIsParsingClues(false);
      setClueParseProgress(0);
    }
  };

  const processCluesWithBoundaries = (ocrData: any): string => {
    // Use the raw text output from Tesseract
    const rawText = ocrData.text || '';
    
    console.log('Raw OCR output:', rawText); // Debug log
    
    // Split into lines and clean up
    const lines = rawText.split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    let acrossClues: string[] = [];
    let downClues: string[] = [];
    let currentSection: 'none' | 'across' | 'down' = 'none';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for section headers (case insensitive, allow variations)
      if (/^ACROSS/i.test(line)) {
        currentSection = 'across';
        console.log('Found ACROSS section');
        continue;
      }
      if (/^DOWN/i.test(line)) {
        currentSection = 'down';
        console.log('Found DOWN section');
        continue;
      }

      // Try to match clue format: number followed by period/space/colon and text
      // Pattern specifically looks for: 
      // - One or more digits at start
      // - Followed by common separators (., :, space, comma, etc.)
      // - Followed by text (the actual clue)
      const clueMatch = line.match(/^(\d+)[.\s:,)\]}\-|]+(.+)$/);
      
      if (clueMatch) {
        const number = clueMatch[1];
        let clueText = clueMatch[2].trim();
        
        console.log(`Found clue ${number} in ${currentSection}: ${clueText.substring(0, 30)}...`);
        
        // Handle multi-line clues: if next lines don't start with a number or header, append them
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          
          // Stop if we hit a new clue number, section header, or empty line
          if (!nextLine || 
              /^\d+[.\s:,)\]}\-|]/.test(nextLine) || 
              /^ACROSS$/i.test(nextLine) || 
              /^DOWN$/i.test(nextLine)) {
            break;
          }
          
          clueText += ' ' + nextLine;
          console.log(`  Appending line: ${nextLine.substring(0, 20)}...`);
          i = j;
          j++;
        }
        
        // Clean up the clue text
        clueText = clueText
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .replace(/[|]/g, '')    // Remove OCR artifacts
          .replace(/['']/g, "'")  // Normalize quotes
          .trim();
        
        const formattedClue = `${number}. ${clueText}`;
        
        if (currentSection === 'across') {
          acrossClues.push(formattedClue);
        } else if (currentSection === 'down') {
          downClues.push(formattedClue);
        } else {
          console.log(`Skipping clue ${number} - no section context yet`);
        }
      }
    }

    console.log(`Parsed ${acrossClues.length} ACROSS clues and ${downClues.length} DOWN clues`);

    // Build final output
    let result = 'ACROSS\n';
    if (acrossClues.length > 0) {
      result += acrossClues.join('\n');
    } else {
      result += '(No ACROSS clues detected - check image quality or add manually)';
    }
    
    result += '\n\nDOWN\n';
    if (downClues.length > 0) {
      result += downClues.join('\n');
    } else {
      result += '(No DOWN clues detected - check image quality or add manually)';
    }
    
    return result;
  };

  const handleSmartPaste = () => {
    if (!cluesText.trim()) {
      alert('Please paste clues into the text area first.');
      return;
    }

    const formatted = smartFormatClues(cluesText);
    setCluesText(formatted);
  };

  const smartFormatClues = (rawText: string): string => {
    // Split into lines
    const lines = rawText.split('\n').map(line => line.trim());
    
    let acrossClues: { number: number; text: string }[] = [];
    let downClues: { number: number; text: string }[] = [];
    let currentSection: 'none' | 'across' | 'down' = 'none';
    let currentClue: { number: number; text: string } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Check for section headers
      if (/^ACROSS$/i.test(line)) {
        // Save any pending clue before switching sections
        if (currentClue && currentSection !== 'none') {
          if (currentSection === 'across') {
            acrossClues.push(currentClue);
          } else if (currentSection === 'down') {
            downClues.push(currentClue);
          }
          currentClue = null;
        }
        currentSection = 'across';
        continue;
      }
      if (/^DOWN$/i.test(line)) {
        // Save any pending clue before switching sections
        if (currentClue && currentSection !== 'none') {
          if (currentSection === 'across') {
            acrossClues.push(currentClue);
          } else if (currentSection === 'down') {
            downClues.push(currentClue);
          }
          currentClue = null;
        }
        currentSection = 'down';
        continue;
      }
      
      // Check if this line starts with a number (new clue)
      const clueMatch = line.match(/^(\d+)\s+(.*)$/);
      
      if (clueMatch) {
        // Save previous clue if exists
        if (currentClue && currentSection !== 'none') {
          if (currentSection === 'across') {
            acrossClues.push(currentClue);
          } else if (currentSection === 'down') {
            downClues.push(currentClue);
          }
        }
        
        // Start new clue
        const number = parseInt(clueMatch[1]);
        const text = clueMatch[2];
        currentClue = { number, text };
      } else {
        // This is a continuation of the current clue
        if (currentClue) {
          currentClue.text += ' ' + line;
        }
      }
    }
    
    // Save final clue
    if (currentClue && currentSection !== 'none') {
      if (currentSection === 'across') {
        acrossClues.push(currentClue);
      } else if (currentSection === 'down') {
        downClues.push(currentClue);
      }
    }
    
    // Sort clues by number (in case they're out of order)
    acrossClues.sort((a, b) => a.number - b.number);
    downClues.sort((a, b) => a.number - b.number);
    
    // Build formatted output
    let result = 'ACROSS\n';
    acrossClues.forEach(clue => {
      result += `${clue.number}. ${clue.text}\n`;
    });
    
    result += '\nDOWN\n';
    downClues.forEach(clue => {
      result += `${clue.number}. ${clue.text}\n`;
    });
    
    return result;
  };

  const parsePattern = (silent: boolean = false): number[][] | null => {
    try {
      const lines = patternText.trim().split('\n');
      const pattern = lines.map(line => 
        line.trim().split('').map(char => parseInt(char))
      );
      
      // Validate it's the correct size (15x15 or 21x21)
      if (pattern.length !== GRID_SIZE || pattern.some(row => row.length !== GRID_SIZE)) {
        if (!silent) {
          alert(`Pattern must be ${GRID_SIZE}x${GRID_SIZE} grid`);
        }
        return null;
      }
      
      return pattern;
    } catch (error) {
      if (!silent) {
        alert('Invalid pattern format');
      }
      return null;
    }
  };

  const handleParse = async () => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }
    
    try {
      // Create an image element
      const img = new Image();
      img.src = uploadedImage;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Create a canvas to analyze the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Canvas not supported');
        return;
      }
      
      // Use crop coordinates if cropping is enabled, otherwise use full image
      const sourceX = isCropping ? cropCoords.x : 0;
      const sourceY = isCropping ? cropCoords.y : 0;
      const sourceWidth = isCropping ? cropCoords.width : img.width;
      const sourceHeight = isCropping ? cropCoords.height : img.height;
      
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      
      // Draw only the cropped portion
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
        0, 0, sourceWidth, sourceHeight                // Destination rectangle
      );
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate cell dimensions (assuming 15x15 grid)
      const cellWidth = canvas.width / 15;
      const cellHeight = canvas.height / 15;
      
      // Analyze each cell
      const pattern: number[][] = [];
      
      for (let row = 0; row < 15; row++) {
        const rowPattern: number[] = [];
        
        for (let col = 0; col < 15; col++) {
          // Sample the center of the cell
          const centerX = Math.floor((col + 0.5) * cellWidth);
          const centerY = Math.floor((row + 0.5) * cellHeight);
          
          // Sample a 7x7 area around the center for better accuracy
          let totalBrightness = 0;
          let sampleCount = 0;
          
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const x = centerX + dx;
              const y = centerY + dy;
              
              if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                const pixelIndex = (y * canvas.width + x) * 4;
                const r = data[pixelIndex];
                const g = data[pixelIndex + 1];
                const b = data[pixelIndex + 2];
                
                // Calculate brightness (0-255)
                const brightness = (r + g + b) / 3;
                totalBrightness += brightness;
                sampleCount++;
              }
            }
          }
          
          const avgBrightness = totalBrightness / sampleCount;
          
          // Threshold: if brightness < 128, it's black (0), otherwise white (1)
          rowPattern.push(avgBrightness < 128 ? 0 : 1);
        }
        
        pattern.push(rowPattern);
      }
      
      // Convert pattern to string
      const patternString = pattern.map(row => row.join('')).join('\n');
      setPatternText(patternString);
      
      alert('Image parsed successfully! Review the pattern and click Save to update the preview.');
      
    } catch (error) {
      console.error('Error parsing image:', error);
      alert('Error parsing image. Please try again or enter the pattern manually.');
    }
  };

  const calculateClueNumbers = (pattern: number[][]): number[][] => {
    const numbers: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    let clueNum = 1;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (pattern[row][col] === 0) continue; // Skip black squares

        let isClueStart = false;

        // Check if this is the start of an across word
        const isAcrossStart = 
          (col === 0 || pattern[row][col - 1] === 0) && // Left edge or black square to left
          col < GRID_SIZE - 1 && pattern[row][col + 1] === 1; // Has white square to right

        // Check if this is the start of a down word
        const isDownStart = 
          (row === 0 || pattern[row - 1][col] === 0) && // Top edge or black square above
          row < GRID_SIZE - 1 && pattern[row + 1][col] === 1; // Has white square below

        if (isAcrossStart || isDownStart) {
          numbers[row][col] = clueNum;
          clueNum++;
        }
      }
    }

    return numbers;
  };

  const handleSave = () => {
    const pattern = parsePattern(false); // Show errors when saving
    if (pattern) {
      setSavedPattern(pattern);
      const numbers = calculateClueNumbers(pattern);
      setClueNumbers(numbers);
      
      // Parse clues
      const clues = parseClues(cluesText, numbers);
      onComplete(pattern, numbers, clues); // Pass clues
    }
  };

  const parseClues = (text: string, numbers: number[][]) => {
    const across: Clue[] = [];
    const down: Clue[] = [];
    
    if (!text.trim()) {
      return { across, down };
    }
    
    // Create a lookup map for clue numbers to their positions
    const cluePositions: Record<number, { row: number; col: number }> = {};
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const num = numbers[row][col];
        if (num > 0) {
          cluePositions[num] = { row, col };
        }
      }
    }
    
    const lines = text.split('\n');
    let currentDirection: 'across' | 'down' | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check for section headers
      if (/^ACROSS/i.test(trimmed)) {
        currentDirection = 'across';
        continue;
      }
      if (/^DOWN/i.test(trimmed)) {
        currentDirection = 'down';
        continue;
      }
      
      // Parse clue: "1. Clue text here" or "1 Clue text here"
      const match = trimmed.match(/^(\d+)[\.\s]+(.+)$/);
      if (match && currentDirection) {
        const number = parseInt(match[1]);
        const text = match[2].trim();
        const pos = cluePositions[number] || { row: 0, col: 0 };
        
        if (currentDirection === 'across') {
          across.push({ 
            number, 
            text, 
            answer: '', 
            row: pos.row, 
            col: pos.col, 
            direction: 'across' 
          });
        } else {
          down.push({ 
            number, 
            text, 
            answer: '', 
            row: pos.row, 
            col: pos.col, 
            direction: 'down' 
          });
        }
      }
    }
    
    return { across, down };
  };

  const previewPattern = parsePattern(true); // Always show current pattern (silent for errors)
  
  // Calculate clue numbers live for preview
  const liveClueNumbers = previewPattern ? calculateClueNumbers(previewPattern) : null;

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const pattern = parsePattern(true);
    if (!pattern) return;
    
    // Toggle the cell (0 -> 1, 1 -> 0)
    const newPattern = pattern.map((row, r) =>
      row.map((cell, c) => 
        r === rowIndex && c === colIndex ? (cell === 0 ? 1 : 0) : cell
      )
    );
    
    // Update pattern text
    const patternString = newPattern.map(row => row.join('')).join('\n');
    setPatternText(patternString);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Setup Crossword</h2>
        <button onClick={() => { if (confirm("Reset all setup data?")) { setPatternText(Array(gridSize).fill("1".repeat(gridSize)).join("\n")); setUploadedImage(null); setSavedPattern(null); setClueNumbers([]); setCropCoords({ x: 42, y: 6, width: 54, height: 42 }); setIsCropping(false); setCroppedPreview(null); setCluesText(""); } }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">Reset</button>
      </div>

      {/* Join Game Section */}
      <div className="bg-blue-50 p-6 rounded-lg shadow mb-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-900">Join Existing Game</h3>
        <p className="text-sm text-blue-700 mb-3">Have a game code? Enter it below to join your friend's puzzle!</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code (e.g. ABC123)"
            maxLength={6}
            className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg font-mono text-lg uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              if (joinCodeInput.length === 6) {
                onJoinGame(joinCodeInput);
              } else {
                alert("Please enter a 6-character code");
              }
            }}
            disabled={joinCodeInput.length !== 6}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Join Game
          </button>
        </div>
      </div>

      <div className="text-center my-6 text-gray-500 font-semibold">
        — OR CREATE A NEW PUZZLE —
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => onGridSizeChange(15)} className={`px-6 py-2 rounded-lg font-semibold transition ${gridSize === 15 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Monday-Saturday (15×15)</button>
        <button onClick={() => onGridSizeChange(21)} className={`px-6 py-2 rounded-lg font-semibold transition ${gridSize === 21 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Sunday (21×21)</button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column - Upload & Input */}
        <div className="space-y-6 xl:col-span-1">
          {/* Image Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">1. Upload Reference Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadedImage && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <img 
                    ref={imageRef}
                    src={uploadedImage} 
                    alt="Uploaded crossword" 
                    className="max-w-full h-auto border rounded"
                    onLoad={() => {
                      // Auto-set crop area when image loads with user's preferred settings
                      if (imageRef.current && !isCropping) {
                        const img = imageRef.current;
                        const imgWidth = img.naturalWidth;
                        const imgHeight = img.naturalHeight;
                        setCropCoords({
                          x: Math.floor(imgWidth * 0.50),
                          y: Math.floor(imgHeight * 0.03),
                          width: Math.floor(imgWidth * 0.45),
                          height: Math.floor(imgHeight * 0.45),
                        });
                      }
                    }}
                  />
                  {isCropping && imageRef.current && (
                    <div 
                      className="absolute border-4 border-yellow-400 pointer-events-none"
                      style={{
                        left: `${(cropCoords.x / imageRef.current.naturalWidth) * 100}%`,
                        top: `${(cropCoords.y / imageRef.current.naturalHeight) * 100}%`,
                        width: `${(cropCoords.width / imageRef.current.naturalWidth) * 100}%`,
                        height: `${(cropCoords.height / imageRef.current.naturalHeight) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                        Grid Area
                      </div>
                    </div>
                  )}
                </div>
                
                {!isCropping ? (
                  <button
                    onClick={handleSetCropArea}
                    className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-600 transition"
                  >
                    📐 Set Grid Crop Area
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Adjust crop area (grid only):</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-gray-600">X Offset: {Math.round((cropCoords.x / (imageRef.current?.naturalWidth || 1)) * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={(cropCoords.x / (imageRef.current?.naturalWidth || 1)) * 100}
                          onChange={(e) => {
                            if (imageRef.current) {
                              const newX = Math.floor((parseFloat(e.target.value) / 100) * imageRef.current!.naturalWidth);
                              setCropCoords(prev => ({ ...prev, x: newX }));
                              updateCroppedPreview(newX, cropCoords.y, cropCoords.width, cropCoords.height);
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600">Y Offset: {Math.round((cropCoords.y / (imageRef.current?.naturalHeight || 1)) * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={(cropCoords.y / (imageRef.current?.naturalHeight || 1)) * 100}
                          onChange={(e) => {
                            if (imageRef.current) {
                              const newY = Math.floor((parseFloat(e.target.value) / 100) * imageRef.current!.naturalHeight);
                              setCropCoords(prev => ({ ...prev, y: newY }));
                              updateCroppedPreview(cropCoords.x, newY, cropCoords.width, cropCoords.height);
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600">Width: {Math.round((cropCoords.width / (imageRef.current?.naturalWidth || 1)) * 100)}%</label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={(cropCoords.width / (imageRef.current?.naturalWidth || 1)) * 100}
                          onChange={(e) => {
                            if (imageRef.current) {
                              const newWidth = Math.floor((parseFloat(e.target.value) / 100) * imageRef.current!.naturalWidth);
                              setCropCoords(prev => ({ ...prev, width: newWidth }));
                              updateCroppedPreview(cropCoords.x, cropCoords.y, newWidth, cropCoords.height);
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600">Height: {Math.round((cropCoords.height / (imageRef.current?.naturalHeight || 1)) * 100)}%</label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={(cropCoords.height / (imageRef.current?.naturalHeight || 1)) * 100}
                          onChange={(e) => {
                            if (imageRef.current) {
                              const newHeight = Math.floor((parseFloat(e.target.value) / 100) * imageRef.current!.naturalHeight);
                              setCropCoords(prev => ({ ...prev, height: newHeight }));
                              updateCroppedPreview(cropCoords.x, cropCoords.y, cropCoords.width, newHeight);
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    {/* Cropped Preview */}
                    {croppedPreview && (
                      <div className="mt-3 p-2 bg-gray-100 rounded border">
                        <p className="text-xs text-gray-600 mb-1">Cropped Preview:</p>
                        <img src={croppedPreview} alt="Cropped area" className="w-full border rounded" />
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={handleParse}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  🔍 Parse {isCropping ? 'Cropped ' : ''}Grid to Pattern
                </button>
              </div>
            )}
          </div>

          {/* Enter Clues */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">2. Enter Clues</h3>
            <p className="text-sm text-gray-600 mb-2">
              Format: <code className="bg-gray-100 px-1 text-xs">ACROSS</code> then list, 
              then <code className="bg-gray-100 px-1 text-xs">DOWN</code> then list
            </p>
            
            <div className="flex gap-2 mb-3">
              {uploadedImage && (
                <button
                  onClick={handleParseClues}
                  disabled={isParsingClues}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isParsingClues ? `🔍 OCR... ${clueParseProgress}%` : '🤖 OCR from Image'}
                </button>
              )}
              <button
                onClick={handleSmartPaste}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                ✨ Smart Format
              </button>
            </div>
            
            <textarea
              value={cluesText}
              onChange={(e) => setCluesText(e.target.value)}
              className="w-full h-48 font-mono text-xs p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Paste raw clues here, then click "Smart Format"

ACROSS
1 Longtime CBS
procedural with
multiple spinoffs
5 Highly capable
...

DOWN
1 Sgt. or cpl.
2 Go off a ski jump
...`}
            />
          </div>

          {/* Save and Play Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              💾 Save
            </button>
            <button
              onClick={onPlay}
              disabled={!savedPattern}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Play →
            </button>
          </div>
          {savedPattern && (
            <p className="text-green-600 text-sm text-center">✓ Saved! Click Play to start solving.</p>
          )}
        </div>

        {/* Middle Column - Interactive Grid Preview */}
        <div className="bg-white p-6 rounded-lg shadow xl:col-span-1">
          <h3 className="text-xl font-semibold mb-4">4. Grid Preview (Click to Edit)</h3>
          <p className="text-xs text-gray-500 mb-3">
            💡 Click any cell to toggle between black and white
          </p>
          {previewPattern ? (
            <div className="flex justify-center">
              <div className={`inline-block border-2 border-black ${GRID_SIZE === 21 ? 'grid-cols-21' : ''}`}>
                {previewPattern.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => {
                      const clueNumber = liveClueNumbers ? liveClueNumbers[rowIndex]?.[colIndex] : 0;
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`relative w-8 h-8 border border-gray-300 flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${
                            cell === 0 ? 'bg-black hover:bg-gray-800' : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {cell === 1 && clueNumber > 0 && (
                            <span className="absolute top-0 left-0.5 text-[8px] font-normal text-gray-700">
                              {clueNumber}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Upload and parse an image to see grid</p>
          )}
          <p className="text-xs text-gray-500 mt-3 text-center">
            {previewPattern ? `${previewPattern.flat().filter(c => c === 0).length} black squares` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}


