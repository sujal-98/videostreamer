import React, { useState, useRef } from 'react';
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [title, setTitle] = useState('Sample Video');
  const [description, setDescription] = useState('This is a sample video description. It provides an overview of the video\'s content and context.');
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [isDescriptionEdited, setIsDescriptionEdited] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handlePlay = () => {
    videoRef.current.play();
    setIsStreaming(true);
  };

const CounterSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
  width: '30%',
}));

const IconSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '50%',
}));

  const handlePause = () => {
    videoRef.current.pause();
    setIsStreaming(false);
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
    setIsTitleEdited(true);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
    setIsDescriptionEdited(true);
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Navbar />
      <Box sx={{ flexGrow: 1, marginTop: '2rem' }}>
        <Grid container spacing={2}>
          {/* Video Section */}
          <Grid item xs={8}>
            <Item
              sx={{
                height: '30rem',
                marginLeft: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <CardMedia
                component="video"
                controls
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
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
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Type a message"
                  size="small"
                  sx={{ marginRight: '0.5rem' }}
                />
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
                  <TextField
                    value={title}
                    onChange={handleTitleChange}
                    variant="outlined"
                    size="small"
                    sx={{ width:"70%"
                    }}
                  />
                  {isTitleEdited && (
                    <CheckIcon color="success" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <TextField
                    value={description}
                    onChange={handleDescriptionChange}
                    variant="outlined"
                    width="70%"
                    multiline
                    size="small"
                    maxRows={expanded ? undefined : 1}
                    sx={{  width:"70%"}}
                  />
                  <IconButton onClick={handleExpandClick}>
                    <ExpandMoreIcon />
                  </IconButton>
                  {isDescriptionEdited && (
                    <CheckIcon color="success" />
                  )}
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
  <IconSection>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton color="primary">
        <ThumbUpIcon />
      </IconButton>
      <IconText>123</IconText>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton color="primary">
        <ThumbDownIcon />
      </IconButton>
      <IconText>45</IconText>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton color="primary">
        <VisibilityIcon />
      </IconButton>
      <IconText>678</IconText>
    </Box>
  </IconSection>
</CounterSection>

            </DescriptionItem>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default Global;
