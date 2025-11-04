import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false, // ❗ because you're on localhost (HTTP)
    sameSite: "lax", // ✅ allows cookie to work between localhost ports
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};
