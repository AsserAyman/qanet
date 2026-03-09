export interface Surah {
  name: string;
  nameAr: string;
  ayahs: number;
  juz: number;
}

export const quranData: Surah[] = [
  { name: 'Al-Fatiha', nameAr: 'الفاتحة', ayahs: 7, juz: 1 },
  { name: 'Al-Baqara', nameAr: 'البقرة', ayahs: 286, juz: 1 },
  { name: 'Aal-E-Imran', nameAr: 'آل عمران', ayahs: 200, juz: 3 },
  { name: 'An-Nisa', nameAr: 'النساء', ayahs: 176, juz: 4 },
  { name: "Al-Ma'idah", nameAr: 'المائدة', ayahs: 120, juz: 6 },
  { name: "Al-An'am", nameAr: 'الأنعام', ayahs: 165, juz: 7 },
  { name: "Al-A'raf", nameAr: 'الأعراف', ayahs: 206, juz: 8 },
  { name: 'Al-Anfal', nameAr: 'الأنفال', ayahs: 75, juz: 9 },
  { name: 'At-Tawba', nameAr: 'التوبة', ayahs: 129, juz: 10 },
  { name: 'Yunus', nameAr: 'يونس', ayahs: 109, juz: 11 },
  { name: 'Hud', nameAr: 'هود', ayahs: 123, juz: 11 },
  { name: 'Yusuf', nameAr: 'يوسف', ayahs: 111, juz: 12 },
  { name: "Ar-Ra'd", nameAr: 'الرعد', ayahs: 43, juz: 13 },
  { name: 'Ibrahim', nameAr: 'إبراهيم', ayahs: 52, juz: 13 },
  { name: 'Al-Hijr', nameAr: 'الحجر', ayahs: 99, juz: 14 },
  { name: 'An-Nahl', nameAr: 'النحل', ayahs: 128, juz: 14 },
  { name: 'Al-Isra', nameAr: 'الإسراء', ayahs: 111, juz: 15 },
  { name: 'Al-Kahf', nameAr: 'الكهف', ayahs: 110, juz: 15 },
  { name: 'Maryam', nameAr: 'مريم', ayahs: 98, juz: 16 },
  { name: 'Ta-Ha', nameAr: 'طه', ayahs: 135, juz: 16 },
  { name: 'Al-Anbiya', nameAr: 'الأنبياء', ayahs: 112, juz: 17 },
  { name: 'Al-Hajj', nameAr: 'الحج', ayahs: 78, juz: 17 },
  { name: "Al-Mu'minun", nameAr: 'المؤمنون', ayahs: 118, juz: 18 },
  { name: 'An-Nur', nameAr: 'النور', ayahs: 64, juz: 18 },
  { name: 'Al-Furqan', nameAr: 'الفرقان', ayahs: 77, juz: 18 },
  { name: "Ash-Shu'ara", nameAr: 'الشعراء', ayahs: 227, juz: 19 },
  { name: 'An-Naml', nameAr: 'النمل', ayahs: 93, juz: 19 },
  { name: 'Al-Qasas', nameAr: 'القصص', ayahs: 88, juz: 20 },
  { name: 'Al-Ankabut', nameAr: 'العنكبوت', ayahs: 69, juz: 20 },
  { name: 'Ar-Rum', nameAr: 'الروم', ayahs: 60, juz: 21 },
  { name: 'Luqman', nameAr: 'لقمان', ayahs: 34, juz: 21 },
  { name: 'As-Sajda', nameAr: 'السجدة', ayahs: 30, juz: 21 },
  { name: 'Al-Ahzab', nameAr: 'الأحزاب', ayahs: 73, juz: 21 },
  { name: 'Saba', nameAr: 'سبأ', ayahs: 54, juz: 22 },
  { name: 'Fatir', nameAr: 'فاطر', ayahs: 45, juz: 22 },
  { name: 'Ya-Sin', nameAr: 'يس', ayahs: 83, juz: 22 },
  { name: 'As-Saffat', nameAr: 'الصافات', ayahs: 182, juz: 23 },
  { name: 'Sad', nameAr: 'ص', ayahs: 88, juz: 23 },
  { name: 'Az-Zumar', nameAr: 'الزمر', ayahs: 75, juz: 23 },
  { name: 'Ghafir', nameAr: 'غافر', ayahs: 85, juz: 24 },
  { name: 'Fussilat', nameAr: 'فصلت', ayahs: 54, juz: 24 },
  { name: 'Ash-Shura', nameAr: 'الشورى', ayahs: 53, juz: 25 },
  { name: 'Az-Zukhruf', nameAr: 'الزخرف', ayahs: 89, juz: 25 },
  { name: 'Ad-Dukhan', nameAr: 'الدخان', ayahs: 59, juz: 25 },
  { name: 'Al-Jathiya', nameAr: 'الجاثية', ayahs: 37, juz: 25 },
  { name: 'Al-Ahqaf', nameAr: 'الأحقاف', ayahs: 35, juz: 26 },
  { name: 'Muhammad', nameAr: 'محمد', ayahs: 38, juz: 26 },
  { name: 'Al-Fath', nameAr: 'الفتح', ayahs: 29, juz: 26 },
  { name: 'Al-Hujurat', nameAr: 'الحجرات', ayahs: 18, juz: 26 },
  { name: 'Qaf', nameAr: 'ق', ayahs: 45, juz: 26 },
  { name: 'Adh-Dhariyat', nameAr: 'الذاريات', ayahs: 60, juz: 26 },
  { name: 'At-Tur', nameAr: 'الطور', ayahs: 49, juz: 27 },
  { name: 'An-Najm', nameAr: 'النجم', ayahs: 62, juz: 27 },
  { name: 'Al-Qamar', nameAr: 'القمر', ayahs: 55, juz: 27 },
  { name: 'Ar-Rahman', nameAr: 'الرحمن', ayahs: 78, juz: 27 },
  { name: 'Al-Waqia', nameAr: 'الواقعة', ayahs: 96, juz: 27 },
  { name: 'Al-Hadid', nameAr: 'الحديد', ayahs: 29, juz: 27 },
  { name: 'Al-Mujadila', nameAr: 'المجادلة', ayahs: 22, juz: 28 },
  { name: 'Al-Hashr', nameAr: 'الحشر', ayahs: 24, juz: 28 },
  { name: 'Al-Mumtahina', nameAr: 'الممتحنة', ayahs: 13, juz: 28 },
  { name: 'As-Saff', nameAr: 'الصف', ayahs: 14, juz: 28 },
  { name: "Al-Jumu'a", nameAr: 'الجمعة', ayahs: 11, juz: 28 },
  { name: 'Al-Munafiqoon', nameAr: 'المنافقون', ayahs: 11, juz: 28 },
  { name: 'At-Taghabun', nameAr: 'التغابن', ayahs: 18, juz: 28 },
  { name: 'At-Talaq', nameAr: 'الطلاق', ayahs: 12, juz: 28 },
  { name: 'At-Tahrim', nameAr: 'التحريم', ayahs: 12, juz: 28 },
  { name: 'Al-Mulk', nameAr: 'الملك', ayahs: 30, juz: 29 },
  { name: 'Al-Qalam', nameAr: 'القلم', ayahs: 52, juz: 29 },
  { name: 'Al-Haqqa', nameAr: 'الحاقة', ayahs: 52, juz: 29 },
  { name: "Al-Ma'arij", nameAr: 'المعارج', ayahs: 44, juz: 29 },
  { name: 'Nuh', nameAr: 'نوح', ayahs: 28, juz: 29 },
  { name: 'Al-Jinn', nameAr: 'الجن', ayahs: 28, juz: 29 },
  { name: 'Al-Muzzammil', nameAr: 'المزمل', ayahs: 20, juz: 29 },
  { name: 'Al-Muddaththir', nameAr: 'المدثر', ayahs: 56, juz: 29 },
  { name: 'Al-Qiyama', nameAr: 'القيامة', ayahs: 40, juz: 29 },
  { name: 'Al-Insan', nameAr: 'الإنسان', ayahs: 31, juz: 29 },
  { name: 'Al-Mursalat', nameAr: 'المرسلات', ayahs: 50, juz: 29 },
  { name: 'An-Naba', nameAr: 'النبأ', ayahs: 40, juz: 30 },
  { name: "An-Nazi'at", nameAr: 'النازعات', ayahs: 46, juz: 30 },
  { name: 'Abasa', nameAr: 'عبس', ayahs: 42, juz: 30 },
  { name: 'At-Takwir', nameAr: 'التكوير', ayahs: 29, juz: 30 },
  { name: 'Al-Infitar', nameAr: 'الانفطار', ayahs: 19, juz: 30 },
  { name: 'Al-Mutaffifin', nameAr: 'المطففين', ayahs: 36, juz: 30 },
  { name: 'Al-Inshiqaq', nameAr: 'الانشقاق', ayahs: 25, juz: 30 },
  { name: 'Al-Buruj', nameAr: 'البروج', ayahs: 22, juz: 30 },
  { name: 'At-Tariq', nameAr: 'الطارق', ayahs: 17, juz: 30 },
  { name: "Al-A'la", nameAr: 'الأعلى', ayahs: 19, juz: 30 },
  { name: 'Al-Ghashiya', nameAr: 'الغاشية', ayahs: 26, juz: 30 },
  { name: 'Al-Fajr', nameAr: 'الفجر', ayahs: 30, juz: 30 },
  { name: 'Al-Balad', nameAr: 'البلد', ayahs: 20, juz: 30 },
  { name: 'Ash-Shams', nameAr: 'الشمس', ayahs: 15, juz: 30 },
  { name: 'Al-Lail', nameAr: 'الليل', ayahs: 21, juz: 30 },
  { name: 'Ad-Duhaa', nameAr: 'الضحى', ayahs: 11, juz: 30 },
  { name: 'Ash-Sharh', nameAr: 'الشرح', ayahs: 8, juz: 30 },
  { name: 'At-Tin', nameAr: 'التين', ayahs: 8, juz: 30 },
  { name: 'Al-Alaq', nameAr: 'العلق', ayahs: 19, juz: 30 },
  { name: 'Al-Qadr', nameAr: 'القدر', ayahs: 5, juz: 30 },
  { name: 'Al-Bayyina', nameAr: 'البينة', ayahs: 8, juz: 30 },
  { name: 'Az-Zalzala', nameAr: 'الزلزلة', ayahs: 8, juz: 30 },
  { name: 'Al-Adiyat', nameAr: 'العاديات', ayahs: 11, juz: 30 },
  { name: "Al-Qari'a", nameAr: 'القارعة', ayahs: 11, juz: 30 },
  { name: 'At-Takathur', nameAr: 'التكاثر', ayahs: 8, juz: 30 },
  { name: 'Al-Asr', nameAr: 'العصر', ayahs: 3, juz: 30 },
  { name: 'Al-Humaza', nameAr: 'الهمزة', ayahs: 9, juz: 30 },
  { name: 'Al-Fil', nameAr: 'الفيل', ayahs: 5, juz: 30 },
  { name: 'Quraish', nameAr: 'قريش', ayahs: 4, juz: 30 },
  { name: "Al-Ma'un", nameAr: 'الماعون', ayahs: 7, juz: 30 },
  { name: 'Al-Kawthar', nameAr: 'الكوثر', ayahs: 3, juz: 30 },
  { name: 'Al-Kafiroon', nameAr: 'الكافرون', ayahs: 6, juz: 30 },
  { name: 'An-Nasr', nameAr: 'النصر', ayahs: 3, juz: 30 },
  { name: 'Al-Masad', nameAr: 'المسد', ayahs: 5, juz: 30 },
  { name: 'Al-Ikhlas', nameAr: 'الإخلاص', ayahs: 4, juz: 30 },
  { name: 'Al-Falaq', nameAr: 'الفلق', ayahs: 5, juz: 30 },
  { name: 'An-Nas', nameAr: 'الناس', ayahs: 6, juz: 30 },
];

// Al-Fatiha is excluded from display and verse counting (it's always recited separately).
// The global index system (1–6236) still includes it so existing DB data is unaffected.
export const quranDisplayData = quranData.slice(1);

// Surahs recited every night as Shaf' & Witr — excluded when computing the next start position.
export const SHAF_WITR_SURAHS = [
  "Al-A'la",
  'Al-Kafiroon',
  'Al-Ikhlas',
  'Al-Falaq',
  'An-Nas',
] as const;

/**
 * Given a list of recitations from the last prayer log, returns the surah name
 * and ayah number to start from next, skipping Shaf'/Witr surahs and Al-Fatiha.
 * Returns null if no suitable recitation is found.
 */
export function getNextStartPosition(
  recitations: { start_ayah: number; end_ayah: number }[],
): { surahName: string; ayahNumber: number } | null {
  const shafWitrSet = new Set<string>(SHAF_WITR_SURAHS);

  const last = [...recitations]
    .reverse()
    .find((r) => !shafWitrSet.has(globalIndexToSurahAyah(r.start_ayah).surahName));

  if (!last) return null;

  const endInfo = globalIndexToSurahAyah(last.end_ayah);
  const endSurahData = quranData.find((s) => s.name === endInfo.surahName);
  if (!endSurahData) return null;

  let surahName: string;
  let ayahNumber: number;

  if (endInfo.ayahNumber >= endSurahData.ayahs) {
    const nextIndex = (endInfo.surahIndex + 1) % quranData.length;
    surahName = quranData[nextIndex].name;
    ayahNumber = 1;
  } else {
    surahName = endInfo.surahName;
    ayahNumber = endInfo.ayahNumber + 1;
  }

  // Skip Al-Fatiha (hidden from pickers)
  if (surahName === quranData[0].name) {
    surahName = quranDisplayData[0].name;
    ayahNumber = 1;
  }

  return { surahName, ayahNumber };
}

export interface VerseRange {
  startSurah: string;
  startAyah: number;
  endSurah: string;
  endAyah: number;
  totalAyahs: number;
}

export function calculateVerseRange(
  startSurah: string,
  startAyah: number,
  targetVerses: number,
): VerseRange {
  let currentSurahIndex = quranData.findIndex((s) => s.name === startSurah);
  let remainingVerses = targetVerses;
  let currentAyah = startAyah;

  while (remainingVerses > 0) {
    const currentSurah = quranData[currentSurahIndex];
    const versesInCurrentSurah = currentSurah.ayahs - currentAyah + 1;

    if (versesInCurrentSurah >= remainingVerses) {
      return {
        startSurah,
        startAyah,
        endSurah: currentSurah.name,
        endAyah: currentAyah + remainingVerses - 1,
        totalAyahs: targetVerses,
      };
    }

    remainingVerses -= versesInCurrentSurah;
    currentSurahIndex = (currentSurahIndex + 1) % quranData.length;
    // Skip Al-Fatiha (index 0) when wrapping around the Quran
    if (currentSurahIndex === 0) currentSurahIndex = 1;
    currentAyah = 1;
  }

  throw new Error('Could not calculate verse range');
}

export function calculateVersesBetween(
  startSurah: string,
  startAyah: number,
  endSurah: string,
  endAyah: number,
): number {
  let totalVerses = 0;
  let currentSurahIndex = quranData.findIndex((s) => s.name === startSurah);
  const endSurahIndex = quranData.findIndex((s) => s.name === endSurah);

  if (currentSurahIndex === endSurahIndex && endAyah >= startAyah) {
    return endAyah - startAyah + 1;
  }

  // Add remaining verses from the first surah
  totalVerses += quranData[currentSurahIndex].ayahs - startAyah + 1;

  // Add verses from intermediate surahs (skip Al-Fatiha index 0 in wrap-around)
  currentSurahIndex = (currentSurahIndex + 1) % quranData.length;
  while (currentSurahIndex !== endSurahIndex) {
    if (currentSurahIndex !== 0) {
      totalVerses += quranData[currentSurahIndex].ayahs;
    }
    currentSurahIndex = (currentSurahIndex + 1) % quranData.length;
  }

  // Add verses from the last surah
  totalVerses += endAyah;

  return totalVerses;
}

export function getVerseStatus(verseCount: number): {
  status: string;
  color: string;
  descriptionKey: string;
} {
  if (verseCount >= 1000) {
    return {
      status: 'Muqantar',
      color: '#a855f7',
      descriptionKey: 'hugeRewardsAwaitYou',
    };
  } else if (verseCount >= 100) {
    return {
      status: 'Qanet',
      color: '#22c55e',
      descriptionKey: 'amongThoseObedientToAllah',
    };
  } else if (verseCount >= 10) {
    return {
      status: 'Not Negligent',
      color: '#3b82f6',
      descriptionKey: 'youAreNotAmongTheNegligent',
    };
  } else {
    return {
      status: 'Negligent',
      color: '#ef4444',
      descriptionKey: 'striveToReadAtLeast10Verses',
    };
  }
}

export function getGradientColors(
  verseCount: number,
  themedColorsEnabled: boolean = true,
): readonly [string, string, string] {
  // If themed colors are disabled, always return neutral dark gradient
  if (!themedColorsEnabled) {
    return ['#1a1a1a', '#0a0a0a', '#000000'];
  }

  // Otherwise, return themed colors based on verse count
  if (verseCount >= 1000) {
    return ['#492d52', '#210e2b', '#000000']; // Purple for Muqantar
  } else if (verseCount >= 100) {
    return ['#114a28', '#052b14', '#000000']; // Green for Qanet
  } else if (verseCount >= 10) {
    return ['#0e2a4a', '#05122b', '#000000']; // Blue for Not Negligent
  }
  return ['#4a0e0e', '#2b0505', '#000000']; // Red for Negligent (<10 verses)
}

// =====================================================
// Global Ayah Index Utilities
// =====================================================
// The Quran has 6236 ayahs total. Global index ranges from 1-6236.
// This allows storing recitation ranges as simple integer pairs.

// Pre-computed cumulative ayah counts for fast lookup
const cumulativeAyahCounts: number[] = [];
let totalCount = 0;
for (const surah of quranData) {
  cumulativeAyahCounts.push(totalCount);
  totalCount += surah.ayahs;
}
// Total ayahs in Quran: 6236
export const TOTAL_QURAN_AYAHS = totalCount;

/**
 * Convert surah name and ayah number to global index (1-6236)
 * @param surahName - Name of the surah (e.g., "Al-Fatiha")
 * @param ayahNumber - Ayah number within the surah (1-based)
 * @returns Global ayah index (1-6236)
 */
export function surahAyahToGlobalIndex(
  surahName: string,
  ayahNumber: number,
): number {
  const surahIndex = quranData.findIndex((s) => s.name === surahName);
  if (surahIndex === -1) {
    throw new Error(`Unknown surah: ${surahName}`);
  }
  const surah = quranData[surahIndex];
  if (ayahNumber < 1 || ayahNumber > surah.ayahs) {
    throw new Error(
      `Invalid ayah number ${ayahNumber} for surah ${surahName} (has ${surah.ayahs} ayahs)`,
    );
  }
  return cumulativeAyahCounts[surahIndex] + ayahNumber;
}

/**
 * Convert global ayah index to surah name and ayah number
 * @param globalIndex - Global ayah index (1-6236)
 * @returns Object with surahName, surahNameAr, ayahNumber
 */
export function globalIndexToSurahAyah(globalIndex: number): {
  surahName: string;
  surahNameAr: string;
  ayahNumber: number;
  surahIndex: number;
} {
  if (globalIndex < 1 || globalIndex > TOTAL_QURAN_AYAHS) {
    throw new Error(
      `Invalid global index: ${globalIndex}. Must be between 1 and ${TOTAL_QURAN_AYAHS}`,
    );
  }

  // Binary search for the surah
  let low = 0;
  let high = quranData.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (cumulativeAyahCounts[mid] < globalIndex) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  const surah = quranData[low];
  const ayahNumber = globalIndex - cumulativeAyahCounts[low];

  return {
    surahName: surah.name,
    surahNameAr: surah.nameAr,
    ayahNumber,
    surahIndex: low,
  };
}

/**
 * Calculate total ayahs between two global indices (inclusive)
 */
export function calculateAyahsBetweenIndices(
  startGlobal: number,
  endGlobal: number,
): number {
  if (endGlobal >= startGlobal) {
    return endGlobal - startGlobal + 1;
  } else {
    // Wrap around case (e.g. from end of Quran to beginning)
    return TOTAL_QURAN_AYAHS - startGlobal + 1 + endGlobal;
  }
}

/**
 * Format a global index range for display
 * @param startGlobal - Start global index
 * @param endGlobal - End global index
 * @param useArabic - Use Arabic surah names
 * @returns Formatted string like "Al-Baqara 1 → Al-Baqara 50"
 */
export function formatRecitationRange(
  startGlobal: number,
  endGlobal: number,
  useArabic: boolean = false,
): string {
  const start = globalIndexToSurahAyah(startGlobal);
  const end = globalIndexToSurahAyah(endGlobal);

  const startName = useArabic ? start.surahNameAr : start.surahName;
  const endName = useArabic ? end.surahNameAr : end.surahName;

  const arrow = useArabic ? '←' : '→';
  return `${startName} ${start.ayahNumber} ${arrow} ${endName} ${end.ayahNumber}`;
}

// =====================================================
// Rub al-Hizb (Quarter of Hizb) Boundaries
// =====================================================
// The Quran has 240 Rub al-Hizb divisions.
// Hierarchy: 30 Juz' → 60 Hizb → 240 Rub' al-Hizb
// Each Juz' = 2 Hizb = 8 Rub'
// Source: alquran.cloud API

// Raw boundaries as [surahNumber (1-based), ayahNumber]
const RUB_AL_HIZB_RAW: [number, number][] = [
  [1,1],[2,26],[2,44],[2,60],[2,75],[2,92],[2,106],[2,124],[2,142],[2,158],
  [2,177],[2,189],[2,203],[2,219],[2,233],[2,243],[2,253],[2,263],[2,272],[2,283],
  [3,15],[3,33],[3,52],[3,75],[3,93],[3,113],[3,133],[3,153],[3,171],[3,186],
  [4,1],[4,12],[4,24],[4,36],[4,58],[4,74],[4,88],[4,100],[4,114],[4,135],
  [4,148],[4,163],[5,1],[5,12],[5,27],[5,41],[5,51],[5,67],[5,82],[5,97],
  [5,109],[6,13],[6,36],[6,59],[6,74],[6,95],[6,111],[6,127],[6,141],[6,151],
  [7,1],[7,31],[7,47],[7,65],[7,88],[7,117],[7,142],[7,156],[7,171],[7,189],
  [8,1],[8,22],[8,41],[8,61],[9,1],[9,19],[9,34],[9,46],[9,60],[9,75],
  [9,93],[9,111],[9,122],[10,11],[10,26],[10,53],[10,71],[10,90],[11,6],[11,24],
  [11,41],[11,61],[11,84],[11,108],[12,7],[12,30],[12,53],[12,77],[12,101],[13,5],
  [13,19],[13,35],[14,10],[14,28],[15,1],[15,50],[16,1],[16,30],[16,51],[16,75],
  [16,90],[16,111],[17,1],[17,23],[17,50],[17,70],[17,99],[18,17],[18,32],[18,51],
  [18,75],[18,99],[19,22],[19,59],[20,1],[20,55],[20,83],[20,111],[21,1],[21,29],
  [21,51],[21,83],[22,1],[22,19],[22,38],[22,60],[23,1],[23,36],[23,75],[24,1],
  [24,21],[24,35],[24,53],[25,1],[25,21],[25,53],[26,1],[26,52],[26,111],[26,181],
  [27,1],[27,27],[27,56],[27,82],[28,12],[28,29],[28,51],[28,76],[29,1],[29,26],
  [29,46],[30,1],[30,31],[30,54],[31,22],[32,11],[33,1],[33,18],[33,31],[33,51],
  [33,60],[34,10],[34,24],[34,46],[35,15],[35,41],[36,28],[36,60],[37,22],[37,83],
  [37,145],[38,21],[38,52],[39,8],[39,32],[39,53],[40,1],[40,21],[40,41],[40,66],
  [41,9],[41,25],[41,47],[42,13],[42,27],[42,51],[43,24],[43,57],[44,17],[45,12],
  [46,1],[46,21],[47,10],[47,33],[48,18],[49,1],[49,14],[50,27],[51,31],[52,24],
  [53,26],[54,9],[55,1],[56,1],[56,75],[57,16],[58,1],[58,14],[59,11],[60,7],
  [62,1],[63,4],[65,1],[66,1],[67,1],[68,1],[69,1],[70,19],[72,1],[73,20],
  [75,1],[76,19],[78,1],[80,1],[82,1],[84,1],[87,1],[90,1],[94,1],[100,9],
];

// Pre-computed global ayah indices for each rub boundary
export const RUB_AL_HIZB_GLOBAL: number[] = RUB_AL_HIZB_RAW.map(
  ([surahNum, ayah]) => cumulativeAyahCounts[surahNum - 1] + ayah,
);


export interface QuranDivisions {
  rub: number;     // Rub' al-Hizb count (fractional)
  hizb: number;    // Hizb count (fractional)
  juz: number;     // Juz' count (fractional)
  minutes: number; // Estimated recitation time (~5 min per Rub')
}

// Global index of Al-Baqara ayah 1 (= 7 + 1, since Al-Fatiha occupies indices 1–7)
const AL_BAQARA_GLOBAL_START = cumulativeAyahCounts[1] + 1;

/**
 * Compute fractional Rub' count for a non-wrapping global index range.
 */
function computeRubForRange(startGlobal: number, endGlobal: number): number {
  if (endGlobal < startGlobal) return 0;

  const getRubEnd = (idx: number) =>
    idx < RUB_AL_HIZB_GLOBAL.length - 1
      ? RUB_AL_HIZB_GLOBAL[idx + 1] - 1
      : TOTAL_QURAN_AYAHS;

  let startRubIdx = 0;
  for (let i = 1; i < RUB_AL_HIZB_GLOBAL.length; i++) {
    if (RUB_AL_HIZB_GLOBAL[i] <= startGlobal) startRubIdx = i;
    else break;
  }

  let endRubIdx = 0;
  for (let i = 1; i < RUB_AL_HIZB_GLOBAL.length; i++) {
    if (RUB_AL_HIZB_GLOBAL[i] <= endGlobal) endRubIdx = i;
    else break;
  }

  if (startRubIdx === endRubIdx) {
    const rubSize = getRubEnd(startRubIdx) - RUB_AL_HIZB_GLOBAL[startRubIdx] + 1;
    return (endGlobal - startGlobal + 1) / rubSize;
  }

  const startRubEnd = getRubEnd(startRubIdx);
  const startRubSize = startRubEnd - RUB_AL_HIZB_GLOBAL[startRubIdx] + 1;
  const startFraction = (startRubEnd - startGlobal + 1) / startRubSize;

  const endRubStart = RUB_AL_HIZB_GLOBAL[endRubIdx];
  const endRubSize = getRubEnd(endRubIdx) - endRubStart + 1;
  const endFraction = (endGlobal - endRubStart + 1) / endRubSize;

  return startFraction + (endRubIdx - startRubIdx - 1) + endFraction;
}

/**
 * Calculate Quranic divisions (Juz', Hizb, Rub' al-Hizb) for a verse range.
 * Handles wrap-around ranges (e.g. Al-Fil → Al-A'raf). 1 Rub' ≈ 5 minutes.
 */
export function calculateQuranDivisions(
  startSurah: string,
  startAyah: number,
  endSurah: string,
  endAyah: number,
): QuranDivisions {
  const startGlobal = surahAyahToGlobalIndex(startSurah, startAyah);
  const endGlobal = surahAyahToGlobalIndex(endSurah, endAyah);

  let rub: number;
  if (endGlobal < startGlobal) {
    // Wrap-around: [startGlobal → end of Quran] + [Al-Baqara start → endGlobal]
    rub =
      computeRubForRange(startGlobal, TOTAL_QURAN_AYAHS) +
      computeRubForRange(AL_BAQARA_GLOBAL_START, endGlobal);
  } else {
    rub = computeRubForRange(startGlobal, endGlobal);
  }

  return {
    rub,
    hizb: rub / 4,
    juz: rub / 8,
    minutes: rub * 5,
  };
}

/**
 * Format a summary string for a list of recitations.
 * e.g., "Al-Baqara 1 → Al-Baqara 50" or "Al-Baqara 1 → Al-Baqara 50 (+2 more)"
 */
export function formatLogSummary(
  recitations: { start_ayah: number; end_ayah: number }[],
  useArabic: boolean = false,
  moreText: string = 'more', // Localized "more" string
): string {
  if (!recitations || recitations.length === 0) return '';

  const firstRec = recitations[0];
  const mainRange = formatRecitationRange(
    firstRec.start_ayah,
    firstRec.end_ayah,
    useArabic,
  );

  if (recitations.length > 1) {
    const remainingCount = recitations.length - 1;
    return `${mainRange} (+${remainingCount} ${moreText})`;
  }

  return mainRange;
}
