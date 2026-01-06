const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(http);
app.use(express.static("public"));

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

// 🧱 WÄNDE (x,y,w,h)
const walls = [
  { x: 200, y: 100, w: 50, h: 300 },
  { x: 400, y: 0,   w: 50, h: 250 },
  { x: 600, y: 200, w: 50, h: 300 },
  { x: 100, y: 450, w: 600, h: 30 }
];

let players = {};
let bullets = [];

function collides(x, y, size = 20) {
  return walls.some(w =>
    x < w.x + w.w &&
    x + size > w.x &&
    y < w.y + w.h &&
    y + size > w.y
  );
}

io.on("connection", socket => {
  players[socket.id] = {
    id: socket.id,
    x: 50,
    y: 50,
    hp: 100,
    weapon: "sword"
  };

  socket.emit("init", players[socket.id]);
  io.emit("state", { players, bullets, walls });

  socket.on("move", p => {
    if (!players[socket.id]) return;
    if (!collides(p.x, p.y)) {
      players[socket.id].x = Math.max(0, Math.min(MAP_WIDTH - 20, p.x));
      players[socket.id].y = Math.max(0, Math.min(MAP_HEIGHT - 20, p.y));
    }
    io.emit("state", { players, bullets, walls });
  });

  socket.on("shoot", data => {
    bullets.push({
      x: data.x,
      y: data.y,
      vx: Math.cos(data.angle) * 8,
      vy: Math.sin(data.angle) * 8,
      owner: socket.id,
      life: 60
    });
  });

  socket.on("weapon", w => {
    if (players[socket.id]) players[socket.id].weapon = w;
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

// 🔫 Kugel-Update
setInterval(() => {
  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    // Wand getroffen
    if (collides(b.x, b.y, 5)) b.life = 0;

    // Spieler getroffen
    for (let id in players) {
      if (id === b.owner) continue;
      let p = players[id];
      if (
        b.x > p.x && b.x < p.x + 20 &&
        b.y > p.y && b.y < p.y + 20
      ) {
        p.hp -= 15;
        b.life = 0;
        io.emit("blood", { x: b.x, y: b.y });

        if (p.hp <= 0) {
          p.hp = 100;
          p.x = 50;
          p.y = 50;
        }
      }
    }
  });

  bullets = bullets.filter(b => b.life > 0);
  io.emit("state", { players, bullets, walls });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server läuft auf", PORT));
