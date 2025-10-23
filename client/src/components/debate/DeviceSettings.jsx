import React from 'react';

/**
 * DeviceSettings component - Camera and Microphone selection dropdowns
 * @param {array} cameras - Available camera devices
 * @param {array} microphones - Available microphone devices
 * @param {string} selectedCamera - Currently selected camera deviceId
 * @param {string} selectedMicrophone - Currently selected microphone deviceId
 * @param {function} switchCamera - Callback to switch camera
 * @param {function} switchMicrophone - Callback to switch microphone
 * @param {boolean} localVideoTrack - Whether local video track exists
 * @param {boolean} localAudioTrack - Whether local audio track exists
 */
const DeviceSettings = ({
  cameras,
  microphones,
  selectedCamera,
  selectedMicrophone,
  switchCamera,
  switchMicrophone,
  localVideoTrack,
  localAudioTrack,
}) => {
  return (
    <div
      style={{
        padding: "24px",
        background: "rgba(31, 41, 55, 0.5)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div style={{ display: "grid", gap: "16px" }}>
        {/* Camera Selection */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#e2e8f0",
              marginBottom: "8px",
            }}
          >
            Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => switchCamera(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(17, 24, 39, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            disabled={!localVideoTrack}
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Microphone Selection */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#e2e8f0",
              marginBottom: "8px",
            }}
          >
            Microphone
          </label>
          <select
            value={selectedMicrophone}
            onChange={(e) => switchMicrophone(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(17, 24, 39, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            disabled={!localAudioTrack}
          >
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DeviceSettings;
