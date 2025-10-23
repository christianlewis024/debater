import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeratorControls from '../ModeratorControls';
import * as debateStateService from '../../../services/debateStateService';

// Mock the debate state service
vi.mock('../../../services/debateStateService');

describe('ModeratorControls', () => {
  beforeEach(() => {
    vi.mocked(debateStateService.pauseDebate).mockResolvedValue(undefined);
    vi.mocked(debateStateService.resumeDebate).mockResolvedValue(undefined);
    vi.mocked(debateStateService.addTime).mockResolvedValue(undefined);
    vi.mocked(debateStateService.switchTurn).mockResolvedValue(undefined);
  });

  const mockDebateState = {
    currentTurn: 'debater_a',
    turnNumber: 1,
    paused: false,
    debateStarted: true,
    debateEnded: false,
  };

  it('should render Pause button when debate is not paused', () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/Pause/i)).toBeInTheDocument();
  });

  it('should render Resume button when debate is paused', () => {
    const pausedState = { ...mockDebateState, paused: true };

    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={pausedState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/Resume/i)).toBeInTheDocument();
  });

  it('should render Add Time button', () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/\+30s/i)).toBeInTheDocument();
  });

  it('should render Skip Turn button', () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/Skip Turn/i)).toBeInTheDocument();
  });

  it('should call pauseDebate when Pause button is clicked', async () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={45}
      />
    );

    const pauseButton = screen.getByText(/Pause/i);
    fireEvent.click(pauseButton);

    expect(debateStateService.pauseDebate).toHaveBeenCalledWith('debate-1', 45);
  });

  it('should call resumeDebate when Resume button is clicked', async () => {
    const pausedState = { ...mockDebateState, paused: true };

    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={pausedState}
        timeRemaining={45}
      />
    );

    const resumeButton = screen.getByText(/Resume/i);
    fireEvent.click(resumeButton);

    expect(debateStateService.resumeDebate).toHaveBeenCalledWith('debate-1');
  });

  it('should call addTime with 30 seconds when Add Time button is clicked', async () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    const addTimeButton = screen.getByText(/\+30s/i);
    fireEvent.click(addTimeButton);

    expect(debateStateService.addTime).toHaveBeenCalledWith('debate-1', 30);
  });

  it('should call switchTurn when Skip Turn button is clicked', async () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    const skipButton = screen.getByText(/Skip Turn/i);
    fireEvent.click(skipButton);

    expect(debateStateService.switchTurn).toHaveBeenCalledWith('debate-1', mockDebateState);
  });

  it('should show pause emoji when not paused', () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/⏸️/)).toBeInTheDocument();
  });

  it('should show play emoji when paused', () => {
    const pausedState = { ...mockDebateState, paused: true };

    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={pausedState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/▶️/)).toBeInTheDocument();
  });

  it('should show timer emoji on Add Time button', () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/⏱️/)).toBeInTheDocument();
  });

  it('should show skip emoji on Skip Turn button', () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    expect(screen.getByText(/⏭️/)).toBeInTheDocument();
  });

  it('should render all three buttons', () => {
    const { container } = render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('should pass current timeRemaining to pauseDebate', async () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={23}
      />
    );

    const pauseButton = screen.getByText(/Pause/i);
    fireEvent.click(pauseButton);

    expect(debateStateService.pauseDebate).toHaveBeenCalledWith('debate-1', 23);
  });

  it('should handle rapid clicks without errors', async () => {
    render(
      <ModeratorControls
        debateId="debate-1"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    const addTimeButton = screen.getByText(/\+30s/i);

    // Click multiple times rapidly
    fireEvent.click(addTimeButton);
    fireEvent.click(addTimeButton);
    fireEvent.click(addTimeButton);

    expect(debateStateService.addTime).toHaveBeenCalled();
  });

  it('should work with different debate IDs', async () => {
    render(
      <ModeratorControls
        debateId="special-debate-123"
        debateState={mockDebateState}
        timeRemaining={60}
      />
    );

    const skipButton = screen.getByText(/Skip Turn/i);
    fireEvent.click(skipButton);

    expect(debateStateService.switchTurn).toHaveBeenCalledWith(
      'special-debate-123',
      mockDebateState
    );
  });
});
