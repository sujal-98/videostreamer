// Imports
const passport = require('./resource/passport');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require("body-parser");
const RedisStore = require("connect-redis").default;
const session = require('express-session');
const dotenv = require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const Redis = require('ioredis');

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);


io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('create-stream', (streamId) => {
    socket.join(streamId);
    console.log(`User ${socket.id} created stream: ${streamId}`);
  });

  socket.on('join-stream', (streamId) => {
    socket.join(streamId);
    console.log(`User ${socket.id} joined stream: ${streamId}`);
    socket.to(streamId).emit('user-joined', socket.id);
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal,
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

// Initialize Redis client
const redisClient = new Redis({
  host: '127.0.0.1',
  port: 2000,
});

// Set up static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Set up session management
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

// Route handling
app.use('/auth', require('./routes/auth'));
// app.use('/live', require('./routes/Live'));

// DB Connection
mongoose.connect(process.env.uri).then(() => {
  console.log("Connection successful");
}).catch((error) => {
  console.log("Mongo error occurred: ", error.message);
});

// Port setup
server.listen(1000, () => {
  console.log('Server listening on port 1000');
});
