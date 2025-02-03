import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, Videocam, YouTube, FileCopy, LiveTv } from '@mui/icons-material';

import Navbar from '../component/Navbar';
import { useSelector } from 'react-redux';

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(to right, #1976d2, #64b5f6)',
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[4],
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: theme.shape.borderRadius,
    '& fieldset': { border: 'none' },
    '&:hover fieldset': { border: 'none' },
    '&.Mui-focused fieldset': { border: `2px solid ${theme.palette.common.white}` },
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
}));

const IconWrapper = styled(Box)(({ color }) => ({
  backgroundColor: `${color}15`,
  borderRadius: '50%',
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: `${color}25`,
  },
}));

const Main = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const isAuthenticated = useSelector(state => state.auth);

  const features = [
    {
      title: 'Virtual Meeting',
      description: 'Start or join secure video meetings with crystal clear audio & video',
      icon: <Videocam sx={{ fontSize: 32 }} />,
      color: '#1976d2',
      route: '/meetinglobby',
    },
    {
      title: 'Live Stream',
      description: 'Broadcast your content live to thousands of viewers worldwide',
      icon: <LiveTv sx={{ fontSize: 32 }} />,
      color: '#2e7d32',
      route: '/stream',
    },
    {
      title: 'File Transfer',
      description: 'Share files securely with end-to-end encryption & no size limits',
      icon: <FileCopy sx={{ fontSize: 32 }} />,
      color: '#7b1fa2',
      route: '/fileshare',
    },
    {
      title: 'Watch Party',
      description: 'Watch YouTube videos together with friends in perfect sync',
      icon: <YouTube sx={{ fontSize: 32 }} />,
      color: '#d32f2f',
      route: '/watchparty',
    },
  ];

  const handleClick = (route) => {
    if (isAuthenticated) {
      navigate(route);
    } else {
      navigate('/login'); // Redirect to login if not authenticated
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #bbdefb 0%, #ffffff 100%)', py: 4 }}>
        <Container maxWidth="lg">
          <GradientBox>
            <Typography variant="h4" align="center" color="white" gutterBottom>
              Share & Collaborate
            </Typography>
            <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative' }}>
              <SearchTextField
                fullWidth
                placeholder="Paste your URL here to get started..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} /> }}
              />
            </Box>
          </GradientBox>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index} onClick={() => handleClick(feature.route)}>
                <FeatureCard>
                  <CardContent
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: 3,
                      cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                      opacity: isAuthenticated ? 1 : 0.5, // Dim the card if not authenticated
                      pointerEvents: isAuthenticated ? 'auto' : 'none', // Disable interaction if not authenticated
                    }}
                  >
                    <IconWrapper color={feature.color}>
                      <Box sx={{ color: feature.color }}>{feature.icon}</Box>
                    </IconWrapper>
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default Main;
