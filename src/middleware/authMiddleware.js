// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next(); 
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Token không hợp lệ, không có quyền truy cập.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Không tìm thấy token, không có quyền truy cập.' });
    }
};

// Middleware kiểm tra vai trò nhà tuyển dụng
exports.isRecruiter = (req, res, next) => {
    if (req.user && req.user.role === 'recruiter') {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối, yêu cầu vai trò Nhà tuyển dụng.' });
    }
};

// Middleware kiểm tra vai trò ứng viên
exports.isCandidate = (req, res, next) => {
    if (req.user && req.user.role === 'candidate') {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối, yêu cầu vai trò Ứng viên.' });
    }
};

// Middleware kiểm tra vai trò admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Yêu cầu vai trò Admin.' });
    }
};