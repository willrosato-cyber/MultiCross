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
    <div className="w-full h-full bg-gray-100 px-1 py-1 flex flex-col justify-center gap-1.5">
      {/* Row 1: Q-P */}
      <div className="flex gap-1 justify-center">
        {topRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 h-10 bg-white rounded shadow-sm active:bg-gray-200 text-lg font-semibold"
            style={{ maxWidth: '34px' }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Row 2: A-L (offset slightly) */}
      <div className="flex gap-1 justify-center" style={{ paddingLeft: '17px', paddingRight: '17px' }}>
        {middleRow.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="flex-1 h-10 bg-white rounded shadow-sm active:bg-gray-200 text-lg font-semibold"
            style={{ maxWidth: '34px' }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Row 3: Z-M + Backspace */}
      <div className="flex gap-1 justify-center items-center">
        <div className="flex gap-1" style={{ flex: '1', justifyContent: 'center' }}>
          {bottomRow.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="h-10 bg-white rounded shadow-sm active:bg-gray-200 text-lg font-semibold"
              style={{ width: '34px' }}
            >
              {key}
            </button>
          ))}
        </div>
        <button
          onClick={onBackspace}
          className="h-10 bg-gray-300 text-gray-700 rounded shadow-sm active:bg-gray-400 font-semibold flex items-center justify-center"
          style={{ width: '60px', fontSize: '20px' }}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

