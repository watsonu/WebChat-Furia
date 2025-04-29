import React, { useState, useEffect, useRef } from 'react';
import socket, { connectSocket } from './socket';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('Fã FURIA');
  const [isConnected, setIsConnected] = useState(false);
  const chatContainerRef = useRef(null);

  // Controle de conexão e listeners aasynchronous
  useEffect(() => {
    
    // Inicia conexão de forma segura
    connectSocket();

    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ Conectado ao servidor');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('❌ Desconectado do servidor');
    };

    const handleNewMessage = (newMessage) => {
      setMessages(prev => [...prev, {
        ...newMessage,
        id: newMessage._id || Date.now()
      }]);
    };

    const handleHistory = (history) => {
      setMessages(history.map(msg => ({
        ...msg,
        id: msg._id || msg.id
      })));
    };

    // Configura listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message', handleNewMessage);
    socket.on('historicoCarregado', handleHistory);

    socket.on('historicoCarregado', (historico) => {
      if (Array.isArray(historico)) {
        setMessages(historico);
      } else {
        console.error('Histórico inválido:', historico);
      }
    });

    // Solicita histórico quando conectado
    if (isConnected) {
      socket.emit('carregarHistorico', (historico) => {
        setMessages(historico);
      });
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message', handleNewMessage);
      socket.off('historicoCarregado', handleHistory);
    };
  }, [isConnected]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      socket.emit('message', {
        user: username,
        text: message,
        id: Date.now() // Temporário até confirmação do servidor
      });
      setMessage('');
    }
  };

  // Estilos mantidos originais
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      fontFamily: '"Montserrat", sans-serif',
      borderRadius: '8px'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '30px'
    },
    logo: {
      height: '50px',
      filter: 'brightness(0) invert(1)'
    },
    title: {
      color: '#FFFFFF',
      textAlign: 'center',
      margin: '0',
      fontSize: '2rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    chatContainer: {
      backgroundColor: '#111111',
      borderRadius: '8px',
      height: '400px',
      overflowY: 'auto',
      padding: '20px',
      marginBottom: '20px',
      scrollbarWidth: 'thin',
      scrollbarColor: '#333 #111'
    },
    message: {
      marginBottom: '15px',
      padding: '12px',
      backgroundColor: '#1A1A1A',
      borderRadius: '6px',
      borderLeft: '3px solid #555555',
      position: 'relative'
    },
    botMessage: {
      marginBottom: '15px',
      padding: '12px',
      backgroundColor: '#1A1A1A',
      borderRadius: '6px',
      borderLeft: '3px solid #FFFFFF',
      position: 'relative'
    },
    user: {
      fontWeight: 'bold',
      color: '#CCCCCC',
      marginRight: '10px'
    },
    text: {
      color: '#FFFFFF'
    },
    timestamp: {
      color: '#777777',
      fontSize: '0.7rem',
      position: 'absolute',
      right: '10px',
      bottom: '5px'
    },
    inputContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    usernameInput: {
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #333',
      backgroundColor: '#1A1A1A',
      color: '#FFFFFF',
      fontSize: '1rem'
    },
    form: {
      display: 'flex',
      gap: '10px'
    },
    messageInput: {
      flex: '1',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #333',
      backgroundColor: '#1A1A1A',
      color: '#FFFFFF',
      fontSize: '1rem'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#333333',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.2s'
    },
    buttonHover: {
      backgroundColor: '#444444'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img 
          src="https://furiagg.fbitsstatic.net/sf/img/logo-furia.svg?" 
          alt="FURIA Logo" 
          style={styles.logo}
        />
        <h1 style={styles.title}>FURIA FAN CHAT</h1>
        <div style={{ 
          color: isConnected ? '#00FF00' : '#FF0000',
          fontSize: '0.8rem'
        }}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>
      
      <div ref={chatContainerRef} style={styles.chatContainer}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={msg.user === 'FURIA BOT' ? styles.botMessage : styles.message}
          >
            <span style={styles.user}>{msg.user}:</span>
            <span style={styles.text}>{msg.text}</span>
            <span style={styles.timestamp}>
              {new Date(msg.timestamp || msg.id).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.usernameInput}
          placeholder="Seu nome"
          maxLength="20"
        />
        <form onSubmit={sendMessage} style={styles.form}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.messageInput}
            placeholder={isConnected ? "Digite uma mensagem" : "Conectando..."}
            disabled={!isConnected}
          />
          <button 
            type="submit" 
            style={{ 
              ...styles.button,
              ...(isConnected && styles.buttonHover),
              backgroundColor: isConnected ? '#333333' : '#666666'
            }}
            disabled={!isConnected}
          >
            {isConnected ? 'Enviar' : '...'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;