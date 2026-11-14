export interface User {
  id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Library {
  key: string;
  title: string;
  type: string;
}

export interface MediaItem {
  ratingKey: string;
  key: string;
  title: string;
  type: string;
  year?: number;
  thumb?: string;
  art?: string;
  summary?: string;
  rating?: number;
  duration?: number;
  addedAt?: number;
  updatedAt?: number;
  originallyAvailableAt?: string;
  studio?: string;
  contentRating?: string;
  // Episode/Season/Track context fields
  grandparentTitle?: string; // Show name for episodes, Artist for tracks
  parentTitle?: string; // Season name for episodes, Album for tracks
  index?: number; // Episode number or Track number
  parentIndex?: number; // Season number
  parentRatingKey?: string;
  grandparentRatingKey?: string;
  parentThumb?: string;
  grandparentThumb?: string;
  leafCount?: number; // Episode count (shows/seasons)
  childCount?: number; // Season count (shows)
  librarySectionID?: string | number;
  librarySectionTitle?: string;
  allowSync?: boolean | number | string;
  Genre?: { tag: string }[];
  Media?: MediaPart[];
}

export interface MediaPart {
  id: number;
  duration: number;
  bitrate: number;
  width: number;
  height: number;
  aspectRatio: number;
  videoCodec: string;
  videoResolution: string;
  container: string;
  videoFrameRate: string;
  audioCodec?: string;
  audioChannels?: number;
  Part: Part[];
}

export interface Part {
  id: number;
  key: string;
  duration: number;
  file: string;
  size: number;
  container: string;
}

export interface PlexPin {
  id: number;
  code: string;
  url: string;
}

export interface Settings {
  plexUrl: string;
  hasPlexToken: boolean;
  plexMachineId?: string;
  plexServerName?: string;
}
