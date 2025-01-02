import react,{useState} from 'react';
import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';

const actions = [
  { icon: <FileCopyIcon />, name: 'Global', id: '1' },
  { icon: <SaveIcon />, name: 'Meetings', id: '2' },
  { icon: <PrintIcon />, name: 'Join', id: '3' },
  { icon: <ShareIcon />, name: 'Share', id: '4' },
];

export default function Menu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleClick = (id) => {
    switch (id) {
      case '1':
        console.log('Global');
        navigate('/global');
        break;
      case '2':
        console.log('Lobby');
        navigate('/meetinglobby');
        break;
      case '3':
        console.log('Join');
        navigate('/join');
        break;
      case '4':
        console.log('Share');
        navigate('/share');
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Backdrop open={open} onClick={handleClose} sx={{ zIndex: (theme) => theme.zIndex.speedDial - 1 }} />
      <SpeedDial
        ariaLabel="SpeedDial tooltip example"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={() => handleClick(action.id)} // Passing function reference
          />
        ))}
      </SpeedDial>
    </Box>
  );
}
