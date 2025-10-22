// server/src/routes/uploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers và middleware
const uploadController = require('../controllers/uploadController');
const companyController = require('../controllers/companyController');
const { protect, isRecruiter } = require('../middleware/authMiddleware');



const createStorage = (folder) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, `public/${folder}/`);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
};


const cvStorage = createStorage('cvs');
const avatarStorage = createStorage('avatars');
const logoStorage = createStorage('logos');


const uploadCv = multer({ storage: cvStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadLogo = multer({ storage: logoStorage });


router.post('/cv', protect, uploadCv.single('cv'), uploadController.uploadCv);
router.post('/avatar', protect, uploadAvatar.single('avatar'), uploadController.uploadAvatar);
router.post('/company-logo', protect, isRecruiter, uploadLogo.single('logo'), companyController.updateLogo);

module.exports = router;