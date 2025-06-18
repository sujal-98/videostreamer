import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Camera, MessageSquare, Mic, MicOff, PhoneOff, Share2, Video, VideoOff, Send } from 'lucide-react';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import { useSocket } from '../contest/socketContext';
import peer from "../services/peers";
import ReactPlayer from "react-player";
import { useSelector } from 'react-redux';

const Meeting2 = () => {
  // --- State and refs ---
  const socket = useSocket(); // Socket.io context
  const [remoteSocketId, setRemoteSocketId] = useState(null); // Remote peer socket ID
  const [isSecondPersonJoined, setIsSecondPersonJoined] = useState(false); // Is remote joined
  const [isMuted, setIsMuted] = useState(false); // Local audio muted
  const [isVideoOn, setIsVideoOn] = useState(true); // Local video on/off
  const [showChat, setShowChat] = useState(false); // Show/hide chat panel
  const [myStream, setMyStream] = useState(null); // Local media stream
  const [remoteStream, setRemoteStream] = useState(null); // Remote media stream
  const [participant, SetParticipant] = useState(''); // Remote participant name
  const [connectionState, setConnectionState] = useState('disconnected'); // WebRTC connection state
  const { user } = useSelector((state) => state.auth); // Redux user
  const name = user?.displayName || 'User'; // Local user name
  const [isScreenSharing, setIsScreenSharing] = useState(false); // Screen sharing state
  const [screenStream, setScreenStream] = useState(null); // Screen share stream
  const [isLocalVideoMain, setIsLocalVideoMain] = useState(false); // Toggle local/remote video focus
  const [message, setMessage] = useState(''); // Current chat input
  const [messages, setMessages] = useState([]); // Chat messages
  const localVideoRef = useRef(null); // Ref for local video element
  const remoteVideoRef = useRef(null); // Ref for remote video element

  // --- Chat message send handler ---
  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      if (remoteSocketId) {
        socket.emit('chat-message', { message: newMessage, to: remoteSocketId });
        console.log('Sent chat message to', remoteSocketId);
      }
      setMessage('');
    }
  };

  // --- Handle when a user joins the room ---
  const handleUserJoined = useCallback(({ email, id, name }) => {
    console.log(`User ${email} joined room with ID`, id);
    setRemoteSocketId(id);
    SetParticipant(name || 'Remote User');
    setConnectionState('connected');
    setIsSecondPersonJoined(true);
  }, []);

  // --- Start local video/audio and call remote peer ---
  const handleVideo = useCallback(async () => {
    try {
      console.log('Requesting media devices access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      console.log('Got media stream:', stream);
      const offer = await peer.getOffer();
      console.log('Created offer:', offer);
      if (remoteSocketId) {
        socket.emit('user-call', { remoteSocketId, offer, name });
        console.log('Emitted user-call to', remoteSocketId);
      } else {
        console.log('No remote socket ID available yet, waiting for connection');
      }
      setMyStream(stream);
      setConnectionState('calling');
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Set local video source object');
      } else {
        console.warn('Local video ref not available');
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Failed to access camera/microphone. Please check permissions and try again.');
      setConnectionState('error');
    }
  }, [remoteSocketId, socket, name]);

  // --- Handle incoming call from remote peer ---
  const handleIncomingCall = useCallback(
    async ({ from, offer, name }) => {
      try {
        console.log('Incoming call from', from, 'with offer:', offer);
        setRemoteSocketId(from);
        setConnectionState('receiving');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log('Got local stream for incoming call:', stream);
        setMyStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('Set local video source for incoming call');
        }
        SetParticipant(name || 'Remote User');
        const ans = await peer.getAnswer(offer);
        console.log('Created answer:', ans);
        socket.emit("call-accepted", { to: from, ans });
        console.log('Emitted call-accepted to', from);
        setConnectionState('connected');
      } catch (error) {
        console.error('Error handling incoming call:', error);
        alert('Failed to access media devices for incoming call.');
        setConnectionState('error');
      }
    },
    [socket]
  );

  // --- Toggle local audio mute/unmute ---
  const toggleMute = useCallback(() => {
    if (myStream) {
      const audioTracks = myStream.getAudioTracks();
      const newMutedState = !isMuted;
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
        console.log(`Audio track ${track.id} ${track.enabled ? 'enabled' : 'disabled'}`);
      });
      setIsMuted(newMutedState);
    } else {
      console.warn('No stream available to mute/unmute');
    }
  }, [myStream, isMuted]);

  // --- Toggle local video on/off ---
  const toggleVideo = useCallback(() => {
    if (myStream) {
      const videoTracks = myStream.getVideoTracks();
      const newVideoState = !isVideoOn;
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
        console.log(`Video track ${track.id} ${track.enabled ? 'enabled' : 'disabled'}`);
      });
      setIsVideoOn(newVideoState);
    } else {
      console.warn('No stream available to toggle video');
    }
  }, [myStream, isVideoOn]);

  // --- Stop screen sharing and restore camera video ---
  const stopScreenSharing = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped screen share track ${track.id}`);
      });
      // Restore original video track
      if (myStream) {
        const videoTrack = myStream.getVideoTracks()[0];
        const senders = peer.peer.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
          console.log('Restored original video track');
        } else {
          console.warn('Could not restore original video track');
        }
      }
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [screenStream, myStream]);

  // --- Toggle screen sharing on/off ---
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        console.log('Starting screen share...');
        const screenCaptureStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        console.log('Got screen share stream:', screenCaptureStream);
        setScreenStream(screenCaptureStream);
        // Replace video track
        const videoTrack = screenCaptureStream.getVideoTracks()[0];
        const senders = peer.peer.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
          console.log('Replaced video track with screen share');
        } else {
          console.warn('No video sender found for screen share');
        }
        setIsScreenSharing(true);

        // Handle when user stops sharing screen
        videoTrack.onended = () => {
          console.log('Screen sharing ended by user');
          stopScreenSharing();
        };
      } else {
        console.log('Stopping screen share...');
        stopScreenSharing();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      alert('Failed to share screen. Please try again.');
    }
  }, [isScreenSharing, stopScreenSharing]);

  // --- End the call, clean up streams and peer connection ---
  const handleCallEnd = useCallback(() => {
    console.log('Ending call...');
    if (myStream) {
      myStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track ${track.id}`);
      });
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped screen share track ${track.id}`);
      });
    }
    if (peer.peer) {
      peer.peer.close();
      console.log('Closed peer connection');
    }
    setMyStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
    setRemoteSocketId(null);
    setIsSecondPersonJoined(false);
    setConnectionState('disconnected');
    // Emit call end event to remote peer
    if (remoteSocketId) {
      socket.emit('call-ended', { to: remoteSocketId });
      console.log('Emitted call-ended to', remoteSocketId);
    }
    // Reset video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [myStream, screenStream, remoteSocketId, socket]);

  // --- Add local media tracks to peer connection ---
  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
        console.log(`Added track ${track.kind} to peer connection`);
      }
    } else {
      console.warn('No stream available to send');
    }
  }, [myStream]);

  // --- Handle call accepted by remote peer ---
  const handleCallAccepted = useCallback(
    async ({ from, ans }) => {
      console.log('Call accepted by', from, 'with answer:', ans);
      await peer.setLocalDescription(ans);
      console.log('Set local description for answer');
      sendStreams();
      setConnectionState('connected');
    },
    [sendStreams]
  );

  // --- WebRTC negotiation needed (e.g., for screen share) ---
  const handleNegoNeeded = useCallback(async () => {
    console.log('Negotiation needed');
    if (remoteSocketId) {
      const offer = await peer.getOffer();
      socket.emit("peer-nego-needed", { offer, to: remoteSocketId });
      console.log('Emitted peer-nego-needed to', remoteSocketId);
    } else {
      console.warn('No remote socket ID for negotiation');
    }
  }, [remoteSocketId, socket]);

  // --- Handle incoming negotiation from remote peer ---
  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      console.log('Incoming negotiation from', from);
      const ans = await peer.getAnswer(offer);
      socket.emit("peer-nego-done", { to: from, ans });
      console.log('Emitted peer-nego-done to', from);
    },
    [socket]
  );

  // --- Final negotiation answer from remote peer ---
  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    console.log('Final negotiation answer received');
    await peer.setLocalDescription(ans);
    console.log('Set local description for final negotiation');
  }, []);

  // --- Handle remote peer ending the call ---
  const handleCallEnded = useCallback(() => {
    console.log('Remote peer ended the call');
    handleCallEnd();
    alert('Call ended by remote peer');
    setConnectionState('disconnected');
  }, [handleCallEnd]);

  // --- Setup/cleanup socket event listeners ---
  useEffect(() => {
    console.log('Setting up socket event listeners...');
    socket.on('otheroom-join', handleUserJoined);
    socket.on('incoming-call', handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("peer-nego-needed", handleNegoNeedIncoming);
    socket.on("peer-nego-final", handleNegoNeedFinal);
    socket.on('call-ended', handleCallEnded);
    socket.on('chat-message', ({ message }) => {
      console.log('Received chat message:', message);
      setMessages(prev => [...prev, message]);
    });

    return () => {
      console.log('Cleaning up socket event listeners...');
      socket.off('otheroom-join', handleUserJoined);
      socket.off('incoming-call', handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("peer-nego-needed", handleNegoNeedIncoming);
      socket.off("peer-nego-final", handleNegoNeedFinal);
      socket.off('call-ended', handleCallEnded);
      socket.off('chat-message');
      handleCallEnd();
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
    handleCallEnded,
    handleCallEnd
  ]);

  // --- Setup/cleanup peer connection event listeners (track, state) ---
  useEffect(() => {
    console.log('Setting up peer connection track listener...');
    const peerConnection = peer.peer;
    peerConnection.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams[0];
      console.log("GOT TRACKS!!", remoteStream);
      setIsSecondPersonJoined(true);
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log('Set remote video source object');
      } else {
        console.warn('Remote video ref not available');
      }
    });
    
    // Monitor connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed to:', peerConnection.connectionState);
      setConnectionState(peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        alert('Connection failed. Please try again.');
        handleCallEnd();
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed to:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed') {
        alert('ICE connection failed. Please try again.');
        handleCallEnd();
      }
    };

    return () => {
      console.log('Cleaning up peer connection listeners...');
      peerConnection.removeEventListener("track", async () => {});
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;
    };
  }, [handleCallEnd]);

  // --- Setup/cleanup negotiationneeded event listener ---
  useEffect(() => {
    console.log('Setting up peer connection negotiation listener...');
    const peerConnection = peer.peer;
    peerConnection.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      console.log('Cleaning up negotiation listener...');
      peerConnection.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <div className="text-white font-semibold text-lg">Video Call</div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-green-500/20 rounded-full">
            <span className="text-green-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {participant && (
            <div className="px-3 py-1 bg-blue-500/20 rounded-full">
              <span className="text-blue-400">Connected with: {participant}</span>
            </div>
          )}
          <div className={`px-3 py-1 rounded-full ${connectionState === 'connected' ? 'bg-green-500/20 text-green-400' : connectionState === 'error' || connectionState === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <span>{connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 p-4 space-x-4">
        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className={`relative bg-gray-800 rounded-lg overflow-hidden ${isLocalVideoMain ? 'col-span-2' : ''}`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded">
              You {isMuted && '(Muted)'}
            </div>
          </div>
          {remoteStream && (
            <div className={`relative bg-gray-800 rounded-lg overflow-hidden ${!isLocalVideoMain ? 'col-span-2' : ''}`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded">
                {participant || 'Remote User'}
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 rounded-lg p-4 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg ${
                    msg.sender === name ? 'bg-blue-500 ml-auto' : 'bg-gray-700'
                  } max-w-[80%]`}
                >
                  <div className="text-sm text-gray-300">{msg.sender}</div>
                  <div className="text-white">{msg.text}</div>
                  <div className="text-xs text-gray-400 text-right">{msg.time}</div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {!isVideoOn ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full ${
              isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <Share2 className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-4 rounded-full ${
              showChat ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
          {!remoteSocketId ? (
            <button
              onClick={handleVideo}
              className="p-4 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={handleCallEnd}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Meeting2;