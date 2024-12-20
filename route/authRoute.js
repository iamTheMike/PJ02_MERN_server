const express = require('express');
const { login, otpVerify ,getUserBytoken, resendOTP, googleLogin, signup, getProfile, creatAndUpdateProfile, getUrlGoogleLogin} = require('../controllers/authController');
const { upload, handleMulterError } = require('../services/uploadService');
const { verifyToken, handleTokenError } = require('../services/tokenService');


const router = express.Router();




router.get('/profile/:username',getProfile);
router.get('/googlelogin',getUrlGoogleLogin); 
router.get('/getUser',(req,res,next)=>{
    verifyToken(req,res,err=>{
        if(err){
            return  handleTokenError(err,res,next)
          }
          next();
        })
},getUserBytoken);
router.post('/login',login)
router.post('/otp',(req,res,next) =>{
    upload.single('userImage')(req,res,(err)=>{
        if(err){
           return handleMulterError(err,res,next)
        }
        next();
        })
},otpVerify);
router.post('/reotp',resendOTP); 
router.post('/callback',googleLogin); 
router.post('/signup',(req,res,next)=>{
    upload.single('userImage')(req,res,(err)=>{
        if(err){
            return handleMulterError(err,res,next)
         }
         next();
        })
},signup);
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
},creatAndUpdateProfile);



module.exports = router;