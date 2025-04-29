require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');

// Configuração inicial com tratamento de erros global
process.on('uncaughtException', (err) => {
  console.error('⚠️ Erro não tratado:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Promise rejeitada:', err);
});

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Conexão MongoDB com tratamento reforçado
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000
})
.then(() => console.log('🟢 MongoDB conectado!'))
.catch(err => {
  console.error('🔴 Falha crítica MongoDB:', err);
  process.exit(1); // Encerra se não conectar ao DB
});

// Configuração Socket.io com proteção extra
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 60000
  }
});

// Middleware de proteção
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (token === process.env.API_KEY) {
      return next();
    }
    throw new Error('Acesso não autorizado');
  } catch (err) {
    console.error('Erro de autenticação:', err);
    next(err);
  }
});

// Database Health Check
const checkDB = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
};

// Eventos protegidos com try-catch
io.on('connection', (socket) => {
  console.log(`🔌 Nova conexão: ${socket.id}`);

  socket.on('message', async (msg) => {
    try {
      if (!msg.user || !msg.text) {
        throw new Error('Dados inválidos');
      }

      if (!(await checkDB())) {
        throw new Error('Database offline');
      }

      const newMsg = await Message.create({
        user: msg.user,
        text: msg.text
      });

      io.emit('message', {
        _id: newMsg._id,
        user: newMsg.user,
        text: newMsg.text,
        timestamp: newMsg.createdAt
      });
    } catch (err) {
      console.error('Erro no evento "message":', err);
      socket.emit('error', 'Erro ao processar mensagem');
    }
  });

  socket.on('carregarHistorico', async (callback) => {
    try {
      if (!(await checkDB())) {
        throw new Error('Database offline');
      }
  
      const historico = await Message.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
  
      // Verifica se o callback existe antes de chamar
      if (typeof callback === 'function') {
        callback(historico);
      } else {
        // Se não tem callback, emite via Socket.io
        socket.emit('historicoCarregado', historico);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      if (typeof callback === 'function') {
        callback([]);
      } else {
        socket.emit('historicoCarregado', []);
      }
    }
  });
  socket.on('disconnect', () => {
    console.log(`❌ Desconectado: ${socket.id}`);
  });
});

// Rota de saúde
app.get('/health', async (req, res) => {
  const dbStatus = await checkDB();
  res.status(dbStatus ? 200 : 500).json({
    status: dbStatus ? 'healthy' : 'unhealthy',
    dbConnected: dbStatus,
    connections: io.engine.clientsCount
  });
});

// Inicia servidor com verificação
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
})
.on('error', (err) => {
  console.error('🔥 Falha ao iniciar servidor:', err);
  process.exit(1);
});