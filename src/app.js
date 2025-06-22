import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
 
app.use(express.json({limit: '50mb'})) // for parsing application/json
// The limit option is set to '16kb' to restrict the size of JSON payloads
app.use(express.urlencoded({extended: true, limit: '50mb'})) // for parsing application/json and application/x-www-form-urlencoded
app.use(express.static('public')) 
// The express.static middleware serves static files from the 'public' directory. 

app.use(cookieParser()) // for parsing cookies


// routes 
import userRouter from './routes/user.routes.js';

// routes declaration
app.use("/api/v1/users",userRouter);


export {app}