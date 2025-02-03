// const fs=require('fs')
// const path=require('path')
// const mediasoup=require('mediasoup') // to use selective forwarding unit(SFU)
// const Stream=require('../modal/streams')
// const cors=require('cors')
// const axios = require('axios');
// const express=require('express')
// const Router=express.Router()
// const { Server } = require('socket.io');

// const setupSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: ['http://localhost:3000'],
//   methods: ['GET', 'POST'],        
//   credentials: true  
//     },
//   });

// //mediasoup setup 

// let worker
// let rooms = {}          // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
// let peers = {}          // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
// let transports = []     // [ { socketId1, roomName1, transport, consumer }, ... ]
// let producers = []      // [ { socketId1, roomName1, producer, }, ... ]
// let consumers = []  

// //function to handle creation and destruction of a worker

// const createWorker = async () => {
//   worker = await mediasoup.createWorker({
//     rtcMinPort: 2000,
//     rtcMaxPort: 2020,
//   })
//   console.log(`worker pid ${worker.pid}`)

//   worker.on('died', error => {
//     console.error('mediasoup worker has died')
//     setTimeout(() => process.exit(1), 2000) 
//   })

//   return worker
// }

// //worker instance

// worker = createWorker();

// // Media Codecs

// const mediaCodecs = [
//   {
//     kind: 'audio',
//     mimeType: 'audio/opus',
//     clockRate: 48000,
//     channels: 2,
//   },
//   {
//     kind: 'video',
//     mimeType: 'video/VP8',
//     clockRate: 90000,
//     parameters: {
//       'x-google-start-bitrate': 1000,
//     },
//     preferredPayloadType: 101,
//     rtcpFeedback: [
// {type: 'nack', parameter: ''}, 
// {type: 'nack', parameter: 'pli'},
// {type: 'ccm', parameter: 'fir'} ,
// {type: 'goog-remb', parameter: ''},
// {type: 'transport-cc', parameter: ''}]
//   },

//   {
//     kind: 'video',
//     mimeType: 'video/H264',
//     clockRate: 90000,
//     parameters:{
//       'packetization-mode': 1,
//       'profilid': '42e01fe-level-',
//       'level-asymmetry-allowed': 1,
//     } 
//   }
// ]



// io.on('connection', (socket) => {

//   //joining / creating a room
//   socket.on('joinRoom',  async (roomName, callback) => {
//     // create Router if it does not exist
//     // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
//     const router1 = await createRoom(roomName, socket.id)
//     console.log("roomName", roomName)
//     peers[socket.id] = {
//       socket,
//       roomName,         
//       transports: [],
//       producers: [],
//       consumers: [],
//       peerDetails: {
//         name: '',
//         isAdmin: false,
//       }
//     }
// console.log(router1.rtpCapabilities)
//     // get Router RTP Capabilities
//     const rtpCapabilities = router1.rtpCapabilities

//     // call callback from the client and send back the rtpCapabilities
//     callback({ rtpCapabilities })
//   })

//   //helping in join-room event
//   const createRoom = async (roomName, socketId) => {
   
//     let router1
//     let peers = []
//     if (rooms[roomName]) {
//       router1 = rooms[roomName].router
//       peers = rooms[roomName].peers || []
//     } else {
//       router1 = await worker.createRouter({ mediaCodecs })
//     }
    
//     console.log(`Router ID: ${router1.id}`, peers.length)

//     rooms[roomName] = {
//       router: router1,
//       peers: [...peers, socketId],
//     }

//     return router1
//   }

  
//   socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
//     // get Room Name from Peer's properties
//     const roomName = peers[socket.id].roomName

//     // get Router (Room) object this peer is in based on RoomName
//     const router = rooms[roomName].router


//     createWebRtcTransport(router).then(
//       transport => {
//         callback({
//           params: {
//             id: transport.id,
//             iceParameters: transport.iceParameters,
//             iceCandidates: transport.iceCandidates,
//             dtlsParameters: transport.dtlsParameters,
//           }
//         })

//         // add transport to Peer's properties
//         console.log("add transport")
//         addTransport(transport, roomName, consumer)
//       },
//       error => {
//         console.log(error)
//       })
//   })

//   const addTransport = (transport, roomName, consumer) => {

//     transports = [
//       ...transports,
//       { socketId: socket.id, transport, roomName, consumer, }
//     ]

//     peers[socket.id] = {
//       ...peers[socket.id],
//       transports: [
//         ...peers[socket.id].transports,
//         transport.id,
//       ]
//     }
//   }

//   const addProducer = (producer, roomName) => {
//     producers = [
//       ...producers,
//       { socketId: socket.id, producer, roomName, }
//     ]

//     peers[socket.id] = {
//       ...peers[socket.id],
//       producers: [
//         ...peers[socket.id].producers,
//         producer.id,
//       ]
//     }
//   }

//   const addConsumer = (consumer, roomName) => {
//     // add the consumer to the consumers list
//     consumers = [
//       ...consumers,
//       { socketId: socket.id, consumer, roomName, }
//     ]

//     // add the consumer id to the peers list
//     peers[socket.id] = {
//       ...peers[socket.id],
//       consumers: [
//         ...peers[socket.id].consumers,
//         consumer.id,
//       ]
//     }
//   }

//   socket.on('getProducers', callback => {
//     //return all producer transports
//     const { roomName } = peers[socket.id]

//     let producerList = []
//     producers.forEach(producerData => {
//       if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
//         producerList = [...producerList, producerData.producer.id]
//       }
//     })
//     console.log("The Producer List is ", producerList)
//     // return the producer list back to the client
//     callback(producerList)
//   })

//   const informConsumers = (roomName, socketId, id) => {
//     console.log(`just joined, id ${id} ${roomName}, ${socketId}`)
//     // A new producer just joined
//     // let all consumers to consume this producer
//     producers.forEach(producerData => {
//       if (producerData.socketId !== socketId && producerData.roomName === roomName) {
//         const producerSocket = peers[producerData.socketId].socket
//         // use socket to send producer id to producer
//         producerSocket.emit('new-producer', { producerId: id })
//       }
//     })
//   }

//   const getTransport = (socketId) => {
//     const [producerTransport] = transports.filter(transport => transport.socketId === socketId && !transport.consumer)
//     console.log("get transport ",producerTransport)
//     return producerTransport.transport
//   }

//   // see client's socket.emit('transport-connect', ...)
//   socket.on('transport-connect', ({ dtlsParameters }) => {
//     console.log('socket id ', socket.id)
    
//     getTransport(socket.id).connect({ dtlsParameters })
//   })

//   // see client's socket.emit('transport-produce', ...)
//   socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
//     // call produce based on the prameters from the client
//     const producer = await getTransport(socket.id).produce({
//       kind,
//       rtpParameters,
//     })

//     // add producer to the producers array
//     const { roomName } = peers[socket.id]

//     addProducer(producer, roomName)

//     informConsumers(roomName, socket.id, producer.id)

//     console.log('Producer ID: ', producer.id, producer.kind)

//     producer.on('transportclose', () => {
//       console.log('transport for this producer closed ')
//       producer.close()
//     })

//     // Send back to the client the Producer's id
//     callback({
//       id: producer.id,
//       producersExist: producers.length>1 ? true : false
//     })
//   })


  
  
//   socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
//     console.log(`transport-recv-connect`)
//     const newconsumerTransport = transports.find(transportData => (
//       transportData.consumer && transportData.transport.id == serverConsumerTransportId
//     )).transport
//     await newconsumerTransport.connect({ dtlsParameters })
//   })

//   socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
//     try {

//       const { roomName } = peers[socket.id]
//       const router = rooms[roomName].router
//       let consumerTransport = transports.find(transportData => (
//         transportData.consumer && transportData.transport.id == serverConsumerTransportId
//       )).transport
      
//       console.log("consumer Transport ",consumerTransport)

//       // check if the router can consume the specified producer
//       if (router.canConsume({
//         producerId: remoteProducerId,
//         rtpCapabilities
//       })) {
//         // transport can now consume and return a consumer
//         const consumer = await consumerTransport.consume({
//           producerId: remoteProducerId,
//           rtpCapabilities,
//           paused: true,
//         })

//         consumer.on('transportclose', () => {
//           console.log('transport close from consumer')
//         })

//         consumer.on('producerclose', () => {
//           console.log('producer of consumer closed')
//           socket.emit('producer-closed', { remoteProducerId })

//           consumerTransport.close([])
//           transports = transports.filter(transportData => transportData.transport.id !== consumerTransport.id)
//           consumer.close()
//           consumers = consumers.filter(consumerData => consumerData.consumer.id !== consumer.id)
//         })

//         addConsumer(consumer, roomName)

//         // from the consumer extract the following params
//         // to send back to the Client
//         const params = {
//           id: consumer.id,
//           producerId: remoteProducerId,
//           kind: consumer.kind,
//           rtpParameters: consumer.rtpParameters,
//           serverConsumerId: consumer.id,
//         }

//         // send the parameters to the client
//         callback({ params })
//       }
//     } catch (error) {
//       console.log(error.message)
//       callback({
//         params: {
//           error: error
//         }
//       })
//     }
//   })

//   socket.on('consumer-resume', async ({ serverConsumerId },callback) => {
//     console.log('consumer resume')
//     const { consumer } = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId)
//     console.log("consumer ",consumer)
//     try {
//       await consumer.resume();
//       callback({ success: true });
//   } catch (error) {
//       console.error("Error resuming consumer:", error);
//       callback({ error: "Failed to resume consumer" }); 
//   }
//   })



// //create webrtctransport
// const createWebRtcTransport = async (router) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
//       const publicIP = await axios.get('https://api.ipify.org?format=json').then(res => res.data.ip);
//       console.log("publicip ",publicIP)
//       const webRtcTransport_options = {
//         listenIps: [
//           {
//             ip: '0.0.0.0', // replace with relevant IP address
//             announcedIp: publicIP, // replace with relevant IP address
//           }
//         ],
//         enableUdp: true,
//         enableTcp: true,
//         preferUdp: true,
//       }

//       // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
//       let transport = await router.createWebRtcTransport(webRtcTransport_options)
//       console.log(`transport id: ${transport.id}`)

//       transport.on('dtlsstatechange', dtlsState => {
//         if (dtlsState === 'closed') {
//           transport.close()
//         }
//       })

//       transport.on('close', () => {
//         console.log('transport closed')
//       })

//       resolve(transport)

//     } catch (error) {
//       reject(error)
//     }
//   })
// }

//   socket.emit('connection-success', {
//     socketId: socket.id,
//   })

//   // const removeItems = (items, socketId, type) => {
//   //   items.forEach(item => {
//   //     if (item.socketId === socketId) {
//   //       item[type].close()
//   //     }
//   //   })
//   //   items = items.filter(item => item.socketId !== socketId)

//   //   return items
//   // }

 
//   // socket.on('disconnect', () => {
//   //   console.log('peer disconnected')

//   // })




// //add transport 
// // const addTransport = (transport, roomName, consumer) => {

// //   transports = [
// //     ...transports,
// //     { socketId: socket.id, transport, roomName, consumer, }
// //   ]

// //   peers[socket.id] = {
// //     ...peers[socket.id],
// //     transports: [
// //       ...peers[socket.id].transports,
// //       transport.id,
// //     ]
// //   }
// // }


// // socket.on('getProducers', callback => {
// //   //return all producer transports
// //   const { roomName } = peers[socket.id]

// //   let producerList = []
// //   producers.forEach(producerData => {
// //     if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
// //       producerList = [...producerList, producerData.producer.id]
// //     }
// //   })

// //   // return the producer list back to the client
// //   callback(producerList)
// // })




//       // Handle receiving streams
//   //     socket.on('receive-streams', async (room,callback) => {
//   //       console.log("working")
//   //       const transportOptions = {
//   //         listenIps: [{ ip: '192.168.29.31', announcedIp: null }], 
//   //         enableUdp: true,
//   //         enableTcp: true,
//   //         preferUdp: true,
//   //         initialAvailableOutgoingBitrate: 600000,
//   //     };
//   //     console.log("transport options: ",transportOptions)
//   //     console.log("room consume ",room)
//   //     console.log(rooms)
//   //         const consumerInfos = await Promise.all(
//   //             rooms[room].producers.map(async (producer) => {
//   //                 const consumerTransport = await createWebRtcTransport();
//   //                 const consumer = await consumerTransport.consume({
//   //                     producerId: producer.id,
//   //                     rtpCapabilities: router.rtpCapabilities,
//   //                 });
//   //                 console.log(rooms)
//   //                 console.log(consumer)
//   //                 rooms[room].consumers.push(consumer);
//   //                 console.log("consumer created")
//   //                 return {
//   //                     id: consumer.id,
//   //                     producerId: producer.id,
//   //                     kind: consumer.kind,
//   //                     rtpParameters: consumer.rtpParameters,
//   //                     // sdp: rtcPeerConnection.localDescription.sdp,
//   //                     // type: rtcPeerConnection.localDescription.type
//   //                 };
//   //             })
//   //         );

//   //         callback(consumerInfos);
//   // })

  
    
    
// });}


// module.exports=setupSocket




// // Router.post('/stream',(req,res)=>{
// //     const path=req.body.path;
// //     const stat=fs.statSync(path)
// //     const filesize=stat.size
// //     const range = req.headers.range;
// //     if(range){
// //         const parts = range.replace(/bytes=/, "").split("-")
// //         const start = parseInt(parts[0], 10);
// //         const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
// //         const file = fs.createReadStream(path, { start, end });
// //         const headers = {
// //             'Content-Range': `bytes ${start}-${end}/${totalSize}`,
// //             'Accept-Ranges': 'bytes',
// //             'Content-Length': chunkSize,
// //             'Content-Type': 'video/mp4',
// //           };
// //         res.writeHead(206,headers)
// //         file.pipe(res);
// //     }
// //     else {
// //         const headers = {
// //           'Content-Length': videoSize,
// //           'Content-Type': 'video/mp4',
// //         };
// //         res.writeHead(200, headers);
// //         fs.createReadStream(videoPath).pipe(res);
// //       }
// // })

// // Router.post('/create-room',async (req,res)=>{
// //   console.log(req.body)
// //   const {name,description,roomId}=req.body;
// //   try{
// //     if (rooms[roomId]) {
// //       return res.status(400).json({ message: 'Room already exists' });
// //     }
// //     const stream=new Stream({
// //       name:name,
// //       description:description,
// //       room:roomId
// //     })
// //     const result=await stream.save();
// //     console.log(result)
// //     if(result){
// //     rooms[roomId] = { users: [] };
// //     console.log(`Room ${roomId} created`);
  
// //     // Emit an event to clients to inform that a new room is created
// //     io.emit('broadcaster', roomId);
  
// //     return res.status(200).json({ message: `Room ${roomId} created successfully`,stream:result });
// //     }
// //   }
// //   catch(error){
// //     console.log("error occured: ",error )
// //   }
// // })


