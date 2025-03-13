// Seleccionamos los elementos del DOM
const casillas = document.querySelectorAll('.casilla');
const botonAmigo = document.getElementById('amigo');
const botonCPU = document.getElementById('cpu');
const dificultad = document.getElementById('dificultad');
const nivel = document.getElementById('nivel');
const nombreJugador = document.getElementById('nombreJugador');
const inputNombre = document.getElementById('nombre');
const mensaje = document.getElementById('mensaje');

// Variables para el estado del juego
let jugadorActual = 'X';
let juegoTerminado = false;
let modoCPU = false;
let nivelCPU = 'facil';
let movimientos = ['', '', '', '', '', '', '', '', ''];
let socket;

// Eventos para los botones de modo de juego
botonAmigo.addEventListener('click', () => {
    modoCPU = false;
    dificultad.style.display = 'none';
    nombreJugador.style.display = 'block';
    iniciarModoEnLinea();
});

botonCPU.addEventListener('click', () => {
    modoCPU = true;
    dificultad.style.display = 'block';
    nombreJugador.style.display = 'block';
    reiniciarJuego();
});

// Evento para el selector de dificultad
nivel.addEventListener('change', () => {
    nivelCPU = nivel.value;
});

// Función para iniciar el modo en línea
function iniciarModoEnLinea() {
    socket = io('https://tres-en-raya-server.onrender.com'); // Cambia esto por la URL de tu servidor

    socket.on('assignSymbol', (symbol) => {
        jugadorActual = symbol;
        mensaje.textContent = `Eres el jugador ${symbol}`;
    });

    socket.on('startGame', () => {
        mensaje.textContent = '¡El juego ha comenzado!';
    });

    socket.on('move', (data) => {
        const { index, symbol } = data;
        movimientos[index] = symbol;
        casillas[index].textContent = symbol;
        if (verificarGanador()) {
            const nombre = inputNombre.value || 'Jugador';
            mensaje.textContent = `¡${nombre} gana! 🎉`;
            juegoTerminado = true;
        } else if (verificarEmpate()) {
            mensaje.textContent = '¡Empate! 🤝';
            juegoTerminado = true;
        }
    });

    socket.on('playerDisconnected', () => {
        mensaje.textContent = 'El otro jugador se ha desconectado.';
        juegoTerminado = true;
    });

    reiniciarJuego();
}

// Eventos para las casillas del tablero
casillas.forEach(casilla => {
    casilla.addEventListener('click', () => {
        if (!juegoTerminado && casilla.textContent === '') {
            const index = casilla.dataset.index;
            if (modoCPU) {
                casilla.textContent = jugadorActual;
                movimientos[index] = jugadorActual;
                if (verificarGanador()) {
                    const nombre = inputNombre.value || 'Jugador';
                    mensaje.textContent = `¡${nombre} gana! 🎉`;
                    juegoTerminado = true;
                } else if (verificarEmpate()) {
                    mensaje.textContent = '¡Empate! 🤝';
                    juegoTerminado = true;
                } else {
                    jugadorActual = jugadorActual === 'X' ? 'O' : 'X';
                    if (modoCPU && jugadorActual === 'O' && !juegoTerminado) {
                        movimientoCPU();
                    }
                }
            } else if (socket) {
                socket.emit('move', { index, symbol: jugadorActual });
            }
        }
    });
});

// Función para reiniciar el juego
function reiniciarJuego() {
    casillas.forEach(casilla => {
        casilla.textContent = '';
    });
    jugadorActual = 'X';
    juegoTerminado = false;
    movimientos = ['', '', '', '', '', '', '', '', ''];
    mensaje.textContent = '';
}

// Función para verificar si hay un ganador
function verificarGanador() {
    const combinacionesGanadoras = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let combinacion of combinacionesGanadoras) {
        if (movimientos[combinacion[0]] &&
            movimientos[combinacion[0]] === movimientos[combinacion[1]] &&
            movimientos[combinacion[0]] === movimientos[combinacion[2]]) {
            return true;
        }
    }
    return false;
}

// Función para verificar si hay un empate
function verificarEmpate() {
    return movimientos.every(casilla => casilla !== '');
}

// Función para el movimiento de la CPU
function movimientoCPU() {
    let mejorMovimiento;

    if (nivelCPU === 'facil') {
        mejorMovimiento = movimientoAleatorio();
    } else if (nivelCPU === 'normal') {
        mejorMovimiento = minimax(movimientos, 'O').index;
    } else if (nivelCPU === 'dificil') {
        mejorMovimiento = obtenerMejorMovimiento();
    }

    movimientos[mejorMovimiento] = 'O';
    casillas[mejorMovimiento].textContent = 'O';

    if (verificarGanador()) {
        const nombre = inputNombre.value || 'Jugador';
        mensaje.textContent = `¡${nombre} pierde! 😢`;
        juegoTerminado = true;
    } else if (verificarEmpate()) {
        mensaje.textContent = '¡Empate! 🤝';
        juegoTerminado = true;
    } else {
        jugadorActual = 'X';
    }
}

// Función para el movimiento aleatorio (nivel fácil)
function movimientoAleatorio() {
    const casillasVacias = [];
    for (let i = 0; i < movimientos.length; i++) {
        if (movimientos[i] === '') {
            casillasVacias.push(i);
        }
    }
    return casillasVacias[Math.floor(Math.random() * casillasVacias.length)];
}

// Algoritmo Minimax corregido para nivel "normal"
function minimax(tablero, jugador) {
    const movimientosDisponibles = obtenerMovimientosDisponibles(tablero);

    if (verificarGanadorMinimax(tablero, 'X')) {
        return { score: -10 };
    } else if (verificarGanadorMinimax(tablero, 'O')) {
        return { score: 10 };
    } else if (movimientosDisponibles.length === 0) {
        return { score: 0 };
    }

    const movimientosPosibles = [];
    for (let i = 0; i < movimientosDisponibles.length; i++) {
        const movimiento = movimientosDisponibles[i];
        const nuevoTablero = [...tablero];
        nuevoTablero[movimiento] = jugador;

        let resultado;
        if (jugador === 'O') {
            resultado = minimax(nuevoTablero, 'X');
        } else {
            resultado = minimax(nuevoTablero, 'O');
        }

        movimientosPosibles.push({
            index: movimiento,
            score: resultado.score
        });
    }

    let mejorMovimiento;
    if (jugador === 'O') {
        let mejorPuntuacion = -Infinity;
        for (let i = 0; i < movimientosPosibles.length; i++) {
            if (movimientosPosibles[i].score > mejorPuntuacion) {
                mejorPuntuacion = movimientosPosibles[i].score;
                mejorMovimiento = i;
            }
        }
    } else {
        let mejorPuntuacion = Infinity;
        for (let i = 0; i < movimientosPosibles.length; i++) {
            if (movimientosPosibles[i].score < mejorPuntuacion) {
                mejorPuntuacion = movimientosPosibles[i].score;
                mejorMovimiento = i;
            }
        }
    }
    return movimientosPosibles[mejorMovimiento];
}

// Función para nivel "difícil" (mejorada)
function obtenerMejorMovimiento() {
    const movimientosDisponibles = obtenerMovimientosDisponibles(movimientos);

    // 1. Priorizar movimientos ganadores
    for (let movimiento of movimientosDisponibles) {
        movimientos[movimiento] = 'O';
        if (verificarGanador()) {
            movimientos[movimiento] = '';
            return movimiento;
        }
        movimientos[movimiento] = '';
    }

    // 2. Bloquear al jugador
    for (let movimiento of movimientosDisponibles) {
        movimientos[movimiento] = 'X';
        if (verificarGanador()) {
            movimientos[movimiento] = '';
            return movimiento;
        }
        movimientos[movimiento] = '';
    }

    // 3. Usar Minimax con poda alfa-beta
    return minimaxAlfaBeta(movimientos, 'O', -Infinity, Infinity).index;
}

// Algoritmo Minimax con poda alfa-beta (para nivel difícil)
function minimaxAlfaBeta(tablero, jugador, alfa, beta) {
    const movimientosDisponibles = obtenerMovimientosDisponibles(tablero);

    if (verificarGanadorMinimax(tablero, 'X')) {
        return { score: -20 };
    } else if (verificarGanadorMinimax(tablero, 'O')) {
        return { score: 20 };
    } else if (movimientosDisponibles.length === 0) {
        return { score: 0 };
    }

    let mejorMovimiento;

    if (jugador === 'O') {
        let mejorPuntuacion = -Infinity;
        for (let movimiento of movimientosDisponibles) {
            const nuevoTablero = [...tablero];
            nuevoTablero[movimiento] = 'O';
            const puntuacion = minimaxAlfaBeta(nuevoTablero, 'X', alfa, beta).score;

            if (puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorMovimiento = movimiento;
            }

            alfa = Math.max(alfa, mejorPuntuacion);
            if (beta <= alfa) break;
        }
        return { score: mejorPuntuacion, index: mejorMovimiento };
    } else {
        let mejorPuntuacion = Infinity;
        for (let movimiento of movimientosDisponibles) {
            const nuevoTablero = [...tablero];
            nuevoTablero[movimiento] = 'X';
            const puntuacion = minimaxAlfaBeta(nuevoTablero, 'O', alfa, beta).score;

            if (puntuacion < mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorMovimiento = movimiento;
            }

            beta = Math.min(beta, mejorPuntuacion);
            if (beta <= alfa) break;
        }
        return { score: mejorPuntuacion, index: mejorMovimiento };
    }
}

// Funciones auxiliares
function obtenerMovimientosDisponibles(tablero) {
    return tablero.reduce((acc, val, index) => val === '' ? [...acc, index] : acc, []);
}

function verificarGanadorMinimax(tablero, jugador) {
    const combinacionesGanadoras = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return combinacionesGanadoras.some(combinacion => 
        tablero[combinacion[0]] === jugador &&
        tablero[combinacion[1]] === jugador &&
        tablero[combinacion[2]] === jugador
    );
}
