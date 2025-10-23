import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
});

// Mock Agora RTC SDK globally
vi.mock('agora-rtc-sdk-ng', () => {
  const createMockTrack = (kind) => ({
    setEnabled: vi.fn(),
    close: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    getMediaStreamTrack: vi.fn(() => ({
      kind,
      enabled: true,
    })),
    on: vi.fn(),
    off: vi.fn(),
  });

  const createMockClient = () => ({
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    unpublish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    remoteUsers: [],
    enableAudioVolumeIndicator: vi.fn(),
    setClientRole: vi.fn().mockResolvedValue(undefined),
  });

  return {
    default: {
      createClient: vi.fn(() => createMockClient()),
      createCameraVideoTrack: vi.fn(() => Promise.resolve(createMockTrack('video'))),
      createMicrophoneAudioTrack: vi.fn(() => Promise.resolve(createMockTrack('audio'))),
      createScreenVideoTrack: vi.fn(() => Promise.resolve(createMockTrack('video'))),
      getCameras: vi.fn(() => Promise.resolve([
        { deviceId: 'camera1', label: 'Camera 1' },
      ])),
      getMicrophones: vi.fn(() => Promise.resolve([
        { deviceId: 'mic1', label: 'Microphone 1' },
      ])),
    },
  };
});

// Mock Firebase services
vi.mock('../services/firebase', () => {
  const mockFirestore = {
    collection: vi.fn(() => mockFirestore),
    doc: vi.fn(() => mockFirestore),
    get: vi.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({}),
    })),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe function
  };

  const mockAuth = {
    currentUser: { uid: 'test-user-id', email: 'test@example.com' },
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockAuth.currentUser })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockAuth.currentUser })),
    signOut: vi.fn(() => Promise.resolve()),
    onAuthStateChanged: vi.fn((callback) => {
      callback(mockAuth.currentUser);
      return vi.fn(); // Unsubscribe function
    }),
  };

  return {
    db: mockFirestore,
    auth: mockAuth,
    rtdb: {
      ref: vi.fn(() => ({
        on: vi.fn(),
        off: vi.fn(),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
      })),
    },
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};
