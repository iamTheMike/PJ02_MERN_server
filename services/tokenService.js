const fs = require('fs');
const crypto = require('crypto');
const cron = require('node-cron');
const jsonwebtoken = require('jsonwebtoken');
const { expressjwt: jwt } = require('express-jwt');

const initialzeSecret = async (req, res) => {
  try {
    const secret = crypto.randomBytes(64).toString('hex'); // สุ่ม JWT Secret
    let envContent = '';
    
    // อ่านไฟล์ .env ถ้ามีอยู่
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }

    // แยกบรรทัดออกมา
    let lines = envContent.split('\n');
    let foundSecret = false;

    // ตรวจสอบและอัปเดตเฉพาะ SECRET
    lines = lines.map(line => {
      if (line.startsWith('SECRET=')) {
        foundSecret = true;
        return `SECRET=${secret}`; // แทนที่ค่า SECRET เดิม
      }
      return line; // ไม่เปลี่ยนแปลงบรรทัดอื่น
    });

    // ถ้าไม่มี SECRET อยู่ในไฟล์ ให้เพิ่มใหม่
    if (!foundSecret) {
      lines.push(`SECRET=${secret}`);
    }

    // รวมเนื้อหาไฟล์กลับ
    envContent = lines.join('\n');

    // เขียนกลับไปที่ไฟล์
    fs.writeFileSync('.env', envContent, 'utf8');
    console.log("Secret was created");
  } catch (err) {
    console.log("Error:", err);
  }
};


const creatToken = async (user) =>{
  const payload = {
    userName : user.userName,
    userEmail: user.email,
    role: user.role,
    userImage: user.userImage
  };
  const token = jsonwebtoken.sign(payload,process.env.SECRET,{
    expiresIn:'1h'
  })
  return token;
}


const secretWork = async (req,res) =>{  
  cron.schedule('0 0 * * *', () => {
    initialzeSecret();
  console.log('SECRET regenerated at midnight.'); //UTC Zone
 },{
    timezone: "Asia/Bangkok" // กำหนดให้ทำงานตามโซนเวลาไทย
})
}

/**** middleware verfiy header acess token *****/
const verifyToken = jwt({
  secret: process.env.SECRET,
  algorithms: ["HS256"], 
  userProperty: "auth", 
});//send user collect in req.auth

const handleTokenError = (err, res, next) => {
  if (err) {
    // ตรวจสอบว่ามีข้อผิดพลาดจริงๆ ก่อนที่จะเข้าถึง `err.name`
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Please Login' });
    }
  }
  next(); // ไม่มีข้อผิดพลาด ให้ดำเนินการต่อ
};

module.exports = {secretWork,initialzeSecret,creatToken,verifyToken,handleTokenError};