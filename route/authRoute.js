const express = require('express');
const { login, otpVerify ,getUserBytoken, resendOTP, googleLogin, signup, getProfile, creatAndUpdateProfile} = require('../controllers/authController');
const { getUrlGoogleLogin } = require('../services/authSerivce');
const { upload, handleMulterError } = require('../services/uploadService');
const { verifyToken, handleTokenError } = require('../services/tokenService');


const router = express.Router();


router.post('/signup',(req,res,next)=>{
    upload.single('userImage')(req,res,(err)=>{
        if(err){
            return handleMulterError(err,res,next)
         }
         next();
        })
    },signup);
    
router.post('/login',login)
router.get('/profile/:username',getProfile);
router.post('/googlelogin',getUrlGoogleLogin); 
router.post('/callback',googleLogin); 
router.post('/otp',(req,res,next) =>{
    upload.single('userImage')(req,res,(err)=>{
        if(err){
           return handleMulterError(err,res,next)
        }
        console.log("file upload",req.file);
        next();
        })
},otpVerify);
router.post('/reotp',resendOTP);
router.post('/creat-profile',(req,res,next)=>{
    verifyToken(req,res,err=>{
        if(err){
          return  handleTokenError(err,res,next)
        }
        next();
        })
    },(req,res,next) =>{
        upload.single('userImage')(req,res,(err)=>{
             if(err){
                return handleMulterError(err,res,next)
             }
             next();
            })
    },creatAndUpdateProfile
);


router.get('/getUser',(req,res,next)=>{
    verifyToken(req,res,err=>{
        if(err){
            return  handleTokenError(err,res,next)
          }
          next();
        })
    },getUserBytoken);



module.exports = router;