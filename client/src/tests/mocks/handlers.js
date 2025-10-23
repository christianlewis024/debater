import { http, HttpResponse } from 'msw';

/**
 * MSW Request Handlers
 * Mock API responses for testing
 */

const FIREBASE_PROJECT_ID = 'debater-test';

export const handlers = [
  // Mock Firebase Firestore REST API
  http.post(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:batchGet`, () => {
    return HttpResponse.json({
      found: [
        {
          name: `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/debates/test-debate-1`,
          fields: {
            title: { stringValue: 'Test Debate' },
            category: { stringValue: 'technology' },
            status: { stringValue: 'active' },
            hostId: { stringValue: 'test-user-id' },
          },
          createTime: '2025-10-23T00:00:00.000000Z',
          updateTime: '2025-10-23T00:00:00.000000Z',
        },
      ],
    });
  }),

  // Mock Firebase Auth REST API
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
    return HttpResponse.json({
      idToken: 'mock-id-token',
      email: 'test@example.com',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
      localId: 'test-user-id',
    });
  }),

  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signUp', () => {
    return HttpResponse.json({
      idToken: 'mock-id-token',
      email: 'test@example.com',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
      localId: 'test-user-id',
    });
  }),

  // Mock Agora token generation (if you have a backend endpoint)
  http.get('/api/agora/token', () => {
    return HttpResponse.json({
      token: 'mock-agora-token',
      channel: 'test-channel',
      uid: 12345,
    });
  }),
];
