// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.protect = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

        if (!token) return res.status(401).json({ message: "Access denied: No token" });

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: "Invalid or expired token" });

            // Check Role-Based Access Control (RBAC)
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Insufficient permissions" });
            }

            req.user = decoded; // Attach user info to request
            next();
        });
    };
};