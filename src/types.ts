export interface DashboardWidget {
  id: string;
  type: 'image' | 'video' | 'link' | 'feed' | 'weather' | 'clock' | 'text';
  mediaId?: string; // Bound media file ID
  customContent?: string; // custom title, text, or feed source category, or custom city name
  gridX: number; // grid position col (col-start) from 1 to 12
  gridY: number; // grid position row (row-start) from 1 to 4
  gridW: number; // colSpan width (cols) from 1 to 12
  gridH: number; // rowSpan height (rows) from 1 to 4
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'link' | 'html' | 'feed' | 'dashboard';
  url: string; // Dynamic or local uploads (Base64 or static folder URLs)
  duration: number; // default duration in seconds if image/web
  size?: string;
  createdAt: string;
  feedCategory?: string; // option for feed: e.g. 'noticias', 'tecnologia', 'cotidiano', 'rh'
  dashboardWidgets?: DashboardWidget[]; // list of customized widget segments for dashboard type
}

export interface PlaylistItem {
  mediaId: string;
  duration: number; // custom duration for this playlist instance
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  items: PlaylistItem[];
  createdAt: string;
}

export interface Screen {
  id: string;
  name: string;
  code: string; // 6-digit pairing code (e.g. TV-912A)
  isPaired: boolean;
  lastHeartbeat?: string; // ISO String
  currentPlaylistId?: string | null; // Asssigned playlist
  location?: string;
  notes?: string;
  status: 'online' | 'offline';
}

export interface Schedule {
  id: string;
  name: string;
  playlistId: string;
  activeType: 'always' | 'scheduled'; // 'always' runs 24/7, 'scheduled' runs according to criteria
  daysOfWeek: number[]; // 0 for Sunday, 1 for Monday, etc. Empty if daily
  startTime?: string; // "HH:MM" format
  endTime?: string; // "HH:MM" format
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  screens: string[]; // Screen IDs assigned
  createdAt: string;
}

export interface PlaybackLog {
  id: string;
  screenId: string;
  screenName: string;
  mediaName: string;
  mediaType: string;
  timestamp: string;
}

export interface DBState {
  screens: Screen[];
  media: MediaItem[];
  playlists: Playlist[];
  schedules: Schedule[];
  logs: PlaybackLog[];
}
