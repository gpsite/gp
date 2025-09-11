// scripts/starry-background.js
// Advanced Galaxy/Star Field with swirling nebula, parallax, and shooting stars
(function () {
  // Accept either an existing <canvas> element or create one
  function setupStarryBackground(options = {}) {
    let canvas = options.canvas || document.getElementById('bg-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-canvas';
      document.body.appendChild(canvas);
    }
    canvas.style.position = 'fixed';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = 0;
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    let w = window.innerWidth, h = window.innerHeight;
    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    window.addEventListener('resize', resize);
    resize();

    // Nebula swirl generator
    function drawNebula(t) {
      for (let i = 0; i < 3; i++) {
        let angle = t / 7000 + i * 2;
        let cx = w / 2 + Math.cos(angle) * w * 0.22 + Math.sin(t / (5000 + i * 900)) * w * 0.11;
        let cy = h / 2 + Math.sin(angle) * h * 0.18 + Math.cos(t / (4000 + i * 700)) * h * 0.08;
        let r = w * 0.21 + Math.sin(t / (2300 + i * 600)) * w * 0.08;
        ctx.save();
        ctx.globalAlpha = 0.10 + 0.05 * Math.sin(t / (1700 + i * 1100));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        let c = [
          `rgba(${30 + 40 * i},${30 + 30 * i},${70 + 90 * i},0.9)`,
          `rgba(${100 + 50 * i},${90 + 40 * i},${180 + 60 * i},0.7)`,
          `rgba(${255 - 60 * i},${255 - 90 * i},${255 - 180 * i},0.1)`
        ];
        let nebgrd = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        nebgrd.addColorStop(0, c[0]);
        nebgrd.addColorStop(0.5, c[1]);
        nebgrd.addColorStop(1, c[2]);
        ctx.fillStyle = nebgrd;
        ctx.fill();
        ctx.restore();
      }
    }

    // Star field, parallax
    const STAR_COUNT = 130;
    let stars = [];
    function randomizeStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        let layer = Math.floor(Math.random() * 3) + 1;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + 0.5 * layer,
          tw: Math.random() * Math.PI * 2,
          spd: Math.random() * 0.021 + 0.009 * layer,
          color: `hsl(${50 + Math.random() * 30},90%,${85 + Math.random() * 12}%)`,
          layer
        });
      }
    }
    randomizeStars();
    window.addEventListener('resize', randomizeStars);

    // Shooting stars
    let shootingStars = [];
    function spawnShootingStar() {
      let sx = Math.random() * w, sy = Math.random() * h * 0.43 + h * 0.12;
      let angle = Math.PI / 2 + (Math.random() - 0.5) * 0.38;
      let speed = 7.5 + Math.random() * 2.7;
      shootingStars.push({
        x: sx, y: sy, angle, speed,
        life: 0, maxLife: 38 + Math.random() * 24,
      });
    }

    function drawStars(t) {
      for (let s of stars) {
        s.tw += s.spd;
        let alpha = 0.65 + Math.sin(s.tw * 2 + t / 1300) * 0.23 * s.layer;
        let parallax = 5 * s.layer;
        let x = s.x + Math.sin(t / (16000 + (500 * s.layer)) + s.x / 600) * parallax;
        let y = s.y + Math.cos(t / (12000 + (400 * s.layer)) + s.y / 600) * parallax;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = s.r * 9 + 2;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    function updateShootingStars() {
      if (Math.random() < 0.011) spawnShootingStar();
      for (let s of shootingStars) {
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.life++;
      }
      shootingStars = shootingStars.filter(s =>
        s.life < s.maxLife && s.x > -80 && s.x < w + 80 && s.y > -80 && s.y < h + 80
      );
    }
    function drawShootingStars(t) {
      for (let s of shootingStars) {
        let tail = s.maxLife / 2.3;
        ctx.save();
        ctx.globalAlpha = 0.5 - s.life / s.maxLife * 0.61;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(s.angle) * tail, s.y - Math.sin(s.angle) * tail);
        ctx.strokeStyle = `rgba(255,255,255,0.88)`;
        ctx.lineWidth = 2.7;
        ctx.shadowColor = "#FFD900";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4.1, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD900";
        ctx.globalAlpha *= 1.05;
        ctx.fill();
        ctx.restore();
      }
    }

    function animate(t) {
      ctx.clearRect(0, 0, w, h);
      drawNebula(t);
      drawStars(t);
      updateShootingStars();
      drawShootingStars(t);
      requestAnimationFrame(animate);
    }
    animate(performance.now());
  }

  // Expose globally
  window.setupStarryBackground = setupStarryBackground;
})();