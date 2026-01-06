const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(http);

app.use(express.static("public"));

let players = {};

io.on("connection", socket => {
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 700 + 50,
    y: Math.random() * 500 + 50,
    hp: 100,
    weapon: "sword"
  };

  socket.emit("init", players[socket.id]);
  io.emit("state", players);

  socket.on("move", p => {
    if (!players[socket.id]) return;
    players[socket.id].x = p.x;
    players[socket.id].y = p.y;
    io.emit("state", players);
  });

  socket.on("attack", data => {
    for (let id in players) {
      if (id === socket.id) continue;

      let dx = players[id].x - data.x;
      let dy = players[id].y - data.y;
      let dist = Math.hypot(dx, dy);

      let range = data.weapon === "gun" ? 200 : 40;
      let dmg = data.weapon === "gun" ? 8 : 15;

      if (dist < range) {
        players[id].hp -= dmg;
        if (players[id].hp <= 0) {
          players[id].hp = 100;
          players[id].x = Math.random() * 700 + 50;
          players[id].y = Math.random() * 500 + 50;
        }
        io.emit("blood", players[id]);
      }
    }
    io.emit("state", players);
  });

  socket.on("weapon", w => {
    if (players[socket.id]) players[socket.id].weapon = w;
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("state", players);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server läuft auf", PORT));
