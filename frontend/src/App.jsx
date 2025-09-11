import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome to our Restaurant! How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <h1 className="chatbot-title">RESTAURANT AI</h1>
        <div className="chatbot-subtitle">NEURAL DINING ASSISTANT</div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your command..."
          className="message-input"
        />
        <button className="send-button">
          SEND
        </button>
      </div>
    </div>
  );
}

export default App;