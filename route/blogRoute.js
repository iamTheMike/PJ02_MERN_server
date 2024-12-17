const express = require('express');
const {create,getAllblogs,getBlog,removeBlog,editBlog} = require('../controllers/blogController');
const { verifyToken, handleTokenError } = require('../services/tokenService');


const router = express.Router();


router.get('/blogs',getAllblogs)
router.get('/blog/:slug',getBlog)
router.put('/blog/:slug',(req,res,next)=>{
    verifyToken(req,res,err=>{
        if(err){
            return  handleTokenError(err,res,next)
        }
        next();
        })
    },editBlog)
router.post('/create',(req,res,next)=>{
    verifyToken(req,res,(err)=>{
        if(err){
            return   handleTokenError(err,res,next)
        }
        next();
        })
    },create)
router.delete('/blog/:slug',(req,res,next)=>{
    verifyToken(req,res,err=>{
        if(err){
          return  handleTokenError(err,res,next)
        }
        next();
        })
    },removeBlog)

   


module.exports = router;