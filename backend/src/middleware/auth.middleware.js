import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("All cookies:", req.cookies); // Debug - sabhi cookies dekho
    console.log("Headers:", req.headers); // Debug - headers dekho

    const token = req.cookies.jwt;
    console.log("JWT token from cookie:", token); // Debug

    if (!token) {
      console.log("No token found in cookies"); // Debug
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    console.log("User found:", user ? "Yes" : "No"); // Debug

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Bhai, exactly sahi pakda tune! ✅
// Ye jo protectRoute middleware hai, iska kaam hai:

// Request se JWT token lena → verify karna → user ko allow ya reject karna depending on valid ya invalid token.