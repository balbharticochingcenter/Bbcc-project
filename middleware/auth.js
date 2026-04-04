const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid token" });
        }
        req.user = decoded;
        next();
    });
};

module.exports = { verifyToken };
