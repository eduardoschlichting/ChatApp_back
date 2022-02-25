import express from 'express'; // express package
import { Server } from 'socket.io'; // socket.io package
import { createServer } from 'http'; // createServer package

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, { // io engine - allow income requests and distribute chat messages, etc
    cors: {
        origin: "*", // opens up the chat server to connections that aren't coming from the same place (it doesn't verify who's connected)
        methods: ["GET", "POST"]  // cross origin policy (research it)
    }
});

const port = process.env.PORT || 3000;

// cretes an object with all the users stored
const users = {};


httpServer.listen(port, () => {
    console.log(`Chat server up and running on ${port}`);
});

// socket = individual connection coming from the server
io.on('connection', (socket) => {
    // console.log('A user has connected');
    // // this is a custom event we emit on the server side. Can be anything
    // // id = how the socket tracks each connection
    // socket.emit("CONNECTED", socket.id);
    socket.join('chatroom');


    socket.on('user-connected', (data) => {
        users[socket.id] = data.user;
        console.log(users[socket.id]);
        
        console.log(`${users[socket.id]} has connected`);

        // emits the users on the chat to everybody (io, not socket)
        socket.broadcast.emit('users-on-server', { messageConn: `${users[socket.id]} has joined the chat` });

        console.log(users);
    })
    
    // Listen for the user name and sets the user object so we can use it

    // When a user disconnects, share with the others and delete from the list of users active
    socket.on('disconnect', () => {
        // broadcast the event to the other users in the server
        // io.emit('disconnected', users[socket.id]);
        console.log(`${users[socket.id]} disconnected`);
        
        socket.broadcast.emit('disconnected', { messageDisc: `${users[socket.id]} has left the chat` });
        // deletes the user from the users array
        delete users[socket.id];
    })

    

    // console.log(users);

    // listen for incoming messages
    socket.on('SEND_MESSAGE', function(data){
        console.log(`${data.user} sent a message: ${data.message}`);


        // send back to everyone whos connected
        io.emit('MESSAGE', data);
    })

    socket.on('TYPING', (data) => {
        console.log(`${data.username} is typing`);
    })
})

