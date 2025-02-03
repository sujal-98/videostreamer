import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  LinearProgress,
  IconButton,
  Paper,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {
  CloudUpload,
  ContentCopy,
  Check,
  Close,
  Timer,
  Lock,
  Person
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Navbar from '../component/Navbar';

// Styled components
const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  border: '2px dashed',
  borderColor: theme.palette.grey[300],
  backgroundColor: theme.palette.grey[50],
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary[50],
  },
}));

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(120deg, #2196f3 0%, #1976d2 100%)',
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const FileShare = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareLink, setShareLink] = useState('');
  const [copying, setCopying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setShareLink('');
    }
  };

  const simulateUpload = () => {
    setUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setShareLink('https://transfer.example.com/f/abc123xyz789');
      }
    }, 200);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopying(true);
    setSnackbarOpen(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setShareLink('');
    setUploading(false);
  };

  return (
    <>
      <Navbar />
    
    <Box sx={{ bgcolor: '#f5f9ff', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Header Section with Gradient */}
            <GradientBox>
              <Typography variant="h4" align="center" color="white" gutterBottom>
                Secure File Transfer
              </Typography>
              <Typography variant="subtitle1" align="center" color="white">
                Transfer files securely with end-to-end encryption
              </Typography>
            </GradientBox>

            {/* Upload Area */}
            <input
              type="file"
              id="file-upload"
              hidden
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <UploadBox>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {selectedFile ? selectedFile.name : "Choose a file to upload"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedFile
                    ? `Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Drag and drop here or click to select"}
                </Typography>
              </UploadBox>
            </label>

            {/* Progress Section */}
            {selectedFile && (
              <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Upload Progress
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {uploadProgress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              {selectedFile && !shareLink && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={simulateUpload}
                  disabled={uploading}
                  startIcon={<CloudUpload />}
                  sx={{ py: 1.5 }}
                >
                  {uploading ? "Uploading..." : "Start Upload"}
                </Button>
              )}
              {selectedFile && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={resetUpload}
                  disabled={uploading}
                  startIcon={<Close />}
                  sx={{ py: 1.5 }}
                >
                  Cancel
                </Button>
              )}
            </Box>

            {/* Share Link Section */}
            {shareLink && (
              <Paper sx={{ mt: 4, p: 3, bgcolor: '#f0f7ff' }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Share Link Generated
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  bgcolor: 'white',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.light'
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      flexGrow: 1,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {shareLink}
                  </Typography>
                  <IconButton 
                    onClick={copyToClipboard}
                    color="primary"
                    size="small"
                  >
                    {copying ? <Check /> : <ContentCopy />}
                  </IconButton>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Security Features */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer color="action" fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      Link expires in 7 days
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lock color="action" fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      End-to-end encrypted transfer
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      No sign-up required for download
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </CardContent>
        </Card>

        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={2000} 
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert severity="success" variant="filled">
            Link copied to clipboard!
          </Alert>
        </Snackbar>
      </Container>
    </Box></>
  );
};

export default FileShare;