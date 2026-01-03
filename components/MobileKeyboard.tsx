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
    <div className="w-full h-full bg-white flex flex-col justify-center gap-2 px-1 py-2">
      {/* Row 1: Q-P */}
      <div className="flex gap-[6px] justify-center">
        {topRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 h-[42px] max-w-[36px] bg-gray-200 rounded text-black text-xl font-normal active:bg-gray-400"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Row 2: A-L (offset) */}
      <div className="flex gap-[6px] justify-center px-[18px]">
        {middleRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 h-[42px] max-w-[36px] bg-gray-200 rounded text-black text-xl font-normal active:bg-gray-400"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Row 3: Z-M + Backspace */}
      <div className="flex gap-[6px] justify-center">
        {bottomRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 h-[42px] max-w-[36px] bg-gray-200 rounded text-black text-xl font-normal active:bg-gray-400"
          >
            {key}
          </button>
        ))}
        <button
          onClick={onBackspace}
          className="h-[42px] w-[88px] bg-gray-200 rounded text-black text-lg font-normal flex items-center justify-center active:bg-gray-400"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

