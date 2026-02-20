import { Server } from "socket.io";
import { getCurrentUser } from "./getCurrentUser";
import { parse } from "cookie";

let io = null;

export function initSocketServer(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    console.log("Socket connected:", socket.id);

    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      socket.disconnect();
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        socket.disconnect();
        return;
      }

      socket.userId = user.id;
      console.log(`User ${user.id} authenticated on socket ${socket.id}`);

      socket.on("join-conversation", (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${user.id} joined conversation ${conversationId}`);
      });

      socket.on("leave-conversation", (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    } catch (error) {
      console.error("Socket auth error:", error);
      socket.disconnect();
    }
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export function broadcastNewMessage(conversationId, message) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit("new-message", message);
}
