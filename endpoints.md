Here are the endpoints, methods, and expected response that you can test in Postman:

---

### **Auth Routes**

#### **1. User Registration**
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response** (Success):
  ```json
  {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "jwt_token"
  }
  ```
- **Response** (Error - User already exists):
  ```json
  {
    "message": "User already exists"
  }
  ```

---

#### **2. User Login**
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "identifier": "johndoe", // Can be email or username
    "password": "password123"
  }
  ```
- **Response** (Success):
  ```json
  {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "jwt_token"
  }
  ```
- **Response** (Error - Invalid credentials):
  ```json
  {
    "message": "Invalid credentials"
  }
  ```

---

#### **3. Get Current User**
- **Endpoint**: `GET /api/auth/me`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Response** (Success):
  ```json
  {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
  ```
- **Response** (Error - Unauthorized):
  ```json
  {
    "message": "Unauthorized"
  }
  ```

---

#### **4. Update User Profile**
- **Endpoint**: `PUT /api/auth/profile`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
  ```json
  {
    "name": "John Updated",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Response** (Success):
  ```json
  {
    "id": "user_id",
    "name": "John Updated",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Response** (Error - Unauthorized):
  ```json
  {
    "message": "Unauthorized"
  }
  ```

---

### **Message Routes**

#### **1. Create a New Group**
- **Endpoint**: `POST /api/messages/groups`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
  ```json
  {
    "name": "New Group",
    "description": "This is a new group",
    "isPrivate": false,
    "members": ["user_id_1", "user_id_2"]
  }
  ```
- **Response** (Success):
  ```json
  {
    "_id": "group_id",
    "name": "New Group",
    "description": "This is a new group",
    "creator": "user_id",
    "members": ["user_id", "user_id_1", "user_id_2"],
    "admins": ["user_id"],
    "isPrivate": false
  }
  ```
- **Response** (Error - Bad Request):
  ```json
  {
    "message": "Error message"
  }
  ```

---

#### **2. Get User's Groups**
- **Endpoint**: `GET /api/messages/groups`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Response** (Success):
  ```json
  [
    {
      "_id": "group_id",
      "name": "New Group",
      "description": "This is a new group",
      "creator": "user_id",
      "members": ["user_id", "user_id_1", "user_id_2"],
      "admins": ["user_id"],
      "isPrivate": false,
      "lastMessage": {
        "_id": "message_id",
        "content": "Hello group!",
        "sender": "user_id",
        "createdAt": "2023-10-01T12:00:00.000Z"
      }
    }
  ]
  ```
- **Response** (Error - Internal Server Error):
  ```json
  {
    "message": "Error message"
  }
  ```

---

#### **3. Get Group Messages**
- **Endpoint**: `GET /api/messages/groups/:groupId/messages`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of messages per page (default: 50)
- **Response** (Success):
  ```json
  [
    {
      "_id": "message_id",
      "content": "Hello group!",
      "sender": {
        "_id": "user_id",
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "createdAt": "2023-10-01T12:00:00.000Z"
    }
  ]
  ```
- **Response** (Error - Not a member of this group):
  ```json
  {
    "message": "Not a member of this group"
  }
  ```

---

#### **4. Get or Create Private Chat**
- **Endpoint**: `GET /api/messages/private/:recipientId`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Response** (Success):
  ```json
  {
    "_id": "private_chat_id",
    "participants": ["user_id", "recipient_id"],
    "lastMessage": {
      "_id": "message_id",
      "content": "Hello!",
      "sender": "user_id",
      "createdAt": "2023-10-01T12:00:00.000Z"
    }
  }
  ```
- **Response** (Error - Internal Server Error):
  ```json
  {
    "message": "Error message"
  }
  ```

---

#### **5. Get Private Chat Messages**
- **Endpoint**: `GET /api/messages/private/:recipientId/messages`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of messages per page (default: 50)
- **Response** (Success):
  ```json
  [
    {
      "_id": "message_id",
      "content": "Hello!",
      "sender": {
        "_id": "user_id",
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "createdAt": "2023-10-01T12:00:00.000Z"
    }
  ]
  ```
- **Response** (Error - Internal Server Error):
  ```json
  {
    "message": "Error message"
  }
  ```

---

### **Health Check**
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2023-10-01T12:00:00.000Z"
  }
  ```

---

### **WebSocket Endpoints**
WebSocket endpoints are not directly testable in Postman but can be tested using a WebSocket client. Here are the WebSocket events:

####the ws endpoint is ws://localhost:5000?token=<jwt-token>

1. **Join Group**:
   - **Event**: `JOIN_GROUP`
   - **Data**:
     ```json
     {
       "type": "JOIN_GROUP",
       "groupId": "group_id"
     }
     ```

2. **Send Group Message**:
   - **Event**: `SEND_GROUP_MESSAGE`
   - **Data**:
     ```json
     {
       "type": "SEND_GROUP_MESSAGE",
       "groupId": "group_id",
       "content": "Hello group!"
     }
     ```

3. **Send Private Message**:
   - **Event**: `SEND_PRIVATE_MESSAGE`
   - **Data**:
     ```json
     {
       "type": "SEND_PRIVATE_MESSAGE",
       "recipientId": "recipient_id",
       "content": "Hello!"
     }
     ```

4. **Typing Indicator**:
   - **Event**: `TYPING`
   - **Data**:
     ```json
     {
       "type": "TYPING",
       "roomId": "group_id_or_private_chat_id",
       "isTyping": true
     }
     ```

---

You can use these endpoints and methods to test the API in Postman. Make sure to replace placeholders like `user_id`, `group_id`, and `jwt_token` with actual values from your application.