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
let transports = []     // [ { socketId1, roomName1, transport, consumer }, ... ]
let producers = []      // [ { socketId1, roomName1, producer, }, ... ]
let consumers = []      // [ { socketId1, roomName1, consumer, }, ... ]


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

worker = createWorker();

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
    consumers = removeItems(consumers, socket.id, 'consumer')
    producers = removeItems(producers, socket.id, 'producer')
    transports = removeItems(transports, socket.id, 'transport')

    const { roomName } = peers[socket.id]
    delete peers[socket.id]

    rooms[roomName] = {
      router: rooms[roomName].router,
      peers: rooms[roomName].peers.filter(socketId => socketId !== socket.id)
    }
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

//Room Creation Function
const createRoom = async (roomName, socketId) => {
  // worker.createRouter(options)
  // options = { mediaCodecs, appData }
  // mediaCodecs -> defined above
  // appData -> custom application data - we are not supplying any
  // none of the two are required
  let router1
  let peers = []
  if (rooms[roomName]) {
    router1 = rooms[roomName].router
    peers = rooms[roomName].peers || []
  } else {
    router1 = await worker.createRouter({ mediaCodecs, })
  }
  
  console.log(`Router ID: ${router1.id}`, peers.length)

  rooms[roomName] = {
    router: router1,
    peers: [...peers, socketId],
  }

  return router1
}


  // Handle joining a room
  socket.on('joinRoom', async ({ roomName }, callback) => {

    const router1 = await createRoom(roomName, socket.id)

    peers[socket.id] = {
      socket,
      roomName,           // Name for the Router this Peer joined
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: {
        name: '',
        isAdmin: false,   // Is this Peer the Admin?
      }
    }

    // get Router RTP Capabilities
    const rtpCapabilities = router1.rtpCapabilities
    callback({ rtpCapabilities })
    
  })


  // Handle transport creation and media streaming
  console.log("Transport creation underway ")
  socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
    // get Room Name from Peer's properties
    const roomName = peers[socket.id].roomName

    // get Router (Room) object this peer is in based on RoomName
    const router = rooms[roomName].router


    createWebRtcTransport(router).then(
      transport => {
        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          }
        })

        // add transport to Peer's properties
        addTransport(transport, roomName, consumer)
      },
      error => {
        console.log(error)
      })
  })

//add transport 
const addTransport = (transport, roomName, consumer) => {

  transports = [
    ...transports,
    { socketId: socket.id, transport, roomName, consumer, }
  ]

  peers[socket.id] = {
    ...peers[socket.id],
    transports: [
      ...peers[socket.id].transports,
      transport.id,
    ]
  }
}

  // add the producer to the producers list

const addProducer = (producer, roomName) => {
  producers = [
    ...producers,
    { socketId: socket.id, producer, roomName, }
  ]

  peers[socket.id] = {
    ...peers[socket.id],
    producers: [
      ...peers[socket.id].producers,
      producer.id,
    ]
  }
}

const addConsumer = (consumer, roomName) => {
  // add the consumer to the consumers list
  consumers = [
    ...consumers,
    { socketId: socket.id, consumer, roomName, }
  ]

  // add the consumer id to the peers list
  peers[socket.id] = {
    ...peers[socket.id],
    consumers: [
      ...peers[socket.id].consumers,
      consumer.id,
    ]
  }
}


socket.on('getProducers', callback => {
  //return all producer transports
  const { roomName } = peers[socket.id]

  let producerList = []
  producers.forEach(producerData => {
    if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
      producerList = [...producerList, producerData.producer.id]
    }
  })

  // return the producer list back to the client
  callback(producerList)
})




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


