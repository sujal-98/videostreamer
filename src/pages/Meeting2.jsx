import React, { useCallback, useState , useEffect, useRef } from 'react';
import { Camera, MessageSquare, Mic, MicOff, PhoneOff, Share2, Video, VideoOff, Send } from 'lucide-react';


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
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [participant,SetParticipant]=useState();
  const {user} = useSelector((state) => state.auth);
  const name=user?.displayName;

  const [isLocalVideoMain, setIsLocalVideoMain] = useState(false);  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello everyone!", sender: "John", time: "12:25" },
    { id: 2, text: "Hi there!", sender: "Sarah", time: "12:26" }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        text: message,
        sender: "You",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setMessage('');
    }
  };

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
  const localVideoUrl = 'your_local_stream_url';
  const remoteVideoUrl = 'remote_stream_url';
  
  const handleVideoSwitch = () => {
    setIsLocalVideoMain(!isLocalVideoMain);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
    {/* Top Bar */}
    <div className="flex justify-between items-center p-4 bg-gray-800">
      <div className="text-white font-semibold text-lg">Video Call</div>
      <div className="px-3 py-1 bg-green-500/20 rounded-full">
        <span className="text-green-400">12:30</span>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 relative p-4 min-h-0">
      <div className="h-full flex flex-col">
        {/* Main Video */}
        <div 
          className="relative flex-1 bg-gray-800 rounded-lg overflow-hidden min-h-0"
          style={{ minHeight: '60vh' }}
        >
          <ReactPlayer
            url={isLocalVideoMain ? remoteStream : remoteStream}
            playing
            muted={isLocalVideoMain ? true : isMuted}
            width="100%"
            height="100%"
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full">
            {isLocalVideoMain ? 'You' : 'Remote User'}
          </div>
        </div>

        {/* Picture-in-Picture Video */}
        <div 
          onClick={handleVideoSwitch}
          className="absolute top-8 right-8 w-64 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
        >
          <ReactPlayer
            url={isLocalVideoMain ? myStream : remoteStream}
            playing
            muted={!isLocalVideoMain ? true : isMuted}
            width="100%"
            height="100%"
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded-full text-sm">
            {isLocalVideoMain ? `${participant}` : 'You'}
          </div>
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              Click to switch
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Control Bar */}
    <div className="bg-gray-800 p-4">
      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition-colors ${
            isMuted ? 'bg-red-500' : 'bg-gray-600'
          } hover:opacity-90`}
        >
          {isMuted ? <MicOff className="text-white" /> : <Mic className="text-white" />}
        </button>

        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`p-4 rounded-full transition-colors ${
            !isVideoOn ? 'bg-red-500' : 'bg-gray-600'
          } hover:opacity-90`}
        >
          {isVideoOn ? <Video className="text-white" /> : <VideoOff className="text-white" />}
        </button>

        <button className="p-4 bg-green-500 rounded-full hover:bg-green-600 transition-colors" onClick={handleVideo}>
          <Share2 className="text-white" />
        </button>
        
        <button className="p-4 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors" onClick={sendStreams}>
          <Share2 className="text-white" />
        </button>
        
        <button className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-colors">
          <PhoneOff className="text-white" />
        </button>
      </div>
    </div>
  </div>
  );
};

export default Meeting2;