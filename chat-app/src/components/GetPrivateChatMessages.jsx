import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetPrivateChatMessages = () => {
  const [recipientId, setRecipientId] = useState(''); // State for recipientId input
  const [messages, setMessages] = useState([]); // State to store the messages
  const [error, setError] = useState(''); // State for error messages
  const [page, setPage] = useState(1); // Current page
  const [limit, setLimit] = useState(50); // Messages per page
  const [loading, setLoading] = useState(false); // State for loading status

  // Retrieve the token from localStorage
  const token = localStorage.getItem('token');

  // Function to fetch private chat messages
  const fetchPrivateChatMessages = async () => {
    if (!recipientId) {
      setError('Please enter a Recipient ID');
      return;
    }

    setLoading(true);
    setError('');
    setMessages([]);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/private/${recipientId}/messages`,
        {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when the component mounts or when page/limit changes
  useEffect(() => {
    if (recipientId) {
      fetchPrivateChatMessages();
    }
  }, [recipientId, page, limit, token]);

  return (
    <div>
      <h2>Private Chat Messages</h2>

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
        <button onClick={fetchPrivateChatMessages} disabled={!recipientId || loading}>
          {loading ? 'Loading...' : 'Fetch Messages'}
        </button>
      </div>

      {/* Display error message */}
      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Display messages */}
      {loading ? (
        <p>Loading messages...</p>
      ) : messages.length > 0 ? (
        <ul>
          {messages.map((message) => (
            <li key={message._id}>
              <div>
                <strong>{message.sender.name}</strong> ({message.sender.username})
              </div>
              <p>{message.content}</p>
              <small>{new Date(message.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No messages found.</p>
      )}

      {/* Pagination Controls */}
      <div>
        <label>
          Page:
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            min="1"
          />
        </label>
        <label>
          Messages per page:
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            min="1"
            max="100"
          />
        </label>
        <button onClick={fetchPrivateChatMessages} disabled={loading}>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default GetPrivateChatMessages;