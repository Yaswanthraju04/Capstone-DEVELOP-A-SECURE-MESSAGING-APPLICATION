const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());


app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const users = new Map(); 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  
  socket.on('join', (username) => {
    users.set(socket.id, username);
    io.emit('userList', Array.from(users.values()));
    console.log(`${username} joined`);
  });

  
  socket.on('privateMessage', ({ toUsername, encryptedMessage }) => {
    for (let [id, username] of users.entries()) {
      if (username === toUsername) {
        io.to(id).emit('privateMessage', {
          fromUsername: users.get(socket.id),
          encryptedMessage
        });
        break;
      }
    }
  });

  
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    io.emit('userList', Array.from(users.values()));
    console.log(`${username} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
