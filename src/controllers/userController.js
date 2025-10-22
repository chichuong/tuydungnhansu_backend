// server/src/controllers/userController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Lấy thông tin của người dùng đang đăng nhập
exports.getMe = async (req, res) => {
    try {
        // Thêm các trường mới vào câu SELECT
        const [users] = await db.query(
            'SELECT id, email, full_name, phone_number, role, avatar_url, headline, bio, linkedin_url, github_url FROM users WHERE id = ?', 
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        res.status(200).json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Cập nhật thông tin cơ bản
exports.updateMe = async (req, res) => {
    try {
        // Lấy các trường mới từ body
        const { fullName, phoneNumber, headline, bio, linkedinUrl, githubUrl } = req.body;
        await db.query(
            'UPDATE users SET full_name = ?, phone_number = ?, headline = ?, bio = ?, linkedin_url = ?, github_url = ? WHERE id = ?', 
            [fullName, phoneNumber, headline, bio, linkedinUrl, githubUrl, req.user.id]
        );
        res.status(200).json({ message: 'Cập nhật thông tin thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
// Thay đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Lấy mật khẩu hiện tại từ DB
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        // So sánh mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu cũ không chính xác.' });
        }

        // Mã hóa và cập nhật mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};