const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect, isRecruiter } = require('../middleware/authMiddleware');

router.use(protect, isRecruiter); // Tất cả route đều cần quyền nhà tuyển dụng

router.route('/my')
    .get(companyController.getMyCompany)
    .post(companyController.createOrUpdateCompany); // Dùng 1 API cho cả tạo và sửa

// router.post('/logo', upload.single('logo'), companyController.updateLogo);

module.exports = router;