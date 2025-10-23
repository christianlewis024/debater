import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDebateTimer } from '../useDebateTimer';
import * as debateStateService from '../../services/debateStateService';

// Mock the debate state service
vi.mock('../../services/debateStateService');

describe('useDebateTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(debateStateService.switchTurn).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with 60 seconds by default', () => {
    const { result } = renderHook(() =>
      useDebateTimer('debate-1', null)
    );

    expect(result.current).toBe(60);
  });

  it('should update time from debate state when debate starts', () => {
    const debateState = {
      timeRemaining: 90,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: false,
      turnTime: 90,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    expect(result.current).toBe(90);
  });

  it('should count down every second when debate is active', async () => {
    const debateState = {
      timeRemaining: 60,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: false,
      turnTime: 60,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    expect(result.current).toBe(60);

    // Advance time by 1 second and run timers
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe(59);

    // Advance another second
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe(58);
  });

  it('should not count down when debate has not started', async () => {
    const debateState = {
      timeRemaining: 60,
      turnNumber: 1,
      debateStarted: false,
      debateEnded: false,
      paused: false,
      turnTime: 60,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    expect(result.current).toBe(60);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(60);
  });

  it('should not count down when debate is paused', async () => {
    const debateState = {
      timeRemaining: 60,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: true,
      turnTime: 60,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    expect(result.current).toBe(60);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(60);
  });

  it('should not count down when debate has ended', async () => {
    const debateState = {
      timeRemaining: 60,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: true,
      paused: false,
      turnTime: 60,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    expect(result.current).toBe(60);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(60);
  });

  it('should call switchTurn when time reaches 0', async () => {
    const debateState = {
      timeRemaining: 2,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: false,
      turnTime: 60,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    expect(result.current).toBe(2);

    // Advance to 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe(1);

    // Advance to 0 seconds
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(debateStateService.switchTurn).toHaveBeenCalledWith('debate-1', debateState);
  });

  it('should reset to turnTime when switching turns', async () => {
    const debateState = {
      timeRemaining: 1,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: false,
      turnTime: 90,
    };

    const { result } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    // Advance to 0
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe(90); // Should reset to turnTime
  });

  it('should update timeRemaining when turnNumber changes', () => {
    const { result, rerender } = renderHook(
      ({ debateState }) => useDebateTimer('debate-1', debateState),
      {
        initialProps: {
          debateState: {
            timeRemaining: 60,
            turnNumber: 1,
            debateStarted: true,
            debateEnded: false,
            paused: false,
            turnTime: 60,
          },
        },
      }
    );

    expect(result.current).toBe(60);

    // Simulate turn change
    rerender({
      debateState: {
        timeRemaining: 90,
        turnNumber: 2,
        debateStarted: true,
        debateEnded: false,
        paused: false,
        turnTime: 90,
      },
    });

    expect(result.current).toBe(90);
  });

  it('should clean up interval on unmount', () => {
    const debateState = {
      timeRemaining: 60,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: false,
      turnTime: 60,
    };

    const { unmount } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    unmount();

    // Timer should not continue after unmount
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(debateStateService.switchTurn).not.toHaveBeenCalled();
  });

  it('should resume countdown when debate is unpaused', async () => {
    const { result, rerender } = renderHook(
      ({ debateState }) => useDebateTimer('debate-1', debateState),
      {
        initialProps: {
          debateState: {
            timeRemaining: 60,
            turnNumber: 1,
            debateStarted: true,
            debateEnded: false,
            paused: true,
            turnTime: 60,
          },
        },
      }
    );

    expect(result.current).toBe(60);

    // Time should not change while paused
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(60);

    // Unpause
    rerender({
      debateState: {
        timeRemaining: 60,
        turnNumber: 1,
        debateStarted: true,
        debateEnded: false,
        paused: false,
        turnTime: 60,
      },
    });

    // Now it should count down
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe(59);
  });

  it('should not create multiple intervals', async () => {
    const debateState = {
      timeRemaining: 60,
      turnNumber: 1,
      debateStarted: true,
      debateEnded: false,
      paused: false,
      turnTime: 60,
    };

    const { result, rerender } = renderHook(() =>
      useDebateTimer('debate-1', debateState)
    );

    // Trigger re-render
    rerender();

    // Advance timer
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe(59); // Should only decrease by 1, not multiple times
  });
});
