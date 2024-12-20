const {connectDatabase} = require('../models/authDatabaseModel')
const crypto = require('crypto');
const {sendOTPviaEmail,verifyOTP,generateOTP} = require('../services/2faService')
const validator = require('validator');
const { creatToken } = require('../services/tokenService');
const { getUserGoogle, generateGoogleUrl } = require('../services/authSerivce');
const { fileFilter } = require('../services/uploadService');
const uploadImage = require('../services/cloudService');


exports.login = async(req,res) =>{
    const {userEmail,password} = req.body;
    const db = await connectDatabase();
    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Require Email and password' });
    }
    if(!validator.isEmail(userEmail)){
        if(!userEmail==='admin'){
            return res.status(401).json({ message: 'Invalid Password or email' });
        }
    }
    try{
        if (!db) {
            return res.status(500).json({ message: 'Database not initialized' });
        }
         //fetch user data from database
        const [fetchData] = await db.execute (`SELECT * FROM users where email = ?`,[userEmail]);   
        if (fetchData.length === 0) {
            return res.status(401).json({ message: 'Invalid Password or email' });
        }
        let userData = fetchData[0];
        let hashPassword = crypto.pbkdf2Sync(password,userData.salt,310000,32,'sha256');
        if(!crypto.timingSafeEqual(Buffer.from(userData.hashPassword,'hex'),hashPassword)){
            return res.status(401).json({ message: 'Invalid Password or email' });
        }
        const { userName, email, role, userImage } = userData;
        if(userData.role ==='admin'){
            const token = await creatToken({userName,email,role,userImage});
            return res.status(200).json({message:"Admin welcome",token,role});
        }
        let otp = generateOTP(email);
        await sendOTPviaEmail(email,otp);
        return res.status(202).json({message: "OTP was send, Please verify OTP  "});
    }catch(error){
        return res.status(500).json({message:'internal server error'})
    }finally{
         await db.end();
    }
}

exports.getUrlGoogleLogin  = async (req,res)=>{
    try{
        const url = await generateGoogleUrl()
        return res.status(200).json({...url});
    }catch(error){
        res.status(500).json({ error: 'Internal Server Error'})
    }

}

exports.googleLogin = async (req, res) => { 
    const db = await connectDatabase();
    try{
        const{code} = req.body;
        const googleData = await getUserGoogle(code);
        const {email,name,picture} = googleData; 
        if (!db) {
            return res.status(500).json({ message: 'Internal Server Error'});
        }
        const [fetchData] = await db.execute (`SELECT * FROM users where email = ?`,[email]);
        if(fetchData.length === 0){
            try{
                var salt = crypto.randomBytes(16).toString('hex');
                var hashPassword = crypto.pbkdf2Sync(salt,salt,310000,32,'sha256').toString('hex')
                await db.execute(`INSERT INTO users (email,hashPassword,salt,userName,role,userImage,userType) VALUES (?,?,?,?,?,?,?)`,
                    [
                        email,
                        hashPassword,
                        salt,
                        name,
                        'member',
                        picture,
                        'GoogleOauth'
                    ])
                }catch(error){
                    return res.status(500).json({message:"Internal Server Error"})
                }
        }
        const [userData] = await db.execute(`SELECT * FROM users WHERE email = ?`,[email])
        const user = userData[0]
        const {userName,role,userImage} = user;
        const token = await creatToken({userName,email,role,userImage})
        return res.status(200).json({message:"login sucessfully",token})
    }catch (error) {
        return res.status(400).send('Invalid Code');
    }finally{
       await db.end();
    }
}

exports.otpVerify = async(req,res) =>{
   const {otp,userName,userEmail,password} = req.body;
   console.log(req.body);
   const db = await connectDatabase();
   let validateOTP = verifyOTP(userEmail,otp)
   if(!validateOTP){
    return res.status(401).json({message:'Invalid OTP'})
   }
   if(!db) {
    return res.status(500).json({ message: 'Internal Server Error'});
   }
   try{
      const [Data]  = await db.execute('SELECT * FROM users where email = ?',[userEmail])  
       if (Data.length === 0) {
            if(req.file){
                    try{
                        const imageUrl = await uploadImage(req.file)
                        try{
                            const salt = crypto.randomBytes(16).toString('hex');
                            const hashPassword = crypto.pbkdf2Sync(password,salt,310000,32,'sha256').toString('hex');
                            await db.execute('INSERT INTO users (email,hashPassword,salt,userName,role,userImage,userType) VALUES (?,?,?,?,?,?,?)',[
                                userEmail,
                                hashPassword,
                                salt,
                                userName,
                                "member",
                                imageUrl,
                                "Local"
                            ])
                            }catch(error){
                                return res.status(404).json({message:'This user have not been member yet, Please signp'})  
                            } 
                    }catch(error){
                        return res.status(500).json({message:'internal server error'})
                    }
                    try{
                        const [fetchData]  = await db.execute('SELECT * FROM users where email = ?',[userEmail]) 
                        const userData = fetchData[0];
                        const { userName, email, role, userImage } = userData; 
                        const token = await creatToken({userName,email,role,userImage})
                        return res.status(200).json({message:"Signup sucessfully",token})
                    }catch(error){
                        return res.status(500).json({message:'internal server error'})
                    }
            }else{
                try{
                    const salt = crypto.randomBytes(16).toString('hex');
                    const hashPassword = crypto.pbkdf2Sync(password,salt,310000,32,'sha256').toString('hex');
                    await db.execute('INSERT INTO users (email,hashPassword,salt,userName,role,userType) VALUES (?,?,?,?,?,?)',[
                        userEmail,
                        hashPassword,
                        salt,
                        userName,
                        "member",
                        "Local"
                    ])
                }catch(error){
                    console.log(error);
                    return res.status(500).json({message:"internal server error"})   
                } 
                try{
                    const [fetchData]  = await db.execute('SELECT * FROM users where email = ?',[userEmail]) 
                    const userData = fetchData[0];
                    const { userName, email, role, userImage } = userData;
                    //create access token 
                    const token = await creatToken({userName,email,role,userImage})
                    return res.status(200).json({message:"Signup sucessfully",token})
                }catch(error){
                    return res.status(500).json({message:'internal server error'})
                }
            }
            
        }else{
            try{
                const [fetchData]  = await db.execute('SELECT * FROM users where email = ?',[userEmail]) 
                const userData = fetchData[0];
                const { userName, email, role, userImage } = userData;
                //create access token 
                const token = await creatToken({userName,email,role,userImage})
                return res.status(200).json({message:"Successful login",token})
            }catch(error){
                return res.status(500).json({message:"Not Found User"})
            }
        }
    }catch(error){
        return res.status(500).json({message:"Internal Server Error"})
    }finally{
        await db.end();
    }
   
    

}

exports.resendOTP = async(req,res) => {
    const {userEmail} = req.body;
    try{
        const otp = generateOTP(userEmail);
        await sendOTPviaEmail(userEmail,otp);
        return res.status(200).json({message: "New otp was created"});
    }catch(error){
        return res.status(500).json({message: "Cannot creat new OTP"});
    }
}

exports.signup = async (req,res) =>{
    const {userName,userEmail,password} = req.body;
    const userImage = req.file;
    const checkFile = fileFilter (userImage);
    if(!checkFile){
        return res.status(405).json({message:'User Avatar cannot upload'})
    }
    if (!userEmail || !password || !userName ) {
        return res.status(400).json({ message: 'Require Email, Password and Username' });
    }
    if(!validator.isEmail(userEmail)){
        return res.status(400).send('Invalid email format');
    }
    const db = await connectDatabase();
    try{
        if (!db){
            return res.status(500).json({ message: 'internal server error' });
        }
        try{
            const [emailCheck] = await db.execute (`SELECT * FROM users where email = ?`,[userEmail]) 
            if (emailCheck.length !== 0) {
                return res.status(409).json({ message: 'This Email have been used' });
            }
        }catch(error){
            return res.status(500).json({message:'internal server error'})
        }
        try{
            const [userCheck] = await db.execute (`SELECT * FROM users where userName = ?`,[userName]) 
            if (userCheck.length !== 0) {
                return res.status(401).json({ message: 'This Username have been used' });
            }
        }catch(error){
            return res.status(500).json({message:'internal server error'})
        }
        let otp = generateOTP(userEmail);
        await sendOTPviaEmail(userEmail,otp);
        return res.status(200).json({message: "OTP was send to your email, Please Verify OTP"});
    }catch(error){
        return res.status(500).json({message:'internal server error'})
    }finally{
        await db.end();
    }
}

exports.getProfile = async(req,res) =>{
    const{username} = req.params
    const db = await connectDatabase();
    try{
        const [fetchUser] = await db.execute(`SELECT id,userName,userImage FROM users WHERE userName = ?`,[username])
        if(fetchUser.length===0){
            return res.status(404).json({message:"user not found"})
        }
        const user = fetchUser[0];
        const {id,userName,userImage} = user;
        try{
            const [fetchuserData] = await db.execute(
                `SELECT users.userName, userData.firstName, userData.lastName, userData.birthDate, userData.address, userData.bio
                FROM users
                INNER JOIN userData ON users.id = userData.userid
                WHERE users.id = ?`,[id])
            if(fetchuserData.length===0){
               return res.status(200).json({message:"user have not created the profile",id,userName,userImage})
            }
            const userData = fetchuserData[0];
            const {firstName,lastName,birthDate,address,bio} = userData
            return res.status(200).json({id,firstName,lastName,birthDate,address,bio,userName,userImage});
        }catch(error){;
            return res.status(500).json({ message: "Internal server error" });
        }
    }catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        await db.end()
    }
}

exports.creatAndUpdateProfile = async(req,res)=>{
    const {userid,bio,userName,firstName,lastName,birthDate,address} = req.body
    const checkUser = req.auth.userName
    console.log(checkUser);
    let userImage;
    const db = await connectDatabase();
        try{
            const [checkUser] = await db.execute('SELECT userName FROM users ');
            if (checkUser[0].userName === userName){
                return res.status(400).json({message:"username have been used already"})
            }
             if (userName || req.file) {
               try{ 
                    if(req.file){
                        userImage = await uploadImage(req.file)
                    }else{
                        userImage = '';
                    }
                        try{
                            await db.execute(
                            `UPDATE users 
                            SET 
                            userName = CASE 
                                       WHEN ?='' THEN userName
                                       ELSE ? 
                                       END,
                                      
                            userImage = CASE
                                        WHEN ?= '' THEN userImage
                                        ELSE ?
                                        END
                            WHERE id = ?`,
                            [userName,userName,userImage,userImage,userid]
                            );
                            try{
                                const [user] = await db.execute('SELECT userName,email,role,userImage FROM users WHERE id=?',[userid])
                                const {userName,email,role,userImage} = user[0];
                                const token = await creatToken({userName,email,role,userImage})
                                try{
                                    const [checkUserData] = await db.execute('SELECT * FROM userData WHERE userid = ?',[userid])
                                    if(checkUserData.length===0){
                                        try{
                                            await db.execute(
                                                `INSERT INTO userData (userid, firstName, lastName,birthDate,address,bio)
                                                VALUES (?,?,?,?,?,?)  `,[userid,firstName,lastName,birthDate,address,bio]
                                                )
                                            try{
                                            
                                                const [fetchData] = await db.execute('SELECT * FROM userData WHERE userid = ?',[userid] )
                                                const userData = fetchData[0];
                                                return res.status(200).json({message:"Record data successfully",userData,token})
                                            }catch(error){
                                                return res.status(400).json({message:"userData not found"})
                                            }    
                                        }catch(error){
                                            return res.status(400).json({message:"Record user data error"})
                                        } 
                                    }else{
                                        try{
                                            await db.execute(
                                                `UPDATE userData 
                                                SET
                                                firstName = ?,
                                                lastName = ?,
                                                birthDate =?,
                                                address = ?,
                                                bio = ?
                                                WHERE userid = ? `,
                                                [firstName,lastName,birthDate,address,bio,userid]
                                            )
                                            try{
                                                const [fetchData] = await db.execute('SELECT * FROM userData WHERE userid = ?',[userid] )
                                                const userData = fetchData[0];
                                                return res.status(200).json({message:"Complete",userData,token})
                                            }catch(error){
                                                return res.status(400).json({message:"User Data Not Found"})
                                            }    
                                        }catch(error){
                                            res.status(400).json({message:"Record user data error"})
                                        }   
                                    } 
                                }catch(error){
                                    return res.status(400).json({message:"cannot fetch userData"})
                                }
                            }catch(error){       
                            }    
                        }catch(error){
                            return res.status(400).json({message:"cannot update Username and image "})
                        }
                }catch(error){
                    return res.status(400).json({message:"cannot upload Image"})
                }   
             }else{
                try{
                    const [checkUserData] = await db.execute('SELECT * FROM userData WHERE userid = ?',[userid])
                    if(checkUserData.length===0){
                        try{
                            await db.execute(
                                `INSERT INTO userData (userid, firstName, lastName,birthDate,address,bio)
                                VALUES (?,?,?,?,?,?)  `,[userid,firstName,lastName,birthDate,address,bio]
                                )
                            try{
                                const [fetchData] = await db.execute('SELECT * FROM userData WHERE userid = ?',[userid] )
                                const userData = fetchData[0];
                                return res.status(200).json({userData})
                            }catch(error){
                                return res.status(400).json({message:"User Data Not Found"})
                            }    
                        }catch(error){
                            return res.status(400).json({message:"There is no user data"})
                        } 
                    }else{
                        try{
                            await db.execute(
                                `UPDATE userData 
                                SET
                                firstName = ?,
                                lastName = ?,
                                birthDate =?,
                                address = ?,
                                bio = ?
                                WHERE userid = ? `,
                                [firstName,lastName,birthDate,address,bio,userid]
                            )
                            try{
                                const [fetchData] = await db.execute('SELECT * FROM userData WHERE userid = ?',[userid] )
                                const userData = fetchData[0];
                                return res.status(200).json({userData})
                            }catch(error){
                                return res.status(400).json({message:"User Data Not Found"})
                            }    
                        }catch(error){
                            res.status(400).json({message:"Update UserData error"})
                        }   
                    } 
                }catch(error){
                    res.status(400).json({message:"cannot fetch userData"})
                }
             }    
        }catch(error){
            res.status(400).json({message:"Database not initialized"})
        }finally{
            await db.end();
        }       
}       

exports.getAllUser = async (req,res) =>{
    const db = await connectDatabase();
    try{
        const [fetchData] = await db.execute('SELECT email, userName FROM users')
        return fetchData;
    }catch(error){
        throw new error("Server Error");
    }
}

exports.getUserBytoken = async(req,res) => {
    try{  
        const userData = req.auth
        return res.status(200).json({user:userData})
    }catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

exports.getUsernameByEmail = async(userEmail) => {
    const db = await connectDatabase();
    try{
        const [fetchUser] = await db.execute('SELECT userName FROM users WHERE email=?',
            [userEmail]
        )
        if (fetchUser.length > 0) {
            return fetchUser[0].userName; // Access userName correctly from the result
        } else {
            throw new Error("User not found");
        }
    }catch(error){
        return error;
    }
}