// src/controllers/applicationController.js
const db = require('../config/db');
const { sendNotificationToUser } = require('../services/socketService');
const { sendMail } = require('../services/mailService');

// @desc    Ứng viên nộp hồ sơ vào một công việc
// @route   POST /api/applications/:jobId/apply
// @access  Private (Candidate)
exports.applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const candidateId = req.user.id;

        // --- KIỂM TRA GIỚI HẠN VÀ TRẠNG THÁI ---
        // Lấy thông tin job VÀ đếm số hồ sơ đã nộp CHO job đó
        const [jobs] = await db.query(
            `SELECT 
                j.status, 
                j.application_limit, 
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as current_applications
             FROM jobs j
             WHERE j.id = ?`,
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({ message: "Công việc không tồn tại." });
        }

        const job = jobs[0];

        // Kiểm tra trạng thái job trước
        if (job.status !== 'open') {
            return res.status(400).json({ message: "Công việc này đã đóng tuyển." });
        }

        // Kiểm tra giới hạn hồ sơ
        if (job.application_limit !== null && job.current_applications >= job.application_limit) {
            // Tự động đóng job nếu đủ hồ sơ
            await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['closed', jobId]);
            return res.status(400).json({ message: 'Tin tuyển dụng này đã nhận đủ số lượng hồ sơ và đã đóng.' });
        }

        // --- KIỂM TRA ỨNG VIÊN ĐÃ NỘP CHƯA ---
        const [existingApplications] = await db.query(
            'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
            [jobId, candidateId]
        );
        if (existingApplications.length > 0) {
            return res.status(409).json({ message: 'Bạn đã ứng tuyển vào công việc này rồi.' });
        }

        // --- TẠO HỒ SƠ MỚI ---
        const newApplication = {
            job_id: jobId,
            candidate_id: candidateId,
            cv_url: req.body.cv_url || null // Lấy cv_url từ body
        };
        await db.query('INSERT INTO applications SET ?', newApplication);

        // KIỂM TRA LẠI SAU KHI THÊM MỚI ĐỂ ĐÓNG JOB NẾU CẦN
        if (job.application_limit !== null && (job.current_applications + 1) >= job.application_limit) {
            await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['closed', jobId]);
            console.log(`Job ${jobId} automatically closed after reaching application limit.`);
        }

        res.status(201).json({ message: 'Nộp hồ sơ thành công!' });

    } catch (error) {
        console.error("Error in applyToJob:", error);
        res.status(500).json({ message: 'Lỗi server khi nộp hồ sơ' });
    }
};

// @desc    Nhà tuyển dụng xem danh sách ứng viên cho một công việc
// @route   GET /api/applications/:jobId
// @access  Private (Recruiter)
exports.getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user.id;

        // 1. Xác thực quyền
        const [jobs] = await db.query('SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]);
        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy công việc.' });
        }
        if (jobs[0].recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'Bạn không có quyền xem thông tin này.' });
        }

        // 2. Lấy danh sách ứng viên (THÊM a.cv_url VÀO ĐÂY)
        const [applications] = await db.query(
            `SELECT
                 a.id, a.status as applicationStatus, a.applied_at, a.cv_url,
                 u.full_name, u.email, u.phone_number,
                 i.status as interviewStatus -- Lấy trạng thái từ interview mới nhất
             FROM applications a
             JOIN users u ON a.candidate_id = u.id
             LEFT JOIN (
                -- Subquery để lấy interview_id mới nhất cho mỗi application_id
                SELECT application_id, status, ROW_NUMBER() OVER(PARTITION BY application_id ORDER BY created_at DESC) as rn
                FROM interviews
             ) i ON a.id = i.application_id AND i.rn = 1 
                LEFT JOIN offers o ON a.id = o.application_id
             WHERE a.job_id = ?
             ORDER BY a.applied_at DESC`,
            [jobId]
        );

        res.status(200).json(applications);

    } catch (error) {
        console.error("Error in getJobApplicants:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Ứng viên xem lại các hồ sơ đã nộp
// @route   GET /api/applications/my
// @access  Private (Candidate)
exports.getMyApplications = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const [myApplications] = await db.query(
            `SELECT a.status, a.applied_at, j.title, j.location, u.full_name as recruiterName
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u ON j.recruiter_id = u.id
             WHERE a.candidate_id = ?
             ORDER BY a.applied_at DESC`,
            [candidateId]
        );

        res.status(200).json(myApplications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

    // @desc    Nhà tuyển dụng cập nhật trạng thái một hồ sơ
    // @route   PUT /api/applications/:applicationId/status
    // @access  Private (Recruiter)
    exports.updateApplicationStatus = async (req, res) => {
        try {
            const { applicationId } = req.params;
            const { status, rejectionReason } = req.body;
            const recruiterId = req.user.id;

            // Kiểm tra xem status có hợp lệ không
            const validStatuses = ['screening', 'interviewing', 'offered', 'rejected'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
            }

            // Kiểm tra quyền: Đảm bảo nhà tuyển dụng này sở hữu công việc của hồ sơ này
            const [apps] = await db.query(
                `SELECT j.recruiter_id FROM applications a
                 JOIN jobs j ON a.job_id = j.id
                 WHERE a.id = ?`,
                [applicationId]
            );

            if (apps.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
            }
            if (apps[0].recruiter_id !== recruiterId) {
                return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
            }

            // Cập nhật trạng thái
            await db.query('UPDATE applications SET status = ?, rejection_reason = ? WHERE id = ?', [status, rejectionReason, applicationId]);
            if (applicant) {
            sendNotificationToUser(applicant.candidate_id, 'status_update', {
                title: 'Cập nhật trạng thái hồ sơ!',
                body: `Hồ sơ của bạn cho vị trí "${applicant.title}" đã được cập nhật thành: ${status}.`
            });
            }
            res.status(200).json({ message: 'Cập nhật trạng thái thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
    
// @desc    Nhà tuyển dụng nhập kết quả phỏng vấn
// @route   POST /api/applications/:applicationId/result
// @access  Private (Recruiter)
exports.recordInterviewResult = async (req, res) => {
    try {
        const { applicationId } = req.params;
        // Lấy thêm 'comments' từ body, đây sẽ là lời nhắn của NTD
        const { result, comments } = req.body; // 'pass' or 'fail'
        const recruiterId = req.user.id;

        // --- Kiểm tra quyền và thông tin cần thiết ---
        const [apps] = await db.query(
            `SELECT
                a.id, a.candidate_id, -- <-- THÊM candidate_id VÀO ĐÂY
                j.recruiter_id, i.id as interview_id,
                u_cand.email as candidate_email, u_cand.full_name as candidate_name,
                j.title as job_title, c.name as company_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u_cand ON a.candidate_id = u_cand.id
             LEFT JOIN interviews i ON a.id = i.application_id
             LEFT JOIN companies c ON j.company_id = c.id
             WHERE a.id = ? ORDER BY i.created_at DESC LIMIT 1`,
            [applicationId]
        );

        if (apps.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
        }
        const appInfo = apps[0];
        if (appInfo.recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'Bạn không có quyền.' });
        }
        if (!appInfo.interview_id) {
            return res.status(400).json({ message: 'Hồ sơ này chưa được lên lịch phỏng vấn.' });
        }
        if (result !== 'pass' && result !== 'fail') {
             return res.status(400).json({ message: 'Kết quả không hợp lệ (chỉ chấp nhận "pass" hoặc "fail").' });
        }
        // --- Kết thúc kiểm tra ---

        // Tạo kết quả mới trong bảng results
        const newResultEntry = {
            interview_id: appInfo.interview_id,
            result,
            comments, // Lưu lại lời nhắn/nhận xét
        };
        await db.query('INSERT INTO results SET ?', newResultEntry);

        // Cập nhật trạng thái application nếu rớt
        let newAppStatus = '';
        if (result === 'fail') {
            newAppStatus = 'rejected';
            // Cập nhật cả lý do từ chối
            await db.query('UPDATE applications SET status = ?, rejection_reason = ? WHERE id = ?', [newAppStatus, comments, applicationId]);
        } else { // result === 'pass'
            newAppStatus = 'passed_interview';
            await db.query('UPDATE applications SET status = ? WHERE id = ?', [newAppStatus, applicationId]);
        }
        // GỬI EMAIL THÔNG BÁO KẾT QUẢ
        const emailSubject = `Kết quả phỏng vấn vị trí ${appInfo.job_title} tại ${appInfo.company_name}`;
        let emailHtml = `
            <p>Chào ${appInfo.candidate_name},</p>
            <p>Cảm ơn bạn đã tham gia phỏng vấn cho vị trí <strong>${appInfo.job_title}</strong> tại <strong>${appInfo.company_name}</strong>.</p>
        `;
        if (result === 'pass') {
            emailHtml += `
                <p>Chúng tôi rất vui mừng thông báo rằng bạn đã vượt qua vòng phỏng vấn!</p>
                <p>Nhà tuyển dụng sẽ sớm liên hệ với bạn về các bước tiếp theo.</p>
                ${comments ? `<p><strong>Nhận xét từ nhà tuyển dụng:</strong><br/>${comments}</p>` : ''}
            `;
        } else { // result === 'fail'
            emailHtml += `
                <p>Sau quá trình cân nhắc kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng bạn chưa phù hợp với vị trí này ở thời điểm hiện tại.</p>
                ${comments ? `<p><strong>Phản hồi từ nhà tuyển dụng:</strong><br/>${comments}</p>` : ''}
                <p>Chúng tôi sẽ lưu trữ hồ sơ của bạn và liên hệ lại nếu có vị trí khác phù hợp hơn trong tương lai.</p>
                <p>Chúc bạn may mắn trong quá trình tìm kiếm công việc!</p>
            `;
        }
        emailHtml += `<p>Trân trọng,<br/>${appInfo.company_name}</p>`;

        await sendMail(appInfo.candidate_email, emailSubject, emailHtml);

        // Gửi thông báo real-time (tùy chọn)
        sendNotificationToUser(appInfo.candidate_id, 'status_update', {
            title: 'Cập nhật kết quả phỏng vấn!',
            body: `Đã có kết quả phỏng vấn cho vị trí "${appInfo.job_title}". Trạng thái: ${newAppStatus}.` 
        });

        res.status(201).json({ message: 'Đã lưu kết quả phỏng vấn và gửi email thông báo.' });

    } catch (error) {
        console.error("Error in recordInterviewResult:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Nhà tuyển dụng tạo thư mời nhận việc
// @route   POST /api/applications/:applicationId/offer
// @access  Private (Recruiter)
exports.createJobOffer = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { offerLetterContent } = req.body;
        const recruiterId = req.user.id;

        // --- Tương tự, kiểm tra quyền ---
         const [apps] = await db.query(
            `SELECT j.recruiter_id FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = ?`,
            [applicationId]
        );
        if (apps.length === 0 || apps[0].recruiter_id !== recruiterId) {
            return res.status(403).json({ message: 'Bạn không có quyền.' });
        }
        // --- Kết thúc kiểm tra quyền ---

        // Bắt đầu transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Tạo thư mời mới
            const newOffer = {
                application_id: applicationId,
                offer_letter_content: offerLetterContent,
            };
            await connection.query('INSERT INTO offers SET ?', newOffer);

            // 2. Cập nhật trạng thái hồ sơ thành 'offered'
            await connection.query('UPDATE applications SET status = ? WHERE id = ?', ['offered', applicationId]);

            await connection.commit();
            res.status(201).json({ message: 'Gửi thư mời thành công!' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Ứng viên xem lại các hồ sơ đã nộp của mình
// @route   GET /api/applications/my
// @access  Private (Candidate)
exports.getMyApplications = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const [myApplications] = await db.query(
            `SELECT 
                a.id as applicationId,
                a.status, 
                a.applied_at, 
                j.title as job_title, 
                j.location, 
                u.full_name as recruiter_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u ON j.recruiter_id = u.id
             WHERE a.candidate_id = ?
             ORDER BY a.applied_at DESC`,
            [candidateId]
        );

        res.status(200).json(myApplications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getApplicationDetails = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const candidateId = req.user.id;

        // LẤY THÔNG TIN TỪ BẢNG interviews (i)
        const [apps] = await db.query(
            `SELECT
                a.id as applicationId, a.status, a.applied_at, a.rejection_reason,
                j.id as jobId, j.title as job_title,
                -- Các trường bị thiếu đã được thêm vào đây:
                i.id as interview_id,
                i.status as interview_status,
                i.confirmation_deadline,
                -- Các trường cũ:
                i.interview_date, i.location as interview_location, i.notes as interview_notes,
                o.id as offer_id, o.offer_letter_content, o.status as offer_status,
                u.full_name as recruiter_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON j.recruiter_id = u.id
            LEFT JOIN interviews i ON a.id = i.application_id
            LEFT JOIN offers o ON a.id = o.application_id
            WHERE a.id = ? AND a.candidate_id = ?
            -- Lấy bản ghi interview/offer mới nhất nếu có nhiều
            ORDER BY i.created_at DESC, o.created_at DESC
            LIMIT 1`,
            [applicationId, candidateId]
        );

        if (apps.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ hoặc bạn không có quyền xem.' });
        }

        res.status(200).json(apps[0]);
    } catch (error) {
        console.error("Error in getApplicationDetails:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết hồ sơ.' });
    }
};
