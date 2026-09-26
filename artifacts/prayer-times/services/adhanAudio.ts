export type AdhanVoiceId =
  | 'ahmed-al-imadi'
  | 'majed-al-hamathani'
  | 'mokhtar-hadj-slimane'
  | 'nasser-al-qatami';

export interface AdhanVoice {
  id: AdhanVoiceId;
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  duration: string;
}

// These recordings are from the Internet Archive item marked Public Domain
// Mark 1.0. The source URL is kept visible in the settings UI for attribution.
export const ADHAN_VOICES: AdhanVoice[] = [
  {
    id: 'ahmed-al-imadi',
    name: 'أحمد العمادي',
    description: 'أذان هادئ وواضح',
    url: 'https://archive.org/download/adhan.notifications/Ahmed_al_Imadi_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '3:00',
  },
  {
    id: 'majed-al-hamathani',
    name: 'ماجد الحمداني',
    description: 'أذان بنبرة ممتدة',
    url: 'https://archive.org/download/adhan.notifications/Majed_al_Hamathani_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '3:39',
  },
  {
    id: 'mokhtar-hadj-slimane',
    name: 'مختار حاج سليمان',
    description: 'أذان بصوت جهوري',
    url: 'https://archive.org/download/adhan.notifications/Mokhtar_Hadj_Slimane_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '3:15',
  },
  {
    id: 'nasser-al-qatami',
    name: 'ناصر القطامي',
    description: 'أذان بإيقاع متوازن',
    url: 'https://archive.org/download/adhan.notifications/Nasser_al_Qatami_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '2:25',
  },
];

export const DEFAULT_ADHAN_VOICE_ID: AdhanVoiceId = 'ahmed-al-imadi';

export function getAdhanVoice(id: AdhanVoiceId): AdhanVoice {
  return (
    ADHAN_VOICES.find((voice) => voice.id === id) ??
    ADHAN_VOICES.find((voice) => voice.id === DEFAULT_ADHAN_VOICE_ID)!
  );
}