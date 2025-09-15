import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [initialized, setInitialized] = useState(false);

  const addMessage = (text, sender = 'bot') => {
    const newMessage = {
      id: Date.now(),
      text,
      sender
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessageToBackend = async (message) => {
    try {
      const response = await fetch('https://restaurant-chatbot-np4c.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message,
          sessionId: localStorage.getItem('sessionId') || 'user-' + Date.now()
        }),
      });
      
      const data = await response.json();
      console.log('Backend response:', data);
      addMessage(data.response);
      
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
      }
    } catch (error) {
      console.error('Connection error:', error);
      addMessage("Sorry, I'm having trouble connecting. Please try again.");
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    addMessage(input, 'user');
    sendMessageToBackend(input.trim());
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!initialized) {
      sendMessageToBackend('init');
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1 className="chatbot-title">RESTAURANT AI</h1>
        <div className="chatbot-subtitle">NEURAL DINING ASSISTANT</div>
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.text.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your command..."
          className="message-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          SEND
        </button>
      </div>
    </div>
  );
}

export default App;