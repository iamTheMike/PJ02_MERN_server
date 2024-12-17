//Title,content,author,slug(url),timestamp
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const blogSchema = mongoose.Schema({
    title:{
        type:String,
        required:true //Input is required.
    },
    content:{
        type:{},
        required:true
    },
    userEmail:{
        type:String,
        required:true
    },
    slug:{
        type:String,
        lowercase:true, //Convert everything to lowercase
        unique:true // No duplicate values
    }
  },{
      timestamps:true
    }
);

const blogModel =  mongoose.model("Blogs",blogSchema);

const initializeBlogDatabase = async() =>{
    await mongoose.connect(process.env.DATABASE_MONGO,{
    }).then(()=>{
        console.log("The blog database was successfully created or already existed.")
    }).catch((err)=>{
        console.log(err)
    })
}

module.exports = {blogModel,initializeBlogDatabase}