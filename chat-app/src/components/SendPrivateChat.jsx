import React, { useState, useEffect, useRef } from 'react';

const SendPrivateChat = () => {
  const [recipientId, setRecipientId] = useState(''); // State for recipientId input
  const [messageContent, setMessageContent] = useState(''); // State for message content input
  const [messages, setMessages] = useState([]); // State to store received messages
  const [error, setError] = useState(''); // State for error messages
  const ws = useRef(null); // Ref to store the WebSocket connection

  // Retrieve the token from localStorage
  const token = localStorage.getItem('token');

  // Establish WebSocket connection when the component mounts
  useEffect(() => {
    if (!token) {
      setError('No token found. Please log in.');
      return;
    }

    // Include the token in the WebSocket URL
    const wsUrl = `ws://localhost:5000?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    // Handle WebSocket connection open
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    // Handle incoming WebSocket messages
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data); // Debugging: Log received messages

      // Handle specific message types
      switch (data.type) {
        case 'PRIVATE_MESSAGE':
          // Add the new message to the messages list
          setMessages((prevMessages) => [...prevMessages, data.message]);
          break;
        case 'ERROR':
          setError(data.message); // Display error message
          break;
        default:
          console.log('Received message:', data);
      }
    };

    // Handle WebSocket errors
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket error: ' + error.message);
    };

    // Handle WebSocket connection close
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup WebSocket connection when the component unmounts
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  // Function to send SEND_PRIVATE_MESSAGE event
  const sendPrivateMessage = () => {
    if (!recipientId || !messageContent) {
      setError('Please enter a Recipient ID and message content');
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const data = {
        type: 'SEND_PRIVATE_MESSAGE',
        recipientId: recipientId,
        content: messageContent,
      };
      ws.current.send(JSON.stringify(data));
      setMessageContent(''); // Clear the input field
      setError('');
    } else {
      setError('WebSocket connection is not open');
    }
  };

  return (
    <div>
      <h2>Private Chat</h2>

      {/* Input field for recipientId */}
      <div>
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

      {/* Input field for message content */}
      <div>
        <label>
          Message:
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Enter your message"
          />
        </label>
        <button onClick={sendPrivateMessage}>Send Message</button>
      </div>

      {/* Display received messages */}
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <strong>{message.sender.username}:</strong> {message.content}
            </li>
          ))}
        </ul>
      </div>

      {/* Display error message */}
      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SendPrivateChat;