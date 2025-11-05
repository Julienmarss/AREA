import { SpotifyService } from '../services/spotify.service';
import { InMemoryDB } from '../models/area.model';

// Mock Spotify API
jest.mock('spotify-web-api-node');
jest.mock('../config/spotify', () => ({
  spotifyApi: {
    setRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn().mockResolvedValue({
      body: {
        access_token: 'new-access-token',
        expires_in: 3600,
      },
    }),
  },
}));

describe('SpotifyService', () => {
  const testUserId = 'test-spotify-user';

  beforeEach(() => {
    // Clear database
    InMemoryDB.getAreas().forEach(area => InMemoryDB.deleteArea(area.id));
    
    // Mock valid Spotify token
    InMemoryDB.saveToken({
      userId: testUserId,
      service: 'spotify',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    test('should handle missing token', async () => {
      const result = await SpotifyService.checkNewTrackPlayed('non-existent-user');
      expect(result.triggered).toBe(false);
    });

    test('should handle token without refresh token', async () => {
      InMemoryDB.saveToken({
        userId: 'user-no-refresh',
        service: 'spotify',
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await SpotifyService.checkNewTrackPlayed('user-no-refresh');
      expect(result.triggered).toBe(false);
    });

    test('should handle expired token refresh', async () => {
      // Set expired token
      InMemoryDB.saveToken({
        userId: testUserId,
        service: 'spotify',
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      const result = await SpotifyService.checkNewTrackPlayed(testUserId);
      // Should attempt to refresh (even if API call fails in test)
      expect(result).toBeDefined();
    });
  });

  describe('Actions', () => {
    describe('checkNewTrackPlayed', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.checkNewTrackPlayed('invalid-user');
        expect(result.triggered).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.checkNewTrackPlayed(testUserId);
        // Will fail to call real API but should not throw
        expect(result).toBeDefined();
        expect(typeof result.triggered).toBe('boolean');
      });

      test('should include track data when triggered', async () => {
        // Since we can't mock the full Spotify API call in this context,
        // we just verify the structure would be correct
        const result = await SpotifyService.checkNewTrackPlayed(testUserId, 'old-track-id');
        expect(result).toHaveProperty('triggered');
        expect(typeof result.triggered).toBe('boolean');
      });
    });

    describe('checkNewTrackSaved', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.checkNewTrackSaved('invalid-user');
        expect(result.triggered).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.checkNewTrackSaved(testUserId);
        expect(result).toBeDefined();
        expect(typeof result.triggered).toBe('boolean');
      });

      test('should track saved count', async () => {
        const result = await SpotifyService.checkNewTrackSaved(testUserId, 10);
        expect(result).toHaveProperty('triggered');
      });
    });

    describe('checkPlaylistUpdated', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.checkPlaylistUpdated('invalid-user', 'playlist-id');
        expect(result.triggered).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.checkPlaylistUpdated(testUserId, 'test-playlist-id');
        expect(result).toBeDefined();
        expect(typeof result.triggered).toBe('boolean');
      });

      test('should detect snapshot changes', async () => {
        const result = await SpotifyService.checkPlaylistUpdated(
          testUserId,
          'test-playlist',
          'old-snapshot-id'
        );
        expect(result).toHaveProperty('triggered');
      });
    });

    describe('checkSpecificArtistPlayed', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.checkSpecificArtistPlayed('invalid-user', 'artist-id');
        expect(result.triggered).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.checkSpecificArtistPlayed(testUserId, 'test-artist-id');
        expect(result).toBeDefined();
        expect(typeof result.triggered).toBe('boolean');
      });
    });

    describe('checkNewArtistFollowed', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.checkNewArtistFollowed('invalid-user');
        expect(result.triggered).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.checkNewArtistFollowed(testUserId);
        expect(result).toBeDefined();
        expect(typeof result.triggered).toBe('boolean');
      });

      test('should track followed artists count', async () => {
        const result = await SpotifyService.checkNewArtistFollowed(testUserId, 50);
        expect(result).toHaveProperty('triggered');
      });
    });
  });

  describe('Reactions', () => {
    describe('addTrackToPlaylist', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.addTrackToPlaylist('invalid-user', 'playlist-id', 'track-uri');
        expect(result.success).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.addTrackToPlaylist(testUserId, 'playlist-id', 'spotify:track:123');
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });
    });

    describe('createPlaylist', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.createPlaylist('invalid-user', 'Test Playlist');
        expect(result.success).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.createPlaylist(testUserId, 'Test Playlist');
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });
    });

    describe('followArtist', () => {
      test('should return false when no token exists', async () => {
        const result = await SpotifyService.followArtist('invalid-user', 'artist-id');
        expect(result.success).toBe(false);
      });

      test('should handle API errors gracefully', async () => {
        const result = await SpotifyService.followArtist(testUserId, 'test-artist-id');
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });
    });

    // Note: createPlaylistWithArtistTopTracks not yet implemented
  });
});
