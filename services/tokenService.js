const fs = require('fs');
const crypto = require('crypto');
const cron = require('node-cron');
const jsonwebtoken = require('jsonwebtoken');
const { expressjwt: jwt } = require('express-jwt');

const initialzeSecret = async (req, res) => {
  try {
    const secret = crypto.randomBytes(64).toString('hex'); 
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    let lines = envContent.split('\n');
    let foundSecret = false;
    lines = lines.map(line => {
      if (line.startsWith('SECRET=')) {
        foundSecret = true;
        return `SECRET=${secret}`; 
      }
      return line;
    });

    if (!foundSecret) {
      lines.push(`SECRET=${secret}`);
    }
    envContent = lines.join('\n');
    fs.writeFileSync('.env', envContent, 'utf8');
  } catch (error) {
    throw new Error('generate secret error');
  }
};


const creatToken = async (user) =>{
  const payload = {
    id : user.id,
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
    timezone: "Asia/Bangkok" 
})
}

const verifyToken = jwt({
  secret: process.env.SECRET,
  algorithms: ["HS256"], 
  userProperty: "auth", 
});

const handleTokenError = (err, res, next) => {
  if (err) {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Please Login' });
    }
  }
  next(); 
};

module.exports = {secretWork,initialzeSecret,creatToken,verifyToken,handleTokenError};