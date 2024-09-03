import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Navbar from '../component/Navbar';
import {
  Grid, Paper, Box, CardMedia, Typography, TextField, IconButton, Button,
  Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const socket = io('http://localhost:1000');

// Styled components here...
// Styled components
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  border: 'none',
}));

const Chatbox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  border: '1px solid #ddd',
  borderRadius: '10px',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  textAlign: 'left',
  padding: '0.9rem',
  borderBottom: '2px dashed black',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  width: '100%',
  height: '3rem',
}));

const ChatBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: '#fff',
}));

const ChatFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: '1px solid #ddd',
  display: 'flex',
  alignItems: 'center',
}));

const DescriptionItem = styled(Item)(({ theme }) => ({
  marginLeft: '1rem',
  marginRight: '1rem',
  padding: theme.spacing(2),
  backgroundColor: '#f9f9f9',
  borderRadius: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
}));

const ContentSection = styled(Box)(({ theme }) => ({
  flex: 1,
  paddingRight: theme.spacing(2),
  textAlign: 'left',
}));

const CounterSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(3),
  width: '20%',
}));

const IconText = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const Global = () => {
  const videoRef = useRef(null);
  const [peerConnections, setPeerConnections] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);

  const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],  // Stun server setup
  };

  useEffect(() => {
    const handleBroadcaster = () => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
          socket.emit('broadcaster');
        });
    };

    handleBroadcaster();

    socket.on('offer', (id, description) => {
      const peerConnection = new RTCPeerConnection(config);
      peerConnections[id] = peerConnection;

      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.setRemoteDescription(description).then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('answer', id, peerConnection.localDescription);
        });

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      setPeerConnections({ ...peerConnections, [id]: peerConnection });
    });

    socket.on('candidate', (id, candidate) => {
      const connection = peerConnections[id];
      if (connection) {
        connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('watcher', id => {
      const peerConnection = new RTCPeerConnection(config);
      peerConnections[id] = peerConnection;

      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.createOffer().then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
          socket.emit('offer', id, peerConnection.localDescription);
        });

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      setPeerConnections({ ...peerConnections, [id]: peerConnection });
    });

    socket.on('disconnectPeer', id => {
      if (peerConnections[id]) {
        peerConnections[id].close();
        const updatedConnections = { ...peerConnections };
        delete updatedConnections[id];
        setPeerConnections(updatedConnections);
      }
    });

    return () => {
      // Clean up event listeners
      socket.off('offer');
      socket.off('candidate');
      socket.off('watcher');
      socket.off('disconnectPeer');
    };
  }, [peerConnections]);

  const handlePlay = () => {
    setIsStreaming(true);
    socket.emit('broadcaster');
  };

  const handlePause = () => {
    setIsStreaming(false);
    // Close all peer connections when stopping the stream
    Object.values(peerConnections).forEach(pc => pc.close());
    setPeerConnections({});
  };

  return (
    <div>
      <Navbar />
      <Box sx={{ flexGrow: 1, marginTop: '2rem' }}>
        <Grid container spacing={2}>
          {/* Video Section */}
          <Grid item xs={8}>
            <Item sx={{ height: '30rem', marginLeft: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <CardMedia
                component="video"
                controls
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src=""
                alt="Sample Video"
                ref={videoRef}
              />
            </Item>
          </Grid>

          {/* Chatbox Section */}
          <Grid item xs={4}>
            <Chatbox>
              <ChatHeader>Chat</ChatHeader>
              <ChatBody>
                <Typography variant="body2">Chat messages will appear here.</Typography>
              </ChatBody>
              <ChatFooter>
                <TextField variant="outlined" fullWidth placeholder="Type a message" size="small" sx={{ marginRight: '0.5rem' }} />
                <IconButton color="primary">
                  <SendIcon />
                </IconButton>
              </ChatFooter>
            </Chatbox>
          </Grid>

          {/* Description Section */}
          <Grid item xs={12}>
            <DescriptionItem>
              <ContentSection>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField variant="outlined" size="small" sx={{ width: "70%" }} />
                  {/* Add state management for title and description if needed */}
                  <CheckIcon color="success" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <TextField variant="outlined" width="70%" multiline size="small" maxRows={1} sx={{ width: "70%" }} />
                  <IconButton>
                    <ExpandMoreIcon />
                  </IconButton>
                  <CheckIcon color="success" />
                </Box>
              </ContentSection>
              <CounterSection>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isStreaming ? (
                    <Button variant="contained" color="secondary" onClick={handlePause}>
                      Stop
                    </Button>
                  ) : (
                    <Button variant="contained" color="primary" onClick={handlePlay}>
                      Start
                    </Button>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton color="primary">
                    <ThumbUpIcon />
                  </IconButton>
                  <IconText>123</IconText>
                  <IconButton color="primary">
                    <ThumbDownIcon />
                  </IconButton>
                  <IconText>45</IconText>
                  <IconButton color="primary">
                    <VisibilityIcon />
                  </IconButton>
                  <IconText>678</IconText>
                </Box>
              </CounterSection>
            </DescriptionItem>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default Global;
