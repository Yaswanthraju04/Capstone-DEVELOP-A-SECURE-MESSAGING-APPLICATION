const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIo = require('socket.io');
const cors = require('cors');
const Message = require('./models/Message');
const CryptoJS = require('crypto-js');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend')); // Serve frontend files

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// API to get all messages
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find({});
  res.json(messages);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('sendMessage', async (data) => {
    // Encrypt message before saving
    const encryptedContent = CryptoJS.AES.encrypt(data.content, process.env.SECRET_KEY).toString();
    const message = new Message({ sender: data.sender, content: encryptedContent });
    await message.save();

    // Send to all clients
    io.emit('newMessage', { sender: data.sender, content: encryptedContent, timestamp: message.timestamp });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
