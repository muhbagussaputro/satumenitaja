export type QuranApiEnvelope<T> = {
  code: number;
  status: string;
  data: T;
};

export type SurahMeta = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
};

export type SurahDetail = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
};

export type SearchMatch = {
  number: number;
  numberInSurah: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
};

export type SearchPayload = {
  count: number;
  matches: SearchMatch[];
};
