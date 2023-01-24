require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const messagesRoute = require("./routes/messagesRoute");
const userRoutes = require("./routes/userRoutes");
const socket = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());
mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connect");
  })
  .catch((error) => {
    console.log(error.message);
  });

app.use("/api/auth", userRoutes);
app.use("/api/messages", messagesRoute);

const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on Port ${process.env.PORT}`);
  console.log(`View: http://localhost:${process.env.PORT}/`);
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.msg);
    }
  });
});
