const STAR_COLOR = '#fff';
    const STAR_SIZE = 3;
    const STAR_MIN_SCALE = 0.2;
    const OVERFLOW_THRESHOLD = 50;
    const STAR_COUNT = (window.innerWidth + window.innerHeight) / 8;

    const canvas = document.querySelector('#starsCanvas');
    const context = canvas.getContext('2d');

    let scale = 1;
    let width;
    let height;

    const stars = [];

    let pointerX;
    let pointerY;

    const velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.0005 };

    let touchInput = false;

    generate();
    resize();
    step();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseleave', onMouseLeave);

    function generate() {
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: 0,
          y: 0,
          z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE)
        });
      }
    }

    function placeStar(star) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    }

    function recycleStar(star) {
      let direction = 'z';

      const vx = Math.abs(velocity.x);
      const vy = Math.abs(velocity.y);

      if (vx > 1 || vy > 1) {
        const axis = vx > vy
          ? (Math.random() < vx / (vx + vy) ? 'h' : 'v')
          : (Math.random() < vy / (vx + vy) ? 'v' : 'h');

        direction = axis === 'h'
          ? (velocity.x > 0 ? 'l' : 'r')
          : (velocity.y > 0 ? 't' : 'b');
      }

      star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);

      if (direction === 'z') {
        star.z = 0.1;
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      } else if (direction === 'l') {
        star.x = -OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === 'r') {
        star.x = width + OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === 't') {
        star.x = width * Math.random();
        star.y = -OVERFLOW_THRESHOLD;
      } else if (direction === 'b') {
        star.x = width * Math.random();
        star.y = height + OVERFLOW_THRESHOLD;
      }
    }

    function resize() {
      scale = window.devicePixelRatio || 1;

      width = window.innerWidth * scale;
      height = window.innerHeight * scale;

      canvas.width = width;
      canvas.height = height;

      stars.forEach(placeStar);
    }

    function step() {
      context.clearRect(0, 0, width, height);

      update();
      render();

      requestAnimationFrame(step);
    }

    function update() {
      const lerpFactor = 0.03;

      velocity.tx *= 0.3;
      velocity.ty *= 0.3;

      velocity.x += (velocity.tx - velocity.x) * lerpFactor;
      velocity.y += (velocity.ty - velocity.y) * lerpFactor;

      stars.forEach((star) => {
        star.x += velocity.x * star.z;
        star.y += velocity.y * star.z;

        star.x += (star.x - width / 2) * velocity.z * star.z;
        star.y += (star.y - height / 2) * velocity.z * star.z;
        star.z += velocity.z;

        if (
          star.x < -OVERFLOW_THRESHOLD ||
          star.x > width + OVERFLOW_THRESHOLD ||
          star.y < -OVERFLOW_THRESHOLD ||
          star.y > height + OVERFLOW_THRESHOLD
        ) {
          recycleStar(star);
        }
      });
    }

    function render() {
      const trailLength = Math.max(1, 10 * velocity.z); // Increase trail length based on lightspeed effect

      stars.forEach((star) => {
        context.beginPath();
        context.lineCap = 'round';
        context.lineWidth = STAR_SIZE * star.z * scale;
        context.globalAlpha = 0.5 + 0.5 * Math.random();
        context.strokeStyle = STAR_COLOR;

        // Calculate trail direction
        const tailX = velocity.x * trailLength * star.z;
        const tailY = velocity.y * trailLength * star.z;

        // Draw the star and its trail
        context.moveTo(star.x, star.y);
        context.lineTo(star.x + tailX, star.y + tailY);

        context.stroke();
      });
    }

    function movePointer(x, y) {
      if (typeof pointerX === 'number' && typeof pointerY === 'number') {
        const ox = x - pointerX;
        const oy = y - pointerY;

        velocity.tx += (ox / 8 * scale) * (touchInput ? 1 : -1);
        velocity.ty += (oy / 8 * scale) * (touchInput ? 1 : -1);
      }

      pointerX = x;
      pointerY = y;
    }

    function onMouseMove(event) {
      touchInput = false;

      movePointer(event.clientX, event.clientY);
    }

    function onTouchMove(event) {
      touchInput = true;

      movePointer(event.touches[0].clientX, event.touches[0].clientY);

      event.preventDefault();
    }

    function onMouseLeave() {
      pointerX = null;
      pointerY = null;
    }

    function triggerLightspeedEffect() {
      const centerX = width / 2;
      const centerY = height / 2;

      const directionX = event.clientX - centerX;
      const directionY = event.clientY - centerY;

      const magnitude = Math.sqrt(directionX ** 2 + directionY ** 2);
      const normalizedX = directionX / magnitude;
      const normalizedY = directionY / magnitude;

      velocity.x = normalizedX * 10;
      velocity.y = normalizedY * 10;
      velocity.z = 0.02; // Increase velocity.z for lightspeed effect

      // Trigger shakee
      startShake();

      // Reset velocity.z to stop lightspeed effect
      setTimeout(() => {
        velocity.z = 0.0005; // Reset to normal
      }, 10000); // Adjust duration for lightspeed effect
    }

    function startShake() {
      const shakeIntensity = 5;
      const shakeDuration = 9000;
      const shakeInterval = 50;
      let elapsed = 0;

      function shake() {
        if (elapsed < shakeDuration) {
          const offsetX = (Math.random() * 2 - 1) * shakeIntensity;
          const offsetY = (Math.random() * 2 - 1) * shakeIntensity;

          canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

          elapsed += shakeInterval;
          setTimeout(shake, shakeInterval);
        } else {
          canvas.style.transform = '';
        }
      }

      shake();
    }

    document.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('click', triggerLightspeedEffect);
    });

   function delayedRedirect(link) {
            setTimeout(function() {
                window.open(link);
            }, 1000);
        };
        function compareTasks(a, b) {
            const statusOrder = {
                'completed': 3,
                'in-progress': 2,
                'pending': 1
            };

            const dateA = new Date(a.querySelector('.task-date').textContent);
            const dateB = new Date(b.querySelector('.task-date').textContent);

            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;

            const statusA = a.querySelector('.task-status').classList[1];
            const statusB = b.querySelector('.task-status').classList[1];

            return statusOrder[statusB] - statusOrder[statusA];
        }

        document.addEventListener('DOMContentLoaded', () => {
            const taskList = document.getElementById('taskList');
            const tasks = Array.from(taskList.querySelectorAll('.task'));
            tasks.sort(compareTasks);
            tasks.forEach(task => taskList.appendChild(task));
        });
    