// server/src/controllers/uploadController.js

const db = require('../config/db');

// Xử lý upload file chung
const handleUpload = (req, res, successCallback) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn một file.' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, "/")}`;
    successCallback(fileUrl);
};

// Upload CV
exports.uploadCv = (req, res) => {
    handleUpload(req, res, (fileUrl) => {
        res.status(200).json({
            message: 'Tải file CV thành công!',
            url: fileUrl
        });
    });
};

// Upload Avatar
exports.uploadAvatar = (req, res) => {
    handleUpload(req, res, async (fileUrl) => {
        try {
            await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [fileUrl, req.user.id]);
            res.status(200).json({
                message: "Cập nhật ảnh đại diện thành công!",
                url: fileUrl
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi cập nhật CSDL.' });
        }
    });
};