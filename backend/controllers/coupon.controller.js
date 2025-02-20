import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
	try {
		if (!req.user || !req.user._id) {
			return res.status(401).json({ message: "Unauthorized: User ID is missing" });
		}

		console.log("User ID:", req.user._id); // Debugging log

		const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true });

		if (!coupon) {
			return res.json(null);
		}

		res.json(coupon);
	} catch (error) {
		console.error("Error in getCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const validateCoupon = async (req, res) => {
	try {
		const { code } = req.body;

		if (!code) {
			return res.status(400).json({ message: "Coupon code is required" });
		}

		if (!req.user || !req.user._id) {
			return res.status(401).json({ message: "Unauthorized: User ID is missing" });
		}

		console.log("Validating coupon for User ID:", req.user._id, "with Code:", code);

		const coupon = await Coupon.findOne({ code, userId: req.user._id, isActive: true });

		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}

		// Ensure expirationDate is a valid Date before comparison
		if (!coupon.expirationDate || new Date(coupon.expirationDate) < new Date()) {
			coupon.isActive = false;
			await coupon.save();
			return res.status(400).json({ message: "Coupon expired" });
		}

		res.json({
			message: "Coupon is valid",
			code: coupon.code,
			discountPercentage: coupon.discountPercentage,
		});
	} catch (error) {
		console.error("Error in validateCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
