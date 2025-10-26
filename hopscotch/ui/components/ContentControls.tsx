import { CONTROL_BUTTONS, ControlButton, ControlType } from '@/constants/navigationSearch';

interface ContentControlsProps {
  onControlClick: (button: ControlButton) => void;
  disabled?: boolean;
}

export default function ContentControls({ onControlClick, disabled = false }: ContentControlsProps) {
  const getButtonStyles = (type: ControlType) => {
    const baseStyles = "px-3 py-1.5 rounded text-sm font-medium transition-colors";
    const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

    switch (type) {
      case ControlType.SMALL_VARIATION:
        return `${baseStyles} ${disabledStyles} bg-blue-600 hover:bg-blue-700 text-white`;
      case ControlType.LARGE_VARIATION:
        return `${baseStyles} ${disabledStyles} bg-purple-600 hover:bg-purple-700 text-white`;
      case ControlType.REROLL:
        return `${baseStyles} ${disabledStyles} bg-green-600 hover:bg-green-700 text-white`;
      case ControlType.OPEN_TABS:
        return `${baseStyles} ${disabledStyles} bg-gray-600 hover:bg-gray-700 text-white`;
      default:
        return `${baseStyles} ${disabledStyles} bg-gray-500 hover:bg-gray-600 text-white`;
    }
  };

  const topRowButtons = CONTROL_BUTTONS.filter(btn => btn.row === 0);
  const bottomRowButtons = CONTROL_BUTTONS.filter(btn => btn.row === 1);

  return (
    <div className="bg-gray-100 rounded-lg p-2 space-y-2">
      {/* Top row: S1-S4 and reroll */}
      <div className="flex gap-2 items-center justify-center">
        {topRowButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => !disabled && onControlClick(button)}
            className={getButtonStyles(button.type)}
            disabled={disabled}
            title={`${button.type} ${button.gridIndex !== undefined ? `for option ${button.gridIndex + 1}` : ''}`}
          >
            {button.label}
          </button>
        ))}
      </div>
      {/* Bottom row: L1-L4 and open tabs */}
      <div className="flex gap-2 items-center justify-center">
        {bottomRowButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => !disabled && onControlClick(button)}
            className={getButtonStyles(button.type)}
            disabled={disabled}
            title={`${button.type} ${button.gridIndex !== undefined ? `for option ${button.gridIndex + 1}` : ''}`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
