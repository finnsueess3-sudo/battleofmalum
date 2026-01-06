const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

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
  io.emit("update", players);

  socket.on("move", data => {
    if (!players[socket.id]) return;
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    io.emit("update", players);
  });

  socket.on("attack", data => {
    for (let id in players) {
      if (id === socket.id) continue;

      let dx = players[id].x - data.x;
      let dy = players[id].y - data.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (
        (data.weapon === "sword" && dist < 40) ||
        (data.weapon === "gun" && dist < 200)
      ) {
        players[id].hp -= data.weapon === "sword" ? 15 : 8;
        if (players[id].hp <= 0) {
          players[id].hp = 100;
          players[id].x = Math.random() * 700 + 50;
          players[id].y = Math.random() * 500 + 50;
        }
      }
    }
    io.emit("update", players);
    io.emit("blood", data);
  });

  socket.on("weapon", w => {
    if (players[socket.id]) players[socket.id].weapon = w;
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("update", players);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});
