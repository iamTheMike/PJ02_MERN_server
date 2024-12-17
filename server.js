const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const blogRoute = require('./route/blogRoute')
const authRoute = require('./route/authRoute')
const { secretWork} = require('./services/tokenService')
const {initializeBlogDatabase} = require('./models/blogDatabaseModel')
const {initializeAuthDatabase} = require('./models/authDatabaseModel');


const app = express();

//seting config tools
dotenv.config();

const corsOptions = {
  origin: '*', // โดเมนที่อนุญาต
  methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'], // วิธี HTTP ที่อนุญาต
  credentials: true, // อนุญาตการส่ง cookies หรือ authorization headers
};
//middleware
app.use(express.urlencoded({ extended: false}));
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev")); // display log "dev" mode


//route

app.use('/api',blogRoute);
app.use('/api',authRoute);




  
const port = process.env.PORT ;
app.listen( port, async ()=>{
    console.log(`start server on port ${port}`);
   await initializeBlogDatabase();
   await initializeAuthDatabase();
   await secretWork();
})