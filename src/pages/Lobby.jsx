import React, { useEffect, useState , useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, Users } from 'lucide-react';
import { useSocket } from '../contest/socketContext';
import { useSelector } from 'react-redux';

const Lobby = () => {
  const socket = useSocket();
  const {user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
console.log("lobby email ",user?.email)
  // Set a default email if userEmail is missing
  const userEmail = user?.email || 'guest@default.com';
  const isGuest = userEmail === 'guest@default.com'; // Flag to check if the user is a guest
  const name=user?.displayName || 'Error';

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });

      const videoElement = document.getElementById('videoStream');
      if (videoElement) {
        videoElement.srcObject = mediaStream;
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(error => {
            console.error('Error playing video:', error);
          });
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  function generateRoomNumber() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let letter = letters[Math.floor(Math.random() * letters.length)];
    let floor = Math.floor(Math.random() * 9) + 1; 
    let room = Math.floor(Math.random() * 50) + 1; 
    return `${letter}${floor}${room.toString().padStart(2, '0')}`;
  }


  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;

      navigate(`/meeting/${room}`);
     
    },
    [navigate]
  );

  const handleJoinOtherRoom = useCallback(
    (data) => {
      console.log("data message ",data.message)
      if(data.message ==="invalid room") return;
      const { email, roomCode } = data;
      console.log("data")
      navigate(`/meeting/${roomCode}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on('room-join',handleJoinRoom );
    socket.on('otheroom-join',handleJoinOtherRoom );

    return () => {
      socket.off('room-join',handleJoinRoom);
      socket.off('otheroom-join',handleJoinOtherRoom);
    };
  }, [socket,handleJoinRoom]);

  const startInstantMeeting = () => {
    if (isGuest) return;
    const room = generateRoomNumber();
    socket.emit('room-join', { userEmail, room });
  };

  const startRoomMeeting = () => {
    if (!roomCode || roomCode==="" || isGuest) return;
    
    socket.emit('otheroom-join', { userEmail, roomCode,name});
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Side - Camera View */}
      <div className="w-1/2 p-4 flex flex-col items-center justify-center bg-white">
        <button 
          onClick={startCamera} 
          disabled={isGuest}
          className={`flex items-center px-4 py-2 rounded transition ${
            !isGuest ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          <Camera className="mr-2" /> Start Camera
        </button>

        <video 
          id="videoStream"
          playsInline
          muted 
          className="w-full max-w-md rounded-lg shadow-lg mt-4"
        />
      </div>

      {/* Right Side - Meeting Options */}
      <div className="w-1/2 p-4 flex flex-col justify-center space-y-4 bg-gray-50">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">WELCOME TO THE MEETING ROOMS</h2>
        </div>

        {/* Start Instant Meeting */}
        <button 
          onClick={startInstantMeeting}
          disabled={isGuest}
          className={`flex items-center justify-center px-6 py-3 rounded-lg transition ${
            !isGuest ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          <Video className="mr-2" /> Start Instant Meeting
        </button>

        {/* Join Existing Meeting */}
        <div className="space-y-2">
          <div className="flex items-center bg-white border rounded-lg">
            <input 
              type="text" 
              placeholder="Enter Room Code" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-grow p-3 rounded-l-lg focus:outline-none"
            />
            <button 
              disabled={isGuest || !roomCode.trim()}
              className={`flex items-center px-4 py-3 rounded-r-lg transition ${
                !isGuest && roomCode.trim() ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
              onClick={startRoomMeeting}
            >
              <Users className="mr-2" /> Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
