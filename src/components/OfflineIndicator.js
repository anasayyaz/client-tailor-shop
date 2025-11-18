import React, { useState, useEffect } from 'react';
import { syncService } from '../utils/syncService';
import './OfflineIndicator.css';

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      // Reset syncing indicator after a few seconds
      setTimeout(() => setIsSyncing(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register sync callback
    syncService.onSyncComplete(() => {
      setIsSyncing(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Always show status - minimal indicator
  return (
    <span className={`offline-indicator ${isSyncing ? 'syncing' : isOnline ? 'online' : 'offline'}`}>
      {isSyncing ? '(ڈیٹا سنک ہو رہا ہے...)' : isOnline ? '(آن لائن)' : '(آف لائن)'}
    </span>
  );
}

export default OfflineIndicator;

