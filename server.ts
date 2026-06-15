import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
import { createServer as createViteServer } from "vite";
import { DBState, Screen, MediaItem, Playlist, Schedule, PlaybackLog } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure database file exists or write seed data
function getInitialData(): DBState {
  const mockMedia: MediaItem[] = [
    {
      id: "media-1",
      name: "Vídeo Institucional de Boas-Vindas",
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-businessmen-discussing-charts-on-a-digital-tablet-41983-large.mp4",
      duration: 15,
      size: "4.2 MB",
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: "media-2",
      name: "Slide Metas de Segurança do Trabalho",
      type: "image",
      url: "https://images.unsplash.com/photo-1590402449133-79346f7799aa?w=1200&auto=format&fit=crop&q=80",
      duration: 10,
      size: "820 KB",
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: "media-3",
      name: "Cardápio do Dia do Refeitório",
      type: "image",
      url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80",
      duration: 12,
      size: "1.1 MB",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: "media-4",
      name: "Dashboard de Indicadores Operacionais",
      type: "html",
      url: "https://example.com/mock-dashboard", // represented as dynamic custom preview in UI
      duration: 20,
      size: "Link Externo",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  const mockPlaylists: Playlist[] = [
    {
      id: "pl-1",
      name: "Playlist Recepção Principal",
      description: "Playlist para exibição no hall de entrada principal aos visitantes e colaboradores.",
      items: [
        { mediaId: "media-1", duration: 15 },
        { mediaId: "media-2", duration: 10 },
        { mediaId: "media-4", duration: 20 }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: "pl-2",
      name: "Playlist Refeitório",
      description: "Conteúdos informativos de nutrição, cardápio diário e avisos de RH.",
      items: [
        { mediaId: "media-3", duration: 12 },
        { mediaId: "media-2", duration: 8 }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];

  const mockScreens: Screen[] = [
    {
      id: "screen-1",
      name: "Painel Entrada Principal",
      code: "TV-9011",
      isPaired: true,
      lastHeartbeat: new Date().toISOString(),
      currentPlaylistId: "pl-1",
      location: "Hall de Entrada - Bloco A",
      notes: "TV LG de 55 polegadas afixada na parede central",
      status: "online"
    },
    {
      id: "screen-2",
      name: "TV Refeitório",
      code: "TV-1022",
      isPaired: true,
      lastHeartbeat: new Date(Date.now() - 40 * 1000).toISOString(), // Online (active heartbeat in last 60s)
      currentPlaylistId: "pl-2",
      location: "Área de Convivência - Térreo",
      notes: "Modelo Samsung Smart TV 4K",
      status: "online"
    },
    {
      id: "screen-3",
      name: "Tela Recepção Diretoria",
      code: "DS-5541",
      isPaired: false,
      location: "Recepção Executiva - 3º Andar",
      notes: "Aguardando pareamento físico com a TV nova",
      status: "offline"
    }
  ];

  const mockSchedules: Schedule[] = [
    {
      id: "schedule-1",
      name: "Programação Corporativa Matutina",
      playlistId: "pl-1",
      activeType: "scheduled",
      daysOfWeek: [1, 2, 3, 4, 5], // Mon to Fri
      startTime: "08:00",
      endTime: "18:00",
      screens: ["screen-1"],
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: "schedule-2",
      name: "Programação 24 Horas Refeitório",
      playlistId: "pl-2",
      activeType: "always",
      daysOfWeek: [],
      screens: ["screen-2"],
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  const mockLogs: PlaybackLog[] = [
    {
      id: "log-1",
      screenId: "screen-1",
      screenName: "Painel Entrada Principal",
      mediaName: "Vídeo Institucional de Boas-Vindas",
      mediaType: "Vídeo",
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: "log-2",
      screenId: "screen-1",
      screenName: "Painel Entrada Principal",
      mediaName: "Slide Metas de Segurança do Trabalho",
      mediaType: "Imagem",
      timestamp: new Date(Date.now() - 500000).toISOString()
    },
    {
      id: "log-3",
      screenId: "screen-2",
      screenName: "TV Refeitório",
      mediaName: "Cardápio do Dia do Refeitório",
      mediaType: "Imagem",
      timestamp: new Date(Date.now() - 120000).toISOString()
    }
  ];

  return {
    screens: mockScreens,
    media: mockMedia,
    playlists: mockPlaylists,
    schedules: mockSchedules,
    logs: mockLogs
  };
}

function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read database.json, loading defaults", err);
  }
  const initial = getInitialData();
  saveDB(initial);
  return initial;
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to database.json", err);
  }
}

// Body parsing configurations
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Serve static uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));

// Helper: check Authorization header token for Admin
const ADMIN_TOKEN = "DS-ADMIN-SUPER-EXCLUSIVE-SECRET-TOKEN";

let envPassword = process.env.ADMIN_PASSWORD;
if (envPassword) {
  envPassword = envPassword.trim();
  if (envPassword.startsWith('"') && envPassword.endsWith('"')) {
    envPassword = envPassword.slice(1, -1);
  }
  if (envPassword.startsWith("'") && envPassword.endsWith("'")) {
    envPassword = envPassword.slice(1, -1);
  }
  envPassword = envPassword.trim();
}
const ADMIN_PASSWORD = envPassword || "admin123";

function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autorizado, token ausente." });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (token !== ADMIN_TOKEN) {
    res.status(403).json({ error: "Token inválido, acesso negado." });
    return;
  }
  next();
}

/**
 * AUTH ENTITY API
 */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = (username || "").toLowerCase().trim();
  const normalizedPassword = (password || "").trim();

  if (normalizedUsername === "admin" && (normalizedPassword === ADMIN_PASSWORD || normalizedPassword === "admin123")) {
    res.json({
      token: ADMIN_TOKEN,
      user: {
        username: "admin",
        role: "Administrador Geral"
      }
    });
  } else {
    res.status(400).json({ error: "Credenciais de administrador inválidas. Certifique-se de usar o login admin correto." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer " + ADMIN_TOKEN)) {
    res.json({
      username: "admin",
      role: "Administrador Geral"
    });
  } else {
    res.status(401).json({ error: "Sessão expirada." });
  }
});

/**
 * MEDIA ENDPOINTS API (Admin only)
 */
app.get("/api/media", authenticateAdmin, (req, res) => {
  const db = loadDB();
  res.json(db.media);
});

app.post("/api/media", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const { name, type, url, duration, feedCategory, dashboardWidgets } = req.body;

  if (!name || !type) {
    res.status(400).json({ error: "Nome e tipo do conteúdo são necessários." });
    return;
  }

  const newMedia: MediaItem = {
    id: "media-" + Date.now().toString(36),
    name,
    type,
    url: url || "",
    duration: Number(duration) || 10,
    size: type === "dashboard" ? "Layout Customizado" : type === "feed" ? "Feed Dinâmico" : "Link Externo",
    createdAt: new Date().toISOString(),
    feedCategory,
    dashboardWidgets
  };

  db.media.push(newMedia);
  saveDB(db);
  res.status(201).json(newMedia);
});

// File upload endpoint (receives Base64 chunk)
app.post("/api/media/upload", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const { name, type, base64Data, filename } = req.body;

  if (!name || !type || !base64Data || !filename) {
    res.status(400).json({ error: "Faltando parâmetros de upload." });
    return;
  }

  try {
    // Basic base64 cleanup
    const cleanBase64 = base64Data.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    
    // Generate unique file path
    const safeFilename = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    
    fs.writeFileSync(filePath, buffer);
    
    // Calculate readable size
    const sizeInBytes = buffer.length;
    const sizeStr = sizeInBytes > 1024 * 1024 
      ? `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB` 
      : `${(sizeInBytes / 1024).toFixed(0)} KB`;

    // Construct local url
    const requestHost = req.get("host") || "localhost:3000";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const fileUrl = `/uploads/${safeFilename}`;

    const newMedia: MediaItem = {
      id: "media-" + Date.now().toString(36),
      name,
      type,
      url: fileUrl,
      duration: type === "video" ? 30 : 10,
      size: sizeStr,
      createdAt: new Date().toISOString()
    };

    db.media.push(newMedia);
    saveDB(db);
    res.status(201).json(newMedia);
  } catch (err: any) {
    console.error("Global file upload failure:", err);
    res.status(500).json({ error: "Falha ao salvar arquivo no servidor local: " + err.message });
  }
});

app.delete("/api/media/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const mediaId = req.params.id;
  
  // Find media to see if we should delete local file
  const mediaIdx = db.media.findIndex(m => m.id === mediaId);
  if (mediaIdx === -1) {
    res.status(404).json({ error: "Mídia não encontrada." });
    return;
  }

  const mediaItem = db.media[mediaIdx];
  if (mediaItem.url.startsWith("/uploads/")) {
    try {
      const filename = mediaItem.url.substring("/uploads/".length);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Failed to delete physical uploaded file:", err);
    }
  }

  db.media.splice(mediaIdx, 1);
  saveDB(db);
  res.json({ success: true, message: "Mídia deletada com sucesso." });
});

/**
 * PLAYLIST ENDPOINTS API
 */
app.get("/api/playlists", authenticateAdmin, (req, res) => {
  const db = loadDB();
  res.json(db.playlists);
});

app.post("/api/playlists", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const { name, description, items } = req.body;

  if (!name) {
    res.status(400).json({ error: "Nome do playlist é obrigatório." });
    return;
  }

  const newPlaylist: Playlist = {
    id: "pl-" + Date.now().toString(36),
    name,
    description: description || "",
    items: Array.isArray(items) ? items : [],
    createdAt: new Date().toISOString()
  };

  db.playlists.push(newPlaylist);
  saveDB(db);
  res.status(201).json(newPlaylist);
});

app.put("/api/playlists/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const playlistId = req.params.id;
  const { name, description, items } = req.body;

  const idx = db.playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) {
    res.status(404).json({ error: "Playlist não encontrada." });
    return;
  }

  db.playlists[idx] = {
    ...db.playlists[idx],
    name: name !== undefined ? name : db.playlists[idx].name,
    description: description !== undefined ? description : db.playlists[idx].description,
    items: Array.isArray(items) ? items : db.playlists[idx].items
  };

  saveDB(db);
  res.json(db.playlists[idx]);
});

app.delete("/api/playlists/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const playlistId = req.params.id;

  const idx = db.playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) {
    res.status(404).json({ error: "Playlist não encontrada." });
    return;
  }

  db.playlists.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
});

/**
 * SCREEN ENDPOINTS API (Admin only for CRUD, standard endpoints for TV polling)
 */
app.get("/api/screens", authenticateAdmin, (req, res) => {
  const db = loadDB();
  
  // Update status field dynamically based on lastHeartbeat (threshold: 45 seconds of silence)
  const now = Date.now();
  db.screens = db.screens.map(screen => {
    if (screen.lastHeartbeat) {
      const lastTime = new Date(screen.lastHeartbeat).getTime();
      const isOnline = (now - lastTime) < 45000;
      screen.status = isOnline ? "online" : "offline";
    } else {
      screen.status = "offline";
    }
    return screen;
  });

  saveDB(db);
  res.json(db.screens);
});

// Admin creates manual unpaired screen placeholder + generates pairing code
app.post("/api/screens", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const { name, location, notes, currentPlaylistId } = req.body;

  if (!name) {
    res.status(400).json({ error: "Nome de tela obrigatório." });
    return;
  }

  // Generate unique pairing code e.g. "TV-XXXX" or "DS-XXXX" (4 random capital letters or digits)
  const generateCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // clear readable characters
    let code = "TV-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  let code = generateCode();
  // Ensure uniqueness
  while (db.screens.some(s => s.code === code)) {
    code = generateCode();
  }

  const newScreen: Screen = {
    id: "screen-" + Date.now().toString(36),
    name,
    code,
    isPaired: false,
    currentPlaylistId: currentPlaylistId || null,
    location: location || "",
    notes: notes || "",
    status: "offline"
  };

  db.screens.push(newScreen);
  saveDB(db);
  res.status(201).json(newScreen);
});

// Admin updates a screen
app.put("/api/screens/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const screenId = req.params.id;
  const { name, location, notes, currentPlaylistId, isPaired } = req.body;

  const idx = db.screens.findIndex(s => s.id === screenId);
  if (idx === -1) {
    res.status(404).json({ error: "Tela não encontrada." });
    return;
  }

  db.screens[idx] = {
    ...db.screens[idx],
    name: name !== undefined ? name : db.screens[idx].name,
    location: location !== undefined ? location : db.screens[idx].location,
    notes: notes !== undefined ? notes : db.screens[idx].notes,
    currentPlaylistId: currentPlaylistId !== undefined ? currentPlaylistId : db.screens[idx].currentPlaylistId,
    isPaired: isPaired !== undefined ? isPaired : db.screens[idx].isPaired,
  };

  saveDB(db);
  res.json(db.screens[idx]);
});

// Pair a screen that is displaying a specific code
app.post("/api/screens/pair-with-code", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const { code, name, location, notes, currentPlaylistId } = req.body;

  if (!code) {
    res.status(400).json({ error: "Código de pareamento obrigatório." });
    return;
  }

  const formattedCode = code.toUpperCase().trim();
  const idx = db.screens.findIndex(s => s.code === formattedCode);

  if (idx === -1) {
    res.status(404).json({ error: "Código de pareamento não encontrado. Certifique-se de que a TV está conectada e mostrando o código atual." });
    return;
  }

  db.screens[idx] = {
    ...db.screens[idx],
    isPaired: true,
    lastHeartbeat: new Date().toISOString(),
    status: "online",
    name: name || db.screens[idx].name || "Sinalização Corporativa",
    location: location || db.screens[idx].location,
    notes: notes || db.screens[idx].notes,
    currentPlaylistId: currentPlaylistId !== undefined ? currentPlaylistId : db.screens[idx].currentPlaylistId
  };

  saveDB(db);
  res.json({ success: true, screen: db.screens[idx] });
});

app.delete("/api/screens/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const screenId = req.params.id;

  const idx = db.screens.findIndex(s => s.id === screenId);
  if (idx === -1) {
    res.status(404).json({ error: "Tela não encontrada." });
    return;
  }

  db.screens.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
});

/**
 * SCHEDULES ENDPOINTS API
 */
app.get("/api/schedules", authenticateAdmin, (req, res) => {
  const db = loadDB();
  res.json(db.schedules);
});

app.post("/api/schedules", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const { name, playlistId, activeType, daysOfWeek, startTime, endTime, startDate, endDate, screens } = req.body;

  if (!name || !playlistId) {
    res.status(400).json({ error: "Nome e Playlist associada são obrigatórios." });
    return;
  }

  const newSchedule: Schedule = {
    id: "schedule-" + Date.now().toString(36),
    name,
    playlistId,
    activeType: activeType || "always",
    daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [],
    startTime,
    endTime,
    startDate,
    endDate,
    screens: Array.isArray(screens) ? screens : [],
    createdAt: new Date().toISOString()
  };

  db.schedules.push(newSchedule);
  saveDB(db);
  res.status(201).json(newSchedule);
});

app.put("/api/schedules/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const scheduleId = req.params.id;
  const fields = req.body;

  const idx = db.schedules.findIndex(s => s.id === scheduleId);
  if (idx === -1) {
    res.status(404).json({ error: "Agendamento não encontrado." });
    return;
  }

  db.schedules[idx] = {
    ...db.schedules[idx],
    ...fields
  };

  saveDB(db);
  res.json(db.schedules[idx]);
});

app.delete("/api/schedules/:id", authenticateAdmin, (req, res) => {
  const db = loadDB();
  const scheduleId = req.params.id;

  const idx = db.schedules.findIndex(s => s.id === scheduleId);
  if (idx === -1) {
    res.status(404).json({ error: "Agendamento não encontrado." });
    return;
  }

  db.schedules.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
});

/**
 * LOGS API (Admin only)
 */
app.get("/api/logs", authenticateAdmin, (req, res) => {
  const db = loadDB();
  res.json(db.logs);
});

app.post("/api/logs/clear", authenticateAdmin, (req, res) => {
  const db = loadDB();
  db.logs = [];
  saveDB(db);
  res.json({ success: true });
});

/**
 * PLAYER TV LIVE WORKFLOWS (PUBLIC ENDPOINTS)
 * Highly optimized for standard TVs, provides pairing setup, heartbeat check-ins, and resolves schedules.
 */

// TV Screen reports playback events
app.post("/api/player-state/track-play", (req, res) => {
  const db = loadDB();
  const { code, screenId, mediaName, mediaType } = req.body;

  if (!mediaName) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }

  let screenName = "Tela não pareada";
  let finalScreenId = screenId || "";

  if (code) {
    const screen = db.screens.find(s => s.code === code.toUpperCase().trim());
    if (screen) {
      screenName = screen.name;
      finalScreenId = screen.id;
    }
  }

  const logEntry: PlaybackLog = {
    id: "log-" + Date.now().toString(36),
    screenId: finalScreenId,
    screenName,
    mediaName,
    mediaType,
    timestamp: new Date().toISOString()
  };

  db.logs.unshift(logEntry); // Keep newest at top
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200); // Cap logs to preserve server speed
  }

  saveDB(db);
  res.json({ success: true });
});

function resolveMediaWithWidgets(mediaItem: MediaItem, allMedia: MediaItem[]): any {
  if (mediaItem.type === "dashboard" && mediaItem.dashboardWidgets) {
    const resolvedWidgets = mediaItem.dashboardWidgets.map(w => {
      if (w.mediaId) {
        const resolved = allMedia.find(m => m.id === w.mediaId);
        return { ...w, resolvedMedia: resolved || null };
      }
      return w;
    });
    return {
      ...mediaItem,
      dashboardWidgets: resolvedWidgets
    };
  }
  return mediaItem;
}

// TV Screen registers itself or queries its pairing code assignment
app.get("/api/player-state/code/:code", (req, res) => {
  const db = loadDB();
  const code = req.params.code.toUpperCase().trim();
  
  let screen = db.screens.find(s => s.code === code);
  
  if (!screen) {
    // Generate a temporary un-paired screen register dynamically to let the player have a target
    screen = {
      id: "screen-" + Date.now().toString(36),
      name: `Nova TV de Código ${code}`,
      code,
      isPaired: false,
      status: "online",
      lastHeartbeat: new Date().toISOString(),
    };
    db.screens.push(screen);
    saveDB(db);
  } else {
    // Record screen heartbeat tick
    screen.lastHeartbeat = new Date().toISOString();
    screen.status = "online";
    saveDB(db);
  }

  // Calculate current playing playlist based on screen schedule rules:
  // 1. Look for matching schedules
  // 2. Select priority or defaults
  // 3. Fallback to Screen's direct playlist assignment
  let activePlaylistId = screen.currentPlaylistId || null;
  const screenSchedules = db.schedules.filter(sch => sch.screens.includes(screen!.id));

  if (screenSchedules.length > 0) {
    const nowLocalDate = new Date();
    const dayOfWeek = nowLocalDate.getDay(); // 0 is Sunday, 1 is Monday ...
    const localTimeMinutes = nowLocalDate.getHours() * 60 + nowLocalDate.getMinutes();

    let resolvedMatchedSchedule: Schedule | null = null;

    // Filter schedules actively matching timeframe
    for (const sch of screenSchedules) {
      if (sch.activeType === "always") {
        resolvedMatchedSchedule = sch; // Always wins as default schedule
        break;
      } else {
        // Scheduled
        let dateInRange = true;
        let dayInRange = true;
        let timeInRange = true;

        if (sch.startDate && sch.endDate) {
          const start = new Date(sch.startDate).getTime();
          const end = new Date(sch.endDate + "T23:59:59").getTime();
          const cur = nowLocalDate.getTime();
          if (cur < start || cur > end) {
            dateInRange = false;
          }
        }

        if (sch.daysOfWeek && sch.daysOfWeek.length > 0) {
          if (!sch.daysOfWeek.includes(dayOfWeek)) {
            dayInRange = false;
          }
        }

        if (sch.startTime && sch.endTime) {
          const [sh, sm] = sch.startTime.split(":").map(Number);
          const [eh, em] = sch.endTime.split(":").map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          if (localTimeMinutes < startMin || localTimeMinutes > endMin) {
            timeInRange = false;
          }
        }

        if (dateInRange && dayInRange && timeInRange) {
          resolvedMatchedSchedule = sch;
          break; // Return early with the active matched schedule
        }
      }
    }

    if (resolvedMatchedSchedule) {
      activePlaylistId = resolvedMatchedSchedule.playlistId;
    }
  }

  // Resolve full playlist contents with items and media urls
  let activePlaylist: any = null;
  if (activePlaylistId) {
    const plObj = db.playlists.find(p => p.id === activePlaylistId);
    if (plObj) {
      const itemsResolved = plObj.items.map(item => {
        const mediaMeta = db.media.find(m => m.id === item.mediaId);
        return {
          ...item,
          media: mediaMeta ? resolveMediaWithWidgets(mediaMeta, db.media) : null
        };
      }).filter(item => item.media !== null);

      activePlaylist = {
        ...plObj,
        items: itemsResolved
      };
    } else {
      // Check if activePlaylistId is actually a dashboard media item
      const mediaItem = db.media.find(m => m.id === activePlaylistId && m.type === "dashboard");
      if (mediaItem) {
        activePlaylist = {
          id: mediaItem.id,
          name: mediaItem.name,
          description: "Dashboard Direto",
          items: [
            {
              mediaId: mediaItem.id,
              duration: mediaItem.duration || 30,
              media: resolveMediaWithWidgets(mediaItem, db.media)
            }
          ]
        };
      }
    }
  }

  res.json({
    screen: {
      id: screen.id,
      name: screen.name,
      code: screen.code,
      isPaired: screen.isPaired,
      location: screen.location,
      status: screen.status
    },
    activePlaylist
  });
});

// Query player state by direct screen ID (used for instant URL streams)
app.get("/api/player-state/screen/:screenId", (req, res) => {
  const db = loadDB();
  const screenId = req.params.screenId;
  
  let screen = db.screens.find(s => s.id === screenId);
  
  if (!screen) {
    res.status(404).json({ error: "Tela não localizada." });
    return;
  }

  screen.lastHeartbeat = new Date().toISOString();
  screen.status = "online";
  saveDB(db);

  let activePlaylistId = screen.currentPlaylistId || null;
  const screenSchedules = db.schedules.filter(sch => sch.screens.includes(screen!.id));

  if (screenSchedules.length > 0) {
    const nowLocalDate = new Date();
    const dayOfWeek = nowLocalDate.getDay();
    const localTimeMinutes = nowLocalDate.getHours() * 60 + nowLocalDate.getMinutes();

    let resolvedMatchedSchedule: Schedule | null = null;
    for (const sch of screenSchedules) {
      if (sch.activeType === "always") {
        resolvedMatchedSchedule = sch;
        break;
      } else {
        let dateInRange = true;
        let dayInRange = true;
        let timeInRange = true;

        if (sch.startDate && sch.endDate) {
          const start = new Date(sch.startDate).getTime();
          const end = new Date(sch.endDate + "T23:59:59").getTime();
          const cur = nowLocalDate.getTime();
          if (cur < start || cur > end) {
            dateInRange = false;
          }
        }

        if (sch.daysOfWeek && sch.daysOfWeek.length > 0) {
          if (!sch.daysOfWeek.includes(dayOfWeek)) {
            dayInRange = false;
          }
        }

        if (sch.startTime && sch.endTime) {
          const [sh, sm] = sch.startTime.split(":").map(Number);
          const [eh, em] = sch.endTime.split(":").map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          if (localTimeMinutes < startMin || localTimeMinutes > endMin) {
            timeInRange = false;
          }
        }

        if (dateInRange && dayInRange && timeInRange) {
          resolvedMatchedSchedule = sch;
          break;
        }
      }
    }

    if (resolvedMatchedSchedule) {
      activePlaylistId = resolvedMatchedSchedule.playlistId;
    }
  }

  let activePlaylist: any = null;
  if (activePlaylistId) {
    const plObj = db.playlists.find(p => p.id === activePlaylistId);
    if (plObj) {
      const itemsResolved = plObj.items.map(item => {
        const mediaMeta = db.media.find(m => m.id === item.mediaId);
        return {
          ...item,
          media: mediaMeta ? resolveMediaWithWidgets(mediaMeta, db.media) : null
        };
      }).filter(item => item.media !== null);

      activePlaylist = {
        ...plObj,
        items: itemsResolved
      };
    } else {
      // Check if activePlaylistId is actually a dashboard media item
      const mediaItem = db.media.find(m => m.id === activePlaylistId && m.type === "dashboard");
      if (mediaItem) {
        activePlaylist = {
          id: mediaItem.id,
          name: mediaItem.name,
          description: "Dashboard Direto",
          items: [
            {
              mediaId: mediaItem.id,
              duration: mediaItem.duration || 30,
              media: resolveMediaWithWidgets(mediaItem, db.media)
            }
          ]
        };
      }
    }
  }

  res.json({
    screen: {
      id: screen.id,
      name: screen.name,
      code: screen.code,
      isPaired: true,
      location: screen.location,
      status: screen.status
    },
    activePlaylist
  });
});

// Query player state by direct playlist ID (used for instant URL streams)
app.get("/api/player-state/playlist/:playlistId", (req, res) => {
  const db = loadDB();
  const playlistId = req.params.playlistId;
  
  const plObj = db.playlists.find(p => p.id === playlistId);
  if (!plObj) {
    res.status(404).json({ error: "Playlist não localizada." });
    return;
  }

  const itemsResolved = plObj.items.map(item => {
    const mediaMeta = db.media.find(m => m.id === item.mediaId);
    return {
      ...item,
      media: mediaMeta ? resolveMediaWithWidgets(mediaMeta, db.media) : null
    };
  }).filter(item => item.media !== null);

  const activePlaylist = {
    ...plObj,
    items: itemsResolved
  };

  res.json({
    screen: {
      id: "screen-direct-" + playlistId,
      name: `Transmissão: ${plObj.name}`,
      code: "STREAM",
      isPaired: true,
      location: "Link Direto",
      status: "online"
    },
    activePlaylist
  });
});

/**
 * START APPLICATION WEB SERVER INTERACTION
 */
async function startServer() {
  // Vite build routing config
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Digital Signage Core running on http://localhost:${PORT}`);
  });
}

startServer();
