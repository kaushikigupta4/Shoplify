import mongoose from "mongoose";

export const connectDB= async ()=>{
    console.log(process.env.MONGO_URI)
    try{
        const conn= await mongoose.connect(process.env.MONGO_URI);

        console.log(`mongodb connected: ${conn.connection.host}`);
    } catch(error){
        console.log("error connecting to mongodb", error.message);
        process.exit(1);
    }
}