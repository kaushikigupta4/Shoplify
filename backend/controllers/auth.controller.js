import User from "../models/user.model.js";
import {redis} from "../lib/redis.js"
import jwt from "jsonwebtoken";

const generateTokens=(userId)=>{
    const accessToken= jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:"15m"}
);
    const refreshToken= jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:"7d"});
        return {accessToken, refreshToken};
};

const storeRefreshToken= async(userId,refreshToken)=>{
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7*24*60*60);
}


const setCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 15 * 60 * 1000, // 15 minutes
	});

    res.cookie("refreshToken", refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 7*24*60*60*1000, // 7 days
	});
}


export const signup = async (req, res)=>{
    const {email, password, name}= req.body;
    try {
        const userExists= await User.findOne({email});
    if(userExists){
        return res.status(400).json({message:"User already Exists"})
    }

    const user= await User.create({name, email, password});

    //authenticate the user
    const {accessToken, refreshToken}= generateTokens(user._id);

    await storeRefreshToken(user._id,refreshToken);

    setCookies(res, accessToken, refreshToken);
   console.log(accessToken, refreshToken);
  

    res.status(201).json({user:{
        _id: user._id,
        name:user.name,
        email:user.email,
        role: user.role
    }, message:"User created Succesfully"});
    
}

    catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({message:error.message});
    }
    
}

export const login = async (req, res)=>{
    try {
        const {email, password}= req.body;
        console.log("1");
        const user= await User.findOne({email});
        console.log("2");
        if(user && (await user.comparePassword(password))){
            const {accessToken, refreshToken}= generateTokens(user._id);

            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);
            res.json({
                user:{
                _id: user._id,
                name:user.name,
                email:user.email,
                role:user.role
                }, message:"logged in succesfully"
            })
        }
        else {
			res.status(400).json({ message: "Invalid email or password" });
		}


        

    } catch (error) {
        console.log("error in login controller", error.message);
        res.status(500).json({message:error.message});
        
    }
    
};



export const logout = async (req, res)=>{
    try {
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            // refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2E4YzY4MjMyYzhiODQxZTVmZTRkZDUiLCJpYXQiOjE3MzkxMTQxMTQsImV4cCI6MTczOTExNTAxNH0.146MPKeGXFSf0WMTpgYuJMWsOj5E8Gygtb-LLmQOZRY
            const decoded= jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log(decoded);
            await redis.del(`refresh_token:${decoded.userId}`)
        }
        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");
        res.json({message:"Logged out succesfully"});
    } catch (error) {
        res.status(500).json({message:"This is the error",error:error.message});
    }
};













 export const refreshToken=async(req,res)=>{
    try {
        const refreshToken= req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message:"No refresh token provided"});
        
        }
        const decoded= jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const storedToken= await redis.get(`refresh_token:${decoded.userId}`);

        if(storedToken!== refreshToken){
            return res.status(401).json({
                message:"Refresh token does not match stored token"
            });
           
        }
       


            const accessToken= jwt.sign({
                userId:decoded.userId
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
console.log("3")
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000,
            });

            res.json({ message: "Token refreshed successfully" });

        console.log("4")
    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
    }
 }

 export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};