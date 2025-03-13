import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GroupChat = () => {
  const [groupId, setGroupId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastSentMessage, setLastSentMessage] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!token) {
      setError('No token found. Please log in.');
      return;
    }

    connectWebSocket();

    // Add reconnection logic
    const reconnectInterval = setInterval(() => {
      if (ws.current?.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, attempting to reconnect...');
        connectWebSocket();
      }
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:5000?token=${token}`;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Attempting to connect to WebSocket...');
    setConnectionStatus('Connecting...');

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      setConnectionStatus('Connected');
      setError('');

      // If we were in a group before, rejoin it
      if (groupId) {
        joinGroup(groupId, true);
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket event:', data);

        switch (data.type) {
          case 'HISTORICAL_MESSAGES':
            console.log("Setting historical messages:", data.messages);
            setMessages(data.messages || []);
            break;

          case 'CACHED_GROUP_MESSAGES':
            console.log("Setting cached group messages:", data.messages);
            setMessages(data.messages || []);
            break;

          case 'GROUP_MESSAGE':
            console.log("Received new group message:", data.message);

            // Check if we have the message data in the expected format
            if (data.message && data.message.content) {
              setMessages((prevMessages) => [...prevMessages, data.message]);
            } else if (data.senderId && data.content) {
              // Alternative format some servers might use
              const newMessage = {
                _id: uuidv4(), // Use UUID for temporary messages
                sender: { id: data.senderId },
                content: data.content,
                createdAt: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
            break;

          case 'ERROR':
            setError(data.message);
            break;

          case 'CONNECTION_ESTABLISHED':
            console.log('Connection established with user ID:', data.userId);
            break;

          default:
            console.log('Received other message type:', data.type, data);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error, event.data);
        setError("Error processing message from server");
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket error: Connection failed');
      setConnectionStatus('Error');
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setConnectionStatus('Disconnected');
    };
  };

  const joinGroup = (id = groupId, isReconnect = false) => {
    const groupToJoin = id || groupId;

    if (!groupToJoin) {
      setError('Please enter a Group ID');
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Only clear messages if not a reconnect
      if (!isReconnect) {
        setMessages([]);
        setGroupId(groupToJoin);
      }

      const data = {
        type: 'JOIN_GROUP',
        groupId: groupToJoin,
      };
      console.log("Sending JOIN_GROUP:", data);
      ws.current.send(JSON.stringify(data));
      setError('');
    } else {
      setError('WebSocket connection is not open. Status: ' + connectionStatus);
      // Try to reconnect
      connectWebSocket();
    }
  };

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
      console.log("Sending message:", data);

      try {
        ws.current.send(JSON.stringify(data));

        // Add the message locally with a pending status
        // const tempMessage = {
        //   _id: uuidv4(), // Use UUID for temporary messages
        //   content: messageContent,
        //   sender: { username: 'You (pending)' },
        //   createdAt: new Date().toISOString(),
        //   pending: true,
        // };

        setLastSentMessage({
          content: messageContent,
          timestamp: Date.now(),
        });

        // setMessages((prevMessages) => [...prevMessages, tempMessage]);
        setMessageContent(''); // Clear the input field
        setError('');
      } catch (e) {
        console.error("Error sending message:", e);
        setError("Failed to send message: " + e.message);
      }
    } else {
      setError(`WebSocket connection is not open (state: ${ws.current?.readyState}). Trying to reconnect...`);
      connectWebSocket();
    }
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && messageContent.trim()) {
      sendGroupMessage();
    }
  };

  return (
    <div className="chat-container">
      <h2>Group Chat</h2>
      <div style={{ color: connectionStatus === 'Connected' ? 'green' : 'red', marginBottom: '10px' }}>
        Status: {connectionStatus}
      </div>

      {/* Input field for groupId */}
      <div className="group-join" style={{ marginBottom: '15px' }}>
        <label>
          Group ID:
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Enter Group ID"
            style={{ marginLeft: '5px', marginRight: '10px' }}
          />
        </label>
        <button
          onClick={() => joinGroup()}
          disabled={!groupId || connectionStatus !== 'Connected'}
        >
          Join Group
        </button>
      </div>

      {/* Last sent message info */}
      {lastSentMessage && (
        <div style={{
          fontSize: '12px',
          marginBottom: '10px',
          color: 'gray',
          border: '1px dashed #ccc',
          padding: '5px',
          borderRadius: '4px'
        }}>
          Last sent: "{lastSentMessage.content}" at {new Date(lastSentMessage.timestamp).toLocaleTimeString()}
        </div>
      )}

      {/* Display received messages */}
      <div className="messages-container" style={{
        height: '300px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '15px',
        backgroundColor: '#f9f9f9',
        color: 'black'
      }}>
        <h3>Messages ({messages.length}):</h3>
        <div className="messages-list">
          {messages.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {messages.map((message) => {
                const key = `${message._id}-${message.createdAt || Date.now()}`;
                console.log('Message Key:', key); // Debugging
                return (
                  <li
                    key={key}
                    style={{
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      borderLeft: '3px solid #2196f3'
                    }}
                  >
                    <strong>{message.sender?.username || 'Unknown'}:</strong> {message.content}
                  </li>
                );
              })}
              <div ref={messagesEndRef} />
            </ul>
          ) : (
            <p>No messages yet</p>
          )}
        </div>
      </div>

      {/* Input field for message content */}
      <div className="message-input" style={{ display: 'flex' }}>
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={groupId ? "Enter your message" : "Join a group first"}
          disabled={!groupId || connectionStatus !== 'Connected'}
          style={{ flexGrow: 1, padding: '8px', marginRight: '8px' }}
        />
        <button
          onClick={sendGroupMessage}
          disabled={!groupId || !messageContent.trim() || connectionStatus !== 'Connected'}
          style={{ padding: '8px 16px' }}
        >
          Send Message
        </button>
      </div>

      {/* Display error message */}
      {error && (
        <div className="error-container" style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Debug information */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#e0f7fa',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <details>
          <summary>Debug Information</summary>
          <p>WebSocket State: {ws.current ? ['Connecting', 'Open', 'Closing', 'Closed'][ws.current.readyState] : 'Not initialized'}</p>
          <p>Group ID: {groupId || 'None'}</p>
          <p>Message Count: {messages.length}</p>
          <p>Connection Status: {connectionStatus}</p>
        </details>
      </div>
    </div>
  );
};

export default GroupChat;