const fs=require('fs')
const path=require('path')
const Stream=require('../modal/streams')

const express=require('express')
const Router=express.Router()
const http=require('http')
const { Server } = require('socket.io');

const server = http.createServer(Router);
const io = new Server(server);

const rooms={};

Router.post('/stream',(req,res)=>{
    const path=req.body.path;
    const stat=fs.statSync(path)
    const filesize=stat.size
    const range = req.headers.range;
    if(range){
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
        const file = fs.createReadStream(path, { start, end });
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
          };
        res.writeHead(206,headers)
        file.pipe(res);
    }
    else {
        const headers = {
          'Content-Length': videoSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, headers);
        fs.createReadStream(videoPath).pipe(res);
      }
})

Router.post('/create-room',async (req,res)=>{
  console.log(req.body)
  const {name,description,roomId}=req.body;
  try{
    if (rooms[roomId]) {
      return res.status(400).json({ message: 'Room already exists' });
    }
    const stream=new Stream({
      name:name,
      description:description,
      room:roomId
    })
    const result=await stream.save();
    console.log(result)
    if(result){
    rooms[roomId] = { users: [] };
    console.log(`Room ${roomId} created`);
  
    // Emit an event to clients to inform that a new room is created
    io.emit('broadcaster', roomId);
  
    return res.status(200).json({ message: `Room ${roomId} created successfully`,stream:result });
    }
  }
  catch(error){
    console.log("error occured: ",error )
  }
})

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].users.push(socket.id);

      // Inform the room that a new user has joined
      io.to(roomId).emit('user-joined', { userId: socket.id, roomId });
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      console.log('Room does not exist');
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    
    // Remove user from the rooms they are in
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.users = room.users.filter((user) => user !== socket.id);
      io.to(roomId).emit('user-left', { userId: socket.id, roomId });

      if (room.users.length === 0) {
        // Remove room if empty
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted because it is empty`);
      }
    }
  });
});


module.exports=Router