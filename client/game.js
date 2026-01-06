const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const socket = io("DEINE_RENDER_URL_HIER");

let player = { x: 0, y: 0, hp: 100 };
let players = {};
let keys = {};

socket.on("init", p => player = p);
socket.on("players", data => players = data);

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function move() {
  let speed = 3;
  if (keys["w"] || keys["ArrowUp"]) player.y -= speed;
  if (keys["s"] || keys["ArrowDown"]) player.y += speed;
  if (keys["a"] || keys["ArrowLeft"]) player.x -= speed;
  if (keys["d"] || keys["ArrowRight"]) player.x += speed;

  socket.emit("move", player);
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") socket.emit("attack");
});

function draw() {
  ctx.clearRect(0,0,800,600);

  for (let id in players) {
    let p = players[id];
    ctx.fillStyle = id === socket.id ? "lime" : "red";
    ctx.fillRect(p.x, p.y, 20, 20);

    // HP Bar
    ctx.fillStyle = "green";
    ctx.fillRect(p.x, p.y - 5, p.hp / 2, 4);
  }

  // HUD
  ctx.fillStyle = "white";
  ctx.fillText("HP: " + player.hp, 10, 20);
}

function loop() {
  move();
  draw();
  requestAnimationFrame(loop);
}

loop();
