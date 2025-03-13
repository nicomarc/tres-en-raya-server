const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let players = {};
let currentPlayer = 'X';

// Servir archivos estáticos (si es necesario)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    if (Object.keys(players).length < 2) {
        players[socket.id] = currentPlayer;
        socket.emit('assignSymbol', currentPlayer);
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    } else {
        socket.emit('gameFull');
        return;
    }

    if (Object.keys(players).length === 2) {
        io.emit('startGame');
    }

    socket.on('move', (data) => {
        io.emit('move', data);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
