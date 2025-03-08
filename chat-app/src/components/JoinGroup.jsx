import React, { useState, useEffect, useRef } from 'react';

const JoinGroup = () => {
  const [groupId, setGroupId] = useState(''); // State for groupId input
  const [message, setMessage] = useState(''); // State for WebSocket messages
  const [error, setError] = useState(''); // State for error messages
  const [isJoined, setIsJoined] = useState(false); // State to track if the user has joined the group
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

      // Handle specific message types
      switch (data.type) {
        case 'USER_JOINED':
          setIsJoined(true); // Update state to indicate successful join
          setMessage(`Successfully joined group: ${data.groupId}`);
          break;
        case 'ERROR':
          setError(data.message); // Display error message
          break;
        default:
          setMessage(JSON.stringify(data)); // Display other messages
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
      console.log("joined th group");
      
      setError('');
    } else {
      setError('WebSocket connection is not open');
    }
  };

  return (
    <div>
      <h2>Join Group</h2>

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

      {/* Display success message if joined */}
      {isJoined && (
        <div>
          <h3>Success!</h3>
          <p>{message}</p>
        </div>
      )}

      {/* Display WebSocket messages */}
      {message && !isJoined && (
        <div>
          <h3>Message from Server:</h3>
          <pre>{message}</pre>
        </div>
      )}

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

export default JoinGroup;