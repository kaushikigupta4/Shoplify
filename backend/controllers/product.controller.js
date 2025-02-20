import express from "express";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";

export const getAllProducts= async(req,res)=>{
try {
    const products= await Product.find({})
  

    res.json(products)
        
} catch (error) {
    console.log("Error in getAll Products controller", error.message);
    res.status(500).json({message:"Server error", error:error.message});
}
}
export const getFeaturedProducts=async(req, res)=>{
    try {
       let featuredProducts= await redis.get("featured_products");

       if(featuredProducts){
        return res.json(JSON.parse(featuredProducts))
       }


       //if not in redis , fetch from mongodb
       //.lean() is gonna return a plain javascript object instead of mongoDb document which is good for performance
    
       featuredProducts= await Product.find({isFeatured:true}).lean();
       if(!featuredProducts){
        return res.status(404).json({message:"No featured products found"})
       }
//storing in redis for quick access
await redis.set("featured_products", JSON.stringify(featuredProducts));
       res.json(featuredProducts);
        
    } catch (error) {
        console.log("Error in getFeatured ProductsController", error.message);
        res.status(500).json({message:"server error", error:error.message});
    }
};

export const createProduct=async(req,res)=>{
try {
    const{name, description, price, image, category}= req.body;

    let cloudinaryResponse= null;

    if(image){
        cloudinaryResponse= await cloudinary.uploader.upload(image, {folder:"products"});

    }
    const product= await Product.create({
        name, 
        description, 
        price,
        image:cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url: "",
        category
    });
    res.status(201).json(product);

    
} catch (error) {
console.log("error in create product controller", error.message);
    res.status.json({
        message:"server error", error:error.message
    });
}
}
export const deleteProduct=async(req, res)=>{
    try {
        const product= await Product.findById(req.params.id)

        if(!product){
            return res.status(404).json({message:"Product not found"})
        }
        //first delete from cloudinary(stores image on the cloud as well) and later delete from the database

        //1 delete from the cloudinary
        if(product.image){
    const publicId= product.image.split("/").pop().split(".")[0];
    try {
        await cloudinary.uploader.destroy(`products/${publicId}`)
        console.log("deleted image from cloudinary")
        
    } catch (error) {
        console.log("error deleting image from the cloudinary", error);
    }
        }


        //2 delete from the db
        await Product.findByIdAndDelete(req.params.id)
        res.json({message:"Product deleted succesfully"})
    } catch (error) {
        console.log("error in deleteProduct controller", error.message);
        res.status(500).json({message:"server error", error:error.message})
    }
}

export const getRecommnededProducts=async(req, res)=>{
try {
    const products= await Product.aggregate([
        {
            $sample:{size:3}
        },{
            $project:{
                _id:1,
                name:1,
                description:1,
                image:1,
                price:1
            }
        }
    ]);
    res.json(products);
} catch (error) {
    console.log("error in getRecommendedProducts controller", error.message);
    res.status(500).json({
        message:"server error", error:error.message
    });
}
}


export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
 
export const toggleFeaturedProduct= async(req, res)=>{
    try {
       const product= await Product.findById(req.params.id);
       
       if(product){
        product.isFeatured= !product.isFeatured;
        const updatedProduct= await product.save();
await updateFeaturedProductCache();
res.json(updatedProduct);
       }

       else{
        res.status(404).json({meassge:"Product not found"})
       }
    } catch (error) {
        console.log("error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({
        message:"server error", error:error.message
    });
        
    }
}



async function updateFeaturedProductCache(){
    try {
        const featuredProducts= await Product.find({isFeatured:true}).lean();

    redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("error in update cache");
    }
    

}