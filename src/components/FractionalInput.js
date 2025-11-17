import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ValidatedInput from './ValidatedInput';

// Utility function to format fractional values for display with smaller fractions
export const formatFractionalValue = (value) => {
  if (!value || typeof value !== 'string') return value;
  // Match patterns like "23(1/2)", "37-23(1/2)", "41(3/4)", etc. and format the fraction smaller
  return value.replace(/(\d+)\((\d+\/\d+)\)/g, (match, number, fraction) => {
    return `${number}<span style="font-size: 0.7em; vertical-align: baseline;">(${fraction})</span>`;
  });
};

const FractionalInput = ({
  value = "",
  onChange,
  showFractionMenu = true,
  ...props
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [inputValue, setInputValue] = useState(value);
  const [menuContext, setMenuContext] = useState({ value: '', cursorPos: 0 });
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const fractions = ['1/2', '3/4', '1/4'];

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showMenu]);

  const handleKeyDown = (e) => {
    if (e.key === '.' && showFractionMenu) {
      const input = e.target;
      const cursorPosition = input.selectionStart || 0;
      const textBeforeCursor = input.value.substring(0, cursorPosition);
      
      // Check if there's a number before the dot
      const hasNumberBefore = /[0-9]/.test(textBeforeCursor);
      
      if (hasNumberBefore) {
        e.preventDefault();
        const rect = input.getBoundingClientRect();
        // Position menu next to the input field (on the right side for RTL)
        setMenuPosition({
          top: rect.top,
          left: rect.right + 10, // 10px gap from input field
        });
        // Store the current value and cursor position when menu opens
        // Store cursor position as the end of the value since dot was prevented
        setMenuContext({
          value: input.value,
          cursorPos: input.value.length // Always use end of value when dot is prevented
        });
        setShowMenu(true);
      }
      // If no number before, let the dot be typed normally (don't prevent default)
    } else if (e.key === 'Escape') {
      setShowMenu(false);
    }
    // Call original onKeyDown if provided
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(e);
    
    // Close menu if user continues typing
    if (showMenu) {
      setShowMenu(false);
    }
  };

  const selectFraction = (fraction) => {
    // Find the input element within the ValidatedInput component
    const input = inputRef.current?.querySelector('input');
    if (!input) return;

    // Always use the stored value from when menu opened (when dot was pressed)
    // This ensures we work with the value before any changes
    const currentValue = menuContext.value || input.value;
    
    // Since the dot was prevented, the cursor is always at the end of the value
    // Simply append the fraction to the entire value
    const newValue = currentValue + '(' + fraction + ')';
    setInputValue(newValue);
    setShowMenu(false);
    setMenuContext({ value: '', cursorPos: 0 });

    const syntheticEvent = {
      target: {
        value: newValue,
        name: input.name || props.name
      }
    };
    
    onChange?.(syntheticEvent);

    setTimeout(() => {
      if (input) {
        input.focus();
        const newCursorPos = newValue.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div style={{ position: 'relative' }} ref={inputRef}>
      <ValidatedInput
        {...props}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        dir="ltr"
        style={{
          ...props.style,
          fontFamily: 'inherit',
          direction: 'ltr',
          textAlign: 'left'
        }}
      />
      {showMenu && showFractionMenu && createPortal(
        <>
          {/* Modal Overlay/Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowMenu(false)}
          >
            {/* Modal Content */}
            <div
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                minWidth: '120px',
                padding: '8px 0',
                direction: 'ltr',
                pointerEvents: 'auto',
                animation: 'fractionMenuFadeIn 0.2s ease-out'
              }}
            >
              {fractions.map((fraction) => (
                <div
                  key={fraction}
                  onClick={() => selectFraction(fraction)}
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    textAlign: 'center',
                    transition: 'background-color 0.2s ease',
                    userSelect: 'none',
                    color: '#2c3e50'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  {fraction}
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes fractionMenuFadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </>,
        document.body
      )}
    </div>
  );
};

export default FractionalInput;
