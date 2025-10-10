import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  subscribeToDebateState,
  switchTurn,
  startDebate,
  initializeDebateState,
} from "../../services/debateStateService";

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
  const [cameraMuted, setCameraMuted] = useState(false);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  // Speaking detection
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState({});

  // Turn-based state
  const [debateState, setDebateState] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60);

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
  const timerIntervalRef = useRef(null);

  const appId = process.env.REACT_APP_AGORA_APP_ID;

  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }

  const client = clientRef.current;

  const isDebater =
    participants.debater_a?.userId === currentUser?.uid ||
    participants.debater_b?.userId === currentUser?.uid;

  const isModerator = participants.moderator?.userId === currentUser?.uid;

  // Moderators also get video/audio like debaters
  const needsMedia = isDebater || isModerator;

  const myRole =
    participants.debater_a?.userId === currentUser?.uid
      ? "debater_a"
      : participants.debater_b?.userId === currentUser?.uid
      ? "debater_b"
      : participants.moderator?.userId === currentUser?.uid
      ? "moderator"
      : null;

  const isMyTurn = debateState?.currentTurn === myRole;

  // Subscribe to debate state
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToDebateState(debateId, (state) => {
      setDebateState(state);
      // Only update timeRemaining if it's a new turn or debate just started
      if (state && state.timeRemaining && 
          (!debateState || 
           state.turnNumber !== debateState.turnNumber || 
           (!debateState.debateStarted && state.debateStarted))) {
        setTimeRemaining(state.timeRemaining);
      }
    });

    return () => unsubscribe();
  }, [debateId]);

  // Initialize debate state when both debaters join
  useEffect(() => {
    const initDebateState = async () => {
      if (
        participants.debater_a &&
        participants.debater_b &&
        debate?.settings
      ) {
        console.log("Initializing debate state...", {
          debateId,
          settings: debate.settings,
        });
        try {
          await initializeDebateState(debateId, debate.settings);
          console.log("Debate state initialized!");
        } catch (error) {
          console.error("Error initializing debate state:", error);
        }
      } else {
        console.log("Cannot initialize - missing:", {
          hasDebaterA: !!participants.debater_a,
          hasDebaterB: !!participants.debater_b,
          hasDebate: !!debate,
          hasSettings: !!debate?.settings,
        });
      }
    };
    initDebateState();
  }, [participants.debater_a, participants.debater_b, debate, debateId]);

  // Timer countdown
  useEffect(() => {
    if (
      !debateState ||
      !debateState.debateStarted ||
      debateState.debateEnded ||
      debateState.paused
    ) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Only start timer if not already running
    if (!timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            switchTurn(debateId, debateState);
            return debateState.turnTime;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [debateState?.debateStarted, debateState?.debateEnded, debateState?.paused, debateId]);

  // Auto-mute/unmute based on turns
  useEffect(() => {
    if (!debateState || !debateState.debateStarted || debateState.debateEnded) {
      return;
    }

    // Only control audio for debaters, not moderators or viewers
    if (myRole === 'debater_a' || myRole === 'debater_b') {
      if (isMyTurn) {
        // It's my turn - unmute if I was muted by the system
        if (micMuted && localAudioTrack) {
          localAudioTrack.setEnabled(true);
          setMicMuted(false);
          console.log('🎤 Auto-unmuted: Your turn to speak');
        }
      } else {
        // Not my turn - mute
        if (!micMuted && localAudioTrack) {
          localAudioTrack.setEnabled(false);
          setMicMuted(true);
          console.log('🔇 Auto-muted: Waiting for your turn');
        }
      }
    }
    // Moderators and viewers are never auto-muted - they can speak freely
  }, [debateState?.currentTurn, isMyTurn, myRole, localAudioTrack]);

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
        console.log('📡 Remote user published:', { uid: user.uid, mediaType });
        await client.subscribe(user, mediaType);
        
        // If audio track, try to play it (browsers may block without user interaction)
        if (mediaType === 'audio' && user.audioTrack) {
          console.log('🔊 Attempting to play remote audio from uid:', user.uid);
          try {
            await user.audioTrack.play();
            console.log('✅ Audio playing successfully from uid:', user.uid);
          } catch (audioError) {
            console.log('⚠️ Audio autoplay blocked:', audioError.message);
            setAudioBlocked(true);
          }
        }
        
        // Always update the user in state to ensure React re-renders with new tracks
        setRemoteUsers((prev) => {
          const filtered = prev.filter((u) => u.uid !== user.uid);
          const updated = [...filtered, user];
          console.log('👥 Updated remote users, total count:', updated.length, 'UIDs:', updated.map(u => u.uid));
          return updated;
        });
        
        console.log('✅ Subscribed to', mediaType, 'from user', user.uid);
      } catch (error) {
        console.error("❌ Error subscribing:", error);
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
      console.log('Could not create audio track:', error);
    }

    // Try to create video track
    try {
      const videoConfig = selectedCamera
        ? { cameraId: selectedCamera, encoderConfig: "720p_2" }
        : { encoderConfig: "720p_2" };
      videoTrack = await AgoraRTC.createCameraVideoTrack(videoConfig);
    } catch (error) {
      console.log('Could not create video track:', error);
    }

    return { audioTrack, videoTrack };
  };

  const joinChannel = async () => {
    if (!currentUser || !debateId || !appId || joining || hasJoinedRef.current)
      return;

    try {
      hasJoinedRef.current = true;
      setJoining(true);
      setError("");

      let audioTrack = null;
      let videoTrack = null;

      if (needsMedia) {
      const tracks = await createTracks();
      audioTrack = tracks.audioTrack;
      videoTrack = tracks.videoTrack;

      // Set tracks if they were created
      if (audioTrack) setLocalAudioTrack(audioTrack);
      if (videoTrack) {
        setLocalVideoTrack(videoTrack);
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
    }

      await client.join(appId, debateId, null, currentUser.uid);

      // Publish whatever tracks are available
      if (needsMedia) {
        const tracksToPublish = [];
        if (audioTrack && audioTrack.enabled) {
          tracksToPublish.push(audioTrack);
          console.log('🎤 Publishing audio track');
        } else if (audioTrack) {
          console.log('⚠️ Audio track disabled, not publishing');
        } else {
          console.log('⚠️ No audio track to publish');
        }
        if (videoTrack && videoTrack.enabled) {
          tracksToPublish.push(videoTrack);
          console.log('📹 Publishing video track');
        } else if (videoTrack) {
          console.log('⚠️ Video track disabled, not publishing');
        } else {
          console.log('⚠️ No video track to publish');
        }
        
        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
          console.log('✅ Successfully published', tracksToPublish.length, 'track(s)');
        } else {
          console.log('⚠️ No tracks to publish');
        }
      }

      setJoined(true);
      setJoining(false);
    } catch (err) {
      setError(`Failed to join: ${err.message}`);
      setJoining(false);
      hasJoinedRef.current = false;
    }
  };

  const leaveChannel = async () => {
    try {
      console.log('👋 Leaving Agora channel and cleaning up tracks...');
      
      // Stop and close local tracks
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      
      // Stop all remote tracks
      remoteUsers.forEach(user => {
        if (user.audioTrack) user.audioTrack.stop();
        if (user.videoTrack) user.videoTrack.stop();
      });
      
      // Leave Agora channel
      if (client && joined) {
        await client.leave();
      }

      setJoined(false);
      setRemoteUsers([]);
      hasJoinedRef.current = false;
      
      console.log('✅ Successfully left channel and cleaned up');
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
      !hasJoinedRef.current
    ) {
      const timer = setTimeout(() => joinChannel(), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, debateId]);

  // Auto-rejoin when user becomes a participant with media (debater or moderator)
  const prevNeedsMediaRef = useRef(needsMedia);
  useEffect(() => {
    const wasNeedingMedia = prevNeedsMediaRef.current;
    const isNowNeedingMedia = needsMedia;
    
    // If user just became a participant with media, rejoin to get proper tracks
    if (!wasNeedingMedia && isNowNeedingMedia && joined) {
      console.log('🔄 User became participant with media - rejoining with video/audio...');
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
    return () => {
      if (joined || hasJoinedRef.current) leaveChannel();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

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
        border: "3px solid #10b981",
        boxShadow:
          "0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)",
      };
    }
    if (isUserTurn) {
      return {
        border: "3px solid #3b82f6",
        boxShadow: "0 4px 20px rgba(59, 130, 246, 0.5)",
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    background: isMyTurn
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(100, 116, 139, 0.2)",
                    borderRadius: "10px",
                    border: `1px solid ${
                      isMyTurn
                        ? "rgba(16, 185, 129, 0.4)"
                        : "rgba(100, 116, 139, 0.3)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {isMyTurn ? "🎤" : "👂"}
                  </span>
                  <span
                    style={{
                      color: isMyTurn ? "#10b981" : "#94a3b8",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    {isMyTurn ? "Your Turn" : "Their Turn"}
                  </span>
                </div>

                <div
                  style={{
                    padding: "8px 20px",
                    background:
                      timeRemaining <= 10
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(59, 130, 246, 0.2)",
                    borderRadius: "10px",
                    border: `1px solid ${
                      timeRemaining <= 10
                        ? "rgba(239, 68, 68, 0.4)"
                        : "rgba(59, 130, 246, 0.4)"
                    }`,
                    fontWeight: "800",
                    fontSize: "18px",
                    color: timeRemaining <= 10 ? "#ef4444" : "#60a5fa",
                    fontFamily: "monospace",
                  }}
                >
                  {formatTime(timeRemaining)}
                </div>

                <div
                  style={{
                    padding: "6px 12px",
                    background: "rgba(147, 51, 234, 0.2)",
                    borderRadius: "8px",
                    border: "1px solid rgba(147, 51, 234, 0.3)",
                    fontSize: "12px",
                    color: "#a78bfa",
                    fontWeight: "600",
                  }}
                >
                  Turn {debateState.turnNumber}/{debateState.maxTurns}
                </div>
              </div>
            )}

          {/* Debug and Control Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Console log for debugging - not visible to users */}
            {console.log("Debate State:", {
              hasDebateState: !!debateState,
              debateStarted: debateState?.debateStarted,
              hasDebaterA: !!participants.debater_a,
              hasDebaterB: !!participants.debater_b,
            })}

            {/* Manual Init Button - if state doesn't exist but both debaters are here */}
            {!debateState &&
              participants.debater_a &&
              participants.debater_b &&
              debate && (
                <button
                  onClick={async () => {
                    console.log("Manual init clicked");
                    try {
                      await initializeDebateState(
                        debateId,
                        debate.settings || { turnTime: 60, maxTurns: 10 }
                      );
                      console.log("State created!");
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

            {/* Start button */}
            {debateState &&
              !debateState.debateStarted &&
              participants.debater_a &&
              participants.debater_b && (
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

            {/* Reset button */}
            {debateState && debateState.debateStarted && isDebater && (
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
        <div
          style={{
            padding: "24px",
            background: "rgba(31, 41, 55, 0.5)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "grid", gap: "16px" }}>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: (() => {
              // Calculate how many videos to show in grid
              const gridVideoCount = needsMedia && !isModerator ? 1 + remoteUsers.length : remoteUsers.length;
              console.log('📊 Grid calculation:', {
                needsMedia,
                isModerator,
                remoteUsersCount: remoteUsers.length,
                remoteUserUIDs: remoteUsers.map(u => u.uid),
                gridVideoCount,
                gridLayout: gridVideoCount === 1 ? "1fr" : gridVideoCount === 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(300px, 1fr))"
              });
              if (gridVideoCount === 1) return "1fr";
              if (gridVideoCount === 2) return "1fr 1fr";
              return "repeat(auto-fit, minmax(300px, 1fr))";
            })(),
            gap: "20px",
          }}
        >
          {needsMedia && (
            <div>
              <div
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background:
                    "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  aspectRatio: "16/9",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                  transition: "all 0.3s ease",
                  ...getBorderStyle(localSpeaking, isMyTurn),
                }}
              >
                {localVideoTrack ? (
                  <div
                    ref={localVideoContainerRef}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  // Show profile picture if no video
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
                        border: "4px solid rgba(59, 130, 246, 0.5)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                      }}
                    />
                  </div>
                )}
                {localVideoTrack && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(10px)",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {localSpeaking && (
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          background: "#10b981",
                          borderRadius: "50%",
                          animation: "pulse 1s infinite",
                        }}
                      ></span>
                    )}
                    You
                  </div>
                )}
                {!localVideoTrack && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      background:
                        "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    }}
                  >
                    <img
                      src={userProfile?.photoURL}
                      alt={userProfile?.username}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid rgba(59, 130, 246, 0.5)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                        marginBottom: "16px",
                      }}
                    />
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {joining ? "Connecting..." : "No camera detected"}
                    </p>
                  </div>
                )}
              </div>
              {/* Only show card for actual debaters in the video grid */}
              {myRole && myRole !== 'moderator' &&
                (myRole === "debater_a"
                  ? participants.debater_a
                  : participants.debater_b) && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px",
                      background:
                        myRole === "debater_a"
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)"
                          : "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)",
                      border:
                        myRole === "debater_a"
                          ? "1px solid rgba(59, 130, 246, 0.3)"
                          : "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "16px",
                    }}
                  >
                    <img
                      src={
                        (myRole === "debater_a"
                          ? participants.debater_a
                          : participants.debater_b
                        ).profileData?.photoURL
                      }
                      alt={
                        (myRole === "debater_a"
                          ? participants.debater_a
                          : participants.debater_b
                        ).profileData?.username
                      }
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "16px",
                        border:
                          myRole === "debater_a"
                            ? "3px solid rgba(59, 130, 246, 0.5)"
                            : "3px solid rgba(239, 68, 68, 0.5)",
                        boxShadow:
                          myRole === "debater_a"
                            ? "0 4px 15px rgba(59, 130, 246, 0.3)"
                            : "0 4px 15px rgba(239, 68, 68, 0.3)",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: myRole === "debater_a" ? "#60a5fa" : "#f87171",
                          fontWeight: "800",
                          letterSpacing: "0.1em",
                          marginBottom: "4px",
                        }}
                      >
                        {myRole === "debater_a" ? "PRO" : "CON"}
                      </div>
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#fff",
                          fontSize: "18px",
                          marginBottom: "4px",
                        }}
                      >
                        {userProfile?.username}
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
                        {
                          (myRole === "debater_a"
                            ? participants.debater_a
                            : participants.debater_b
                          ).sideDescription
                        }
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => {
              // Find which participant this remote user is
              const isDebaterA =
                participants.debater_a?.userId === user.uid.toString();
              const isDebaterB =
                participants.debater_b?.userId === user.uid.toString();
              const isModerator =
                participants.moderator?.userId === user.uid.toString();
              
              const remoteParticipant = isDebaterA
                ? participants.debater_a
                : isDebaterB
                ? participants.debater_b
                : isModerator
                ? participants.moderator
                : null;

              return (
                <div key={user.uid}>
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "16px",
                      overflow: "hidden",
                      background:
                        "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      aspectRatio: "16/9",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                      transition: "all 0.3s ease",
                      ...getBorderStyle(remoteSpeaking[user.uid], !isMyTurn),
                      border: isModerator 
                        ? "2px solid rgba(147, 51, 234, 0.5)" 
                        : getBorderStyle(remoteSpeaking[user.uid], !isMyTurn).border,
                    }}
                  >
                    {user.videoTrack ? (
                      <div
                        id={`remote-video-${user.uid}`}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      // Show profile picture if no video
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
                          src={remoteParticipant?.profileData?.photoURL}
                          alt={remoteParticipant?.profileData?.username}
                          style={{
                            width: "40%",
                            height: "40%",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: isModerator
                              ? "4px solid rgba(147, 51, 234, 0.5)"
                              : isDebaterA
                              ? "4px solid rgba(59, 130, 246, 0.5)"
                              : "4px solid rgba(239, 68, 68, 0.5)",
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
                        background: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(10px)",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {remoteSpeaking[user.uid] && (
                      <span
                      style={{
                      width: "8px",
                      height: "8px",
                      background: "#10b981",
                      borderRadius: "50%",
                      animation: "pulse 1s infinite",
                      }}
                      ></span>
                      )}
                      {isModerator ? "👨‍⚖️ Moderator" : "Opponent"}
                    </div>
                  </div>
                  {/* Remote Participant Info Card */}
                  {remoteParticipant && (isDebaterA || isDebaterB) && (
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
                      <img
                        src={remoteParticipant.profileData?.photoURL}
                        alt={remoteParticipant.profileData?.username}
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
                          {remoteParticipant.profileData?.username}
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
                          {remoteParticipant.sideDescription}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Moderator Info Card */}
                  {remoteParticipant && isModerator && (
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
                      <img
                        src={remoteParticipant.profileData?.photoURL}
                        alt={remoteParticipant.profileData?.username}
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "16px",
                          border: "3px solid rgba(147, 51, 234, 0.5)",
                          boxShadow: "0 4px 15px rgba(147, 51, 234, 0.3)",
                        }}
                      />
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
                          {remoteParticipant.profileData?.username}
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
            })
          ) : needsMedia && localVideoTrack ? (
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)",
                aspectRatio: "16/9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "64px",
                    marginBottom: "16px",
                    opacity: 0.3,
                  }}
                >
                  ⏳
                </div>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  Waiting for opponent...
                </p>
              </div>
            </div>
          ) : null}

          {!needsMedia && remoteUsers.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)",
                aspectRatio: "16/9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "80px",
                    marginBottom: "20px",
                    opacity: 0.3,
                  }}
                >
                  📹
                </div>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "18px",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  Waiting for debaters...
                </p>
                <p style={{ color: "#475569", fontSize: "14px" }}>
                  You're watching as a viewer
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moderator Control Panel - Only visible to the moderator */}
      {isModerator && participants.moderator && (
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
            {/* Moderator Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flex: 1,
              }}
            >
              <img
                src={participants.moderator.profileData?.photoURL}
                alt={participants.moderator.profileData?.username}
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
                  MODERATOR
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    color: "#fff",
                    fontSize: "17px",
                    marginBottom: "2px",
                  }}
                >
                  {participants.moderator.profileData?.username}
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
                    : "Overseeing debate"}
                </div>
              </div>
            </div>

            {/* Moderator Controls - Only visible to moderator */}
            {isModerator &&
              debateState &&
              debateState.debateStarted &&
              !debateState.debateEnded && (
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
                      const { addTime } = await import(
                        "../../services/debateStateService"
                      );
                      await addTime(debateId, 30);
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
              )}

            {/* Status indicator for non-moderators */}
            {!isModerator && debateState?.paused && (
              <div
                style={{
                  padding: "10px 20px",
                  background: "rgba(245, 158, 11, 0.2)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "10px",
                  color: "#fbbf24",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>⏸️</span>
                Paused by Moderator
              </div>
            )}
          </div>
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
