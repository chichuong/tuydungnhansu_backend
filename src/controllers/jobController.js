// src/controllers/jobController.js
const db = require('../config/db');

// @desc    Đăng một tin tuyển dụng mới
// @route   POST /api/jobs
// @access  Private (Recruiter)
exports.createJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, application_limit } = req.body;
        const recruiterId = req.user.id;

        // Tìm company_id của nhà tuyển dụng
        const [companies] = await db.query('SELECT id FROM companies WHERE owner_id = ?', [recruiterId]);
        if (companies.length === 0) {
            return res.status(400).json({ message: 'Bạn cần tạo hồ sơ công ty trước khi đăng tin.' });
        }
        const companyId = companies[0].id;

        const limit = (application_limit && !isNaN(parseInt(application_limit, 10)) && parseInt(application_limit, 10) > 0)
                      ? parseInt(application_limit, 10)
                      : null;

        const newJob = {
            recruiter_id: recruiterId,
            company_id: companyId, 
            title, description, requirements, salary, location, application_limit: limit
        };

        const [result] = await db.query('INSERT INTO jobs SET ?', newJob);
        res.status(201).json({ message: 'Đăng tin tuyển dụng thành công!', jobId: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Lấy tất cả tin tuyển dụng (có phân trang, tìm kiếm, lọc)
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const { search, location } = req.query;

        let query = `
            SELECT 
                j.*, 
                c.name as company_name, 
                c.logo_url as company_logo_url 
            FROM jobs j 
            LEFT JOIN companies c ON j.company_id = c.id 
            WHERE j.status = 'open'
        `;
        let countQuery = "SELECT COUNT(*) as total FROM jobs WHERE status = 'open'";
        
        const queryParams = [];
        const countParams = [];

        if (search) {
            query += " AND j.title LIKE ?";
            countQuery += " AND title LIKE ?";
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        if (location) {
            query += " AND j.location LIKE ?";
            countQuery += " AND location LIKE ?";
            queryParams.push(`%${location}%`);
            countParams.push(`%${location}%`);
        }

        query += " ORDER BY j.created_at DESC LIMIT ? OFFSET ?";
        queryParams.push(limit, offset);

        // Lấy jobs cho trang hiện tại
        const [jobs] = await db.query(query, queryParams);

        // Đếm tổng số jobs phù hợp với điều kiện lọc
        const [[{ total }]] = await db.query(countQuery, countParams);
        
        res.status(200).json({
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Lấy chi tiết một tin tuyển dụng
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; 

        // Lấy thông tin chi tiết job và công ty
        const [jobs] = await db.query(
            `SELECT 
                j.*, 
                c.name as company_name, 
                c.logo_url as company_logo_url 
             FROM jobs j 
             LEFT JOIN companies c ON j.company_id = c.id 
             WHERE j.id = ?`,
            [id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
        }
        
        const jobDetail = jobs[0];
        jobDetail.hasApplied = false; // Mặc định là chưa ứng tuyển

        // Nếu người dùng đã đăng nhập, kiểm tra xem họ đã ứng tuyển chưa
        if (userId) {
            const [applications] = await db.query(
                'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
                [id, userId]
            );
            if (applications.length > 0) {
                jobDetail.hasApplied = true; // Đánh dấu đã ứng tuyển
            }
        }

        res.status(200).json(jobDetail); // Trả về jobDetail kèm trạng thái hasApplied
    } catch (error) {
        console.error("Error in getJobById:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Cập nhật một tin tuyển dụng
// @route   PUT /api/jobs/:id
// @access  Private (Owner Recruiter)
exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, requirements, salary, location, status, application_limit } = req.body;
        const recruiterId = req.user.id;

        // Kiểm tra xem tin tuyển dụng có tồn tại và có thuộc về nhà tuyển dụng này không
        const [jobs] = await db.query('SELECT recruiter_id FROM jobs WHERE id = ?', [id]);
        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
        }
        if (jobs[0].recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tin này.' });
        }

        const limit = (application_limit && !isNaN(parseInt(application_limit, 10)) && parseInt(application_limit, 10) > 0)
                      ? parseInt(application_limit, 10)
                      : null;

        const updatedFields = { title, description, requirements, salary, location, status, application_limit: limit };
        await db.query('UPDATE jobs SET ? WHERE id = ?', [updatedFields, id]);

        res.status(200).json({ message: 'Cập nhật tin tuyển dụng thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Xóa một tin tuyển dụng
// @route   DELETE /api/jobs/:id
// @access  Private (Owner Recruiter)
exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const recruiterId = req.user.id;

        // Tương tự như update, kiểm tra quyền sở hữu
        const [jobs] = await db.query('SELECT recruiter_id FROM jobs WHERE id = ?', [id]);
        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
        }
        if (jobs[0].recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa tin này.' });
        }

        await db.query('DELETE FROM jobs WHERE id = ?', [id]);
        res.status(200).json({ message: 'Xóa tin tuyển dụng thành công.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Nhà tuyển dụng lấy các tin đã đăng của mình
// @route   GET /api/jobs/my
// @access  Private (Recruiter)
exports.getMyJobs = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        // SỬA CÂU TRUY VẤN Ở ĐÂY: Thêm JOIN để lấy recruiterName
        const [jobs] = await db.query(
            'SELECT j.*, c.name as company_name, c.logo_url as company_logo_url FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE j.recruiter_id = ?',
            [recruiterId]
        );
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
