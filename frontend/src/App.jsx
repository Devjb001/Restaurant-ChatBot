
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const hasInitRef = useRef(false);

  const addMessage = (text, sender = 'bot') => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text,
      sender
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const ensureSessionId = () => {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
      sid = 'user-' + Date.now();
      localStorage.setItem('sessionId', sid);
    }
    return sid;
  };

  const sendMessageToBackend = async (message) => {
    try {

      const sessionId = ensureSessionId();

      const response = await fetch('https://restaurant-chatbot-np4c.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId
        }),
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (data && data.response) {
        addMessage(data.response, 'bot');
      } else if (data && data.error) {
        addMessage('Error: ' + data.error, 'bot');
      } else {
        addMessage("Sorry, I got an unexpected response from the server.", 'bot');
      }

      if (data && data.sessionId) {

        localStorage.setItem('sessionId', data.sessionId);
      }
    } catch (error) {
      console.error('Connection error:', error);
      addMessage("Sorry, I'm having trouble connecting. Please try again.", 'bot');
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    addMessage(input.trim(), 'user');
    sendMessageToBackend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {

    ensureSessionId();

    if (hasInitRef.current) return;
    hasInitRef.current = true;

    sendMessageToBackend('init');
  }, []);


  useEffect(() => {
    const container = document.querySelector(".messages-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

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
              {String(msg.text).split('\n').map((line, index) => (
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
          onKeyDown={handleKeyDown}
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
