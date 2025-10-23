import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DebateTimer from '../DebateTimer';

describe('DebateTimer', () => {
  it('should render time in MM:SS format', () => {
    render(
      <DebateTimer
        timeRemaining={125}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('should render 0:00 when time is 0', () => {
    render(
      <DebateTimer
        timeRemaining={0}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('should pad seconds with leading zero', () => {
    render(
      <DebateTimer
        timeRemaining={65}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('should show "Your Turn" when isMyTurn is true', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('Your Turn')).toBeInTheDocument();
  });

  it('should show "Their Turn" when isMyTurn is false', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={false}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('Their Turn')).toBeInTheDocument();
  });

  it('should show microphone emoji when it is my turn', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('🎤')).toBeInTheDocument();
  });

  it('should show ear emoji when it is their turn', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={false}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('👂')).toBeInTheDocument();
  });

  it('should display correct turn number and max turns', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={true}
        turnNumber={3}
        maxTurns={10}
      />
    );

    expect(screen.getByText('Turn 3/10')).toBeInTheDocument();
  });

  it('should display turn 1/5 correctly', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={5}
      />
    );

    expect(screen.getByText('Turn 1/5')).toBeInTheDocument();
  });

  it('should apply warning styles when time is low (10 seconds)', () => {
    const { container } = render(
      <DebateTimer
        timeRemaining={10}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    // Check for red color in time display
    const timeElement = screen.getByText('0:10');
    expect(timeElement).toHaveStyle({ color: '#ef4444' });
  });

  it('should apply warning styles when time is very low (5 seconds)', () => {
    const { container } = render(
      <DebateTimer
        timeRemaining={5}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    const timeElement = screen.getByText('0:05');
    expect(timeElement).toHaveStyle({ color: '#ef4444' });
  });

  it('should apply normal styles when time is above 10 seconds', () => {
    render(
      <DebateTimer
        timeRemaining={30}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    const timeElement = screen.getByText('0:30');
    expect(timeElement).toHaveStyle({ color: '#60a5fa' });
  });

  it('should render all three sections (turn status, time, turn counter)', () => {
    render(
      <DebateTimer
        timeRemaining={60}
        isMyTurn={true}
        turnNumber={2}
        maxTurns={10}
      />
    );

    expect(screen.getByText('Your Turn')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('Turn 2/10')).toBeInTheDocument();
  });

  it('should handle large time values correctly', () => {
    render(
      <DebateTimer
        timeRemaining={599}
        isMyTurn={true}
        turnNumber={1}
        maxTurns={10}
      />
    );

    expect(screen.getByText('9:59')).toBeInTheDocument();
  });

  it('should handle final turn correctly', () => {
    render(
      <DebateTimer
        timeRemaining={30}
        isMyTurn={true}
        turnNumber={10}
        maxTurns={10}
      />
    );

    expect(screen.getByText('Turn 10/10')).toBeInTheDocument();
  });
});
