import React, { useState } from 'react';
import axios from 'axios';

const CreateGroup = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    members: ''
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  // Retrieve the token from localStorage
  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);

    const membersArray = formData.members.split(',').map(member => member.trim());

    try {
      const res = await axios.post('http://localhost:5000/api/messages/groups', {
        ...formData,
        members: membersArray
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // Use the token from localStorage
        }
      });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div>
      <h2>Create a New Group</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Group Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Private Group:</label>
          <input
            type="checkbox"
            name="isPrivate"
            checked={formData.isPrivate}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Members (comma-separated user IDs):</label>
          <input
            type="text"
            name="members"
            value={formData.members}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Create Group</button>
      </form>

      {response && (
        <div>
          <h3>Group Created Successfully</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default CreateGroup;