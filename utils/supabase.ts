import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface PrayerLog {
  id: string;
  user_id: string;
  date: string;
  start_surah: string;
  start_ayah: number;
  end_surah: string;
  end_ayah: number;
  total_ayahs: number;
  status: string;
  created_at: string;
}

async function checkAuth() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Please sign in to continue');
  }
  return user;
}

export async function savePrayerLog(
  startSurah: string,
  startAyah: number,
  endSurah: string,
  endAyah: number,
  totalAyahs: number,
  status: string,
  date: Date
) {
  const user = await checkAuth();

  const { data, error } = await supabase
    .from('prayer_logs')
    .insert([
      {
        start_surah: startSurah,
        start_ayah: startAyah,
        end_surah: endSurah,
        end_ayah: endAyah,
        total_ayahs: totalAyahs,
        status: status,
        date: date.toISOString().split('T')[0],
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPrayerLogs(days: number = 30) {
  const user = await checkAuth();

  const { data, error } = await supabase
    .from('prayer_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(days);

  if (error) throw error;
  return data as PrayerLog[];
}

export async function getStatusStats() {
  const user = await checkAuth();

  const { data, error } = await supabase.rpc('get_status_stats');

  if (error) throw error;
  return data as { status: string; count: number }[];
}

export async function getCurrentStreak() {
  const user = await checkAuth();

  const { data: logs, error } = await supabase
    .from('prayer_logs')
    .select('date, status')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < (logs?.length || 0); i++) {
    const logDate = new Date(logs![i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (
      logDate.getTime() === expectedDate.getTime() &&
      logs![i].status !== 'Negligent'
    ) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getYearlyData() {
  const user = await checkAuth();
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  const { data, error } = await supabase
    .from('prayer_logs')
    .select('date, total_ayahs, status')
    .eq('user_id', user.id)
    .gte('date', format(startDate, 'yyyy-MM-dd'))
    .lte('date', format(endDate, 'yyyy-MM-dd'));

  if (error) throw error;

  const yearlyData: { [key: string]: { verses: number; status: string } } = {};
  data?.forEach((log) => {
    yearlyData[log.date] = {
      verses: log.total_ayahs,
      status: log.status,
    };
  });

  return yearlyData;
}

export async function getMonthlyData() {
  const user = await checkAuth();
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('prayer_logs')
    .select('date, status')
    .eq('user_id', user.id)
    .gte('date', format(firstDay, 'yyyy-MM-dd'))
    .lte('date', format(lastDay, 'yyyy-MM-dd'));

  if (error) throw error;

  const monthlyData: { [key: string]: string } = {};
  data?.forEach((log) => {
    monthlyData[log.date] = log.status;
  });

  return monthlyData;
}
