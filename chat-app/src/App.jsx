import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import PrivateChat from "./components/PrivateChat"; // Import Chat Component
import CreateGroup from "./components/CreateGroup"
import GetUserGroups from "./components/UsersGroup"
import GetGroupMessages from "./components/GetGroupMessages"
import GetOrCreatePrivateChat from "./components/GetOrCreatePrivateChat"
import GetPrivateChatMessages from "./components/GetPrivateChatMessages"
import JoinGroup from "./components/JoinGroup";
import GroupChat from "./components/GroupChat";
import SendPrivateChat from "./components/SendPrivateChat";

import { useEffect, useState } from "react";

function App() {
  const [authToken, setAuthToken] = useState("");

  useEffect(() => {
    // Retrieve auth token from localStorage
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/CreateGroup" element={<CreateGroup />} />
        <Route path="/GetUserGroups" element={<GetUserGroups />} />
        <Route path="/GetGroupMessages" element={<GetGroupMessages />} />
        <Route path="/GetOrCreatePrivateChat" element={<GetOrCreatePrivateChat />} />
        <Route path="/GetPrivateChatMessages" element={<GetPrivateChatMessages />} />
        <Route path="/JoinGroup" element={<JoinGroup />} />
        <Route path="/GroupChat" element={<GroupChat />} />
        <Route path="/SendPrivateChat" element={<SendPrivateChat />} />

        {/* Private Chat Route (Protected by Auth Token) */}
        {authToken ? (
          <Route path="/chat" element={<PrivateChat authToken={authToken} />} />
        ) : (
          <Route
            path="/chat"
            element={<p className="text-red-500 p-4">Please log in to access chat.</p>}
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;
