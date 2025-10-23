import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebateState } from '../useDebateState';
import * as debateStateService from '../../services/debateStateService';

// Mock the debate state service
vi.mock('../../services/debateStateService');

describe('useDebateState', () => {
  let mockUnsubscribe;
  let mockCallback;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockCallback = null;

    // Mock subscribeToDebateState to capture callback and return unsubscribe function
    vi.mocked(debateStateService.subscribeToDebateState).mockImplementation((id, callback) => {
      mockCallback = callback;
      return mockUnsubscribe;
    });

    vi.mocked(debateStateService.initializeDebateState).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null initially', () => {
    const { result } = renderHook(() =>
      useDebateState('debate-1', {}, {})
    );

    expect(result.current).toBeNull();
  });

  it('should subscribe to debate state on mount', () => {
    renderHook(() =>
      useDebateState('debate-1', {}, {})
    );

    expect(debateStateService.subscribeToDebateState).toHaveBeenCalledWith(
      'debate-1',
      expect.any(Function)
    );
  });

  it('should not subscribe if debateId is missing', () => {
    renderHook(() =>
      useDebateState(null, {}, {})
    );

    expect(debateStateService.subscribeToDebateState).not.toHaveBeenCalled();
  });

  it('should update state when subscription callback is called', async () => {
    const { result } = renderHook(() =>
      useDebateState('debate-1', {}, {})
    );

    const mockDebateState = {
      currentTurn: 'debater_a',
      turnNumber: 1,
      timeRemaining: 60,
      debateStarted: true,
      debateEnded: false,
    };

    // Simulate Firestore update
    mockCallback(mockDebateState);

    await waitFor(() => {
      expect(result.current).toEqual(mockDebateState);
    });
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() =>
      useDebateState('debate-1', {}, {})
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should initialize debate state when both debaters join', async () => {
    const participants = {
      debater_a: { userId: 'user-1' },
      debater_b: { userId: 'user-2' },
    };
    const debate = {
      settings: {
        turnTime: 90,
        maxTurns: 5,
      },
    };

    renderHook(() =>
      useDebateState('debate-1', participants, debate)
    );

    await waitFor(() => {
      expect(debateStateService.initializeDebateState).toHaveBeenCalledWith(
        'debate-1',
        debate.settings
      );
    });
  });

  it('should not initialize if debater_a is missing', () => {
    const participants = {
      debater_b: { userId: 'user-2' },
    };
    const debate = {
      settings: { turnTime: 90, maxTurns: 5 },
    };

    renderHook(() =>
      useDebateState('debate-1', participants, debate)
    );

    expect(debateStateService.initializeDebateState).not.toHaveBeenCalled();
  });

  it('should not initialize if debater_b is missing', () => {
    const participants = {
      debater_a: { userId: 'user-1' },
    };
    const debate = {
      settings: { turnTime: 90, maxTurns: 5 },
    };

    renderHook(() =>
      useDebateState('debate-1', participants, debate)
    );

    expect(debateStateService.initializeDebateState).not.toHaveBeenCalled();
  });

  it('should not initialize if debate settings are missing', () => {
    const participants = {
      debater_a: { userId: 'user-1' },
      debater_b: { userId: 'user-2' },
    };
    const debate = {}; // No settings

    renderHook(() =>
      useDebateState('debate-1', participants, debate)
    );

    expect(debateStateService.initializeDebateState).not.toHaveBeenCalled();
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(debateStateService.initializeDebateState).mockRejectedValue(
      new Error('Initialization failed')
    );

    const participants = {
      debater_a: { userId: 'user-1' },
      debater_b: { userId: 'user-2' },
    };
    const debate = {
      settings: { turnTime: 90, maxTurns: 5 },
    };

    renderHook(() =>
      useDebateState('debate-1', participants, debate)
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error initializing debate state:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should resubscribe when debateId changes', () => {
    const { rerender } = renderHook(
      ({ debateId }) => useDebateState(debateId, {}, {}),
      { initialProps: { debateId: 'debate-1' } }
    );

    expect(debateStateService.subscribeToDebateState).toHaveBeenCalledWith(
      'debate-1',
      expect.any(Function)
    );

    // Change debate ID
    rerender({ debateId: 'debate-2' });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(debateStateService.subscribeToDebateState).toHaveBeenCalledWith(
      'debate-2',
      expect.any(Function)
    );
  });
});
