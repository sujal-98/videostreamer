// Imports
const passport = require('./resource/passport');
const express = require('express');
const cors = require('cors');
const http = require('http');
const bodyParser = require("body-parser");
const RedisStore = require("connect-redis").default;
const session = require('express-session');
const dotenv = require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const setupSocket = require('./routes/stream');
const fetch = require('./routes/fetch');

// Express setup
const app = express();
const server = http.createServer(app);  // http server for socket.io
setupSocket(server); // Passing the HTTP server to your Socket.IO setup

// Initialize Redis client
const redisClient = new Redis({
  host: '127.0.0.1',
  port: 2000,
});

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ["GET", "POST"],
  credentials:true,

}));

// Set up static file serving
app.use(express.static(path.join(__dirname, 'public')));  // Use `app.use`

// Set up session management (need to rethink this!)
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

// Route handling
app.use('/api/auth', require('./routes/auth'));
app.use('/videos', fetch);

// DB Connection
mongoose.connect(process.env.uri).then(() => {
  console.log("Connection successful");
}).catch((error) => {
  console.log("Mongo error occurred: ", error.message);
});

// Port setup
server.listen(4000, () => {
  console.log('Server listening on port 4000');
});
