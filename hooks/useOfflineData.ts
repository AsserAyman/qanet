import { useState, useEffect, useCallback } from 'react';
import { offlineDataManager, CreatePrayerLogData } from '../utils/database/offlineDataManager';
import { LocalPrayerLog } from '../utils/database/schema';
import { networkManager } from '../utils/network/networkManager';

export function useOfflineData() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await offlineDataManager.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize offline data');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
  };
}

export function usePrayerLogs(limit: number = 30) {
  const [logs, setLogs] = useState<LocalPrayerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await offlineDataManager.getPrayerLogs(limit);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prayer logs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const createLog = useCallback(async (data: CreatePrayerLogData) => {
    try {
      const newLog = await offlineDataManager.createPrayerLog(data);
      setLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prayer log');
      throw err;
    }
  }, []);

  const updateLog = useCallback(async (localId: string, updates: Partial<LocalPrayerLog>) => {
    try {
      await offlineDataManager.updatePrayerLog(localId, updates);
      setLogs(prev => prev.map(log => 
        log.local_id === localId ? { ...log, ...updates } : log
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prayer log');
      throw err;
    }
  }, []);

  const deleteLog = useCallback(async (localId: string) => {
    try {
      await offlineDataManager.deletePrayerLog(localId);
      setLogs(prev => prev.filter(log => log.local_id !== localId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prayer log');
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    return loadLogs();
  }, [loadLogs]);

  return {
    logs,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    refresh,
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());

  useEffect(() => {
    const unsubscribe = networkManager.onNetworkChange(setIsOnline);
    return unsubscribe;
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState({
    pendingOperations: 0,
    lastSync: null as string | null,
    isOnline: false,
  });
  const [loading, setLoading] = useState(true);

  const loadSyncStatus = useCallback(async () => {
    try {
      const status = await offlineDataManager.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Failed to load sync status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyncStatus();
    
    // Refresh sync status when network changes
    const unsubscribe = networkManager.onNetworkChange(() => {
      loadSyncStatus();
    });

    return unsubscribe;
  }, [loadSyncStatus]);

  const forceSync = useCallback(async () => {
    try {
      await offlineDataManager.forceSyncNow();
      await loadSyncStatus();
    } catch (err) {
      throw err;
    }
  }, [loadSyncStatus]);

  return {
    syncStatus,
    loading,
    forceSync,
    refresh: loadSyncStatus,
  };
}

export function useOfflineStats() {
  const [stats, setStats] = useState<{ status: string; count: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [yearlyData, setYearlyData] = useState<{ [key: string]: { verses: number; status: string } }>({});
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, streakData, yearData, monthData] = await Promise.all([
        offlineDataManager.getStatusStats(),
        offlineDataManager.getCurrentStreak(),
        offlineDataManager.getYearlyData(),
        offlineDataManager.getMonthlyData(),
      ]);

      setStats(statsData);
      setStreak(streakData);
      setYearlyData(yearData);
      setMonthlyData(monthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    streak,
    yearlyData,
    monthlyData,
    loading,
    error,
    refresh: loadStats,
  };
}