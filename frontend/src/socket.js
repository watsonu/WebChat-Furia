import { io } from 'socket.io-client';

// Configuração segura com fallbacks

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: false // Adicionado para controle manual
});

// Inicia conexão somente após componentes estarem montados
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export default socket;