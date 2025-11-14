import React, { useState, useCallback } from 'react';

// Validation utility for Tailor Shop Management System with Urdu messages

export const validationRules = {
  // Name validation
  name: {
    required: "نام درج کرنا ضروری ہے",
    minLength: (min) => `نام کم از کم ${min} حروف کا ہونا چاہیے`,
    maxLength: (max) => `نام زیادہ سے زیادہ ${max} حروف کا ہو سکتا ہے`,
    pattern: "نام میں صرف حروف، خالی جگہ اور نقطے استعمال کریں",
    invalid: "براہ کرم درست نام درج کریں"
  },
  
  // Phone validation
  phone: {
    required: "موبائل نمبر درج کرنا ضروری ہے",
    pattern: "براہ کرم درست موبائل نمبر درج کریں (مثال: 03001234567)",
    minLength: "موبائل نمبر کم از کم 11 ہندسوں کا ہونا چاہیے",
    maxLength: "موبائل نمبر زیادہ سے زیادہ 15 ہندسوں کا ہو سکتا ہے",
    invalid: "براہ کرم درست موبائل نمبر درج کریں"
  },
  
  // Serial number validation
  serialNumber: {
    required: "سیریل نمبر درج کرنا ضروری ہے",
    pattern: "سیریل نمبر میں صرف حروف، اعداد اور ہائفن استعمال کریں",
    minLength: (min) => `سیریل نمبر کم از کم ${min} حروف کا ہونا چاہیے`,
    maxLength: (max) => `سیریل نمبر زیادہ سے زیادہ ${max} حروف کا ہو سکتا ہے`,
    invalid: "براہ کرم درست سیریل نمبر درج کریں"
  },
  
  // Suit type name validation
  suitTypeName: {
    required: "سوٹ کی قسم کا نام درج کرنا ضروری ہے",
    minLength: (min) => `سوٹ کی قسم کا نام کم از کم ${min} حروف کا ہونا چاہیے`,
    maxLength: (max) => `سوٹ کی قسم کا نام زیادہ سے زیادہ ${max} حروف کا ہو سکتا ہے`,
    pattern: "سوٹ کی قسم کے نام میں صرف حروف، اعداد اور خالی جگہ استعمال کریں",
    invalid: "براہ کرم درست سوٹ کی قسم کا نام درج کریں"
  },
  
  // Item name validation
  itemName: {
    required: "آئٹم کا نام درج کرنا ضروری ہے",
    minLength: (min) => `آئٹم کا نام کم از کم ${min} حروف کا ہونا چاہیے`,
    maxLength: (max) => `آئٹم کا نام زیادہ سے زیادہ ${max} حروف کا ہو سکتا ہے`,
    pattern: "آئٹم کے نام میں صرف حروف، اعداد اور خالی جگہ استعمال کریں",
    invalid: "براہ کرم درست آئٹم کا نام درج کریں"
  },
  
  // Size name validation
  sizeName: {
    required: "سائز کا نام درج کرنا ضروری ہے",
    minLength: (min) => `سائز کا نام کم از کم ${min} حروف کا ہونا چاہیے`,
    maxLength: (max) => `سائز کا نام زیادہ سے زیادہ ${max} حروف کا ہو سکتا ہے`,
    pattern: "سائز کے نام میں صرف حروف، اعداد اور خالی جگہ استعمال کریں",
    invalid: "براہ کرم درست سائز کا نام درج کریں"
  },
  
  // Size value validation
  sizeValue: {
    required: "سائز کی قیمت درج کرنا ضروری ہے",
    min: (min) => `سائز کی قیمت کم از کم ${min} ہونی چاہیے`,
    max: (max) => `سائز کی قیمت زیادہ سے زیادہ ${max} ہو سکتی ہے`,
    positive: "سائز کی قیمت مثبت ہونی چاہیے",
    invalid: "براہ کرم درست سائز کی قیمت درج کریں"
  },
  
  // Employee name validation
  employeeName: {
    required: "ملازم کا نام درج کرنا ضروری ہے",
    minLength: (min) => `ملازم کا نام کم از کم ${min} حروف کا ہونا چاہیے`,
    maxLength: (max) => `ملازم کا نام زیادہ سے زیادہ ${max} حروف کا ہو سکتا ہے`,
    pattern: "ملازم کے نام میں صرف حروف، خالی جگہ اور نقطے استعمال کریں",
    invalid: "براہ کرم درست ملازم کا نام درج کریں"
  },
  
  // Employee salary validation
  salary: {
    required: "تنخواہ درج کرنا ضروری ہے",
    min: (min) => `تنخواہ کم از کم ${min} روپے ہونی چاہیے`,
    max: (max) => `تنخواہ زیادہ سے زیادہ ${max} روپے ہو سکتی ہے`,
    positive: "تنخواہ مثبت ہونی چاہیے",
    invalid: "براہ کرم درست تنخواہ درج کریں"
  },
  
  // Expense amount validation
  expenseAmount: {
    required: "خرچ کی رقم درج کرنا ضروری ہے",
    min: (min) => `خرچ کی رقم کم از کم ${min} روپے ہونی چاہیے`,
    max: (max) => `خرچ کی رقم زیادہ سے زیادہ ${max} روپے ہو سکتی ہے`,
    positive: "خرچ کی رقم مثبت ہونی چاہیے",
    invalid: "براہ کرم درست خرچ کی رقم درج کریں"
  },
  
  // Expense description validation
  expenseDescription: {
    required: "خرچ کی تفصیل درج کرنا ضروری ہے",
    minLength: (min) => `خرچ کی تفصیل کم از کم ${min} حروف کی ہونی چاہیے`,
    maxLength: (max) => `خرچ کی تفصیل زیادہ سے زیادہ ${max} حروف کی ہو سکتی ہے`,
    pattern: "خرچ کی تفصیل میں صرف حروف، اعداد، خالی جگہ اور عام علامات استعمال کریں",
    invalid: "براہ کرم درست خرچ کی تفصیل درج کریں"
  },
  
  // Notes validation
  notes: {
    maxLength: (max) => `نوٹس زیادہ سے زیادہ ${max} حروف کے ہو سکتے ہیں`,
    pattern: "نوٹس میں صرف حروف، اعداد، خالی جگہ اور عام علامات استعمال کریں",
    invalid: "براہ کرم درست نوٹس درج کریں"
  }
};

// Validation functions
export const validateField = (value, fieldType, options = {}) => {
  const rules = validationRules[fieldType];
  if (!rules) return { isValid: true, message: "" };

  const errors = [];

  // Required validation
  if (options.required && (!value || value.trim() === "")) {
    errors.push(rules.required);
  }

  if (value && value.trim() !== "") {
    // Min length validation
    if (options.minLength && value.trim().length < options.minLength) {
      errors.push(typeof rules.minLength === 'function' 
        ? rules.minLength(options.minLength) 
        : rules.minLength);
    }

    // Max length validation
    if (options.maxLength && value.trim().length > options.maxLength) {
      errors.push(typeof rules.maxLength === 'function' 
        ? rules.maxLength(options.maxLength) 
        : rules.maxLength);
    }

    // Pattern validation
    if (options.pattern) {
      const regex = new RegExp(options.pattern);
      if (!regex.test(value.trim())) {
        errors.push(rules.pattern);
      }
    }

    // Min value validation (for numbers)
    if (options.min !== undefined && !isNaN(value)) {
      const numValue = parseFloat(value);
      if (numValue < options.min) {
        errors.push(typeof rules.min === 'function' 
          ? rules.min(options.min) 
          : rules.min);
      }
    }

    // Max value validation (for numbers)
    if (options.max !== undefined && !isNaN(value)) {
      const numValue = parseFloat(value);
      if (numValue > options.max) {
        errors.push(typeof rules.max === 'function' 
          ? rules.max(options.max) 
          : rules.max);
      }
    }

    // Positive number validation
    if (options.positive && !isNaN(value)) {
      const numValue = parseFloat(value);
      if (numValue <= 0) {
        errors.push(rules.positive);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    message: errors[0] || ""
  };
};

// Common validation patterns
export const patterns = {
  name: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s\.]+$/,
  phone: /^(\+92|92|0)?[0-9]{10,11}$/,
  serialNumber: /^[a-zA-Z0-9\-_]+$/,
  suitTypeName: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s]+$/,
  itemName: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s]+$/,
  sizeName: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s]+$/,
  expenseDescription: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s\.\,\!\?\-\_]+$/,
  notes: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s\.\,\!\?\-\_]+$/
};

// Validation options for different field types
export const validationOptions = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.name
  },
  phone: {
    required: true,
    minLength: 11,
    maxLength: 15,
    pattern: patterns.phone
  },
  serialNumber: {
    required: false,
    minLength: 3,
    maxLength: 20,
    pattern: patterns.serialNumber
  },
  suitTypeName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.suitTypeName
  },
  itemName: {
    required: true,
    minLength: 2,
    maxLength: 30,
    pattern: patterns.itemName
  },
  sizeName: {
    required: true,
    minLength: 1,
    maxLength: 20,
    pattern: patterns.sizeName
  },
  sizeValue: {
    required: true,
    min: 0,
    max: 999,
    positive: true
  },
  employeeName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.name
  },
  salary: {
    required: true,
    min: 1000,
    max: 1000000,
    positive: true
  },
  expenseAmount: {
    required: true,
    min: 1,
    max: 1000000,
    positive: true
  },
  expenseDescription: {
    required: true,
    minLength: 5,
    maxLength: 200,
    pattern: patterns.expenseDescription
  },
  notes: {
    required: false,
    maxLength: 500,
    pattern: patterns.notes
  }
};

// Form validation helper
export const validateForm = (formData, fieldsToValidate) => {
  const errors = {};
  let isValid = true;

  fieldsToValidate.forEach(field => {
    const value = formData[field.name];
    const options = validationOptions[field.type] || {};
    
    // Merge field-specific options with default options
    const finalOptions = { ...options, ...field.options };
    
    const validation = validateField(value, field.type, finalOptions);
    
    if (!validation.isValid) {
      errors[field.name] = validation.message;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Real-time validation hook
export const useFieldValidation = (initialValue = "", fieldType, options = {}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const validate = useCallback((newValue) => {
    const validation = validateField(newValue, fieldType, options);
    setError(validation.message);
    return validation.isValid;
  }, [fieldType, options]);

  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    if (touched) {
      validate(newValue);
    }
  }, [touched, validate]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate(value);
  }, [value, validate]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError("");
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    isValid: !error,
    handleChange,
    handleBlur,
    validate,
    reset
  };
};
