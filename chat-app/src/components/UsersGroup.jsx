import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetUserGroups = () => {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  // Retrieve the token from localStorage
  const token = localStorage.getItem('token');

  // Fetch user's groups when the component mounts
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/messages/groups', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setGroups(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching groups');
      }
    };

    fetchGroups();
  }, [token]);

  return (
    <div>
      <h2>Your Groups</h2>
      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
      {groups.length > 0 ? (
        <ul>
          {groups.map((group) => (
            <li key={group._id}>
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <p><strong>Creator:</strong> {group.creator}</p>
              <p><strong>Members:</strong> {group.members.join(', ')}</p>
              <p><strong>Admins:</strong> {group.admins.join(', ')}</p>
              <p><strong>Private:</strong> {group.isPrivate ? 'Yes' : 'No'}</p>
              {group.lastMessage && (
                <div>
                  <h4>Last Message:</h4>
                  <p><strong>Content:</strong> {group.lastMessage.content}</p>
                  <p><strong>Sender:</strong> {group.lastMessage.sender}</p>
                  <p><strong>Sent At:</strong> {new Date(group.lastMessage.createdAt).toLocaleString()}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No groups found.</p>
      )}
    </div>
  );
};

export default GetUserGroups;