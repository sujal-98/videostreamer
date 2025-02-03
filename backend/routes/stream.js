const fs=require('fs')
const path=require('path')
const cors=require('cors')
const axios = require('axios');
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

// mapping for socket to email and email to socket as well
const mapSocket=new Map();
const mapEmail=new Map();

  io.on('connection',(socket)=>{
    
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
      const {userEmail,roomCode}=data
      console.log("email ",userEmail, "room ",roomCode)
      if(!io.sockets.adapter.rooms.has(roomCode)){
        console.log("Room doesn't exists ")
        io.to(socket.id).emit("otherroom-join", { message: "invalid room" } ); 
      }
      else{
        io.to(roomCode).emit('otheroom-join',{email:userEmail,id:socket.id}) // Notifying people in room about new person in meeting
        io.to(socket.id).emit("otheroom-join", data); 
        socket.join(roomCode)
        console.log("done 2")
      }
    })

    socket.on("user-call", ({ to, offer }) => {
      io.to(to).emit("incoming-call", { from: socket.id, offer });
    });

    socket.on("call-accepted", ({ to, ans }) => {
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
  
  })
}

module.exports=setupSocket;