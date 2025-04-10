import mongoose from "mongoose";


 export const connectDB = async() =>{
    await mongoose.connect('mongodb+srv://baogocm:22102003@cluster0.lrap7zq.mongodb.net/food-order').then(()=>console.log("db connected"));
}