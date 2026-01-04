'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AccountTabProps {
  username: string;
  onJoinGame: (code: string) => void;
}

export default function AccountTab({ username, onJoinGame }: AccountTabProps) {
  const userGames = useQuery(api.users.getUserGames, { username });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatGridSize = (size: 15 | 21) => {
    return size === 21 ? '21×21 (Sunday)' : '15×15 (Mon-Sat)';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h2 className="text-3xl font-bold mb-6">My Games</h2>
      <p className="text-gray-600 mb-4">
        Logged in as: <span className="font-bold">{username}</span>
      </p>

      {!userGames ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading your games...</p>
        </div>
      ) : userGames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven't created or joined any games yet.</p>
          <p className="text-sm text-gray-400 mt-2">Go to the Setup tab to create a new game!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userGames.map((game) => {
            const isCreator = game.createdBy === username;
            const playerCount = game.players?.length || 0;
            
            return (
              <div
                key={game._id}
                className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold font-mono">{game.joinCode || 'N/A'}</h3>
                    <p className="text-xs text-gray-500">
                      {isCreator ? '👑 Created by you' : '👥 Joined'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    game.gridSize === 21 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {formatGridSize(game.gridSize)}
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Players:</span>
                    <span className="font-semibold">{playerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-xs">{formatDate(game.createdAt)}</span>
                  </div>
                  {game.players && game.players.length > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-600 text-xs">Players:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {game.players.map((player: { id: string; name: string; color: string }) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: player.color }}
                            ></div>
                            <span>{player.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (game.joinCode) {
                      onJoinGame(game.joinCode);
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Rejoin Game
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

