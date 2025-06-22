import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log("Server is running " + process.env.PORT || 8000);
    })
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