const fs=require('fs')
const path=require('path')
const mediasoup=require('mediasoup') // to use selective forwarding unit(SFU)
const Stream=require('../modal/streams')
const cors=require('cors')

const express=require('express')
const Router=express.Router()
const { Server } = require('socket.io');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000'],
  methods: ['GET', 'POST'],        
  credentials: true  
    },
  });
const rooms={};

//mediasoup setup 

let worker;
let router;

(async () => {
    worker = await mediasoup.createWorker(
 {     rtcMinPort: 2000,
      rtcMaxPort: 2020,  }
    );
    router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          payloadType: 100,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          payloadType: 101,
        }
      ],
      encodings: [
        {
          ssrc: Math.floor(Math.random() * 1000000000), // Ensure each encoding has a unique SSRC
          // Optional: Include additional parameters for simulcast
          // rid: 'send', // Only needed if you are using simulcast
          // mid: 'video' // Optional, but good to include for media identification
        }
      ],
    });
    console.log('Mediasoup worker and router created.');  
})();
async function createWebRtcTransport() {
  const transport = await router.createWebRtcTransport({
      listenIps: [
          { ip: '127.0.0.1', announcedIp: null } // You can adjust this based on your network
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 600000,
  });
  
  return transport;
}


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('getRtpCapabilities', (callback) => {
    if (router) {
      const rtpCapabilities = router.rtpCapabilities;
      console.log('RTP Capabilities:', rtpCapabilities);
      callback({ rtpCapabilities });
    } else {
      console.error('Router not ready');
      callback({ error: 'Router not ready' });
    }
  });

  // Handle joining a room
  socket.on('join-room',async (roomId,name,description) => {
    console.log("joining process inititated")
    if (!rooms[roomId]) {
      rooms[roomId] = {
          producers: [], 
          consumers: [],
      };
      const stream=new Stream({
        name:name,
        description:description,
        room:room
      })
      const result=await stream.save();
      console.log("room saved")
      console.log(`Room created: ${roomId}`);
  }
  socket.join(roomId);
  console.log(`Client ${socket.id} joined room: ${roomId}`);
  
  // Notify other clients in the room
  // socket.to(roomId).emit('user-connected', socket.id); //unnecessary
  })

  // Handle transport creation and media streaming
  console.log("Transport creation underway ")
  socket.on('create-transport', async (callback) => {
      const transport = await createWebRtcTransport();
      callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
      });

      // Connect transport
      socket.on('connect-transport', async (dtlsParameters ) => {
        console.log('DTLS Parameters:', dtlsParameters); 
          await transport.connect( {dtlsParameters} );
      });

      // Handle track sending
     // Handle track sending
socket.on('send-track', async (track,room,name,description) => {
  console.log("Track: ", track);

  const { id, kind, label, enabled, muted, readyState, stats,rtp } = track;

  console.log("RTP: ", rtp);
  const upd=rtp.codecs.find(item=>item.kind===kind)
  rtp.codec=upd
  rtp.codecs.forEach((codec)=>{
    codec.payloadType=codec.preferredPayloadType
  })
  rtp.headerExtensions.forEach((item)=>{
    item.id=item.preferredId
  })
  rtp.encodings= [
    {
      ssrc: Math.floor(Math.random() * 1000000000), // Ensure each encoding has a unique SSRC
      // Optional: Include additional parameters for simulcast
      // rid: 'send', // Only needed if you are using simulcast
      // mid: 'video' // Optional, but good to include for media identification
    }
  ]
  console.log("RTP: ", rtp);

  try {
      // Create the producer using the rtp parameters
      const producer = await transport.produce({
        kind:kind,
        rtpParameters	:rtp,
          track: track,
          codec:rtp.codecs // Pass the MediaStreamTrack directly
        
      });

      rooms[room].producers.push(producer); // Store producer in the room
      console.log('Producer created:', producer.id);
      

      // Notify other clients in the room
      // Uncomment the line below to notify clients
      // socket.to(roomId).emit('new-producer', producer.id);
  } catch (error) {
      console.error('Error creating producer:', error);
  }
});

      // Handle receiving streams
      socket.on('receive-streams', async (callback,room) => {
        console.log("working")
        const transportOptions = {
          listenIps: [{ ip: '192.168.29.31', announcedIp: null }], 
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          initialAvailableOutgoingBitrate: 600000,
      };
      console.log("transport options: ",transportOptions)
          const consumerInfos = await Promise.all(
              rooms[room].producers.map(async (producer) => {
                  const consumerTransport = await createWebRtcTransport();
                  const consumer = await consumerTransport.consume({
                      producerId: producer.id,
                      rtpCapabilities: router.rtpCapabilities,
                  });
                  console.log(room)
                  console.log(consumer)
                  rooms[room].consumers.push(consumer);
                  console.log("consumer created")
                  return {
                      id: consumer.id,
                      producerId: producer.id,
                      kind: consumer.kind,
                      rtpParameters: consumer.rtpParameters,
                  };
              })
          );

          callback(consumerInfos);
  })});

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    
    // Remove user from the rooms they are in
    // for (const roomId in rooms) {
    //   const room = rooms[roomId];
    //   room.users = room.users.filter((user) => user !== socket.id);
    //   io.to(roomId).emit('user-left', { userId: socket.id, roomId });

    //   if (room.users.length === 0) {
    //     // Remove room if empty
    //     delete rooms[roomId];
    //     console.log(`Room ${roomId} deleted because it is empty`);
    //   }
    // }
  });
});}


module.exports=setupSocket




// Router.post('/stream',(req,res)=>{
//     const path=req.body.path;
//     const stat=fs.statSync(path)
//     const filesize=stat.size
//     const range = req.headers.range;
//     if(range){
//         const parts = range.replace(/bytes=/, "").split("-")
//         const start = parseInt(parts[0], 10);
//         const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
//         const file = fs.createReadStream(path, { start, end });
//         const headers = {
//             'Content-Range': `bytes ${start}-${end}/${totalSize}`,
//             'Accept-Ranges': 'bytes',
//             'Content-Length': chunkSize,
//             'Content-Type': 'video/mp4',
//           };
//         res.writeHead(206,headers)
//         file.pipe(res);
//     }
//     else {
//         const headers = {
//           'Content-Length': videoSize,
//           'Content-Type': 'video/mp4',
//         };
//         res.writeHead(200, headers);
//         fs.createReadStream(videoPath).pipe(res);
//       }
// })

// Router.post('/create-room',async (req,res)=>{
//   console.log(req.body)
//   const {name,description,roomId}=req.body;
//   try{
//     if (rooms[roomId]) {
//       return res.status(400).json({ message: 'Room already exists' });
//     }
//     const stream=new Stream({
//       name:name,
//       description:description,
//       room:roomId
//     })
//     const result=await stream.save();
//     console.log(result)
//     if(result){
//     rooms[roomId] = { users: [] };
//     console.log(`Room ${roomId} created`);
  
//     // Emit an event to clients to inform that a new room is created
//     io.emit('broadcaster', roomId);
  
//     return res.status(200).json({ message: `Room ${roomId} created successfully`,stream:result });
//     }
//   }
//   catch(error){
//     console.log("error occured: ",error )
//   }
// })


