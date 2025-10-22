// server/src/controllers/profileController.js
const db = require('../config/db');

// Lấy toàn bộ thông tin hồ sơ của người dùng
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [experiences] = await db.query('SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date DESC', [userId]);
        const [educations] = await db.query('SELECT * FROM educations WHERE user_id = ? ORDER BY start_date DESC', [userId]);
        res.status(200).json({ experiences, educations });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// --- CRUD cho Kinh nghiệm làm việc ---
exports.addExperience = async (req, res) => {
    try {
        const { job_title, company_name, start_date, end_date, description } = req.body;
        const userId = req.user.id;
        const [result] = await db.query(
            'INSERT INTO work_experiences (user_id, job_title, company_name, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, job_title, company_name, start_date, end_date, description]
        );
        res.status(201).json({ id: result.insertId, message: 'Thêm kinh nghiệm thành công.' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

exports.updateExperience = async (req, res) => {
    try {
        const { job_title, company_name, start_date, end_date, description } = req.body;
        const { expId } = req.params;
        const userId = req.user.id;
        await db.query(
            'UPDATE work_experiences SET job_title = ?, company_name = ?, start_date = ?, end_date = ?, description = ? WHERE id = ? AND user_id = ?',
            [job_title, company_name, start_date, end_date, description, expId, userId]
        );
        res.status(200).json({ message: 'Cập nhật kinh nghiệm thành công.' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

exports.deleteExperience = async (req, res) => {
    try {
        const { expId } = req.params;
        const userId = req.user.id;
        await db.query('DELETE FROM work_experiences WHERE id = ? AND user_id = ?', [expId, userId]);
        res.status(200).json({ message: 'Xóa kinh nghiệm thành công.' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// --- CRUD cho Học vấn  ---
exports.addEducation = async (req, res) => {
    try {
        const { school, degree, field_of_study, start_date, end_date } = req.body;
        const userId = req.user.id;
        if (!school || !degree || !start_date) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ Tên trường, Bằng cấp và Ngày bắt đầu.' });
        }
        const [result] = await db.query(
            'INSERT INTO educations (user_id, school, degree, field_of_study, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, school, degree, field_of_study, start_date, end_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Thêm học vấn thành công.' });
    } catch (error) {
        console.error("Error in addEducation:", error);
        res.status(500).json({ message: 'Lỗi server khi thêm học vấn.' });
    }
};

exports.updateEducation = async (req, res) => {
    try {
        const { school, degree, field_of_study, start_date, end_date } = req.body;
        const { eduId } = req.params;
        const userId = req.user.id;
         if (!school || !degree || !start_date) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ Tên trường, Bằng cấp và Ngày bắt đầu.' });
        }
        const [result] = await db.query(
            'UPDATE educations SET school = ?, degree = ?, field_of_study = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?',
            [school, degree, field_of_study, start_date, end_date, eduId, userId]
        );
         if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mục học vấn hoặc bạn không có quyền sửa.' });
        }
        res.status(200).json({ message: 'Cập nhật học vấn thành công.' });
    } catch (error) {
        console.error("Error in updateEducation:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật học vấn.' });
    }
};

exports.deleteEducation = async (req, res) => {
    try {
        const { eduId } = req.params;
        const userId = req.user.id;
        const [result] = await db.query('DELETE FROM educations WHERE id = ? AND user_id = ?', [eduId, userId]);
         if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mục học vấn hoặc bạn không có quyền xóa.' });
        }
        res.status(200).json({ message: 'Xóa học vấn thành công.' });
    } catch (error) {
        console.error("Error in deleteEducation:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa học vấn.' });
    }
};