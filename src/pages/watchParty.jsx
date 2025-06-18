import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/Settings';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

// Create a dark theme for the video player
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f44336',
    },
    secondary: {
      main: '#3ea6ff',
    },
    background: {
      default: '#0f0f0f',
      paper: '#1f1f1f',
    },
  },
});

const YouTubeWatchParty = () => {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default video
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [roomId, setRoomId] = useState('watch-party-123');
  
  // WebRTC states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const videoPlayerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Simulate socket connection for sync
  useEffect(() => {
    console.log('Setting up connection for room:', roomId);
    
    return () => {
      console.log('Disconnecting from room:', roomId);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId, localStream]);

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef]);

  // Initialize WebRTC peer connection
  const initializePeerConnection = () => {
    const configuration = { 
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
    };
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStream);
      });
    }
    
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Remote track received:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };
    
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        // In a real app: sendToSignalingServer({ type: 'ice-candidate', candidate: event.candidate });
      }
    };
    
    console.log('Peer connection initialized');
  };

  // Toggle camera on/off
  const toggleCamera = async () => {
    try {
      if (isCameraOn) {
        // Turn off camera
        if (localStream) {
          localStream.getVideoTracks().forEach(track => track.stop());
          setLocalStream(prevStream => {
            const audioTracks = prevStream ? prevStream.getAudioTracks() : [];
            const newStream = new MediaStream(audioTracks);
            return audioTracks.length > 0 ? newStream : null;
          });
        }
        setIsCameraOn(false);
      } else {
        // Turn on camera
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (localStream) {
          const combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...localStream.getAudioTracks()
          ]);
          setLocalStream(combinedStream);
        } else {
          setLocalStream(videoStream);
        }
        setIsCameraOn(true);
        
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        initializePeerConnection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Toggle microphone on/off
  const toggleMic = async () => {
    try {
      if (isMicOn) {
        // Turn off microphone
        if (localStream) {
          localStream.getAudioTracks().forEach(track => track.stop());
          setLocalStream(prevStream => {
            const videoTracks = prevStream ? prevStream.getVideoTracks() : [];
            const newStream = new MediaStream(videoTracks);
            return videoTracks.length > 0 ? newStream : null;
          });
        }
        setIsMicOn(false);
      } else {
        // Turn on microphone
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localStream) {
          const combinedStream = new MediaStream([
            ...localStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
          ]);
          setLocalStream(combinedStream);
        } else {
          setLocalStream(audioStream);
        }
        setIsMicOn(true);
        
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        initializePeerConnection();
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localStream) {
          localStream.getVideoTracks().forEach(track => {
            if (track.label.includes('screen')) {
              track.stop();
            }
          });
          
          if (isCameraOn) {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const combinedStream = new MediaStream([
              ...videoStream.getVideoTracks(),
              ...localStream.getAudioTracks()
            ]);
            setLocalStream(combinedStream);
          } else {
            setLocalStream(prev => {
              const audioTracks = prev ? prev.getAudioTracks() : [];
              return audioTracks.length > 0 ? new MediaStream(audioTracks) : null;
            });
          }
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        if (localStream) {
          localStream.getVideoTracks().forEach(track => track.stop());
          
          const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...localStream.getAudioTracks()
          ]);
          setLocalStream(combinedStream);
        } else {
          setLocalStream(screenStream);
        }
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          toggleScreenShare(); // This will handle cleanup
        };
        
        setIsScreenSharing(true);
        setIsCameraOn(false);
        
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        initializePeerConnection();
      }
    } catch (error) {
      console.error('Error with screen sharing:', error);
    }
  };

  // Handle starting the call (offering WebRTC connection)
  const startCall = async () => {
    if (!peerConnectionRef.current) {
      initializePeerConnection();
    }
    
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('Created offer:', offer);
      // In a real app: sendToSignalingServer({ type: 'offer', offer });
      
      // For demo purposes, immediately "receive" an answer
      simulateReceiveAnswer();
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Simulate receiving an answer (for demo purposes)
  const simulateReceiveAnswer = async () => {
    setTimeout(async () => {
      try {
        const fakeAnswer = {
          type: 'answer',
          sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:fake\r\na=ice-pwd:fakepassword\r\na=ice-options:trickle\r\na=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:toffset\r\na=recvonly\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtcp-fb:96 ccm fir\r\n'
        };
        
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(fakeAnswer));
        console.log('Remote description set successfully');
        
        const fakeRemoteStream = new MediaStream();
        setRemoteStream(fakeRemoteStream);
        
        if (typeof MediaStreamTrack !== 'undefined') {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#555';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#fff';
          ctx.font = '24px Arial';
          ctx.fillText('Friend\'s Camera', canvas.width/2 - 80, canvas.height/2);
          
          const stream = canvas.captureStream(30);
          if (stream.getVideoTracks().length > 0) {
            fakeRemoteStream.addTrack(stream.getVideoTracks()[0]);
          }
        }
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }, 1000);
  };

  // Handle video URL submission
  const handleVideoSubmit = (e) => {
    e.preventDefault();
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      setVideoId(videoIdMatch[1]);
      console.log('Video changed to:', videoIdMatch[1]);
    }
    setVideoUrl('');
  };

  // Handle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    console.log('Playback toggled:', !isPlaying);
  };

  // Handle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle video seek/time update
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
    console.log('Time updated:', time);
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Copy room link to clipboard
  const shareRoomLink = () => {
    const link = `https://yourwatchparty.com/room/${roomId}`;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  // Component for the YouTube iframe
  const YouTubePlayer = () => (
    <Box ref={videoPlayerRef} sx={{ position: 'relative', paddingTop: '56.25%', width: '100%', bgcolor: 'black' }}>
      <iframe
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&start=${Math.floor(currentTime)}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube Watch Party"
      />
    </Box>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              YouTube Watch Party
            </Typography>
            <IconButton color="inherit" onClick={shareRoomLink} title="Share room link">
              <ShareIcon />
            </IconButton>
            <IconButton color="inherit" title="Settings">
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2, display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* YouTube Video Player */}
              <Paper elevation={3} sx={{ mb: 2, overflow: 'hidden' }}>
                <YouTubePlayer />
                
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={togglePlayback} color="primary">
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <IconButton onClick={toggleMute}>
                      {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>
                    <Box sx={{ flexGrow: 1, mx: 2 }}>
                      <Typography variant="body2">{formatTime(currentTime)}</Typography>
                    </Box>
                    <Typography variant="body2">Room: {roomId}</Typography>
                  </Box>
                  
                  <form onSubmit={handleVideoSubmit} style={{ display: 'flex' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Paste YouTube URL here"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      variant="outlined"
                    />
                    <Button type="submit" variant="contained" color="primary" sx={{ ml: 1 }}>
                      Load
                    </Button>
                  </form>
                </Box>
              </Paper>
              
              {/* Video Chat Section */}
              <Paper elevation={3} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Video Chat</Typography>
                  <Box>
                    <IconButton 
                      color={isCameraOn ? "primary" : "default"} 
                      onClick={toggleCamera}
                      title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                    >
                      {isCameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                    </IconButton>
                    <IconButton 
                      color={isMicOn ? "primary" : "default"} 
                      onClick={toggleMic}
                      title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
                    >
                      {isMicOn ? <MicIcon /> : <MicOffIcon />}
                    </IconButton>
                    <IconButton 
                      color={isScreenSharing ? "primary" : "default"} 
                      onClick={toggleScreenShare}
                      title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                    >
                      {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    </IconButton>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={startCall}
                      disabled={remoteStream !== null}
                      sx={{ ml: 1 }}
                    >
                      {remoteStream ? "Connected" : "Start Video Chat"}
                    </Button>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  {/* Local Video */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%', bgcolor: 'black', borderRadius: 1 }}>
                      <Typography 
                        sx={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          display: !localStream ? 'block' : 'none'
                        }}
                      >
                        Your camera is off
                      </Typography>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                          display: localStream ? 'block' : 'none'
                        }}
                      />
                      <Typography
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          color: 'white',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        You
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Remote Video */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%', bgcolor: 'black', borderRadius: 1 }}>
                      <Typography 
                        sx={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          display: !remoteStream ? 'block' : 'none'
                        }}
                      >
                        Waiting for Friend to join...
                      </Typography>
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                          display: remoteStream ? 'block' : 'none'
                        }}
                      />
                      <Typography
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          color: 'white',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        Friend
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default YouTubeWatchParty;