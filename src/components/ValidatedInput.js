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
  name,
  ...props
}) => {
  const [error, setError] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange?.(e);
    
    if (touched && fieldType) {
      const options = { ...validationOptions[fieldType], ...customValidationOptions };
      const validation = validateField(newValue, fieldType, options);
      setError(validation.message);
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
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        dir="rtl"
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
