const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const socket = io();

let me = {};
let players = {};
let keys = {};
let blood = [];

socket.on("init", p => me = p);
socket.on("state", p => players = p);
socket.on("blood", b => blood.push({x:b.x,y:b.y,life:20}));

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.addEventListener("keydown", e => {
  if (e.code === "Digit1") socket.emit("weapon", "sword");
  if (e.code === "Digit2") socket.emit("weapon", "gun");
  if (e.code === "Space") {
    socket.emit("attack", {
      x: me.x,
      y: me.y,
      weapon: me.weapon
    });
  }
});

function move() {
  let s = 3;
  if (keys.w || keys.ArrowUp) me.y -= s;
  if (keys.s || keys.ArrowDown) me.y += s;
  if (keys.a || keys.ArrowLeft) me.x -= s;
  if (keys.d || keys.ArrowRight) me.x += s;
  socket.emit("move", me);
}

function drawPlayers() {
  for (let id in players) {
    let p = players[id];
    ctx.fillStyle = id === socket.id ? "lime" : "red";
    ctx.fillRect(p.x, p.y, 20, 20);

    ctx.fillStyle = "green";
    ctx.fillRect(p.x, p.y - 6, p.hp / 2, 4);
  }
}

function drawBlood() {
  blood.forEach(b => {
    ctx.fillStyle = "rgba(180,0,0,0.6)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI*2);
    ctx.fill();
    b.life--;
  });
  blood = blood.filter(b => b.life > 0);
}

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.fillText("HP: " + me.hp, 10, 20);
  ctx.fillText("Waffe: " + me.weapon, 10, 40);
}

function drawMinimap() {
  ctx.strokeStyle = "white";
  ctx.strokeRect(650, 20, 130, 130);
  for (let id in players) {
    let p = players[id];
    ctx.fillStyle = id === socket.id ? "lime" : "red";
    ctx.fillRect(650 + p.x/6, 20 + p.y/6, 4, 4);
  }
}

function loop() {
  ctx.clearRect(0,0,800,600);
  move();
  drawPlayers();
  drawBlood();
  drawHUD();
  drawMinimap();
  requestAnimationFrame(loop);
}

loop();
