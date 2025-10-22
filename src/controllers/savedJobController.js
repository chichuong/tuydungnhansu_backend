// server/src/controllers/savedJobController.js
const db = require('../config/db');

// Lưu một công việc
exports.saveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        await db.query('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [userId, jobId]);
        res.status(201).json({ message: 'Đã lưu việc làm.' });
    } catch (error) {
        // Lỗi do vi phạm UNIQUE KEY (đã lưu rồi)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Việc làm này đã được lưu.' });
        }
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Bỏ lưu một công việc
exports.unsaveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        await db.query('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId]);
        res.status(200).json({ message: 'Đã bỏ lưu việc làm.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy danh sách các công việc đã lưu
exports.getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const [jobs] = await db.query(
            `SELECT j.*, u.full_name as recruiterName 
             FROM jobs j
             JOIN users u ON j.recruiter_id = u.id
             JOIN saved_jobs sj ON j.id = sj.job_id
             WHERE sj.user_id = ?`,
            [userId]
        );
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};