import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SendPrivateChat = () => {
  const [recipientId, setRecipientId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('No token found. Please log in.');
      return;
    }

    const wsUrl = `ws://localhost:5000?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PRIVATE_MESSAGE') {
        // Update the messages state with the new message
        setMessages((prevMessages) => [...prevMessages, data.message]);
      } else if (data.type === 'ERROR') {
        setError(data.message);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket error: ' + error.message);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log(messages);
    
  }, [messages]);

  const sendPrivateMessage = () => {
    if (!recipientId || !messageContent) {
      setError('Please enter a Recipient ID and message content');
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const data = {
        type: 'SEND_PRIVATE_MESSAGE',
        recipientUsername: recipientId,
        content: messageContent,
      };

      ws.current.send(JSON.stringify(data));
      setMessageContent('');
      setError('');
    } else {
      setError('WebSocket connection is not open');
    }
  };

  const fetchPrivateChatMessages = async () => {
    if (!recipientId) {
      setError('Please enter a Recipient ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/private/${recipientId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when recipient changes
  useEffect(() => {
    if (recipientId) {
      fetchPrivateChatMessages();
    } else {
      setMessages([]);
    }
  }, [recipientId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && messageContent.trim()) {
      sendPrivateMessage();
    }
  };

  return (
    <div className="chat-container">
      <h2>Private Chat</h2>

      <div className="recipient-selector">
        <label>
          Recipient ID:
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Enter Recipient ID"
          />
        </label>
      </div>

      <div
        className="messages-container"
        style={{
          height: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          marginBottom: '10px',
        }}
      >
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {messages.map((message, index) => (
              <li
                key={message.id || index}
                style={{
                  marginBottom: '10px',
                  textAlign: message.sender.username !== recipientId ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    background: message.sender.username !== recipientId ? '#4CAF50' : '#E0E0E0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    maxWidth: '70%',
                    color: message.sender.username !== recipientId ? '#FFFFFF' : '#212121',
                  }}
                >
                  <strong>{message.sender.username}:</strong> {message.content}
                  <br />
                  <small style={{ color: 'black' }}>
                    {new Date(message.createdAt).toLocaleString()}
                  </small>
                </div>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>
        ) : (
          <p>No messages found. Start a conversation!</p>
        )}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your message"
          style={{ width: '80%' }}
        />
        <button
          onClick={sendPrivateMessage}
          disabled={!messageContent.trim() || !recipientId}
          style={{ width: '18%', marginLeft: '2%' }}
        >
          Send
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SendPrivateChat;