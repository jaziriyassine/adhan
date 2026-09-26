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
  /**
   * Filename (with extension) of the bundled audio file used as the real
   * notification-channel sound on Android, and as the iOS notification
   * sound. Must exactly match a file registered in the `expo-notifications`
   * plugin config in app.json, and must live under assets/sounds/.
   * Android resource names only allow [a-z0-9_] — no dashes, no uppercase.
   */
  soundFile: string;
}

// These recordings are from the Internet Archive item marked Public Domain
// Mark 1.0. The source URL is kept visible in the settings UI for attribution.
// NOTE: `url` is used only for the in-app "preview" player (streamed).
// `soundFile` is the local copy that must be downloaded once and placed in
// assets/sounds/ — see assets/sounds/README.md — so the real adhan can play
// from a scheduled notification even when the app is closed or the phone is
// locked (a remote URL cannot be used as a notification/channel sound).
export const ADHAN_VOICES: AdhanVoice[] = [
  {
    id: 'ahmed-al-imadi',
    name: 'أحمد العمادي',
    description: 'أذان هادئ وواضح',
    url: 'https://archive.org/download/adhan.notifications/Ahmed_al_Imadi_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '3:00',
    soundFile: 'ahmed_al_imadi.mp3',
  },
  {
    id: 'majed-al-hamathani',
    name: 'ماجد الحمداني',
    description: 'أذان بنبرة ممتدة',
    url: 'https://archive.org/download/adhan.notifications/Majed_al_Hamathani_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '3:39',
    soundFile: 'majed_al_hamathani.mp3',
  },
  {
    id: 'mokhtar-hadj-slimane',
    name: 'مختار حاج سليمان',
    description: 'أذان بصوت جهوري',
    url: 'https://archive.org/download/adhan.notifications/Mokhtar_Hadj_Slimane_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '3:15',
    soundFile: 'mokhtar_hadj_slimane.mp3',
  },
  {
    id: 'nasser-al-qatami',
    name: 'ناصر القطامي',
    description: 'أذان بإيقاع متوازن',
    url: 'https://archive.org/download/adhan.notifications/Nasser_al_Qatami_Adhan.mp3',
    sourceUrl: 'https://archive.org/details/adhan.notifications',
    duration: '2:25',
    soundFile: 'nasser_al_qatami.mp3',
  },
];

export const DEFAULT_ADHAN_VOICE_ID: AdhanVoiceId = 'ahmed-al-imadi';

export function getAdhanVoice(id: AdhanVoiceId): AdhanVoice {
  return (
    ADHAN_VOICES.find((voice) => voice.id === id) ??
    ADHAN_VOICES.find((voice) => voice.id === DEFAULT_ADHAN_VOICE_ID)!
  );
}
