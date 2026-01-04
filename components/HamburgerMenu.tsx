'use client';

import { useState } from 'react';

interface HamburgerMenuProps {
  playerName: string;
  subtitle: string;
  joinCode: string;
  activeTab: 'setup' | 'play' | 'answers' | 'account' | 'admin';
  onTabChange: (tab: 'setup' | 'play' | 'answers' | 'account' | 'admin') => void;
  onLogout: () => void;
  canPlay: boolean;
}

export default function HamburgerMenu({ 
  playerName, 
  subtitle, 
  joinCode, 
  activeTab, 
  onTabChange, 
  onLogout,
  canPlay 
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">MultiCross</h2>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>

          {/* User Info */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-semibold text-blue-600">{playerName}</p>
          </div>

          {/* Game Code */}
          {joinCode && (
            <div className="mb-6 pb-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Game Code</p>
              <p className="text-xl font-mono font-bold text-blue-900">{joinCode}</p>
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(joinCode);
                    alert('Code copied!');
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                📋 Copy
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => {
                onTabChange('setup');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'setup'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Setup
            </button>
            <button
              onClick={() => {
                if (canPlay) {
                  onTabChange('play');
                  setIsOpen(false);
                }
              }}
              disabled={!canPlay}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'play'
                  ? 'bg-blue-600 text-white'
                  : canPlay
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Play
            </button>
            <button
              onClick={() => {
                onTabChange('account');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'account'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Open Games
            </button>
            {playerName === 'billy' && (
              <button
                onClick={() => {
                  onTabChange('admin');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                🔒 Admin
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="mt-auto">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

