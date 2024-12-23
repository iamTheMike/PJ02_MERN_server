const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const blogRoute = require('./route/blogRoute')
const authRoute = require('./route/authRoute')
const { secretWork} = require('./services/tokenService')
const {initializeBlogDatabase} = require('./models/blogDatabaseModel')
const {initializeAuthDatabase} = require('./models/authDatabaseModel');
const { swaggerDocument, swaggerUi } = require('./services/swagger/swagger');


const app = express();


dotenv.config();

const corsOptions = {
  origin: '*', 
  methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'], 
  credentials: true, 
};

app.use(express.urlencoded({ extended: false}));
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev")); 

app.use('/api/blog',blogRoute);
app.use('/api/auth',authRoute);
app.use('/api-doc',swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const port = process.env.PORT || 5000 ;
app.listen( port, async ()=>{
    console.log(`start server on port ${port}`);
   await initializeBlogDatabase();
   await initializeAuthDatabase();
   await secretWork();
})