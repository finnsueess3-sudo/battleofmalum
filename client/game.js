const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const socket = io();

let me = {};
let players = {};
let bullets = [];
let walls = [];
let keys = {};
let blood = [];

socket.on("init", p => me = p);
socket.on("state", s => {
  players = s.players;
  bullets = s.bullets;
  walls = s.walls;
});
socket.on("blood", b => blood.push({ ...b, life: 20 }));

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("click", e => {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;
  let angle = Math.atan2(my - me.y, mx - me.x);
  socket.emit("shoot", { x: me.x + 10, y: me.y + 10, angle });
});

function move() {
  let s = 3;
  let nx = me.x;
  let ny = me.y;

  if (keys.w || keys.ArrowUp) ny -= s;
  if (keys.s || keys.ArrowDown) ny += s;
  if (keys.a || keys.ArrowLeft) nx -= s;
  if (keys.d || keys.ArrowRight) nx += s;

  socket.emit("move", { x: nx, y: ny });
}

function draw() {
  ctx.clearRect(0,0,800,600);

  // Wände
  ctx.fillStyle = "#555";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // Spieler
  for (let id in players) {
    let p = players[id];
    ctx.fillStyle = id === socket.id ? "lime" : "red";
    ctx.fillRect(p.x, p.y, 20, 20);

    ctx.fillStyle = "green";
    ctx.fillRect(p.x, p.y - 6, p.hp / 2, 4);
  }

  // Kugeln
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 4));

  // Blut
  blood.forEach(b => {
    ctx.fillStyle = "rgba(180,0,0,0.6)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();
    b.life--;
  });
  blood = blood.filter(b => b.life > 0);

  // MiniMap
  ctx.strokeStyle = "white";
  ctx.strokeRect(650, 20, 130, 130);
  walls.forEach(w =>
    ctx.fillRect(650 + w.x/6, 20 + w.y/6, w.w/6, w.h/6)
  );
}

function loop() {
  move();
  draw();
  requestAnimationFrame(loop);
}

loop();
