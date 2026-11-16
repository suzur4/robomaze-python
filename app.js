/* ロボ迷路 Python — 画面側のプログラム
 *
 * 流れ: 生徒が書いた Python を Pyodide（ブラウザで動く本物の Python）で実行する。
 * robot.py がロボットの動きを記録して返すので、ここではその記録を1つずつ再生する。
 *
 * ステップを足す・迷路を変えるときは、下の STAGES を書きかえる。
 * 迷路の記号: # 壁 / . 通路 / S スタート / G ゴール
 */
"use strict";

const PYODIDE_VERSION = "314.0.8";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const STORE_KEY = "robomaze.v1";

const TOOL = {
  forward: ["前に進む", "forward()"],
  left: ["左を向く", "left()"],
  right: ["右を向く", "right()"],
  open: ["ドアを開ける", "open_door()"],
  for: ["くり返す", "for i in range(3):", true],
  ifdoor: ["もしドアが閉まっていたら", "if not door_is_open():", true],
  dforward: ["進む", "forward(100)"],
  dleft: ["左に回る", "left(90)"],
  dright: ["右に回る", "right(90)"],
  dcolor: ["色を変える", 'color("tomato")'],
  ifeven: ["もし偶数回目なら", "if i % 2 == 0:", true],
  else: ["そうでなければ", "else:", true],
};

const STAGES = [
  {
    id: 1, tab: "順番", kind: "maze",
    kicker: "順次構造　教科書 p.164", hue: "seq",
    title: "命令を上から順に並べる",
    body: `
      <p><code>forward()</code> は「1マス前に進む」という命令です。コンピュータは、書かれた命令を上から1行ずつ実行します。</p>
      <p class="task">今のプログラムでロボットがどこまで進むか、予想してから「実行」を押してください。そのあと、ゴールに届くように行を足しましょう。</p>`,
    map: ["#######", "#S...G#", "#######"],
    tools: ["forward"],
    code: "forward()\nforward()\n",
  },
  {
    id: 2, tab: "くり返し", kind: "maze",
    kicker: "反復構造　教科書 p.164", hue: "loop",
    title: "同じ命令は、くり返しにまとめる",
    body: `
      <p>通路が8マスになりました。<code>forward()</code> を8行書いても進めますが、<code>for</code> を使うと2行で書けます。</p>
      <pre>for i in range(3):   <span class="note">← 3回くり返す。行の終わりは :</span>
    forward()        <span class="note">← くり返す命令は字下げする</span></pre>
      <p class="task">数字を書きかえて、ゴールまで進めましょう。</p>`,
    map: ["###########", "#S.......G#", "###########"],
    tools: ["forward", "for"],
    code: "for i in range(3):\n    forward()\n",
    tip: (f) => (f && f.loops < 1 ? "8行書いてもゴールできます。for を使って2行に書き直してみましょう。" : ""),
  },
  {
    id: 3, tab: "場合分け", kind: "maze", door: true,
    kicker: "選択構造　教科書 p.164〜165", hue: "sel",
    title: "場合によって、することを変える",
    body: `
      <p>ゴールにドアが付きました。ドアは開いていることも閉まっていることもあり、前まで行かないとわかりません。開いているドアを開けようとすると、ロボットは空振りして止まります。</p>
      <p>実行すると、開いている場合と閉まっている場合の両方でテストされます。まず今のプログラムの結果を見てください。</p>
      <pre>if not door_is_open():   <span class="note">← もしドアが開いていなければ</span>
    open_door()          <span class="note">← そのときだけ開ける</span></pre>
      <p class="task">どちらの場合でもゴールできるように直しましょう。教科書 p.165 の例題3と同じルールです。</p>`,
    map: ["########", "#S....##", "#####.##", "#####.##", "#####G##", "########"],
    tools: ["forward", "left", "right", "open", "for", "ifdoor"],
    code: "for i in range(4):\n    forward()\nright()\nforward()\nforward()\nopen_door()\nforward()\n",
  },
  {
    id: 4, tab: "自分で解く", kind: "maze", door: true,
    kicker: "3つの構造を組み合わせる　教科書 p.165 確認問題",
    title: "道順を設計して、自分で書く",
    body: `
      <p>ここからは手本がありません。先に道順を紙に書き（設計）、プログラムにして（コーディング）、実行して確かめます（テスト）。教科書 p.166 の3つの手順です。</p>
      <p class="task">順番・くり返し・場合分けを全部使って、ゴールまで進めましょう。</p>
      <p><code>#</code> から右はメモです。実行されません。</p>`,
    map: ["##########", "#S...#####", "####.#####", "####.....#", "########.#", "########G#", "##########"],
    tools: ["forward", "left", "right", "open", "for", "ifdoor"],
    code: "# ここにプログラムを書こう\n",
    tip: (f) => (f && f.loops < 1 ? "ゴールできました。同じ命令が続くところを for にまとめると、もっと短く書けます。" : ""),
  },
  {
    id: 5, tab: "チャレンジ", kind: "maze", door: true, disabled: ["right"],
    kicker: "チャレンジ　教科書 p.165 確認問題の後半",
    title: "右に向けないロボット",
    body: `
      <p>このロボットは <code>right()</code> が故障していて使えません。</p>
      <p class="task">右を向きたいとき、使える命令だけでどうすればよいか考えて、ゴールまで進めましょう。</p>`,
    map: ["#########", "#S..#####", "###.#####", "###...###", "#####.###", "#####G###", "#########"],
    tools: ["forward", "left", "open", "for", "ifdoor"],
    code: "# right() は使えません\n",
  },
  {
    id: 6, tab: "模様", kind: "draw",
    kicker: "発展",
    title: "マスのない広場で、模様を描く",
    body: `
      <p>ここにはマスがありません。<code>forward(100)</code> は「100 進む」、<code>left(90)</code> は「左に 90° 回る」です。ロボットが通ったあとに線が残ります。</p>
      <p class="task">数字を変えると形が変わります。三角形や星を描いてみましょう。<code>if</code> を使うと、偶数回目だけ色を変えることもできます。</p>`,
    tools: ["dforward", "dleft", "dright", "dcolor", "for", "ifeven", "else"],
    code: "for i in range(4):\n    forward(100)\n    left(90)\n",
    samples: [
      ["正方形", "for i in range(4):\n    forward(100)\n    left(90)\n"],
      ["星", "for i in range(5):\n    forward(160)\n    left(144)\n"],
      ["2色の花", 'for i in range(36):\n    if i % 2 == 0:\n        color("tomato")\n    else:\n        color("royalblue")\n    forward(150)\n    left(170)\n'],
      ["うずまき", "for i in range(60):\n    forward(i * 4)\n    left(91)\n"],
    ],
  },
  {
    id: 7, tab: "フラクタル", kind: "draw",
    kicker: "まとめ",
    title: "短い規則から、複雑な形が生まれる",
    body: `
      <p>このプログラムが使っているのは、これまでと同じ3つの構造です。3つの頂点から1つを乱数で選び（場合分け）、今の場所とその頂点の真ん中に点を打ちます。これを3000回くり返します。</p>
      <p class="task">どんな形になるか、予想してから実行してください。そのあと、3000 を 300 や 20000 に変えてみましょう。</p>
      <p>自動ドアも、自動販売機も、スマホの通知も、中身は順番・くり返し・場合分けの組み合わせです。</p>`,
    tools: [],
    code: "import random\n\nx = 0\ny = 0\nfor i in range(3000):\n    n = random.randint(1, 3)\n    if n == 1:\n        tx = 0\n        ty = 170\n    elif n == 2:\n        tx = -190\n        ty = -160\n    else:\n        tx = 190\n        ty = -160\n    x = (x + tx) / 2\n    y = (y + ty) / 2\n    dot(x, y)\n",
    samples: [
      ["三角形に点を打つ", null],
      ["雪の結晶の線（関数を使う）", "def koch(n, size):\n    if n == 0:\n        forward(size)\n    else:\n        koch(n - 1, size / 3)\n        left(60)\n        koch(n - 1, size / 3)\n        right(120)\n        koch(n - 1, size / 3)\n        left(60)\n        koch(n - 1, size / 3)\n\npen_up()\ngoto(-190, -60)\npen_down()\nkoch(4, 380)\n"],
      ["木（関数を使う）", 'def tree(size):\n    if size < 8:\n        return\n    forward(size)\n    left(25)\n    tree(size * 0.72)\n    right(50)\n    tree(size * 0.72)\n    left(25)\n    back(size)\n\ncolor("seagreen")\npen_up()\ngoto(0, -200)\npen_down()\nleft(90)\ntree(110)\n'],
    ],
  },
];

/* ------------------------------------------------------------------ 保存 */
const store = (() => {
  let data = { code: {}, cleared: {}, last: 1 };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch (e) { /* 保存できない環境でも動かす */ }
  return {
    data,
    save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* 同上 */ } },
  };
})();

/* ------------------------------------------------------------------ 要素 */
const $ = (id) => document.getElementById(id);
const ui = {
  steps: $("steps"), status: $("py-status"), kicker: $("st-kicker"), title: $("st-title"), num: $("st-num"), body: $("st-body"),
  samples: $("samples"), tools: $("tools"), gutter: $("gutter"), hl: $("hl"), code: $("code"),
  run: $("run"), runLabel: $("run-label"), speed: $("speed"), reset: $("reset"),
  world: $("world"), result: $("result"), outBox: $("output-box"), out: $("output"),
  flow: $("flow"), flowNote: $("flow-note"),
};
const SVG = "http://www.w3.org/2000/svg";
function svg(name, attrs, parent) {
  const e = document.createElementNS(SVG, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LH = 26, PAD = 12;

let stage = STAGES[0];
let py = null;            // { run_maze, run_draw, flow }
let runToken = 0;         // 新しい実行が始まったら、前の再生をやめる
let flowInfo = null;      // 直近のフローチャート情報（for や if の数）
let world = null;         // 盤面を動かすための関数のまとまり
let last = null;          // 直近の実行結果

/* ------------------------------------------------------------------ エディタ */
function setCode(text) {
  ui.code.focus();
  ui.code.select();
  // execCommand は「元に戻す」(Ctrl+Z) を残せる。使えない環境では直接入れる。
  let done = false;
  try { done = document.execCommand("insertText", false, text); } catch (e) { done = false; }
  if (!done || ui.code.value !== text) ui.code.value = text;
  ui.code.setSelectionRange(text.length, text.length);
  onEdit();
}
function insertText(text) {
  let done = false;
  try { done = document.execCommand("insertText", false, text); } catch (e) { done = false; }
  if (!done) ui.code.setRangeText(text, ui.code.selectionStart, ui.code.selectionEnd, "end");
}
function refreshGutter() {
  const n = ui.code.value.split("\n").length;
  if (ui.gutter.childElementCount !== n) {
    ui.gutter.textContent = "";
    for (let i = 1; i <= n; i++) ui.gutter.appendChild(h("div", "", String(i)));
  }
  ui.code.style.height = Math.min(Math.max(n + 1, 7), 18) * LH + PAD * 2 + "px";
  ui.gutter.scrollTop = ui.code.scrollTop;
}
let marked = null; // {line, err}
function markLine(line, err) {
  for (const d of ui.gutter.querySelectorAll(".on,.err")) d.classList.remove("on", "err");
  marked = line ? { line, err: !!err } : null;
  if (!line) { ui.hl.hidden = true; }
  else {
    ui.hl.hidden = false;
    ui.hl.classList.toggle("err", !!err);
    const row = ui.gutter.children[line - 1];
    if (row) row.classList.add(err ? "err" : "on");
    const top = PAD + (line - 1) * LH;
    if (top < ui.code.scrollTop || top + LH > ui.code.scrollTop + ui.code.clientHeight) {
      ui.code.scrollTop = Math.max(0, top - LH * 2);
    }
    ui.hl.style.top = top - ui.code.scrollTop + "px";
  }
  for (const s of ui.flow.querySelectorAll(".on")) s.classList.remove("on");
  if (line && !err) for (const s of ui.flow.querySelectorAll(`[data-line="${line}"]`)) s.classList.add("on");
}
let flowTimer = 0;
function onEdit() {
  refreshGutter();
  if (marked) markLine(null);
  store.data.code[stage.id] = ui.code.value;
  store.save();
  clearTimeout(flowTimer);
  flowTimer = setTimeout(updateFlow, 220);
}
ui.code.addEventListener("input", onEdit);
ui.code.addEventListener("scroll", () => {
  ui.gutter.scrollTop = ui.code.scrollTop;
  if (marked) ui.hl.style.top = PAD + (marked.line - 1) * LH - ui.code.scrollTop + "px";
});
ui.code.addEventListener("keydown", (ev) => {
  if (ev.isComposing) return;
  const ta = ui.code, v = ta.value, a = ta.selectionStart, b = ta.selectionEnd;
  if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); run(); return; }
  if (ev.key === "Tab" && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
    ev.preventDefault(); insertText("    "); onEdit(); return;
  }
  if (ev.key === "Enter" && !ev.shiftKey) {
    const ls = v.lastIndexOf("\n", a - 1) + 1;
    const before = v.slice(ls, a);
    let indent = before.match(/^ */)[0];
    if (/:\s*(#.*)?$/.test(before)) indent += "    ";
    ev.preventDefault(); insertText("\n" + indent); onEdit(); return;
  }
  if (ev.key === "Backspace" && a === b) {
    const ls = v.lastIndexOf("\n", a - 1) + 1;
    const before = v.slice(ls, a);
    if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) {
      ev.preventDefault(); ta.setSelectionRange(a - 4, a); insertText(""); onEdit();
    }
  }
});

function insertSnippet(text, opensBlock) {
  const ta = ui.code, v = ta.value, pos = ta.selectionStart;
  const ls = v.lastIndexOf("\n", pos - 1) + 1;
  let le = v.indexOf("\n", pos); if (le < 0) le = v.length;
  const line = v.slice(ls, le);
  const indent = line.match(/^ */)[0];
  ta.focus();
  if (line.trim() === "") {
    ta.setSelectionRange(ls, le);
    insertText(indent + text + (opensBlock ? "\n" + indent + "    " : ""));
  } else {
    const inner = /:\s*(#.*)?$/.test(line) ? indent + "    " : indent;
    const use = text === "else:" ? indent.slice(0, Math.max(0, indent.length - 4)) : inner;
    ta.setSelectionRange(le, le);
    insertText("\n" + use + text + (opensBlock ? "\n" + use + "    " : ""));
  }
  onEdit();
}

/* ------------------------------------------------------------------ Python の準備 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = () => { s.remove(); reject(new Error(src)); };
    document.head.appendChild(s);
  });
}
async function loadRobotSource() {
  // ふつうは robot.py を読む。.py を配れない置き場所では、同じ中身の robot-src.js を使う。
  try {
    const res = await fetch("robot.py");
    if (res.ok) return await res.text();
  } catch (e) { /* 下の方法へ */ }
  await loadScript("robot-src.js");
  if (typeof window.ROBOT_PY !== "string") throw new Error("robot.py が読み込めません");
  return window.ROBOT_PY;
}
async function boot() {
  const t0 = performance.now();
  try {
    let base = new URL("pyodide/", location.href).href;
    try { await loadScript(base + "pyodide.js"); }
    catch (e) { base = PYODIDE_CDN; await loadScript(base + "pyodide.js"); }
    const pyodide = await window.loadPyodide({ indexURL: base });
    pyodide.runPython(await loadRobotSource());
    py = {
      run_maze: pyodide.globals.get("run_maze"),
      run_draw: pyodide.globals.get("run_draw"),
      flow: pyodide.globals.get("flow"),
    };
    const ver = pyodide.runPython("import sys; sys.version.split()[0]");
    const sec = ((performance.now() - t0) / 1000).toFixed(1);
    ui.status.textContent = `Python ${ver} 準備完了（${sec}秒）`;
    ui.status.className = "status ready";
    ui.run.disabled = false;
    ui.runLabel.textContent = "実行";
    updateFlow();
  } catch (e) {
    ui.status.textContent = "Python を読み込めませんでした。通信を確認して、ページを開き直してください。";
    ui.status.className = "status failed";
    ui.runLabel.textContent = "実行できません";
    console.error(e);
  }
}

/* ------------------------------------------------------------------ 迷路の盤面 */
const CELL = 56;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
function buildMaze(st) {
  const rows = st.map, H = rows.length, W = rows[0].length;
  const root = svg("svg", { class: "maze", viewBox: `${CELL * 0.6} ${CELL * 0.6} ${(W - 1.2) * CELL} ${(H - 1.2) * CELL}`, role: "img", "aria-label": "迷路" });
  root.style.maxWidth = (W - 1.2) * CELL + "px";
  let sx = 0, sy = 0, gx = 0, gy = 0;
  const tiles = svg("g", {}, root);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "#") return;
    svg("rect", { class: "tile" + (ch === "S" ? " start" : ch === "G" ? " goal" : ""), x: x * CELL, y: y * CELL, width: CELL, height: CELL }, tiles);
    if (ch === "S") { sx = x; sy = y; }
    if (ch === "G") { gx = x; gy = y; }
  }));
  const cx = (x) => x * CELL + CELL / 2, cy = (y) => y * CELL + CELL / 2;
  svg("text", { class: "cap", x: cx(sx), y: sy * CELL - 5 }, root).textContent = "スタート";
  // ゴールの旗
  const flag = svg("g", { transform: `translate(${cx(gx)},${cy(gy)})` }, root);
  svg("line", { class: "flag-pole", x1: -8, y1: -15, x2: -8, y2: 16 }, flag);
  svg("path", { class: "flag", d: "M-8 -15 L13 -8 L-8 -1 Z" }, flag);
  const trail = svg("g", {}, root);

  // ドア: ゴールと、その手前のマスの境目に置く
  let door = null, ax = -1, ay = -1;
  if (st.door) {
    for (let d = 0; d < 4; d++) {
      const nx = gx + DIRS[d][0], ny = gy + DIRS[d][1];
      if (rows[ny] && rows[ny][nx] && rows[ny][nx] !== "#") { ax = nx; ay = ny; }
    }
    const mx = (cx(gx) + cx(ax)) / 2, my = (cy(gy) + cy(ay)) / 2;
    const L = CELL - 12;
    door = svg("g", { class: "door unknown", transform: `translate(${mx},${my}) rotate(${ax === gx ? 0 : 90})` }, root);
    const hinge = svg("g", { transform: `translate(${-L / 2},0)` }, door);
    const bar = svg("line", { class: "door-bar", x1: 0, y1: 0, x2: L, y2: 0 }, hinge);
    bar.style.transformOrigin = "0 0";
    // 開いたドアは、ゴールのマスの側にたたむ
    const inward = ax === gx ? (gy > ay ? 1 : -1) : (gx < ax ? 1 : -1);
    door.style.setProperty("--swing", inward * 84 + "deg");
    const q = svg("g", { class: "door-q", transform: `rotate(${ax === gx ? 0 : -90})` }, door);
    svg("rect", { class: "door-q-box", x: -10, y: -10, width: 20, height: 20 }, q);
    const qt = svg("text", { class: "door-q-text", "text-anchor": "middle", "dominant-baseline": "central" }, q);
    qt.textContent = "?";
  }
  if (st.disabled && st.disabled.length) {
    svg("text", { class: "broken", x: cx(sx) + 34, y: sy * CELL - 5 }, root).textContent = st.disabled.map((n) => n + "()").join(" ") + " は故障中";
  }

  const robot = svg("g", { class: "robot" }, root);
  robot.style.transformOrigin = "0 0";
  const inner = svg("g", {}, robot);
  svg("rect", { class: "bot-body", x: -19, y: -22, width: 14, height: 6 }, inner);
  svg("rect", { class: "bot-body", x: -19, y: 16, width: 14, height: 6 }, inner);
  svg("rect", { class: "bot-body", x: -17, y: -17, width: 34, height: 34 }, inner);
  svg("rect", { class: "bot-face", x: 3, y: -11, width: 10, height: 22 }, inner);
  svg("rect", { class: "bot-body", x: 6, y: -7, width: 4, height: 5 }, inner);
  svg("rect", { class: "bot-body", x: 6, y: 2, width: 4, height: 5 }, inner);

  const cross = svg("g", { class: "cross" }, root);
  svg("line", { x1: -9, y1: -9, x2: 9, y2: 9 }, cross);
  svg("line", { x1: 9, y1: -9, x2: -9, y2: 9 }, cross);
  const bubble = svg("g", { class: "bubble" }, root);
  const brect = svg("rect", { x: -52, y: -13, width: 104, height: 26 }, bubble);
  const btext = svg("text", { y: 4.5 }, bubble);

  let x = sx, y = sy, ang = (st.dir || 0) * 90, dir = st.dir || 0, doorOpen = false;
  const place = () => { robot.style.transform = `translate(${cx(x)}px, ${cy(y)}px) rotate(${ang}deg)`; };
  const showDoor = () => {
    if (!door) return;
    door.classList.remove("unknown");
    door.classList.toggle("open", doorOpen);
  };
  const api = {
    reset(startOpen) {
      x = sx; y = sy; dir = st.dir || 0; ang = dir * 90; doorOpen = !!startOpen;
      trail.textContent = "";
      cross.classList.remove("show"); bubble.classList.remove("show");
      if (door) { door.classList.add("unknown"); door.classList.remove("open"); }
      robot.style.transition = "none"; place();
      void robot.getBoundingClientRect();
      robot.style.transition = "";
    },
    async play(a, ms) {
      if (a.t === "move") {
        svg("rect", { class: "trail", x: cx(x) - 3, y: cy(y) - 3, width: 6, height: 6 }, trail);
        x = a.x; y = a.y; place();
        await sleep(ms);
        if (x === ax && y === ay) showDoor();
      } else if (a.t === "turn") {
        dir = (dir + a.d + 4) % 4; ang += a.d * 90; place();
        await sleep(ms);
      } else if (a.t === "open") {
        doorOpen = true; showDoor();
        await sleep(ms);
      } else if (a.t === "look") {
        showDoor();
        btext.textContent = a.open ? "ドアは開いている" : "ドアは閉まっている";
        const bw = 118; brect.setAttribute("x", -bw / 2); brect.setAttribute("width", bw);
        const bx = Math.min(Math.max(cx(x), CELL * 0.6 + bw / 2 + 2), (W - 0.6) * CELL - bw / 2 - 2);
        bubble.setAttribute("transform", `translate(${bx},${cy(y) - 36})`);
        bubble.classList.add("show");
        await sleep(Math.max(ms * 1.6, 420));
        bubble.classList.remove("show");
      } else if (a.t === "bump") {
        showDoor();
        if (inner.animate) inner.animate([{ transform: "translateX(0)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }], { duration: 260 });
        cross.setAttribute("transform", `translate(${cx(x) + DIRS[dir][0] * CELL * 0.5},${cy(y) + DIRS[dir][1] * CELL * 0.5})`);
        cross.classList.add("show");
        await sleep(300);
      } else if (a.t === "goal") {
        if (inner.animate) inner.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 420 });
        await sleep(430);
      }
    },
  };
  ui.world.textContent = "";
  ui.world.appendChild(root);
  api.reset(false);
  return api;
}

/* ------------------------------------------------------------------ 模様の広場 */
const PADSIZE = 440;
function buildPad() {
  const pad = h("div", "pad");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "ロボットが描いた模様");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = PADSIZE * dpr; canvas.height = PADSIZE * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  pad.appendChild(canvas);
  const marker = svg("svg", { class: "marker", viewBox: "-11 -11 22 22", "aria-hidden": "true" });
  svg("path", { d: "M9 0 L-7 7 L-3 0 L-7 -7 Z" }, marker);
  pad.appendChild(marker);
  ui.world.textContent = "";
  ui.world.appendChild(pad);

  const X = (x) => PADSIZE / 2 + x, Y = (y) => PADSIZE / 2 - y;
  let px = 0, pyy = 0, ph = 0;
  const place = () => {
    marker.style.left = (X(px) / PADSIZE) * 100 + "%";
    marker.style.top = (Y(pyy) / PADSIZE) * 100 + "%";
    marker.style.transform = `translate(-50%, -50%) rotate(${-ph}deg)`;
  };
  const api = {
    reset() { ctx.clearRect(0, 0, PADSIZE, PADSIZE); px = 0; pyy = 0; ph = 0; place(); },
    draw(a) {
      const t = a[0];
      if (t === "L") {
        ctx.strokeStyle = "#161412"; ctx.strokeStyle = a[5]; ctx.lineWidth = a[6]; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(X(a[1]), Y(a[2])); ctx.lineTo(X(a[3]), Y(a[4])); ctx.stroke();
        px = a[3]; pyy = a[4];
      } else if (t === "M") { px = a[1]; pyy = a[2]; }
      else if (t === "T") { ph = a[1]; }
      else if (t === "D") {
        ctx.fillStyle = "#161412"; ctx.fillStyle = a[3];
        ctx.beginPath(); ctx.arc(X(a[1]), Y(a[2]), a[4] / 2, 0, Math.PI * 2); ctx.fill();
        px = a[1]; pyy = a[2];
      }
    },
    place,
    finish(end) { if (end) { px = end[0]; pyy = end[1]; ph = end[2]; place(); } },
  };
  api.reset();
  return api;
}

/* ------------------------------------------------------------------ 実行と再生 */
const DOOR_TEXT = { closed: "閉まっている", open: "開いている" };

async function run() {
  if (!py) return;
  const token = ++runToken;
  const code = ui.code.value;
  markLine(null);
  updateFlow();
  ui.outBox.hidden = true;
  if (stage.kind === "maze") {
    const sj = JSON.stringify({ map: stage.map, door: !!stage.door, disabled: stage.disabled || [], dir: stage.dir || 0 });
    const results = {};
    if (stage.door) {
      results.closed = JSON.parse(py.run_maze(code, sj, false));
      results.open = JSON.parse(py.run_maze(code, sj, true));
    } else {
      results.only = JSON.parse(py.run_maze(code, sj, false));
    }
    const keys = Object.keys(results);
    const shown = keys[Math.floor(Math.random() * keys.length)];
    last = { results, shown };
    await showCase(shown, token);
  } else {
    const res = JSON.parse(py.run_draw(code));
    last = { results: { only: res }, shown: "only" };
    setResult("idle", [h("p", "", "実行中")]);
    await replayDraw(res, token);
    if (token !== runToken) return;
    finishRun();
  }
}

async function showCase(key, token) {
  last.shown = key;
  const res = last.results[key];
  const label = stage.door ? `ドアが${DOOR_TEXT[key]}場合を実行中` : "実行中";
  setResult("idle", [h("p", "", label)]);
  world.reset(res.doorStart);
  await sleep(160);
  const ms = Number(ui.speed.value);
  document.documentElement.style.setProperty("--dur", Math.round(ms * 0.9) + "ms");
  for (const a of res.actions) {
    if (token !== runToken) return;
    markLine(a.line);
    await world.play(a, ms);
  }
  if (token !== runToken) return;
  finishRun();
}

async function replayDraw(res, token) {
  world.reset();
  const acts = res.actions, n = acts.length;
  const ms = Number(ui.speed.value);
  if (n <= 80) {
    for (const a of acts) {
      if (token !== runToken) return;
      markLine(a[a.length - 1]);
      world.draw(a); world.place();
      await sleep(Math.max(30, ms * 0.45));
    }
  } else {
    const total = ms >= 600 ? 9000 : ms >= 300 ? 4500 : 1500;
    const per = Math.max(1, Math.ceil(n / (total / 16.7)));
    for (let i = 0; i < n; i += per) {
      if (token !== runToken) return;
      const end = Math.min(n, i + per);
      for (let j = i; j < end; j++) world.draw(acts[j]);
      world.place();
      markLine(acts[end - 1][acts[end - 1].length - 1]);
      await new Promise((r) => requestAnimationFrame(r));
    }
  }
  world.finish(res.end);
}

function setResult(cls, children) {
  ui.result.className = "result " + cls;
  ui.result.textContent = "";
  for (const c of children) if (c) ui.result.appendChild(c);
}
function errorBlock(res) {
  const out = [];
  const head = h("p", "head");
  if (res.status === "short") {
    head.appendChild(h("span", "badge logic", "論理エラー"));
    head.appendChild(document.createTextNode("ゴールに届いていません"));
    out.push(head, h("p", "", "最後の行まで実行しましたが、ロボットはまだ途中にいます。命令を足しましょう。"));
    out.push(h("p", "sub", "論理エラーは、実行はできたのに結果が目的と違う状態です（教科書 p.166）。"));
    return out;
  }
  const er = res.error;
  const name = er.kind === "syntax" ? "文法エラー" : er.kind === "logic" ? "論理エラー" : "エラー";
  head.appendChild(h("span", "badge " + er.kind, name));
  head.appendChild(document.createTextNode(er.line ? `${er.line}行目` : "プログラム"));
  out.push(head, h("p", "", er.message));
  if (er.raw) out.push(h("p", "raw", er.raw));
  if (er.kind === "syntax") out.push(h("p", "sub", "文法エラーは、書き方の間違いでプログラムが正しく実行できない状態です（教科書 p.166）。"));
  if (er.kind === "logic") out.push(h("p", "sub", "論理エラーは、実行はできたのに結果が目的と違う状態です（教科書 p.166）。"));
  return out;
}
function caseLine(res) {
  if (res.status === "goal") return "ゴールできた";
  if (res.status === "short") return "ゴールに届かなかった";
  const why = res.error.message.split("。")[0];
  return res.error.line ? `${res.error.line}行目で止まった（${why}）` : why;
}

function finishRun() {
  const { results, shown } = last;
  const res = results[shown];
  if (res.output) { ui.out.textContent = res.output; ui.outBox.hidden = false; }
  if (res.error && res.error.line) markLine(res.error.line, true); else markLine(null);

  if (stage.kind === "draw") {
    if (res.status === "done") {
      const lines = res.actions.filter((a) => a[0] === "L").length, dots = res.actions.filter((a) => a[0] === "D").length;
      const what = [lines ? `線 ${lines} 本` : "", dots ? `点 ${dots} 個` : ""].filter(Boolean).join("、") || "何も描かれていません";
      setResult("ok", [h("p", "head", "最後まで実行できました"), h("p", "", what), nextButton()]);
      markCleared();
    } else setResult("bad", errorBlock(res));
    return;
  }

  const keys = Object.keys(results);
  const allPass = keys.every((k) => results[k].status === "goal");
  const kids = [];
  let cls = "bad";
  if (allPass) {
    cls = "ok";
    kids.push(h("p", "head", stage.door ? "クリア。開いていても閉まっていても、ゴールできました" : "ゴール。クリアです"));
    const tip = stage.tip ? stage.tip(flowInfo) : "";
    if (tip) kids.push(h("p", "", tip));
  } else if (res.status === "goal") {
    cls = "half";
    const other = keys.find((k) => k !== shown);
    kids.push(h("p", "head", `今回はゴールできました。でも、ドアが${DOOR_TEXT[other]}場合は失敗します`));
  } else {
    kids.push(...errorBlock(res));
  }
  if (stage.door) {
    const ul = h("ul", "cases");
    for (const k of ["closed", "open"]) {
      const r = results[k], li = h("li");
      li.appendChild(h("span", "mark " + (r.status === "goal" ? "pass" : "fail"), r.status === "goal" ? "○" : "×"));
      const txt = h("span", "", `ドアが${DOOR_TEXT[k]}場合: ${caseLine(r)}`);
      li.appendChild(txt);
      if (r.actions.length) {
        const b = h("button", "btn small", k === shown ? "もう一度見る" : "この場合を見る");
        b.type = "button";
        b.addEventListener("click", () => showCase(k, ++runToken));
        txt.appendChild(b);
      }
      ul.appendChild(li);
    }
    kids.push(ul);
  }
  if (allPass) { kids.push(nextButton()); markCleared(); }
  setResult(cls, kids);
}
function nextButton() {
  const i = STAGES.indexOf(stage);
  if (i >= STAGES.length - 1) return null;
  const wrap = h("div", "actions");
  const b = h("button", "btn next", "次のステップへ");
  b.type = "button";
  b.addEventListener("click", () => openStage(STAGES[i + 1].id, true));
  wrap.appendChild(b);
  return wrap;
}
function markCleared() {
  if (store.data.cleared[stage.id]) return;
  store.data.cleared[stage.id] = true;
  store.save();
  renderSteps();
}

/* ------------------------------------------------------------------ フローチャート */
const FC = { G: 18, H: 34, DH: 48 };
function textW(s) { let w = 0; for (const ch of s) w += ch.charCodeAt(0) > 0xff ? 12.6 : 7.1; return w; }
function boxW(s) { return Math.min(Math.max(textW(s) + 30, 124), 250); }
function fit(s, w) {
  if (textW(s) <= w - 16) return s;
  let out = "";
  for (const ch of s) { if (textW(out + ch + "…") > w - 16) break; out += ch; }
  return out + "…";
}
function fcLine(g, pts, arrow) {
  const e = svg("polyline", { class: "fc-line", points: pts.map((p) => p.join(",")).join(" ") }, g);
  if (arrow) e.setAttribute("marker-end", "url(#fc-arrow)");
}
function fcText(g, x, y, s, w, n) {
  const t = svg("text", { class: "fc-text k-" + ((n && n.k) || "proc"), x, y }, g);
  if (n && n.line) t.dataset.line = n.line;
  t.textContent = fit(s, w);
}
function fcLeaf(n) {
  const w = boxW(n.text), H = FC.H;
  return {
    l: w / 2, r: w / 2, h: H,
    draw(g, x, y) {
      let e;
      if (n.k === "io") e = svg("polygon", { points: `${x - w / 2 + 10},${y} ${x + w / 2},${y} ${x + w / 2 - 10},${y + H} ${x - w / 2},${y + H}` }, g);
      else e = svg("rect", { x: x - w / 2, y, width: w, height: H, rx: n.k === "term" ? H / 2 : 2 }, g);
      e.setAttribute("class", "fc-shape k-" + n.k);
      if (n.line) e.dataset.line = n.line;
      if (n.k === "def") {
        fcLine(g, [[x - w / 2 + 8, y], [x - w / 2 + 8, y + H]]);
        fcLine(g, [[x + w / 2 - 8, y], [x + w / 2 - 8, y + H]]);
      }
      fcText(g, x, y + H / 2, n.text, w - (n.k === "def" ? 12 : 0), n);
    },
  };
}
function fcSeq(nodes) {
  const items = nodes.map(fcNode);
  let hh = 0, l = 0, r = 0;
  items.forEach((it, i) => { hh += it.h + (i ? FC.G : 0); l = Math.max(l, it.l); r = Math.max(r, it.r); });
  return {
    l, r, h: hh,
    draw(g, x, y) {
      let cy = y;
      items.forEach((it, i) => {
        if (i) fcLine(g, [[x, cy - FC.G], [x, cy]]);
        it.draw(g, x, cy);
        cy += it.h + FC.G;
      });
    },
  };
}
function fcLoop(n) {
  const body = fcSeq(n.body), w = boxW(n.text), H = FC.H, G = FC.G, c = 10;
  const hh = H + G + (body.h ? body.h + G : 0) + H;
  return {
    l: Math.max(w / 2, body.l), r: Math.max(w / 2, body.r), h: hh,
    draw(g, x, y) {
      const a = x - w / 2, b = x + w / 2;
      const top = svg("polygon", { class: "fc-shape k-loop", points: `${a + c},${y} ${b - c},${y} ${b},${y + c} ${b},${y + H} ${a},${y + H} ${a},${y + c}` }, g);
      top.dataset.line = n.line;
      fcText(g, x, y + H / 2 + 1, n.text, w, n);
      fcLine(g, [[x, y + H], [x, y + H + G]]);
      let cy = y + H + G;
      if (body.h) { body.draw(g, x, cy); cy += body.h; fcLine(g, [[x, cy], [x, cy + G]]); cy += G; }
      svg("polygon", { class: "fc-shape k-loop", points: `${a},${cy} ${b},${cy} ${b},${cy + H - c} ${b - c},${cy + H} ${a + c},${cy + H} ${a},${cy + H - c}` }, g);
    },
  };
}
function fcIf(n) {
  const yes = fcSeq(n.yes), no = fcSeq(n.no), G = FC.G, DH = FC.DH;
  const dw = Math.min(Math.max(textW(n.text) + 64, 150), 270);
  const inner = Math.max(yes.h, no.h);
  const hh = DH + G + inner + G;
  const off = Math.max(dw / 2, yes.r) + 26 + (no.h ? no.l : 0);
  return {
    l: Math.max(dw / 2, yes.l), r: off + (no.h ? no.r : 6), h: hh,
    draw(g, x, y) {
      const d = svg("polygon", { class: "fc-shape k-if", points: `${x},${y} ${x + dw / 2},${y + DH / 2} ${x},${y + DH} ${x - dw / 2},${y + DH / 2}` }, g);
      d.dataset.line = n.line;
      fcText(g, x, y + DH / 2, n.text, dw - 44, n);
      svg("text", { class: "fc-yn", x: x + 6, y: y + DH + 13 }, g).textContent = "Yes";
      svg("text", { class: "fc-yn", x: x + dw / 2 + 3, y: y + DH / 2 - 6 }, g).textContent = "No";
      const top = y + DH + G, my = y + hh - 7;
      fcLine(g, [[x, y + DH], [x, top]]);
      if (yes.h) yes.draw(g, x, top);
      fcLine(g, [[x, top + yes.h], [x, y + hh]]);
      const bx = x + off;
      if (no.h) {
        fcLine(g, [[x + dw / 2, y + DH / 2], [bx, y + DH / 2], [bx, top]]);
        no.draw(g, bx, top);
        fcLine(g, [[bx, top + no.h], [bx, my], [x + 1, my]], true);
      } else {
        fcLine(g, [[x + dw / 2, y + DH / 2], [bx, y + DH / 2], [bx, my], [x + 1, my]], true);
      }
    },
  };
}
function fcNode(n) { return n.k === "loop" ? fcLoop(n) : n.k === "if" ? fcIf(n) : fcLeaf(n); }

function renderFlow(nodes) {
  const seq = fcSeq([{ k: "term", text: "開始" }, ...nodes, { k: "term", text: "終了" }]);
  const pad = 12, W = seq.l + seq.r + pad * 2, Hh = seq.h + pad * 2;
  const root = svg("svg", { width: W, height: Hh, viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "プログラムのフローチャート" });
  const defs = svg("defs", {}, root);
  const mk = svg("marker", { id: "fc-arrow", viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: "auto" }, defs);
  svg("path", { class: "fc-head", d: "M0 0 L8 4 L0 8 Z" }, mk);
  seq.draw(root, pad + seq.l, pad);
  ui.flow.textContent = "";
  ui.flow.appendChild(root);
}
function updateFlow() {
  if (!py) { ui.flowNote.textContent = "Python の準備ができると表示されます。"; return; }
  let info;
  try { info = JSON.parse(py.flow(ui.code.value, stage.kind)); } catch (e) { return; }
  if (info.ok) {
    flowInfo = info;
    renderFlow(info.nodes);
    ui.flow.classList.remove("stale");
    ui.flowNote.textContent = "プログラムを書きかえると、図も変わります。";
  } else {
    ui.flow.classList.add("stale");
    ui.flowNote.textContent = `書きかけです（${info.line || "?"}行目あたり）。直すと図が更新されます。`;
  }
}

/* ------------------------------------------------------------------ ステップの切りかえ */
function renderSteps() {
  ui.steps.textContent = "";
  for (const s of STAGES) {
    const b = h("button", "step" + (s === stage ? " current" : "") + (store.data.cleared[s.id] ? " cleared" : ""));
    b.type = "button";
    b.appendChild(h("span", "num", store.data.cleared[s.id] ? "✓" : String(s.id)));
    b.appendChild(h("span", "", s.tab));
    if (s.hue) b.dataset.hue = s.hue;
    if (s === stage) b.setAttribute("aria-current", "step");
    b.setAttribute("aria-label", `ステップ${s.id} ${s.tab}${store.data.cleared[s.id] ? "（クリア済み）" : ""}`);
    b.addEventListener("click", () => openStage(s.id, true));
    ui.steps.appendChild(b);
  }
}
function openStage(id, setHash) {
  stage = STAGES.find((s) => s.id === id) || STAGES[0];
  runToken++;
  last = null; flowInfo = null;
  store.data.last = stage.id; store.save();
  if (setHash && location.hash !== "#step-" + stage.id) { try { history.replaceState(null, "", "#step-" + stage.id); } catch (e) { location.hash = "step-" + stage.id; } }
  renderSteps();
  ui.num.textContent = stage.id;
  ui.kicker.textContent = stage.kicker;
  ui.title.textContent = stage.title;
  ui.body.innerHTML = stage.body; // STAGES に書いた自前の文だけを入れる

  ui.tools.textContent = "";
  if (stage.tools.length) ui.tools.appendChild(h("span", "label", "命令を入れる"));
  for (const key of stage.tools) {
    const [ja, code, block] = TOOL[key];
    const b = h("button", "chip" + (key === "for" ? " k-loop" : /^if|^else/.test(key) ? " k-sel" : "")); b.type = "button";
    b.appendChild(h("b", "", ja)); b.appendChild(h("span", "", code));
    b.addEventListener("click", () => insertSnippet(code, block));
    ui.tools.appendChild(b);
  }
  ui.tools.hidden = !stage.tools.length;

  ui.samples.textContent = "";
  ui.samples.hidden = !stage.samples;
  if (stage.samples) {
    ui.samples.appendChild(h("span", "label", "見本を入れる"));
    for (const [name, code] of stage.samples) {
      const b = h("button", "chip sample", name); b.type = "button";
      b.addEventListener("click", () => setCode(code == null ? stage.code : code));
      ui.samples.appendChild(b);
    }
  }

  world = stage.kind === "maze" ? buildMaze(stage) : buildPad();
  const saved = store.data.code[stage.id];
  ui.code.value = saved != null ? saved : stage.code;
  ui.code.scrollTop = 0;
  markLine(null);
  refreshGutter();
  ui.outBox.hidden = true;
  setResult("idle", [h("p", "", "「実行」を押すと、ここに結果が出ます。")]);
  updateFlow();
}

ui.run.addEventListener("click", run);
ui.reset.addEventListener("click", () => setCode(stage.code));
window.addEventListener("hashchange", () => {
  const m = location.hash.match(/^#step-(\d+)$/);
  if (m && Number(m[1]) !== stage.id) openStage(Number(m[1]), false);
});

(function init() {
  const m = location.hash.match(/^#step-(\d+)$/);
  openStage(m ? Number(m[1]) : store.data.last || 1, false);
  boot();
})();
