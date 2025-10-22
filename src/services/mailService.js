// server/src/services/mailService.js
const nodemailer = require('nodemailer');

// Cấu hình transporter (thay thông tin Ethereal của bạn vào đây)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'elijah32@ethereal.email',
        pass: '1BGeCmBkYZwDreZSTG'
    }
});
// Hàm gửi email chung (sẽ dùng ở Ngày 33)
exports.sendMail = async (toEmail, subject, htmlContent) => {
    const mailOptions = {
        from: '"Recruitment App" <noreply@recruitment.com>', // Địa chỉ người gửi (có thể tùy chỉnh)
        to: toEmail,
        subject: subject,
        html: htmlContent
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        // Link để xem email trên Ethereal (rất tiện để test)
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return true; // Báo gửi thành công
    } catch (error) {
        console.error('Lỗi khi gửi mail:', error);
        return false; // Báo gửi thất bại
    }
};