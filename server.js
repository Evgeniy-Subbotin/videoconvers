const express = require('express');
const app = express();
// const cors = require('cors')
// app.use(cors())

const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('main');
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

app.use((req, res) => {
    res.render('404');
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId, userName);
        // messages
        socket.on('message', (data) => {
            // send message to the same room
            io.to(roomId).emit('createMessage', data);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });
    });
});

server.listen(process.env.PORT || 3000);
