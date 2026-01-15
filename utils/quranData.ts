export interface Surah {
  name: string;
  nameAr: string;
  ayahs: number;
}

export const quranData: Surah[] = [
  { name: 'Al-Fatiha', nameAr: 'الفاتحة', ayahs: 7 },
  { name: 'Al-Baqara', nameAr: 'البقرة', ayahs: 286 },
  { name: 'Aal-E-Imran', nameAr: 'آل عمران', ayahs: 200 },
  { name: 'An-Nisa', nameAr: 'النساء', ayahs: 176 },
  { name: "Al-Ma'idah", nameAr: 'المائدة', ayahs: 120 },
  { name: "Al-An'am", nameAr: 'الأنعام', ayahs: 165 },
  { name: "Al-A'raf", nameAr: 'الأعراف', ayahs: 206 },
  { name: 'Al-Anfal', nameAr: 'الأنفال', ayahs: 75 },
  { name: 'At-Tawba', nameAr: 'التوبة', ayahs: 129 },
  { name: 'Yunus', nameAr: 'يونس', ayahs: 109 },
  { name: 'Hud', nameAr: 'هود', ayahs: 123 },
  { name: 'Yusuf', nameAr: 'يوسف', ayahs: 111 },
  { name: "Ar-Ra'd", nameAr: 'الرعد', ayahs: 43 },
  { name: 'Ibrahim', nameAr: 'إبراهيم', ayahs: 52 },
  { name: 'Al-Hijr', nameAr: 'الحجر', ayahs: 99 },
  { name: 'An-Nahl', nameAr: 'النحل', ayahs: 128 },
  { name: 'Al-Isra', nameAr: 'الإسراء', ayahs: 111 },
  { name: 'Al-Kahf', nameAr: 'الكهف', ayahs: 110 },
  { name: 'Maryam', nameAr: 'مريم', ayahs: 98 },
  { name: 'Ta-Ha', nameAr: 'طه', ayahs: 135 },
  { name: 'Al-Anbiya', nameAr: 'الأنبياء', ayahs: 112 },
  { name: 'Al-Hajj', nameAr: 'الحج', ayahs: 78 },
  { name: "Al-Mu'minun", nameAr: 'المؤمنون', ayahs: 118 },
  { name: 'An-Nur', nameAr: 'النور', ayahs: 64 },
  { name: 'Al-Furqan', nameAr: 'الفرقان', ayahs: 77 },
  { name: "Ash-Shu'ara", nameAr: 'الشعراء', ayahs: 227 },
  { name: 'An-Naml', nameAr: 'النمل', ayahs: 93 },
  { name: 'Al-Qasas', nameAr: 'القصص', ayahs: 88 },
  { name: 'Al-Ankabut', nameAr: 'العنكبوت', ayahs: 69 },
  { name: 'Ar-Rum', nameAr: 'الروم', ayahs: 60 },
  { name: 'Luqman', nameAr: 'لقمان', ayahs: 34 },
  { name: 'As-Sajda', nameAr: 'السجدة', ayahs: 30 },
  { name: 'Al-Ahzab', nameAr: 'الأحزاب', ayahs: 73 },
  { name: 'Saba', nameAr: 'سبأ', ayahs: 54 },
  { name: 'Fatir', nameAr: 'فاطر', ayahs: 45 },
  { name: 'Ya-Sin', nameAr: 'يس', ayahs: 83 },
  { name: 'As-Saffat', nameAr: 'الصافات', ayahs: 182 },
  { name: 'Sad', nameAr: 'ص', ayahs: 88 },
  { name: 'Az-Zumar', nameAr: 'الزمر', ayahs: 75 },
  { name: 'Ghafir', nameAr: 'غافر', ayahs: 85 },
  { name: 'Fussilat', nameAr: 'فصلت', ayahs: 54 },
  { name: 'Ash-Shura', nameAr: 'الشورى', ayahs: 53 },
  { name: 'Az-Zukhruf', nameAr: 'الزخرف', ayahs: 89 },
  { name: 'Ad-Dukhan', nameAr: 'الدخان', ayahs: 59 },
  { name: 'Al-Jathiya', nameAr: 'الجاثية', ayahs: 37 },
  { name: 'Al-Ahqaf', nameAr: 'الأحقاف', ayahs: 35 },
  { name: 'Muhammad', nameAr: 'محمد', ayahs: 38 },
  { name: 'Al-Fath', nameAr: 'الفتح', ayahs: 29 },
  { name: 'Al-Hujurat', nameAr: 'الحجرات', ayahs: 18 },
  { name: 'Qaf', nameAr: 'ق', ayahs: 45 },
  { name: 'Adh-Dhariyat', nameAr: 'الذاريات', ayahs: 60 },
  { name: 'At-Tur', nameAr: 'الطور', ayahs: 49 },
  { name: 'An-Najm', nameAr: 'النجم', ayahs: 62 },
  { name: 'Al-Qamar', nameAr: 'القمر', ayahs: 55 },
  { name: 'Ar-Rahman', nameAr: 'الرحمن', ayahs: 78 },
  { name: 'Al-Waqia', nameAr: 'الواقعة', ayahs: 96 },
  { name: 'Al-Hadid', nameAr: 'الحديد', ayahs: 29 },
  { name: 'Al-Mujadila', nameAr: 'المجادلة', ayahs: 22 },
  { name: 'Al-Hashr', nameAr: 'الحشر', ayahs: 24 },
  { name: 'Al-Mumtahina', nameAr: 'الممتحنة', ayahs: 13 },
  { name: 'As-Saff', nameAr: 'الصف', ayahs: 14 },
  { name: "Al-Jumu'a", nameAr: 'الجمعة', ayahs: 11 },
  { name: 'Al-Munafiqoon', nameAr: 'المنافقون', ayahs: 11 },
  { name: 'At-Taghabun', nameAr: 'التغابن', ayahs: 18 },
  { name: 'At-Talaq', nameAr: 'الطلاق', ayahs: 12 },
  { name: 'At-Tahrim', nameAr: 'التحريم', ayahs: 12 },
  { name: 'Al-Mulk', nameAr: 'الملك', ayahs: 30 },
  { name: 'Al-Qalam', nameAr: 'القلم', ayahs: 52 },
  { name: 'Al-Haqqa', nameAr: 'الحاقة', ayahs: 52 },
  { name: "Al-Ma'arij", nameAr: 'المعارج', ayahs: 44 },
  { name: 'Nuh', nameAr: 'نوح', ayahs: 28 },
  { name: 'Al-Jinn', nameAr: 'الجن', ayahs: 28 },
  { name: 'Al-Muzzammil', nameAr: 'المزمل', ayahs: 20 },
  { name: 'Al-Muddaththir', nameAr: 'المدثر', ayahs: 56 },
  { name: 'Al-Qiyama', nameAr: 'القيامة', ayahs: 40 },
  { name: 'Al-Insan', nameAr: 'الإنسان', ayahs: 31 },
  { name: 'Al-Mursalat', nameAr: 'المرسلات', ayahs: 50 },
  { name: 'An-Naba', nameAr: 'النبأ', ayahs: 40 },
  { name: "An-Nazi'at", nameAr: 'النازعات', ayahs: 46 },
  { name: 'Abasa', nameAr: 'عبس', ayahs: 42 },
  { name: 'At-Takwir', nameAr: 'التكوير', ayahs: 29 },
  { name: 'Al-Infitar', nameAr: 'الانفطار', ayahs: 19 },
  { name: 'Al-Mutaffifin', nameAr: 'المطففين', ayahs: 36 },
  { name: 'Al-Inshiqaq', nameAr: 'الانشقاق', ayahs: 25 },
  { name: 'Al-Buruj', nameAr: 'البروج', ayahs: 22 },
  { name: 'At-Tariq', nameAr: 'الطارق', ayahs: 17 },
  { name: "Al-A'la", nameAr: 'الأعلى', ayahs: 19 },
  { name: 'Al-Ghashiya', nameAr: 'الغاشية', ayahs: 26 },
  { name: 'Al-Fajr', nameAr: 'الفجر', ayahs: 30 },
  { name: 'Al-Balad', nameAr: 'البلد', ayahs: 20 },
  { name: 'Ash-Shams', nameAr: 'الشمس', ayahs: 15 },
  { name: 'Al-Lail', nameAr: 'الليل', ayahs: 21 },
  { name: 'Ad-Duhaa', nameAr: 'الضحى', ayahs: 11 },
  { name: 'Ash-Sharh', nameAr: 'الشرح', ayahs: 8 },
  { name: 'At-Tin', nameAr: 'التين', ayahs: 8 },
  { name: 'Al-Alaq', nameAr: 'العلق', ayahs: 19 },
  { name: 'Al-Qadr', nameAr: 'القدر', ayahs: 5 },
  { name: 'Al-Bayyina', nameAr: 'البينة', ayahs: 8 },
  { name: 'Az-Zalzala', nameAr: 'الزلزلة', ayahs: 8 },
  { name: 'Al-Adiyat', nameAr: 'العاديات', ayahs: 11 },
  { name: "Al-Qari'a", nameAr: 'القارعة', ayahs: 11 },
  { name: 'At-Takathur', nameAr: 'التكاثر', ayahs: 8 },
  { name: 'Al-Asr', nameAr: 'العصر', ayahs: 3 },
  { name: 'Al-Humaza', nameAr: 'الهمزة', ayahs: 9 },
  { name: 'Al-Fil', nameAr: 'الفيل', ayahs: 5 },
  { name: 'Quraish', nameAr: 'قريش', ayahs: 4 },
  { name: "Al-Ma'un", nameAr: 'الماعون', ayahs: 7 },
  { name: 'Al-Kawthar', nameAr: 'الكوثر', ayahs: 3 },
  { name: 'Al-Kafiroon', nameAr: 'الكافرون', ayahs: 6 },
  { name: 'An-Nasr', nameAr: 'النصر', ayahs: 3 },
  { name: 'Al-Masad', nameAr: 'المسد', ayahs: 5 },
  { name: 'Al-Ikhlas', nameAr: 'الإخلاص', ayahs: 4 },
  { name: 'Al-Falaq', nameAr: 'الفلق', ayahs: 5 },
  { name: 'An-Nas', nameAr: 'الناس', ayahs: 6 },
];

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
  targetVerses: number
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
    currentAyah = 1;
  }

  throw new Error('Could not calculate verse range');
}

export function calculateVersesBetween(
  startSurah: string,
  startAyah: number,
  endSurah: string,
  endAyah: number
): number {
  let totalVerses = 0;
  let currentSurahIndex = quranData.findIndex((s) => s.name === startSurah);
  const endSurahIndex = quranData.findIndex((s) => s.name === endSurah);

  if (currentSurahIndex === endSurahIndex) {
    return endAyah - startAyah + 1;
  }

  // Add remaining verses from the first surah
  totalVerses += quranData[currentSurahIndex].ayahs - startAyah + 1;

  // Add verses from intermediate surahs
  currentSurahIndex = (currentSurahIndex + 1) % quranData.length;
  while (currentSurahIndex !== endSurahIndex) {
    totalVerses += quranData[currentSurahIndex].ayahs;
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
      status: 'Mokantar',
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

export function getGradientColors(verseCount: number): readonly [string, string, string] {
  if (verseCount >= 1000) {
    return ['#492d52', '#210e2b', '#000000'];
  } else if (verseCount >= 100) {
    return ['#114a28', '#052b14', '#000000'];
  } else if (verseCount >= 10) {
    return ['#0e2a4a', '#05122b', '#000000'];
  }
  return ['#4a0e0e', '#2b0505', '#000000'];
}
