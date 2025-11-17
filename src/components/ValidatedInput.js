import React from 'react';
import { validateField, validationOptions } from '../utils/validation';

const ValidatedInput = ({
  type = "text",
  fieldType,
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  required = false,
  disabled = false,
  className = "",
  validationOptions: customValidationOptions = {},
  showError = true,
  validationDelayMs = 2500,
  name,
  ...props
}) => {
  const [error, setError] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const debounceTimerRef = React.useRef(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange?.(e);

    // Mark as interacted
    if (!touched) setTouched(true);

    // Debounced validation after user stops typing
    if (fieldType) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const options = { ...validationOptions[fieldType], ...customValidationOptions };
        const validation = validateField(newValue, fieldType, options);
        setError(validation.message);
      }, Math.max(500, validationDelayMs));
    }
  };

  const handleBlur = (e) => {
    setTouched(true);
    onBlur?.(e);
    
    if (fieldType) {
      const options = { ...validationOptions[fieldType], ...customValidationOptions };
      const validation = validateField(value, fieldType, options);
      setError(validation.message);
    }
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const inputClassName = `
    ${error && touched ? 'error' : ''} 
    ${className}
  `.trim();

  return (
    <div className="form-group">
      {label && (
        <label>
          {label}
          {required && <span style={{ color: '#dc3545' }}> *</span>}
        </label>
      )}
      
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        dir={props.dir || "rtl"}
        {...props}
      />
      
      {showError && error && touched && (
        <div className="error-message" style={{ 
          fontSize: '12px', 
          marginTop: '4px',
          color: '#dc3545',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default ValidatedInput;
