'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MobileKeyboard from "./MobileKeyboard";

const GRID_SIZE = 15;

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

interface Clue {
  number: number;
  text: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

// Crossword data from NY Times Jan 2, 2026
const CROSSWORD_DATA = {
  // Grid pattern: 1 = white square, 0 = black square
  // Direct from user - this is the SOURCE OF TRUTH
  pattern: [
    [1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,0,1,1,1,0,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,1,1,1,1,1,0,0,0],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,1,1,1,0,1,1,1,1,1],
    [1,1,1,1,1,0,1,1,1,0,1,1,1,1,1],
    [0,0,0,1,1,1,1,1,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,0,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
  ],
  
  // Clue numbers for cells (0 = no number)
  grid: [
    [1, 2, 3, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 0],
    [13, 0, 0, 14, 15, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0],
    [17, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0],
    [19, 0, 0, 0, 0, 20, 0, 0, 0, 0, 21, 0, 0, 0, 0],
    [22, 0, 0, 0, 23, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0],
    [0, 0, 25, 26, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0],
    [28, 29, 0, 0, 0, 0, 30, 0, 0, 0, 0, 0, 31, 32, 33],
    [34, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 36, 0, 0, 0],
    [37, 0, 0, 0, 0, 38, 0, 0, 0, 0, 39, 0, 0, 0, 0],
    [0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0],
    [0, 0, 42, 0, 0, 0, 0, 0, 43, 0, 0, 0, 44, 45, 46],
    [47, 48, 0, 0, 0, 0, 0, 49, 0, 0, 0, 50, 0, 0, 0],
    [51, 0, 0, 0, 0, 0, 52, 0, 0, 0, 0, 53, 0, 0, 0],
    [54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0],
    [56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 57, 0, 0],
  ],
  
  across: [
    { number: 1, text: "Havanese greeting", answer: "ARF", row: 0, col: 0, direction: 'across' as const },
    { number: 4, text: "Tolstoy book whose title asks a question", answer: "WHATISFOBEDONE", row: 0, col: 6, direction: 'across' as const },
    { number: 13, text: "Reluctantly stoop", answer: "DEIGN", row: 1, col: 0, direction: 'across' as const },
    { number: 16, text: "They rate up to 350,000 on the Scoville scale", answer: "HABANEROS", row: 1, col: 6, direction: 'across' as const },
    { number: 17, text: "H.S. class for tough life lessons?", answer: "HARDKNOCKS", row: 2, col: 0, direction: 'across' as const },
    { number: 18, text: "Just tell me when it's over", answer: "WAKEMEUP", row: 2, col: 6, direction: 'across' as const },
    { number: 19, text: "Dance move also known as a backslide", answer: "MOONWALK", row: 3, col: 0, direction: 'across' as const },
    { number: 21, text: "Skims, as soup stock", answer: "DEGREASES", row: 3, col: 9, direction: 'across' as const },
    { number: 22, text: "Fig. that cannot start with 9", answer: "SSN", row: 4, col: 0, direction: 'across' as const },
    { number: 24, text: "Tunnel-making machine", answer: "BORER", row: 4, col: 8, direction: 'across' as const },
    { number: 25, text: "Not many", answer: "AFEW", row: 5, col: 2, direction: 'across' as const },
    { number: 27, text: "Windfalls", answer: "BONANZAS", row: 5, col: 7, direction: 'across' as const },
    { number: 28, text: "Keep coming up", answer: "RECUR", row: 6, col: 0, direction: 'across' as const },
    { number: 30, text: "One might lead to pay back", answer: "VENDETTA", row: 6, col: 6, direction: 'across' as const },
    { number: 34, text: "Make some introductions, say", answer: "EMCEE", row: 7, col: 0, direction: 'across' as const },
    { number: 35, text: "The Cowboys of the N.C.A.A.", answer: "OKST", row: 7, col: 6, direction: 'across' as const },
    { number: 36, text: "Word from the Lakota for 'they dwell'", answer: "OMAHA", row: 7, col: 10, direction: 'across' as const },
    { number: 37, text: "Emotional manipulation tactic", answer: "GUILT", row: 8, col: 0, direction: 'across' as const },
    { number: 39, text: "Meaty meal", answer: "ROAST", row: 8, col: 10, direction: 'across' as const },
    { number: 40, text: "Attraction on the western side of Carson Range", answer: "LAKETAHOE", row: 9, col: 3, direction: 'across' as const },
    { number: 42, text: "Seems less impressive, so to speak", answer: "LOSESSOMESTEAM", row: 10, col: 2, direction: 'across' as const },
    { number: 47, text: "Cumbrous", answer: "AWKWARD", row: 11, col: 0, direction: 'across' as const },
    { number: 49, text: "One-to-one relationship", answer: "RATIO", row: 11, col: 7, direction: 'across' as const },
    { number: 51, text: "Exchanges blows?", answer: "AIRLOCKS", row: 12, col: 0, direction: 'across' as const },
    { number: 53, text: "Up to", answer: "UNTIL", row: 12, col: 10, direction: 'across' as const },
    { number: 54, text: "Eggless bread spread", answer: "MARGARINEOIL", row: 13, col: 0, direction: 'across' as const },
    { number: 55, text: "A-a-a-and ___! (improv show ender)", answer: "SCENE", row: 13, col: 10, direction: 'across' as const },
    { number: 56, text: "High-carb snack", answer: "PRETZEL", row: 14, col: 0, direction: 'across' as const },
    { number: 57, text: "May day celebrant", answer: "MOM", row: 14, col: 12, direction: 'across' as const },
  ],
  
  down: [
    { number: 1, text: "President who wrote 'Posterity! You will never know how much it cost the present generation to preserve your freedom! I hope you will make a good use of it'", answer: "ADAMS", row: 0, col: 0, direction: 'down' as const },
    { number: 2, text: "Default outcomes, perhaps", answer: "RENAMES", row: 0, col: 1, direction: 'down' as const },
    { number: 3, text: "Kind of sequence that that proceeds 0, 1, 1, 2, 3, 5, 8, 13, ...", answer: "FIBONACCI", row: 0, col: 2, direction: 'down' as const },
    { number: 4, text: "Duration", answer: "WHILE", row: 0, col: 4, direction: 'down' as const },
    { number: 5, text: "Modern security threat", answer: "HACKER", row: 0, col: 5, direction: 'down' as const },
    { number: 6, text: "Org. with the Rule of Law Initiative", answer: "ABA", row: 0, col: 6, direction: 'down' as const },
    { number: 7, text: "Cylindrical oven", answer: "TANDOOR", row: 0, col: 7, direction: 'down' as const },
    { number: 8, text: "Extremely well-liked?", answer: "OVERRATED", row: 0, col: 8, direction: 'down' as const },
    { number: 9, text: "Personal opinion?", answer: "MYTAKE", row: 0, col: 9, direction: 'down' as const },
    { number: 10, text: "Hooting and hollering", answer: "DIN", row: 0, col: 10, direction: 'down' as const },
    { number: 11, text: "Part of an underground network", answer: "ROOTSYSTEM", row: 0, col: 11, direction: 'down' as const },
    { number: 12, text: "Pithy put-downs", answer: "DISSES", row: 0, col: 12, direction: 'down' as const },
    { number: 14, text: "Main ingredient in an aviation cocktail", answer: "DRYGIN", row: 1, col: 3, direction: 'down' as const },
    { number: 15, text: "I like the sound of that!", answer: "NEATO", row: 1, col: 4, direction: 'down' as const },
    { number: 20, text: "So adorable!", answer: "AWWW", row: 3, col: 5, direction: 'down' as const },
    { number: 24, text: "Prepare to ship, say", answer: "BOX", row: 4, col: 8, direction: 'down' as const },
    { number: 26, text: "Delivery means to a gas station", answer: "TANKER", row: 5, col: 3, direction: 'down' as const },
    { number: 27, text: "Count in the Blues Hall of Fame", answer: "BASIE", row: 5, col: 7, direction: 'down' as const },
    { number: 28, text: "On the ___ (frequently, informally)", answer: "REG", row: 6, col: 0, direction: 'down' as const },
    { number: 29, text: "Bird whose eggs are sometimes a canvas for Aboriginal art", answer: "EMU", row: 6, col: 1, direction: 'down' as const },
    { number: 30, text: "Capotes are flapped at them", answer: "TOROS", row: 6, col: 6, direction: 'down' as const },
    { number: 31, text: "Let's go, sleepyhead!", answer: "RISEANDSHINE", row: 6, col: 12, direction: 'down' as const },
    { number: 32, text: "Booking, for short", answer: "RES", row: 6, col: 13, direction: 'down' as const },
    { number: 33, text: "Server's obstacle", answer: "NET", row: 6, col: 14, direction: 'down' as const },
    { number: 38, text: "Word on the street is ...", answer: "THEYRESAYING", row: 8, col: 5, direction: 'down' as const },
    { number: 41, text: "___ Brown, author of 'The Da Vinci Code'", answer: "DAN", row: 9, col: 9, direction: 'down' as const },
    { number: 42, text: "Night of lawlessness in a long-running horror franchise, with 'the'", answer: "PURGE", row: 10, col: 2, direction: 'down' as const },
    { number: 43, text: "Try-hard", answer: "POSER", row: 10, col: 8, direction: 'down' as const },
    { number: 45, text: "Kind of acid", answer: "AMINO", row: 10, col: 13, direction: 'down' as const },
    { number: 46, text: "Stem component", answer: "XYLEM", row: 10, col: 14, direction: 'down' as const },
    { number: 47, text: "Capitulate", answer: "CAVE", row: 11, col: 0, direction: 'down' as const },
    { number: 48, text: "Lender's security", answer: "LIEN", row: 11, col: 1, direction: 'down' as const },
    { number: 49, text: "Table outside", answer: "PATIO", row: 11, col: 7, direction: 'down' as const },
    { number: 50, text: "Big purveyor of health supplements", answer: "GNC", row: 11, col: 11, direction: 'down' as const },
    { number: 52, text: "Gender-neutral term in a family", answer: "PARENT", row: 12, col: 6, direction: 'down' as const },
  ],
};

interface CrosswordGridProps {
  customPattern?: number[][];
  customNumbers?: number[][];
  customClues?: { across: Clue[]; down: Clue[] } | null;
  gridSize?: 15 | 21;
  showAnswers?: boolean;
  gameId?: Id<"games"> | null;
  playerId: string;
  joinCode: string;
}

export default function CrosswordGrid({ customPattern, customNumbers, customClues, gridSize = 15, showAnswers = false, gameId = null, playerId, joinCode }: CrosswordGridProps) {
  const GRID_SIZE = gridSize;
  const pattern = customPattern || CROSSWORD_DATA.pattern;
  const clueNumbersGrid = customNumbers || CROSSWORD_DATA.grid;
  const acrossClues = customClues?.across || CROSSWORD_DATA.across;
  const downClues = customClues?.down || CROSSWORD_DATA.down;
  
  // Convex hooks
  const game = useQuery(api.games.getGame, gameId ? { gameId } : "skip");
  const updateCell = useMutation(api.games.updateCell);
  const updateSelection = useMutation(api.games.updateSelection);
  
  const isMobile = useIsMobile();
  
  const [gridValues, setGridValues] = useState<string[][]>(
    Array(GRID_SIZE).fill('').map(() => Array(GRID_SIZE).fill(''))
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [time, setTime] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [solveProgress, setSolveProgress] = useState(0);
  const [otherPlayers, setOtherPlayers] = useState<Array<{
    id: string;
    name: string;
    selectedCell: { row: number; col: number } | null;
    direction: 'across' | 'down';
    color: string;
  }>>([]);
  const [myColor, setMyColor] = useState<string>("#3B82F6"); // Default blue
  const [isHandlingKeypress, setIsHandlingKeypress] = useState(false);
  const cellRefs = useRef<(HTMLDivElement | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const acrossCluesRef = useRef<HTMLDivElement>(null);
  const downCluesRef = useRef<HTMLDivElement>(null);

  // Sync game state from Convex
  useEffect(() => {
    if (game && gameId) {
      setGridValues(game.gridValues);
      if (game.players) {
        setOtherPlayers(game.players);
        // Find current player's color
        const currentPlayer = game.players.find(p => p.id === playerId);
        if (currentPlayer) {
          setMyColor(currentPlayer.color);
        }
      }
    }
  }, [game, gameId, playerId]);

  // Timer - synchronized based on game creation time
  useEffect(() => {
    if (!game?.createdAt) return;
    
    const updateTimer = () => {
      const elapsedMs = Date.now() - (game.createdAt || 0);
      setTime(Math.floor(elapsedMs / 1000));
    };
    
    // Update immediately
    updateTimer();
    
    // Then update every second
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [game?.createdAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isBlackSquare = (row: number, col: number) => {
    return pattern[row][col] === 0;
  };

  const getAnswerForCell = (row: number, col: number): string => {
    // Find which clue(s) contain this cell
    for (const clue of [...acrossClues, ...downClues]) {
      if (clue.direction === 'across' && clue.row === row) {
        let col_idx = clue.col;
        let answer_idx = 0;
        while (col_idx < GRID_SIZE && !isBlackSquare(row, col_idx)) {
          if (col_idx === col && answer_idx < clue.answer.length) {
            return clue.answer[answer_idx];
          }
          col_idx++;
          answer_idx++;
        }
      } else if (clue.direction === 'down' && clue.col === col) {
        let row_idx = clue.row;
        let answer_idx = 0;
        while (row_idx < GRID_SIZE && !isBlackSquare(row_idx, col)) {
          if (row_idx === row && answer_idx < clue.answer.length) {
            return clue.answer[answer_idx];
          }
          row_idx++;
          answer_idx++;
        }
      }
    }
    return '';
  };

  const solvePuzzle = async () => {
    setIsSolving(true);
    setSolveProgress(0);

    // Create a new grid filled with answers
    const solvedGrid = Array(GRID_SIZE).fill('').map(() => Array(GRID_SIZE).fill(''));
    
    // Total cells to process
    let totalCells = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!isBlackSquare(r, c)) totalCells++;
      }
    }
    
    let processedCells = 0;

    // Fill in across clues
    for (const clue of acrossClues) {
      let col = clue.col;
      let answerIdx = 0;
      
      while (col < GRID_SIZE && !isBlackSquare(clue.row, col) && answerIdx < clue.answer.length) {
        solvedGrid[clue.row][col] = clue.answer[answerIdx];
        col++;
        answerIdx++;
        processedCells++;
        
        // Update progress
        setSolveProgress(Math.round((processedCells / totalCells) * 50));
        
        // Small delay for animation effect
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Fill in down clues (this will verify/overwrite with correct letters)
    for (const clue of downClues) {
      let row = clue.row;
      let answerIdx = 0;
      
      while (row < GRID_SIZE && !isBlackSquare(row, clue.col) && answerIdx < clue.answer.length) {
        solvedGrid[row][clue.col] = clue.answer[answerIdx];
        row++;
        answerIdx++;
        processedCells++;
        
        // Update progress
        setSolveProgress(50 + Math.round((processedCells / totalCells) * 50));
        
        // Small delay for animation effect
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    setGridValues(solvedGrid);
    setSolveProgress(100);
    
    // Reset after a moment
    setTimeout(() => {
      setIsSolving(false);
      setSolveProgress(0);
    }, 1000);
  };

  const getCellNumber = (row: number, col: number) => {
    const num = clueNumbersGrid[row][col];
    return num > 0 ? num : null;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isBlackSquare(row, col)) return;
    
    // Toggle direction if clicking same cell
    if (selectedCell?.row === row && selectedCell?.col === col) {
      const newDirection = direction === 'across' ? 'down' : 'across';
      setDirection(newDirection);
      if (gameId && playerId) {
        updateSelection({ gameId, playerId, selectedCell: { row, col }, direction: newDirection });
      }
    } else {
      setSelectedCell({ row, col });
      if (gameId && playerId) {
        updateSelection({ gameId, playerId, selectedCell: { row, col }, direction });
      }
    }
    
    // Find and update the clue for this cell
    const clue = findClueForCell(row, col, direction);
    if (clue) setSelectedClue(clue);
  };

  // Update clue when selected cell or direction changes
  useEffect(() => {
    if (selectedCell) {
      const clue = findClueForCell(selectedCell.row, selectedCell.col, direction);
      if (clue) {
        setSelectedClue(clue);
        // Scroll to the clue in the active direction
        scrollToClue(clue);
        
        // Also prep the opposite direction clue
        const oppositeDir = direction === 'across' ? 'down' : 'across';
        const oppositeClue = findClueForCell(selectedCell.row, selectedCell.col, oppositeDir);
        if (oppositeClue) {
          scrollToClue(oppositeClue);
        }
      }
      
      // Focus the appropriate input (mobile or desktop)
      // Skip focusing if we're handling a keypress to avoid scroll snap
      if (!showAnswers && !isHandlingKeypress && !isMobile) {
        const cellRef = cellRefs.current[selectedCell.row]?.[selectedCell.col];
        if (cellRef) {
          cellRef.focus();
        }
      }
    }
  }, [selectedCell, direction, showAnswers, isMobile, isHandlingKeypress]);

  const scrollToClue = (clue: Clue) => {
    // Don't auto-scroll on mobile to prevent disruptive jumps while typing
    if (isMobile) return;
    
    // Scroll to the clue in the appropriate list
    const clueElement = document.getElementById(`clue-${clue.direction}-${clue.number}`);
    if (clueElement) {
      clueElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const findClueForCell = (row: number, col: number, dir: 'across' | 'down'): Clue | null => {
    const clues = dir === 'across' ? acrossClues : downClues;
    
    for (const clue of clues) {
      if (dir === 'across') {
        // Check if in same row
        if (clue.row !== row) continue;
        
        // Find the word boundaries
        let start = clue.col;
        let end = clue.col;
        while (end < GRID_SIZE && !isBlackSquare(row, end)) {
          end++;
        }
        
        // Check if col is within this word
        if (col >= start && col < end) {
          return clue;
        }
      } else {
        // Check if in same column
        if (clue.col !== col) continue;
        
        // Find the word boundaries
        let start = clue.row;
        let end = clue.row;
        while (end < GRID_SIZE && !isBlackSquare(end, col)) {
          end++;
        }
        
        // Check if row is within this word
        if (row >= start && row < end) {
          return clue;
        }
      }
    }
    return null;
  };

  const isWordComplete = useCallback((clue: Clue) => {
    // Check if all cells in this word are filled
    let row = clue.row;
    let col = clue.col;
    
    if (clue.direction === 'across') {
      while (col < GRID_SIZE && !isBlackSquare(row, col)) {
        if (gridValues[row][col] === '') return false;
        col++;
      }
    } else {
      while (row < GRID_SIZE && !isBlackSquare(row, col)) {
        if (gridValues[row][col] === '') return false;
        row++;
      }
    }
    
    return true;
  }, [gridValues, isBlackSquare, GRID_SIZE]);

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (isBlackSquare(row, col)) return;

    // Handle Tab key for moving to next clue
    if (e.key === 'Tab') {
      e.preventDefault();
      moveToNextClue();
      return;
    }

    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      setIsHandlingKeypress(true);
      const newGridValues = gridValues.map(r => [...r]);
      newGridValues[row][col] = e.key.toUpperCase();
      setGridValues(newGridValues);
      
      // Sync to Convex
      if (gameId) {
        updateCell({ gameId, row, col, value: e.key.toUpperCase() });
      }
      
      // Move to next empty cell in current direction
      moveToNextEmptyCell(row, col);
      setTimeout(() => setIsHandlingKeypress(false), 50);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      setIsHandlingKeypress(true);
      // Update locally
      const newGridValues = gridValues.map(r => [...r]);
      newGridValues[row][col] = '';
      setGridValues(newGridValues);
      
      // Sync to Convex
      if (gameId) {
        updateCell({ gameId, row, col, value: '' });
      }
      
      if (e.key === 'Backspace') {
        // Move to previous cell
        if (direction === 'across') {
          let prevCol = col - 1;
          while (prevCol >= 0 && isBlackSquare(row, prevCol)) {
            prevCol--;
          }
          if (prevCol >= 0) {
            setSelectedCell({ row, col: prevCol });
          }
        } else {
          let prevRow = row - 1;
          while (prevRow >= 0 && isBlackSquare(prevRow, col)) {
            prevRow--;
          }
          if (prevRow >= 0) {
            setSelectedCell({ row: prevRow, col });
          }
        }
      }
      setTimeout(() => setIsHandlingKeypress(false), 50);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // If in down mode, toggle to across without moving
      if (direction === 'down') {
        setDirection('across');
      } else {
        // If in across mode, move to next cell
        let nextCol = col + 1;
        while (nextCol < GRID_SIZE && isBlackSquare(row, nextCol)) {
          nextCol++;
        }
        if (nextCol < GRID_SIZE) {
          setSelectedCell({ row, col: nextCol });
          if (gameId && playerId) {
            updateSelection({ gameId, playerId, selectedCell: { row, col: nextCol }, direction });
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // If in down mode, toggle to across without moving
      if (direction === 'down') {
        const newDirection = 'across';
        setDirection(newDirection);
        if (gameId && playerId && selectedCell) {
          updateSelection({ gameId, playerId, selectedCell, direction: newDirection });
        }
      } else {
        // If in across mode, move to previous cell
        let prevCol = col - 1;
        while (prevCol >= 0 && isBlackSquare(row, prevCol)) {
          prevCol--;
        }
        if (prevCol >= 0) {
          setSelectedCell({ row, col: prevCol });
          if (gameId && playerId) {
            updateSelection({ gameId, playerId, selectedCell: { row, col: prevCol }, direction });
          }
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // If in across mode, toggle to down without moving
      if (direction === 'across') {
        const newDirection = 'down';
        setDirection(newDirection);
        if (gameId && playerId && selectedCell) {
          updateSelection({ gameId, playerId, selectedCell, direction: newDirection });
        }
      } else {
        // If in down mode, move to next cell
        let nextRow = row + 1;
        while (nextRow < GRID_SIZE && isBlackSquare(nextRow, col)) {
          nextRow++;
        }
        if (nextRow < GRID_SIZE) {
          setSelectedCell({ row: nextRow, col });
          if (gameId && playerId) {
            updateSelection({ gameId, playerId, selectedCell: { row: nextRow, col }, direction });
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // If in across mode, toggle to down without moving
      if (direction === 'across') {
        const newDirection = 'down';
        setDirection(newDirection);
        if (gameId && playerId && selectedCell) {
          updateSelection({ gameId, playerId, selectedCell, direction: newDirection });
        }
      } else {
        // If in down mode, move to previous cell
        let prevRow = row - 1;
        while (prevRow >= 0 && isBlackSquare(prevRow, col)) {
          prevRow--;
        }
        if (prevRow >= 0) {
          setSelectedCell({ row: prevRow, col });
          if (gameId && playerId) {
            updateSelection({ gameId, playerId, selectedCell: { row: prevRow, col }, direction });
          }
        }
      }
    }
  };

  const moveToNextEmptyCell = (currentRow: number, currentCol: number) => {
    if (direction === 'across') {
      // Find next empty cell in the same row
      for (let col = currentCol + 1; col < GRID_SIZE; col++) {
        if (isBlackSquare(currentRow, col)) break; // Stop at black square (end of word)
        if (gridValues[currentRow][col] === '') {
          setSelectedCell({ row: currentRow, col });
          return;
        }
      }
      // If no empty cell found in current word, move to next word
      moveToNextClue();
    } else {
      // Find next empty cell in the same column
      for (let row = currentRow + 1; row < GRID_SIZE; row++) {
        if (isBlackSquare(row, currentCol)) break; // Stop at black square (end of word)
        if (gridValues[row][currentCol] === '') {
          setSelectedCell({ row, col: currentCol });
          return;
        }
      }
      // If no empty cell found in current word, move to next word
      moveToNextClue();
    }
  };

  // Mobile keyboard handlers
  const handleMobileKeyPress = (key: string) => {
    if (!selectedCell) return;
    
    setIsHandlingKeypress(true);
    const newGridValues = gridValues.map(r => [...r]);
    newGridValues[selectedCell.row][selectedCell.col] = key.toUpperCase();
    setGridValues(newGridValues);
    
    // Sync to Convex
    if (gameId) {
      updateCell({ gameId, row: selectedCell.row, col: selectedCell.col, value: key.toUpperCase() });
    }
    
    // Move to next empty cell
    moveToNextEmptyCell(selectedCell.row, selectedCell.col);
    setTimeout(() => setIsHandlingKeypress(false), 50);
  };

  const handleMobileBackspace = () => {
    if (!selectedCell) return;
    
    setIsHandlingKeypress(true);
    const newGridValues = gridValues.map(r => [...r]);
    newGridValues[selectedCell.row][selectedCell.col] = '';
    setGridValues(newGridValues);
    
    // Sync to Convex
    if (gameId) {
      updateCell({ gameId, row: selectedCell.row, col: selectedCell.col, value: '' });
    }
    
    // Move to previous cell
    if (direction === 'across') {
      let prevCol = selectedCell.col - 1;
      while (prevCol >= 0 && isBlackSquare(selectedCell.row, prevCol)) {
        prevCol--;
      }
      if (prevCol >= 0) {
        setSelectedCell({ row: selectedCell.row, col: prevCol });
      }
    } else {
      let prevRow = selectedCell.row - 1;
      while (prevRow >= 0 && isBlackSquare(prevRow, selectedCell.col)) {
        prevRow--;
      }
      if (prevRow >= 0) {
        setSelectedCell({ row: prevRow, col: selectedCell.col });
      }
    }
    setTimeout(() => setIsHandlingKeypress(false), 50);
  };

  const moveToNextClue = () => {
    const clues = direction === 'across' ? acrossClues : downClues;
    
    // Find current clue
    const currentClueIndex = clues.findIndex(clue => 
      selectedClue?.number === clue.number
    );
    
    // Move to next clue (wrap around to beginning if at end)
    const nextClueIndex = currentClueIndex < clues.length - 1 ? currentClueIndex + 1 : 0;
    const nextClue = clues[nextClueIndex];
    
    if (nextClue) {
      setSelectedCell({ row: nextClue.row, col: nextClue.col });
      setSelectedClue(nextClue);
    }
  };

  const handleClear = () => {
    setGridValues(Array(GRID_SIZE).fill('').map(() => Array(GRID_SIZE).fill('')));
  };

  const handleReveal = () => {
    if (!selectedCell) return;
    const clue = findClueForCell(selectedCell.row, selectedCell.col, direction);
    if (!clue) return;
    
    const newGridValues = gridValues.map(r => [...r]);
    for (let i = 0; i < clue.answer.length; i++) {
      if (direction === 'across') {
        newGridValues[clue.row][clue.col + i] = clue.answer[i];
      } else {
        newGridValues[clue.row + i][clue.col] = clue.answer[i];
      }
    }
    setGridValues(newGridValues);
  };

  const handleCheck = () => {
    // Check current word
    if (!selectedCell) return;
    const clue = findClueForCell(selectedCell.row, selectedCell.col, direction);
    if (!clue) return;
    
    let correct = true;
    for (let i = 0; i < clue.answer.length; i++) {
      const row = direction === 'across' ? clue.row : clue.row + i;
      const col = direction === 'across' ? clue.col + i : clue.col;
      if (gridValues[row][col] !== clue.answer[i]) {
        correct = false;
        break;
      }
    }
    alert(correct ? 'Correct!' : 'Not quite right. Keep trying!');
  };

  const isInCurrentWord = (row: number, col: number) => {
    if (!selectedCell) return false;
    
    // If this is the selected cell, don't mark it as "in word" (it gets yellow highlight)
    if (selectedCell.row === row && selectedCell.col === col) return false;
    
    // Find the word that contains the selected cell
    if (direction === 'across') {
      // Check if this cell is in the same row
      if (row !== selectedCell.row) return false;
      
      // Check if this cell is black
      if (isBlackSquare(row, col)) return false;
      
      // Find the start and end of the word containing the selected cell
      let start = selectedCell.col;
      let end = selectedCell.col;
      
      // Find start of word
      while (start > 0 && !isBlackSquare(row, start - 1)) {
        start--;
      }
      
      // Find end of word
      while (end < GRID_SIZE - 1 && !isBlackSquare(row, end + 1)) {
        end++;
      }
      
      // Check if current cell is in this word
      return col >= start && col <= end;
    } else {
      // Down direction
      // Check if this cell is in the same column
      if (col !== selectedCell.col) return false;
      
      // Check if this cell is black
      if (isBlackSquare(row, col)) return false;
      
      // Find the start and end of the word containing the selected cell
      let start = selectedCell.row;
      let end = selectedCell.row;
      
      // Find start of word
      while (start > 0 && !isBlackSquare(start - 1, col)) {
        start--;
      }
      
      // Find end of word
      while (end < GRID_SIZE - 1 && !isBlackSquare(end + 1, col)) {
        end++;
      }
      
      // Check if current cell is in this word
      return row >= start && row <= end;
    }
  };

  return (
    <div className={`${isMobile ? 'flex flex-col h-screen overflow-hidden' : 'flex gap-6'} max-w-7xl mx-auto`}>
      
      {/* Left side - Grid */}
      <div className={`flex flex-col ${isMobile ? 'flex-shrink-0' : ''}`}>
        {/* Toolbar */}
        {!showAnswers && (
          <div className={`flex flex-col gap-1 ${isMobile ? 'mb-0' : 'mb-2 md:mb-4'} bg-white p-1 md:p-2 rounded-lg shadow`}>
            {/* Game Code Display */}
            {joinCode && !isMobile && (
              <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center justify-between'} bg-blue-50 px-2 md:px-4 py-1 md:py-2 rounded-lg border-2 border-blue-200`}>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 font-semibold`}>CODE:</span>
                  <span className={`${isMobile ? 'text-base' : 'text-2xl'} font-mono font-bold text-blue-900 tracking-wider`}>{joinCode}</span>
                  {!isMobile && <span className="text-xs text-blue-600">(Share this with friends!)</span>}
                </div>
                <button
                  onClick={() => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(joinCode).then(
                        () => alert("Code copied to clipboard!"),
                        () => alert(`Code: ${joinCode} (Copy failed, please copy manually)`)
                      );
                    } else {
                      // Fallback for browsers without clipboard API
                      alert(`Game Code: ${joinCode}\n\nPlease copy this code manually.`);
                    }
                  }}
                  className={`${isMobile ? 'text-xs px-2 py-1' : 'text-sm px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold`}
                >
                  📋 {isMobile ? 'Copy' : 'Copy Code'}
                </button>
              </div>
            )}
            
            {/* Timer and Buttons */}
            <div className={`flex items-center ${isMobile ? 'justify-between' : 'justify-between'}`}>
              <div className={`${isMobile ? 'text-sm' : 'text-xl md:text-2xl'} font-mono font-bold`}>{formatTime(time)}</div>
              {!isMobile && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded transition cursor-not-allowed" disabled>Rebus</button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded transition cursor-not-allowed" disabled>Clear</button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded transition cursor-not-allowed" disabled>Reveal</button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded transition cursor-not-allowed" disabled>Check</button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded transition cursor-not-allowed" disabled>?</button>
                </div>
              )}
            </div>
            
            {/* Players List */}
            {game && game.players && (
              <div className={`flex items-center gap-1 md:gap-2 ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                {!isMobile && <span className="text-gray-600 font-semibold">Players:</span>}
                {game.players.map((player) => (
                  <div key={player.id} className={`flex items-center gap-0.5 md:gap-1 bg-gray-100 px-1 md:px-2 py-0.5 md:py-1 rounded`}>
                    <div
                      className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`}
                      style={{ backgroundColor: player.color }}
                    ></div>
                    <span className={player.id === playerId ? "font-bold" : ""}>{player.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showAnswers && (
          <div className="mb-4 bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-600">✓ Answer Key</h2>
              <p className="text-sm text-gray-600 mt-1">AI agent will solve the puzzle for you</p>
            </div>
            <button
              onClick={solvePuzzle}
              disabled={isSolving}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                isSolving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSolving ? `Solving... ${solveProgress}%` : '🤖 Solve Puzzle'}
            </button>
          </div>
        )}

        {/* Grid */}
        <div className={`inline-block border-2 border-black shadow-lg ${isMobile ? 'mx-auto mb-0' : ''}`}>
          {pattern.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => {
                const isBlack = isBlackSquare(rowIndex, colIndex);
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isInWord = isInCurrentWord(rowIndex, colIndex);
                const cellNumber = getCellNumber(rowIndex, colIndex);
                
                // Check if another player is on this cell
                const otherPlayersHere = game?.players?.filter(
                  (p) => p.id !== playerId && p.selectedCell?.row === rowIndex && p.selectedCell?.col === colIndex
                ) || [];
                
                // Get the first other player's color for the ring (if multiple players, just show one)
                const otherPlayerColor = otherPlayersHere.length > 0 ? otherPlayersHere[0].color : null;
                
                const cellSize = isMobile ? 'w-[18px] h-[18px] text-[10px]' : 'w-10 h-10 text-xl';
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    ref={(el) => {
                      if (!cellRefs.current[rowIndex]) {
                        cellRefs.current[rowIndex] = [];
                      }
                      cellRefs.current[rowIndex][colIndex] = el;
                    }}
                    className={`
                      relative ${cellSize} border border-gray-300 flex items-center justify-center
                      font-bold cursor-pointer transition-all
                      ${isBlack ? 'bg-black' : ''}
                      ${!isBlack && !isSelected && !isInWord && !otherPlayerColor ? 'bg-white hover:bg-gray-50' : ''}
                      ${isInWord && !isBlack && !isSelected && !otherPlayerColor ? 'bg-blue-200' : ''}
                      ${isSelected && !isBlack ? 'ring-4 ring-inset bg-yellow-200 z-10' : ''}
                      ${otherPlayerColor && !isSelected && !isBlack ? 'ring-4 ring-inset z-10' : ''}
                      focus:outline-none
                    `}
                    style={
                      isSelected && !isBlack
                        ? { '--tw-ring-color': myColor } as React.CSSProperties
                        : otherPlayerColor && !isSelected && !isBlack
                        ? { '--tw-ring-color': otherPlayerColor } as React.CSSProperties
                        : undefined
                    }
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    tabIndex={isBlack ? -1 : 0}
                  >
                    {!isBlack && cellNumber && (
                      <span className={`absolute top-0 left-0.5 ${isMobile ? 'text-[6px]' : 'text-[9px]'} font-normal`}>
                        {cellNumber}
                      </span>
                    )}
                    {!isBlack && (
                      <span className="text-center">
                        {gridValues[rowIndex][colIndex]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Clues (Desktop: two columns, Mobile: single clue + keyboard) */}
      {isMobile ? (
        /* Mobile: Single clue display + keyboard */
        <div className="flex flex-col">
          <div className="bg-blue-100 p-2">
            {selectedClue ? (
              (() => {
                // Check if clue text fits in one line (roughly < 40 characters)
                const isShortClue = selectedClue.text.length < 40;
                return (
                  // All clues: left-aligned
                  <div className="flex gap-1 items-start">
                    <span className={`font-bold ${isShortClue ? 'text-base' : 'text-sm'} shrink-0`}>{selectedClue.number}.</span>
                    <span className={`${isShortClue ? 'text-sm' : 'text-[11px]'} leading-tight`}>{selectedClue.text}</span>
                  </div>
                );
              })()
            ) : (
              <div className="text-center text-gray-400 text-xs py-1">
                Select a cell
              </div>
            )}
          </div>
          <MobileKeyboard 
            onKeyPress={handleMobileKeyPress}
            onBackspace={handleMobileBackspace}
          />
        </div>
      ) : (
        /* Desktop: Two-column clue list */
        <div className="flex-1 bg-white p-6 rounded-lg shadow max-h-[680px] flex flex-col">
          <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
            {/* ACROSS Column */}
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b-2 border-black sticky top-0 bg-white z-10">ACROSS</h2>
              <div ref={acrossCluesRef} className="space-y-2 overflow-y-auto pr-2">
                {acrossClues.map((clue) => {
                  const isComplete = isWordComplete(clue);
                  return (
                    <div
                      key={`across-${clue.number}`}
                      id={`clue-across-${clue.number}`}
                      className={`flex gap-2 p-1.5 rounded cursor-pointer transition text-sm ${
                        selectedClue?.number === clue.number && direction === 'across'
                          ? 'bg-blue-200'
                          : isComplete
                          ? 'text-gray-400'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedCell({ row: clue.row, col: clue.col });
                        setSelectedClue(clue);
                        setDirection('across');
                      }}
                    >
                      <span className={`font-bold min-w-[2rem] shrink-0 ${isComplete ? 'text-gray-400' : ''}`}>{clue.number}</span>
                      <span className={`leading-tight ${isComplete ? 'line-through' : ''}`}>{clue.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DOWN Column */}
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b-2 border-black sticky top-0 bg-white z-10">DOWN</h2>
              <div ref={downCluesRef} className="space-y-2 overflow-y-auto pr-2">
                {downClues.map((clue) => {
                  const isComplete = isWordComplete(clue);
                  return (
                    <div
                      key={`down-${clue.number}`}
                      id={`clue-down-${clue.number}`}
                      className={`flex gap-2 p-1.5 rounded cursor-pointer transition text-sm ${
                        selectedClue?.number === clue.number && direction === 'down'
                          ? 'bg-blue-200'
                          : isComplete
                          ? 'text-gray-400'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedCell({ row: clue.row, col: clue.col });
                        setSelectedClue(clue);
                        setDirection('down');
                      }}
                    >
                      <span className={`font-bold min-w-[2rem] shrink-0 ${isComplete ? 'text-gray-400' : ''}`}>{clue.number}</span>
                      <span className={`leading-tight ${isComplete ? 'line-through' : ''}`}>{clue.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

