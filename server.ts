// server.ts
const express = require("express");
const next = require("next");
const http = require("http");
const { prisma } = require("./src/lib/prisma");
const { initSocket, getIO } = require("./src/server/socket");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  // init socket.io
  initSocket(httpServer);

  // custom API route BEFORE next.js handler
  server.post("/api/socket", express.json(), async (req: any, res: any) => {
    try {
      const body = req.body;

      const saved = await prisma.sensorReading.create({
        data: {
          co2: body.co2,
          nh3: body.nh3,
          alcohol: body.alcohol,
          co: body.co,
          benzene: body.benzene,
          smoke: body.smoke,
          temperature: body.temperature,
          humidity: body.humidity,
          pressure: body.pressure,
          pm1: body.pm1,
          pm25: body.pm25,
          pm10: body.pm10,
        },
      });

      const io = getIO();
      io.emit("newReading", {
          co2: body.co2,
          nh3: body.nh3,
          alcohol: body.alcohol,
          co: body.co,
          benzene: body.benzene,
          smoke: body.smoke,
          temperature: body.temperature,
          humidity: body.humidity,
          pressure: body.pressure,
          pm1: body.pm1,
          pm25: body.pm25,
          pm10: body.pm10,
          aqi: body.aqi,
          quality: body.quality
        });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("API error:", err);
      res.status(500).json({ error: "Failed to save reading" });
    }
  });

  // let Next handle all other routes
  server.all("/*", (req: any, res: any) => handle(req, res));

  const PORT = process.env.PORT || 3131;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  });
});
