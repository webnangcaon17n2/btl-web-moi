import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSend, FiMinimize2 } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';
import { API_BASE } from '../../config/api';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Chào bạn! Mình là Aether Plant Assistant. Mình có thể giúp gì cho vườn cây của bạn không?', sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newUserMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const history = messages.slice(1).map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history })
      });

      const data = await res.json();
      
      const botResponse = {
        id: Date.now() + 1,
        text: data.text || `Lỗi: ${data.error || 'Trục trặc hệ thống'} (${data.detail || 'Không có chi tiết'})`,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      className={`chatbot-container ${isOpen ? 'chatbot--open' : ''}`}
      drag
      dragConstraints={{ left: -window.innerWidth + 400, right: 0, top: -window.innerHeight + 600, bottom: 0 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Nút bong bóng chat */}
      <button 
        className="chatbot-toggle" 
        onClick={toggleChat}
        aria-label="Toggle Chat"
      >
        {isOpen ? <FiMinimize2 size={24} /> : <PiPlantFill size={28} />}
        {!isOpen && <span className="chatbot-notification">1</span>}
      </button>

      {/* Khung cửa sổ chat */}
      <div className="chatbot-window">
        <header className="chatbot-header">
          <div className="chatbot-header__info">
            <div className="chatbot-header__avatar">
              <PiPlantFill size={20} />
            </div>
            <div>
              <h3 className="chatbot-header__title">Aether Plant Assistant</h3>
              <span className="chatbot-header__status">Online</span>
            </div>
          </div>
          <button className="chatbot-header__close" onClick={toggleChat}>
            <FiX size={20} />
          </button>
        </header>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbot-message chatbot-message--${msg.sender}`}>
              <div className="chatbot-message__bubble">
                {msg.text}
                <span className="chatbot-message__time">{msg.time}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chatbot-message chatbot-message--bot">
              <div className="chatbot-message__bubble chatbot-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-footer" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="chatbot-send-btn" disabled={!inputValue.trim()}>
            <FiSend size={18} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Chatbot;
