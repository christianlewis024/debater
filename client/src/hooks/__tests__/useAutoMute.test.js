import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoMute } from '../useAutoMute';

describe('useAutoMute', () => {
  let mockLocalAudioTrack;
  let mockSetMicMuted;
  let mockSetManuallyMuted;

  beforeEach(() => {
    mockLocalAudioTrack = {
      setEnabled: vi.fn(),
    };
    mockSetMicMuted = vi.fn();
    mockSetManuallyMuted = vi.fn();
  });

  it('should unmute debater_a when it is their turn and not manually muted', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        true, // isMyTurn
        mockLocalAudioTrack,
        true, // micMuted
        mockSetMicMuted,
        false, // manuallyMuted
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).toHaveBeenCalledWith(true);
    expect(mockSetMicMuted).toHaveBeenCalledWith(false);
  });

  it('should mute debater_a when it is not their turn', () => {
    const debateState = {
      currentTurn: 'debater_b',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        false, // isMyTurn
        mockLocalAudioTrack,
        false, // micMuted
        mockSetMicMuted,
        false, // manuallyMuted
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).toHaveBeenCalledWith(false);
    expect(mockSetMicMuted).toHaveBeenCalledWith(true);
    expect(mockSetManuallyMuted).toHaveBeenCalledWith(false); // Clear manual flag
  });

  it('should unmute debater_b when it is their turn and not manually muted', () => {
    const debateState = {
      currentTurn: 'debater_b',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_b',
        true, // isMyTurn
        mockLocalAudioTrack,
        true, // micMuted
        mockSetMicMuted,
        false, // manuallyMuted
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).toHaveBeenCalledWith(true);
    expect(mockSetMicMuted).toHaveBeenCalledWith(false);
  });

  it('should mute debater_b when it is not their turn', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_b',
        false, // isMyTurn
        mockLocalAudioTrack,
        false, // micMuted
        mockSetMicMuted,
        false, // manuallyMuted
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).toHaveBeenCalledWith(false);
    expect(mockSetMicMuted).toHaveBeenCalledWith(true);
  });

  it('should not unmute debater when manually muted during their turn', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        true, // isMyTurn
        mockLocalAudioTrack,
        true, // micMuted
        mockSetMicMuted,
        true, // manuallyMuted - user chose to stay muted
        mockSetManuallyMuted
      )
    );

    // Should NOT unmute because user manually muted
    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should not affect moderator audio', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'moderator',
        false, // not relevant for moderator
        mockLocalAudioTrack,
        false,
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should not affect viewer audio', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        null, // viewer has no role
        false,
        mockLocalAudioTrack,
        false,
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should not change mute state if already in correct state (unmuted on turn)', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        true, // isMyTurn
        mockLocalAudioTrack,
        false, // already unmuted
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should not change mute state if already in correct state (muted off turn)', () => {
    const debateState = {
      currentTurn: 'debater_b',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        false, // not my turn
        mockLocalAudioTrack,
        true, // already muted
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should do nothing before debate starts', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: false,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        true,
        mockLocalAudioTrack,
        true,
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should do nothing after debate ends', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: true,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        true,
        mockLocalAudioTrack,
        true,
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should do nothing if debateState is null', () => {
    renderHook(() =>
      useAutoMute(
        null,
        'debater_a',
        true,
        mockLocalAudioTrack,
        true,
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should handle missing audio track gracefully', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    renderHook(() =>
      useAutoMute(
        debateState,
        'debater_a',
        true,
        null, // no audio track
        true,
        mockSetMicMuted,
        false,
        mockSetManuallyMuted
      )
    );

    // Should not throw error
    expect(mockSetMicMuted).not.toHaveBeenCalled();
  });

  it('should react to turn changes and clear manual mute flag', () => {
    const debateState = {
      currentTurn: 'debater_a',
      debateStarted: true,
      debateEnded: false,
    };

    const { rerender } = renderHook(
      ({ turn }) =>
        useAutoMute(
          { ...debateState, currentTurn: turn },
          'debater_a',
          turn === 'debater_a',
          mockLocalAudioTrack,
          false,
          mockSetMicMuted,
          false,
          mockSetManuallyMuted
        ),
      { initialProps: { turn: 'debater_a' } }
    );

    // Initially unmuted (on turn)
    expect(mockLocalAudioTrack.setEnabled).not.toHaveBeenCalled();

    // Change turn to debater_b
    rerender({ turn: 'debater_b' });

    // Should now mute and clear manual flag
    expect(mockLocalAudioTrack.setEnabled).toHaveBeenCalledWith(false);
    expect(mockSetMicMuted).toHaveBeenCalledWith(true);
    expect(mockSetManuallyMuted).toHaveBeenCalledWith(false);
  });
});
