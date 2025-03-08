import { useState, useEffect } from "react";
import axios from "axios";

const PrivateChat = ({ recipientId, authToken }) => {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/messages/private/${recipientId}/messages?page=${page}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-3">Private Chat</h2>
      <div className="h-80 overflow-y-auto border p-2 rounded">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg._id} className="mb-2">
              <p>
                <strong>{msg.sender.username}:</strong> {msg.content}
              </p>
              <small className="text-gray-500">
                {new Date(msg.createdAt).toLocaleString()}
              </small>
            </div>
          ))
        ) : (
          <p>No messages found.</p>
        )}
      </div>
      {loading && <p>Loading...</p>}
      <button
        className="mt-3 p-2 bg-blue-500 text-white rounded"
        onClick={() => setPage((prev) => prev + 1)}
      >
        Load More
      </button>
    </div>
  );
};

export default PrivateChat;
