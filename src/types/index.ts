export interface Mood {
  emoji: string;
  label: string;
  color: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  happened: string;
  meaning: string;
  next: string;
  mood: Mood;
  important: boolean;
  tags: string[];
  // Filenames (not full URIs) of attached photos stored in the document dir.
  // Resolve with photoUri() at render time so they survive container path
  // changes across reinstalls.
  photos: string[];
}

export const MOODS: Mood[] = [
  { emoji: '😌', label: 'Calm', color: '#5B8DB8' },
  { emoji: '😊', label: 'Good', color: '#5BA378' },
  { emoji: '😔', label: 'Low', color: '#7A8C9E' },
  { emoji: '😤', label: 'Frustrated', color: '#C97A5A' },
  { emoji: '😰', label: 'Anxious', color: '#B07AB0' },
  { emoji: '💪', label: 'Determined', color: '#5A9AB5' },
  { emoji: '🤔', label: 'Uncertain', color: '#9B8B5A' },
  { emoji: '✨', label: 'Grateful', color: '#C9A850' },
  { emoji: '😶', label: 'Numb', color: '#8888A0' },
  { emoji: '🔥', label: 'Intense', color: '#C05050' },
];

export type RootStackParamList = {
  Home: undefined;
  NewEntry: { entry?: JournalEntry } | undefined;
  EntryDetail: { entry: JournalEntry };
  Settings: undefined;
  Insights: undefined;
};
