const slugify = require('slugify');
const {blogModel} = require('../models/blogDatabaseModel');
const {v4:uuidv4}= require('uuid');
const { getAllUser, getUsernameByEmail } = require('./authController');

exports.create= async (req,res)=>{
    const {title,content,userEmail} = req.body
    let slug = slugify(title);//for thai language
    if(!slug)slug = uuidv4();
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }
   try{
    const blog = await blogModel.create({title,content,userEmail,slug});
    return res.status(201).json({message:"create blog sucessfully ",blog}); 
   }catch(err){
      return res.status(400).json({message:"Cannot duplicate title"})
   }
}

exports.getAllblogs= async (req,res)=>{
   try{
     const userData = await getAllUser() ;
     const blogData = await blogModel.find();
     const userBlog = blogData.map(blog=>{
       const user = userData.find(user=>  blog.userEmail===user.email)
       const newBlog =  {...blog._doc,userName:(user?(user.userName):null)}
       return{
        ...newBlog  
       }
     })
     res.json(userBlog);
   }catch(error){
     res.status(500).json({message:"Failed to fetch blog"});
   }
}

exports.getBlog = async (req,res)=>{
   try{
      const{slug} = req.params
      const data = await blogModel.findOne({slug});
      if (data === null) {
         return res.status(400).json({ message: "Not Found Blog" });
      }
      const {userEmail,title,content,createdAt} = data;
      const userName = await getUsernameByEmail(userEmail)
      res.json({userEmail,title,content,slug,userName,createdAt});
   }catch(error){
     res.status(500).json({message:"Failed to fetch the blog"});
   }
}

exports.removeBlog = async (req,res)=>{
   try{
      const{slug} = req.params 
      const result = await blogModel.findOneAndDelete({ slug });
      if (!result) {
         return res.status(404).json({ message: "Blog not found" });
      }
      res.json({message:"Delete sucessfully"});
   }catch(error){
     res.status(500).json({message:"Failed to Delete the blog"});
   }
}

exports.editBlog = async (req,res)=>{
   try{
      const{slug} = req.params 
      const data = await blogModel.findOne({slug});
      if(data===null){
         return res.status(400).json({message:"Blog not found"})
      };
      const {title,content,author} = req.body
      let newslug = slugify(title); // if thai languge slug will be null
      if(!newslug)newslug = uuidv4();
      const result = await blogModel.findOneAndUpdate({ slug },{title,content,author,slug:newslug},{new:true});
      if (!result) {
         return res.status(404).json({ message: "Cannot update" });
      }
      return  res.json({message:"Update sucessfully"});
   }catch(error){
      console.error("Error during deletion:", error);
      return  res.status(500).json({message:"Failed to update the blog"});
   }
}
