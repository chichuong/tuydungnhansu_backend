// src/controllers/authController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Chức năng Đăng ký
exports.register = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        // --- Validation cơ bản ---
        if (!email || !password || !fullName || !role) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
        }

        // --- Kiểm tra email đã tồn tại chưa ---
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ message: 'Email đã được sử dụng.' });
        }

        // --- Mã hóa mật khẩu ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- Lưu người dùng vào database ---
        const newUser = {
            email,
            password: hashedPassword,
            full_name: fullName,
            role
        };
        await db.query('INSERT INTO users SET ?', newUser);

        res.status(201).json({ message: 'Tạo tài khoản thành công!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
    }
};

// 2. Chức năng Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Validation cơ bản ---
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
        }

        // --- Tìm người dùng trong DB ---
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
        const user = users[0];

        // --- So sánh mật khẩu ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // --- Tạo JWT Token ---
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1d' // Token hết hạn sau 1 ngày
        });

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
    }
};