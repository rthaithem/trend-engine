import express from "express";
import cors from "cors";
import path from "path";
import Parser from "rss-parser";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import db from "./dbSetup.ts";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = 3000;
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  }
});

app.use(cors());
app.use(express.json());

// API route to get recent news/trends from an RSS feed
app.get("/api/news", async (req, res) => {
  const query = req.query.q as string;
  const lang = req.query.lang as string; // 'ar' or 'en'
  try {
    let feedUrl = 'https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar';
    
    if (lang === 'en') {
      feedUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
      if (query) {
        feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      }
    } else {
      if (query) {
        feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=EG&ceid=EG:ar`;
      }
    }

    const feed = await parser.parseURL(feedUrl).catch(() => ({ items: [] }));
    const newsItems = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      snippet: item.contentSnippet || item.content || ""
    }));

    res.json({ success: true, articles: newsItems });
  } catch (error) {
    console.error("Error fetching external news:", error);
    res.status(500).json({ success: false, error: "Failed to fetch external news data" });
  }
});

// Room Creation
app.post("/api/rooms", (req, res) => {
  const { topic, host_name } = req.body;
  if (!topic || !host_name) {
    return res.status(400).json({ error: "Missing topic or host_name" });
  }
  const roomId = uuidv4().substring(0, 8); // Short ID for ease
  const stmt = db.prepare('INSERT INTO rooms (id, topic, host_name) VALUES (?, ?, ?)');
  stmt.run(roomId, topic, host_name);
  res.json({ roomId, topic, host_name });
});

// Room Info
app.get("/api/rooms/:id", (req, res) => {
  const roomId = req.params.id;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });
  
  const messages = db.prepare('SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC').all(roomId);
  const evidence = db.prepare('SELECT * FROM evidence WHERE room_id = ? ORDER BY created_at DESC').all(roomId);
  res.json({ room, messages, evidence });
});

// Save Report
app.post("/api/rooms/:id/report", (req, res) => {
  const roomId = req.params.id;
  const { report_content } = req.body;
  db.prepare('UPDATE rooms SET report_content = ? WHERE id = ?').run(report_content, roomId);
  
  // Broadcast to room
  io.to(roomId).emit("report_updated", { report_content });
  res.json({ success: true });
});

// WebSocket Handling
io.on("connection", (socket) => {
  let currentRoom: string | null = null;
  let userName: string | null = null;

  socket.on("join_room", ({ roomId, name }) => {
    socket.join(roomId);
    currentRoom = roomId;
    userName = name;
    
    // Broadcast join
    io.to(roomId).emit("user_joined", { name, msg: `${name} has joined the investigation.` });
  });

  socket.on("send_message", ({ roomId, sender_name, content }) => {
    const stmt = db.prepare('INSERT INTO messages (room_id, sender_name, content) VALUES (?, ?, ?)');
    const info = stmt.run(roomId, sender_name, content);
    
    const newMessage = {
      id: info.lastInsertRowid,
      room_id: roomId,
      sender_name,
      content,
      created_at: new Date().toISOString()
    };
    
    // Broadcast to room
    io.to(roomId).emit("new_message", newMessage);
  });

  socket.on("add_evidence", ({ roomId, provider_name, evidence_type, content, description }) => {
    const stmt = db.prepare('INSERT INTO evidence (room_id, provider_name, evidence_type, content, description) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(roomId, provider_name, evidence_type, content, description);
    
    const newEvidence = {
      id: info.lastInsertRowid,
      room_id: roomId,
      provider_name,
      evidence_type,
      content,
      description,
      created_at: new Date().toISOString()
    };
    
    io.to(roomId).emit("new_evidence", newEvidence);
    io.to(roomId).emit("new_message", {
      id: Math.random(), // Temporary ID for system message
      room_id: roomId,
      sender_name: 'SYSTEM',
      content: `${provider_name} added new evidence [${evidence_type}].`,
      created_at: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    if (currentRoom && userName) {
      io.to(currentRoom).emit("user_left", { name: userName, msg: `${userName} left the investigation.` });
    }
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
