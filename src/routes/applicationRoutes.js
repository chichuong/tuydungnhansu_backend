// src/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protect, isRecruiter, isCandidate } = require('../middleware/authMiddleware');

// Route cho ứng viên nộp hồ sơ

// Route cho ứng viên xem các hồ sơ đã nộp của mình
router.get('/my', protect, isCandidate, applicationController.getMyApplications);

// POST /api/applications/123/apply (nộp hồ sơ cho job id 123)
router.post('/:jobId/apply', protect, isCandidate, applicationController.applyToJob);

// Route cho nhà tuyển dụng xem danh sách hồ sơ
// GET /api/applications/123 (xem hồ sơ của job id 123)
router.get('/:jobId', protect, isRecruiter, applicationController.getJobApplications);


// Route cho ứng viên nộp hồ sơ (phải đặt sau '/my' để không bị nhầm)
router.post('/:jobId/apply', protect, isCandidate, applicationController.applyToJob);

// Route cho nhà tuyển dụng xem danh sách hồ sơ
router.get('/:jobId', protect, isRecruiter, applicationController.getJobApplications);

// Route cho nhà tuyển dụng cập nhật trạng thái hồ sơ
router.put('/:applicationId/status', protect, isRecruiter, applicationController.updateApplicationStatus);

// Route nhập kết quả
router.post('/:applicationId/result', protect, isRecruiter, applicationController.recordInterviewResult);

// Route tạo thư mời
router.post('/:applicationId/offer', protect, isRecruiter, applicationController.createJobOffer);

// Route cho ứng viên xem chi tiết một hồ sơ đã nộp
router.get('/:applicationId/details', protect, isCandidate, applicationController.getApplicationDetails);


module.exports = router;