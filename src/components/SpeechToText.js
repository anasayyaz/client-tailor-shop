import React, { useState, useEffect, useRef } from 'react';
import { parseUrduSpeech, validateParsedData } from '../utils/urduSpeechParser';
import './SpeechToText.css';

function SpeechToText({ onDataParsed, onError }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ur-PK'; // Urdu (Pakistan)

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let fullTranscript = '';

      // Collect all final results
      for (let i = 0; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          fullTranscript += transcriptPiece + ' ';
        }
      }

      // Only update if we have final transcript
      if (fullTranscript) {
        setTranscript(fullTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (onError) {
        onError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // Don't clear transcript - keep accumulating
      setParsedData(null);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const parseTranscript = () => {
    if (!transcript) {
      if (onError) {
        onError('کوئی ٹرانسکرپٹ موجود نہیں');
      }
      return;
    }

    try {
      const parsed = parseUrduSpeech(transcript);
      const validation = validateParsedData(parsed);

      if (!validation.isValid) {
        if (onError) {
          onError(`Validation errors: ${validation.errors.join(', ')}`);
        }
        return;
      }

      // Include original transcript in parsed data
      const dataWithTranscript = {
        ...parsed,
        rawSpeechInput: transcript
      };
      
      setParsedData(dataWithTranscript);
      setEditableData(JSON.parse(JSON.stringify(dataWithTranscript))); // Deep clone for editing
    } catch (error) {
      console.error('Parsing error:', error);
      if (onError) {
        onError(`Parsing error: ${error.message}`);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setParsedData(null);
    setEditableData(null);
  };

  const handleCustomerFieldChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  const handleSizeValueChange = (suitIndex, itemIndex, sizeIndex, value) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      newData.suitDetails[suitIndex].items[itemIndex].sizes[sizeIndex].value = value;
      return newData;
    });
  };

  const handleSaveData = () => {
    if (!editableData) {
      if (onError) {
        onError('کوئی ڈیٹا موجود نہیں');
      }
      return;
    }

    const validation = validateParsedData(editableData);
    if (!validation.isValid) {
      if (onError) {
        onError(`Validation errors: ${validation.errors.join(', ')}`);
      }
      return;
    }

    if (onDataParsed) {
      onDataParsed(editableData);
    }
  };

  if (!isSupported) {
    return (
      <div className="speech-to-text-container">
        <div className="speech-error" dir="rtl">
          <p>⚠️ آپ کا براؤزر Speech Recognition کو سپورٹ نہیں کرتا</p>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            براہ کرم Google Chrome یا Microsoft Edge استعمال کریں
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="speech-to-text-container" dir="rtl">
      <div className="speech-controls">
        <button
          type="button"
          className={`speech-btn ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? '🎤 رک جائیں' : '🎤 بولیں'}
        </button>
        
        {transcript && !editableData && (
          <>
            <button
              type="button"
              className="speech-btn parse-btn"
              onClick={parseTranscript}
            >
              📋 ڈیٹا نکالیں
            </button>
            
            <button
              type="button"
              className="speech-btn clear-btn"
              onClick={clearTranscript}
            >
              🗑️ صاف کریں
            </button>
          </>
        )}
      </div>

      {isListening && (
        <div className="listening-indicator">
          <div className="pulse"></div>
          <span>سن رہے ہیں...</span>
        </div>
      )}

      {transcript && (
        <div className="transcript-box">
          <h4>ٹرانسکرپٹ:</h4>
          <p>{transcript}</p>
        </div>
      )}

      {editableData && (
        <div className="editable-data-form">
          <h4>✅ ڈیٹا میں ترمیم کریں:</h4>
          
          <div className="form-section">
            <h5>گاہک کی معلومات</h5>
            <div className="form-row">
              <div className="form-group">
                <label>نام</label>
                <input
                  type="text"
                  value={editableData.customer.name || ''}
                  onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
                  placeholder="گاہک کا نام"
                  dir="rtl"
                />
              </div>
              
              <div className="form-group">
                <label>فون نمبر</label>
                <input
                  type="text"
                  value={editableData.customer.phone || ''}
                  onChange={(e) => handleCustomerFieldChange('phone', e.target.value)}
                  placeholder="فون نمبر"
                  dir="rtl"
                />
              </div>
              
              <div className="form-group">
                <label>سیریل نمبر</label>
                <input
                  type="text"
                  value={editableData.customer.serialNumber || ''}
                  onChange={(e) => handleCustomerFieldChange('serialNumber', e.target.value)}
                  placeholder="سیریل نمبر"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {editableData.suitDetails && editableData.suitDetails.length > 0 && (
            <div className="form-section">
              <h5>ماپ</h5>
              {editableData.suitDetails.map((suit, suitIdx) => (
                <div key={suitIdx}>
                  {suit.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="measurement-section">
                      <h6>{item.itemName}</h6>
                      <div className="measurements-grid">
                        {item.sizes.map((size, sizeIdx) => (
                          <div key={sizeIdx} className="measurement-field">
                            <label>{size.name}</label>
                            <input
                              type="text"
                              value={size.value || ''}
                              onChange={(e) => handleSizeValueChange(suitIdx, itemIdx, sizeIdx, e.target.value)}
                              placeholder={size.name}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="save-button-container">
            <button
              type="button"
              className="save-data-btn"
              onClick={handleSaveData}
            >
              ✓ گاہک شامل کریں
            </button>
          </div>
        </div>
      )}

      <div className="speech-help" dir="rtl">
        <p>📝 <strong>بولنے کا طریقہ:</strong></p>
        <p style={{ fontSize: '13px', opacity: 0.9 }}>
          "نام علی رزا، فون نمبر 0304-09-89-290، شلوار ساڈے نتالیس، بوٹن پندرہ، 
          شلوار گیرہ ستارہ، کمیز لینت ساڈے چالیس، چاتی سوا بائیس، کمر سوا بائیس، 
          سریل نمبر 954A"
        </p>
      </div>
    </div>
  );
}

export default SpeechToText;

