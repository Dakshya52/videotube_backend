import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// ----- anther way of connecting the db -----//
const connectDB = async () => {
    try {
        const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Connected to MongoDB at ${connectionInstance.connection.host}`);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1); // process gives the referecne to the current process
    }
}


export default connectDB;