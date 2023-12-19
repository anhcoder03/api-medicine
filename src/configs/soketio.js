import { Server } from "socket.io";
export const socketIo = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("[Socket] Connected:", socket.id);
    socket.on("disconnected", () => {});

    // Client đăng nhập và join vào 'MediRoom' để nhận thông báo
    socket.on("authenticate", (userId) => {
      socket.userId = userId;
      socket.join("MediRoom");
    });

    socket.on("client_newNotify", (data) => {
      io.to("MediRoom").emit("server_newNotify", data);
    });
  });
};
