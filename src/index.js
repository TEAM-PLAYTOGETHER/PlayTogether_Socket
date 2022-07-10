const socketio = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);
const PORT = 5500;

// express가 아닌 socket io 객체 내에서 cors 처리
const io = socketio(server, {
  cors: {
    origin: "http://localhost:8080",
  },
});

io.on("connection", (socket) => {
  // 클라가 io 서버 접속시 고유 id를 얻음
  console.log(`Connection : SocketId = ${socket.id}`);

  // userName을 소켓 통신 내내 사용 예정 -> 글로벌 변수로 선언
  let userName = "";

  socket.on("subscribe", (data) => {
    console.log("subscribe 트리거 됨");
    const roomData = JSON.parse(data);
    userName = roomData.userName;
    const roomName = roomData.roomName;

    socket.join(`${roomName}`);
    console.log(`유저 이름: ${userName}, 방 번호: ${roomName}`);

    // 다른 유저가 방에 입장한 것을 알림 받도록 함
    // 유저가 읽었는지 확인할 때 쓰일 수 있음

    //TODO: 둘 중에 선택
    //io.to: 가입한 유저는 이벤트를 받을 수 있음
    //socket.broadcast.to: 가입한 유저를 제외하고 모두가 메시지를 받을 수 있음
    // socket.broadcast.to(`${roomName}`).emit('newUserToChatRoom',userName);
    io.to(`${roomName}`).emit("newUserToChatRoom", userName);
  });

  socket.on("unsubscribe", (data) => {
    console.log("unsubscribe 트리거 됨");
    const roomData = JSON.parse(data);
    const userName = roomData.userName;
    const roomName = roomData.roomName;

    console.log(`유저 이름: ${userName}, 나갈 방 번호: ${roomName}`);
    socket.broadcast.to(`${roomName}`).emit("userLeftChatRoom", userName);
    socket.leave(`${roomName}`);
  });

  socket.on("newMessage", (data) => {
    console.log("newMessage 트리거 됨");

    const messageData = JSON.parse(data);
    const messageContent = messageData.messageContent;
    const roomName = messageData.roomName;

    console.log(`[방 번호 ${roomName}] ${userName} : ${messageContent}`);

    // 그저 writer 소켓으로부터 전송된 데이터를 전송하기만 한다.
    const chatData = {
      userName: userName,
      messageContent: messageContent,
      roomName: roomName,
    };
    socket.broadcast.to(`${roomName}`).emit("updateChat", JSON.stringify(chatData));
  });

  // typing 함수를 추가하고 싶다면...

  // socket.on('typing',function(roomNumber){ //Only roomNumber is needed here
  //     console.log('typing triggered')
  //     socket.broadcast.to(`${roomNumber}`).emit('typing')
  // })

  // socket.on('stopTyping',function(roomNumber){ //Only roomNumber is needed here
  //     console.log('stopTyping triggered')
  //     socket.broadcast.to(`${roomNumber}`).emit('stopTyping')
  // })

  socket.on("disconnect", function () {
    console.log("하나의 소켓이 접속 종료되었습니다.");
  });
});

server.listen(PORT, () => console.log(`💬 Socket server listening on: ${PORT} `));
