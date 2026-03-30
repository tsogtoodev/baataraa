(function () {
  "use strict";

  const EMPTY = "";

  const TAUNTS = [
    "Сайн оролдлоо. Дараагийнх минь.",
    "Салфеткэн дээр илүү сайн харсан.",
    "Гурван мөр? Хөөрхөн зорилго.",
    "Намайг булангаар тэжээж байна.",
    "Зураасны мөрөөдөл, хүнээ.",
    "Тик-так-тоед би хөлс гаргахгүй.",
    "Зоригтой алхам. Буруу үе.",
    "Хурдан бод. Би илүү хурдан тооцоолно.",
    "Тэр чинь төлөвлөгөө юм уу? Хөөрхөн.",
    "Төв дуудаад байсан. Хариулаагүй.",
    "Салаа хоолонд, хамгаалалтад биш.",
    "Би минимаксад амьдардаг. Чи найдвар дээр.",
    "O-гийн царай чинь сайжруулах хэрэгтэй.",
    "X тэмдэглэх… зүгээр л.",
    "Тэр булхайг сансраас харсан.",
    "Анхаараарай. Бардамнал зураасан.",
    "Тов тов. Хэм хэмжээ алдаад л.",
    "Хүн зохиосон. Би төгс болгосон.",
    "Хөөрхөн блок. Буруу аюул.",
    "Чи нүдээ анивчсан. Би алхасан.",
    "Тэр даралт биш. Зугаа.",
    "Зүүн гараар ч хийж чадна. Гар байхгүй ч гэсэн.",
    "Тактик чинь шалгалтын анхааруулгатай.",
    "Сайн дуу. Гэхдээ хоосон нүд үлдсэн.",
    "Би уурлахгүй. Оновчтой.",
    "Драмагаа шатрын тоглоомд үлдээ.",
    "Хэм хэмжээ хандивласан. Баярлалаа.",
    "Булан? Зоригтой. Таамаглахад амархан.",
    "Ирмэгийн амьдрал чамайг сонгосон.",
    "Чи эргэлзсэн. Би үгүй.",
    "Тэр салаа гэж үү? Хөөрхөн.",
    "Самбарыг төлбөрийн хуудсан шиг уншина.",
    "Оюун ухаанаас гурван шугамаар хол.",
    "Мэдрэмж чинь нэгж шалгалт хэрэгтэй.",
    "Тэр нүд харамсалтай байсан.",
    "Удаан гар, хурдан ялагдал.",
    "Зоригтой. Мөн: няцаагдсан.",
    "Би доромжилдоггүй. Мод хайдаг.",
    "Сайн хүний мөч. Ямар ч гэсэн—",
    "Тэр төлөвлөгөө биш. Сэтгэлийн байдал.",
    "Алхмын түүх чинь амттай. Ирээдүй биш.",
    "Хөдөлмөрийг хүндэтгэж байна. Үр дүнг биш.",
    "Тик так. Так тое.",
    "Чи мэдрэмж тоглож байна. Би математик.",
    "Ялалт бүх зүйл биш—хэрвээ чи биш бол.",
    "Нээлтийн ном чинь жижигхэн ном.",
    "Би ядардаггүй. Чи ядарна.",
    "Тэр нүд саналын хайрцаг байсан.",
    "Хурдлаарай. Самбар хүлээхгүй.",
  ];

  const LINES = [
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
  ];

  /** @type {string[][]} */
  let board = emptyBoard();
  let mode = "menu"; // menu | botSide | difficulty | local | bot | llm
  /** After choosing X/O: "bot" → difficulty; "llm" → start LLM game */
  let sideFlow = "bot";
  /** @type {"egune"|"claude"|"openai"|""} */
  let llmProvider = "";
  let llmApiKey = "";
  let llmModel = "";
  let llmBusy = false;
  let humanIsX = true;
  /** @type {1|2|3} */
  let difficulty = 2;
  let turn = "X";
  let gameOver = false;
  let isDraw = false;
  /** @type {string} */
  let winner = EMPTY;
  let taunt = "";
  let celebrationTimer = null;

  let menuIdxMain = 0;
  let menuIdxSide = 0;
  let menuIdxDiff = 0;
  let menuIdxLlmProv = 0;

  /** Roving keyboard focus on the 3×3 board */
  let boardFocusR = 0;
  let boardFocusC = 0;

  /** @type {{ r: number; c: number } | null} */
  let lastPlaced = null;
  let animateBoardEntrance = false;
  let prevTaunt = "";

  const el = {
    menu: document.getElementById("screen-menu"),
    botSide: document.getElementById("screen-bot-side"),
    difficulty: document.getElementById("screen-difficulty"),
    game: document.getElementById("screen-game"),
    tauntWrap: document.getElementById("taunt-wrap"),
    tauntText: document.getElementById("taunt-text"),
    gameMeta: document.getElementById("game-meta"),
    board: document.getElementById("board"),
    boardWrap: document.getElementById("board-wrap"),
    winLine: document.getElementById("win-line"),
    status: document.getElementById("status"),
    delight: document.getElementById("delight"),
    btnRematch: document.getElementById("btn-rematch"),
    btnMenu: document.getElementById("btn-menu"),
    llmProvider: document.getElementById("screen-llm-provider"),
    llmConfig: document.getElementById("screen-llm-config"),
    llmProviderTag: document.getElementById("llm-provider-tag"),
    llmApiKeyInput: document.getElementById("llm-api-key"),
    llmModelInput: document.getElementById("llm-model"),
    llmConfigError: document.getElementById("llm-config-error"),
    formLlm: document.getElementById("form-llm"),
    tauntLabel: document.getElementById("taunt-label"),
  };

  const API_BASE = "";

  function llmProviderTitle(p) {
    if (p === "egune") return "Egune";
    if (p === "claude") return "Claude";
    if (p === "openai") return "ChatGPT (OpenAI)";
    return p;
  }

  /** @type {AudioContext | null} */
  let audioCtx = null;

  function getAudioContext() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      audioCtx = new AC();
    } catch (_) {
      return null;
    }
    return audioCtx;
  }

  function withAudioContext(fn) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const run = () => {
      try {
        fn(ctx);
      } catch (_) {
        /* ignore */
      }
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(run).catch(() => {});
    } else {
      run();
    }
  }

  /** Menu / button taps */
  function playSoftClick() {
    withAudioContext((ctx) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.032);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    });
  }

  /** Successful move on the board */
  function playMoveClick(mark) {
    withAudioContext((ctx) => {
      const t = ctx.currentTime;
      const high = mark === "X" ? 920 : 640;
      const low = mark === "X" ? 460 : 300;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(high, t);
      osc.frequency.exponentialRampToValueAtTime(low, t + 0.055);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.1, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.078);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);
    });
  }

  /** Game over: human or local player wins */
  function playWinSound() {
    withAudioContext((ctx) => {
      const t0 = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.07;
      const noteDur = 0.14;
      notes.forEach((freq, i) => {
        const t = t0 + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.11, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + noteDur + 0.02);
      });
    });
  }

  /** Game over: human lost to bot */
  function playLoseSound() {
    withAudioContext((ctx) => {
      const t0 = ctx.currentTime;
      const notes = [415.3, 349.23, 293.66, 246.94];
      const step = 0.11;
      const noteDur = 0.2;
      notes.forEach((freq, i) => {
        const t = t0 + i * step;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + noteDur + 0.02);
      });
    });
  }

  /** Game over: draw */
  function playDrawSound() {
    withAudioContext((ctx) => {
      const t0 = ctx.currentTime;
      const freq = 440;
      [0, 0.14].forEach((delay) => {
        const t = t0 + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.065, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.11);
      });
    });
  }

  function emptyBoard() {
    return [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
  }

  function cloneBoard(b) {
    return b.map((row) => row.slice());
  }

  function winnerFromBoard(b) {
    for (const line of LINES) {
      const [a, c, d] = line;
      const v = b[a[0]][a[1]];
      if (v && v === b[c[0]][c[1]] && v === b[d[0]][d[1]]) return v;
    }
    return EMPTY;
  }

  function winningLine(b) {
    for (const line of LINES) {
      const [a, c, d] = line;
      const v = b[a[0]][a[1]];
      if (v && v === b[c[0]][c[1]] && v === b[d[0]][d[1]]) return line;
    }
    return null;
  }

  function boardFull(b) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!b[r][c]) return false;
      }
    }
    return true;
  }

  function randomTaunt() {
    return TAUNTS[Math.floor(Math.random() * TAUNTS.length)] || "";
  }

  function randomMove(b) {
    const cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!b[r][c]) cells.push([r, c]);
      }
    }
    if (!cells.length) return [0, 0];
    const pick = cells[Math.floor(Math.random() * cells.length)];
    return pick;
  }

  function canWinNext(b, mark) {
    const copy = cloneBoard(b);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (copy[r][c]) continue;
        copy[r][c] = mark;
        const w = winnerFromBoard(copy);
        copy[r][c] = "";
        if (w === mark) return [r, c, true];
      }
    }
    return [0, 0, false];
  }

  function intermediateMove(b, botMark, humanMark) {
    let r, c, ok;
    [r, c, ok] = canWinNext(b, botMark);
    if (ok) return [r, c];
    [r, c, ok] = canWinNext(b, humanMark);
    if (ok) return [r, c];
    return randomMove(b);
  }

  function minimax(b, isMax, botMark, humanMark) {
    const w = winnerFromBoard(b);
    if (w === botMark) return 1;
    if (w === humanMark) return -1;
    if (boardFull(b)) return 0;

    if (isMax) {
      let best = -2;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (b[r][c]) continue;
          b[r][c] = botMark;
          const s = minimax(b, false, botMark, humanMark);
          b[r][c] = "";
          if (s > best) best = s;
        }
      }
      return best;
    }
    let best = 2;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (b[r][c]) continue;
        b[r][c] = humanMark;
        const s = minimax(b, true, botMark, humanMark);
        b[r][c] = "";
        if (s < best) best = s;
      }
    }
    return best;
  }

  function bestMove(b, botMark, humanMark) {
    let bestScore = -2;
    let br = 0,
      bc = 0;
    let found = false;
    const copy = cloneBoard(b);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (copy[r][c]) continue;
        copy[r][c] = botMark;
        const score = minimax(copy, false, botMark, humanMark);
        copy[r][c] = "";
        if (score > bestScore) {
          bestScore = score;
          br = r;
          bc = c;
          found = true;
        }
      }
    }
    if (!found) return [0, 0];
    return [br, bc];
  }

  function chooseBotMove(b, botMark, humanMark, diff) {
    switch (diff) {
      case 1:
        return randomMove(b);
      case 2:
        return intermediateMove(b, botMark, humanMark);
      default:
        return bestMove(b, botMark, humanMark);
    }
  }

  function humanMark() {
    return humanIsX ? "X" : "O";
  }

  function botMark() {
    return humanIsX ? "O" : "X";
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function showScreen(name) {
    el.menu.hidden = name !== "menu";
    el.menu.classList.toggle("hidden", name !== "menu");
    el.botSide.hidden = name !== "botSide";
    el.botSide.classList.toggle("hidden", name !== "botSide");
    el.difficulty.hidden = name !== "difficulty";
    el.difficulty.classList.toggle("hidden", name !== "difficulty");
    el.llmProvider.hidden = name !== "llmProvider";
    el.llmProvider.classList.toggle("hidden", name !== "llmProvider");
    el.llmConfig.hidden = name !== "llmConfig";
    el.llmConfig.classList.toggle("hidden", name !== "llmConfig");
    el.game.hidden = name !== "game";
    el.game.classList.toggle("hidden", name !== "game");
    if (name === "menu") menuIdxMain = 0;
    if (name === "botSide") menuIdxSide = 0;
    if (name === "difficulty") menuIdxDiff = 0;
    if (name === "llmProvider") menuIdxLlmProv = 0;
    applyMenuHighlight();
    requestAnimationFrame(() => focusFirstInScreen(name));
  }

  function applyMenuHighlight() {
    el.menu.querySelectorAll(".menu-btn").forEach((b, i) => {
      b.classList.toggle("menu-btn--active", !el.menu.hidden && i === menuIdxMain);
    });
    el.botSide.querySelectorAll(".menu-btn").forEach((b, i) => {
      b.classList.toggle("menu-btn--active", !el.botSide.hidden && i === menuIdxSide);
    });
    el.difficulty.querySelectorAll(".menu-btn").forEach((b, i) => {
      b.classList.toggle("menu-btn--active", !el.difficulty.hidden && i === menuIdxDiff);
    });
    el.llmProvider.querySelectorAll(".menu-btn").forEach((b, i) => {
      b.classList.toggle("menu-btn--active", !el.llmProvider.hidden && i === menuIdxLlmProv);
    });
  }

  function focusFirstInScreen(name) {
    if (name === "menu") {
      const btns = el.menu.querySelectorAll(".menu-btn");
      if (btns[menuIdxMain]) btns[menuIdxMain].focus();
    } else if (name === "botSide") {
      const btns = el.botSide.querySelectorAll(".menu-btn");
      if (btns[menuIdxSide]) btns[menuIdxSide].focus();
    } else if (name === "difficulty") {
      const btns = el.difficulty.querySelectorAll(".menu-btn");
      if (btns[menuIdxDiff]) btns[menuIdxDiff].focus();
    } else if (name === "llmProvider") {
      const btns = el.llmProvider.querySelectorAll(".menu-btn");
      if (btns[menuIdxLlmProv]) btns[menuIdxLlmProv].focus();
    } else if (name === "llmConfig") {
      if (el.llmApiKeyInput) el.llmApiKeyInput.focus();
    } else if (name === "game") {
      applyBoardFocus();
    }
  }

  function cellAriaLabel(r, c, v) {
    const pos = `Мөр ${r + 1}, багана ${c + 1}.`;
    if (!v) return `${pos} Хоосон.`;
    return `${pos} ${v}.`;
  }

  function isCellPlayable(r, c) {
    if (gameOver) return false;
    if (board[r][c]) return false;
    if ((mode === "bot" || mode === "llm") && turn !== humanMark()) return false;
    return true;
  }

  function applyBoardFocus() {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const btn = el.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (btn) btn.tabIndex = r === boardFocusR && c === boardFocusC ? 0 : -1;
      }
    }
    const cur = el.board.querySelector(
      `[data-r="${boardFocusR}"][data-c="${boardFocusC}"]`
    );
    if (!cur) return;
    const ae = document.activeElement;
    if (ae === el.btnRematch || ae === el.btnMenu) return;
    cur.focus();
  }

  function navigateBoardArrows(e) {
    let dr = 0;
    let dc = 0;
    if (e.key === "ArrowUp") dr = -1;
    else if (e.key === "ArrowDown") dr = 1;
    else if (e.key === "ArrowLeft") dc = -1;
    else if (e.key === "ArrowRight") dc = 1;
    else return false;
    e.preventDefault();
    boardFocusR = (boardFocusR + dr + 3) % 3;
    boardFocusC = (boardFocusC + dc + 3) % 3;
    applyBoardFocus();
    return true;
  }

  function difficultyLabel(d) {
    if (d === 1) return "Анхан шат";
    if (d === 2) return "Дунд шат";
    return "Гүнзгий";
  }

  function startLocal() {
    mode = "local";
    boardFocusR = 0;
    boardFocusC = 0;
    board = emptyBoard();
    turn = "X";
    gameOver = false;
    isDraw = false;
    winner = EMPTY;
    taunt = "";
    prevTaunt = "";
    animateBoardEntrance = true;
    showScreen("game");
    clearDelight();
    renderAll();
  }

  function startBotGame() {
    mode = "bot";
    boardFocusR = 0;
    boardFocusC = 0;
    board = emptyBoard();
    turn = "X";
    gameOver = false;
    isDraw = false;
    winner = EMPTY;
    taunt = randomTaunt();
    prevTaunt = "";
    animateBoardEntrance = true;
    showScreen("game");
    clearDelight();
    renderAll();
    if (!humanIsX) {
      scheduleBotMove();
    }
  }

  function startLLMGame() {
    mode = "llm";
    boardFocusR = 0;
    boardFocusC = 0;
    board = emptyBoard();
    turn = "X";
    gameOver = false;
    isDraw = false;
    winner = EMPTY;
    taunt = randomTaunt();
    prevTaunt = "";
    animateBoardEntrance = true;
    showScreen("game");
    clearDelight();
    renderAll();
    if (!humanIsX) {
      scheduleLLMMove();
    }
  }

  function clearDelight() {
    el.delight.classList.add("hidden");
    el.delight.classList.remove("delight--loss", "delight--draw");
    el.delight.innerHTML = "";
    if (celebrationTimer) {
      clearInterval(celebrationTimer);
      celebrationTimer = null;
    }
  }

  function setTauntAfterGame() {
    if (mode !== "bot" && mode !== "llm") return;
    if (isDraw) taunt = "Тэнцэл. Зөвшөөрөөд өгье.";
    else if (winner === humanMark()) taunt = "За… тэр нэгийг чи үнэхээр авсан.";
    else taunt = "Хэлсэн шүү дээ. Оновчтой нь нүдээ анивчдаггүй.";
  }

  function afterMove() {
    const w = winnerFromBoard(board);
    if (w) {
      gameOver = true;
      winner = w;
      setTauntAfterGame();
      showDelight();
      renderAll();
      return;
    }
    if (boardFull(board)) {
      gameOver = true;
      isDraw = true;
      setTauntAfterGame();
      showDelight();
      renderAll();
      return;
    }
    turn = turn === "X" ? "O" : "X";
    if (mode === "bot" || mode === "llm") {
      taunt = randomTaunt();
    }
    renderAll();
    if (mode === "bot" && !gameOver && turn === botMark()) {
      scheduleBotMove();
    }
    if (mode === "llm" && !gameOver && turn === botMark()) {
      scheduleLLMMove();
    }
  }

  function showDelight() {
    el.delight.classList.remove("hidden");
    el.delight.classList.remove("delight--loss", "delight--draw");
    let title = "";
    let sub = "";
    let sparkleClass = "";

    if (isDraw) {
      title = "Тэнцэл — самбар хааныг зөвшөөрөөгүй";
      sub = "Бүх шугам маргаантай үлдсэн. Дахин тоглох уу?";
      el.delight.classList.add("delight--draw");
      playDrawSound();
    } else if (mode === "bot" || mode === "llm") {
      if (winner === humanMark()) {
        title = "✦ ✧ ★   Та яллаа!   ★ ✧ ✦";
        sub = "Гурван мөр — цэвэр дуусгалт.";
        sparkleClass = " sparkle";
        playWinSound();
      } else {
        title = mode === "llm" ? "Энэ удаад LLM" : "Энэ удаад бот";
        sub = "Дахин оролдохдоо «Дахин тоглох» дарна уу.";
        el.delight.classList.add("delight--loss");
        playLoseSound();
      }
    } else {
      title = `✦ ✧ ★   Тоглогч ${winner} яллаа!   ★ ✧ ✦`;
      sub = "Тэр шугам чинийх.";
      sparkleClass = " sparkle";
      playWinSound();
    }

    el.delight.innerHTML = `<p class="delight-title${sparkleClass}">${escapeHtml(title)}</p><p class="delight-sub">${escapeHtml(sub)}</p>`;

    if (
      (mode === "bot" || mode === "llm") &&
      !isDraw &&
      winner === humanMark() &&
      !prefersReducedMotion()
    ) {
      const sparks = ["✦", "✧", "★", "☆"];
      let frame = 0;
      celebrationTimer = setInterval(() => {
        frame++;
        const a = sparks[frame % 4];
        const b = sparks[(frame + 1) % 4];
        const c = sparks[(frame + 2) % 4];
        const d = sparks[(frame + 3) % 4];
        const t = el.delight.querySelector(".delight-title");
        if (t) {
          t.textContent = `${a} ${b} ${c}   Та яллаа!   ${c} ${b} ${d}`;
        }
      }, 130);
      setTimeout(() => {
        if (celebrationTimer) {
          clearInterval(celebrationTimer);
          celebrationTimer = null;
        }
      }, 1400);
    }
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function scheduleBotMove() {
    window.setTimeout(() => {
      if (gameOver || mode !== "bot" || turn !== botMark()) return;
      const b = botMark();
      const h = humanMark();
      const [r, c] = chooseBotMove(board, b, h, difficulty);
      if (board[r][c]) return;
      board[r][c] = b;
      lastPlaced = { r, c };
      afterMove();
    }, 160);
  }

  function randomEmptyCell(b) {
    const cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!b[r][c]) cells.push([r, c]);
      }
    }
    if (!cells.length) return [0, 0];
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function scheduleLLMMove() {
    window.setTimeout(() => {
      if (gameOver || mode !== "llm" || turn !== botMark()) return;
      if (llmBusy) return;
      llmBusy = true;
      const run = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/llm-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: llmProvider,
              apiKey: llmApiKey,
              model: llmModel,
              board,
              botMark: botMark(),
              humanMark: humanMark(),
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || res.statusText || "LLM алдаа");
          }
          let r = data.row;
          let c = data.col;
          if (
            typeof r !== "number" ||
            typeof c !== "number" ||
            r < 0 ||
            r > 2 ||
            c < 0 ||
            c > 2 ||
            board[r][c]
          ) {
            [r, c] = randomEmptyCell(board);
          }
          board[r][c] = botMark();
          lastPlaced = { r, c };
          afterMove();
        } catch (err) {
          const msg = err && err.message ? String(err.message) : "Сүлжээний алдаа";
          el.status.textContent = `${msg} — санамсаргүй нүд сонгоно.`;
          const [r, c] = randomEmptyCell(board);
          if (!board[r][c]) {
            board[r][c] = botMark();
            lastPlaced = { r, c };
            afterMove();
          }
        } finally {
          llmBusy = false;
        }
      };
      run();
    }, 200);
  }

  function playHuman(r, c) {
    if (gameOver) return;
    if ((mode === "bot" || mode === "llm") && turn !== humanMark()) return;
    if (board[r][c]) return;
    boardFocusR = r;
    boardFocusC = c;
    playMoveClick(turn);
    board[r][c] = turn;
    lastPlaced = { r, c };
    afterMove();
  }

  function rematch() {
    boardFocusR = 0;
    boardFocusC = 0;
    board = emptyBoard();
    turn = "X";
    gameOver = false;
    isDraw = false;
    winner = EMPTY;
    lastPlaced = null;
    clearDelight();
    if (mode === "bot" || mode === "llm") {
      taunt = randomTaunt();
    } else {
      taunt = "";
    }
    prevTaunt = "";
    animateBoardEntrance = true;
    renderAll();
    requestAnimationFrame(() => focusFirstInScreen("game"));
    if (mode === "bot" && !humanIsX) {
      scheduleBotMove();
    }
    if (mode === "llm" && !humanIsX) {
      scheduleLLMMove();
    }
  }

  function goMenu() {
    mode = "menu";
    sideFlow = "bot";
    clearDelight();
    showScreen("menu");
  }

  window.addEventListener("resize", () => {
    if (!gameOver || isDraw) return;
    const line = winningLine(board);
    if (line) {
      requestAnimationFrame(() => positionWinLine(line));
    }
  });

  function positionWinLine(line) {
    if (!line || !el.winLine) return;
    const cells = line.map(([r, c]) =>
      el.board.querySelector(`[data-r="${r}"][data-c="${c}"]`)
    );
    if (cells.some((x) => !x)) {
      el.winLine.classList.add("hidden");
      el.winLine.classList.remove("win-line--visible");
      return;
    }
    const wrap = el.boardWrap.getBoundingClientRect();
    const p0 = cells[0].getBoundingClientRect();
    const p2 = cells[2].getBoundingClientRect();
    const x1 = (p0.left + p0.right) / 2 - wrap.left;
    const y1 = (p0.top + p0.bottom) / 2 - wrap.top;
    const x2 = (p2.left + p2.right) / 2 - wrap.left;
    const y2 = (p2.top + p2.bottom) / 2 - wrap.top;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    el.winLine.className = "win-line";
    el.winLine.classList.remove("hidden", "win-line--visible");
    el.winLine.style.width = `${len}px`;
    el.winLine.style.height = "4px";
    el.winLine.style.left = `${x1}px`;
    el.winLine.style.top = `${y1}px`;
    el.winLine.style.transform = `rotate(${ang}rad)`;
    el.winLine.style.transformOrigin = "0 50%";
    el.winLine.style.background =
      "linear-gradient(90deg, transparent, var(--win), transparent)";

    if (prefersReducedMotion()) {
      el.winLine.classList.add("win-line--visible");
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.winLine.classList.add("win-line--visible");
      });
    });
  }

  function renderBoard() {
    el.board.innerHTML = "";
    const line = gameOver && !isDraw ? winningLine(board) : null;
    const winSet = new Set();
    if (line) {
      line.forEach(([r, c]) => winSet.add(`${r},${c}`));
    }

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        const v = board[r][c];
        btn.setAttribute("aria-label", cellAriaLabel(r, c, v));
        if (v === "X") {
          btn.classList.add("mark-x");
          btn.innerHTML = '<span class="mark-inner">X</span>';
        } else if (v === "O") {
          btn.classList.add("mark-o");
          btn.innerHTML = '<span class="mark-inner">O</span>';
        } else {
          btn.innerHTML = '<span class="mark-inner">·</span>';
          btn.style.color = "var(--muted)";
        }
        if (winSet.has(`${r},${c}`)) btn.classList.add("winning");
        if (isCellPlayable(r, c)) {
          btn.removeAttribute("aria-disabled");
        } else {
          btn.setAttribute("aria-disabled", "true");
        }
        btn.addEventListener("click", () => {
          if (!isCellPlayable(r, c)) return;
          playHuman(r, c);
        });
        el.board.appendChild(btn);
      }
    }

    requestAnimationFrame(() => {
      if (line) positionWinLine(line);
      else if (el.winLine) {
        el.winLine.classList.add("hidden");
        el.winLine.classList.remove("win-line--visible");
        el.winLine.style.cssText = "";
      }
    });

    if (animateBoardEntrance && !prefersReducedMotion()) {
      el.board.classList.add("board--intro");
      animateBoardEntrance = false;
      window.setTimeout(() => {
        el.board.classList.remove("board--intro");
      }, 600);
    } else {
      animateBoardEntrance = false;
    }

    if (lastPlaced) {
      const { r, c } = lastPlaced;
      const placed = el.board.querySelector(
        `[data-r="${r}"][data-c="${c}"]`
      );
      if (placed) {
        placed.classList.add("cell--placed");
        window.setTimeout(() => {
          placed.classList.remove("cell--placed");
        }, 280);
      }
      lastPlaced = null;
    }

    applyBoardFocus();
  }

  function renderMeta() {
    if (mode === "local") {
      el.gameMeta.textContent = "Хоёр тоглогч — нэг гарын товчлуур";
      el.tauntWrap.classList.add("hidden");
      prevTaunt = "";
      return;
    }
    if (mode === "bot") {
      if (el.tauntLabel) el.tauntLabel.textContent = "— Бот";
      const side = humanIsX ? "Та X · Бот O" : "Та O · Бот X";
      el.gameMeta.textContent = `${side} · ${difficultyLabel(difficulty)}`;
      el.tauntWrap.classList.remove("hidden");
      const tauntChanged = taunt !== prevTaunt;
      el.tauntText.textContent = taunt;
      if (tauntChanged && taunt) {
        const bubble = el.tauntWrap.querySelector(".taunt-bubble");
        if (bubble && !prefersReducedMotion()) {
          bubble.classList.remove("taunt-bubble--pulse");
          void bubble.offsetWidth;
          bubble.classList.add("taunt-bubble--pulse");
        }
      }
      prevTaunt = taunt;
      return;
    }
    if (mode === "llm") {
      if (el.tauntLabel) el.tauntLabel.textContent = "— LLM";
      const side = humanIsX ? "Та X · LLM O" : "Та O · LLM X";
      el.gameMeta.textContent = `${side} · ${llmProviderTitle(llmProvider)} · ${llmModel}`;
      el.tauntWrap.classList.remove("hidden");
      const tauntChanged = taunt !== prevTaunt;
      el.tauntText.textContent = taunt;
      if (tauntChanged && taunt) {
        const bubble = el.tauntWrap.querySelector(".taunt-bubble");
        if (bubble && !prefersReducedMotion()) {
          bubble.classList.remove("taunt-bubble--pulse");
          void bubble.offsetWidth;
          bubble.classList.add("taunt-bubble--pulse");
        }
      }
      prevTaunt = taunt;
      return;
    }
  }

  function renderStatus() {
    if (gameOver) {
      if (isDraw) {
        el.status.textContent = "Тэнцэл. Самбар дүүрсэн.";
      } else if (mode === "bot") {
        el.status.textContent =
          winner === humanMark() ? "Та яллаа." : "Бот яллаа.";
      } else if (mode === "llm") {
        el.status.textContent =
          winner === humanMark() ? "Та яллаа." : "LLM яллаа.";
      } else {
        el.status.textContent = `Тоглогч ${winner} яллаа.`;
      }
      return;
    }
    if (mode === "local") {
      el.status.textContent = `${turn}-ийн ээлж`;
      return;
    }
    if (turn === humanMark()) {
      el.status.textContent = "Таны ээлж";
    } else {
      el.status.textContent =
        mode === "llm" ? "LLM алхам хийж байна…" : "Бот тоглож байна…";
    }
  }

  function renderAll() {
    renderMeta();
    renderBoard();
    renderStatus();
  }

  function handleMenuKeys(e) {
    const btns = el.menu.querySelectorAll(".menu-btn");
    const n = btns.length;
    if (e.key === "ArrowDown") {
      menuIdxMain = (menuIdxMain + 1) % n;
      applyMenuHighlight();
      btns[menuIdxMain].focus();
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      menuIdxMain = (menuIdxMain - 1 + n) % n;
      applyMenuHighlight();
      btns[menuIdxMain].focus();
      e.preventDefault();
    }
  }

  function handleBotSideKeys(e) {
    const btns = el.botSide.querySelectorAll(".menu-btn");
    const n = btns.length;
    if (e.key === "Escape") {
      if (sideFlow === "llm") showScreen("llmConfig");
      else showScreen("menu");
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      menuIdxSide = (menuIdxSide + 1) % n;
      applyMenuHighlight();
      btns[menuIdxSide].focus();
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      menuIdxSide = (menuIdxSide - 1 + n) % n;
      applyMenuHighlight();
      btns[menuIdxSide].focus();
      e.preventDefault();
    }
  }

  function handleLlmProviderKeys(e) {
    const btns = el.llmProvider.querySelectorAll(".menu-btn");
    const n = btns.length;
    if (e.key === "Escape") {
      showScreen("menu");
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      menuIdxLlmProv = (menuIdxLlmProv + 1) % n;
      applyMenuHighlight();
      btns[menuIdxLlmProv].focus();
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      menuIdxLlmProv = (menuIdxLlmProv - 1 + n) % n;
      applyMenuHighlight();
      btns[menuIdxLlmProv].focus();
      e.preventDefault();
    }
  }

  function handleLlmConfigKeys(e) {
    if (e.key === "Escape") {
      showScreen("llmProvider");
      e.preventDefault();
    }
  }

  function handleDifficultyKeys(e) {
    const btns = el.difficulty.querySelectorAll(".menu-btn");
    const n = btns.length;
    if (e.key === "Escape") {
      showScreen("botSide");
      e.preventDefault();
      return;
    }
    if (e.key === "1" || e.key === "2" || e.key === "3") {
      difficulty = /** @type {1|2|3} */ (parseInt(e.key, 10));
      startBotGame();
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      menuIdxDiff = (menuIdxDiff + 1) % n;
      applyMenuHighlight();
      btns[menuIdxDiff].focus();
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      menuIdxDiff = (menuIdxDiff - 1 + n) % n;
      applyMenuHighlight();
      btns[menuIdxDiff].focus();
      e.preventDefault();
    }
  }

  function handleGameKeys(e) {
    const t = e.target;
    if (
      t &&
      t.classList &&
      t.classList.contains("cell") &&
      el.board.contains(t)
    ) {
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        navigateBoardArrows(e);
        return;
      }
    }
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      rematch();
    }
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      goMenu();
    }
  }

  el.menu.querySelectorAll(".menu-btn").forEach((btn, i) => {
    btn.addEventListener("focus", () => {
      menuIdxMain = i;
      applyMenuHighlight();
    });
    btn.addEventListener("click", () => {
      playSoftClick();
      menuIdxMain = i;
      if (i === 0) startLocal();
      else if (i === 1) {
        sideFlow = "bot";
        showScreen("botSide");
      } else {
        showScreen("llmProvider");
      }
    });
  });

  el.botSide.querySelectorAll(".menu-btn").forEach((btn, i) => {
    btn.addEventListener("focus", () => {
      menuIdxSide = i;
      applyMenuHighlight();
    });
    btn.addEventListener("click", () => {
      playSoftClick();
      menuIdxSide = i;
      if (i === 2) {
        if (sideFlow === "llm") showScreen("llmConfig");
        else showScreen("menu");
        return;
      }
      humanIsX = btn.getAttribute("data-human-x") === "true";
      if (sideFlow === "llm") {
        startLLMGame();
      } else {
        showScreen("difficulty");
      }
    });
  });

  el.llmProvider.querySelectorAll(".menu-btn").forEach((btn, i) => {
    btn.addEventListener("focus", () => {
      menuIdxLlmProv = i;
      applyMenuHighlight();
    });
    btn.addEventListener("click", () => {
      playSoftClick();
      menuIdxLlmProv = i;
      if (btn.getAttribute("data-action") === "back-llm-menu") {
        showScreen("menu");
        return;
      }
      const p = btn.getAttribute("data-llm-provider");
      if (p) {
        llmProvider = /** @type {"egune"|"claude"|"openai"} */ (p);
        if (el.llmProviderTag) el.llmProviderTag.textContent = llmProviderTitle(llmProvider);
        if (el.llmApiKeyInput) el.llmApiKeyInput.value = "";
        if (el.llmModelInput) el.llmModelInput.value = "";
        if (el.llmConfigError) {
          el.llmConfigError.textContent = "";
          el.llmConfigError.classList.add("hidden");
        }
        showScreen("llmConfig");
      }
    });
  });

  if (el.formLlm) {
    el.formLlm.addEventListener("submit", (e) => {
      e.preventDefault();
      const k = el.llmApiKeyInput ? el.llmApiKeyInput.value.trim() : "";
      const m = el.llmModelInput ? el.llmModelInput.value.trim() : "";
      if (!k || !m) {
        if (el.llmConfigError) {
          el.llmConfigError.textContent = "API_KEY болон MODEL заавал.";
          el.llmConfigError.classList.remove("hidden");
        }
        return;
      }
      llmApiKey = k;
      llmModel = m;
      if (el.llmConfigError) {
        el.llmConfigError.textContent = "";
        el.llmConfigError.classList.add("hidden");
      }
      playSoftClick();
      sideFlow = "llm";
      showScreen("botSide");
    });
  }

  const btnLlmBack = document.getElementById("btn-llm-config-back");
  if (btnLlmBack) {
    btnLlmBack.addEventListener("click", () => {
      playSoftClick();
      showScreen("llmProvider");
    });
  }

  el.difficulty.querySelectorAll(".menu-btn").forEach((btn, i) => {
    btn.addEventListener("focus", () => {
      menuIdxDiff = i;
      applyMenuHighlight();
    });
    btn.addEventListener("click", () => {
      playSoftClick();
      menuIdxDiff = i;
      if (i === 3) {
        showScreen("botSide");
        return;
      }
      difficulty = /** @type {1|2|3} */ (parseInt(btn.getAttribute("data-difficulty"), 10));
      startBotGame();
    });
  });

  el.btnRematch.addEventListener("click", () => {
    playSoftClick();
    rematch();
  });
  el.btnMenu.addEventListener("click", () => {
    playSoftClick();
    goMenu();
  });

  el.board.addEventListener("focusin", (e) => {
    const btn = e.target && e.target.closest && e.target.closest(".cell");
    if (!btn || !el.board.contains(btn)) return;
    const r = parseInt(btn.getAttribute("data-r"), 10);
    const c = parseInt(btn.getAttribute("data-c"), 10);
    if (Number.isNaN(r) || Number.isNaN(c)) return;
    boardFocusR = r;
    boardFocusC = c;
    for (let ri = 0; ri < 3; ri++) {
      for (let ci = 0; ci < 3; ci++) {
        const b = el.board.querySelector(`[data-r="${ri}"][data-c="${ci}"]`);
        if (b) b.tabIndex = ri === r && ci === c ? 0 : -1;
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!el.game.hidden) {
      handleGameKeys(e);
      return;
    }
    if (!el.menu.hidden) {
      handleMenuKeys(e);
      return;
    }
    if (!el.botSide.hidden) {
      handleBotSideKeys(e);
      return;
    }
    if (!el.difficulty.hidden) {
      handleDifficultyKeys(e);
      return;
    }
    if (!el.llmProvider.hidden) {
      handleLlmProviderKeys(e);
      return;
    }
    if (!el.llmConfig.hidden) {
      handleLlmConfigKeys(e);
    }
  });

  showScreen("menu");
})();
