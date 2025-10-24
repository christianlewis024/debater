import { useState, useEffect, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

/**
 * Custom hook for managing media devices (cameras and microphones)
 * @param {boolean} needsMedia - Whether the user needs media devices
 * @returns {Object} Device management state and functions
 */
export const useMediaDevices = (needsMedia) => {
  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');

  /**
   * Fetch available cameras and microphones
   */
  const getDevices = useCallback(async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const devices = await AgoraRTC.getDevices();

      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');

      setCameras(videoDevices);
      setMicrophones(audioDevices);

      // Auto-select first devices if not already selected
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }

      if (audioDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  }, [selectedCamera, selectedMicrophone]);

  /**
   * Switch to a different camera
   * @param {string} deviceId - Camera device ID
   * @param {Object} localVideoTrack - Current video track to update
   */
  const switchCamera = useCallback(async (deviceId, localVideoTrack) => {
    if (!localVideoTrack) return;

    try {
      await localVideoTrack.setDevice(deviceId);
      setSelectedCamera(deviceId);
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }, []);

  /**
   * Switch to a different microphone
   * @param {string} deviceId - Microphone device ID
   * @param {Object} localAudioTrack - Current audio track to update
   */
  const switchMicrophone = useCallback(async (deviceId, localAudioTrack) => {
    if (!localAudioTrack) return;

    try {
      await localAudioTrack.setDevice(deviceId);
      setSelectedMicrophone(deviceId);
    } catch (error) {
      console.error('Error switching microphone:', error);
    }
  }, []);

  // Fetch devices when component mounts or needsMedia changes
  useEffect(() => {
    if (needsMedia) {
      getDevices();
    }
  }, [needsMedia, getDevices]);

  return {
    cameras,
    microphones,
    selectedCamera,
    selectedMicrophone,
    setSelectedCamera,
    setSelectedMicrophone,
    switchCamera,
    switchMicrophone,
    getDevices
  };
};
