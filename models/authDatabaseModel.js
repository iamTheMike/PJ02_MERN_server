const mysql = require('mysql2/promise');
const dotenv = require ('dotenv');
const crypto = require('crypto');
const { response } = require('express');

dotenv.config();

const connectDatabase = async () =>{
    try {
       const db = await mysql.createConnection(process.env.DATABASE_TIDB);
        return db;
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
        throw err;
    }
}


const initializeAuthDatabase = async () => {
    try{
        const db = await connectDatabase();
       await db.execute(`CREATE DATABASE IF NOT EXISTS MERN01`);
       await db.changeUser( {database: "MERN01"});
       
       //create initalizeTable
       const usersTable = 
        `CREATE TABLE IF NOT EXISTS users(
           id INT AUTO_INCREMENT PRIMARY KEY,
           email VARCHAR(45) NOT NULL UNIQUE,
           hashPassword VARCHAR(255) NOT NULL,
           salt VARCHAR(45),
           userName VARCHAR(45) NOT NULL UNIQUE,
           role VARCHAR(45) NOT NULL DEFAULT 'member',
           userImage VARCHAR(100) DEFAULT 'https://pixy.org/src/120/thumbs350/1206832.jpg',
           userType VARCHAR(45) NOT NULL
        )
        `
        const userData = 
        `CREATE TABLE IF NOT EXISTS userData(
           id INT AUTO_INCREMENT PRIMARY KEY,
           userid INT NOT NULL UNIQUE,
           firstName VARCHAR(45) ,
           lastName VARCHAR(45),
           birthDate VARCHAR(45),
           address VARCHAR(100),
           bio VARCHAR(100),
           FOREIGN KEY (userid)  
                REFERENCES users(id)
                ON DELETE CASCADE
        )
        `
       var salt = crypto.randomBytes(16).toString('hex');
       var hashPassword = crypto.pbkdf2Sync(process.env.PASSWORD_ADMIN,salt,310000,32,'sha256').toString('hex')
       
       const initializeAdmin = 
        `INSERT IGNORE INTO users (email,hashPassword,salt,userName,role,userType) VALUES (?,?,?,?,?,?)`
       
       await db.execute( usersTable);
       await db.execute( userData);
     
       await db.execute(initializeAdmin,['admin',hashPassword,salt,'Administrator','admin','local']);
    
       console.log('The auth database was successfully created or already existed.');

       
      
       
    }catch(err){
        console.log(err);
    }
}


module.exports = {connectDatabase,initializeAuthDatabase} ;


