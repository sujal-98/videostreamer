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
    worker = await mediasoup.createWorker();
    router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000
        }
      ]
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

  // Handle joining a room
  socket.on('join-room',async (roomId,name,description) => {
    console.log("joining process inititated")
    if (!rooms[roomId]) {
      rooms[roomId] = {
          producers: [],
          consumers: [],
      };
      console.log(`Room created: ${roomId}`);
  }
  socket.join(roomId);
  console.log("console joined the room")
  console.log(`Client ${socket.id} joined room: ${roomId}`);
  const stream=new Stream({
    name:name,
    description:description,
    room:roomId
  })
  const result=await stream.save();
  console.log("room saved")
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
      // socket.on('connect-transport', async ({ dtlsParameters }) => {
      //     await transport.connect({ dtlsParameters });
      // });

      // Handle track sending
      socket.on('send-track', async ({ track }) => {
          const producer = await transport.produce({ track });
          rooms[roomId].producers.push(producer); // Store producer in the room
          console.log('Producer created:', producer.id);

          // Notify other clients in the room
          // socket.to(roomId).emit('new-producer', producer.id);
      });

      // Handle receiving streams
      socket.on('receive-streams', async (callback) => {
        const transportOptions = {
          listenIps: [{ ip: '192.168.29.31', announcedIp: null }], 
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          initialAvailableOutgoingBitrate: 600000,
      };
          const consumerInfos = await Promise.all(
              rooms[roomId].producers.map(async (producer) => {
                  const consumerTransport = await createWebRtcTransport();
                  const consumer = await consumerTransport.consume({
                      producerId: producer.id,
                      rtpCapabilities: router.rtpCapabilities,
                  });
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


