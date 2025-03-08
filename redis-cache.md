Here's a comprehensive guide to retrieving stored messages using Redis CLI:

### Redis CLI Commands for Retrieving Cached Messages

1. Connect to Redis
```bash
# Basic connection
redis-cli

# If Redis is on a different host/port
redis-cli -h localhost -p 6379
```

2. List All Message-Related Keys
```bash
# Find all group message keys
KEYS group:messages:*

# Find all private message keys
KEYS private:messages:*
```

3. Retrieve Cached Messages
```bash
# Get all messages for a specific group
# Replace GROUP_ID with actual group ID
LRANGE group:messages:GROUP_ID 0 -1

# Get all messages for a specific private chat
# Replace CHAT_ID with actual chat ID
LRANGE private:messages:CHAT_ID 0 -1
```

4. Detailed Inspection Commands
```bash
# Count number of messages in a group
LLEN group:messages:GROUP_ID

# Get the first message
LINDEX group:messages:GROUP_ID 0

# Get last message
LINDEX group:messages:GROUP_ID -1
```

5. Check Expiration
```bash
# Check remaining time for a key
TTL group:messages:GROUP_ID
```

### Practical Example

Let's say you want to debug:

1. Find existing keys
```bash
# List all keys
KEYS *
```

2. Retrieve and Parse a Specific Message
```bash
# Get first message and parse it
LINDEX group:messages:GROUP_ID 0

# Example parsing (you might need to run this in a script)
# echo '[MESSAGE_STRING]' | jq '.'
```

### Troubleshooting Tips
- Ensure Redis is running
- Check your connection details
- Verify the exact key names in your application

### Sample Python Script for Advanced Retrieval
```python
import redis
import json

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0)

# Retrieve group messages
def get_group_messages(group_id):
    # Get all messages for the group
    messages = r.lrange(f'group:messages:{group_id}', 0, -1)
    
    # Parse messages
    parsed_messages = []
    for msg in messages:
        try:
            parsed_msg = json.loads(msg)
            parsed_messages.append(parsed_msg)
        except json.JSONDecodeError:
            print(f"Could not parse message: {msg}")
    
    return parsed_messages

# Example usage
group_messages = get_group_messages('your-group-id')
for msg in group_messages:
    print(msg)
```

### Best Practices
1. Always handle potential JSON parsing errors
2. Be aware of the 1-hour expiration
3. Use appropriate error handling
4. Consider performance for large message sets

Would you like me to elaborate on any of these methods for retrieving stored messages?