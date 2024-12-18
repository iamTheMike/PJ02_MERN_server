const {connectDatabase} = require('../models/authDatabaseModel')
const crypto = require('crypto');
const {sendOTPviaEmail,verifyOTP,generateOTP} = require('../services/2faService')
const validator = require('validator');
const { creatToken } = require('../services/tokenService');
const { getUserGoogle } = require('../services/authSerivce');
const { fileFilter } = require('../services/uploadService');
const uploadImage = require('../services/cloudService');


exports.login = async(req,res) =>{
    const {userEmail,password} = req.body;
    const db = await connectDatabase();
    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
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
        // verify login password
        if(!crypto.timingSafeEqual(Buffer.from(userData.hashPassword,'hex'),hashPassword)){
            return res.status(401).json({ message: 'Invalid Password or email' });
        }
        const { userName, email, role, userImage } = userData;
        //admin check
        if(userData.role ==='admin'){
            const token = await creatToken({userName,email,role,userImage});

            return res.status(200).json({message:"Admin welcome",token,role});
        }
        //email check
        if(!validator.isEmail(email)){
            return res.status(400).send('Email not found');
        }
        // create otp
        let otp = generateOTP(email);
         await sendOTPviaEmail(email,otp);
        return res.status(200).json({message: "Pls verify otp"});
    }catch(error){
        return res.status(500).json({message:'Login server error'})
    }finally{
         await db.end();
    }
}

exports.googleLogin = async (req, res) => { 
    const db = await connectDatabase();
    try{
        const{code} = req.body;
        const googleData = await getUserGoogle(code);
        const {email,name,picture} = googleData; 
        if (!db) {
            return res.status(500).json({ message: 'Database not initialized' });
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
                    return res.status(400).json({message:"Error insert users"})
                }
        }
                const [userData] = await db.execute(`SELECT * FROM users WHERE email = ?`,[email])
                const user = userData[0]
                const {userName,role,userImage} = user;
                const token = await creatToken({userName,email,role,userImage})
    
        return res.status(200).json({message:"login sucessfully",token})
    }catch (error) {
        return res.status(500).send('An error occurred during Google login');
    }finally{
       await db.end();
    }
};

exports.otpVerify = async(req,res) =>{
   const {otp,userName,userEmail,password} = req.body;
   const db = await connectDatabase();
   let validateOTP = verifyOTP(userEmail,otp)
   if(!validateOTP){
    return res.status(401).json({message:'Invalid OTP'})
   }
   if(!db) {
    return res.status(500).json({ message: 'Database not initialized' });
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
                                    return res.status(400).json({message:"Canot sign up new user"})   
                            } 
                        }catch(error){
                            return res.status(500).json({message:'cannot connect Google Cloud to fetch user avarta'})
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
                    return res.status(400).json({message:"Canot sign up new user"})   
                } 
            }
        }else{
            try{
                const [fetchData]  = await db.execute('SELECT * FROM users where email = ?',[userEmail]) 
                const userData = fetchData[0];
                const { userName, email, role, userImage } = userData;
                //create access token 
                const token = await creatToken({userName,email,role,userImage})
                return res.status(200).json({message:"login sucessfully",token})
            }catch(error){
                return res.status(500).json({message:'Login otp error'})
            }
        }
    }catch(error){
        return res.status(400).json({message:"cannot fetchData"})
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
        return res.status(400).json({message: "Cannot creat new OTP"});
    }
}

exports.signup = async (req,res) =>{
    const {userName,userEmail,password} = req.body;
    const userImage = req.file;
    const checkFile = fileFilter (userImage);
    if(!checkFile){
        return res.status(401).json({message:'User Avatar cannot upload'})
    }
    if (!userEmail || !password || !userName ) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    if(!validator.isEmail(userEmail)){
        return res.status(400).send('This email cannnot use');
    }
    const db = await connectDatabase();
    try{
        if (!db) {
            return res.status(500).json({ message: 'Database not initialized' });
        }
        try{
            const [fetchData] = await db.execute (`SELECT * FROM users where email = ?`,[userEmail]) 
            if (fetchData.length !== 0) {
                return res.status(401).json({ message: 'This Email have been used' });
            }
        }catch(error){
             return res.status(401).json({ message: 'Cannot FetchData' })
        }
        let otp = generateOTP(userEmail);
        await sendOTPviaEmail(userEmail,otp);
        return res.status(200).json({message: "Pls verify otp"});
    }catch(error){
        return res.status(500).json({message:''})
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
            return res.status(400).json({message:"User not found"})
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
               return res.status(200).json({message:"userData not found",id,userName,userImage})
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
    let userImage;
    const db = await connectDatabase();
        try{
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
                                                return res.status(200).json({userData,token})
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
                                                return res.status(200).json({message:"Complete",userData,token})
                                            }catch(error){
                                                return res.status(400).json({message:"User Data Not Found"})
                                            }    
                                        }catch(error){
                                            res.status(400).json({message:"cannot update UserData"})
                                        }   
                                    } 
                                }catch(error){
                                }
                            }catch(error){       
                            }    
                        }catch(error){
                            return res.status(400).json({message:"The name already exists in the system"})
                        }
                }catch(error){
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
                            res.status(400).json({message:"cannot update UserData"})
                        }   
                    } 
                }catch(error){
                    res.status(400).json({message:"cannot update checkData"})
                }
             }
              
        }catch(error){
            res.status(400).json({message:"Erro Top domain"})
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