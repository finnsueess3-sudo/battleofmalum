const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

let players = {};

io.on("connection", socket => {
  players[socket.id] = {
    x: 400,
    y: 300,
    hp: 100,
    weapon: "sword"
  };

  socket.emit("init", players[socket.id]);
  io.emit("players", players);

  socket.on("move", data => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit("players", players);
    }
  });

  socket.on("attack", () => {
    io.emit("attack", socket.id);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players", players);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});
