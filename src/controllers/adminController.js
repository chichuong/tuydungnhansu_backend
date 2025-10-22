// server/src/controllers/adminController.js
const db = require('../config/db');

exports.getSystemStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) as totalUsers FROM users");
        const [[{ totalCompanies }]] = await db.query("SELECT COUNT(*) as totalCompanies FROM companies");
        const [[{ totalJobs }]] = await db.query("SELECT COUNT(*) as totalJobs FROM jobs");
        const [[{ totalApplications }]] = await db.query("SELECT COUNT(*) as totalApplications FROM applications");

        res.status(200).json({ totalUsers, totalCompanies, totalJobs, totalApplications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const [users] = await db.query(
            'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM users");

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const [companies] = await db.query('SELECT id, name, address FROM companies ORDER BY created_at DESC');
        res.status(200).json({ companies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAllJobs = async (req, res) => {
    try {
        const [jobs] = await db.query(
            `SELECT 
                j.*, -- Lấy tất cả các cột từ bảng jobs
                c.name as company_name, 
                c.logo_url as company_logo_url
             FROM jobs j 
             LEFT JOIN companies c ON j.company_id = c.id 
             ORDER BY j.created_at DESC`
        );
        res.status(200).json({ jobs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
exports.getAllApplications = async (req, res) => {
    try {
        const [applications] = await db.query(
            `SELECT a.id, a.status, u.full_name as candidate_name, j.title as job_title
             FROM applications a
             JOIN users u ON a.candidate_id = u.id
             JOIN jobs j ON a.job_id = j.id
             ORDER BY a.applied_at DESC`
        );
        res.status(200).json({ applications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};