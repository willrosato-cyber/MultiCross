'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CrosswordGrid from "@/components/CrosswordGrid";
import SetupTab from "@/components/SetupTab";
import LoginPage from "@/components/LoginPage";
import HamburgerMenu from "@/components/HamburgerMenu";
import AccountTab from "@/components/AccountTab";
import AdminTab from "@/components/AdminTab";

interface Clue {
  number: number;
  text: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'play' | 'answers' | 'account' | 'admin'>('setup');
  const [gridPattern, setGridPattern] = useState<number[][] | null>(null);
  const [gridNumbers, setGridNumbers] = useState<number[][] | null>(null);
  const [clues, setClues] = useState<{ across: Clue[]; down: Clue[] } | null>(null);
  const [gridSize, setGridSize] = useState<15 | 21>(15); // Default to 15x15 (Mon-Sat)
  const [gameId, setGameId] = useState<Id<"games"> | null>(null);
  const [joinCode, setJoinCode] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  
  const createGame = useMutation(api.games.createGame);
  const joinGame = useMutation(api.games.joinGame);
  const gameData = useQuery(api.games.getGame, gameId ? { gameId } : "skip");
  
  // Optional mutations for new features (may not exist in older deployments)
  const logActivity = useMutation(api.users?.logActivity || null as any);
  const initializeUsers = useMutation(api.users?.initializeUsers || null as any);

  // Check if user is authenticated on mount
  useEffect(() => {
    const authenticated = localStorage.getItem('isAuthenticated') === 'true';
    const storedUsername = localStorage.getItem('username');
    if (authenticated && storedUsername) {
      setIsAuthenticated(true);
      setPlayerName(storedUsername);
    }
  }, []);

  // Initialize users in database on first load
  useEffect(() => {
    if (initializeUsers) {
      initializeUsers().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync game data from Convex when gameId changes
  useEffect(() => {
    if (gameData && !gridPattern) {
      console.log("📥 Fetched game data from Convex:", gameData);
      setGridPattern(gameData.gridPattern as number[][]);
      setGridNumbers(gameData.gridNumbers as number[][]);
      setClues(gameData.clues);
      setGridSize(gameData.gridSize);
      setJoinCode(gameData.joinCode || "");
    }
  }, [gameData, gridPattern]);

  // Generate player ID on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      const id = localStorage.getItem('playerId') || `player_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playerId', id);
      setPlayerId(id);
      // playerName is already set from authentication
    }
  }, [isAuthenticated]);

  const handleLogin = (username: string) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
    setPlayerName(username);
    // Log the login activity (if available)
    if (logActivity) {
      logActivity({
        username,
        action: 'login',
      }).catch(console.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setPlayerName('');
    // Reset game state
    setGameId(null);
    setJoinCode('');
    setActiveTab('setup');
  };

  const handleSetupComplete = async (pattern: number[][], numbers: number[][], cluesData: { across: Clue[]; down: Clue[] }) => {
    console.log("=== handleSetupComplete called ===");
    console.log("playerId:", playerId);
    console.log("playerName:", playerName);
    
    setGridPattern(pattern);
    setGridNumbers(numbers);
    setClues(cluesData);
    
    // Create a new multiplayer game in Convex
    try {
      console.log("Creating game...");
      const result = await createGame({
        gridPattern: pattern,
        gridNumbers: numbers,
        gridSize: gridSize,
        clues: {
          across: cluesData.across.map(c => ({ ...c, direction: "across" as const })),
          down: cluesData.down.map(c => ({ ...c, direction: "down" as const })),
        },
        playerId,
        playerName,
      });
      console.log("✅ Game created! Full result:", result);
      console.log("Result type:", typeof result);
      console.log("Result.gameId:", result?.gameId);
      console.log("Result.joinCode:", result?.joinCode);
      
      if (result && result.gameId) {
        setGameId(result.gameId);
        console.log("Set gameId:", result.gameId);
      } else {
        console.error("❌ No gameId in result!");
      }
      
      if (result && result.joinCode) {
        setJoinCode(result.joinCode);
        console.log("✅ Set joinCode:", result.joinCode);
        // Log game creation activity (if available)
        if (logActivity) {
          logActivity({
            username: playerName,
            action: 'game_created',
            joinCode: result.joinCode,
          }).catch(console.error);
        }
      } else {
        console.error("❌ No joinCode in result!");
      }
    } catch (error) {
      console.error("❌ Error creating game:", error);
      alert("Error creating game: " + error);
    }
  };

  const handleJoinGame = async (code: string) => {
    try {
      console.log("🎮 Joining game with code:", code);
      const gameIdResult = await joinGame({
        joinCode: code.toUpperCase(),
        playerId,
        playerName,
      });
      console.log("✅ Joined! Game ID:", gameIdResult);
      setGameId(gameIdResult);
      setJoinCode(code.toUpperCase());
      // Log game joined activity (if available)
      if (logActivity) {
        logActivity({
          username: playerName,
          action: 'game_joined',
          joinCode: code.toUpperCase(),
        }).catch(console.error);
      }
      // Game data will be fetched automatically via useQuery
      alert(`Joined game ${code}!`);
      setActiveTab('play');
    } catch (error) {
      console.error("❌ Error joining game:", error);
      alert("Could not join game. Check the code and try again.");
    }
  };

  const handleGridSizeChange = (size: 15 | 21) => {
    setGridSize(size);
  };

  // Scroll to top when play tab becomes active
  useEffect(() => {
    if (activeTab === 'play') {
      window.scrollTo(0, 0);
    }
  }, [activeTab]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const subtitle = playerName === 'saran' ? 'Hi Sara!' : playerName === 'billy' ? 'Play like a champion today' : 'Welcome!';

  return (
    <main className="min-h-screen p-0 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Compact Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center justify-between p-2 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <HamburgerMenu
              playerName={playerName}
              subtitle={subtitle}
              joinCode={joinCode}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
              canPlay={!!gridPattern}
            />
            <h1 className="text-lg font-bold text-gray-900">MultiCross</h1>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex mb-6 flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">MultiCross</h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm md:text-base text-gray-700 font-medium">
              Logged in as: <span className="text-blue-600">{playerName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 md:px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 md:px-6 py-3 rounded-t-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
              activeTab === 'setup'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Setup
          </button>
          <button
            onClick={() => setActiveTab('play')}
            className={`px-4 md:px-6 py-3 rounded-t-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
              activeTab === 'play'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            disabled={!gridPattern}
          >
            Play
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 md:px-6 py-3 rounded-t-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Open Games
          </button>
          {playerName === 'billy' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 md:px-6 py-3 rounded-t-lg font-semibold transition text-sm md:text-base whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-white text-red-600 border-b-2 border-red-600'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              🔒 Admin
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white md:rounded-lg md:shadow-lg p-0 md:p-2">
          <div style={{ display: activeTab === 'setup' ? 'block' : 'none' }}>
            <SetupTab 
              onComplete={handleSetupComplete} 
              onPlay={() => setActiveTab('play')}
              gridSize={gridSize}
              onGridSizeChange={handleGridSizeChange}
              onJoinGame={handleJoinGame}
            />
          </div>
          
          <div style={{ display: activeTab === 'play' ? 'block' : 'none' }}>
            {gridPattern && gridNumbers && clues ? (
              <CrosswordGrid 
                customPattern={gridPattern} 
                customNumbers={gridNumbers} 
                customClues={clues} 
                gridSize={gridSize}
                gameId={gameId}
                playerId={playerId}
                joinCode={joinCode}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Please complete setup first</p>
              </div>
            )}
          </div>

          <div style={{ display: activeTab === 'answers' ? 'block' : 'none' }}>
            {gridPattern && gridNumbers && clues ? (
              <CrosswordGrid 
                customPattern={gridPattern} 
                customNumbers={gridNumbers} 
                customClues={clues} 
                gridSize={gridSize} 
                showAnswers={true}
                gameId={null}
                playerId={playerId}
                joinCode=""
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Please complete setup first</p>
              </div>
            )}
          </div>

          <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
            <AccountTab username={playerName} onJoinGame={handleJoinGame} />
          </div>

          {playerName === 'billy' && (
            <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
              <AdminTab />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


