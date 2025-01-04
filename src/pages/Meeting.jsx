import React, { useState, useRef, useEffect } from 'react';
import { Device } from 'mediasoup-client';
import io from 'socket.io-client';

import { Camera, Mic, MessageSquare, MonitorUp, MicOff, CameraOff, Send } from 'lucide-react';

const socket = io('http://localhost:1000');

const Meeting = () => {
  const videoRef = useRef(null);
  const [device, setDevice] = useState(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const [room, setRoom] = useState('');

  const generateRoomID = (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
  };

  useEffect(() => {
    const initMediaSoupDevice = async () => {
      try {
        const generatedRoomID = generateRoomID(10);
        setRoom(generatedRoomID);

        socket.emit('create-room', generatedRoomID, async (response) => {
          if (!response.success) {
            console.error('Error creating room:', response.error);
            return;
          }

          console.log('RTP Capabilities:', response.routerRtpCapabilities);

          const mediasoupDevice = new Device();
          await mediasoupDevice.load({ routerRtpCapabilities: response.routerRtpCapabilities });
          setDevice(mediasoupDevice);
          setIsDeviceReady(true);

          console.log('MediaSoup device is ready');
        });
      } catch (error) {
        console.error('Error initializing MediaSoup device:', error);
      }
    };

    const createSendTransport = () => {
      socket.emit('createWebRtcTransport', { sender: true }, ({ params, success, error }) => {
        if (!success) {
          console.error('Error creating transport:', error);
          return;
        }
        
        console.log('Transport params received:', params);
    
      });
    };

    const captureMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        console.log('Media stream captured:', stream);
      } catch (error) {
        console.error('Error capturing media:', error);
      }
    };

    initMediaSoupDevice();
    captureMedia();
    createSendTransport();
  }, []);


  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', isMuted: false, isCameraOff: false }
  ]);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Welcome to the meeting!', time: '10:00 AM' },
    { id: 2, sender: 'John', text: 'Hello everyone!', time: '10:01 AM' },
    { id: 3, sender: 'You', text: 'Hi John, good to see you!', time: '10:02 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const addParticipant = () => {
    if (participants.length < 6) {
      setParticipants([
        ...participants,
        { 
          id: participants.length + 1, 
          name: `User ${participants.length + 1}`,
          isMuted: false,
          isCameraOff: false
        }
      ]);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: 'You',
          text: newMessage.trim(),
          time: time
        }
      ]);
      setNewMessage('');
    }
  };

  const toggleUserAudio = (id) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, isMuted: !p.isMuted } : p
    ));
  };

  const toggleUserVideo = (id) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, isCameraOff: !p.isCameraOff } : p
    ));
  };

  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  return (
    <div className="h-screen bg-gray-900 p-4">
      <div className="relative h-full flex flex-col">
        {/* Video Grid */}
        <div className={`grid ${getGridClass()} gap-4 flex-grow ${isChatOpen ? 'mr-80' : ''}`}>
          {participants.map((participant) => (
            <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
              {participant.isCameraOff ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-2xl text-white">{participant.name[0]}</span>
                  </div>
                </div>
              ) : (
                <video 
                  src="/api/placeholder/640/360" 
                  alt={participant.name}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  
                  {...(participant.id === 1 ? { ref: videoRef } : {})}

                />
              )}
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {participant.name} {participant.isMuted && <MicOff className="inline w-4 h-4 ml-1" />}
              </div>
            </div>
          ))}
        </div>

        {/* Control Bar */}
        <div className="h-16 mt-4 bg-gray-800 rounded-lg flex items-center justify-center gap-4">
          <button 
            onClick={() => toggleUserAudio(1)} 
            className={`p-3 rounded-full ${participants[0].isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80`}
          >
            {participants[0].isMuted ? <MicOff className="text-white" /> : <Mic className="text-white" />}
          </button>
          <button 
            onClick={() => toggleUserVideo(1)}
            className={`p-3 rounded-full ${participants[0].isCameraOff ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80`}
          >
            {participants[0].isCameraOff ? <CameraOff className="text-white" /> : <Camera className="text-white" />}
          </button>
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3 rounded-full ${isChatOpen ? 'bg-blue-500' : 'bg-gray-700'} hover:bg-opacity-80`}
          >
            <MessageSquare className="text-white" />
          </button>
          <button className="p-3 rounded-full bg-gray-700 hover:bg-opacity-80">
            <MonitorUp className="text-white" />
          </button>
          <button 
            onClick={addParticipant}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={participants.length >= 6}
          >
            Add Participant
          </button>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="absolute right-0 top-0 h-full w-80 bg-indigo-100 rounded-lg flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-black text-lg font-semibold">Chat</h2>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-black hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Messages Container */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex flex-col ${message.sender === 'You' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-2">
                    <div 
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        message.sender === 'You' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-700 text-white rounded-bl-none'
                      }`}
                    >
                      {message.sender !== 'You' && (
                        <div className="text-sm text-gray-300 font-medium mb-1">
                          {message.sender}
                        </div>
                      )}
                      <div>{message.text}</div>
                    </div>
                  </div>
                  <div className="text-xs text-black mt-1">
                    {message.time}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meeting;