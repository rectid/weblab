import https from "https";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

const USERS_FILE = path.join(dataDir, "users.json");
const FRIENDS_FILE = path.join(dataDir, "friends.json");
const MESSAGES_FILE = path.join(dataDir, "messages.json");

const ROLE_OPTIONS = ["admin", "user"];
const STATUS_OPTIONS = ["pending", "active", "blocked"];

const readJson = async (filePath) => {
  const raw = await fsp.readFile(filePath, "utf-8");
  return JSON.parse(raw);
};

const writeJson = async (filePath, value) => {
  await fsp.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
};

const loadUsers = () => readJson(USERS_FILE);
const loadFriendPairs = () => readJson(FRIENDS_FILE);
const loadMessages = () => readJson(MESSAGES_FILE);

const persistUsers = (users) => writeJson(USERS_FILE, users);
const persistFriendPairs = (pairs) => writeJson(FRIENDS_FILE, pairs);
const persistMessages = (messages) => writeJson(MESSAGES_FILE, messages);

const buildFriendMap = (pairs) =>
  pairs.reduce((acc, pair) => {
    acc[pair.userId] = pair.friends;
    return acc;
  }, {});

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "2-digit"
  }).format(date);
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const resolveStaticRoot = () => {
  if (process.env.STATIC_ROOT) {
    return path.resolve(rootDir, process.env.STATIC_ROOT);
  }
  const candidates = [
    path.join(rootDir, "dist", "webpack"),
    path.join(rootDir, "dist", "gulp"),
    path.join(rootDir, "public")
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? path.join(rootDir, "public");
};

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const staticRoot = resolveStaticRoot();
app.use(express.static(staticRoot));

app.set("views", path.join(rootDir, "views"));
app.set("view engine", "ejs");

app.locals.roleOptions = ROLE_OPTIONS;
app.locals.statusOptions = STATUS_OPTIONS;
app.locals.formatDate = formatDate;

app.use((req, res, next) => {
  res.locals.navItems = [
    { href: "/users", label: "Участники" },
    { href: "/friends", label: "Друзья" },
    { href: "/news", label: "Новости" }
  ];
  res.locals.currentPath = req.path;
  next();
});

const findUserById = (users, userId) => users.find((user) => user.id === userId);

const sanitizeUserPayload = (payload) => {
  const safePayload = {
    fullName: String(payload.fullName ?? "").trim(),
    birthDate: payload.birthDate ?? "",
    email: String(payload.email ?? "").trim(),
    photo: String(payload.photo ?? "").trim(),
    role: payload.role ?? "user",
    status: payload.status ?? "pending"
  };

  if (!ROLE_OPTIONS.includes(safePayload.role)) {
    safePayload.role = "user";
  }
  if (!STATUS_OPTIONS.includes(safePayload.status)) {
    safePayload.status = "pending";
  }

  return safePayload;
};

app.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.redirect("/users");
  })
);

app.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await loadUsers();
    res.render("users", { users });
  })
);

app.get(
  "/friends",
  asyncHandler(async (req, res) => {
    const users = await loadUsers();
    const friendPairs = await loadFriendPairs();
    const map = buildFriendMap(friendPairs);
    const userId = req.query.userId && findUserById(users, req.query.userId)
      ? req.query.userId
      : users[0]?.id ?? null;

    const friendIds = userId ? ensureArray(map[userId]) : [];
    const friends = friendIds
      .map((friendId) => findUserById(users, friendId))
      .filter(Boolean);

    res.render("friends", {
      users,
      activeUserId: userId,
      friends
    });
  })
);

app.get(
  "/news",
  asyncHandler(async (req, res) => {
    const users = await loadUsers();
    const friendPairs = await loadFriendPairs();
    const messages = await loadMessages();
    const friendMap = buildFriendMap(friendPairs);

    const userId = req.query.userId && findUserById(users, req.query.userId)
      ? req.query.userId
      : users[0]?.id ?? null;

    const friendIds = userId ? ensureArray(friendMap[userId]) : [];
    const feed = messages
      .filter((message) => friendIds.includes(message.authorId))
      .map((message) => {
        const author = findUserById(users, message.authorId);
        return {
          ...message,
          authorName: author ? author.fullName : "Неизвестный пользователь",
          authorAvatar: author ? author.photo : "https://placehold.co/96x96"
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render("news", {
      users,
      activeUserId: userId,
      feed
    });
  })
);

app.get(
  "/api/users",
  asyncHandler(async (_req, res) => {
    const users = await loadUsers();
    res.json(users);
  })
);

app.get(
  "/api/users/:userId",
  asyncHandler(async (req, res) => {
    const users = await loadUsers();
    const user = findUserById(users, req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(user);
  })
);

app.post(
  "/api/users",
  asyncHandler(async (req, res) => {
    const users = await loadUsers();
    const payload = sanitizeUserPayload(req.body);
    const newUser = {
      id: randomUUID(),
      ...payload
    };
    users.push(newUser);
    await persistUsers(users);
    res.status(201).json(newUser);
  })
);

app.put(
  "/api/users/:userId",
  asyncHandler(async (req, res) => {
    const users = await loadUsers();
    const index = users.findIndex((user) => user.id === req.params.userId);
    if (index === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    const payload = sanitizeUserPayload(req.body);
    const updatedUser = {
      ...users[index],
      ...payload
    };
    users[index] = updatedUser;
    await persistUsers(users);
    res.json(updatedUser);
  })
);

app.delete(
  "/api/users/:userId",
  asyncHandler(async (req, res) => {
    const users = await loadUsers();
    const index = users.findIndex((user) => user.id === req.params.userId);
    if (index === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    const updatedUsers = users.filter((user) => user.id !== req.params.userId);
    const friendPairs = await loadFriendPairs();
    const filteredPairs = friendPairs
      .filter((pair) => pair.userId !== req.params.userId)
      .map((pair) => ({
        ...pair,
        friends: ensureArray(pair.friends).filter((friendId) => friendId !== req.params.userId)
      }));
    await Promise.all([persistUsers(updatedUsers), persistFriendPairs(filteredPairs)]);
    res.status(204).end();
  })
);

app.get(
  "/api/users/:userId/friends",
  asyncHandler(async (req, res) => {
    const [users, friendPairs] = await Promise.all([loadUsers(), loadFriendPairs()]);
    const map = buildFriendMap(friendPairs);
    const friendIds = ensureArray(map[req.params.userId]);
    const friends = friendIds
      .map((friendId) => findUserById(users, friendId))
      .filter(Boolean);
    res.json(friends);
  })
);

app.post(
  "/api/friends",
  asyncHandler(async (req, res) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId || userId === friendId) {
      return res.status(400).json({ error: "Некорректные идентификаторы пользователей" });
    }

    const [users, friendPairs] = await Promise.all([loadUsers(), loadFriendPairs()]);
    const source = findUserById(users, userId);
    const target = findUserById(users, friendId);
    if (!source || !target) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const addFriend = (pairs, owner, friend) => {
      const existing = pairs.find((pair) => pair.userId === owner);
      if (existing) {
        const uniqueFriends = new Set(existing.friends);
        uniqueFriends.add(friend);
        existing.friends = Array.from(uniqueFriends);
      } else {
        pairs.push({ userId: owner, friends: [friend] });
      }
    };

    addFriend(friendPairs, userId, friendId);
    addFriend(friendPairs, friendId, userId);

    await persistFriendPairs(friendPairs);
    res.status(201).json({ message: "Дружба сохранена" });
  })
);

app.delete(
  "/api/friends",
  asyncHandler(async (req, res) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ error: "Некорректные идентификаторы пользователей" });
    }

    const friendPairs = await loadFriendPairs();
    const stripFriend = (pairs, owner, friend) => {
      const record = pairs.find((pair) => pair.userId === owner);
      if (record) {
        record.friends = ensureArray(record.friends).filter((id) => id !== friend);
      }
    };

  stripFriend(friendPairs, userId, friendId);
  stripFriend(friendPairs, friendId, userId);

  const cleanedPairs = friendPairs.filter((pair) => ensureArray(pair.friends).length > 0);

  await persistFriendPairs(cleanedPairs);
    res.status(204).end();
  })
);

app.get(
  "/api/messages",
  asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const messages = await loadMessages();
    if (!userId) {
      return res.json(messages);
    }
    const pairs = await loadFriendPairs();
    const friendMap = buildFriendMap(pairs);
    const friendIds = ensureArray(friendMap[userId]);
    const feed = messages.filter((message) => friendIds.includes(message.authorId));
    res.json(feed);
  })
);

app.post(
  "/api/messages",
  asyncHandler(async (req, res) => {
    const { authorId, text } = req.body;
    if (!authorId || !text) {
      return res.status(400).json({ error: "Текст и автор обязательны" });
    }

    const users = await loadUsers();
    if (!findUserById(users, authorId)) {
      return res.status(404).json({ error: "Автор не найден" });
    }

    const messages = await loadMessages();
    const newMessage = {
      id: randomUUID(),
      authorId,
      text: String(text).trim(),
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    await persistMessages(messages);

    res.status(201).json(newMessage);
  })
);

app.delete(
  "/api/messages/:messageId",
  asyncHandler(async (req, res) => {
    const messages = await loadMessages();
    const filtered = messages.filter((message) => message.id !== req.params.messageId);
    if (filtered.length === messages.length) {
      return res.status(404).json({ error: "Сообщение не найдено" });
    }
    await persistMessages(filtered);
    res.status(204).end();
  })
);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  if (res.headersSent) {
    return;
  }
  res.status(err.status ?? 500).json({ error: err.message ?? "Непредвиденная ошибка" });
});

const certDir = path.join(rootDir, "cert");
const certPath = path.join(certDir, "server.cert");
const keyPath = path.join(certDir, "server.key");

let credentials;
try {
  credentials = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(
    "TLS-сертификат не найден. Сгенерируйте его командой: npm run generate:cert"
  );
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 3443);
const HOST = process.env.HOST ?? "0.0.0.0";

https.createServer(credentials, app).listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Админ-панель доступна по адресу https://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Статические файлы обслуживаются из: ${staticRoot}`);
});
