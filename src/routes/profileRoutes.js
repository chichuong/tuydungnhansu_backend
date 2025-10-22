// server/src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); 

router.get('/', profileController.getProfile);

// Routes cho Kinh nghiệm
router.route('/experience')
    .post(profileController.addExperience);
router.route('/experience/:expId')
    .put(profileController.updateExperience)
    .delete(profileController.deleteExperience);

router.route('/education')
    .post(profileController.addEducation);
router.route('/education/:eduId') 
    .put(profileController.updateEducation)
    .delete(profileController.deleteEducation);

module.exports = router;