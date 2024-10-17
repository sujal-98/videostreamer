import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Navbar from '../component/Navbar';
import {
  Grid, Paper, Box, CardMedia, Typography, TextField, IconButton, List, ListItem, ListItemText, Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from 'axios';

const socket = io('http://localhost:1000');

// Styled components
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  border: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.1)',
  },
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

const ChatBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#f0f0f0',
  height: '30rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '1rem',
}));

const Global = () => {
  const videoRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false); // Track editing state
  const [title, setTitle] = useState('Stream Title'); // Default title
  const [description, setDescription] = useState('Stream description goes here.'); // Default description
  const [tempTitle, setTempTitle] = useState(title); // Temp state for editing
  const [tempDescription, setTempDescription] = useState(description); // Temp state for editing

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // WebRTC connection
  const [transport, setTransport] = useState(null);
  const [stream, setStream] = useState(null);
  const [streamStarted, setStreamStarted] = useState(false);

  function generateRoomID(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomID = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      roomID += characters[randomIndex];
    }
  
    return roomID;
  }
  
  useEffect(() => {
    const initWebRTC = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    console.log("local stream: ",localStream)
    setStream(localStream)
    videoRef.current.srcObject = stream;
  }

  initWebRTC();
}, []);

  const handleStreamToggle = async () => {
    if (streamStarted) {
      if (videoRef.current) {
        videoRef.current.close();
        videoRef.current = null;
        setStreamStarted(false);
      }
    } else {
      if (videoRef.current) {
        const room=generateRoomID();
        socket.emit('join-room', room, title, description);
        // Use transport to send media track to the server
        socket.emit('create-transport', (data) => {
          console.log('Transport created:', data);
          const dtls=data.dtlsParameters
          socket.emit('connect-transport', ( dtls ));
          socket.emit('getRtpCapabilities', (data) => {
            if (data.error) {
              console.error('Error getting RTP Capabilities:', data.error);
            } else {
              console.log('RTP Capabilities:', data.rtpCapabilities);
              // Use these capabilities to create a WebRTC connection, e.g., create a Mediasoup device
            }
            stream.getTracks().forEach(track => {
              console.log("ahemji : ", track) 
              socket.emit('send-track',  {
                id: track.id,
                kind: track.kind,
                label: track.label,
                enabled: track.enabled,
                readyState:track.readyState,
                stats:track.stats,
                muted:track.muted,
                rtp:data.rtpCapabilities
            },room, title, description);
            });
          });
          // Use transport to send media track to the server
          
        });
        setStreamStarted(true);
    // Send the offer to the SFU through the signaling server
    // socket.emit('broadcaster-offer', offer);
    // // Receive the answer from the SFU
    // socket.on('sfu-answer', async (answer) => {
    //     await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    // });
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true); // Enable editing mode
  };

  const handleSave = () => {
    setTitle(tempTitle); // Update title
    setDescription(tempDescription); // Update description
    setIsEditing(false); // Disable editing mode
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit('message', message);
      setMessages((prevMessages) => [...prevMessages, { sender: 'Me', text: message }]);
      setMessage('');
    }
  };

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { sender: 'Other', text: msg }]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  return (
    <div>
      <Navbar />
      <Box sx={{ flexGrow: 1, marginTop: '2rem' }}>
        <Grid container spacing={2}>
          {/* Video Section */}
          <Grid item xs={8}>
            <Item sx={{ height: '30rem', marginLeft: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <video
                ref={videoRef} autoPlay playsInline controls width="1100" height="700"
              />
            </Item>
          </Grid>

          {/* Chatbox Section */}
          <Grid item xs={4}>
            <ChatBox>
              <List sx={{ overflowY: 'scroll' }}>
                {messages.map((msg, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${msg.sender}: ${msg.text}`} />
                  </ListItem>
                ))}
              </List>
              <Box display="flex">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </Box>
            </ChatBox>
          </Grid>

          {/* Editable Description */}
          <Grid item xs={12}>
            <DescriptionItem>
              <ContentSection>
                {isEditing ? (
                  <>
                    <TextField
                      label="Title"
                      variant="outlined"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      fullWidth
                      sx={{ marginBottom: '1rem' }}
                    />
                    <TextField
                      label="Description"
                      variant="outlined"
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>{title}</Typography>
                    <Typography variant="body1">{description}</Typography>
                  </>
                )}
              </ContentSection>

              <CounterSection>
                <IconButton
                  onClick={handleStreamToggle}
                  color={streamStarted ? "secondary" : "primary"}
                >
                  {streamStarted ? <StopIcon /> : <PlayArrowIcon />}
                </IconButton>
                
                <IconButton>
                  <ThumbUpIcon color="primary" />
                  <IconText>120</IconText>
                </IconButton>
                <IconButton>
                  <ThumbDownIcon color="error" />
                  <IconText>12</IconText>
                </IconButton>
                <IconButton>
                  <VisibilityIcon />
                  <IconText>500</IconText>
                </IconButton>
                <IconButton>
                  <CheckIcon />
                  <IconText>300</IconText>
                </IconButton>
              </CounterSection>

              {isEditing ? (
                <IconButton onClick={handleSave}>
                  <CheckIcon />
                </IconButton>
              ) : (
                <IconButton onClick={handleEdit}>
                  <ExpandMoreIcon />
                </IconButton>
              )}
            </DescriptionItem>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default Global;
