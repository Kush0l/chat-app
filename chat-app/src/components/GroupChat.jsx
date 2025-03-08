import React, { useState, useEffect, useRef } from 'react';

const GroupChat = () => {
  const [groupId, setGroupId] = useState(''); // State for groupId input
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
        case 'GROUP_MESSAGE':
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

  // Function to send JOIN_GROUP event
  const joinGroup = () => {
    if (!groupId) {
      setError('Please enter a Group ID');
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const data = {
        type: 'JOIN_GROUP',
        groupId: groupId,
      };
      ws.current.send(JSON.stringify(data));
      setError('');
    } else {
      setError('WebSocket connection is not open');
    }
  };

  // Function to send SEND_GROUP_MESSAGE event
  const sendGroupMessage = () => {
    if (!groupId || !messageContent) {
      setError('Please enter a Group ID and message content');
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const data = {
        type: 'SEND_GROUP_MESSAGE',
        groupId: groupId,
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
      <h2>Group Chat</h2>

      {/* Input field for groupId */}
      <div>
        <label>
          Group ID:
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Enter Group ID"
          />
        </label>
        <button onClick={joinGroup}>Join Group</button>
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
        <button onClick={sendGroupMessage}>Send Message</button>
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

export default GroupChat;