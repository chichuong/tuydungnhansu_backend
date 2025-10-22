const db = require('../config/db');
const { sendNotificationToUser } = require('../services/socketService');
const { sendMail } = require('../services/mailService');
const { format } = require('date-fns');

exports.scheduleInterview = async (req, res) => {
    try {
        const { applicationId, interviewDate, location, notes } = req.body;
        const recruiterId = req.user.id; // ID của nhà tuyển dụng đang thực hiện hành động

        if (!applicationId || !interviewDate) {
            return res.status(400).json({ message: 'ID hồ sơ và ngày phỏng vấn là bắt buộc.' });
        }

        // --- KIỂM TRA QUYỀN TRUY CẬP (RÀ SOÁT LẠI) ---
        // Lấy thông tin cần thiết: candidate_id, email, tên ứng viên, tiêu đề job, tên công ty
        // VÀ QUAN TRỌNG NHẤT: recruiter_id của job đó để so sánh
        const [apps] = await db.query(
            `SELECT
                a.candidate_id,
                u_cand.email as candidate_email,
                u_cand.full_name as candidate_name,
                j.title as job_title,
                j.recruiter_id as job_recruiter_id, -- Lấy ID NTD sở hữu job
                c.name as company_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u_cand ON a.candidate_id = u_cand.id
             LEFT JOIN companies c ON j.company_id = c.id
             WHERE a.id = ?`, // Chỉ cần lọc theo application ID
            [applicationId]
        );

        // Kiểm tra xem hồ sơ có tồn tại không
        if (apps.length === 0) {
             return res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng tuyển.' });
        }
        const appInfo = apps[0];

        // So sánh ID của NTD đang hành động với ID NTD sở hữu job của hồ sơ này
        if (appInfo.job_recruiter_id !== recruiterId) {
            console.log(`Permission denied: Recruiter ${recruiterId} trying to schedule for job owned by ${appInfo.job_recruiter_id}`);
            return res.status(403).json({ message: 'Bạn không có quyền lên lịch phỏng vấn cho hồ sơ này.' });
        }
        // --- KẾT THÚC KIỂM TRA QUYỀN ---


        // Tính deadline (giữ nguyên)
        const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
        const formattedInterviewDate = format(new Date(interviewDate), 'HH:mm dd/MM/yyyy');
        const formattedDeadline = format(deadline, 'HH:mm dd/MM/yyyy');

        const connection = await db.getConnection();
        await connection.beginTransaction();
            try {
                // 1. Cập nhật trạng thái hồ sơ thành 'interviewing'
                await connection.query('UPDATE applications SET status = ? WHERE id = ?', ['interviewing', applicationId]);

                // 2. Tạo một lịch phỏng vấn mới
                const newInterview = {
                    application_id: applicationId,
                    interview_date: interviewDate,
                    location,
                    notes,
                    confirmation_deadline: deadline,
                    status: 'scheduled'
                };
                await connection.query('INSERT INTO interviews SET ?', newInterview);
                
                const emailSubject = `Thư mời phỏng vấn vị trí ${appInfo.job_title} tại ${appInfo.company_name}`;
            const emailHtml = `
                <p>Chào ${appInfo.candidate_name},</p>
                <p>Cảm ơn bạn đã ứng tuyển vào vị trí <strong>${appInfo.job_title}</strong> tại <strong>${appInfo.company_name}</strong>.</p>
                <p>Chúng tôi trân trọng mời bạn tham gia buổi phỏng vấn với thông tin như sau:</p>
                <ul>
                    <li><strong>Thời gian:</strong> ${formattedInterviewDate}</li>
                    <li><strong>Địa điểm:</strong> ${location || 'Sẽ thông báo sau'}</li>
                    ${notes ? `<li><strong>Ghi chú:</strong> ${notes}</li>` : ''}
                </ul>
                <p>Vui lòng xác nhận tham gia hoặc từ chối lịch phỏng vấn này trong ứng dụng trước <strong>${formattedDeadline}</strong>.</p>
                <p>Trân trọng,<br/>${appInfo.company_name}</p>
            `;
            await sendMail(appInfo.candidate_email, emailSubject, emailHtml);

            await connection.commit();
            res.status(201).json({ message: 'Lên lịch phỏng vấn và gửi email mời thành công!' });

        } catch (error) {
            await connection.rollback();
            console.error("Error scheduling interview:", error);
            res.status(500).json({ message: 'Lỗi server khi lên lịch.' });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateInterviewStatus = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { status } = req.body; // 'confirmed' or 'declined'
        const candidateId = req.user.id; // Get candidate ID from their token

        // Validate status
        if (status !== 'confirmed' && status !== 'declined') {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
        }

        // Check permission and interview status/deadline
        const [interviews] = await db.query(
            `SELECT i.id, i.status as current_status, i.confirmation_deadline,
                    a.candidate_id,
                    j.recruiter_id, u_cand.full_name as candidate_name, j.title as job_title
             FROM interviews i
             JOIN applications a ON i.application_id = a.id
             JOIN jobs j ON a.job_id = j.id
             JOIN users u_cand ON a.candidate_id = u_cand.id
             WHERE i.id = ?`,
            [interviewId]
        );

        if (interviews.length === 0 || interviews[0].candidate_id !== candidateId) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
        }

        const interview = interviews[0];

        // Check if it's still 'scheduled' and within the deadline
        if (interview.current_status !== 'scheduled') {
            return res.status(400).json({ message: 'Bạn đã phản hồi lịch hẹn này hoặc nó đã hết hạn.' });
        }
        if (new Date() > new Date(interview.confirmation_deadline)) {
            // Optionally auto-decline here, or let the cron job handle it
             await db.query('UPDATE interviews SET status = ? WHERE id = ?', ['declined', interviewId]); // Auto-decline
            return res.status(400).json({ message: 'Đã quá hạn xác nhận lịch phỏng vấn.' });
        }
        
        // Update interview status
        await db.query('UPDATE interviews SET status = ? WHERE id = ?', [status, interviewId]);

        // Send real-time notification to the recruiter
        sendNotificationToUser(interview.recruiter_id, 'interview_status_update', {
            title: 'Ứng viên đã phản hồi!',
            body: `Ứng viên ${interview.candidate_name} đã ${status === 'confirmed' ? 'XÁC NHẬN' : 'TỪ CHỐI'} lịch phỏng vấn cho vị trí "${interview.job_title}".`
        });

        res.status(200).json({ message: 'Cập nhật trạng thái thành công.' });
    } catch (error) {
        console.error("Error updating interview status:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};