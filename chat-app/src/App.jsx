import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import CreateGroup from "./components/CreateGroup"
import GetUserGroups from "./components/UsersGroup"
import GetGroupMessages from "./components/GetGroupMessages"
import GetOrCreatePrivateChat from "./components/GetOrCreatePrivateChat"
import GetPrivateChatMessages from "./components/GetPrivateChatMessages"
import JoinGroup from "./components/JoinGroup";
import GroupChat from "./components/GroupChat";
import SendPrivateChat from "./components/SendPrivateChat";
import Home from './components/Home'



function App() {


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
        <Route path="/Home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
