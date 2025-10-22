// server/src/controllers/reportController.js

const db = require('../config/db');

// @desc    Lấy các số liệu thống kê cho nhà tuyển dụng
// @route   GET /api/reports/statistics
// @access  Private (Recruiter)
exports.getStatistics = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        // 1. Tổng số tin đã đăng
        const [totalJobsResult] = await db.query(
            "SELECT COUNT(*) as totalJobs FROM jobs WHERE recruiter_id = ?",
            [recruiterId]
        );
        const totalJobs = totalJobsResult[0].totalJobs;

        // 2. Tổng số hồ sơ đã nhận (cho các tin của nhà tuyển dụng này)
        const [totalApplicationsResult] = await db.query(
            `SELECT COUNT(*) as totalApplications FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE j.recruiter_id = ?`,
            [recruiterId]
        );
        const totalApplications = totalApplicationsResult[0].totalApplications;

        // 3. Thống kê hồ sơ theo từng trạng thái
        const [statusCountsResult] = await db.query(
            `SELECT a.status, COUNT(*) as count FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE j.recruiter_id = ?
             GROUP BY a.status`,
            [recruiterId]
        );

        // Chuyển đổi kết quả thành một object dễ dùng
        const statusCounts = {
            pending: 0,
            screening: 0,
            interviewing: 0,
            offered: 0,
            rejected: 0
        };
        statusCountsResult.forEach(row => {
            statusCounts[row.status] = row.count;
        });

        // Gộp tất cả kết quả và trả về
        res.status(200).json({
            totalJobs,
            totalApplications,
            statusCounts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};