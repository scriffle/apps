<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Invaders</title>
    <style>
        canvas {
            border: 1px solid black;
            display: block;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Game variables
        let player = { x: 400, y: 550, width: 50, height: 30 };
        let bullets = [];
        let aliens = [];
        let shelters = [];
        let score = 0;
        let lives = 3;
        let wave = 1;

        // Create aliens
        function createAliens() {
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 10; j++) {
                    aliens.push({ x: j * 60 + 50, y: i * 50 + 50, width: 40, height: 30 });
                }
            }
        }

        // Create shelters
        function createShelters() {
            for (let i = 0; i < 4; i++) {
                shelters.push({ x: i * 200 + 100, y: 500, width: 100, height: 30 });
            }
        }

        // Initialize game
        function init() {
            createAliens();
            createShelters();
        }

        // Move player
        function movePlayer(direction) {
            if (direction === 'left' && player.x > 0) {
                player.x -= 5;
            } else if (direction === 'right' && player.x < canvas.width - player.width) {
                player.x += 5;
            }
        }

        // Fire bullet
        function fireBullet() {
            bullets.push({ x: player.x + player.width / 2, y: player.y, width: 3, height: 10 });
        }

        // Update game state
        function update() {
            // Move bullets
            bullets.forEach((bullet, index) => {
                bullet.y -= 5;
                if (bullet.y < 0) {
                    bullets.splice(index, 1);
                }
            });

            // Move aliens
            let alienDirection = 1;
            aliens.forEach((alien) => {
                alien.x += alienDirection;
                if (alien.x <= 0 || alien.x >= canvas.width - alien.width) {
                    alienDirection *= -1;
                    aliens.forEach((a) => a.y += 10);
                }
            });

            // Check collisions
            bullets.forEach((bullet, bulletIndex) => {
                aliens.forEach((alien, alienIndex) => {
                    if (collision(bullet, alien)) {
                        bullets.splice(bulletIndex, 1);
                        aliens.splice(alienIndex, 1);
                        score += 10;
                    }
                });
            });

            // Check if aliens reached bottom
            aliens.forEach((alien) => {
                if (alien.y + alien.height >= player.y) {
                    lives--;
                    if (lives <= 0) {
                        alert('Game Over! Your score: ' + score);
                        init();
                    } else {
                        aliens = [];
                        createAliens();
                    }
                }
            });

            // Check if all aliens are destroyed
            if (aliens.length === 0) {
                wave++;
                createAliens();
            }
        }

        // Draw game objects
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw player
            ctx.fillStyle = 'green';
            ctx.fillRect(player.x, player.y, player.width, player.height);

            // Draw bullets
            ctx.fillStyle = 'yellow';
            bullets.forEach((bullet) => {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            });

            // Draw aliens
            ctx.fillStyle = 'red';
            aliens.forEach((alien) => {
                ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
            });

            // Draw shelters
            ctx.fillStyle = 'gray';
            shelters.forEach((shelter) => {
                ctx.fillRect(shelter.x, shelter.y, shelter.width, shelter.height);
            });

            // Draw score and lives
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('Score: ' + score, 10, 30);
            ctx.fillText('Lives: ' + lives, 10, 60);
            ctx.fillText('Wave: ' + wave, 10, 90);
        }

        // Collision detection
        function collision(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        }

        // Game loop
        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') movePlayer('left');
            if (e.key === 'ArrowRight') movePlayer('right');
            if (e.key === ' ') fireBullet();
        });

        // Start the game
        init();
        gameLoop();
    </script>
</body>
</html>
