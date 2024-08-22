//imports
const passport=require('./resource/passport')
const express=require('express')
const cors=require('cors')
const app=express()
// const stream=require('./routes/stream')
// const fetch=require('./routes/fetch')
const auth=require('./routes/auth')
// const userRoute=require('./routes/userRoute')
const bodyParser = require("body-parser");
const RedisStore = require("connect-redis").default

const session=require('express-session')
const dotenv=require('dotenv').config();
const path=require('path')
const mongoose=require('mongoose')
const Redis = require('ioredis');



const redisClient = new Redis({
  host: '127.0.0.1',
  port: 2000,
});


app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));




//middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}))
app.use('/auth',auth)
// app.use('/user',userRoute)
// app.use(stream)
// app.use(fetch)

//db connection
mongoose.connect(process.env.uri).then(()=>{
    console.log("connection successfull")
}).catch((error)=>{
console.log("Mongo error occured: ", error.message)
})


//port setup

app.listen(1000,()=>{
    console.log('server listening on port 1000')
})