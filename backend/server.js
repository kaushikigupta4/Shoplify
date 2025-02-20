import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
// import cors from "cors";


dotenv.config();

import { connectDB } from "./lib/db.js";


const app= express();
const PORT= process.env.PORT || 5000;

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import path from "path";

// const __dirname = path.resolve();

app.use(express.json({limit:"10mb"}));// allows us to parse
app.use(cookieParser())
//authentication
// app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/coupons",couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

//  if(process.env.NODE_ENV==="production"){
//      app.use(express.static(path.join(__dirname,"/frontend/dist")))
//  }
//  app.get("*", (req,res)=>{
//     res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
//  })
app.listen(5000, ()=>{
    console.log("server is running at port", PORT);
    connectDB();
})