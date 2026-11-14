import axios, { AxiosInstance } from 'axios';
import {
  User,
  AuthResponse,
  Library,
  MediaItem,
  PlexPin,
  Settings,
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async checkSetupRequired(): Promise<boolean> {
    const response = await this.client.get<{ setupRequired: boolean }>('/auth/setup/required');
    return response.data.setupRequired;
  }

  async setup(data: {
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/setup', data);
    return response.data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  }

  async generatePlexPin(): Promise<PlexPin> {
    const response = await this.client.post<PlexPin>('/auth/plex/pin');
    return response.data;
  }

  async authenticatePlexPin(pinId: number): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/plex/authenticate', { pinId });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/auth/me');
    return response.data.user;
  }

  async logout(): Promise<void> {
    this.librariesPromise = null;
    await this.client.post('/auth/logout');
    localStorage.removeItem('token');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Library endpoints
  // Libraries rarely change: share one request between the sidebar and pages.
  private librariesPromise: Promise<Library[]> | null = null;

  getLibraries(): Promise<Library[]> {
    if (!this.librariesPromise) {
      this.librariesPromise = this.client
        .get<{ libraries: Library[] }>('/libraries')
        .then((r) => r.data.libraries)
        .catch((err) => {
          this.librariesPromise = null;
          throw err;
        });
    }
    return this.librariesPromise;
  }

  async getLibraryContent(libraryKey: string, viewType?: string): Promise<MediaItem[]> {
    const response = await this.client.get<{ content: MediaItem[] }>(
      `/libraries/${libraryKey}/content`,
      {
        params: viewType ? { viewType } : undefined,
      }
    );
    return response.data.content;
  }

  // Media endpoints
  async getRecentlyAdded(limit: number = 20): Promise<MediaItem[]> {
    const response = await this.client.get<{ media: MediaItem[] }>('/media/recently-added', {
      params: { limit },
    });
    return response.data.media;
  }

  async searchMedia(query: string): Promise<MediaItem[]> {
    const response = await this.client.get<{ results: MediaItem[] }>('/media/search', {
      params: { q: query },
    });
    return response.data.results;
  }

  async getMediaMetadata(ratingKey: string): Promise<MediaItem> {
    const response = await this.client.get<{ metadata: MediaItem }>(`/media/${ratingKey}`);
    return response.data.metadata;
  }

  async getSeasons(showRatingKey: string): Promise<MediaItem[]> {
    const response = await this.client.get<{ seasons: MediaItem[] }>(`/media/${showRatingKey}/seasons`);
    return response.data.seasons;
  }

  async getEpisodes(seasonRatingKey: string): Promise<MediaItem[]> {
    const response = await this.client.get<{ episodes: MediaItem[] }>(`/media/${seasonRatingKey}/episodes`);
    return response.data.episodes;
  }

  async getTracks(albumRatingKey: string): Promise<MediaItem[]> {
    const response = await this.client.get<{ tracks: MediaItem[] }>(`/media/${albumRatingKey}/tracks`);
    return response.data.tracks;
  }

  async getDownloadHistory(limit: number = 50): Promise<any[]> {
    const response = await this.client.get<{ history: any[] }>('/media/download-history', {
      params: { limit },
    });
    return response.data.history;
  }

  async getAllDownloadHistory(limit: number = 100): Promise<any[]> {
    const response = await this.client.get<{ history: any[] }>('/media/download-history/all', {
      params: { limit },
    });
    return response.data.history;
  }

  async getDownloadStats(): Promise<any> {
    const response = await this.client.get<{ stats: any }>('/media/download-stats');
    return response.data.stats;
  }

  // Download URLs carry the session token so the browser can save files natively
  // (streamed straight to disk, with its own progress bar) instead of buffering in memory.
  private withToken(url: string): string {
    const token = localStorage.getItem('token') || '';
    return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
  }

  getDownloadUrl(ratingKey: string, partKey: string): string {
    return this.withToken(`/api/media/${ratingKey}/download?partKey=${encodeURIComponent(partKey)}`);
  }

  async getSeasonSize(seasonRatingKey: string): Promise<{ totalSize: number; fileCount: number; totalSizeGB: string }> {
    const response = await this.client.get<{ totalSize: number; fileCount: number; totalSizeGB: string }>(
      `/media/season/${seasonRatingKey}/size`
    );
    return response.data;
  }

  async getAlbumSize(albumRatingKey: string): Promise<{ totalSize: number; fileCount: number; totalSizeGB: string }> {
    const response = await this.client.get<{ totalSize: number; fileCount: number; totalSizeGB: string }>(
      `/media/album/${albumRatingKey}/size`
    );
    return response.data;
  }

  getSeasonDownloadUrl(seasonRatingKey: string): string {
    return this.withToken(`/api/media/season/${seasonRatingKey}/download`);
  }

  getAlbumDownloadUrl(albumRatingKey: string): string {
    return this.withToken(`/api/media/album/${albumRatingKey}/download`);
  }

  /** width: ask Plex for a resized image (much lighter than the original poster). */
  getThumbnailUrl(ratingKey: string, path: string, width?: number): string {
    const token = localStorage.getItem('token');
    const source = width
      ? `/photo/:/transcode?width=${width}&height=${Math.round(width * 1.5)}&minSize=1&upscale=1&url=${encodeURIComponent(path)}`
      : path;
    return `/api/media/thumb/${ratingKey}?path=${encodeURIComponent(source)}&token=${token}`;
  }

  // Settings endpoints
  async getSettings(): Promise<Settings> {
    const response = await this.client.get<{ settings: Settings }>('/settings');
    return response.data.settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    await this.client.put('/settings', settings);
  }

  async testPlexConnection(plexUrl?: string, plexToken?: string): Promise<boolean> {
    const response = await this.client.post<{ connected: boolean }>('/settings/test-connection', {
      plexUrl,
      plexToken,
    });
    return response.data.connected;
  }

  // Logs endpoints
  async getLogs(params: {
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ logs: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const response = await this.client.get('/logs', { params });
    return response.data;
  }
}

export const api = new ApiClient();
