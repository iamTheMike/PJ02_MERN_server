const mailer = require('nodemailer');
const speakeasy = require('speakeasy');
const crypto= require('crypto');


const generateSecret =  (email) =>{
    try{
         let secret =  crypto.createHmac('sha256',process.env.SECRET).update(email).digest('base32')
         return secret
    }catch(error){
        throw new Error('generateSecret 2fa error');
    }
}

const generateOTP =  (email) => {
    
    try{
        const secret = generateSecret(email);
        let OTP =  speakeasy.totp({
         secret:secret,
         encoding: 'base32',
         step: 120 
        })
        return OTP;
    }catch(error){
        throw new Error('generateOTP 2fa error');
    }    
}

const verifyOTP = (email,otp) => {
    try{
        let secret = generateSecret(email);
        let isvalid = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token:otp,
            step:120
        })
        return isvalid;
    }catch(error){
        throw new Error('verifyOTP 2fa error');
    }
}

const sendOTPviaEmail = async (email,otp)=>{
    const emailService = mailer.createTransport({
        service: 'gmail',
        auth:{
            user:process.env.EMAIL,
            pass:process.env.PASSWORD_EMAIL
        }
    })
    const emailOTP = {
        from : process.env.EMAIL,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is ${otp}` 
    }
    try{
         await emailService.sendMail(emailOTP) 
    }catch(error){
   console.log('error sendEail Module') 
    }
}

module.exports = {sendOTPviaEmail,verifyOTP,generateOTP}