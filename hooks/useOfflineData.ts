import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  CreatePrayerLogData,
  UpdatePrayerLogData,
  offlineDataManager,
} from '../utils/database/offlineDataManager';
import { LocalPrayerLog, LocalRecitation } from '../utils/database/schema';
import { networkManager } from '../utils/network/networkManager';
import { getGradientColors, calculateAyahsBetweenIndices } from '../utils/quranData';

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
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize offline data'
        );
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
  const queryClient = useQueryClient();

  const {
    data: logs = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['prayerLogs', limit],
    queryFn: () => offlineDataManager.getPrayerLogs(limit),
  });

  const createLogMutation = useMutation({
    mutationFn: (data: CreatePrayerLogData) =>
      offlineDataManager.createPrayerLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerLogs'] });
      queryClient.invalidateQueries({ queryKey: ['offlineStats'] });
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdatePrayerLogData;
    }) => offlineDataManager.updatePrayerLog(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerLogs'] });
      queryClient.invalidateQueries({ queryKey: ['offlineStats'] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (id: string) =>
      offlineDataManager.deletePrayerLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerLogs'] });
      queryClient.invalidateQueries({ queryKey: ['offlineStats'] });
    },
  });

  return {
    logs,
    loading,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
    createLog: createLogMutation.mutateAsync,
    updateLog: (id: string, updates: UpdatePrayerLogData) =>
      updateLogMutation.mutateAsync({ id, updates }),
    deleteLog: deleteLogMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['prayerLogs'] }),
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
  const queryClient = useQueryClient();

  const {
    data: syncStatus = {
      pendingOperations: 0,
      lastSync: null as string | null,
      isOnline: false,
    },
    isLoading: loading,
  } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => offlineDataManager.getSyncStatus(),
  });

  useEffect(() => {
    // Refresh sync status when network changes
    const unsubscribe = networkManager.onNetworkChange(() => {
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const forceSyncMutation = useMutation({
    mutationFn: () => offlineDataManager.forceSyncNow(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['prayerLogs'] });
    },
  });

  return {
    syncStatus,
    loading,
    forceSync: forceSyncMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['syncStatus'] }),
  };
}

export function useOfflineStats() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['offlineStats'],
    queryFn: async () => {
      const [statsData, streakData, longestStreakData, yearData, monthData] = await Promise.all([
        offlineDataManager.getStatusStats(),
        offlineDataManager.getCurrentStreak(),
        offlineDataManager.getLongestStreak(),
        offlineDataManager.getYearlyData(),
        offlineDataManager.getMonthlyData(),
      ]);
      return {
        stats: statsData,
        streak: streakData,
        longestStreak: longestStreakData,
        yearlyData: yearData,
        monthlyData: monthData,
      };
    },
  });

  return {
    stats: data?.stats || [],
    streak: data?.streak || 0,
    longestStreak: data?.longestStreak || 0,
    yearlyData: data?.yearlyData || {},
    monthlyData: data?.monthlyData || {},
    loading,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: ['offlineStats'] }),
  };
}

/**
 * Helper function to calculate total ayahs from recitations
 */
export function calculateTotalAyahs(recitations: LocalRecitation[]): number {
  return recitations.reduce((sum, rec) => {
    return sum + calculateAyahsBetweenIndices(rec.start_ayah, rec.end_ayah);
  }, 0);
}

export function useLastNightStats() {
  const { logs, loading } = usePrayerLogs();

  const stats = useMemo(() => {
    if (logs.length === 0) {
      return {
        totalVerses: 0,
        gradientColors: getGradientColors(0),
        date: null,
      };
    }

    const lastEntry = logs[0];
    const lastDateStr = new Date(lastEntry.prayer_date).toDateString();

    const lastNightTotal = logs
      .filter((log) => new Date(log.prayer_date).toDateString() === lastDateStr)
      .reduce((sum, log) => sum + calculateTotalAyahs(log.recitations), 0);

    return {
      totalVerses: lastNightTotal,
      gradientColors: getGradientColors(lastNightTotal),
      date: lastEntry.prayer_date,
    };
  }, [logs]);

  return { ...stats, loading };
}
