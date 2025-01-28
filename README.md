# API - Blog Platform

## Description
This API is designed to support PJ01-MERN-Client in building a MERN Stack project.
It is a RESTful API built with Node.js, Express, and other essential libraries. The API provides a blogging platform with user authentication features and integrates Swagger for auto-generated documentation.


### Feature
  * Blog Routes:  Endpoints for creating, updating, and deleting blog posts.
  * Authenitcation Routes: Handles user authentication, including Login and registration, 2FA via OTP sent to email, Google OAuth2 integration.
  * Swagger Documentation: Automatically generated API documentation for easy reference.

### Technologies Used
 * Node.js : Provider the backend environment for this API
 * Express Framework : is used to handle requests, routing.
 * MongoDB Cloud : Mongoose schemas is used for modeling  Blog data
 * TiDB : mysql2 is used for modeling user data
 * Google Cloud : Used for handling user image files.
 * Google API Oauth2 
 
### Database Seed
 * MySql will create database named MERN01 with a users table including an admin role

### ENV
  * Create`.env` file ,See example in   .env.example
  

## Installation
```
git clone https://github.com/iamTheMike/PJ01_MERN_server.git
cd project
npm install
```

## Start development
```
npm start
```

### Demo FULL STACK (MERN) (PJ01-MERN-Client + PJ01-MERN-Server[This Respository])
https://pj02-mern-client.onrender.com/home







        
  
  

