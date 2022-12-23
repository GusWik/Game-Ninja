import pop from "../pop/index.js";
const { CanvasRenderer, Container, KeyControls, Text, Texture, Sprite } = pop;

// Game setup code
const w = 640;
const h = 300;
const renderer = new CanvasRenderer(w, h);
document.querySelector("#board").appendChild(renderer.view);

// Load game textures
const textures = {
  background: new Texture("res/images/bg.png"),
  spaceship: new Texture("res/images/spaceship.png"),
  bullet: new Texture("res/images/bullet.png"),
  baddie: new Texture("res/images/baddie.png")
};

// Game objects
const scene = new Container();
const controls = new KeyControls();

// Make a spaceship
const ship = new Sprite(textures.spaceship);
ship.pos.x = 120;
ship.pos.y = h / 2 - 16;
ship.update = function(dt) {
  const { pos } = this;
  pos.x += controls.x * dt * 200;
  pos.y += controls.y * dt * 200;

  // Confine player to the screen
  if (pos.x < 0) pos.x = 0;
  if (pos.x > w) pos.x = w;
  if (pos.y < 0) pos.y = 0;
  if (pos.y > h) pos.y = h;
};

// Bullets
const bullets = new Container();
function bulletMove(dt) {
  this.pos.x += 400 * dt;
}
function fireBullet(x, y) {
  const bullet = new Sprite(textures.bullet);
  bullet.pos.x = x;
  bullet.pos.y = y;
  bullet.update = bulletMove;
  bullets.add(bullet);
}

// Bad guys
const baddies = new Container();
function spawnBaddie(x, y, speed) {
  const baddie = new Sprite(textures.baddie);
  baddie.pos.x = x;
  baddie.pos.y = y;
  baddie.update = function(dt) {
    this.pos.x += speed * dt;
  };
  baddies.add(baddie);
}

function doGameOver() {
  const gameOverMessage = new Text("Game Over", {
    font: "30pt sans-serif",
    fill: "#8B8994",
    align: "center"
  });
  gameOverMessage.pos = { x: w / 2, y: 120 };
  scene.add(gameOverMessage);
  scene.remove(ship);
  gameOver = true;
}

// Add the score game object
const score = new Text("score:", {
  font: "20px sans-serif",
  fill: "#8B8994",
  align: "center"
});
score.pos = { x: w / 2, y: h - 30 };

// Add everything to the scene container
scene.add(new Sprite(textures.background));
scene.add(ship);
scene.add(bullets);
scene.add(baddies);
scene.add(score);

// Game state variables
let lastShot = 0;
let lastSpawn = 0;
let spawnSpeed = 1.0;
let scoreAmount = 0;
let gameOver = false;

// Main loop
let dt = 0;
let last = 0;

function loopy(ms) {
  requestAnimationFrame(loopy);

  const t = ms / 1000;
  dt = t - last;
  last = t;

  // Game logic code
  ship.pos.x += Math.sin(t * 10); // "bob" the player
  score.text = "score: " + scoreAmount; // update score

  // Check if player can fire yet
  if (!gameOver && controls.action && t - lastShot > 0.15) {
    lastShot = t;
    fireBullet(ship.pos.x + 24, ship.pos.y + 10);
  }

  // Check for collisions, or out of screen
  baddies.children.forEach(baddie => {
    bullets.children.forEach(bullet => {

      // Check distance between baddie and bullet
      const dx = baddie.pos.x + 16 - (bullet.pos.x + 8);
      const dy = baddie.pos.y + 16 - (bullet.pos.y + 8);
      if (Math.sqrt(dx * dx + dy * dy) < 24) {
        // A hit!
        bullet.dead = true;
        baddie.dead = true;
        scoreAmount += Math.floor(t);
      }
      // Bullet out of the screen?
      if (bullet.pos.x >= w + 20) {
        bullet.dead = true;
      }
    });

    // Check if baddie reached the city
    if (baddie.pos.x < -32) {
      if (!gameOver) {
        doGameOver();
      }
      baddie.dead = true;
    }
  });

  // Spawn a baddie
  if (t - lastSpawn > spawnSpeed) {
    lastSpawn = t;
    const speed = -50 - Math.random() * Math.random() * 100;
    const position = Math.random() * (h - 24);
    spawnBaddie(w, position, speed);

    // Accelerating for the next spawn
    spawnSpeed = spawnSpeed < 0.05 ? 0.6 : spawnSpeed * 0.97 + 0.001;
  }

  // Update & render everything
  scene.update(dt, t);
  renderer.render(scene);
}
requestAnimationFrame(loopy);
