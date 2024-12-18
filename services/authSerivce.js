
const { OAuth2Client} = require('google-auth-library');




const getUrlGoogleLogin = async (req,res) =>{
  const oAuth2Cleinet = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  const authorizeUrl = oAuth2Cleinet.generateAuthUrl({
    access_type:'offline',
    scope:['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'consent'
  })
 
  res.json({url:authorizeUrl});
}

const getUserGoogle = async (code,req,res) => {
  try{
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const tokenResponse = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokenResponse.tokens);
    const acess = oAuth2Client.credentials;
    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${acess.access_token}`);
    const googleData = await userInfoResponse.json();
    return googleData;
  }catch(err){
    throw new Error('Cannot get user Data');
  }
  
}



module.exports ={ getUserGoogle,getUrlGoogleLogin};