'use client';

interface MobileKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

export default function MobileKeyboard({ onKeyPress, onBackspace }: MobileKeyboardProps) {
  const topRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const bottomRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];

  return (
    <div className="w-full h-full bg-gray-100 p-2 flex flex-col justify-center gap-2">
      {/* Top Row: Q-P */}
      <div className="flex gap-1.5 justify-center">
        {topRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 h-12 bg-white rounded-md shadow-sm active:bg-gray-200 text-xl font-semibold transition-colors"
            style={{ maxWidth: '36px' }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Bottom Row: A-L + Backspace */}
      <div className="flex gap-1.5 justify-center items-center">
        <div className="flex gap-1.5" style={{ marginLeft: '18px' }}>
          {bottomRow.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="h-12 bg-white rounded-md shadow-sm active:bg-gray-200 text-xl font-semibold transition-colors"
              style={{ width: '36px' }}
            >
              {key}
            </button>
          ))}
        </div>
        <button
          onClick={onBackspace}
          className="h-12 bg-gray-300 text-gray-700 rounded-md shadow-sm active:bg-gray-400 text-lg font-semibold transition-colors flex items-center justify-center"
          style={{ width: '52px' }}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

