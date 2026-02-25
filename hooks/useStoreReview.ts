import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'last_review_requested';
const MIN_DAYS_BETWEEN_REVIEWS = 30;

async function shouldRequestReview(): Promise<boolean> {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return false;

  const lastRequested = await AsyncStorage.getItem(STORAGE_KEY);
  if (!lastRequested) return true;

  const daysSinceLast =
    (Date.now() - parseInt(lastRequested, 10)) / (1000 * 60 * 60 * 24);
  return daysSinceLast >= MIN_DAYS_BETWEEN_REVIEWS;
}

async function requestReview() {
  if (!(await shouldRequestReview())) return;
  await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
  await StoreReview.requestReview();
}

/**
 * Triggers a store review prompt when the user reaches a 3-day streak
 * or when the last night's verse count reaches 100 or more.
 */
export function useStoreReview(streak: number, lastNightVerses: number) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    if (streak < 3 && lastNightVerses < 100) return;

    hasTriggered.current = true;
    requestReview().catch(() => {});
  }, [streak, lastNightVerses]);
}
