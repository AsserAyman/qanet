import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import {
  getCachedCustomUserId,
  registerOrGetCustomUser,
} from './auth/userRegistration';

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

export interface Feedback {
  id: string;
  user_id: string;
  feedback_text: string;
  created_at: string;
}

export async function submitFeedback(feedbackText: string): Promise<Feedback> {
  // Validate input
  const trimmedText = feedbackText.trim();
  if (trimmedText.length === 0 || trimmedText.length > 5000) {
    throw new Error('Feedback must be between 1 and 5000 characters');
  }

  // Get custom user ID (matches pattern used by prayer logs)
  let customUserId = await getCachedCustomUserId();
  if (!customUserId) {
    // Cache might not be populated yet (e.g., before first sync completes)
    // Try to register/get user from server
    customUserId = await registerOrGetCustomUser();
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert([
      {
        feedback_text: trimmedText,
        user_id: customUserId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
