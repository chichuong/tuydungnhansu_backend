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

//  Cập nhật  người dùng
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        // Lấy tất cả các trường có thể sửa từ body
        const { full_name, email, phone_number, role, headline, bio, skills, linkedin_url, github_url /*, new_password */ } = req.body;

        // --- Validation ---
        if (!full_name || !email || !role) {
            return res.status(400).json({ message: 'Họ tên, Email và Vai trò là bắt buộc.' });
        }
        if (!['candidate', 'recruiter', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
        }
        if (parseInt(userId, 10) === req.user.id && role !== 'admin') {
             return res.status(400).json({ message: 'Không thể tự thay đổi vai trò của chính mình thành vai trò thấp hơn.' });
        }
        // Add more validation if needed (email format, etc.)

        // --- Build Update Query ---
         // Exclude password for now, handle separately if needed
        const fieldsToUpdate = {
            full_name,
            email,
            phone_number,
            role,
            headline,
            bio,
            skills,
            linkedin_url,
            github_url
        };

        const [result] = await db.query('UPDATE users SET ? WHERE id = ?', [fieldsToUpdate, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        res.status(200).json({ message: 'Cập nhật thông tin người dùng thành công.' });
    } catch (error) {
        console.error("Error updating user:", error);
        // Handle specific errors like duplicate email if needed
         if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('users.email')) {
            return res.status(409).json({ message: 'Email này đã được sử dụng bởi tài khoản khác.' });
         }
        res.status(500).json({ message: 'Lỗi server' });
    }
};
// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

         // Không cho phép tự xóa chính mình
         if (parseInt(userId, 10) === req.user.id) {
             return res.status(400).json({ message: 'Không thể tự xóa tài khoản của chính mình.' });
         }

        const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        res.status(200).json({ message: 'Xóa người dùng thành công.' });
    } catch (error) {
         // Xử lý lỗi khóa ngoại nếu người dùng này có liên kết (ví dụ: đã đăng job)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Không thể xóa người dùng này vì họ có dữ liệu liên quan (ví dụ: tin tuyển dụng, hồ sơ...). Hãy xem xét việc vô hiệu hóa tài khoản thay vì xóa.' });
        }
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Cập nhật thông tin công ty (Admin có thể sửa mọi công ty)
exports.updateCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        // Lấy tất cả các trường có thể sửa
        const { name, description, address, logo_url } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên công ty là bắt buộc.' });
        }

        const fieldsToUpdate = {
            name,
            description,
            address,
            logo_url // Cho phép sửa cả URL logo (hoặc dùng API upload riêng)
        };

        const [result] = await db.query(
            'UPDATE companies SET ? WHERE id = ?',
            [fieldsToUpdate, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy công ty.' });
        }
        res.status(200).json({ message: 'Cập nhật thông tin công ty thành công.' });
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
//  Xóa công ty
exports.deleteCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const [result] = await db.query('DELETE FROM companies WHERE id = ?', [companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy công ty.' });
        }
         // Cập nhật lại các job thuộc công ty này thành company_id = NULL (do CSDL đã cài đặt ON DELETE SET NULL)
        res.status(200).json({ message: 'Xóa công ty thành công. Các tin tuyển dụng liên quan đã được cập nhật.' });
    } catch (error) {
         if (error.code === 'ER_ROW_IS_REFERENCED_2') { // Mặc dù đã có SET NULL, vẫn nên check
             return res.status(400).json({ message: 'Không thể xóa công ty này ngay lập tức do có ràng buộc dữ liệu. Vui lòng thử lại hoặc kiểm tra các tin tuyển dụng liên quan.' });
         }
        console.error("Error deleting company:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};