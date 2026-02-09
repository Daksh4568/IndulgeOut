import React from 'react';

const SelectableCard = ({
  title,
  description,
  isSelected,
  onClick,
  children,
  icon,
  disabled = false,
}) => {
  const baseClasses = "relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer";
  
  const stateClasses = isSelected
    ? "bg-indigo-500 bg-opacity-10 border-indigo-500"
    : "bg-black border-gray-800 hover:border-gray-700";

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "";

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Radio/Checkbox indicator */}
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? 'border-indigo-500 bg-indigo-500'
              : 'border-gray-600 bg-transparent'
          }`}
        >
          {isSelected && (
            <div className="w-3 h-3 bg-white rounded-full"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title and Description */}
          <div>
            <h3 className="text-white font-medium text-lg mb-1 flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {title}
            </h3>
            {description && (
              <p className="text-gray-400 text-sm">{description}</p>
            )}
          </div>

          {/* Expanded content (shown when selected) */}
          {isSelected && children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectableCard;
