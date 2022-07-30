require("dotenv").config();

const socketio = require("socket.io");
const express = require("express");
const http = require("http");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const PORT = 5500;

const BASE_URL = process.env.BASE_URL;

/*
1. 구현
  1-1. 우리 서버랑 연결 (axios) 서버-서버간 통신
  1-2. 구현사항들 구현하기
2. 배포 (AWS)
3. 푸시알림 연결
4. 리팩터
*/

// express가 아닌 socket io 객체 내에서 cors 처리
const io = socketio(server, {
  cors: {
    origin: "http://localhost:8080",
  },
});

io.on("connection", (socket) => {
  // 클라가 io 서버 접속시 고유 id를 얻음
  console.log(`Connection : SocketId = ${socket.id}`);

  // 1. 헤더 확인 -> 서버 연결 필요
  const jwt = socket.handshake.headers.authorization;

  // 2. 방 번호 확인
  let roomId;
  let audienceId;

  socket.on("subscribe", (data) => {
    const roomData = JSON.parse(data);
    console.log(roomData);
    roomId = roomData.roomId;
    audienceId = roomData.audienceId;

    socket.join(roomId);
    console.log(`${socket.id}님이 ${roomId}에 접속: 대화상대 = ${audienceId}`);
  });

  socket.on("sendMessage", async (data) => {
    const messageData = JSON.parse(data);
    const messageContent = messageData.messageContent;

    const chatData = {
      recvId: audienceId,
      content: messageContent,
    };

    socket.broadcast.to(roomId).emit("newMessage", JSON.stringify(chatData));

    // DB에 메시지 저장
    try {
      const { data } = await axios.post(BASE_URL + "message", chatData, {
        headers: { Authorization: jwt },
      });
      console.log(data);
    } catch (error) {
      console.log(error);
    }

    // 푸시알림 이벤트 트리거
  });

  socket.on("disconnect", () => {
    socket.leave(roomId);
    console.log("disconnect 합니다.");
  });
});

server.listen(PORT, () => console.log(`💬 Socket server listening on: ${PORT} `));
