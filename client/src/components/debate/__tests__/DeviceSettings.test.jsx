import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeviceSettings from '../DeviceSettings';

describe('DeviceSettings', () => {
  const mockCameras = [
    { deviceId: 'camera1', label: 'Front Camera' },
    { deviceId: 'camera2', label: 'Back Camera' },
  ];

  const mockMicrophones = [
    { deviceId: 'mic1', label: 'Built-in Microphone' },
    { deviceId: 'mic2', label: 'External Microphone' },
  ];

  const mockSwitchCamera = vi.fn();
  const mockSwitchMicrophone = vi.fn();

  it('should render camera label', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    expect(screen.getByText('Camera')).toBeInTheDocument();
  });

  it('should render microphone label', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    expect(screen.getByText('Microphone')).toBeInTheDocument();
  });

  it('should render all camera options', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    expect(screen.getByText('Front Camera')).toBeInTheDocument();
    expect(screen.getByText('Back Camera')).toBeInTheDocument();
  });

  it('should render all microphone options', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    expect(screen.getByText('Built-in Microphone')).toBeInTheDocument();
    expect(screen.getByText('External Microphone')).toBeInTheDocument();
  });

  it('should show selected camera', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera2"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const cameraSelect = screen.getAllByRole('combobox')[0];
    expect(cameraSelect).toHaveValue('camera2');
  });

  it('should show selected microphone', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic2"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const micSelect = screen.getAllByRole('combobox')[1];
    expect(micSelect).toHaveValue('mic2');
  });

  it('should call switchCamera when camera selection changes', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const cameraSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(cameraSelect, { target: { value: 'camera2' } });

    expect(mockSwitchCamera).toHaveBeenCalledWith('camera2');
  });

  it('should call switchMicrophone when microphone selection changes', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const micSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(micSelect, { target: { value: 'mic2' } });

    expect(mockSwitchMicrophone).toHaveBeenCalledWith('mic2');
  });

  it('should disable camera dropdown when no video track', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={false}
        localAudioTrack={true}
      />
    );

    const cameraSelect = screen.getAllByRole('combobox')[0];
    expect(cameraSelect).toBeDisabled();
  });

  it('should disable microphone dropdown when no audio track', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={false}
      />
    );

    const micSelect = screen.getAllByRole('combobox')[1];
    expect(micSelect).toBeDisabled();
  });

  it('should enable camera dropdown when video track exists', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const cameraSelect = screen.getAllByRole('combobox')[0];
    expect(cameraSelect).not.toBeDisabled();
  });

  it('should enable microphone dropdown when audio track exists', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={mockMicrophones}
        selectedCamera="camera1"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const micSelect = screen.getAllByRole('combobox')[1];
    expect(micSelect).not.toBeDisabled();
  });

  it('should show fallback camera name when label is empty', () => {
    const camerasWithoutLabels = [
      { deviceId: 'camera12345678', label: '' },
    ];

    render(
      <DeviceSettings
        cameras={camerasWithoutLabels}
        microphones={mockMicrophones}
        selectedCamera="camera12345678"
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    expect(screen.getByText('Camera camera12')).toBeInTheDocument();
  });

  it('should show fallback microphone name when label is empty', () => {
    const micsWithoutLabels = [
      { deviceId: 'mic12345678', label: '' },
    ];

    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={micsWithoutLabels}
        selectedCamera="camera1"
        selectedMicrophone="mic12345678"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    expect(screen.getByText('Microphone mic12345')).toBeInTheDocument();
  });

  it('should handle empty cameras array', () => {
    render(
      <DeviceSettings
        cameras={[]}
        microphones={mockMicrophones}
        selectedCamera=""
        selectedMicrophone="mic1"
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const cameraSelect = screen.getAllByRole('combobox')[0];
    expect(cameraSelect.children.length).toBe(0);
  });

  it('should handle empty microphones array', () => {
    render(
      <DeviceSettings
        cameras={mockCameras}
        microphones={[]}
        selectedCamera="camera1"
        selectedMicrophone=""
        switchCamera={mockSwitchCamera}
        switchMicrophone={mockSwitchMicrophone}
        localVideoTrack={true}
        localAudioTrack={true}
      />
    );

    const micSelect = screen.getAllByRole('combobox')[1];
    expect(micSelect.children.length).toBe(0);
  });
});
