import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetGroupMessages = () => {
  const [groupId, setGroupId] = useState(''); // State for groupId input
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // Current page
  const [limit, setLimit] = useState(50); // Messages per page
  const [loading, setLoading] = useState(false);

  // Retrieve the token from localStorage
  const token = localStorage.getItem('token');

  // Fetch messages for the group
  const fetchMessages = async () => {
    if (!groupId) {
      setError('Please enter a Group ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `http://localhost:5000/api/messages/groups/${groupId}/messages`,
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
    if (groupId) {
      fetchMessages();
    }
  }, [groupId, page, limit, token]);

  return (
    <div>
      <h2>Group Messages</h2>

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
        <button onClick={fetchMessages} disabled={!groupId || loading}>
          {loading ? 'Loading...' : 'Fetch Messages'}
        </button>
      </div>

      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

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
        <button onClick={fetchMessages} disabled={loading}>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default GetGroupMessages;