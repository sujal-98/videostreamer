import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Navbar from '../component/Navbar';
import {
  Grid, Paper, Box, CardMedia, Typography, IconButton, List, ListItem, ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';

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

const GlobalViewer = () => {
  const videoRef = useRef(null);
  const [title, setTitle] = useState('Stream Title'); // Default title
  const [description, setDescription] = useState('Stream description goes here.'); // Default description
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    // Set up WebRTC to view stream
    socket.emit('receive-streams', (streamInfo) => {
      console.log('Stream information received:', streamInfo);

      // Assuming a single stream for now; we create an RTC connection for each stream
      streamInfo.forEach((info) => {
        const rtcPeerConnection = new RTCPeerConnection();
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(info.rtpParameters));

        rtcPeerConnection.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };
      });
    });
  }, []);

  useEffect(() => {
    // Listening for messages from the chat
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
              <video ref={videoRef} autoPlay playsInline controls width="1100" height="700" />
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
            </ChatBox>
          </Grid>

          {/* Stream Info Section */}
          <Grid item xs={12}>
            <DescriptionItem>
              <ContentSection>
                <Typography variant="h6" gutterBottom>{title}</Typography>
                <Typography variant="body1">{description}</Typography>
              </ContentSection>

              <CounterSection>
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
            </DescriptionItem>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default GlobalViewer;
