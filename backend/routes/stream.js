const fs=require('fs')
const path=require('path')
const cors=require('cors')
const axios = require('axios');
const express=require('express')
const Router=express.Router()
const { Server } = require('socket.io');
const parser=require('ua-parser-js')

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000'],
  methods: ['GET', 'POST'],        
  credentials: true  
    },
  }); 

   const generateUUID = () =>{
         return [2, 1, 1, 1, 3].map(s4 => Math.random().toString(16).slice(2, 2 + s4)).join('-');
  }

  const getDeviceInfo = (socket) => {
    const uaString = socket?.request?.headers?.['user-agent'];
    const ua = parser(uaString || ''); // Parse the user-agent string

    return {
        model: ua.device.model || 'Unknown',
        os: ua.os.name || 'Unknown',
        browser: ua.browser.name || 'Unknown',
        type: ua.device.type || 'Unknown'
    };
};
  
  const hashString = (text) => {
          let hash = 5381;
          for (let i = 0; i < text.length; i++) {
              hash = (hash * 33) ^ text.charCodeAt(i);
          }
          return hash >>> 0;
      };
  
  const getClientIP = (socket) => {
          const headers = socket?.request?.headers;
          return headers?.['x-forwarded-for'] || socket?.request?.connection?.remoteAddress || 'unknown';
      };

// mapping for socket to email and email to socket as well
const mapSocket=new Map();
const mapEmail=new Map();

  io.on('connection',(socket)=>{
    socket.uuidRaw = generateUUID();
    socket.hashedIp = hashString(getClientIP(socket));
    socket.deviceName = getDeviceInfo(socket);
    
    console.log("User joined ",socket.id)

    socket.on('room-join',(data)=>{
        const {userEmail,room}=data
        console.log("email ",userEmail, "room ",room)
        console.log("adding to map")
        mapSocket.set(socket.id,userEmail)
        mapEmail.set(userEmail,socket.id)
        socket.join(room)
        io.to(socket.id).emit("room-join", data); 
        console.log("done")
      })
    
    socket.on('otheroom-join',(data)=>{
      const {userEmail,roomCode,name}=data
      console.log("email ",userEmail, "room ",roomCode, "name",name)
      if(!io.sockets.adapter.rooms.has(roomCode)){
        console.log("Room doesn't exists ")
        io.to(socket.id).emit("otherroom-join", { message: "invalid room" } ); 
      }
      else{
        io.to(roomCode).emit('otheroom-join',{email:userEmail,id:socket.id,name:name}) // Notifying people in room about new person in meeting
        io.to(socket.id).emit("otheroom-join", data); 
        socket.join(roomCode)
        console.log("done 2")
      }
    })

    socket.on("user-call", ({ remoteSocketId, offer,name }) => {
      console.log("user calling ", remoteSocketId, offer,name);
      io.to(remoteSocketId).emit("incoming-call", { from: socket.id, offer , name });
    });

    socket.on("call-accepted", ({ to, ans }) => {
      console.log("call accepted ",to,ans)
      io.to(to).emit("call-accepted", { from: socket.id, ans });
    });
  
    socket.on("peer-nego-needed", ({ to, offer }) => {
      console.log("peer-nego-needed", offer);
      io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
    });
  
    socket.on("peer-nego-done", ({ to, ans }) => {
      console.log("peer-nego-done", ans);
      io.to(to).emit("peer-nego-final", { from: socket.id, ans });
    });



    const fileChunks = new Map();

socket.on("send-chunk", (data) => {
    const { recipient, fileName, fileSize, chunk, offset } = data;
    const targetSocket = io.sockets.sockets.get(recipient);

    if (targetSocket) {
        if (!fileChunks.has(fileName)) {
            fileChunks.set(fileName, []);
        }
        
        fileChunks.get(fileName).push(chunk);

        console.log(`Received chunk ${offset} for file ${fileName}`);

        // Forward chunk to recipient
        targetSocket.emit("receive-chunk", { fileName, fileSize, chunk, offset });

    } else {
        console.log(`Recipient ${recipient} not found`);
    }
});

socket.on("file-transfer-complete", (data) => {
    const { recipient, fileName } = data;
    const targetSocket = io.sockets.sockets.get(recipient);
    
    if (targetSocket) {
        targetSocket.emit("file-transfer-complete", { fileName });
        console.log(`File transfer completed: ${fileName}`);
    }
});

  
  

      const notifyBuddies = () => {
        const locations = {};
    
        // Group clients by public IP
        io.sockets.sockets.forEach((client) => {
            const ip = client.hashedIp;
            if (!locations[ip]) locations[ip] = [];
            locations[ip].push({
                socket: client,
                contact: {
                  socketId: client.id,
                    peerId: client.uuidRaw,
                    name: client.name || client.deviceName,
                    device: client.name ? client.deviceName : undefined,
                },
            });
        });
    
        // Notify each group
        Object.values(locations).forEach((clientsInLocation) => {
            clientsInLocation.forEach((client) => {
                const buddies = clientsInLocation
                    .filter((other) => other !== client)
                    .map((other) => other.contact);
    
                const newState = hashString(JSON.stringify(buddies));
                if (newState !== client.socket.lastState) {
                    client.socket.emit("buddies", {
                        buddies,
                        isSystemEvent: true,
                        type: "buddies",
                    });
                    client.socket.lastState = newState;
                }
            });
        });
    };
    
    // Run every 3 seconds
    setInterval(notifyBuddies, 3000);
    
});
};

module.exports = setupSocket;