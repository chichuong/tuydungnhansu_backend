// server/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 
const authController = require('../controllers/authController'); 
const bcrypt = require('bcryptjs'); 
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { protect, isAdmin } = require('../middleware/authMiddleware');


const checkAdminSession = (req, res, next) => {
    if (req.session && req.session.adminUser) {
        next(); 
    } else {
        res.redirect('/api/admin/login'); 
    }
};

// GET /api/admin/login
router.get('/login', (req, res) => {
    if (req.session && req.session.adminUser) {
        return res.redirect('/api/admin/dashboard');
    }
    res.render('admin_login', { error: null, token: null });
});

// POST /api/admin/login - Xử lý form đăng nhập 
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.render('admin_login', { error: 'Vui lòng nhập đủ email và mật khẩu.', token: null });
        }
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || users[0].role !== 'admin') {
            return res.render('admin_login', { error: 'Email không tồn tại hoặc không phải Admin.', token: null });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('admin_login', { error: 'Mật khẩu không chính xác.', token: null });
        }

        // --- TẠO TOKEN ---
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1d' 
        });

        // Lưu thông tin admin vào session (vẫn giữ để bảo vệ trang EJS)
        req.session.adminUser = {
            id: user.id,
            email: user.email,
            fullName: user.full_name
        };
        console.log("Admin login successful, session created, token generated.");
         res.render('admin_login', { error: null, token: token });


    } catch (error) {
        console.error("Admin login error:", error);
        res.render('admin_login', { error: 'Lỗi server, vui lòng thử lại.', token: null });
    }
});
router.get('/dashboard', checkAdminSession, async (req, res) => {
    try {
        // Gọi API hoặc logic để lấy stats (tương tự adminController.getSystemStats)
        const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) as totalUsers FROM users");
        const [[{ totalCompanies }]] = await db.query("SELECT COUNT(*) as totalCompanies FROM companies");
        const [[{ totalJobs }]] = await db.query("SELECT COUNT(*) as totalJobs FROM jobs");
        const [[{ totalApplications }]] = await db.query("SELECT COUNT(*) as totalApplications FROM applications");

        const statsData = { totalUsers, totalCompanies, totalJobs, totalApplications };

        // Render trang EJS và truyền dữ liệu stats vào
        res.render('admin_dashboard', { stats: statsData });
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        res.render('admin_dashboard', { stats: null }); // Render trang với lỗi
    }
});

// GET /admin/logout - Xử lý đăng xuất
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Error destroying session:", err);
        res.redirect('/api/admin/login');
    });
});

// GET /api/admin/users-list - Hiển thị danh sách người dùng (TRANG WEB)
router.get('/users-list', checkAdminSession, async (req, res) => {
    try {
        // Tái sử dụng logic lấy users từ adminController hoặc gọi trực tiếp db
        const page = 1; // Tạm thời lấy trang 1
        const limit = 20; // Giới hạn 20 users
        const offset = (page - 1) * limit;

        const [users] = await db.query(
            'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.render('admin_users', { users: users }); // Render trang EJS với dữ liệu users

    } catch (error) {
        console.error("Error fetching users for admin page:", error);
        res.render('admin_users', { users: [] }); // Render trang với mảng rỗng nếu lỗi
    }
});

// GET /api/admin/companies-list - Hiển thị danh sách công ty (TRANG WEB)
router.get('/companies-list', checkAdminSession, async (req, res) => {
    try {
        // Lấy danh sách công ty (có thể dùng lại hàm controller nếu muốn)
        const [companies] = await db.query('SELECT id, name, address, logo_url FROM companies ORDER BY created_at DESC');

        res.render('admin_companies', { companies: companies }); // Render trang EJS

    } catch (error) {
        console.error("Error fetching companies for admin page:", error);
        res.render('admin_companies', { companies: [] }); // Render trang rỗng nếu lỗi
    }
});

// GET /api/admin/jobs-list - Hiển thị danh sách việc làm (TRANG WEB)
router.get('/jobs-list', checkAdminSession, async (req, res) => {
    try {
        // Lấy danh sách việc làm (tái sử dụng logic từ adminController)
         const [jobs] = await db.query(
            `SELECT j.id, j.title, j.location, c.name as company_name
             FROM jobs j
             LEFT JOIN companies c ON j.company_id = c.id
             ORDER BY j.created_at DESC`
         );

        res.render('admin_jobs', { jobs: jobs }); // Render trang EJS

    } catch (error) {
        console.error("Error fetching jobs for admin page:", error);
        res.render('admin_jobs', { jobs: [] }); // Render trang rỗng nếu lỗi
    }
});

// GET /api/admin/applications-list - Hiển thị danh sách hồ sơ (TRANG WEB)
router.get('/applications-list', checkAdminSession, async (req, res) => {
    try {
        // Lấy danh sách hồ sơ (tái sử dụng logic từ adminController)
        const [applications] = await db.query(
            `SELECT a.id, a.status, u.full_name as candidate_name, j.title as job_title
             FROM applications a
             JOIN users u ON a.candidate_id = u.id
             JOIN jobs j ON a.job_id = j.id
             ORDER BY a.applied_at DESC`
        );

        res.render('admin_applications', { applications: applications }); // Render trang EJS

    } catch (error) {
        console.error("Error fetching applications for admin page:", error);
        res.render('admin_applications', { applications: [] }); // Render trang rỗng nếu lỗi
    }
});

// GET /api/admin/users/:userId/edit - Hiển thị form sửa user
router.get('/users/:userId/edit', checkAdminSession, async (req, res) => {
    try {
        const { userId } = req.params;
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.redirect('/api/admin/users-list');
        }
        res.render('admin_edit_user', { user: users[0], error: null }); 
    } catch (error) {
        console.error("Error fetching user for edit:", error);
        res.redirect('/api/admin/users-list'); // Chuyển hướng nếu lỗi
    }
});

// POST /api/admin/users/:userId/edit - Xử lý cập nhật user từ form
router.post('/users/:userId/edit', checkAdminSession, async (req, res) => {
    try {
        const { userId } = req.params;
        const updatedData = req.body;

        if (!updatedData.full_name || !updatedData.email || !updatedData.role) {
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
            return res.render('admin_edit_user', {
                user: users[0], // Giữ lại data cũ để hiển thị lại form
                error: 'Họ tên, Email và Vai trò là bắt buộc.'
            });
        }
        const fieldsToUpdate = {
            full_name: updatedData.full_name,
            email: updatedData.email,
            phone_number: updatedData.phone_number || null,
            role: updatedData.role,
            headline: updatedData.headline || null,
            bio: updatedData.bio || null,
            skills: updatedData.skills || null,
            linkedin_url: updatedData.linkedin_url || null,
            github_url: updatedData.github_url || null
        };

        await db.query('UPDATE users SET ? WHERE id = ?', [fieldsToUpdate, userId]);

        res.redirect('/api/admin/users-list');

    } catch (error) {
        console.error("Error updating user from form:", error);
        const { userId } = req.params;
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        let errorMessage = 'Lỗi server, vui lòng thử lại.';
         if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('users.email')) {
            errorMessage = 'Email này đã được sử dụng bởi tài khoản khác.';
         }
        res.render('admin_edit_user', { user: users[0], error: errorMessage });
    }
});

// GET /api/admin/companies/:companyId/edit - Hiển thị form sửa company
router.get('/companies/:companyId/edit', checkAdminSession, async (req, res) => {
    try {
        const { companyId } = req.params;
        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [companyId]);
        if (companies.length === 0) {
            return res.redirect('/api/admin/companies-list');
        }
        res.render('admin_edit_company', { company: companies[0], error: null });
    } catch (error) {
        console.error("Error fetching company for edit:", error);
        res.redirect('/api/admin/companies-list');
    }
});

// POST /api/admin/companies/:companyId/edit - Xử lý cập nhật company từ form
router.post('/companies/:companyId/edit', checkAdminSession, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, description, address, logo_url } = req.body;

        if (!name) {
            const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [companyId]);
            return res.render('admin_edit_company', {
                company: companies[0],
                error: 'Tên công ty là bắt buộc.'
            });
        }

        const fieldsToUpdate = {
            name,
            description: description || null,
            address: address || null,
            logo_url: logo_url || null
        };

        await db.query('UPDATE companies SET ? WHERE id = ?', [fieldsToUpdate, companyId]);

        res.redirect('/api/admin/companies-list');

    } catch (error) {
        console.error("Error updating company from form:", error);
        const { companyId } = req.params;
        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [companyId]);
        res.render('admin_edit_company', { company: companies[0], error: 'Lỗi server, vui lòng thử lại.' });
    }
});

// GET /api/admin/jobs/:jobId/edit - Hiển thị form sửa job
router.get('/jobs/:jobId/edit', checkAdminSession, async (req, res) => {
    try {
        const { jobId } = req.params;
        // Lấy thông tin chi tiết job
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (jobs.length === 0) {
            return res.redirect('/api/admin/jobs-list');
        }
        // Lấy danh sách công ty để hiển thị dropdown
        const [companies] = await db.query('SELECT id, name FROM companies ORDER BY name ASC');

        res.render('admin_edit_job', { job: jobs[0], companies: companies, error: null });
    } catch (error) {
        console.error("Error fetching job for edit:", error);
        res.redirect('/api/admin/jobs-list');
    }
});

// POST /api/admin/jobs/:jobId/edit - Xử lý cập nhật job từ form
router.post('/jobs/:jobId/edit', checkAdminSession, async (req, res) => {
    try {
        const { jobId } = req.params;
        // Lấy dữ liệu từ form
        const { title, company_id, location, salary, application_limit, status, description, requirements } = req.body;

        // --- Validation ---
        if (!title || !company_id || !status) {
             const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
             const [companies] = await db.query('SELECT id, name FROM companies ORDER BY name ASC');
             return res.render('admin_edit_job', {
                 job: jobs[0],
                 companies: companies,
                 error: 'Tiêu đề, Công ty và Trạng thái là bắt buộc.'
             });
        }
        // ... (Thêm validation khác nếu cần) ...

         // Chuyển đổi application_limit
         const limit = (application_limit && !isNaN(parseInt(application_limit, 10)) && parseInt(application_limit, 10) > 0)
                      ? parseInt(application_limit, 10)
                      : null;

        // --- Gọi logic cập nhật ---
        const fieldsToUpdate = {
            title,
            company_id: parseInt(company_id, 10), // Chuyển sang số
            location: location || null,
            salary: salary || null,
            application_limit: limit,
            status,
            description: description || null,
            requirements: requirements || null
        };

        await db.query('UPDATE jobs SET ? WHERE id = ?', [fieldsToUpdate, jobId]);

        res.redirect('/api/admin/jobs-list'); // Quay lại trang danh sách

    } catch (error) {
        console.error("Error updating job from form:", error);
        const { jobId } = req.params;
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const [companies] = await db.query('SELECT id, name FROM companies ORDER BY name ASC');
        res.render('admin_edit_job', { job: jobs[0], companies: companies, error: 'Lỗi server, vui lòng thử lại.' });
    }
});

// GET /api/admin/applications/:appId/details - Hiển thị chi tiết hồ sơ (TRANG WEB)
router.get('/applications/:appId/details', checkAdminSession, async (req, res) => {
    try {
        const { appId } = req.params;

        // Query lấy thông tin chi tiết
        const [applications] = await db.query(
            `SELECT
                a.id, a.status, a.applied_at, a.rejection_reason, a.cv_url,
                u.full_name as candidate_name, u.email, u.phone_number,
                j.title as job_title, j.location,
                c.name as company_name
             FROM applications a
             JOIN users u ON a.candidate_id = u.id
             JOIN jobs j ON a.job_id = j.id
             LEFT JOIN companies c ON j.company_id = c.id
             WHERE a.id = ?`,
            [appId]
        );

        if (applications.length === 0) {
            return res.redirect('/api/admin/applications-list'); // Hoặc hiển thị trang lỗi 404
        }

        res.render('admin_application_details', { application: applications[0] });

    } catch (error) {
        console.error("Error fetching application details for admin page:", error);
        res.redirect('/api/admin/applications-list'); // Chuyển hướng nếu lỗi
    }
});


router.use(protect, isAdmin); 
router.get('/stats', adminController.getSystemStats);
router.get('/users', adminController.getAllUsers);
router.get('/companies', adminController.getAllCompanies);
router.get('/jobs', adminController.getAllJobs);
router.get('/applications', adminController.getAllApplications);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/companies/:companyId', adminController.updateCompany);
router.delete('/companies/:companyId', adminController.deleteCompany); 

module.exports = router;