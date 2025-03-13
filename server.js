const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permite conexiones desde cualquier origen
        methods: ["GET", "POST"]
    }
});

// Servir la página web
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Lógica del juego
let players = {};
let currentPlayer = 'X';

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Asignar un símbolo (X o O) al jugador
    if (Object.keys(players).length < 2) {
        players[socket.id] = currentPlayer;
        socket.emit('assignSymbol', currentPlayer);
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    } else {
        socket.emit('gameFull');
        return;
    }

    // Notificar a los jugadores que el juego ha comenzado
    if (Object.keys(players).length === 2) {
        io.emit('startGame');
    }

    // Manejar movimientos
    socket.on('move', (data) => {
        io.emit('move', data);
    });

    // Manejar desconexiones
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});