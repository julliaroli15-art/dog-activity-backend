const express = require("express");
const app = express();

app.use(express.json());

// -------- CONFIGURACIÓN --------
const API_USER = "xiao";
const API_PASSWORD = "1234";

// -------- ALMACENAMIENTO SIMPLE --------
let lastActivity = {
  reposo: 0,
  caminar: 0,
  correr: 0,
  sprint: 0
};

let weeklyHistory = []; // [{ date, activityIndex }]

// -------- RUTA RAÍZ (TEST) --------
app.get("/", (req, res) => {
  res.send("FeedFit backend activo 🚀");
});

// -------- AUTENTICACIÓN --------
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const base64 = authHeader.split(" ")[1];
  const [user, pass] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  if (user === API_USER && pass === API_PASSWORD) {
    next();
  } else {
    res.sendStatus(403);
  }
}

// -------- XIAO ENVÍA DATOS --------
app.post("/api/activity", auth, (req, res) => {
  lastActivity = req.body;
  console.log("Datos recibidos:", lastActivity);
  res.sendStatus(200);
});

// -------- APP LEE DATOS --------
app.get("/api/activity/today", (req, res) => {
  res.json(lastActivity);
});

// -------- HISTÓRICO SEMANAL --------
app.post("/api/activity/history", (req, res) => {
  weeklyHistory.push(req.body);
  if (weeklyHistory.length > 7) weeklyHistory.shift();
  res.sendStatus(200);
});

app.get("/api/activity/week", (req, res) => {
  res.json(weeklyHistory);
});

// -------- SERVER --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto", PORT);
});
