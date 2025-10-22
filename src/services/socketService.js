// server/src/services/socketService.js

let io;
const connectedUsers = new Map(); // Lưu map giữa userId và socketId

const init = (socketIoInstance) => {
  io = socketIoInstance;
  io.on('connection', (socket) => {
    console.log('Một client đã kết nối:', socket.id);

    // Lắng nghe sự kiện client gửi userId của họ lên
    socket.on('registerUser', (userId) => {
      console.log(`User ${userId} đăng ký với socket ${socket.id}`);
      connectedUsers.set(userId.toString(), socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Client đã ngắt kết nối:', socket.id);
      // Xóa user khỏi map khi họ ngắt kết nối
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });
};

// Hàm để gửi thông báo tới một user cụ thể
const sendNotificationToUser = (userId, eventName, data) => {
  const socketId = connectedUsers.get(userId.toString());
  if (socketId) {
    console.log(`Gửi event '${eventName}' đến user ${userId} tại socket ${socketId}`);
    io.to(socketId).emit(eventName, data);
  } else {
    console.log(`Không tìm thấy user ${userId} đang online.`);
  }
};

module.exports = { init, sendNotificationToUser };