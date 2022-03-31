import express, { application } from "express"; // express package
import { Server } from "socket.io"; // socket.io package
import { createServer } from "http"; // createServer package
import path from "path";

const app = express();
const httpServer = createServer(app);

const basePath = process.cwd();
const port = process.env.PORT || 3000;
app.use(express.static(path.join(basePath, "./dist")));
app.get("/", (req, res) => {
  res.sendFile("index.html");
});

const io = new Server(httpServer, {
  // io engine - allow income requests and distribute chat messages, etc
  cors: {
    origin: "*", // opens up the chat server to connections that aren't coming from the same place (it doesn't verify who's connected)
    methods: ["GET", "POST"], // cross origin policy (research it)
  },
});

// cretes an object with all the users stored
const users = {};

httpServer.listen(port, () => {
  console.log(`Chat server up and running on ${port}`);
});

// socket = individual connection coming from the server
io.on("connection", (socket) => {
  // console.log('A user has connected');
  // // this is a custom event we emit on the server side. Can be anything
  // // id = how the socket tracks each connection
  io.emit("CONNECTED", socket.id);

  socket.on("user-connected", (data) => {
    users[socket.id] = data.user;

    console.log(`${users[socket.id]} has connected`);

    // emits an updated list of users connected to the server
    io.emit("users-on-server", { user: users });

    socket.broadcast.emit("user-conn-message", {
      message: `${users[socket.id]} joined`,
    });

    // console.log(users);
  });

  // When a user disconnects, share with the others and delete from the list of users active
  socket.on("disconnect", () => {
    // broadcast the event to the other users in the server
    // io.emit('disconnected', users[socket.id]);
    console.log(`${users[socket.id]} disconnected`);

    io.emit("disconnected", {
      user: socket.id,
      messageDisc: `${users[socket.id]} left`,
    });
    // deletes the user from the users array
    delete users[socket.id];
  });

  // listen for incoming messages
  socket.on("SEND_MESSAGE", function (data) {
    console.log(`${data.user} sent a message: ${data.message}`);

    // send back to everyone whos connected
    io.emit("MESSAGE", data);
  });

  socket.on("TYPING", (data) => {
    console.log(`${data.user} is typing...`);

    socket.broadcast.emit("user-typing", data);
  });
});
