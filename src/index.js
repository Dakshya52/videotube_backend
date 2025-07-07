import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
import { Server } from 'socket.io';
import {Chat} from './models/chat.model.js';
import { createMessage } from './controllers/chat.controller.js';

dotenv.config({
    path: './.env'
});

connectDB()
.then(()=>{
    const server = app.listen(process.env.PORT || 8000,()=>{
        console.log("Server is running " + (process.env.PORT || 8000));
    })
    
    const io = new Server(server,{
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    })

    // --- Live chat logic ---
    io.on('connection', (socket) => {
        // Join a room for a specific video
        socket.on('joinVideoRoom', async ({ videoId }) => {
            socket.join(videoId);
            // Fetch previous messages for this video
            const messages = await Chat.find({ videoId }).sort({ timestamp: 1 }).lean();
            socket.emit('previousMessages', messages);
        });

        // Handle new chat messages
        socket.on('chatMessage', async ({ videoId, userId, text }) => {
            const message = await createMessage({ videoId, userId, text });
            io.to(videoId).emit('chatMessage', message);
        });
    });
    // --- End live chat logic ---

})
.catch((error)=>{
    console.log("Error in connecting to the database : " + error)
})






// --------- on of the approach of connecting the db---------//
// import express from "express"
// const app = express()
// // ifiee se phele ; yeh hona jaruri h 
// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log(error);
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log("listening on this port")
//         })
//     } catch (error) {
//         console.log(error,"error connecting db")
//     }
// })()