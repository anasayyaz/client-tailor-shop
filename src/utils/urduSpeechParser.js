/**
 * Urdu Speech Parser for Tailor Shop
 * Parses Urdu speech input and converts it to structured JSON
 */

// Urdu number words mapping
const urduNumbers = {
  'صفر': 0, 'ایک': 1, 'دو': 2, 'تین': 3, 'چار': 4, 'پانچ': 5, 'چھ': 6, 'سات': 7, 'آٹھ': 8, 'نو': 9,
  'دس': 10, 'گیارہ': 11, 'بارہ': 12, 'تیرہ': 13, 'چودہ': 14, 'پندرہ': 15, 'سولہ': 16, 'ستارہ': 17, 'اٹھارہ': 18, 'انیس': 19,
  'بیس': 20, 'اکیس': 21, 'بائیس': 22, 'تیئس': 23, 'چوبیس': 24, 'پچیس': 25, 'چھبیس': 26, 'ستائیس': 27, 'اٹھائیس': 28, 'انتیس': 29,
  'تیس': 30, 'اکتیس': 31, 'بتیس': 32, 'تینتیس': 33, 'چونتیس': 34, 'پینتیس': 35, 'چھتیس': 36, 'سینتیس': 37, 'اڑتیس': 38, 'انتالیس': 39,
  'چالیس': 40, 'اکتالیس': 41, 'بیالیس': 42, 'تینتالیس': 43, 'چوالیس': 44, 'پینتالیس': 45, 'چھیالیس': 46, 'سینتالیس': 47, 'اڑتالیس': 48, 'نتالیس': 49,
  'پچاس': 50, 'اکاون': 51, 'باون': 52, 'ترپن': 53, 'چوون': 54, 'پچپن': 55, 'چھپن': 56, 'ستاون': 57, 'اٹھاون': 58, 'انسٹھ': 59,
  'ساٹھ': 60
};

// Measurement name mappings
const measurementMappings = {
  // Shalwar measurements
  'شلوار لمبائی': 'Length',
  'شلوار لینت': 'Length',
  'شلوار': 'Length',
  'بوٹن': 'Bottom',
  'بوٹم': 'Bottom',
  'گیرہ': 'Ghera',
  'آسن': 'Aasan',
  'کمر': 'Waist',
  
  // Kameez measurements
  'کمیز لمبائی': 'Length',
  'کمیز لینت': 'Length',
  'کمیز': 'Length',
  'چاتی': 'Chest',
  'سینہ': 'Chest',
  'شلڈر': 'Shoulder',
  'کندھا': 'Shoulder',
  'بازو': 'Sleeve Length',
  'آستین': 'Sleeve Length',
  'گلہ': 'Neck',
  'گردن': 'Neck',
  'مودہ': 'Moda',
  'موڈا': 'Moda'
};

/**
 * Convert Urdu fractional expressions to decimal
 */
function parseUrduFraction(text) {
  // ساڈے X = X + 0.5
  if (text.includes('ساڈے') || text.includes('سارے')) {
    const match = text.match(/(?:ساڈے|سارے)\s*(\S+)/);
    if (match) {
      const number = parseUrduNumber(match[1]);
      return number !== null ? number + 0.5 : null;
    }
  }
  
  // سوا X = X + 0.25
  if (text.includes('سوا')) {
    const match = text.match(/سوا\s*(\S+)/);
    if (match) {
      const number = parseUrduNumber(match[1]);
      return number !== null ? number + 0.25 : null;
    }
  }
  
  // پونے X = X - 0.25
  if (text.includes('پونے')) {
    const match = text.match(/پونے\s*(\S+)/);
    if (match) {
      const number = parseUrduNumber(match[1]);
      return number !== null ? number - 0.25 : null;
    }
  }
  
  // ڈیرھ = 1.5
  if (text.includes('ڈیرھ') || text.includes('ڈیڑھ')) {
    return 1.5;
  }
  
  // ڈھائی = 2.5
  if (text.includes('ڈھائی')) {
    return 2.5;
  }
  
  return null;
}

/**
 * Parse Urdu number word to decimal
 */
function parseUrduNumber(text) {
  if (!text) return null;
  
  // Check if it's already a number
  const numMatch = text.match(/\d+(\.\d+)?/);
  if (numMatch) {
    return parseFloat(numMatch[0]);
  }
  
  // Check Urdu number words
  for (const [word, value] of Object.entries(urduNumbers)) {
    if (text.includes(word)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Extract phone number from text
 */
function extractPhoneNumber(text) {
  // Remove spaces and dashes from phone numbers
  const phonePattern = /(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4,7})/;
  const match = text.match(phonePattern);
  if (match) {
    return match[1].replace(/[-\s]/g, '');
  }
  return null;
}

/**
 * Extract customer name
 */
function extractName(text) {
  // Look for patterns like "نام X" or after "نام"
  const namePattern = /نام\s+([^\s،]+(?:\s+[^\s،]+)?)/;
  const match = text.match(namePattern);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * Extract serial number
 */
function extractSerialNumber(text) {
  // Look for patterns like "سریل نمبر X" or "سیریل نمبر X"
  const serialPattern = /(?:سریل|سیریل)\s*(?:نمبر)?\s*([A-Za-z0-9]+)/;
  const match = text.match(serialPattern);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * Parse measurements from text
 */
function parseMeasurements(text) {
  const shalwarSizes = [];
  const kameezSizes = [];
  
  // Split text into segments
  const segments = text.split(/[،,]/);
  
  let currentItem = null; // 'shalwar' or 'kameez'
  
  segments.forEach(segment => {
    const cleanSegment = segment.trim();
    
    // Determine current item
    if (cleanSegment.includes('شلوار')) {
      currentItem = 'shalwar';
    } else if (cleanSegment.includes('کمیز') || cleanSegment.includes('قمیض')) {
      currentItem = 'kameez';
    }
    
    // Try to extract measurement
    for (const [urduName, englishName] of Object.entries(measurementMappings)) {
      if (cleanSegment.includes(urduName)) {
        // Extract value after the measurement name
        const afterMeasurement = cleanSegment.split(urduName)[1];
        if (afterMeasurement) {
          // Try fractional first
          let value = parseUrduFraction(afterMeasurement);
          
          // If not fractional, try regular number
          if (value === null) {
            value = parseUrduNumber(afterMeasurement);
          }
          
          if (value !== null) {
            const measurement = { name: englishName, value };
            
            // Determine which item to add to
            if (urduName.includes('شلوار') || (currentItem === 'shalwar' && !urduName.includes('کمیز'))) {
              // Add to shalwar if not already exists
              if (!shalwarSizes.find(s => s.name === englishName)) {
                shalwarSizes.push(measurement);
              }
            } else if (urduName.includes('کمیز') || currentItem === 'kameez') {
              // Add to kameez if not already exists
              if (!kameezSizes.find(s => s.name === englishName)) {
                kameezSizes.push(measurement);
              }
            }
          }
        }
        break;
      }
    }
    
    // Also check for standalone measurements (like "چاتی 49")
    const standalonePattern = /(\S+)\s+(\d+(?:\.\d+)?)/;
    const standaloneMatch = cleanSegment.match(standalonePattern);
    if (standaloneMatch) {
      const [, urduName, value] = standaloneMatch;
      const englishName = measurementMappings[urduName];
      if (englishName) {
        const measurement = { name: englishName, value: parseFloat(value) };
        
        // Update existing or add new
        if (currentItem === 'shalwar') {
          const existing = shalwarSizes.find(s => s.name === englishName);
          if (existing) {
            existing.value = measurement.value;
          } else {
            shalwarSizes.push(measurement);
          }
        } else if (currentItem === 'kameez') {
          const existing = kameezSizes.find(s => s.name === englishName);
          if (existing) {
            existing.value = measurement.value;
          } else {
            kameezSizes.push(measurement);
          }
        }
      }
    }
  });
  
  return { shalwarSizes, kameezSizes };
}

/**
 * Main parser function
 * Converts Urdu speech text to structured JSON
 */
export function parseUrduSpeech(speechText) {
  if (!speechText) {
    return null;
  }
  
  const text = speechText.trim();
  
  // Extract customer information
  const name = extractName(text);
  const phone = extractPhoneNumber(text);
  const serialNumber = extractSerialNumber(text);
  
  // Extract measurements
  const { shalwarSizes, kameezSizes } = parseMeasurements(text);
  
  // Build structured data
  const result = {
    customer: {
      name: name || '',
      phone: phone || '',
      serialNumber: serialNumber || ''
    },
    suitDetails: []
  };
  
  // Only add suit details if we have measurements
  if (shalwarSizes.length > 0 || kameezSizes.length > 0) {
    const items = [];
    
    if (shalwarSizes.length > 0) {
      items.push({
        itemName: 'شلوار',
        sizes: shalwarSizes
      });
    }
    
    if (kameezSizes.length > 0) {
      items.push({
        itemName: 'قمیض',
        sizes: kameezSizes
      });
    }
    
    result.suitDetails.push({
      suitType: 'Shalwar Kameez',
      items
    });
  }
  
  return result;
}

/**
 * Validate parsed data
 */
export function validateParsedData(data) {
  const errors = [];
  
  if (!data) {
    errors.push('No data provided');
    return { isValid: false, errors };
  }
  
  if (!data.customer.name) {
    errors.push('Customer name is required');
  }
  
  if (!data.customer.phone) {
    errors.push('Customer phone is required');
  }
  
  if (!data.suitDetails || data.suitDetails.length === 0) {
    errors.push('No suit measurements found');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

