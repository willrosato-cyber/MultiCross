'use client';

interface MobileKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

export default function MobileKeyboard({ onKeyPress, onBackspace }: MobileKeyboardProps) {
  const topRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const middleRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const bottomRow = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  return (
    <div className="w-full bg-gray-200 p-1">
      {/* Top Row */}
      <div className="flex gap-1 mb-1 justify-center">
        {topRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 max-w-[32px] h-10 bg-white rounded shadow active:bg-gray-300 text-lg font-semibold"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Middle Row */}
      <div className="flex gap-1 mb-1 justify-center">
        {middleRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 max-w-[32px] h-10 bg-white rounded shadow active:bg-gray-300 text-lg font-semibold"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="flex gap-1 justify-center">
        {bottomRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 max-w-[32px] h-10 bg-white rounded shadow active:bg-gray-300 text-lg font-semibold"
          >
            {key}
          </button>
        ))}
        <button
          onClick={onBackspace}
          className="w-16 h-10 bg-gray-400 text-white rounded shadow active:bg-gray-500 text-lg font-semibold"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

