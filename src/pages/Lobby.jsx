import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, Users, Link } from 'lucide-react';

const Lobby = () => 
  {

    const navigate=useNavigate();

  const [roomCode, setRoomCode] = useState('');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });
      
      // Get video element by ID
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

  const startInstantMeeting = () => {
    const newRoomCode = Math.random().toString(36).substring(7);
    navigate('/meeting')

    alert(`New Meeting Room Created: ${newRoomCode}`);
  };

  const joinMeeting = () => {
    if (roomCode.trim()) {
      alert(`Joining meeting room: ${roomCode}`);
      navigate('/meeting')
    } else {
      alert('Please enter a valid room code');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Side - Camera View */}
      <div className="w-1/2 p-4 flex flex-col items-center justify-center bg-white">
        <button 
          onClick={startCamera} 
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
          className="flex items-center justify-center bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
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
              onClick={joinMeeting}
              className="flex items-center bg-blue-500 text-white px-4 py-3 rounded-r-lg hover:bg-blue-600"
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