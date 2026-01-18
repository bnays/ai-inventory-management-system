// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.protect = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

        if (!token) return res.status(401).json({ message: "Access denied: No token" });

        try {
            // 1. Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 2. IMPORTANT: Attach the decoded data to the request
            // This is where req.user.user_id comes from!
            req.user = decoded;

            // 3. Role-based check
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: "Forbidden: Access denied" });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: "Token invalid" });
        }
    };
};