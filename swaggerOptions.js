// server/swaggerOptions.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Phiên bản OpenAPI
    info: {
      title: 'Recruitment App API', // Tên API
      version: '1.0.0', // Phiên bản
      description: 'API documentation for the Recruitment Mobile Application',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Địa chỉ server local (thay đổi nếu deploy)
        description: 'Development server',
      },
      // Thêm các server khác nếu có (staging, production)
    ],
    // Thêm định nghĩa components (ví dụ: securitySchemes cho JWT)
    components: {
      securitySchemes: {
        bearerAuth: { // Đặt tên tùy ý (ví dụ: bearerAuth)
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Định dạng token
        },
      },
    },
    security: [ // Áp dụng security scheme mặc định cho các API cần token
      {
        bearerAuth: [], // Sử dụng tên đã định nghĩa ở trên
      },
    ],
  },
  // Đường dẫn đến các file chứa định nghĩa API (thường là các file routes)
  apis: ['./src/routes/*.js'], // Quét tất cả file .js trong thư mục routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;