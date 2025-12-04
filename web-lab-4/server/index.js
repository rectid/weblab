const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4300",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Data paths (shared with admin app)
const DATA_DIR = path.join(__dirname, '../../web-lab-3/data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Helper functions
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.get('/api/friends', async (req, res) => {
  try {
    const friends = await readJsonFile(FRIENDS_FILE);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

app.get('/api/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await readJsonFile(MESSAGES_FILE);
    // For now, return all messages. In a real app, filter by friends
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, birthDate, photo } = req.body;
    const users = await readJsonFile(USERS_FILE);

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const newUser = {
      id: uuidv4(),
      fullName,
      email,
      password, // In real app, hash this
      birthDate,
      photo,
      role: 'user',
      status: 'pending'
    };

    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);

    // Create friends entry
    const friends = await readJsonFile(FRIENDS_FILE);
    friends.push({ userId: newUser.id, friends: [] });
    await writeJsonFile(FRIENDS_FILE, friends);

    res.json({ user: newUser, token: 'dummy-token' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readJsonFile(USERS_FILE);

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({ user, token: 'dummy-token' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { text, authorId } = req.body;
    const messages = await readJsonFile(MESSAGES_FILE);

    const newMessage = {
      id: uuidv4(),
      authorId,
      text,
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    await writeJsonFile(MESSAGES_FILE, messages);

    // Emit to all connected clients
    io.emit('message:new', newMessage);

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post message' });
  }
});

app.post('/api/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;
    const friends = await readJsonFile(FRIENDS_FILE);

    const userFriends = friends.find(f => f.userId === userId);
    if (!userFriends) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userFriends.friends.includes(friendId)) {
      userFriends.friends.push(friendId);
      await writeJsonFile(FRIENDS_FILE, friends);

      // Emit friend update
      io.emit('friends:updated', { userId, friends: userFriends.friends });
    }

    res.json(userFriends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

app.delete('/api/friends/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const friends = await readJsonFile(FRIENDS_FILE);

    const userFriends = friends.find(f => f.userId === userId);
    if (!userFriends) {
      return res.status(404).json({ error: 'User not found' });
    }

    userFriends.friends = userFriends.friends.filter(id => id !== friendId);
    await writeJsonFile(FRIENDS_FILE, friends);

    // Emit friend update
    io.emit('friends:updated', { userId, friends: userFriends.friends });

    res.json(userFriends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
