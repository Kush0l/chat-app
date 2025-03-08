import React, { useState } from 'react';
import axios from 'axios';

const GetOrCreatePrivateChat = () => {
  const [recipientId, setRecipientId] = useState(''); // State for recipientId input
  const [chat, setChat] = useState(null); // State to store the chat details
  const [error, setError] = useState(''); // State for error messages
  const [loading, setLoading] = useState(false); // State for loading status

  // Retrieve the token from localStorage
  const token = localStorage.getItem('token');

  // Function to fetch or create a private chat
  const fetchOrCreatePrivateChat = async () => {
    if (!recipientId) {
      setError('Please enter a Recipient ID');
      return;
    }

    setLoading(true);
    setError('');
    setChat(null);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/private/${recipientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChat(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching the chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Get or Create Private Chat</h2>

      {/* Input field for recipientUsername */}
      <div>
        <label>
          Recipient UserName:
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Enter Recipient ID"
          />
        </label>
        <button onClick={fetchOrCreatePrivateChat} disabled={!recipientId || loading}>
          {loading ? 'Loading...' : 'Get/Create Chat'}
        </button>
      </div>

      {/* Display error message */}
      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Display chat details */}
      {chat && (
        <div>
          <h3>Chat Details</h3>
          <p><strong>Chat ID:</strong> {chat._id}</p>
          <p><strong>Participants:</strong> {chat.participants.join(', ')}</p>
          {chat.lastMessage && (
            <div>
              <h4>Last Message:</h4>
              <p><strong>Content:</strong> {chat.lastMessage.content}</p>
              <p><strong>Sender:</strong> {chat.lastMessage.sender}</p>
              <p><strong>Sent At:</strong> {new Date(chat.lastMessage.createdAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GetOrCreatePrivateChat;