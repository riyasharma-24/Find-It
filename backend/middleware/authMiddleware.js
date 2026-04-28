const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ❌ No token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = authHeader.split(" ")[1];

    // ✅ VERIFY WITH SAME SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ attach user id
    req.userId = decoded.id;

    next();

  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};