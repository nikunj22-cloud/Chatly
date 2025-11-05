import { Server } from "socket.io";
import http from "http";

let io;
const userSocketMap = {}; // { userId: socketId }

export function setupSocket(app) {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://chatly-gamma-five.vercel.app"],
      methods: ["GET", "POST"], // ✅ REQUIRED
      credentials: true, // ✅ REQUIRED
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return server;
}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export { io };

//ya toh isme ya config folder m
//✅ Socket.io Code – Summary (Tere Words + Interview Friendly)
// Sir, ye code Express server ke sath ek WebSocket server establish karta hai using Socket.io.

// Jab koi user frontend se connect hota hai, wo apna userId query string me bhejta hai.

// Us userId ko hum uske socket.id ke sath map kar dete hain (userSocketMap object me).

// Isse hume pata chal jata hai kaun user online hai, aur uska connection kya hai.

// 🔄 Real-time Features:
// Jab koi user connect hota hai, to sabhi clients ko emit karte hain getOnlineUsers event, jisme current online users ka list hota hai.

// Jab koi user disconnect hota hai:

// Uska entry userSocketMap se hata dete hain (clean up)

// Fir se sabhi clients ko updated online users bhejte hain

// 📬 Message Send Karne ke Time:
// Jab sender kisi receiver ko message bhejta hai, to hum getReceiverSocketId(receiverId) function se dekhte hain:

// Receiver online hai ya nahi

// Agar hai, to uske socket connection pe newMessage emit karte hain

// ✅ Real World Analogy:
// Soch le chat room me tu enter karta hai — tu online ho gaya
// → Server ne sabko bataya "Nikunj online ho gaya"
// → Agar tu chale jaye, to sabko bataya gaya "Nikunj offline ho gaya"
