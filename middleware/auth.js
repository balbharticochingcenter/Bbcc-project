const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: "Token expired. Please login again." });
            }
            return res.status(403).json({ success: false, message: "Invalid token." });
        }
        req.user = decoded;
        next();
    });
};

const checkStudentBlocked = async (req, res, next) => {
    try {
        const Student = require('../models/Student');
        const studentId = req.params.studentId || req.body.studentId;
        const student = await Student.findOne({ studentId: studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        
        if (student.accountStatus.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: `Account is BLOCKED. Reason: ${student.accountStatus.blockReason}. Contact admin.`,
                isBlocked: true
            });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { verifyToken, checkStudentBlocked };
