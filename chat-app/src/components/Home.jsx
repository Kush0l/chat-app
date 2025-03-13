import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Home Page</h2>
      <button onClick={() => navigate("/Profile")}>Profile</button>
      <button onClick={() => navigate("/CreateGroup")}>Create Group</button>
      <button onClick={() => navigate("/GetUserGroups")}>Get User Groups</button>
      <button onClick={() => navigate("/GetGroupMessages")}>Get Group Messages</button>
      <button onClick={() => navigate("/GetOrCreatePrivateChat")}>Get or Create Private Chat</button>
      <button onClick={() => navigate("/GetPrivateChatMessages")}>Get or Create Private Messages</button>
      <button onClick={() => navigate("/JoinGroup")}>Join Group</button>
      <button onClick={() => navigate("/GroupChat")}>Group Chat</button>
      <button onClick={() => navigate("/SendPrivateChat")}>Send Private Chat</button>
    </div>
  );
};

export default Home;