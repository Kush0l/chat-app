import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const sendMessage = async () => {
    if (!message) return;
    setMessages([...messages, { text: message, sender: "You" }]);
    setMessage("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold">Chat</h2>
      <div className="w-1/2 border p-4 mt-4">
        {messages.map((msg, index) => (
          <p key={index} className="p-2">
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border p-2 mt-4"
      />
      <button onClick={sendMessage} className="bg-blue-500 text-white p-2 mt-2">
        Send
      </button>
    </div>
  );
};

export default Chat;
