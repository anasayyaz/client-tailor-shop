import React, { useState, useEffect } from 'react';
import { syncService } from '../utils/syncService';
import './OfflineIndicator.css';

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setSyncProgress(0);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
      setSyncProgress(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register sync start callback
    syncService.onSyncStart = () => {
      setIsSyncing(true);
      setSyncProgress(10);
    };

    // Register sync progress callback
    syncService.onSyncProgress = (progress) => {
      setSyncProgress(progress);
    };

    // Register sync complete callback
    syncService.onSyncComplete(() => {
      setSyncProgress(100);
      // Keep the success indicator visible for 2 seconds
      setTimeout(() => {
        setIsSyncing(false);
        setSyncProgress(0);
      }, 2000);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show prominent syncing indicator
  return (
    <>
      <div className={`offline-indicator ${isSyncing ? 'syncing' : isOnline ? 'online' : 'offline'}`}>
        {isSyncing && (
          <div className="sync-spinner">
            <div className="spinner-circle"></div>
          </div>
        )}
        <span className="status-text">
          {isSyncing ? 
            (syncProgress === 100 ? '✓ سنک مکمل' : `ڈیٹا سنک ہو رہا ہے... ${syncProgress}%`) : 
            isOnline ? '● آن لائن' : '○ آف لائن'
          }
        </span>
      </div>
      
      {isSyncing && (
        <div className="sync-toast">
          <div className="sync-toast-content">
            <div className="sync-icon-large">
              <div className="sync-spinner-large">
                <div className="spinner-circle-large"></div>
              </div>
            </div>
            <div className="sync-details">
              <div className="sync-title">
                {syncProgress === 100 ? '✓ سنک مکمل ہوگئی' : 'ڈیٹا سنک ہو رہا ہے'}
              </div>
              <div className="sync-progress-bar">
                <div 
                  className="sync-progress-fill" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
              <div className="sync-percentage">{syncProgress}%</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OfflineIndicator;

