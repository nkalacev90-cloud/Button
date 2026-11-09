(function () {
  'use strict';

  const STORAGE_KEY = 'buttonClickerCount';
  const LEVEL_KEY = 'buttonClickerLevel';
  const MAX_SAFE = Number.MAX_SAFE_INTEGER;
  const CHANCE_TO_PLAY = 5;

  const mainScreen = document.getElementById('mainScreen');
  const button = document.getElementById('clickBtn');
  const countValue = document.getElementById('countValue');

  const introScreen = document.getElementById('introScreen');
  const introTitle = document.getElementById('introTitle');
  const introDesc = document.getElementById('introDesc');

  const gameScreen = document.getElementById('gameScreen');
  const gameTitle = document.getElementById('gameTitle');
  const gameDesc = document.getElementById('gameDesc');
  const gameActionBtn = document.getElementById('gameActionBtn');
  const gameStatus = document.getElementById('gameStatus');
  const flappyContainer = document.getElementById('flappyContainer');
  const canvas = document.getElementById('flappyCanvas');
  const ctx = canvas.getContext('2d');

  let count = 0;
  let gameLevel = 0;
  let currentGameType = -1;
  let currentGameParams = {};

  function loadData() {
    try {
      const rawCount = localStorage.getItem(STORAGE_KEY);
      count = rawCount ? Math.max(0, Math.floor(Number(rawCount))) : 0;
      const rawLevel = localStorage.getItem(LEVEL_KEY);
      gameLevel = rawLevel ? Math.max(0, Math.floor(Number(rawLevel))) : 0;
    } catch { count = 0; gameLevel = 0; }
  }

  function saveCount(value) {
    try { localStorage.setItem(STORAGE_KEY, String(value)); } catch {}
  }

  function saveLevel(value) {
    try { localStorage.setItem(LEVEL_KEY, String(value)); } catch {}
  }

  function render() {
    countValue.textContent = String(count);
  }

  function handleClick() {
    if (count >= MAX_SAFE) return;
    count += 1;
    render();
    saveCount(count);
    if (Math.random() * 100 <= CHANCE_TO_PLAY) showIntro();
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }

  function showIntro() {
    currentGameType = Math.floor(Math.random() * 4);

    if (currentGameType === 0) {
      const targetClicks = Math.min(10 + gameLevel, 30);
      const timeLimit = (targetClicks * 0.25 + 1.0).toFixed(1);
      currentGameParams = { target: targetClicks, timeLimit: timeLimit };
      introTitle.textContent = "Успей нажать!";
      introDesc.textContent = `Уровень ${gameLevel + 1}. Успей нажать ${targetClicks} раз за ${timeLimit} сек.`;
    } 
    else if (currentGameType === 1) {
      // УВЕЛИЧИЛИ СЛОЖНОСТЬ: теперь +0.5 сек за уровень, максимум 10 сек
      const holdTime = Math.min(2.0 + (gameLevel * 0.5), 10.0).toFixed(1);
      currentGameParams = { holdTime: holdTime };
      introTitle.textContent = "Удерживай кнопку!";
      introDesc.textContent = `Уровень ${gameLevel + 1}. Зажми и держи ровно ${holdTime} сек. Отпустишь раньше — проиграешь.`;
    } 
    else if (currentGameType === 2) {
      const targetHits = 5 + gameLevel; 
      currentGameParams = { targetHits: targetHits };
      introTitle.textContent = "Бейсбол";
      introDesc.textContent = `Уровень ${gameLevel + 1}. Нажимай, когда мяч пролетает над битой. Отбей ${targetHits} мяча! 3 промаха — поражение.`;
    } 
    else {
      const targetPipes = 5 + (gameLevel * 3);
      const startSpeed = (1.5 + (gameLevel * 0.2)).toFixed(1);
      currentGameParams = { targetPipes: targetPipes, startSpeed: parseFloat(startSpeed) };
      introTitle.textContent = "Flappy Bird";
      introDesc.textContent = `Уровень ${gameLevel + 1}. Пролети ${targetPipes} труб. Стартовая скорость: ${startSpeed}.`;
    }

    showScreen('introScreen');
    introScreen.onclick = launchGame;
    window.addEventListener('keydown', introKeyHandler);
  }

  function introKeyHandler(e) {
    if (introScreen.classList.contains('active')) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        launchGame(e);
      }
    }
  }

  function launchGame(e) {
    if (e && e.type === 'keydown') {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      e.preventDefault();
    }
    introScreen.onclick = null;
    window.removeEventListener('keydown', introKeyHandler);

    showScreen('gameScreen');
    gameActionBtn.style.display = 'block';
    flappyContainer.style.display = 'none';
    gameActionBtn.disabled = false;
    gameActionBtn.className = 'game-circle-btn';
    gameStatus.textContent = '';
    gameStatus.style.color = '#fff';

    if (currentGameType === 0) startClickerGame();
    else if (currentGameType === 1) startHoldGame();
    else if (currentGameType === 2) startBaseballGame();
    else startFlappyGame();
  }

  function returnToMain(isVictory) {
    setTimeout(() => {
      if (isVictory) {
        gameLevel++;
        saveLevel(gameLevel);
      }

      showScreen('mainScreen');
      button.focus();
      
      gameActionBtn.onclick = null;
      gameActionBtn.onpointerdown = null;
      gameActionBtn.onpointerup = null;
      gameActionBtn.onpointerleave = null;
      gameActionBtn.onkeydown = null;
      gameActionBtn.onkeyup = null;
      document.onkeydown = null;
      canvas.onclick = null;
      
      gameActionBtn.className = 'game-circle-btn';
      gameActionBtn.disabled = false;
    }, 1500);
  }

  // --- ИГРА 1: Кликер ---
  function startClickerGame() {
    gameTitle.textContent = "Успей нажать!";
    gameDesc.textContent = `Нужно: ${currentGameParams.target} кликов за ${currentGameParams.timeLimit} сек.`;
    gameActionBtn.className = 'game-circle-btn color-green';
    
    let score = 0;
    let isActive = true;
    gameStatus.textContent = `0 / ${currentGameParams.target}`;

    const timer = setTimeout(() => {
      if (!isActive) return;
      isActive = false;
      gameActionBtn.disabled = true;
      gameStatus.textContent = `⏰ Время вышло! (${score}/${currentGameParams.target})`;
      gameStatus.style.color = '#f87171';
      returnToMain(false);
    }, currentGameParams.timeLimit * 1000);

    const handleAction = (e) => {
      if (!isActive) return;
      if (e && e.type === 'keydown') {
        if (e.code !== 'Space' && e.code !== 'Enter') return;
        e.preventDefault();
      }
      score++;
      gameStatus.textContent = `${score} / ${currentGameParams.target}`;
      if (score >= currentGameParams.target) {
        isActive = false;
        clearTimeout(timer);
        gameActionBtn.disabled = true;
        gameStatus.textContent = "🎉 Победа!";
        gameStatus.style.color = '#4ade80';
        returnToMain(true);
      }
    };

    gameActionBtn.onclick = handleAction;
    gameActionBtn.onkeydown = handleAction;
    gameActionBtn.focus();
  }

  // --- ИГРА 2: Удержание ---
  function startHoldGame() {
    gameTitle.textContent = "Удерживай кнопку!";
    gameDesc.textContent = `Держи ровно ${currentGameParams.holdTime} сек.`;
    gameActionBtn.className = 'game-circle-btn color-purple';

    let holdTimer = null;
    let isActive = true;
    let startTime = 0;

    gameStatus.textContent = "Зажми кнопку...";

    const startHold = (e) => {
      if (!isActive) return;
      if (e && e.type === 'keydown') {
        if (e.code !== 'Space' && e.code !== 'Enter') return;
        e.preventDefault();
        if (e.repeat) return;
      }
      startTime = Date.now();
      gameStatus.textContent = "Держи...";
      gameActionBtn.style.transform = 'scale(0.95)';

      holdTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= parseFloat(currentGameParams.holdTime)) {
          clearInterval(holdTimer);
          isActive = false;
          gameActionBtn.disabled = true;
          gameActionBtn.style.transform = '';
          gameStatus.textContent = "🎉 Успех!";
          gameStatus.style.color = '#4ade80';
          returnToMain(true);
        } else {
          gameStatus.textContent = `Держи... ${elapsed.toFixed(1)} / ${currentGameParams.holdTime} сек`;
        }
      }, 100);
    };

    const cancelHold = (e) => {
      if (!isActive) return;
      if (e && e.type === 'keyup') {
        if (e.code !== 'Space' && e.code !== 'Enter') return;
      }
      if (holdTimer) {
        clearInterval(holdTimer);
        holdTimer = null;
        isActive = false;
        gameActionBtn.disabled = true;
        gameActionBtn.style.transform = '';
        gameStatus.textContent = "❌ Отпустил рано!";
        gameStatus.style.color = '#f87171';
        returnToMain(false);
      }
    };

    gameActionBtn.onpointerdown = startHold;
    gameActionBtn.onpointerup = cancelHold;
    gameActionBtn.onpointerleave = cancelHold;
    gameActionBtn.onkeydown = startHold;
    gameActionBtn.onkeyup = cancelHold;
    gameActionBtn.focus();
  }

  // --- ИГРА 3: БЕЙСБОЛ ---
  function startBaseballGame() {
    gameTitle.textContent = "Бейсбол";
    gameDesc.textContent = `Отбей ${currentGameParams.targetHits} мяча!`;
    
    gameActionBtn.style.display = 'none';
    flappyContainer.style.display = 'flex';
    gameStatus.textContent = `Счет: 0 / ${currentGameParams.targetHits} | Страйки: 0/3`;

    let isActive = true;
    let hits = 0;
    let strikes = 0;
    let isBallActive = false;
    let nextBallTimeout = null;
    
    const bat = { x: canvas.width / 2 - 40, y: canvas.height - 40, width: 80, height: 15, swingTimer: 0 };
    let ball = { x: canvas.width / 2, y: -20, radius: 12, speed: 3, hitZoneY: canvas.height - 80 };

    function spawnBall() {
      if (!isActive) return;
      ball.x = canvas.width / 2;
      ball.y = -ball.radius;
      ball.speed = 3.5 + (gameLevel * 0.4) + (hits * 0.3); 
      isBallActive = true;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, ball.hitZoneY);
      ctx.lineTo(canvas.width, ball.hitZoneY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.translate(bat.x + bat.width/2, bat.y + bat.height/2);
      if (bat.swingTimer > 0) {
        ctx.rotate(-0.3);
        ctx.fillStyle = '#e53935';
      } else {
        ctx.fillStyle = '#3b82f6';
      }
      ctx.fillRect(-bat.width/2, -bat.height/2, bat.width, bat.height);
      ctx.restore();

      if (isBallActive) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }
    }

    function update() {
      if (!isActive) return;

      if (bat.swingTimer > 0) bat.swingTimer--;

      if (isBallActive) {
        ball.y += ball.speed;
        const isBallInHitZone = Math.abs(ball.y - ball.hitZoneY) < ball.radius + 10;

        if (isBallInHitZone && bat.swingTimer > 0) {
          isBallActive = false;
          hits++;
          gameStatus.textContent = `Счет: ${hits} / ${currentGameParams.targetHits} | Страйки: ${strikes}/3`;
          gameStatus.style.color = '#4ade80';
          bat.swingTimer = 0;

          if (hits >= currentGameParams.targetHits) {
            isActive = false;
            gameStatus.textContent = "🎉 Победа!";
            returnToMain(true);
            return;
          }
          clearTimeout(nextBallTimeout);
          nextBallTimeout = setTimeout(spawnBall, 800);
          draw();
          requestAnimationFrame(update);
          return;
        }

        if (ball.y > ball.hitZoneY + 20) {
          isBallActive = false;
          strikes++;
          gameStatus.textContent = `Счет: ${hits} / ${currentGameParams.targetHits} | Страйки: ${strikes}/3`;
          gameStatus.style.color = '#f87171';

          if (strikes >= 3) {
            isActive = false;
            gameStatus.textContent = "❌ Три страйка. Вы проиграли.";
            returnToMain(false);
            return;
          }
          clearTimeout(nextBallTimeout);
          nextBallTimeout = setTimeout(spawnBall, 800);
          draw();
          requestAnimationFrame(update);
          return;
        }
      }

      draw();
      requestAnimationFrame(update);
    }

    const swingBat = (e) => {
      if (!isActive || !isBallActive) return;
      if (e && e.type === 'keydown') {
        if (e.code !== 'Space' && e.code !== 'Enter') return;
        e.preventDefault();
        if (e.repeat) return;
      }
      if (bat.swingTimer === 0) bat.swingTimer = 15;
    };

    canvas.onclick = swingBat;
    document.onkeydown = swingBat; 

    spawnBall();
    draw();
    update();
  }

  // --- ИГРА 4: FLAPPY BIRD ---
  function startFlappyGame() {
    gameTitle.textContent = "Flappy Bird";
    gameDesc.textContent = `Пролети ${currentGameParams.targetPipes} труб!`;
    
    gameActionBtn.style.display = 'none';
    flappyContainer.style.display = 'flex';
    
    gameStatus.textContent = `Счет: 0 / ${currentGameParams.targetPipes}`;
    gameStatus.style.color = '#fff';

    let frames = 0;
    let score = 0;
    let isGameOver = false;
    
    const bird = { x: 50, y: 150, width: 24, height: 24, gravity: 0.25, jump: -4.5, velocity: 0 };
    let pipes = [];
    const pipeWidth = 50;
    const pipeGap = 120;
    
    let gameSpeed = currentGameParams.startSpeed;

    const timeLimit = currentGameParams.targetPipes * 6000; 
    const maxGameTime = setTimeout(() => {
      if (!isGameOver) {
        isGameOver = true;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f87171';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Время вышло!', canvas.width / 2, canvas.height / 2);
        returnToMain(false);
      }
    }, timeLimit);

    const jump = (e) => {
      if (isGameOver) return;
      if (e && e.type === 'keydown') {
        if (e.code !== 'Space' && e.code !== 'Enter') return;
        e.preventDefault();
        if (e.repeat) return;
      }
      bird.velocity = bird.jump;
    };

    canvas.onclick = jump;
    document.onkeydown = jump;

    function loop() {
      if (isGameOver) return;
      
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      if (frames % 90 === 0) {
        const minHeight = 50;
        const maxHeight = canvas.height - pipeGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipes.push({ x: canvas.width, top: topHeight, bottom: topHeight + pipeGap, passed: false });
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= gameSpeed; 

        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        ctx.fillRect(p.x, p.bottom, pipeWidth, canvas.height - p.bottom);

        if (bird.x < p.x + pipeWidth && bird.x + bird.width > p.x && (bird.y < p.top || bird.y + bird.height > p.bottom)) {
          isGameOver = true;
        }

        if (p.x + pipeWidth < bird.x && !p.passed) { 
          p.passed = true; 
          score++; 
          gameSpeed += 0.15;
          gameStatus.textContent = `Счет: ${score} / ${currentGameParams.targetPipes}`;

          if (score >= currentGameParams.targetPipes && !isGameOver) {
            isGameOver = true;
            clearTimeout(maxGameTime);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#4ade80';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 Победа!', canvas.width / 2, canvas.height / 2);
            returnToMain(true);
            return;
          }
        }
        if (p.x + pipeWidth < 0) pipes.splice(i, 1);
      }

      if (bird.y + bird.height > canvas.height || bird.y < 0) {
        isGameOver = true;
      }

      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

      if (isGameOver) {
        clearTimeout(maxGameTime);
        if (score < currentGameParams.targetPipes) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#f87171';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Игра окончена', canvas.width / 2, canvas.height / 2);
          returnToMain(false);
        }
        return;
      }

      requestAnimationFrame(loop);
    }

    loop();
  }

  // --- Инициализация ---
  function init() {
    loadData();
    render();
    button.addEventListener('click', handleClick);
    button.focus(); 
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();