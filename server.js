const express = require("express");
const app = express();

app.use(express.json());

// -------- CORS --------
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// -------- CONFIGURACIÓN --------
const API_USER = "xiao";
const API_PASSWORD = "1234";

// -------- ALMACENAMIENTO --------
let lastActivity = {
  reposo: 0,
  caminar: 0,
  correr: 0,
  sprint: 0
};

let dogProfile = {
  size: "mini",
  ageMonths: 12,
  weight: 10,
  neutered: false,
  kcalPerGram: 3.8
};

// -------- RUTA TEST --------
app.get("/", (req, res) => {
  res.send("FeedFit backend activo 🚀");
});

// -------- AUTH --------
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

// -------- ACTUALIZAR PERFIL PERRO --------
app.post("/api/dog", (req, res) => {
  dogProfile = req.body;
  res.sendStatus(200);
});

// -------- XIAO ENVÍA ACTIVIDAD --------
app.post("/api/activity", auth, (req, res) => {
  lastActivity = req.body;
  console.log("Actividad recibida:", lastActivity);
  res.sendStatus(200);
});

// -------- CÁLCULO ENERGÉTICO CORRECTO --------
function calculateEnergy() {

  const { size, ageMonths, weight, neutered, kcalPerGram } = dogProfile;
  const { reposo, caminar, correr, sprint } = lastActivity;

  // 1️⃣ RER (metabolismo basal)
  const RER = 70 * Math.pow(weight, 0.75);

  // 2️⃣ Factor edad
  let ageFactor = 1;

  if (ageMonths <= 4) {
    ageFactor = 3;
  } else if (
    (size === "mini" && ageMonths <= 12) ||
    (size === "standard" && ageMonths <= 14) ||
    (size === "giant" && ageMonths <= 18)
  ) {
    ageFactor = 2;
  } else {
    if (
      (size === "mini" && ageMonths >= 132) ||
      (size === "standard" && ageMonths >= 108) ||
      (size === "giant" && ageMonths >= 84)
    ) {
      ageFactor = 1.3;
    } else {
      ageFactor = 1.6;
    }
  }

  // 3️⃣ Ajuste por castración
  if (neutered && ageFactor <= 1.6) {
    ageFactor *= 0.85;
  }

  // 4️⃣ Energía base diaria (SIEMPRE existe)
  let totalKcal = RER * ageFactor;

  // 5️⃣ Ajuste por actividad si hay datos
  const totalMinutes = reposo + caminar + correr + sprint;

  if (totalMinutes > 0) {
    const weightedActivity =
      reposo * 1 +
      caminar * 1.5 +
      correr * 2.5 +
      sprint * 4;

    const activityMultiplier = weightedActivity / totalMinutes;

    totalKcal *= activityMultiplier;
  }

  // 6️⃣ Protección contra valores inválidos
  const safeKcalPerGram = (kcalPerGram && kcalPerGram > 0) ? kcalPerGram : 3.8;

  const grams = totalKcal / safeKcalPerGram;

  return {
    RER: Math.round(RER),
    totalKcal: Math.round(totalKcal),
    grams: Math.round(grams)
  };
}

// -------- APP LEE RESULTADOS --------
app.get("/api/recommendation", (req, res) => {
  const result = calculateEnergy();
  res.json(result);
});

// -------- SERVER --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto", PORT);
});





