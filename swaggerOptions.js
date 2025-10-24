// server/swaggerOptions.js
const swaggerJsdoc = require('swagger-jsdoc');

// Định nghĩa toàn bộ OpenAPI Specification bằng JavaScript Object
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Recruitment App API',
    version: '1.0.0',
    description: 'API documentation for the Recruitment Mobile Application',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Login: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: '123456' },
        },
      },
      Register: {
        type: 'object',
        required: ['email', 'password', 'fullName', 'role'],
        properties: {
          email: { type: 'string', format: 'email', example: 'candidate@example.com' },
          password: { type: 'string', example: '123456' },
          fullName: { type: 'string', example: 'Nguyễn Văn A' },
          role: { type: 'string', enum: ['candidate', 'recruiter'], example: 'candidate' },
        },
      },
      JobInput: {
        type: 'object',
        required: ['title', 'description', 'requirements', 'salary', 'location'],
        properties: {
          title: { type: 'string', example: 'Kỹ sư Backend (Node.js)' },
          description: { type: 'string', example: 'Mô tả công việc chi tiết...' },
          requirements: { type: 'string', example: 'Yêu cầu tối thiểu 2 năm kinh nghiệm...' },
          salary: { type: 'string', example: '15,000,000 - 30,000,000 VND' },
          location: { type: 'string', example: 'TP. Hồ Chí Minh' },
          application_limit: { type: 'integer', nullable: true, example: 50, description: 'Giới hạn số lượng hồ sơ nhận được (null nếu không giới hạn).' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          company_name: { type: 'string' },
          location: { type: 'string' },
          status: { type: 'string', enum: ['open', 'closed'], example: 'open' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UserProfileUpdate: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phoneNumber: { type: 'string' },
          headline: { type: 'string' },
          bio: { type: 'string' },
          linkedinUrl: { type: 'string' },
          githubUrl: { type: 'string' },
        },
      },
      UserChangePassword: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string' },
          newPassword: { type: 'string' },
        },
      },
      CompanyInput: {
        type: 'object',
        required: ['name', 'address'],
        properties: {
          name: { type: 'string', example: 'Công ty TNHH Tuyển Dụng Nhân Sự' },
          description: { type: 'string', example: 'Chúng tôi chuyên về...' },
          address: { type: 'string', example: '123 Đường ABC, Quận 1' },
        },
      },
      ApplicationApply: {
        type: 'object',
        required: ['cv_url'],
        properties: {
          cv_url: { type: 'string', format: 'url', example: 'http://localhost:3000/public/cvs/my-cv.pdf' },
        },
      },
      ApplicationStatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['screening', 'interviewing', 'offered', 'rejected'], example: 'interviewing' },
          rejectionReason: { type: 'string', nullable: true, description: 'Chỉ cần thiết nếu status là \'rejected\'.' },
        },
      },
      InterviewSchedule: {
        type: 'object',
        required: ['applicationId', 'interviewDate'],
        properties: {
          applicationId: { type: 'integer', example: 1 },
          interviewDate: { type: 'string', format: 'date-time', example: '2025-10-30T10:00:00Z' },
          location: { type: 'string', example: 'Văn phòng công ty' },
          notes: { type: 'string', example: 'Chuẩn bị laptop cá nhân.' },
        },
      },
      InterviewStatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['confirmed', 'declined'], example: 'confirmed' },
        },
      },
      InterviewResult: {
        type: 'object',
        required: ['result'],
        properties: {
          result: { type: 'string', enum: ['pass', 'fail'], example: 'pass' },
          comments: { type: 'string', nullable: true, example: 'Ứng viên rất tiềm năng, nên gửi Offer sớm.' },
        },
      },
      JobOffer: {
        type: 'object',
        required: ['offerLetterContent'],
        properties: {
          offerLetterContent: { type: 'string', example: 'Kính gửi, chúng tôi đề nghị bạn mức lương...' },
        },
      },
      WorkExperienceInput: {
        type: 'object',
        required: ['job_title', 'company_name', 'start_date'],
        properties: {
          job_title: { type: 'string', example: 'Software Engineer' },
          company_name: { type: 'string', example: 'ABC Tech' },
          start_date: { type: 'string', format: 'date', example: '2023-01-01' },
          end_date: { type: 'string', format: 'date', nullable: true, example: '2024-01-01' },
          description: { type: 'string', example: 'Mô tả công việc đã làm...' },
        },
      },
      EducationInput: {
        type: 'object',
        required: ['school', 'degree', 'start_date'],
        properties: {
          school: { type: 'string', example: 'Đại học Bách Khoa' },
          degree: { type: 'string', example: 'Cử nhân' },
          field_of_study: { type: 'string', example: 'Khoa học Máy tính' },
          start_date: { type: 'string', format: 'date', example: '2018-09-01' },
          end_date: { type: 'string', format: 'date', nullable: true, example: '2022-06-30' },
        },
      },
      AdminStats: {
        type: 'object',
        properties: {
          totalUsers: { type: 'integer' },
          totalCompanies: { type: 'integer' },
          totalJobs: { type: 'integer' },
          totalApplications: { type: 'integer' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng ký tài khoản mới (Ứng viên hoặc Nhà tuyển dụng)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Register' } } },
        },
        responses: {
          '201': { description: 'Tạo tài khoản thành công.' },
          '400': { description: 'Dữ liệu đầu vào không hợp lệ.' },
          '409': { description: 'Email đã được sử dụng.' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng nhập và nhận JWT Token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Login' } } },
        },
        responses: {
          '200': {
            description: 'Đăng nhập thành công, trả về token và thông tin user.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        email: { type: 'string' },
                        fullName: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Email hoặc mật khẩu không chính xác.' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Lấy thông tin người dùng đang đăng nhập (Get Me)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Thông tin chi tiết của người dùng.' },
          '401': { description: 'Không có quyền truy cập.' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Cập nhật thông tin cá nhân cơ bản',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfileUpdate' } } },
        },
        responses: {
          '200': { description: 'Cập nhật thông tin thành công.' },
          '401': { description: 'Không có quyền truy cập.' },
        },
      },
    },
    '/api/users/change-password': {
      put: {
        tags: ['Users'],
        summary: 'Thay đổi mật khẩu',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserChangePassword' } } },
        },
        responses: {
          '200': { description: 'Đổi mật khẩu thành công.' },
          '401': { description: 'Mật khẩu cũ không chính xác hoặc không có quyền.' },
        },
      },
    },
    '/api/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'Lấy danh sách tin tuyển dụng (có phân trang, tìm kiếm)',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Từ khóa tìm kiếm trong tiêu đề.' },
          { in: 'query', name: 'location', schema: { type: 'string' }, description: 'Lọc theo địa điểm.' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': {
            description: 'Danh sách tin tuyển dụng.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobs: { type: 'array', items: { $ref: '#/components/schemas/Job' } },
                    totalPages: { type: 'integer' },
                    currentPage: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jobs'],
        summary: '[Recruiter] Đăng tin tuyển dụng mới',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobInput' } } },
        },
        responses: {
          '201': { description: 'Đăng tin thành công.' },
          '403': { description: 'Chỉ dành cho Nhà tuyển dụng.' },
        },
      },
    },
    '/api/jobs/my': {
      get: {
        tags: ['Jobs'],
        summary: '[Recruiter] Lấy danh sách tin tuyển dụng đã đăng của mình',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Danh sách tin tuyển dụng đã đăng.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Job' } } } },
          },
          '403': { description: 'Chỉ dành cho Nhà tuyển dụng.' },
        },
      },
    },
    '/api/jobs/{id}': {
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'ID của tin tuyển dụng.' },
      ],
      get: {
        tags: ['Jobs'],
        summary: 'Lấy chi tiết một tin tuyển dụng',
        responses: {
          '200': { description: 'Chi tiết tin tuyển dụng.' },
          '404': { description: 'Không tìm thấy tin tuyển dụng.' },
        },
      },
      put: {
        tags: ['Jobs'],
        summary: '[Recruiter] Cập nhật tin tuyển dụng',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobInput' } } },
        },
        responses: {
          '200': { description: 'Cập nhật thành công.' },
          '403': { description: 'Không có quyền chỉnh sửa tin này.' },
        },
      },
      delete: {
        tags: ['Jobs'],
        summary: '[Recruiter] Xóa tin tuyển dụng',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Xóa thành công.' },
          '403': { description: 'Không có quyền xóa tin này.' },
        },
      },
    },
    '/api/applications/my': {
      get: {
        tags: ['Applications'],
        summary: '[Candidate] Xem các hồ sơ đã nộp của ứng viên',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Danh sách hồ sơ đã nộp.' },
          '403': { description: 'Chỉ dành cho Ứng viên.' },
        },
      },
    },
    '/api/applications/{jobId}/apply': {
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'integer' }, description: 'ID của công việc.' },
      ],
      post: {
        tags: ['Applications'],
        summary: '[Candidate] Nộp hồ sơ vào một công việc',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicationApply' } } },
        },
        responses: {
          '201': { description: 'Nộp hồ sơ thành công.' },
          '400': { description: 'Công việc đã đóng hoặc đã đủ hồ sơ.' },
          '409': { description: 'Đã ứng tuyển vào công việc này rồi.' },
          '403': { description: 'Chỉ dành cho Ứng viên.' },
        },
      },
    },
    '/api/applications/{jobId}': {
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'integer' }, description: 'ID của công việc.' },
      ],
      get: {
        tags: ['Applications'],
        summary: '[Recruiter] Xem danh sách hồ sơ ứng tuyển cho một công việc',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Danh sách hồ sơ.' },
          '403': { description: 'Chỉ dành cho Nhà tuyển dụng sở hữu job.' },
        },
      },
    },
    '/api/applications/{applicationId}/status': {
      parameters: [
        { in: 'path', name: 'applicationId', required: true, schema: { type: 'integer' }, description: 'ID của hồ sơ ứng tuyển.' },
      ],
      put: {
        tags: ['Applications'],
        summary: '[Recruiter] Cập nhật trạng thái hồ sơ (screening, offered, rejected...)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicationStatusUpdate' } } },
        },
        responses: {
          '200': { description: 'Cập nhật trạng thái thành công.' },
          '403': { description: 'Không có quyền thực hiện.' },
        },
      },
    },
    '/api/applications/{applicationId}/result': {
      parameters: [
        { in: 'path', name: 'applicationId', required: true, schema: { type: 'integer' }, description: 'ID của hồ sơ ứng tuyển.' },
      ],
      post: {
        tags: ['Applications'],
        summary: '[Recruiter] Nhập kết quả phỏng vấn (pass/fail)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InterviewResult' } } },
        },
        responses: {
          '201': { description: 'Đã lưu kết quả và gửi email thông báo.' },
          '403': { description: 'Không có quyền thực hiện.' },
        },
      },
    },
    '/api/applications/{applicationId}/offer': {
      parameters: [
        { in: 'path', name: 'applicationId', required: true, schema: { type: 'integer' }, description: 'ID của hồ sơ ứng tuyển.' },
      ],
      post: {
        tags: ['Applications'],
        summary: '[Recruiter] Tạo thư mời nhận việc (Job Offer)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobOffer' } } },
        },
        responses: {
          '201': { description: 'Gửi thư mời thành công.' },
          '403': { description: 'Không có quyền thực hiện.' },
        },
      },
    },
    '/api/applications/{applicationId}/details': {
      parameters: [
        { in: 'path', name: 'applicationId', required: true, schema: { type: 'integer' }, description: 'ID của hồ sơ ứng tuyển.' },
      ],
      get: {
        tags: ['Applications'],
        summary: '[Candidate] Xem chi tiết một hồ sơ đã nộp (kèm thông tin phỏng vấn/offer)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Chi tiết hồ sơ.' },
          '403': { description: 'Chỉ dành cho Ứng viên sở hữu hồ sơ.' },
        },
      },
    },
    '/api/interviews/schedule': {
      post: {
        tags: ['Interviews'],
        summary: '[Recruiter] Lên lịch phỏng vấn và gửi email mời',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InterviewSchedule' } } },
        },
        responses: {
          '201': { description: 'Lên lịch thành công.' },
          '403': { description: 'Không có quyền thực hiện.' },
        },
      },
    },
    '/api/interviews/{interviewId}/status': {
      parameters: [
        { in: 'path', name: 'interviewId', required: true, schema: { type: 'integer' }, description: 'ID của lịch phỏng vấn.' },
      ],
      put: {
        tags: ['Interviews'],
        summary: '[Candidate] Ứng viên xác nhận/từ chối lịch phỏng vấn',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InterviewStatusUpdate' } } },
        },
        responses: {
          '200': { description: 'Cập nhật trạng thái thành công.' },
          '400': { description: 'Lịch hẹn đã hết hạn hoặc đã phản hồi.' },
        },
      },
    },
    '/api/reports/statistics': {
      get: {
        tags: ['Reports (Recruiter)'],
        summary: '[Recruiter] Lấy số liệu thống kê (tổng job, tổng hồ sơ, đếm theo trạng thái)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Số liệu thống kê.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalJobs: { type: 'integer' },
                    totalApplications: { type: 'integer' },
                    statusCounts: {
                      type: 'object',
                      properties: {
                        pending: { type: 'integer' },
                        screening: { type: 'integer' },
                        interviewing: { type: 'integer' },
                        offered: { type: 'integer' },
                        rejected: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Chỉ dành cho Nhà tuyển dụng.' },
        },
      },
    },
    '/api/upload/cv': {
      post: {
        tags: ['Upload'],
        summary: '[Protected] Tải lên file CV (trả về URL)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  cv: { type: 'string', format: 'binary', description: 'File CV (tên trường là \'cv\').' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tải lên thành công, trả về URL.' },
        },
      },
    },
    '/api/upload/avatar': {
      post: {
        tags: ['Upload'],
        summary: '[Protected] Tải lên ảnh đại diện (cập nhật avatar_url trong DB)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: { type: 'string', format: 'binary', description: 'File ảnh (tên trường là \'avatar\').' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Cập nhật thành công, trả về URL.' },
        },
      },
    },
    '/api/upload/company-logo': {
      post: {
        tags: ['Upload'],
        summary: '[Recruiter] Tải lên logo công ty (cập nhật logo_url trong DB)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  logo: { type: 'string', format: 'binary', description: 'File ảnh logo (tên trường là \'logo\').' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Cập nhật thành công, trả về URL.' },
          '403': { description: 'Chỉ dành cho Nhà tuyển dụng.' },
        },
      },
    },
    '/api/saved-jobs': {
      get: {
        tags: ['Saved Jobs (Candidate)'],
        summary: '[Candidate] Lấy danh sách công việc đã lưu',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Danh sách công việc đã lưu.' },
          '403': { description: 'Chỉ dành cho Ứng viên.' },
        },
      },
    },
    '/api/saved-jobs/{jobId}': {
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'integer' }, description: 'ID của công việc.' },
      ],
      post: {
        tags: ['Saved Jobs (Candidate)'],
        summary: '[Candidate] Lưu một công việc',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Đã lưu việc làm.' },
          '409': { description: 'Việc làm đã được lưu.' },
        },
      },
      delete: {
        tags: ['Saved Jobs (Candidate)'],
        summary: '[Candidate] Bỏ lưu một công việc',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Đã bỏ lưu việc làm.' },
        },
      },
    },
    '/api/companies/my': {
      get: {
        tags: ['Companies (Recruiter)'],
        summary: '[Recruiter] Lấy thông tin công ty của Nhà tuyển dụng',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Thông tin công ty.' },
          '404': { description: 'Chưa tạo hồ sơ công ty.' },
          '403': { description: 'Chỉ dành cho Nhà tuyển dụng.' },
        },
      },
      post: {
        tags: ['Companies (Recruiter)'],
        summary: '[Recruiter] Tạo hoặc Cập nhật thông tin công ty',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyInput' } } },
        },
        responses: {
          '201': { description: 'Tạo hồ sơ công ty thành công.' },
          '200': { description: 'Cập nhật thông tin công ty thành công.' },
        },
      },
    },
    '/api/profile': {
      get: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Lấy toàn bộ Kinh nghiệm và Học vấn',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Thông tin hồ sơ (kinh nghiệm và học vấn).' },
        },
      },
    },
    '/api/profile/experience': {
      post: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Thêm Kinh nghiệm làm việc',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkExperienceInput' } } },
        },
        responses: {
          '201': { description: 'Thêm kinh nghiệm thành công.' },
        },
      },
    },
    '/api/profile/experience/{expId}': {
      parameters: [
        { in: 'path', name: 'expId', required: true, schema: { type: 'integer' }, description: 'ID của mục kinh nghiệm.' },
      ],
      put: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Cập nhật Kinh nghiệm làm việc',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkExperienceInput' } } },
        },
        responses: {
          '200': { description: 'Cập nhật thành công.' },
        },
      },
      delete: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Xóa Kinh nghiệm làm việc',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Xóa thành công.' },
        },
      },
    },
    '/api/profile/education': {
      post: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Thêm Học vấn',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EducationInput' } } },
        },
        responses: {
          '201': { description: 'Thêm học vấn thành công.' },
        },
      },
    },
    '/api/profile/education/{eduId}': {
      parameters: [
        { in: 'path', name: 'eduId', required: true, schema: { type: 'integer' }, description: 'ID của mục học vấn.' },
      ],
      put: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Cập nhật Học vấn',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EducationInput' } } },
        },
        responses: {
          '200': { description: 'Cập nhật thành công.' },
        },
      },
      delete: {
        tags: ['Candidate Profile'],
        summary: '[Protected] Xóa Học vấn',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Xóa thành công.' },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: '[Admin] Lấy số liệu thống kê hệ thống',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Số liệu thống kê.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminStats' } } },
          },
          '403': { description: 'Chỉ dành cho Admin.' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: '[Admin] Lấy danh sách tất cả người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'Danh sách người dùng.' },
          '403': { description: 'Chỉ dành cho Admin.' },
        },
      },
    },
    '/api/admin/companies': {
      get: {
        tags: ['Admin'],
        summary: '[Admin] Lấy danh sách tất cả công ty',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Danh sách công ty.' },
          '403': { description: 'Chỉ dành cho Admin.' },
        },
      },
    },
    '/api/admin/jobs': {
      get: {
        tags: ['Admin'],
        summary: '[Admin] Lấy danh sách tất cả tin tuyển dụng',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Danh sách tin tuyển dụng.' },
          '403': { description: 'Chỉ dành cho Admin.' },
        },
      },
    },
    '/api/admin/applications': {
      get: {
        tags: ['Admin'],
        summary: '[Admin] Lấy danh sách tất cả hồ sơ ứng tuyển',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Danh sách hồ sơ.' },
          '403': { description: 'Chỉ dành cho Admin.' },
        },
      },
    },
  },
};

// Cấu hình options cho swagger-jsdoc
const options = {
  definition: swaggerDefinition, // SỬ DỤNG TRỰC TIẾP OBJECT JS
  // Đường dẫn đến các file chứa định nghĩa API
  apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;