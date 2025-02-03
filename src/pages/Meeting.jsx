import React, { useState, useRef, useEffect } from 'react';
import { Device } from 'mediasoup-client';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { Camera, Mic, MessageSquare, MonitorUp, MicOff, CameraOff, Send } from 'lucide-react';


const Meeting = () => {
  const videoRef = useRef(null);
const socket=null;
  const partVideoRef = useRef(new Map());

  const [device, setDevice] = useState(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const [producerTransport, setProducerTransport] = useState(null);
  const [producer, setProducer] = useState(null);
  const [consumerTransport, setConsumerTransport] = useState([]);
  const [videoProducer, setVideoProducer] = useState(null);
  const [audioProducer, setAudioProducer] = useState(null);
  const [consumers, setConsumers] = useState(new Map());
  const [rtpCapabilities, setRtpCapabilities] = useState(null);
  const [dtls, setDtls] = useState(null);

  const [params2, setParams2] = useState({
    encodings   :
    [
      { maxBitrate: 100000 },
      { maxBitrate: 300000 },
      { maxBitrate: 900000 }
    ],
    codecOptions :
    {
      videoGoogleStartBitrate : 1000
    } // Starting bitrate is also lowered
  });

  useEffect(() => {
    let mediaStream = null;
    const constraints = {
      video:true,
      audio: true
    };
    const captureMedia = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;

        const videoTrack = mediaStream.getVideoTracks()[0];
        console.log("sending track ",videoTrack)
        const audioTrack = mediaStream.getAudioTracks()[0];
        setAudioProducer(audioTrack);
        setVideoProducer(videoTrack);
        console.log('Media stream captured.');
      } catch (error) {
        console.error('Error capturing media:', error);
      }
    };

    captureMedia();

    const initMediaSoupDevice = async () => {
      try {
        const codecs = RTCRtpSender.getCapabilities('video').codecs;
        console.log('Browser supported codecs:', codecs);
    
        socket.emit('joinRoom', 'asddfg', async (response) => {
          const mediasoupDevice = new Device();
          console.log("RTP Capabilities:", response.rtpCapabilities);

          // Add error handling for device loading
          try {
            await mediasoupDevice.load({ routerRtpCapabilities: response.rtpCapabilities });
            console.log("Device loaded:", mediasoupDevice.loaded);
            console.log("Can produce video:", mediasoupDevice.canProduce('video'));
            console.log("RTP Capabilities:", mediasoupDevice.rtpCapabilities);
            
            if (mediasoupDevice.loaded && mediasoupDevice.canProduce('video')) {
              setRtpCapabilities(response);
              setDevice(mediasoupDevice);
              createSendTransport(mediasoupDevice);
            } else {
              console.error("Device not properly loaded or cannot produce video");
            }
          } catch (loadError) {
            console.error('Error loading device:', loadError);
          }
        });
      } catch (error) {
        console.error('Error initializing MediaSoup device:', error);
      }
    };
    initMediaSoupDevice();

  }, []);

  // This effect runs when producerTransport or videoProducer changes
  useEffect(() => {
    if (producerTransport && videoProducer) {
      console.log("yolo")
      console.log(device)
      connectSendTransport(); // Ensure this only runs when these states are set
    }
  }, [producerTransport,videoProducer,device]);

  const createSendTransport = (device) => {
    // see server's socket.on('createWebRtcTransport', sender?, ...)
    // this is a call from Producer, so sender = true
    socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
      // The server sends back params needed 
      // to create Send Transport on the client side
      if (params.error) {
        console.log(params.error)
        return
      }
  
      console.log(params)
  
      // creates a new WebRTC Transport to send media
      // based on the server's producer transport params
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
      const proTransport = device.createSendTransport(params)
      setProducerTransport(proTransport)

      // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
      // this event is raised when a first call to transport.produce() is made
      // see connectSendTransport() below
      proTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          console.log("i was called")
          await socket.emit('transport-connect', {
            dtlsParameters,
          })
          // Tell the transport that parameters were transmitted.
          callback()
  
        } catch (error) {
          errback(error)
        }
      })
  
      proTransport.on('produce', async (parameters, callback, errback) => {
        console.log(parameters)
  
        try {
          // tell the server to create a Producer
          // with the following parameters and produce
          // and expect back a server side producer id
          // see server's socket.on('transport-produce', ...)
          await socket.emit('transport-produce', {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
          }, ({ id, producersExist }) => {
            // Tell the transport that parameters were transmitted and provide it with the
            // server side producer's id.
            callback({ id })
  
            // if producers exist, then join room
            if (producersExist) getProducers(device)
          })
        
        } catch (error) {
          errback(error)
        }
      })
  
    })
  }
  

  const getProducers = (device) => {
    console.log("getproducer device ",device)
    socket.emit('getProducers', producerIds => {
      console.log({producerIds})
      // for each of the producer create a consumer
      // producerIds.forEach(id => signalNewConsumerTransport(id))
      producerIds.forEach((producerId) => {
        signalNewConsumerTransport({ remoteProducerId: producerId }, device);
      });
          })
  }

  const connectSendTransport = async () => {
    if (!producerTransport ) {
      console.log('Transport or video producer not ready.');
      return;
    }
if (!device.canProduce('video')) {
  console.error('Send transport cannot produce video');
  return;
}
    try {
      console.log(params2)
      console.log("producerTransport ",producerTransport)
      const newProducer = await producerTransport.produce(
        {track:videoProducer
       ,
      encodings:[
        { maxBitrate:  96000, scaleResolutionDownBy: 4 },
        { maxBitrate: 680000, scaleResolutionDownBy: 1 },
      ],
      appData: { mediaTag: 'cam-video' }

      });
      setProducer(newProducer);
      console.log("Producer ",newProducer)
      newProducer.on('trackended', () => console.log('Track ended.'));
      newProducer.on('transportclose', () => console.log('Transport closed.'));
    } catch (error) {
      console.error('Error connecting send transport:', error);
    }
  };
 
  const signalNewConsumerTransport = async ({remoteProducerId},device) => {
    //check if we are already consuming the remoteProducerId
    if (consumerTransport.includes(remoteProducerId)) return;
    consumerTransport.push(remoteProducerId);
    console.log(`id ${remoteProducerId}`)

    await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
      // The server sends back params needed 
      // to create Send Transport on the client side
      if (params.error) {
        console.log(params.error)
        return
      }
      console.log(`PARAMS... ${params}`)
  
      let consumerTrans
      
        console.log("device ",device)
        consumerTrans = device.createRecvTransport(params)
      
  
      consumerTrans.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-recv-connect', ...)
          await socket.emit('transport-recv-connect', {
            dtlsParameters,
            serverConsumerTransportId: params.id,
          })
  
          // Tell the transport that parameters were transmitted.
          callback()
        } catch (error) {
          // Tell the transport that something was wrong
          errback(error)
        }
      })
  
      connectRecvTransport(consumerTrans, remoteProducerId, params.id,device)
    })
  }


  const connectRecvTransport = async (consumerTrans, remoteProducerId, serverConsumerTransportId,device) => {
    // for consumer, we need to tell the server first
    // to create a consumer based on the rtpCapabilities and consume
    // if the router can consume, it will send back a set of params as below
    await socket.emit('consume', {
      rtpCapabilities: device.rtpCapabilities,
      remoteProducerId,
      serverConsumerTransportId,
    }, async ({ params }) => {
      if (params.error) {
        console.log('Cannot Consume')
        return
      }
  
      console.log(`Consumer Params ${{params}}`)
      // then consume with the local consumer transport
      // which creates a consumer
      try{
      let consumer = await consumerTrans.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      })
      

      //emit consumer-resume
      await new Promise((resolve, reject) => {
        socket.emit('consumer-resume', 
          { serverConsumerId: params.serverConsumerId }, 
          (resumeResponse) => {
            if (resumeResponse?.error) {
              reject(resumeResponse.error);
              return;
            }
            resolve("consumer-resume resolved");
          }
        );
      });

  
      // destructure and retrieve the video track from the producer
      let { track } = consumer
  console.log("track ",track)
  console.log("consumer ",{consumer})
  if(track.readyState!="live"){
    console.warn("The track isnt live")
  }
  const stream =new MediaStream([track])
  addParticipant(stream)
  setConsumerTransport((prev) => [
    ...prev,
    {
      serverConsumerTransportId: params.id,
      producerId: remoteProducerId,
      consumer,
    },
  ]);

     }
     catch(error){
      console.log("Error occured")
     }
     // the server consumer started with media paused
      // so we need to inform the server to resume
    })
  }
  
 


  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', isMuted: false, isCameraOff: false }
  ]);
  useEffect(() => {
    console.log("Participants after:", participants);
  }, [participants]);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Welcome to the meeting!', time: '10:00 AM' },
    { id: 2, sender: 'John', text: 'Hello everyone!', time: '10:01 AM' },
    { id: 3, sender: 'You', text: 'Hi John, good to see you!', time: '10:02 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const addParticipant = (stream) => {
    if (participants.length < 6) {
      setParticipants(prev => [
        ...prev,
        { 
          id: Date.now(),
          name: `User ${prev.length + 1}`,
          isMuted: false,
          isCameraOff: false,
          stream: stream
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

  const handleParticipantVideo = (participant, node) => {
    if (node) {
      console.log(`Handling video for participant ${participant.id}`);
      partVideoRef.current.set(participant.id, node);
      
      if (participant.stream) {
        node.srcObject = participant.stream;
        
        // Handle play promise to catch autoplay issues
        node.play().catch(error => {
          console.error('Video play failed:', error);
          // Show play button to user if needed
        });
      }
    } else {
      partVideoRef.current.delete(participant.id);
    }
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
    ) : participant?.id !== 1 ? (
<video
          ref={(node)=>{
            handleParticipantVideo(participant,node)
          }}
          autoPlay muted
          playsInline
          className="w-full h-full object-cover"
      />    ) : (
      <video
        src="/api/placeholder/640/360"
        alt={participant.name}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        ref={videoRef}
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