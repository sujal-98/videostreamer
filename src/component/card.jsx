import * as React from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  width: 345, 
  margin: 'auto',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
}));

const ActionIcons = styled(CardActions)(({ theme }) => ({
  justifyContent: 'space-between',
}));

export default function CustomCard({ item }) {
  return (
    <StyledCard>
      {/* Assuming a default thumbnail or placeholder */}
      <CardMedia
        component="img"
        height="194"
        image="https://via.placeholder.com/345x194" // Placeholder image
        alt={item.name}
      />
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }} aria-label="profile-photo">
            {item.name.charAt(0)} {/* Display the first letter of the stream name */}
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={item.name}
        subheader={new Date(item.createdAt).toLocaleDateString()} 
      />
      <StyledCardContent>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
      </StyledCardContent>
      <ActionIcons disableSpacing>
        <IconButton aria-label="add to favorites">
          <FavoriteIcon />
          <Typography variant="body2" color="text.secondary" sx={{ marginLeft: 1 }}>
            {item.likes}
          </Typography>
        </IconButton>
        <IconButton aria-label="share">
          <ShareIcon />
        </IconButton>
      </ActionIcons>
    </StyledCard>
  );
}
