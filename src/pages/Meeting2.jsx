import React, { useCallback, useState , useEffect, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  Typography, 
  Container,
  Grid,
  Drawer,
  TextField,
  Button,
  AppBar,
  Toolbar,
  Stack,
  Avatar,
  Divider
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  Call,
  Chat,
  Settings,
  Group
} from '@mui/icons-material';

import ForkRightIcon from '@mui/icons-material/ForkRight';
import { useSocket } from '../contest/socketContext';
import peer from "../services/peers";
import ReactPlayer from "react-player";
import { useSelector } from 'react-redux';

const Meeting2 = () => {
  const socket=useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(false);
  const [isSecondPersonJoined, setIsSecondPersonJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [participant,SetParticipant]=useState();
  const {user} = useSelector((state) => state.auth);
  const name=user?.displayName;

  //function
const handleUserJoined = useCallback(({ email, id ,name }) => {
  console.log(`Email ${email} joined room ` , id);
  setRemoteSocketId(id);
  SetParticipant(name)
}, []);

const handleVideo=useCallback(async ()=>{
  const stream=await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }) 
  const offer=await peer.getOffer();
  socket.emit('user-call',{remoteSocketId,offer,name})
  setMyStream(stream)
}, [remoteSocketId,socket])

const handleIncomingCall = useCallback(
  async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    console.log(`Incoming Call`, from, offer,name);
    SetParticipant(name);
    const ans = await peer.getAnswer(offer);
    socket.emit("call-accepted", { to: from, ans });
  },
  [socket]
);



const sendStreams = useCallback(() => {
  for (const track of myStream.getTracks()) {
    console.log("track ", track)
    const sender =peer.peer.addTrack(track, myStream);
    console.log(`Track added: ${track.kind}`, sender);
  }
}, [myStream]);


const handleCallAccepted = useCallback(
  async ({ from, ans }) => {
    peer.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
  },
  [sendStreams]
);

const handleNegoNeeded = useCallback(async () => {
  const offer = await peer.getOffer();
  socket.emit("peer-nego-needed", { offer, to: remoteSocketId });
}, [remoteSocketId, socket]);

const handleNegoNeedIncomming = useCallback(
  async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer-nego-done", { to: from, ans });
  },
  [socket]
);

const handleNegoNeedFinal = useCallback(async ({ ans }) => {
  await peer.setLocalDescription(ans);
}, []);

  useEffect(()=>{
    
    socket.on('otheroom-join',handleUserJoined);
    socket.on('incoming-call',handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("peer-nego-needed", handleNegoNeedIncomming);
    socket.on("peer-nego-final", handleNegoNeedFinal);


    return () => {
      socket.off('otheroom-join',handleUserJoined);
      socket.off('incoming-call',handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("peer-nego-needed", handleNegoNeedIncomming);
      socket.off("peer-nego-final", handleNegoNeedFinal);
    }

  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ])
  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!",remoteStream);
      setIsSecondPersonJoined(true)
      setRemoteStream(remoteStream[0]);
    });
  }, []);
  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  
  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth={false} sx={{ height: '100%', py: 3, position: 'relative' }}>
        {/* Main Content Area */}
        <Box sx={{ height: 'calc(100% - 80px)', mb: 2 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Main User Video */}
            <Grid item xs={isSecondPersonJoined ? 6 : 12}>
              <Paper
                elevation={3}
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: 'background.paper'
                }}
              >
                 <ReactPlayer
            playing
            muted
            height="100%"
            width="100%"
            url={myStream}
          />

                {isVideoOff && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Avatar sx={{ width: 80, height: 80 }}>
                      <Group />
                    </Avatar>
                  </Box>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    px: 2,
                    py: 0.5,
                    bgcolor: 'rgba(49, 44, 47, 0.8)'
                  }}
                >
                  <Typography variant="body2" color="white">
                    You
                  </Typography>
                </Paper>
              </Paper>
            </Grid>

            {/* Second Person Video */}
            {isSecondPersonJoined && (
              <Grid item xs={6}>
                <Paper
                  elevation={3}
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                  }}
                >
                  <ReactPlayer
            playing
            muted
            height="100%"
            width="100%"
            url={remoteStream}
          />

                  <Paper
                    elevation={0}
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      px: 2,
                      py: 0.5,
                      bgcolor: 'rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <Typography variant="body2" color="white">
                      {participant}
                    </Typography>
                  </Paper>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Controls Bar */}
        <AppBar position="static" color="default" elevation={3}>
          <Toolbar>
            <IconButton color="inherit">
              <Settings />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={2}>
              <IconButton
                color={isMuted ? 'error' : 'primary'}
                onClick={() => setIsMuted(!isMuted)}
                sx={{ bgcolor: 'action.hover' }}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </IconButton>
              <IconButton
                color={isVideoOff ? 'error' : 'primary'}
                onClick={() => setIsVideoOff(!isVideoOff)}
                sx={{ bgcolor: 'action.hover' }}
              >
                {isVideoOff ? <VideocamOff /> : <Videocam />}
              </IconButton>
              <IconButton
                color="error"
                sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
              >
                <Call />
              </IconButton>
              <IconButton
                color="success"
                sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}
                onClick={handleVideo}
              >
                <Call />
              </IconButton>
              <IconButton
                color="success"
                sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}
                onClick={sendStreams}
              >
                <ForkRightIcon />
                </IconButton>

            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              color={showChat ? 'primary' : 'inherit'}
              onClick={() => setShowChat(!showChat)}
            >
              <Chat />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Chat Drawer */}
        <Drawer
          anchor="right"
          open={showChat}
          onClose={() => setShowChat(false)}
          variant="persistent"
          sx={{
            width: 320,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Chat</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type a message..."
                variant="outlined"
              />
              <Button variant="contained" color="primary">
                Send
              </Button>
            </Stack>
          </Box>
        </Drawer>

        {/* Demo Controls */}
        <Box sx={{ position: 'absolute', top: 16, right: 24 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsSecondPersonJoined(!isSecondPersonJoined)}
          >
            {isSecondPersonJoined ? 'Remove Second Person' : 'Add Second Person'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Meeting2;