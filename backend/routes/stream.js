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

//mediasoup setup 

let worker
let rooms = {}          // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
let peers = {}          // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
let producerTransport;
let consumerTransport;

//function to handle creation and destruction of a worker

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 2000,
    rtcMaxPort: 2020,
  })
  console.log(`worker pid ${worker.pid}`)

  worker.on('died', error => {
    console.error('mediasoup worker has died')
    setTimeout(() => process.exit(1), 2000) 
  })

  return worker
}

//worker instance

worker = createWorker();

// Media Codecs

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
]



io.on('connection', (socket) => {
  let router
  socket.on('create-room', async (roomName, callback) => {
    try {
      if (rooms[roomName]) {
        console.log(`Room ${roomName} already exists.`);
        return callback({ success: true, routerRtpCapabilities: rooms[roomName].router.rtpCapabilities });
      }

      const router = await worker.createRouter({ mediaCodecs });
      rooms[roomName] = {
        router,
        peers: [socket.id],
      };

      console.log(`Room ${roomName} created with Router ID: ${router.id}`);
      callback({ success: true, routerRtpCapabilities: router.rtpCapabilities });
    } catch (error) {
      console.error(`Error creating room: ${error}`);
      callback({ success: false, error: 'Failed to create room' });
    }
  });
  
  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    console.log(`Is this a sender request? ${sender}`);
    try {
      const transport = await createWebRtcTransport(callback);
      callback({
        success: true,
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });
      if (sender) {
        producerTransport = transport;
      } else {
        consumerTransport = transport;
      }
    } catch (error) {
      console.error('Error creating transport:', error);
      callback({ success: false, error: 'Failed to create transport' });
    }
  });
  

  async function createWebRtcTransport(callback) {
    try{
const options={
  listenIps:[
    {
      ip: '0.0.0.0',
    }
  ],
  enableUdp:true,
  enableTcp:true,
  preferUdp:true
}
let transport=await worker.createWebRtcTransport(options);
transport.on('dtlsstatechange',dtlsState=>{
  if(dtlsState==='closed'){
    transport.close()
  }
})
transport.on('close',()=>{
  console.log('transport closed')
})


callback({
  params:{
    id:transport.id,
    iceParameters:transport.iceParameters,
    iceCandidates:transport.iceCandidates,
    dtlsParameters:transport.dtlsParameters
  }
})
return transport;
    }catch(error){
      console.error(`Error creating transport: ${error}`);
      callback({ success: false, error: 'Failed to create transport' });
    }
  }

  socket.emit('connection-success', {
    socketId: socket.id,
  })

  const removeItems = (items, socketId, type) => {
    items.forEach(item => {
      if (item.socketId === socketId) {
        item[type].close()
      }
    })
    items = items.filter(item => item.socketId !== socketId)

    return items
  }

  socket.on('disconnect', () => {
    console.log('peer disconnected')

  })

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



//add transport 
// const addTransport = (transport, roomName, consumer) => {

//   transports = [
//     ...transports,
//     { socketId: socket.id, transport, roomName, consumer, }
//   ]

//   peers[socket.id] = {
//     ...peers[socket.id],
//     transports: [
//       ...peers[socket.id].transports,
//       transport.id,
//     ]
//   }
// }


// socket.on('getProducers', callback => {
//   //return all producer transports
//   const { roomName } = peers[socket.id]

//   let producerList = []
//   producers.forEach(producerData => {
//     if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
//       producerList = [...producerList, producerData.producer.id]
//     }
//   })

//   // return the producer list back to the client
//   callback(producerList)
// })




      // Handle receiving streams
      socket.on('receive-streams', async (room,callback) => {
        console.log("working")
        const transportOptions = {
          listenIps: [{ ip: '192.168.29.31', announcedIp: null }], 
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          initialAvailableOutgoingBitrate: 600000,
      };
      console.log("transport options: ",transportOptions)
      console.log("room consume ",room)
      console.log(rooms)
          const consumerInfos = await Promise.all(
              rooms[room].producers.map(async (producer) => {
                  const consumerTransport = await createWebRtcTransport();
                  const consumer = await consumerTransport.consume({
                      producerId: producer.id,
                      rtpCapabilities: router.rtpCapabilities,
                  });
                  console.log(rooms)
                  console.log(consumer)
                  rooms[room].consumers.push(consumer);
                  console.log("consumer created")
                  return {
                      id: consumer.id,
                      producerId: producer.id,
                      kind: consumer.kind,
                      rtpParameters: consumer.rtpParameters,
                      // sdp: rtcPeerConnection.localDescription.sdp,
                      // type: rtcPeerConnection.localDescription.type
                  };
              })
          );

          callback(consumerInfos);
  })

  
    
    
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


