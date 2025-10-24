import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { startDebate, initializeDebateState } from "../../services/debateStateService";
import { useDebateState } from "../../hooks/useDebateState";
import { useDebateTimer } from "../../hooks/useDebateTimer";
import { useAutoMute } from "../../hooks/useAutoMute";
import DebateTimer from "./DebateTimer";
import DeviceSettings from "./DeviceSettings";
import WaitlistPanel from "./WaitlistPanel";

const VideoDebateRoom = ({
  debateId,
  participants,
  currentUser,
  userProfile,
  debate,
}) => {
  const [joined, setJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micMuted, setMicMuted] = useState(false);
  const [manuallyMuted, setManuallyMuted] = useState(false); // Track manual muting
  const [cameraMuted, setCameraMuted] = useState(false);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  // Speaking detection
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState({});

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const videoContainerRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  const clientRef = useRef(null);
  const localVideoContainerRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  // Custom hooks for debate state management
  const debateState = useDebateState(debateId, participants, debate);
  const timeRemaining = useDebateTimer(debateId, debateState);

  const appId = process.env.REACT_APP_AGORA_APP_ID;

  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }

  const client = clientRef.current;

  const isDebater =
    participants.debater_a?.userId === currentUser?.uid ||
    participants.debater_b?.userId === currentUser?.uid;

  const isModerator = participants.moderator?.userId === currentUser?.uid;
  const isHost = debate?.hostId === currentUser?.uid;

  // Determine if current user should have moderator controls based on structure
  const hasModeratorControls =
    (debate?.structure === 'moderated' && isModerator) ||
    (debate?.structure === 'self-moderated' && isHost) ||
    (!debate?.structure && isModerator); // Fallback for debates without structure field

  // Moderators also get video/audio like debaters
  const needsMedia = isDebater || isModerator;

  // DEBUG: Log needsMedia calculation
  console.log('🔍 needsMedia calculation:', {
    needsMedia,
    isDebater,
    isModerator,
    currentUserId: currentUser?.uid,
    debater_a: participants.debater_a?.userId,
    debater_b: participants.debater_b?.userId,
    moderator: participants.moderator?.userId,
    participants: participants
  });

  const myRole =
    participants.debater_a?.userId === currentUser?.uid
      ? "debater_a"
      : participants.debater_b?.userId === currentUser?.uid
      ? "debater_b"
      : participants.moderator?.userId === currentUser?.uid
      ? "moderator"
      : null;

  const isMyTurn = debateState?.currentTurn === myRole;

  // Auto-mute/unmute based on turns
  useAutoMute(debateState, myRole, isMyTurn, localAudioTrack, micMuted, setMicMuted, manuallyMuted, setManuallyMuted);

  const handleStartDebate = async () => {
    if (debateState && !debateState.debateStarted) {
      await startDebate(debateId);
    }
  };

  const getDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const devices = await AgoraRTC.getDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      setCameras(videoDevices);
      setMicrophones(audioDevices);

      if (videoDevices.length > 0 && !selectedCamera)
        setSelectedCamera(videoDevices[0].deviceId);
      if (audioDevices.length > 0 && !selectedMicrophone)
        setSelectedMicrophone(audioDevices[0].deviceId);
    } catch (error) {
      setError("Please allow camera and microphone access.");
    }
  };

  useEffect(() => {
    if (needsMedia) getDevices();
  }, [needsMedia]);

  useEffect(() => {
    if (!client) return;

    client.enableAudioVolumeIndicator();

    const handleUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);

        // If audio track, try to play it (browsers may block without user interaction)
        if (mediaType === 'audio' && user.audioTrack) {
          try {
            await user.audioTrack.play();
          } catch (audioError) {
            setAudioBlocked(true);
          }
        }

        // Always update the user in state to ensure React re-renders with new tracks
        setRemoteUsers((prev) => {
          const filtered = prev.filter((u) => u.uid !== user.uid);
          return [...filtered, user];
        });
      } catch (error) {
        console.error("Error subscribing:", error);
      }
    };

    const handleUserLeft = (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      setRemoteSpeaking((prev) => {
        const newState = { ...prev };
        delete newState[user.uid];
        return newState;
      });
    };

    const handleVolumeIndicator = (volumes) => {
      volumes.forEach((volume) => {
        const isSpeaking = volume.level > 10;

        if (volume.uid === client.uid) {
          setLocalSpeaking(isSpeaking);
        } else {
          setRemoteSpeaking((prev) => ({
            ...prev,
            [volume.uid]: isSpeaking,
          }));
        }
      });
    };

    client.on("user-published", handleUserPublished);
    client.on("user-left", handleUserLeft);
    client.on("volume-indicator", handleVolumeIndicator);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-left", handleUserLeft);
      client.off("volume-indicator", handleVolumeIndicator);
    };
  }, [client]);

  const createTracks = async () => {
    let audioTrack = null;
    let videoTrack = null;

    // Try to create audio track
    try {
      const audioConfig = selectedMicrophone
        ? { microphoneId: selectedMicrophone }
        : {};
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack(audioConfig);
    } catch (error) {
      // Silent fail - will show error in UI
    }

    // Try to create video track
    try {
      const videoConfig = selectedCamera
        ? { cameraId: selectedCamera, encoderConfig: "720p_2" }
        : { encoderConfig: "720p_2" };
      videoTrack = await AgoraRTC.createCameraVideoTrack(videoConfig);
    } catch (error) {
      // Silent fail - will show error in UI
    }

    return { audioTrack, videoTrack };
  };

  const joinChannel = async () => {
    console.log('🟢 joinChannel called', {
      hasCurrentUser: !!currentUser,
      debateId,
      hasAppId: !!appId,
      joining,
      hasJoined: hasJoinedRef.current,
      needsMedia,
      isDebater,
      isModerator
    });

    if (!currentUser || !debateId || !appId || joining || hasJoinedRef.current) {
      console.log('❌ joinChannel blocked');
      return;
    }

    try {
      hasJoinedRef.current = true;
      setJoining(true);
      setError("");

      let audioTrack = null;
      let videoTrack = null;

      console.log('📹 About to create tracks, needsMedia:', needsMedia);

      if (needsMedia) {
        console.log('✅ needsMedia is TRUE, creating tracks...');
      const tracks = await createTracks();
      audioTrack = tracks.audioTrack;
      videoTrack = tracks.videoTrack;

      // Set tracks if they were created
      if (audioTrack) {
        setLocalAudioTrack(audioTrack);
        localAudioTrackRef.current = audioTrack;
      }
      if (videoTrack) {
        setLocalVideoTrack(videoTrack);
        localVideoTrackRef.current = videoTrack;
      if (localVideoContainerRef.current) {
      localVideoContainerRef.current.innerHTML = "";
      videoTrack.play(localVideoContainerRef.current);
      }
      }

      // Show a message if no camera/mic available
      if (!audioTrack && !videoTrack) {
      setError("No camera or microphone detected. You can still join, but others won't see or hear you.");
      } else if (!videoTrack) {
          setError("No camera detected. Others will see your profile picture.");
      } else if (!audioTrack) {
        setError("No microphone detected. Others can see you but not hear you.");
      }
    } else {
        console.log('⚠️ needsMedia is FALSE, skipping track creation (viewer mode)');
      }

      await client.join(appId, debateId, null, currentUser.uid);

      // Publish whatever tracks are available
      if (needsMedia) {
        const tracksToPublish = [];
        if (audioTrack && audioTrack.enabled) tracksToPublish.push(audioTrack);
        if (videoTrack && videoTrack.enabled) tracksToPublish.push(videoTrack);

        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
        }
      }

      setJoined(true);
      setJoining(false);
    } catch (err) {
      // Hide UID conflict errors from UI (log only)
      if (err.code === 'UID_CONFLICT' || err.message?.toLowerCase().includes('uid_conflict')) {
        console.error('Agora UID conflict error:', err);
      } else {
        setError(`Failed to join: ${err.message}`);
      }
      setJoining(false);
      hasJoinedRef.current = false;
    }
  };

  const leaveChannel = async () => {
    console.log('👋 leaveChannel called');
    try {
      // Stop and close local tracks
      if (localAudioTrack) {
        console.log('🔇 Stopping local audio track');
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
        localAudioTrackRef.current = null;
      }
      if (localVideoTrack) {
        console.log('📹 Stopping local video track');
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
        localVideoTrackRef.current = null;
      }

      // Stop all remote tracks
      remoteUsers.forEach(user => {
        if (user.audioTrack) user.audioTrack.stop();
        if (user.videoTrack) user.videoTrack.stop();
      });

      // Leave Agora channel
      if (client && joined) {
        console.log('🚪 Leaving Agora channel');
        await client.leave();
      }

      setJoined(false);
      setRemoteUsers([]);
      hasJoinedRef.current = false;
      console.log('✅ leaveChannel complete');
    } catch (err) {
      console.error("❌ Error leaving:", err);
    }
  };

  const switchCamera = async (deviceId) => {
    if (!localVideoTrack) return;
    try {
      await localVideoTrack.setDevice(deviceId);
      setSelectedCamera(deviceId);
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  };

  const switchMicrophone = async (deviceId) => {
    if (!localAudioTrack) return;
    try {
      await localAudioTrack.setDevice(deviceId);
      setSelectedMicrophone(deviceId);
    } catch (error) {
      console.error("Error switching microphone:", error);
    }
  };

  const toggleMic = async () => {
    if (localAudioTrack) {
      // Check if it's not my turn (debaters only)
      if ((myRole === 'debater_a' || myRole === 'debater_b') && !isMyTurn && debateState?.debateStarted) {
        // Don't allow unmuting if it's not your turn
        return;
      }

      const newState = !micMuted;
      await localAudioTrack.setEnabled(!newState);
      setMicMuted(newState);
      setManuallyMuted(newState); // Track that this was a manual action
    }
  };

  const toggleCamera = async () => {
    if (localVideoTrack) {
      const newState = !cameraMuted;
      await localVideoTrack.setEnabled(!newState);
      setCameraMuted(newState);
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if (videoContainerRef.current.webkitRequestFullscreen) {
        videoContainerRef.current.webkitRequestFullscreen();
      } else if (videoContainerRef.current.msRequestFullscreen) {
        videoContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const enableAudio = async () => {
    // Try to play all remote audio tracks
    for (const user of remoteUsers) {
      if (user.audioTrack) {
        try {
          await user.audioTrack.play();
          setAudioBlocked(false);
        } catch (error) {
          console.error('Failed to play audio:', error);
        }
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    if (localVideoTrack && localVideoContainerRef.current) {
      localVideoContainerRef.current.innerHTML = "";
      localVideoTrack.play(localVideoContainerRef.current);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    if (
      currentUser &&
      !joined &&
      !joining &&
      debateId &&
      !hasJoinedRef.current &&
      participants // Wait for participant data to load
    ) {
      console.log('⏰ Scheduling joinChannel in 1 second...');
      const timer = setTimeout(() => joinChannel(), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, debateId, participants]);

  // Auto-rejoin when user becomes a participant with media (debater or moderator)
  const prevNeedsMediaRef = useRef(needsMedia);
  useEffect(() => {
    const wasNeedingMedia = prevNeedsMediaRef.current;
    const isNowNeedingMedia = needsMedia;
    
    // If user just became a participant with media, rejoin to get proper tracks
    if (!wasNeedingMedia && isNowNeedingMedia && joined) {
      const rejoin = async () => {
        await leaveChannel();
        setTimeout(() => {
          hasJoinedRef.current = false;
          joinChannel();
        }, 1000);
      };
      rejoin();
    }
    
    prevNeedsMediaRef.current = needsMedia;
  }, [needsMedia, joined]);

  useEffect(() => {
    console.log('🎬 VideoDebateRoom mounted');

    return () => {
      console.log('🚪 VideoDebateRoom unmounting, cleaning up...', {
        hasJoinedRef: hasJoinedRef.current,
        hasLocalAudioRef: !!localAudioTrackRef.current,
        hasLocalVideoRef: !!localVideoTrackRef.current
      });

      // Use refs to avoid stale closure - always cleanup if we have tracks or joined
      if (hasJoinedRef.current || localAudioTrackRef.current || localVideoTrackRef.current) {
        console.log('📞 Cleaning up tracks and leaving channel');

        // Stop and close tracks using refs
        if (localAudioTrackRef.current) {
          console.log('🔇 Stopping audio track from ref');
          localAudioTrackRef.current.stop();
          localAudioTrackRef.current.close();
          localAudioTrackRef.current = null;
        }
        if (localVideoTrackRef.current) {
          console.log('📹 Stopping video track from ref');
          localVideoTrackRef.current.stop();
          localVideoTrackRef.current.close();
          localVideoTrackRef.current = null;
        }

        // Leave Agora channel
        if (hasJoinedRef.current && clientRef.current) {
          console.log('🚪 Leaving Agora channel from cleanup');
          clientRef.current.leave();
          hasJoinedRef.current = false;
        }

        console.log('✅ Cleanup complete');
      } else {
        console.log('⚠️ Nothing to clean up');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const containerId = `remote-video-${user.uid}`;
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = "";
          user.videoTrack.play(container);
        }
      }
    });
  }, [remoteUsers]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBorderStyle = (isSpeaking, isUserTurn) => {
    if (isSpeaking) {
      return {
        border: "5px solid #10b981",
        boxShadow:
          "0 0 40px rgba(16, 185, 129, 1), 0 0 80px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)",
      };
    }
    if (isUserTurn) {
      return {
        border: "5px solid #3b82f6",
        boxShadow: "0 0 40px rgba(59, 130, 246, 1), 0 0 80px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.2)",
      };
    }
    return {
      border: "2px solid rgba(100, 116, 139, 0.3)",
    };
  };

  if (!currentUser) {
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.6)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "48px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <p style={{ color: "#94a3b8", fontSize: "16px" }}>
          Login to join video chat
        </p>
      </div>
    );
  }

  return (
    <div
      ref={videoContainerRef}
      style={{
        background: "rgba(17, 24, 39, 0.6)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "22px" }}>📹</span>
            Live Video
          </h3>

          {/* Participants Connected Indicator */}
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "10px",
              fontSize: "13px",
              color: "#10b981",
              fontWeight: "700",
            }}
          >
            👥 {(needsMedia ? 1 : 0) + remoteUsers.length}/{participants.debater_a && participants.debater_b && participants.moderator ? 3 : participants.debater_a && participants.debater_b ? 2 : 0} Connected
          </div>

          {debateState &&
            debateState.debateStarted &&
            !debateState.debateEnded && (
              <DebateTimer
                timeRemaining={timeRemaining}
                isMyTurn={isMyTurn}
                turnNumber={debateState.turnNumber}
                maxTurns={debateState.maxTurns}
              />
            )}

          {/* Control Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Manual Init Button - if state doesn't exist but both debaters are here */}
            {!debateState &&
              participants.debater_a &&
              participants.debater_b &&
              debate && (
                <button
                  onClick={async () => {
                    try {
                      await initializeDebateState(
                        debateId,
                        debate.settings || { turnTime: 60, maxTurns: 10 }
                      );
                    } catch (error) {
                      console.error("Failed to create state:", error);
                    }
                  }}
                  style={{
                    padding: "10px 24px",
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "#fff",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
                  }}
                >
                  ⚡ Create State
                </button>
              )}

            {/* Start button - Only show to moderator, or host in self-moderated debates */}
            {debateState &&
              !debateState.debateStarted &&
              participants.debater_a &&
              participants.debater_b &&
              hasModeratorControls && (
                <button
                  onClick={handleStartDebate}
                  style={{
                    padding: "10px 24px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  🚀 Start Debate
                </button>
              )}

            {/* Reset button - Only show to moderator, or host in self-moderated debates */}
            {debateState && debateState.debateStarted && hasModeratorControls && (
              <button
                onClick={async () => {
                  const { updateDoc, doc } = await import("firebase/firestore");
                  const { db } = await import("../../services/firebase");
                  await updateDoc(doc(db, "debateStates", debateId), {
                    debateStarted: false,
                    debateEnded: false,
                    currentTurn: "debater_a",
                    turnNumber: 1,
                    timeRemaining: debateState.turnTime,
                  });
                }}
                style={{
                  padding: "8px 16px",
                  background: "rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "12px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  cursor: "pointer",
                }}
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* Rejoin button for debaters/moderators who are not connected */}
          {needsMedia && !joined && !joining && (
            <button
              onClick={async () => {
                console.log('🔄 Manual rejoin requested');
                hasJoinedRef.current = false;
                await joinChannel();
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
              }}
            >
              🔄 Rejoin Call
            </button>
          )}

          {needsMedia && localAudioTrack && (
            <>
              <button
                onClick={toggleMic}
                disabled={(myRole === 'debater_a' || myRole === 'debater_b') && !isMyTurn && debateState?.debateStarted}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  cursor: ((myRole === 'debater_a' || myRole === 'debater_b') && !isMyTurn && debateState?.debateStarted) ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  background: micMuted
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : ((myRole === 'debater_a' || myRole === 'debater_b') && !isMyTurn && debateState?.debateStarted)
                    ? "rgba(100, 116, 139, 0.3)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  opacity: ((myRole === 'debater_a' || myRole === 'debater_b') && !isMyTurn && debateState?.debateStarted) ? 0.5 : 1,
                  boxShadow: micMuted
                    ? "0 4px 15px rgba(239, 68, 68, 0.4)"
                    : "none",
                }}
              >
                {micMuted ? "🔇" : ((myRole === 'debater_a' || myRole === 'debater_b') && !isMyTurn && debateState?.debateStarted) ? "🔒🎤" : "🎤"}
              </button>
              <button
                onClick={toggleCamera}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: cameraMuted
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  boxShadow: cameraMuted
                    ? "0 4px 15px rgba(239, 68, 68, 0.4)"
                    : "none",
                }}
              >
                {cameraMuted ? "📹❌" : "📹"}
              </button>
              <button
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: showDeviceSettings
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              >
                ⚙️
              </button>
            </>
          )}

          {/* Expand/Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: isFullscreen
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
              color: "#fff",
            }}
          >
            {isFullscreen ? "⛶" : "⛶"}
          </button>
        </div>
      </div>

      {showDeviceSettings && isDebater && (
        <DeviceSettings
          cameras={cameras}
          microphones={microphones}
          selectedCamera={selectedCamera}
          selectedMicrophone={selectedMicrophone}
          switchCamera={switchCamera}
          switchMicrophone={switchMicrophone}
          localVideoTrack={localVideoTrack}
          localAudioTrack={localAudioTrack}
        />
      )}

      {error && (
        <div
          style={{
            margin: "20px 24px 0",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {error}
        </div>
      )}

      {audioBlocked && (
        <div
          style={{
            margin: "20px 24px 0",
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}
        >
          <div>
            <div style={{ color: "#fbbf24", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>
              🔇 Audio Blocked
            </div>
            <div style={{ color: "#fcd34d", fontSize: "13px" }}>
              Click the button to enable audio playback
            </div>
          </div>
          <button
            onClick={enableAudio}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
              whiteSpace: "nowrap"
            }}
          >
            🔊 Enable Audio
          </button>
        </div>
      )}

      <div style={{ padding: "24px" }}>
        {/* Show moderator video if they exist and have media */}
        {isModerator && needsMedia && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                maxWidth: "400px",
                margin: "0 auto",
                aspectRatio: "16/9",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                border: "2px solid rgba(147, 51, 234, 0.5)",
              }}
            >
              {localVideoTrack ? (
                <div
                  ref={localVideoContainerRef}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  }}
                >
                  <img
                    src={userProfile?.photoURL}
                    alt={userProfile?.username}
                    style={{
                      width: "40%",
                      height: "40%",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid rgba(147, 51, 234, 0.5)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  background: "rgba(147, 51, 234, 0.9)",
                  backdropFilter: "blur(10px)",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                👨‍⚖️ Moderator (You)
              </div>
            </div>
          </div>
        )}

        {(() => {
          // Build array of all participants that should appear in grid
          const gridParticipants = [];

          // Add local user if they're a participant (debater or moderator not shown at top)
          if (needsMedia && !isModerator) {
            const localRole = participants.debater_a?.userId === currentUser?.uid ? 'debater_a' :
                          participants.debater_b?.userId === currentUser?.uid ? 'debater_b' : null;
            if (localRole) {
              gridParticipants.push({
                userId: currentUser.uid,
                role: localRole,
                profileData: userProfile,
                sideDescription: participants[localRole]?.sideDescription,
                isLocal: true,
              });
            }
          }

          // Add remote participants from Firestore (source of truth)
          [
            { data: participants.debater_a, role: 'debater_a' },
            { data: participants.debater_b, role: 'debater_b' },
            { data: participants.moderator, role: 'moderator' },
          ].forEach(({ data, role }) => {
            if (data && data.userId !== currentUser?.uid && !(role === 'moderator' && isModerator)) {
              const agoraUser = remoteUsers.find(u => u.uid.toString() === data.userId);
              gridParticipants.push({
                userId: data.userId,
                role: role,
                profileData: data.profileData,
                sideDescription: data.sideDescription,
                isLocal: false,
                agoraUser: agoraUser || null,
              });
            }
          });

          const gridVideoCount = gridParticipants.length;

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  gridVideoCount === 1 ? "1fr" :
                  gridVideoCount === 2 ? "1fr 1fr" :
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {gridParticipants.map((participant) => {
                const isDebaterA = participant.role === 'debater_a';
                const isDebaterB = participant.role === 'debater_b';
                const isModeratorRole = participant.role === 'moderator';
                const speaking = participant.isLocal ? localSpeaking : remoteSpeaking[participant.agoraUser?.uid];
                const isTurn = debateState?.currentTurn === participant.role;

                return (
                  <div key={participant.userId}>
                    {/* Video Container */}
                    <div
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        overflow: "hidden",
                        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                        aspectRatio: "16/9",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                        transition: "all 0.3s ease",
                        ...getBorderStyle(speaking, isTurn),
                        ...(isModeratorRole && { border: "2px solid rgba(147, 51, 234, 0.5)" }),
                      }}
                    >
                      {participant.isLocal ? (
                        localVideoTrack ? (
                          <div ref={localVideoContainerRef} style={{ width: "100%", height: "100%" }} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {participant.profileData?.photoURL && participant.profileData.photoURL.length <= 2 ? (
                              <div style={{
                                width: "40%",
                                height: "40%",
                                borderRadius: "50%",
                                border: isDebaterA ? "4px solid rgba(59, 130, 246, 0.5)" : "4px solid rgba(239, 68, 68, 0.5)",
                                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "120px",
                                background: isDebaterA
                                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)"
                                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)"
                              }}>
                                {participant.profileData.photoURL}
                              </div>
                            ) : (
                              <img
                                src={participant.profileData?.photoURL || 'https://ui-avatars.com/api/?name=' + (participant.profileData?.username || 'User')}
                                alt={participant.profileData?.username}
                                style={{
                                  width: "40%",
                                  height: "40%",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: isDebaterA ? "4px solid rgba(59, 130, 246, 0.5)" : "4px solid rgba(239, 68, 68, 0.5)",
                                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                                }}
                              />
                            )}
                          </div>
                        )
                      ) : (
                        participant.agoraUser?.videoTrack ? (
                          <div id={`remote-video-${participant.userId}`} style={{ width: "100%", height: "100%" }} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {participant.profileData?.photoURL && participant.profileData.photoURL.length <= 2 ? (
                              <div style={{
                                width: "40%",
                                height: "40%",
                                borderRadius: "50%",
                                border: isModeratorRole
                                  ? "4px solid rgba(147, 51, 234, 0.5)"
                                  : isDebaterA
                                  ? "4px solid rgba(59, 130, 246, 0.5)"
                                  : "4px solid rgba(239, 68, 68, 0.5)",
                                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "120px",
                                background: isModeratorRole
                                  ? "linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.2) 100%)"
                                  : isDebaterA
                                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)"
                                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)"
                              }}>
                                {participant.profileData.photoURL}
                              </div>
                            ) : (
                              <img
                                src={participant.profileData?.photoURL || 'https://ui-avatars.com/api/?name=' + (participant.profileData?.username || 'User')}
                                alt={participant.profileData?.username}
                                style={{
                                  width: "40%",
                                  height: "40%",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: isModeratorRole
                                    ? "4px solid rgba(147, 51, 234, 0.5)"
                                    : isDebaterA
                                    ? "4px solid rgba(59, 130, 246, 0.5)"
                                    : "4px solid rgba(239, 68, 68, 0.5)",
                                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                                }}
                              />
                            )}
                          </div>
                        )
                      )}

                      {/* Turn Indicator Badge - Top Center */}
                      {isTurn && debateState?.debateStarted && !debateState?.debateEnded && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            padding: "10px 24px",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "15px",
                            fontWeight: "800",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            boxShadow: "0 4px 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.5)",
                            animation: "pulse 2s infinite",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase"
                          }}
                        >
                          <span style={{ fontSize: "18px" }}>🎤</span>
                          Your Turn
                        </div>
                      )}

                      {/* Name Tag Overlay */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          left: "12px",
                          background: speaking ? "rgba(16, 185, 129, 0.9)" : "rgba(0, 0, 0, 0.7)",
                          backdropFilter: "blur(10px)",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          border: speaking ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                          transition: "all 0.3s ease",
                          boxShadow: speaking ? "0 0 20px rgba(16, 185, 129, 0.8)" : "none"
                        }}
                      >
                        {speaking && (
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              background: "#fff",
                              borderRadius: "50%",
                              animation: "pulse 1s infinite",
                            }}
                          ></span>
                        )}
                        {participant.isLocal ? "You" : isModeratorRole ? "👨‍⚖️ Moderator" : "Opponent"}
                        {speaking && <span style={{ fontWeight: "800", marginLeft: "4px" }}>SPEAKING</span>}
                      </div>
                    </div>

                    {/* Debater Info Card */}
                    {(isDebaterA || isDebaterB) && (
                      <div
                        style={{
                          marginTop: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          padding: "16px",
                          background: isDebaterA
                            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)"
                            : "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)",
                          border: isDebaterA
                            ? "1px solid rgba(59, 130, 246, 0.3)"
                            : "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "16px",
                        }}
                      >
                        {participant.profileData?.photoURL && participant.profileData.photoURL.length <= 2 ? (
                          <div style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "16px",
                            border: isDebaterA
                              ? "3px solid rgba(59, 130, 246, 0.5)"
                              : "3px solid rgba(239, 68, 68, 0.5)",
                            boxShadow: isDebaterA
                              ? "0 4px 15px rgba(59, 130, 246, 0.3)"
                              : "0 4px 15px rgba(239, 68, 68, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "36px",
                            background: isDebaterA
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)"
                              : "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)"
                          }}>
                            {participant.profileData.photoURL}
                          </div>
                        ) : (
                          <img
                            src={participant.profileData?.photoURL || 'https://ui-avatars.com/api/?name=' + (participant.profileData?.username || 'User')}
                            alt={participant.profileData?.username}
                            style={{
                              width: "64px",
                              height: "64px",
                              borderRadius: "16px",
                              border: isDebaterA
                                ? "3px solid rgba(59, 130, 246, 0.5)"
                                : "3px solid rgba(239, 68, 68, 0.5)",
                              boxShadow: isDebaterA
                                ? "0 4px 15px rgba(59, 130, 246, 0.3)"
                                : "0 4px 15px rgba(239, 68, 68, 0.3)",
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "11px",
                              color: isDebaterA ? "#60a5fa" : "#f87171",
                              fontWeight: "800",
                              letterSpacing: "0.1em",
                              marginBottom: "4px",
                            }}
                          >
                            {isDebaterA ? "PRO" : "CON"}
                          </div>
                          <div
                            style={{
                              fontWeight: "700",
                              color: "#fff",
                              fontSize: "18px",
                              marginBottom: "4px",
                            }}
                          >
                            {participant.profileData?.username}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#94a3b8",
                              fontWeight: "500",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {participant.sideDescription}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Moderator Info Card */}
                    {isModeratorRole && (
                      <div
                        style={{
                          marginTop: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          padding: "16px",
                          background: "linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(126, 34, 206, 0.05) 100%)",
                          border: "1px solid rgba(147, 51, 234, 0.3)",
                          borderRadius: "16px",
                        }}
                      >
                        {participant.profileData?.photoURL && participant.profileData.photoURL.length <= 2 ? (
                          <div style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "16px",
                            border: "3px solid rgba(147, 51, 234, 0.5)",
                            boxShadow: "0 4px 15px rgba(147, 51, 234, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "36px",
                            background: "linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.2) 100%)"
                          }}>
                            {participant.profileData.photoURL}
                          </div>
                        ) : (
                          <img
                            src={participant.profileData?.photoURL || 'https://ui-avatars.com/api/?name=' + (participant.profileData?.username || 'User')}
                            alt={participant.profileData?.username}
                            style={{
                              width: "64px",
                              height: "64px",
                              borderRadius: "16px",
                              border: "3px solid rgba(147, 51, 234, 0.5)",
                              boxShadow: "0 4px 15px rgba(147, 51, 234, 0.3)",
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#a78bfa",
                              fontWeight: "800",
                              letterSpacing: "0.1em",
                              marginBottom: "4px",
                            }}
                          >
                            MODERATOR
                          </div>
                          <div
                            style={{
                              fontWeight: "700",
                              color: "#fff",
                              fontSize: "18px",
                              marginBottom: "4px",
                            }}
                          >
                            {participant.profileData?.username}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#94a3b8",
                              fontWeight: "500",
                            }}
                          >
                            Overseeing debate
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state - no participants */}
              {gridParticipants.length === 0 && !needsMedia && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)",
                    aspectRatio: "16/9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.3 }}>📹</div>
                    <p style={{ color: "#64748b", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                      Waiting for debaters...
                    </p>
                    <p style={{ color: "#475569", fontSize: "14px" }}>
                      You're watching as a viewer
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Moderator Control Panel - Visible based on debate structure */}
      {hasModeratorControls && debateState && debateState.debateStarted && !debateState.debateEnded && (
        <div style={{ padding: "0 24px 24px" }}>
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(126, 34, 206, 0.05) 100%)",
              border: "1px solid rgba(147, 51, 234, 0.3)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            {/* Control Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flex: 1,
              }}
            >
              <img
                src={userProfile?.photoURL}
                alt={userProfile?.username}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  border: "3px solid rgba(147, 51, 234, 0.5)",
                  boxShadow: "0 4px 15px rgba(147, 51, 234, 0.3)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#a78bfa",
                    fontWeight: "800",
                    letterSpacing: "0.1em",
                    marginBottom: "4px",
                  }}
                >
                  {debate?.structure === 'self-moderated' ? 'HOST CONTROLS' : 'MODERATOR CONTROLS'}
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    color: "#fff",
                    fontSize: "17px",
                    marginBottom: "2px",
                  }}
                >
                  {userProfile?.username}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "500",
                  }}
                >
                  {debateState?.paused
                    ? "⏸️ Debate Paused"
                    : debate?.structure === 'self-moderated'
                    ? "Moderating your debate"
                    : "Overseeing debate"}
                </div>
              </div>
            </div>

            {/* Moderator Controls */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Pause/Resume Button */}
              <button
                    onClick={async () => {
                      const { pauseDebate, resumeDebate } = await import(
                        "../../services/debateStateService"
                      );
                      if (debateState.paused) {
                        await resumeDebate(debateId);
                      } else {
                        // Pass the current time remaining when pausing
                        await pauseDebate(debateId, timeRemaining);
                      }
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      background: debateState.paused
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#fff",
                      boxShadow: debateState.paused
                        ? "0 4px 15px rgba(16, 185, 129, 0.4)"
                        : "0 4px 15px rgba(245, 158, 11, 0.4)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "translateY(0)")
                    }
                  >
                    {debateState.paused ? "▶️ Resume" : "⏸️ Pause"}
                  </button>

                  {/* Add Time Button */}
                  <button
                    onClick={async () => {
                      try {
                        const { addTime } = await import(
                          "../../services/debateStateService"
                        );
                        await addTime(debateId, 30);
                      } catch (error) {
                        console.error('Error adding time:', error);
                      }
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "translateY(0)")
                    }
                  >
                    ⏱️ +30s
                  </button>

                  {/* Skip Turn Button */}
                  <button
                    onClick={async () => {
                      const { switchTurn } = await import(
                        "../../services/debateStateService"
                      );
                      await switchTurn(debateId, debateState);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "translateY(0)")
                    }
                  >
                    ⏭️ Skip Turn
                  </button>

                  {/* End Debate Button */}
                  <button
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Are you sure you want to end this debate?"
                        )
                      ) {
                        const { endDebate } = await import(
                          "../../services/debateStateService"
                        );
                        await endDebate(debateId);
                      }
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      background:
                        "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "translateY(0)")
                    }
                  >
                    🛑 End Debate
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* Paused indicator for users without controls */}
      {!hasModeratorControls && debateState?.paused && debateState.debateStarted && !debateState.debateEnded && (
        <div style={{ padding: "0 24px 24px" }}>
          <div
            style={{
              padding: "16px 24px",
              background: "rgba(245, 158, 11, 0.2)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "12px",
              color: "#fbbf24",
              fontSize: "14px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "18px" }}>⏸️</span>
            Debate Paused by {debate?.structure === 'self-moderated' ? 'Host' : 'Moderator'}
          </div>
        </div>
      )}

      {/* Waitlist Panel - Only for self-moderated debates */}
      {debate?.structure === 'self-moderated' && (
        <div style={{ padding: '0 24px 24px' }}>
          <WaitlistPanel
            debateId={debateId}
            currentUser={currentUser}
            userProfile={userProfile}
            isHost={isHost}
            debaterB={participants.debater_b}
            debateStructure={debate?.structure}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default VideoDebateRoom;
