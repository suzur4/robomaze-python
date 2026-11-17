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
  print: ["表示する", "print()"],
  forr: ["くり返す（範囲）", "for i in range(1, 10):", true],
  ifodd: ["もし奇数なら", "if i % 2 == 1:", true],
  elif: ["そうでなくもし", "elif i % 5 == 0:", true],
  ifbig: ["もし a が大きければ", "if a > b:", true],
  ret: ["値を返す", "return a"],
  call: ["step を呼ぶ", "step()"],
};

const STAGES = [
  {
    id: 1, tab: "順番", kind: "maze", predict: true,
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
    id: 2, tab: "くり返し", kind: "maze", predict: true,
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
      <pre>if not door_is_open():  <span class="note">← 開いていなければ</span>
    open_door()         <span class="note">← そのときだけ開ける</span></pre>
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
      <p class="task">順番・くり返し・場合分けを使って、ゴールまで進めましょう。くり返しが使えるところは for にまとめます。</p>
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

/* 第2〜6時のステップ。kind: "trace" は、変数の箱の中身を1行ずつ見せる。
 * check(r) は [クリアか, 表示する文] を返す。r.num("a") は変数 a の数、r.list("a") はリスト、r.lines は表示された行。 */
const CODES = "codes = [10001, 10002, 10003, 10004, 10005, 10006, 10007, 10008, 10009, 10010]\nstock = [87, 89, 52, 120, 119, 67, 104, 121, 82, 82]\n";
const fizz = (n) => (n % 15 === 0 ? "fizzbuzz" : n % 3 === 0 ? "fizz" : n % 5 === 0 ? "buzz" : String(n));
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

STAGES.push(
  /* ---------------- 第2時 変数 */
  {
    id: "2-1", lesson: 2, tab: "変数", kind: "trace",
    kicker: "変数と代入　教科書 p.168 例題1",
    title: "数を箱に入れて、計算する",
    body: `
      <p>変数は、値を入れておく箱です。<code>a = 7</code> は「箱 a に 7 を入れる」という命令で、数学の「等しい」とは意味がちがいます。</p>
      <p>実行すると、右の欄で箱の中身が1行ずつ変わります。</p>
      <p class="task">今は足し算です。教科書 p.168 の確認問題のように、かけ算の結果を表示するように直しましょう。かけ算の記号は <code>*</code> です。</p>`,
    tools: ["print"],
    code: "a = 7\nb = 4\nanswer = a + b\nprint(answer)\n",
    check: (r) => {
      const a = r.num("a"), b = r.num("b"), ans = r.num("answer");
      if (ans === a * b && r.lines.includes(String(ans))) return [true, `${a} × ${b} = ${ans} です。a と b の数を変えても、answer はかけ算の結果になります。`];
      if (ans === a + b) return [false, "まだ足し算です。3行目の + を * に変えてみよう。"];
      return [false, "answer が a × b になっていません。3行目と4行目を確かめよう。"];
    },
  },
  {
    id: "2-2", lesson: 2, tab: "代入", kind: "trace",
    kicker: "代入は右から左へ　教科書 p.168 側注",
    title: "x = x + 1 の意味",
    body: `
      <p><code>x = x + 1</code> は、「今の x に 1 を足して、また x に入れる」という命令です。右側を先に計算して、左の箱に入れます。</p>
      <p class="task">何が表示されるか予想してから実行しましょう。そのあと、最後に表示される数が 10 になるように直しましょう。</p>`,
    tools: ["print"],
    code: "x = 1\nx = x + 1\nx = x + 1\nprint(x)\n",
    check: (r) => {
      const x = r.num("x");
      if (x === 10 && r.lines.includes("10")) return [true, "右の欄の「1行もどる」で、x がどう増えたかを確かめよう。同じ行を何回も書いた人は、第3時の for で短くできます。"];
      return [false, `最後の x は ${x} です。10 になるように直そう。`];
    },
  },
  {
    id: "2-3", lesson: 2, tab: "エラー", kind: "trace",
    kicker: "文法エラーと論理エラー　教科書 p.166",
    title: "エラーを直す",
    body: `
      <p>60点と80点の平均を求めるプログラムです。でも、このままでは動きません。</p>
      <p>まず実行して、何行目でどんなエラーが出るかを読みましょう。直して動いたら、答えが正しいかも確かめます。</p>
      <p class="task">平均の 70.0 が表示されるように直しましょう。直すところは2つあります（わり算の答えは 70.0 のように小数で表示されます）。</p>`,
    tools: [],
    code: "a = 60\nb = 80\naverage = a + b / 2\nprint(averge)\n",
    check: (r) => {
      const av = r.num("average");
      if (av === 70) return [true, "1つ目は文法エラー（つづりの間違い）、2つ目は論理エラー（計算の順序）でした。わり算は、足し算より先に計算されます。"];
      if (av === 100) return [false, "動くようになりましたが、答えが 100 です。これが論理エラーです。どこから先に計算されているでしょう。"];
      return [false, `average は ${av} です。70 になるように直そう。`];
    },
  },

  /* ---------------- 第3時 分岐と反復 */
  {
    id: "3-1", lesson: 3, tab: "約数", kind: "trace", hue: "sel",
    kicker: "選択構造のプログラム　教科書 p.169 例題2",
    title: "約数かどうかを判定する",
    body: `
      <p><code>%</code> は、わり算の余りを求める記号です（教科書の Mod）。<code>131 % 7</code> は、131 を 7 で割った余りです。</p>
      <p>余りが 0 なら約数、そうでなければ約数ではありません。</p>
      <p class="task">a を 91 に変えて、91 の約数になる b を、1 と 91 以外で見つけましょう。</p>`,
    tools: ["print"],
    code: "a = 131\nb = 5\nrmndr = a % b\nif rmndr == 0:\n    print(\"約数である\")\nelse:\n    print(\"約数ではない\")\n",
    check: (r) => {
      const a = r.num("a"), b = r.num("b");
      if (a !== 91) return [false, "まず1行目の a を 91 にしよう。そのあと b を変えて試します。"];
      if (r.num("rmndr") === 0 && b !== 1 && b !== 91) return [true, `91 は ${b} で割り切れます。91 = 7 × 13 です。`];
      return [false, `91 を ${b} で割った余りは ${r.num("rmndr")} です。b の数を変えて試そう。`];
    },
  },
  {
    id: "3-2", lesson: 3, tab: "九九", kind: "trace", hue: "loop",
    kicker: "反復構造のプログラム　教科書 p.170 例題3",
    title: "九九の7の段を表示する",
    body: `
      <p><code>range(1, 10)</code> は 1 から 9 までです。最後の 10 は入りません。i は、くり返すたびに 1 ずつ増えます。</p>
      <p class="task">教科書 p.171 確認問題(1) のように、7 × 奇数の結果（7, 21, 35, 49, 63）だけを表示するように直しましょう。</p>`,
    tools: ["forr", "ifodd", "print"],
    code: "for i in range(1, 10):\n    print(7 * i)\n",
    check: (r) => {
      if (same(r.lines, ["7", "21", "35", "49", "63"])) return [true, "if で奇数だけを選ぶ方法と、range(1, 10, 2) で 2 ずつ増やす方法があります。どちらで書きましたか。"];
      return [false, `表示されたのは ${r.lines.join(", ") || "何もなし"} です。`];
    },
  },
  {
    id: "3-3", lesson: 3, tab: "合計", kind: "trace", hue: "loop",
    kicker: "くり返しで足していく　教科書 p.180 章末問題1",
    title: "1から10までの和を求める",
    body: `
      <p>変数 total に、i を1つずつ足していくプログラムです。でも、何かが足りません。</p>
      <p class="task">表示が 55 になるように、3行目を直しましょう。右の欄で、total が増えていく様子も確かめます。</p>`,
    tools: ["print"],
    code: "total = 0\nfor i in range(1, 11):\n    total = total\nprint(total)\n",
    check: (r) => {
      if (r.num("total") === 55) return [true, "total = total + i で、くり返すたびに i が足されました。第2時の x = x + 1 と同じ考え方です。"];
      return [false, `total は ${r.num("total")} です。3行目で、total に i を足していますか。`];
    },
  },
  {
    id: "3-4", lesson: 3, tab: "チャレンジ", kind: "trace", hue: "sel",
    kicker: "チャレンジ　教科書 p.181 章末問題7",
    title: "3の倍数と5の倍数",
    body: `
      <p>1 から 15 までの数を順に表示します。3 の倍数のときは fizz、5 の倍数のときは buzz、3 と 5 の両方の倍数のときは fizzbuzz と表示します。</p>
      <p class="task">今は fizz しか出ません。buzz と fizzbuzz も出るように直しましょう。どの条件を先に調べるかがポイントです。</p>`,
    tools: ["elif", "else", "print"],
    code: "for i in range(1, 16):\n    if i % 3 == 0:\n        print(\"fizz\")\n    else:\n        print(i)\n",
    check: (r) => {
      const want = Array.from({ length: 15 }, (_, i) => fizz(i + 1));
      if (same(r.lines, want)) return [true, "15 は fizzbuzz になりました。条件を調べる順番で、結果が変わります。"];
      const bad = want.findIndex((w, i) => r.lines[i] !== w);
      return [false, bad < 0 ? "表示の行の数がちがいます。" : `${bad + 1} のところが「${r.lines[bad] ?? "なし"}」になっています。正しくは「${want[bad]}」です。`];
    },
  },

  /* ---------------- 第4時 リストと関数 */
  {
    id: "4-1", lesson: 4, tab: "リスト", kind: "trace",
    kicker: "配列（リスト）　教科書 p.171 例題4",
    title: "九九の7の段をリストに入れる",
    body: `
      <p>リストは、変数をいくつも並べて1つの名前を付けたものです（教科書の配列）。<code>a[4]</code> のかっこの中の数を添字といい、Python では 0 から数えます。</p>
      <p class="task">a[4] が何か予想してから実行しましょう。そのあと、49 が表示されるように最後の行を直しましょう。</p>`,
    tools: ["print"],
    code: "a = []\nfor i in range(1, 10):\n    a.append(7 * i)\nprint(a[4])\n",
    check: (r) => {
      if (r.lines.at(-1) === "49") return [true, "49 は a[6] です。教科書の表計算ソフトのマクロでは a(7) で、言語によって数え始めがちがいます（教科書 p.171 側注）。"];
      return [false, `表示されたのは ${r.lines.at(-1) ?? "なし"} です。右の欄で、49 の下にある添字を見てみよう。`];
    },
  },
  {
    id: "4-2", lesson: 4, tab: "関数", kind: "trace",
    kicker: "関数の定義　教科書 p.172〜173 例題2",
    title: "関数を作って使う",
    body: `
      <p>関数は、ひとまとまりの処理に名前を付けたものです。引数を受け取り、処理をして、戻り値を返します（教科書 p.172 図1）。</p>
      <p>myround は、教科書の例題2と同じく、0.5 を足して小数点以下を切り捨てます。</p>
      <p class="task">7.4 と 7.5 がどうなるか確かめましょう。そのあと、2つの数の大きいほうを返す関数 bigger を完成させましょう。</p>`,
    tools: ["ifbig", "else", "ret"],
    code: "def myround(x):\n    y = x + 0.5\n    return int(y)\n\ndef bigger(a, b):\n    return a\n\nprint(myround(7.4))\nprint(myround(7.5))\nprint(bigger(3, 8))\nprint(bigger(9, 2))\n",
    check: (r) => {
      if (same(r.lines, ["7", "8", "8", "9"])) return [true, "1つの関数を、引数を変えて何度も使えました。関数の中の変数（a や y）は、関数の外の変数とは別の箱です（教科書 p.173 ローカル変数）。"];
      if (r.lines.includes("None")) return [false, "None（何もない）が表示されました。関数の中で print していませんか。結果は print ではなく return で返します。"];
      const got = r.lines.slice(2);
      if (same(got, ["3", "9"])) return [false, "bigger が、いつも a を返しています。b のほうが大きいときは b を返すように、if を使って直そう。"];
      return [false, `bigger の結果が ${got.join(" と ") || "なし"} です。8 と 9 になるように、if を使って直そう。`];
    },
  },
  {
    id: "4-3", lesson: 4, tab: "関数で迷路", kind: "maze",
    kicker: "関数を迷路に使う",
    title: "同じ動きに名前を付ける",
    body: `
      <p>この迷路は、同じ動きが階段のようにくり返されます。<code>def step():</code> で、その動きに step という名前を付けました。</p>
      <p class="task">関数 step を使って、ゴールまで進めましょう。ゴールに着いたら、そこで止まらないといけません。step を何回呼べばよいか、最後に何が足りないかを考えます。</p>`,
    map: ["########", "#S.#####", "##..####", "###..###", "####..##", "#####G##", "########"],
    tools: ["forward", "left", "right", "for", "call"],
    code: "def step():\n    forward()\n    right()\n    forward()\n    left()\n\nstep()\n",
    need: (code) => (/^\s*def\s+step\b/m.test(code) && /^\s*step\(\)/m.test(code) ? "" : "ゴールできましたが、関数 step を作って呼び出していません。step を使って書き直してみよう。"),
  },

  /* ---------------- 第5時 探索 */
  {
    id: "5-1", lesson: 5, tab: "線形探索", kind: "trace", pointers: ["i"],
    kicker: "線形探索　教科書 p.174 例題1",
    title: "前から順に探す",
    body: `
      <p>商品番号のリスト codes から、target と同じ番号を前から1つずつ探します。見つかったら、同じ位置の在庫数 stock を表示します。</p>
      <p>comp は、番号を比べた回数（計算量）です。</p>
      <p class="task">target を 10001、10005 に変えて、比べた回数を記録しましょう。最後に、リストにない番号 10011 を探すとどうなるか確かめます。</p>`,
    tools: ["print"],
    code: CODES + "target = 10010\ncomp = 0\ni = 0\nfound = False\nwhile not found and i < len(codes):\n    comp = comp + 1\n    if codes[i] == target:\n        found = True\n    else:\n        i = i + 1\nif found:\n    print(\"在庫数\", stock[i])\nprint(\"比べた回数\", comp)\n",
    check: (r) => {
      const t = r.num("target"), comp = r.num("comp");
      if (Number.isNaN(t) || Number.isNaN(comp) || !r.list("codes").length) return [false, "target、comp、codes のどれかがなくなっています。「最初のプログラムに戻す」で戻してから試そう。"];
      if (!r.list("codes").includes(t)) return [true, `見つからないときは、最後まで ${comp} 回比べました。データが多いほど、時間がかかります。`];
      return [false, `${t} は ${comp} 回で見つかりました。ほかの番号でも試し、最後にリストにない番号を探そう。`];
    },
  },
  {
    id: "5-2", lesson: 5, tab: "二分探索", kind: "trace", pointers: ["imin", "imid", "imax"],
    kicker: "二分探索　教科書 p.175 例題2",
    title: "真ん中で半分に分けて探す",
    body: `
      <p>リストが小さい順に並んでいるときは、真ん中を見て、探す範囲を半分ずつにしぼれます。imin と imax が探す範囲、imid が真ん中です。<code>//</code> は、わり算の商（整数）を求める記号です。</p>
      <p class="task">10009 が何回で見つかるか予想してから実行しましょう。そのあと、10001 でも試し、線形探索の回数とくらべましょう。</p>`,
    tools: ["print"],
    code: CODES + "target = 10009\ncomp = 0\nimin = 0\nimax = len(codes) - 1\nfound = False\nwhile not found and imin <= imax:\n    imid = (imin + imax) // 2\n    comp = comp + 1\n    if codes[imid] == target:\n        found = True\n    elif codes[imid] < target:\n        imin = imid + 1\n    else:\n        imax = imid - 1\nif found:\n    print(\"在庫数\", stock[imid])\nprint(\"比べた回数\", comp)\n",
    check: (r) => {
      const t = r.num("target"), comp = r.num("comp"), codes = r.list("codes");
      const lin = codes.indexOf(t) + 1;
      if (lin === 0) return [false, `${t} はリストにないので、見つかりませんでした。二分探索は ${comp} 回くらべて「ない」とわかりました（線形探索なら最後まで ${codes.length} 回）。次は 10001 など、リストにある番号で試そう。`];
      if (t !== 10009 && lin > 0) return [true, `${t} は、線形探索なら ${lin} 回、二分探索なら ${comp} 回で見つかります。`];
      return [false, `${t} は ${comp} 回で見つかりました。線形探索なら ${lin > 0 ? lin : codes.length} 回です。target をほかの番号に変えて、もう一度くらべよう。`];
    },
  },

  /* ---------------- 第6時 整列 */
  {
    id: "6-1", lesson: 6, tab: "バブルソート", kind: "trace", pointers: ["i"], pair: true, hue: "loop",
    kicker: "整列のアルゴリズム　教科書 p.176〜177 例題3",
    title: "となりどうしを比べて入れ替える",
    body: `
      <p>となりどうしを比べて、左のほうが大きければ入れ替えます。これをくり返すと、大きい数から順に右の端に集まります（バブルソート）。</p>
      <p>入れ替えには、値を一時的にしまう変数 tmp を使います（教科書 p.177 図1）。for の中にもう1つ for があることを、ネストといいます。</p>
      <p class="task">data が並び替わる様子を見たら、大きい順（降順）に並べ替えるように直しましょう（教科書 p.177 確認問題(2)）。</p>`,
    tools: ["print"],
    code: "data = [10006, 10009, 10010, 10003]\ncomp = 0\nfor imax in range(len(data) - 1, 0, -1):\n    for i in range(imax):\n        comp = comp + 1\n        if data[i] > data[i + 1]:\n            tmp = data[i]\n            data[i] = data[i + 1]\n            data[i + 1] = tmp\nprint(data)\nprint(\"比べた回数\", comp)\n",
    check: (r) => {
      const d = r.list("data"), asc = [...d].sort((x, y) => x - y);
      if (same(d, [...asc].reverse()) && !same(d, asc)) return [true, "比べる記号を1つ変えるだけで、並ぶ順番が逆になりました。比べた回数は変わりましたか。"];
      if (same(d, asc)) return [false, "小さい順に並びました。降順にするには、6行目のどの記号を変えればよいでしょう。"];
      return [false, `data が ${d.join(", ")} です。並び替えができていません。`];
    },
  },
  {
    id: "6-2", lesson: 6, tab: "計算量", kind: "trace",
    kicker: "アルゴリズムの評価　教科書 p.178 例題4",
    title: "データが増えると、回数はどう増える？",
    body: `
      <p>線形探索と二分探索を関数にして、データが 10 件、20 件、40 件のときに、最後の番号を探す回数をくらべます。</p>
      <p class="task">結果を予想してから実行し、教科書 p.178 の表と同じになるか確かめましょう。そのあと、最後の行のリストに 1000 を足して、どれくらい差がつくか調べましょう。</p>`,
    tools: ["print"],
    code: "def linear(data, target):\n    comp = 0\n    for x in data:\n        comp = comp + 1\n        if x == target:\n            break\n    return comp\n\ndef binary(data, target):\n    comp = 0\n    imin = 0\n    imax = len(data) - 1\n    while imin <= imax:\n        imid = (imin + imax) // 2\n        comp = comp + 1\n        if data[imid] == target:\n            break\n        elif data[imid] < target:\n            imin = imid + 1\n        else:\n            imax = imid - 1\n    return comp\n\nfor n in [10, 20, 40]:\n    data = list(range(n))\n    print(n, \"件\", \"線形探索\", linear(data, n - 1), \"回\", \"二分探索\", binary(data, n - 1), \"回\")\n",
    check: (r) => {
      if (r.out.includes("1000 件")) return [true, "線形探索の回数は件数に比例し、二分探索は件数が2倍になっても1回しか増えません。ただし、二分探索ではデータが並んでいる必要があります。"];
      return [false, "表と同じになりましたか。次は、最後の行のリストを [10, 20, 40, 1000] にして試そう。"];
    },
  },
);

/* 段階的なヒント。1つずつ開く。最後のヒントほど答えに近い。 */
const HINTS = {
  1: ["ゴールまで何マス進めばよいでしょう。マスを数えてみよう。", "S からゴールまでは 4 マスです。forward() 1行で 1 マス進みます。", "forward() を 4 行にすればゴールです。"],
  2: ["range( ) の中の数が、くり返す回数です。", "ゴールまでは何マスでしょう。", "range(3) を range(8) にしよう。"],
  3: ["まず今のまま実行して、どちらの場合に失敗するか見よう。", "閉まっているときだけ open_door() を実行したい。「もしドアが閉まっていたら」のボタンを使います。", "open_door() の行を if not door_is_open(): の下に入れて、字下げしよう。"],
  4: ["先に紙に道順を書こう。「3マス進む、右を向く…」のように。", "同じ forward() が続くところは for でまとめられます。", "最後はステップ3と同じく、ドアの前で if not door_is_open(): を使います。"],
  5: ["左に何回向くと、右を向いたのと同じになるでしょう。", "左に 3 回向くと、右を向いたのと同じです（90° × 3 = 270°）。", "for i in range(3): の下に left() を書くと、右を向けます。"],
  6: ["正方形は 4 回、90° ずつ曲がりました。三角形は何回、何度ずつ曲がるでしょう。", "1周は 360° です。三角形は 360 ÷ 3 = 120° ずつ曲がります。", "range(3) と left(120) で三角形になります。星は「見本を入れる」で確かめよう。"],
  7: ["まず 3000 のまま実行して、できた形をよく見よう。", "回数を 300 にすると、形はどう変わるでしょう。", "見本の「木」の size < 8 の 8 を変えると、枝の細かさが変わります。"],
  "2-1": ["かけ算の記号は × ではなく * です。", "3行目の answer = a + b を変えます。", "answer = a * b にしよう。"],
  "2-2": ["x = x + 1 は「今の x に 1 を足して、x に入れ直す」という意味です。", "1 から 10 にするには、1 を何回足せばよいでしょう。", "x = x + 1 の行を 9 行にしよう。第3時の for を使うと短く書けます。"],
  "2-3": ["まず実行して、エラーの出た行を見よう。", "4行目の名前は、3行目の変数名と同じつづりですか。", "わり算は足し算より先に計算されます。(a + b) / 2 のように ( ) で囲もう。"],
  "3-1": ["1行目を a = 91 にしよう。", "b を 2, 3, 4… と変えて、余り rmndr が 0 になる数を探そう。", "b = 7 で試してみよう。"],
  "3-2": ["奇数は「2 で割った余りが 1」の数です。", "i が奇数のときだけ print したい。「もし奇数なら」のボタンを使おう。", "if i % 2 == 1: の下に print(7 * i) を字下げして入れよう。"],
  "3-3": ["total は合計を入れておく箱です。くり返すたびに何を足せばよいでしょう。", "i は 1, 2, 3, … 10 と変わります。", "3行目を total = total + i にしよう。"],
  "3-4": ["15 は 3 でも 5 でも割り切れます。今のプログラムだと、15 のとき何が表示されるでしょう。", "「3 と 5 の両方で割り切れる」は「15 で割り切れる」と同じです。これを最初に調べます。", "if i % 15 == 0: を一番上にして、elif i % 3 == 0:、elif i % 5 == 0:、else: の順に並べよう。"],
  "4-1": ["リストの添字は 0 から数えます。a[0] は 7 です。", "49 は 7 × 7 です。右の欄で 49 の下の番号を見よう。", "最後の行を print(a[6]) にしよう。"],
  "4-2": ["myround はそのままでかまいません。直すのは bigger です。", "a が b より大きいときは a を、そうでなければ b を返します。", "bigger の中を if a > b: → return a、else: → return b にしよう。"],
  "4-3": ["step() を1回呼ぶと、ロボットは階段を1段おります。最後の left() で、次の段のほうを向きます。", "step() を4回呼ぶと、ゴールに着いたあとにも left() が残ってしまいます。", "for i in range(3): で step() を3回呼び、最後の1段は forward()、right()、forward() と書こう。"],
  "5-1": ["target の数を書きかえて実行します。", "comp が比べた回数です。右の欄で i が動く様子も見よう。", "最後に target = 10011 にして実行しよう。"],
  "5-2": ["imid が真ん中の位置です。比べるたびに、探す範囲が半分になります。", "target を 10001 にして実行しよう。", "10001 で何回だったか、線形探索の回数とくらべよう。"],
  "6-1": ["if data[i] > data[i + 1]: の行が「入れ替えるかどうか」を決めています。", "> を逆向きにすると、どうなるでしょう。", "その行を if data[i] < data[i + 1]: にしよう。"],
  "6-2": ["まず実行して、件数と回数の表を見よう。", "最後の for の行に [10, 20, 40] というリストがあります。", "そのリストを [10, 20, 40, 1000] にしよう。"],
};
/* くらしとのつながり。各ステップの説明の下に出す。 */
const LIFE = {
  1: "カップ麺は「ふたを開ける → お湯を入れる → 3分待つ」。順番を入れかえると、うまくいきません。",
  2: "洗濯機の「すすぎ2回」。同じ動きを、回数を決めてくり返しています。",
  3: "自動ドアは、人がいるかをセンサーで調べて、いれば開け、いなければ閉めたままにします。",
  4: "ロボット掃除機も「進む・曲がる・ぶつかったら向きを変える」の組み合わせで部屋を回ります。",
  5: "右折できない交差点では、左折を3回して同じ向きに進むことがあります。使える命令だけで工夫するのもプログラミングです。",
  6: "刺しゅうミシンや 3D プリンタも、「進む」「曲がる」の命令を並べて形を作っています。",
  7: "シダの葉や雪の結晶のように、簡単な規則のくり返しから複雑な形が生まれます。映画やゲームの CG の木や山も、この考え方で作られています。",
  "2-1": "レジは「値段 × 個数」を計算して、合計の箱に足していきます。",
  "3-1": "カレンダーアプリは、割り算の余りを使って曜日やうるう年を判定しています。",
  "5-1": "ネットショップで商品番号を入れると、在庫のリストから探し出します。",
  "5-2": "辞書を引くとき、真ん中あたりを開いて前か後ろかを決めるのは二分探索と同じです。",
  "6-1": "通販サイトの「価格の安い順」も、並べ替えのアルゴリズムで作られています。",
};
/* 迷路の最短チャレンジ。空行と # のメモをのぞいた行数が、この数以下なら ★。 */
const GOAL_LINES = { 2: 2, 3: 8, 4: 13, 5: 15, "4-3": 10 };
/* 命令の数を数える。; で1行に並べたり、for の行に続けて書いたりしても、1つずつ数える。 */
const countLines = (code) => code.split("\n").reduce((n, l) => {
  const t = l.replace(/("[^"]*"|'[^']*')/g, "\"\"").replace(/#.*$/, "").trim();
  if (!t) return n;
  const parts = t.split(";").filter((x) => x.trim()).length || 1;
  const inline = /^(for|if|elif|else|while|def)\b.*:\s*\S/.test(t) ? 1 : 0;
  return n + parts + inline;
}, 0);

const LESSONS = [[1, "アルゴリズム"], [2, "変数"], [3, "分岐と反復"], [4, "リストと関数"], [5, "探索"], [6, "整列"]];
{
  const count = {};
  for (const st of STAGES) {
    st.lesson = st.lesson || 1;
    st.n = count[st.lesson] = (count[st.lesson] || 0) + 1;
    if (st.lesson > 1) st.kicker = `第${st.lesson}時　` + st.kicker;
  }
}

/* ------------------------------------------------------------------ 保存 */
const store = (() => {
  let data = { code: {}, cleared: {}, last: 1, best: {}, hints: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const got = JSON.parse(raw);
      if (got && typeof got === "object") data = Object.assign(data, got);
    }
  } catch (e) { /* 壊れていたら初めからにする */ }
  const obj = (x) => x && typeof x === "object" && !Array.isArray(x);
  for (const k of ["code", "cleared", "best", "hints"]) if (!obj(data[k])) data[k] = {};
  return {
    data,
    save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* 保存できない環境でも動かす */ } },
  };
})();

/* ------------------------------------------------------------------ 要素 */
const $ = (id) => document.getElementById(id);
const ui = {
  steps: $("steps"), lessons: $("lessons"), stageTitle: $("stage-title"), status: $("py-status"), kicker: $("st-kicker"), title: $("st-title"), num: $("st-num"), body: $("st-body"),
  samples: $("samples"), tools: $("tools"), gutter: $("gutter"), hl: $("hl"), code: $("code"),
  run: $("run"), runLabel: $("run-label"), speed: $("speed"), reset: $("reset"),
  world: $("world"), result: $("result"), outBox: $("output-box"), out: $("output"),
  flow: $("flow"), flowNote: $("flow-note"),
};
const SVG = "http://www.w3.org/2000/svg";
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
const sleep = (ms) => (skip ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const PAD = 12;
let LH = 26; // エディタの1行の高さ。文字サイズを変えたら測り直す
let skip = false; // 再生を最後まで飛ばす
let playing = false;

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
  if (text === "" && ui.code.selectionStart === ui.code.selectionEnd) return;
  try { done = document.execCommand(text === "" ? "delete" : "insertText", false, text); } catch (e) { done = false; }
  if (!done) ui.code.setRangeText(text, ui.code.selectionStart, ui.code.selectionEnd, "end");
}
function refreshGutter() {
  LH = parseFloat(getComputedStyle(ui.code).lineHeight) || 26;
  const n = ui.code.value.split("\n").length;
  if (ui.gutter.childElementCount !== n) {
    ui.gutter.textContent = "";
    for (let i = 1; i <= n; i++) ui.gutter.appendChild(h("div", "", String(i)));
  }
  // 画面の高さが低いとき（表示スケール 125%・150% など）は、欄を低くして全体が見えるようにする
  const most = Math.max(6, Math.min(18, Math.floor((window.innerHeight - 300) / LH)));
  ui.code.style.height = Math.min(Math.max(n + 1, Math.min(7, most)), most) * LH + PAD * 2 + "px";
  // 行番号の欄は、プログラムの欄と同じ高さにして一緒にスクロールさせる
  ui.gutter.style.height = ui.code.style.height;
  ui.gutter.style.boxSizing = "border-box";
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
      ui.gutter.scrollTop = ui.code.scrollTop;
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
let tabOut = false;
ui.code.addEventListener("keydown", (ev) => {
  if (ev.isComposing) return;
  if (ev.key === "Escape") { tabOut = true; return; }
  if (ev.key === "Tab" && tabOut) { tabOut = false; return; }
  tabOut = false;
  const ta = ui.code, v = ta.value, a = ta.selectionStart, b = ta.selectionEnd;
  if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); run(); return; }
  if (ev.key === "Tab" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
    ev.preventDefault();
    if (a === b && !ev.shiftKey) { insertText("    "); onEdit(); return; }
    // 選んだ行をまとめて字下げする（Shift + Tab で戻す）
    const ls = v.lastIndexOf("\n", a - 1) + 1;
    let le = v.indexOf("\n", b > a && v[b - 1] === "\n" ? b - 1 : b); if (le < 0) le = v.length;
    const lines = v.slice(ls, le).split("\n");
    const out = lines.map((l) => (ev.shiftKey ? l.replace(/^ {1,4}/, "") : l.trim() ? "    " + l : l)).join("\n");
    ta.setSelectionRange(ls, le);
    insertText(out);
    if (a !== b) ta.setSelectionRange(ls, ls + out.length);
    onEdit(); return;
  }
  if (ev.key === "Enter" && !ev.shiftKey) {
    const ls = v.lastIndexOf("\n", a - 1) + 1;
    const before = v.slice(ls, a);
    let indent = before.match(/^ */)[0];
    ev.preventDefault();
    let lineEnd = v.indexOf("\n", a); if (lineEnd < 0) lineEnd = v.length;
    if (before.length && v.slice(ls, lineEnd).trim() === "") {
      // 中身のない字下げ行で Enter を押したら、ブロックを抜けて1段戻る
      ta.setSelectionRange(ls, a);
      insertText(indent.slice(0, Math.max(0, indent.length - 4)));
      onEdit(); return;
    }
    if (!/^\s*#/.test(before) && /:\s*(#.*)?$/.test(before)) indent += "    ";
    else if (/^\s*(return|break|continue|pass)\b/.test(before)) indent = indent.slice(0, Math.max(0, indent.length - 4));
    insertText("\n" + indent); onEdit(); return;
  }
  if (ev.key === "Backspace" && a === b) {
    const ls = v.lastIndexOf("\n", a - 1) + 1;
    const before = v.slice(ls, a);
    if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) {
      ev.preventDefault(); ta.setSelectionRange(a - 4, a); insertText(""); onEdit();
    }
  }
});

function replaceAll(next, caret) {
  const ta = ui.code;
  ta.focus();
  ta.setSelectionRange(0, ta.value.length);
  insertText(next);
  if (ta.value !== next) ta.value = next;
  ta.setSelectionRange(caret, caret);
  onEdit();
}
const indentOf = (l) => l.match(/^ */)[0].length;
const isHeader = (l) => !/^\s*#/.test(l) && /:\s*(#.*)?$/.test(l);
function insertSnippet(text, opensBlock) {
  const ta = ui.code, v = ta.value, a = ta.selectionStart, b = ta.selectionEnd;
  const lines = v.split("\n");
  const li = v.slice(0, a).split("\n").length - 1;
  const lj = Math.max(li, v.slice(0, b > a && v[b - 1] === "\n" ? b - 1 : b).split("\n").length - 1);
  const line = lines[li];
  const lineStart = (k) => lines.slice(0, k).join("\n").length + (k ? 1 : 0);
  const branch = /^(elif|else)\b/.test(text);

  // else / elif は、対応する if のまとまりの最後に、if と同じ字下げで入れる
  if (branch) {
    let k = li, found = -1;
    const cur = line.trim() ? indentOf(line) : indentOf(line) || 99;
    for (; k >= 0; k--) {
      const l = lines[k];
      if (!l.trim()) continue;
      if (/^\s*(if|elif)\b/.test(l) && isHeader(l) && indentOf(l) <= cur) { found = k; break; }
      if (k < li && indentOf(l) < Math.min(cur, indentOf(line)) - 4) break;
    }
    if (found >= 0) {
      const ind = indentOf(lines[found]);
      let j = found + 1;
      for (;;) {
        while (j < lines.length && (!lines[j].trim() || indentOf(lines[j]) > ind)) j++;
        const l = lines[j];
        if (j < lines.length && indentOf(l) === ind && /^\s*(elif|else)\b/.test(l)) {
          if (text.startsWith("elif") && /^\s*else\b/.test(l)) break;
          j++; continue;
        }
        break;
      }
      while (j - 1 > found && !lines[j - 1].trim()) j--;
      const pad = " ".repeat(ind);
      const add = [pad + text].concat(opensBlock ? [pad + "    "] : []);
      const next = lines.slice(0, j).concat(add, lines.slice(j)).join("\n");
      const caret = lineStart(j) + add.join("\n").length;
      replaceAll(next, caret);
      return;
    }
  }

  // if / for / while は、今の行（選んだ行）をそのまま中に入れる
  if (opensBlock && !branch && line.trim() && !isHeader(line)) {
    const ind = indentOf(line), pad = " ".repeat(ind);
    const body = lines.slice(li, lj + 1).map((l) => (l.trim() ? "    " + l : l));
    const next = lines.slice(0, li).concat([pad + text], body, lines.slice(lj + 1)).join("\n");
    const caret = lineStart(li) + pad.length + text.length + 1 + body.join("\n").length;
    replaceAll(next, caret);
    return;
  }

  const ls = lineStart(li), le = ls + line.length;
  const indent = line.match(/^ */)[0];
  ta.focus();
  if (line.trim() === "") {
    ta.setSelectionRange(ls, le);
    insertText(indent + text + (opensBlock ? "\n" + indent + "    " : ""));
  } else {
    const use = isHeader(line) ? indent + "    " : indent;
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
      run_trace: pyodide.globals.get("run_trace"),
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
/* 拡大縮小。fit は欄の幅に収まる倍率を返す */
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2];
function addZoom(panel, inner, label, fit, allLabel, floor = 0) {
  const bar = h("div", "zoom");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", label + "の大きさ");
  const out = h("button", "btn small", "縮小"), inn = h("button", "btn small", "拡大"), all = h("button", "btn small", allLabel || "元の大きさ");
  out.type = inn.type = all.type = "button";
  const val = h("span", "zoom-val");
  bar.append(out, val, inn, all);
  panel.before(bar);
  let z = 1, auto = true;
  const set = (v) => {
    z = Math.min(2, Math.max(0.3, Math.round(v * 100) / 100));
    inner.style.zoom = String(z);
    val.textContent = Math.round(z * 100) + "%";
    out.disabled = z <= 0.3; inn.disabled = z >= 2;
  };
  out.addEventListener("click", () => { auto = false; set([...ZOOMS].reverse().find((x) => x < z - 0.001) ?? 0.3); });
  inn.addEventListener("click", () => { auto = false; set(ZOOMS.find((x) => x > z + 0.001) ?? 2); });
  all.addEventListener("click", () => { auto = true; set(fit ? fit() : 1); });
  set(1);
  // 図が描き直されたとき、自分で倍率を変えていなければ幅に合わせ直す
  const refit = () => { if (auto) set(Math.max(floor, fit ? fit() : 1)); };
  return { refit, reset: () => { auto = true; refit(); } };
}

function buildMaze(st) {
  const rows = st.map, H = rows.length, W = rows[0].length;
  const root = svg("svg", { class: "maze", viewBox: `${CELL * 0.6} ${CELL * 0.6} ${(W - 1.2) * CELL} ${(H - 1.2) * CELL}`, role: "img", "aria-label": "迷路" });
  root.setAttribute("width", Math.round((W - 1.2) * CELL));
  ui.world.dataset.natural = Math.round((W - 1.2) * CELL);
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
  const pinG = svg("g", { class: "pin" }, root);

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
    pin(n) {
      pinG.textContent = "";
      if (n == null) return;
      const px = sx + DIRS[st.dir || 0][0] * n, py = sy + DIRS[st.dir || 0][1] * n;
      svg("rect", { x: px * CELL + 5, y: py * CELL + 5, width: CELL - 10, height: CELL - 10 }, pinG);
      svg("text", { x: cx(px), y: py * CELL + CELL - 9, "text-anchor": "middle" }, pinG).textContent = "予想";
    },
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
        if (inner.animate && !calm()) inner.animate([{ transform: "translateX(0)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }], { duration: 260 });
        cross.setAttribute("transform", `translate(${cx(x) + DIRS[dir][0] * CELL * 0.5},${cy(y) + DIRS[dir][1] * CELL * 0.5})`);
        cross.classList.add("show");
        await sleep(300);
      } else if (a.t === "goal") {
        if (inner.animate && !calm()) inner.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 420 });
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
  ui.world.dataset.natural = PADSIZE;
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
    savePng() {
      const out = document.createElement("canvas");
      out.width = canvas.width; out.height = canvas.height;
      const c = out.getContext("2d");
      c.fillStyle = "#ffffff"; c.fillRect(0, 0, out.width, out.height);
      c.drawImage(canvas, 0, 0);
      const a = document.createElement("a");
      a.download = `ロボ迷路_${stage.tab}.png`;
      a.href = out.toDataURL("image/png");
      document.body.appendChild(a); a.click(); a.remove();
    },
  };
  api.reset();
  return api;
}

/* ------------------------------------------------------------------ 変数の箱 */
function renderVars(box, vars, prev, st, all) {
  box.textContent = "";
  const names = Object.keys(vars);
  if (!names.length) { box.appendChild(h("p", "empty", "まだ箱はありません")); return; }
  for (const name of names) {
    const v = vars[name], p = prev && prev[name];
    const changed = !p || JSON.stringify(p) !== JSON.stringify(v);
    if (v.list) {
      const el = h("div", "var list");
      el.appendChild(h("span", "name", name));
      const cells = h("div", "cells");
      v.list.forEach((x, idx) => {
        const c = h("div", "cell");
        if (!p || !p.list || p.list[idx] !== x) c.classList.add("changed");
        const marks = [];
        for (const q of st.pointers || []) {
          const pv = all[q] && all[q].v != null ? Number(all[q].v) : NaN;
          if (pv === idx) marks.push(q);
          if (st.pair && q === "i" && pv + 1 === idx) marks.push("i + 1");
        }
        if (marks.length) c.classList.add("ptr");
        c.appendChild(h("span", "cv", x));
        c.appendChild(h("span", "ci", String(idx)));
        if (marks.length) c.appendChild(h("span", "pn", marks.join(" ")));
        cells.appendChild(c);
      });
      el.appendChild(cells);
      box.appendChild(el);
    } else {
      const el = h("div", "var" + (changed ? " changed" : ""));
      el.appendChild(h("span", "name", name));
      el.appendChild(h("span", "val", v.v));
      box.appendChild(el);
    }
  }
}
function buildTrace(st) {
  const wrap = h("div", "trace");
  delete ui.world.dataset.natural;
  const box = h("div", "vars");
  const fnTitle = h("p", "fn-title"); fnTitle.hidden = true;
  const fnBox = h("div", "vars"); fnBox.hidden = true;
  const where = h("p", "where", "「実行」を押すと、変数の箱がここに出ます。");
  where.setAttribute("aria-live", "polite");
  where.setAttribute("aria-atomic", "true");
  const scrub = h("div", "scrub"); scrub.hidden = true;
  const back = h("button", "btn small", "1行もどる"), fwd = h("button", "btn small", "1行すすむ");
  back.type = fwd.type = "button";
  const range = document.createElement("input");
  range.type = "range"; range.id = "scrub"; range.min = "0";
  range.setAttribute("aria-label", "実行の何番目を見るか");
  scrub.append(back, range, fwd);
  wrap.append(where, box, fnTitle, fnBox, scrub);
  ui.world.textContent = "";
  ui.world.appendChild(wrap);

  let steps = [], out = "", cur = 0;
  function show(k) {
    cur = Math.max(0, Math.min(k, steps.length - 1));
    const s = steps[cur];
    if (!s) return;
    const p = steps[cur - 1];
    renderVars(box, s.vars, p && p.vars, st, s.vars);
    const inFn = !!s.fn;
    fnTitle.hidden = fnBox.hidden = !inFn;
    if (inFn) {
      fnTitle.textContent = `関数 ${s.fn} の中の箱`;
      renderVars(fnBox, s.local, p && p.fn === s.fn ? p.local : null, st, s.local);
    }
    where.textContent = s.line ? `${cur + 1} / ${steps.length}　${s.line}行目を実行する前` : `${cur + 1} / ${steps.length}　実行が終わったあと`;
    const text = out.slice(0, s.out);
    ui.out.textContent = text; ui.outBox.hidden = !text;
    range.value = String(cur);
    markLine(s.line);
  }
  back.addEventListener("click", () => show(cur - 1));
  fwd.addEventListener("click", () => show(cur + 1));
  range.addEventListener("input", () => show(Number(range.value)));
  return {
    load(res) {
      steps = res.steps; out = res.output;
      if (!steps.length) { box.textContent = ""; fnBox.textContent = ""; fnBox.hidden = fnTitle.hidden = true; where.textContent = "エラーで実行できなかったので、箱はありません。"; }
      range.max = String(Math.max(0, steps.length - 1)); scrub.hidden = true; where.setAttribute("aria-live", "off");
    },
    show,
    done() { scrub.hidden = steps.length < 2; where.setAttribute("aria-live", "polite"); },
  };
}

/* ------------------------------------------------------------------ 実行と再生 */
const DOOR_TEXT = { closed: "閉まっている", open: "開いている" };

function setPlaying(on) {
  if (!on) hideNext();
  playing = on; skip = false;
  ui.runLabel.textContent = on ? "とばして結果へ" : "実行";
}
async function run() {
  if (!py) return;
  if (playing) { skip = true; hideNext(); return; }
  const token = ++runToken;
  // 貼り付けた Windows の改行と Tab をそろえてから実行する
  const code = ui.code.value.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
  markLine(null);
  updateFlow();
  ui.outBox.hidden = true;
  // ロボット（変数の箱）の欄が画面の外なら、見える位置までスクロールする
  const wf = $("world-frame").getBoundingClientRect();
  if (wf.top < 0 || wf.bottom > window.innerHeight) $("world-frame").scrollIntoView({ block: wf.height > window.innerHeight ? "start" : "nearest", behavior: calm() ? "auto" : "smooth" });
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
    const pick = $("door-case").value;
    const shown = teaching() && keys.includes(pick) ? pick : keys[Math.floor(Math.random() * keys.length)];
    last = { results, shown, code, flow: flowInfo };
    await showCase(shown, token);
  } else if (stage.kind === "trace") {
    const res = JSON.parse(py.run_trace(code));
    last = { results: { only: res }, shown: "only", code };
    setResult("idle", [h("p", "", "実行中")]);
    world.load(res);
    setPlaying(true);
    const n = res.steps.length, ms = Number(ui.speed.value);
    const total = ms >= 600 ? 20000 : ms >= 300 ? 9000 : 3000;
    const delay = Math.max(16, Math.min(ms, total / Math.max(n, 1)));
    const stride = Math.max(1, Math.ceil((n * 16) / total));
    for (let k = 0; k < n; k += stride) {
      if (token !== runToken) return;
      world.show(k);
      await sleep(delay);
    }
    if (token !== runToken) return;
    if (n) world.show(n - 1);
    setPlaying(false);
    finishRun();
  } else {
    const res = JSON.parse(py.run_draw(code));
    last = { results: { only: res }, shown: "only", code };
    setResult("idle", [h("p", "", "実行中")]);
    setPlaying(true);
    await replayDraw(res, token);
    if (token !== runToken) return;
    setPlaying(false);
    finishRun();
  }
}

async function showCase(key, token) {
  releaseNext();
  last.shown = key;
  const res = last.results[key];
  const label = stage.door ? `ドアが${DOOR_TEXT[key]}場合を実行中` : "実行中";
  setResult("idle", [h("p", "", label)]);
  world.reset(res.doorStart);
  setPlaying(true);
  await sleep(160);
  // 動きが多いときは、全体が長くなりすぎないように速める
  const ms = Math.max(40, (Number(ui.speed.value) || 340) * Math.min(1, 30 / Math.max(1, res.actions.length)));
  document.documentElement.style.setProperty("--dur", Math.round(ms * 0.9) + "ms");
  const total = res.actions.length;
  for (let k = 0; k < total; k++) {
    const a = res.actions[k];
    if (token !== runToken) return;
    markLine(a.line);
    if (stepMode()) { await waitNext(k + 1, total, a.line); if (token !== runToken) return; }
    await world.play(a, stepMode() ? 340 : ms);
  }
  hideNext();
  if (token !== runToken) return;
  setPlaying(false);
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
      if (!skip) await new Promise((r) => requestAnimationFrame(r));
    }
  }
  if (token !== runToken) return;
  world.finish(res.end);
}

/* 1つずつ実行（迷路）: 次に実行する行を光らせて、ボタンで1つ進める */
const stepMode = () => stage.kind === "maze" && ui.speed.value === "step" && !skip;
let nextResolve = null, nextQueued = 0;
function waitNext(k, total, line) {
  const b = $("next-step");
  const src = line ? (ui.code.value.split("\n")[line - 1] || "").trim() : "";
  b.textContent = "";
  b.appendChild(h("b", "", `1つ進む（${k} / ${total}）`));
  if (line) b.appendChild(h("span", "", `次は ${line}行目　${src.length > 28 ? src.slice(0, 28) + "…" : src}`));
  if (b.hidden) { b.hidden = false; b.focus({ preventScroll: true }); }
  if (nextQueued > 0) { nextQueued--; return Promise.resolve(); }
  return new Promise((r) => { nextResolve = r; });
}
function releaseNext() { if (nextResolve) { const r = nextResolve; nextResolve = null; r(); } }
function hideNext() {
  const b = $("next-step");
  if (document.activeElement === b) ui.run.focus({ preventScroll: true });
  b.hidden = true; nextQueued = 0; releaseNext();
}
$("next-step").addEventListener("click", () => { if (nextResolve) releaseNext(); else nextQueued = Math.min(nextQueued + 1, 3); });
ui.speed.addEventListener("change", () => { if (ui.speed.value !== "step") { nextQueued = 0; releaseNext(); $("next-step").hidden = true; } });

function revealResult() {
  const r = ui.result.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight) ui.result.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });
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
  const name = er.kind === "syntax" ? "文法エラー" : er.kind === "logic" ? "論理エラー" : er.kind === "usage" ? "使い方のエラー" : "エラー";
  head.appendChild(h("span", "badge " + er.kind, name));
  head.appendChild(document.createTextNode(er.line ? `${er.line}行目` : "プログラム"));
  out.push(head, h("p", "", er.message));
  if (er.raw) out.push(h("p", "raw", er.raw));
  if (er.kind === "syntax") out.push(h("p", "sub", "文法エラーは、書き方の間違いでプログラムが正しく実行できない状態です（教科書 p.166）。"));
  if (er.kind === "logic") out.push(h("p", "sub", "論理エラーは、実行はできたのに結果が目的と違う状態です（教科書 p.166）。"));
  if (er.kind === "usage") out.push(h("p", "sub", "命令の ( ) の中身や、使える命令がちがっています。書き方は正しいので、使い方を直せば動きます。"));
  return out;
}
function caseLine(res) {
  if (res.status === "goal") return "ゴールできた";
  if (res.status === "short") return "ゴールに届かなかった";
  const why = res.error.message.split("。")[0];
  return res.error.line ? `${res.error.line}行目で止まった（${why}）` : why;
}

function finishRun() {
  requestAnimationFrame(revealResult);
  const { results, shown } = last;
  const res = results[shown];
  if (res.output) { ui.out.textContent = res.output; ui.outBox.hidden = false; }
  if (res.error && res.error.line) markLine(res.error.line, true); else markLine(null);

  if (stage.kind === "trace") {
    world.done();
    if (res.status === "error") { setResult("bad", errorBlock(res)); return; }
    const fin = res.steps.length ? res.steps[res.steps.length - 1].vars : {};
    const r = {
      out: res.output,
      lines: res.output.split("\n").filter((x) => x !== ""),
      num: (k) => (fin[k] && fin[k].v != null ? Number(fin[k].v) : NaN),
      list: (k) => (fin[k] && fin[k].list ? fin[k].list.map(Number) : []),
    };
    const [ok, msg] = stage.check(r);
    const kids = [h("p", "head", ok ? "クリア" : "実行できました。あと一歩です"), h("p", "", msg)];
    if (res.cut) kids.push(h("p", "sub", "動きが多いので、途中から最後までの記録は省いています。"));
    if (ok) { kids.push(nextButton()); markCleared(); }
    setResult(ok ? "ok" : "half", kids);
    return;
  }

  if (stage.kind === "draw") {
    if (res.status === "done") {
      const lines = res.actions.filter((a) => a[0] === "L").length, dots = res.actions.filter((a) => a[0] === "D").length;
      const what = [lines ? `線 ${lines} 本` : "", dots ? `点 ${dots} 個` : ""].filter(Boolean).join("、");
      if (!what) { setResult("half", [h("p", "head", "最後まで実行できましたが、何も描かれていません"), h("p", "", "forward(100) などの命令で、線を描いてみよう。")]); return; }
      const cols = [...new Set(res.actions.map((a) => (a[0] === "L" ? a[5] : a[0] === "D" ? a[3] : null)).filter(Boolean))];
      const badCol = cols.filter((c) => !(window.CSS && CSS.supports("color", c)));
      const save = h("button", "btn small", "画像を保存"); save.type = "button";
      save.addEventListener("click", () => world.savePng());
      const acts = nextButton() || h("div", "actions");
      acts.prepend(save);
      const kidsD = [h("p", "head", "最後まで実行できました"), h("p", "", what)];
      if (badCol.length) kidsD.push(h("p", "", `色の名前「${badCol.join("」「")}」はわかりませんでした（黒で描いています）。red、blue、tomato のように英語で書こう。`));
      kidsD.push(acts);
      setResult("ok", kidsD);
      markCleared();
    } else setResult("bad", errorBlock(res));
    return;
  }

  const keys = Object.keys(results);
  const allPass = keys.every((k) => results[k].status === "goal");
  const kids = [];
  if (stage.predict && guess != null) {
    const moved = res.actions.filter((x) => x.t === "move").length;
    kids.push(h("p", "guess", moved === guess
      ? `予想 ${guess} マス → 実際 ${moved} マス。予想どおりです。`
      : `予想 ${guess} マス → 実際 ${moved} マス。予想とちがいました。どの行で何マス進んだか、フローチャートと見くらべよう。`));
    guess = null;
    $("predict").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
  }
  let cls = "bad";
  const needMsg = allPass && stage.need ? stage.need(last.code) : "";
  if (needMsg) {
    cls = "half";
    kids.push(h("p", "head", "ゴールできました。あと一歩です"), h("p", "", needMsg));
  } else if (allPass) {
    cls = "ok";
    kids.push(h("p", "head", stage.door ? "クリア。開いていても閉まっていても、ゴールできました" : "ゴール。クリアです"));
    const tip = stage.tip ? stage.tip(last.flow) : "";
    if (tip) kids.push(h("p", "", tip));
    const goal = GOAL_LINES[stage.id];
    if (goal != null) {
      const n = countLines(last.code), prev = store.data.best[stage.id];
      if (prev == null || n < prev) { store.data.best[stage.id] = n; store.save(); }
      const flat = results[shown].actions.filter((x) => x.t === "move" || x.t === "turn" || x.t === "open").length;
      if (flat > n) kids.push(h("p", "", `くり返しを使わずに1つずつ書くと ${flat} 行になります。いまは ${n} 行なので、${flat - n} 行短く書けています。`));
      kids.push(h("p", "star", n <= goal
        ? `★ 最短チャレンジ達成。${n} 行で書けました（目標 ${goal} 行以下）。`
        : `最短チャレンジ：いまは ${n} 行です。${goal} 行以下にできたら ★ です。for を使えるところはありませんか。`));
    }
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
        b.addEventListener("click", () => { ui.result.setAttribute("tabindex", "-1"); ui.result.focus({ preventScroll: true }); showCase(k, ++runToken); });
        txt.appendChild(b);
      }
      ul.appendChild(li);
    }
    kids.push(ul);
  }
  if (allPass && !needMsg) { kids.push(nextButton()); markCleared(); renderSteps(); }
  setResult(cls, kids);
}
function nextButton() {
  const i = STAGES.indexOf(stage);
  const wrap = h("div", "actions");
  const lastOfLesson = i === STAGES.length - 1 || STAGES[i + 1].lesson !== stage.lesson;
  if (lastOfLesson) {
    const sb = h("button", "btn", `第${stage.lesson}時のまとめ`); sb.type = "button";
    sb.addEventListener("click", () => openSummary(stage.lesson));
    wrap.appendChild(sb);
  }
  if (i >= STAGES.length - 1) return wrap;
  const nx = STAGES[i + 1];
  const b = h("button", "btn next", nx.lesson !== stage.lesson ? `第${nx.lesson}時へ` : "次のステップへ");
  b.type = "button";
  b.addEventListener("click", () => { openStage(STAGES[i + 1].id, true); focusHead(); });
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
function boxW(s) { return Math.min(Math.max(textW(s) + 30, 124), 210); }
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
      fcText(g, x, cy + H / 2 + 1, "くり返しここまで", w, { k: "loop" });
    },
  };
}
function fcIf(n) {
  const yes = fcSeq(n.yes), no = fcSeq(n.no), G = FC.G, DH = FC.DH;
  const dw = Math.min(Math.max(textW(n.text) + 64, 150), 220);
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
  if (typeof flowZoom !== "undefined") flowZoom.refit();
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
  ui.lessons.textContent = "";
  for (const [n, name] of LESSONS) {
    const sec = h("section", "toc-lesson" + (n === stage.lesson ? " now" : ""));
    sec.appendChild(h("h3", "", `第${n}時　${name}`));
    const ol = h("ol", "toc-list");
    for (const s of STAGES.filter((x) => x.lesson === n)) {
      const done = store.data.cleared[s.id], star = hasStar(s);
      const li = h("li", "");
      const b = h("button", "step" + (s === stage ? " current" : "") + (done ? " cleared" : ""));
      b.type = "button";
      b.appendChild(h("span", "num", star ? "★" : done ? "✓" : String(s.n)));
      b.appendChild(h("span", "", s.tab));
      if (s.hue) b.dataset.hue = s.hue;
      if (s === stage) b.setAttribute("aria-current", "page");
      b.setAttribute("aria-label", `第${n}時 ステップ${s.n} ${s.tab}${star ? "（最短チャレンジ達成）" : done ? "（クリア済み）" : ""}`);
      b.addEventListener("click", () => { openStage(s.id, true); if (!tocDocked()) setToc(false, true); else { const c = ui.lessons.querySelector(".step.current"); if (c) c.focus(); } });
      li.appendChild(b); ol.appendChild(li);
    }
    sec.appendChild(ol);
    const sm = h("button", "btn ghost small", `第${n}時のまとめ`); sm.type = "button";
    sm.addEventListener("click", () => { if (!tocDocked()) setToc(false, false); openSummary(n); });
    sec.appendChild(sm);
    ui.lessons.appendChild(sec);
  }
  const cur = LESSONS.find(([n]) => n === stage.lesson);
  $("toc-now").textContent = cur ? `第${cur[0]}時 ${cur[1]}` : "";
  ui.steps.textContent = "";
  for (const s of STAGES.filter((x) => x.lesson === stage.lesson)) {
    const done = store.data.cleared[s.id], star = hasStar(s);
    const b = h("button", "step" + (s === stage ? " current" : "") + (done ? " cleared" : ""));
    b.type = "button";
    b.appendChild(h("span", "num", star ? "★" : done ? "✓" : String(s.n)));
    b.appendChild(h("span", "", s.tab));
    if (s.hue) b.dataset.hue = s.hue;
    if (s === stage) b.setAttribute("aria-current", "step");
    b.setAttribute("aria-label", `ステップ${s.n} ${s.tab}${star ? "（最短チャレンジ達成）" : done ? "（クリア済み）" : ""}`);
    b.addEventListener("click", () => { openStage(s.id, true); const c = ui.steps.querySelector(".step.current"); if (c) c.focus(); });
    ui.steps.appendChild(b);
  }
}
function hasStar(s) { const g = GOAL_LINES[s.id], b = store.data.best[s.id]; return g != null && b != null && b <= g; }
function parseHash() {
  const m = location.hash.match(/^#step-(\d+(?:-\d+)?)(?:&|$)/);
  return m ? (m[1].includes("-") ? m[1] : Number(m[1])) : null;
}

/* ------------------------------------------------------------------ リンクで共有 */
function encodeCode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = ""; for (const x of bytes) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeCode(s) {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch (e) { return null; }
}
function sharedCode() {
  const m = location.hash.match(/&code=([A-Za-z0-9_-]+)/);
  return m ? decodeCode(m[1]) : null;
}
function openShared() {
  const text = sharedCode();
  try { history.replaceState(null, "", "#step-" + stage.id); } catch (e) { /* そのまま */ }
  if (text == null) return;
  // 共有されたプログラムは、生徒が書きかえるまで保存しない（自分のプログラムは残る）
  ui.code.value = text;
  refreshGutter(); markLine(null); updateFlow();
  const back = h("button", "btn small", "自分のプログラムに戻す"); back.type = "button";
  back.addEventListener("click", () => { const own = store.data.code[stage.id]; setCode(own != null ? own : stage.code); setResult("idle", [h("p", "", "自分のプログラムに戻しました。")]); });
  setResult("idle", [h("p", "", "共有されたプログラムを開きました。「実行」で動かしてみよう。書きかえると、あなたのプログラムとして保存されます。"), h("div", "actions", null)]);
  ui.result.querySelector(".actions").appendChild(back);
}
async function copyLink() {
  const url = location.href.split("#")[0] + "#step-" + stage.id + "&code=" + encodeCode(ui.code.value);
  let ok = false;
  try { await navigator.clipboard.writeText(url); ok = true; } catch (e) { ok = false; }
  if (ok) { setResult("idle", [h("p", "", "このプログラムを開くリンクをコピーしました。となりの人や先生に送って見せられます。")]); return; }
  const box = h("input", "linkbox"); box.type = "text"; box.readOnly = true; box.value = url; box.setAttribute("aria-label", "共有リンク");
  setResult("idle", [h("p", "", "コピーできなかったので、下のリンクを選んでコピーしてください。"), box]);
  box.focus(); box.select();
}
function renderHints() {
  const list = HINTS[stage.id] || [];
  if (LIFE[stage.id]) { const p = h("p", "life"); p.appendChild(h("b", "", "くらしの中では")); p.appendChild(document.createTextNode(LIFE[stage.id])); ui.body.appendChild(p); }
  const goal = GOAL_LINES[stage.id];
  if (goal != null) {
    const best = store.data.best[stage.id];
    ui.body.appendChild(h("p", "challenge", `最短チャレンジ：${goal} 行以下でクリアすると ★${best != null ? `（自分の記録 ${best} 行）` : ""}`));
  }
  if (!list.length) return;
  const box = h("div", "hints");
  const shown = teaching() ? list.length : Math.min(store.data.hints[stage.id] || 0, list.length);
  list.slice(0, shown).forEach((t, i) => { const p = h("p", "hint"); p.appendChild(h("b", "", `ヒント${i + 1}`)); p.appendChild(document.createTextNode(t)); box.appendChild(p); });
  if (shown < list.length) {
    const b = h("button", "btn small", shown ? `次のヒント（${shown + 1} / ${list.length}）` : `ヒントを見る（${list.length} つ）`);
    b.type = "button";
    b.addEventListener("click", () => {
      store.data.hints[stage.id] = shown + 1; store.save();
      const old = ui.body.querySelector(".hints"); const ch = ui.body.querySelector(".challenge");
      const lf = ui.body.querySelector(".life");
      if (old) old.remove(); if (ch) ch.remove(); if (lf) lf.remove();
      renderHints();
      const ps = ui.body.querySelectorAll(".hint"); if (ps.length) { ps[ps.length - 1].setAttribute("tabindex", "-1"); ps[ps.length - 1].focus(); }
    });
    box.appendChild(b);
  }
  ui.body.appendChild(box);
}
/* 予想してから実行（ステップ1・2） */
let guess = null;
function renderPredict() {
  const box = $("predict");
  box.textContent = ""; box.hidden = !stage.predict; guess = null;
  if (!stage.predict) return;
  const row = stage.map.find((r) => r.includes("S"));
  const max = row.slice(row.indexOf("S") + 1).replace(/#.*$/, "").length;
  box.appendChild(h("p", "", "実行する前に予想しよう。ロボットは、スタートから何マス進む？"));
  const btns = h("div", "predict-btns");
  for (let n = 0; n <= max; n++) {
    const b = h("button", "btn small", `${n} マス`); b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      guess = n;
      btns.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      world.pin(n);
    });
    btns.appendChild(b);
  }
  box.appendChild(btns);
}
function focusHead() {
  const hd = $("st-head"); hd.setAttribute("tabindex", "-1"); hd.focus({ preventScroll: true });
  hd.scrollIntoView({ block: "start", behavior: calm() ? "auto" : "smooth" });
}
function openStage(id, setHash) {
  stage = STAGES.find((s) => s.id === id) || STAGES[0];
  if (stage.id !== id && /^#step-/.test(location.hash)) setHash = true;
  runToken++;
  if (py) setPlaying(false);
  last = null; flowInfo = null;
  store.data.last = stage.id; store.save();
  if (setHash && location.hash !== "#step-" + stage.id) { try { history.replaceState(null, "", "#step-" + stage.id); } catch (e) { location.hash = "step-" + stage.id; } }
  renderSteps();
  ui.num.textContent = stage.n;
  ui.stageTitle.textContent = stage.kind === "trace" ? "変数の箱" : "ロボット";
  ui.kicker.textContent = stage.kicker;
  ui.title.textContent = stage.title;
  ui.body.innerHTML = stage.body; // STAGES に書いた自前の文だけを入れる
  renderHints();

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

  $("opt-step").hidden = stage.kind !== "maze";
  if (stage.kind !== "maze" && ui.speed.value === "step") ui.speed.value = "340";
  $("door-pick").hidden = !(teaching() && stage.door);
  world = stage.kind === "maze" ? buildMaze(stage) : stage.kind === "trace" ? buildTrace(stage) : buildPad();
  renderPredict();
  ui.world.classList.toggle("fixed", stage.kind !== "trace");
  if (typeof worldZoom !== "undefined") worldZoom.reset();
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
ui.reset.addEventListener("click", () => {
  runToken++; if (py) setPlaying(false);
  setCode(stage.code);
  setResult("idle", [h("p", "", "最初のプログラムに戻しました。まちがえて押したときは、Ctrl + Z（Mac は ⌘ + Z）で取り消せます。")]);
});
window.addEventListener("hashchange", () => {
  const id = parseHash();
  if (id != null && id !== stage.id) openStage(id, false);
  if (sharedCode() != null) openShared();
});
$("share").addEventListener("click", copyLink);

/* ------------------------------------------------------------------ 目次（開け閉め） */
const toc = $("toc"), tocBtn = $("toc-btn");
const wide = window.matchMedia("(min-width: 1700px)");
function tocDocked() { return wide.matches; }
function setToc(open, focusBack) {
  toc.hidden = !open;
  tocBtn.setAttribute("aria-expanded", String(open));
  document.documentElement.classList.toggle("toc-open", open);
  if (tocDocked()) { store.data.toc = open; store.save(); }
  if (open) (toc.querySelector(".step.current") || $("toc-close")).focus({ preventScroll: false });
  else if (focusBack) tocBtn.focus();
}
tocBtn.addEventListener("click", () => setToc(toc.hidden, false));
$("toc-close").addEventListener("click", () => setToc(false, true));
const FRESH = () => ({ code: {}, cleared: {}, last: 1, best: {}, hints: {}, big: false, toc: false, notes: {}, fold: false, teach: false });
function resetAll() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 保存できない環境 */ }
  Object.assign(store.data, FRESH());
  setBig(false); setFold(false); setTeach(false);
  openStage(STAGES[0].id, true);
}
$("reset-all").addEventListener("click", () => {
  const b = $("reset-all");
  if (b.dataset.armed !== "1") {
    b.dataset.armed = "1"; b.textContent = "本当に消す（もう一度押す）";
    setTimeout(() => { b.dataset.armed = ""; b.textContent = "この端末の記録をすべて消す"; }, 4000);
    return;
  }
  b.dataset.armed = ""; b.textContent = "この端末の記録をすべて消す";
  resetAll();
  setResult("idle", [h("p", "", "この端末の記録（プログラム・クリア・★・ヒント）をすべて消しました。")]);
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !toc.hidden && !tocDocked() && ev.target !== ui.code) setToc(false, true);
});
document.addEventListener("pointerdown", (ev) => {
  if (!toc.hidden && !tocDocked() && !toc.contains(ev.target) && !tocBtn.contains(ev.target)) setToc(false, false);
});

const big = $("big");
function setBig(on) {
  document.documentElement.classList.toggle("big", on);
  big.setAttribute("aria-pressed", String(on));
  store.data.big = on; store.save();
  refreshGutter();
}
big.addEventListener("click", () => setBig(big.getAttribute("aria-pressed") !== "true"));

const worldZoom = addZoom($("world-frame"), ui.world, "実行の様子", () => {
  const n = Number(ui.world.dataset.natural);
  if (!n) return 1;
  const f = $("world-frame"), cs = getComputedStyle(f);
  const cap = document.documentElement.classList.contains("teach") ? 2 : 1;
  return Math.min(cap, Math.floor(((f.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8) / n) * 100) / 100);
}, "全体を表示");
const flowZoom = addZoom($("flow-frame"), ui.flow, "フローチャート", () => {
  const svgEl = ui.flow.querySelector("svg");
  if (!svgEl) return 1;
  const room = $("flow-frame").clientWidth - 8;
  const cap = document.documentElement.classList.contains("teach") ? 1.4 : 1;
  return Math.min(cap, room / Number(svgEl.getAttribute("width")));
}, "全体を表示", 0.6);
window.addEventListener("resize", () => { flowZoom.refit(); worldZoom.refit(); refreshGutter(); });

/* 説明をたたむ */
function setFold(on) {
  document.querySelector(".guide").classList.toggle("folded", on);
  const b = $("fold");
  b.setAttribute("aria-expanded", String(!on));
  b.textContent = on ? "説明をひらく" : "説明をたたむ";
  store.data.fold = on; store.save();
}
$("fold").addEventListener("click", () => setFold(!document.querySelector(".guide").classList.contains("folded")));

/* ------------------------------------------------------------------ 授業モード（先生がプロジェクターに映すとき） */
const teaching = () => document.documentElement.classList.contains("teach");
function setTeach(on) {
  if (!on && $("teach-badge").contains(document.activeElement)) big.focus({ preventScroll: true });
  document.documentElement.classList.toggle("teach", on);
  $("teach-badge").hidden = !on;
  $("teach-on").textContent = on ? "授業モードを終わる" : "授業モードにする";
  store.data.teach = on; store.save();
  if (stage) { $("door-pick").hidden = !(on && stage.door); const hs = ui.body.querySelector(".hints"); const lf = ui.body.querySelector(".life"); const ch = ui.body.querySelector(".challenge"); for (const x of [hs, lf, ch]) if (x) x.remove(); renderHints(); }
  worldZoom.refit(); flowZoom.refit(); refreshGutter();
}
$("teach-on").addEventListener("click", () => { const on = !teaching(); setTeach(on); if (!tocDocked()) setToc(false, true); });
$("teach-off").addEventListener("click", () => setTeach(false));

/* ------------------------------------------------------------------ まとめ（各時間の最後） */
const SUM_CARDS = {
  1: [["seq", "順次", 1, "命令は上から順に1つずつ実行される。"], ["loop", "反復", 2, "同じ命令は for でくり返しにまとめられる。"], ["sel", "選択", 3, "if で、場合によってすることを変えられる。"]],
};
function openSummary(lesson) {
  const dlg = $("summary"), body = $("sum-body");
  const name = (LESSONS.find(([n]) => n === lesson) || [lesson, ""])[1];
  $("sum-title").textContent = `第${lesson}時のまとめ　${name}`;
  body.textContent = "";
  const steps = STAGES.filter((s) => s.lesson === lesson);
  const done = steps.filter((s) => store.data.cleared[s.id]).length;
  const stars = steps.filter((s) => hasStar(s)).length, starMax = steps.filter((s) => GOAL_LINES[s.id] != null).length;
  body.appendChild(h("p", "sum-score", `クリア ${done} / ${steps.length} ステップ${starMax ? `　★ ${stars} / ${starMax}` : ""}`));
  const cards = SUM_CARDS[lesson];
  if (cards) {
    body.appendChild(h("p", "", "どんなプログラムも、この3つの組み合わせでできています。あなたが書いたプログラムで確かめよう。"));
    const row = h("div", "sum-cards");
    for (const [hue, title, id, text] of cards) {
      const c = h("section", "sum-card " + hue);
      c.appendChild(h("h3", "", title));
      c.appendChild(h("p", "", text));
      const own = store.data.code[id];
      const ls = (own != null ? own : STAGES.find((x) => x.id === id).code).trim().split("\n");
      c.appendChild(h("pre", "", ls.slice(0, 8).join("\n") + (ls.length > 8 ? `\n…（あと ${ls.length - 8} 行）` : "")));
      row.appendChild(c);
    }
    body.appendChild(row);
  } else {
    const ul = h("ul", "sum-list");
    for (const st of steps) ul.appendChild(h("li", "", `${store.data.cleared[st.id] ? "✓" : "　"} ステップ${st.n} ${st.title}`));
    body.appendChild(ul);
  }
  const lifeNotes = steps.map((st) => LIFE[st.id]).filter(Boolean);
  if (lifeNotes.length) {
    body.appendChild(h("h3", "", "くらしの中のアルゴリズム"));
    const ul = h("ul", "sum-list");
    for (const t of lifeNotes) ul.appendChild(h("li", "", t));
    body.appendChild(ul);
  }
  body.appendChild(h("h3", "", "ふりかえり"));
  const lab = h("label", "sum-label", "今日わかったことと、身の回りで見つけた「順次・反復・選択」の例を書こう。");
  lab.setAttribute("for", "sum-note");
  const ta = document.createElement("textarea"); ta.id = "sum-note"; ta.rows = 4; ta.className = "sum-note";
  store.data.notes = store.data.notes || {};
  ta.value = store.data.notes[lesson] || "";
  ta.addEventListener("input", () => { store.data.notes[lesson] = ta.value; store.save(); });
  const copy = h("button", "btn small", "ふりかえりをコピー"); copy.type = "button";
  const msg = h("p", "sub", ""); msg.setAttribute("role", "status");
  copy.addEventListener("click", async () => {
    const text = `第${lesson}時 ${name}\nクリア ${done}/${steps.length}\n${ta.value}`;
    try { await navigator.clipboard.writeText(text); msg.textContent = "コピーしました。提出先に貼り付けてください。"; }
    catch (e) { ta.focus(); ta.select(); msg.textContent = "コピーできなかったので、文字を選んで Ctrl + C でコピーしてください。"; }
  });
  body.append(lab, ta, h("div", "actions"));
  body.lastChild.append(copy);
  body.appendChild(msg);
  const nx = STAGES.find((st) => st.lesson === lesson + 1);
  if (nx) {
    const go = h("button", "btn small", `第${lesson + 1}時へ`); go.type = "button";
    go.addEventListener("click", () => { dlg.close(); openStage(nx.id, true); focusHead(); });
    body.lastElementChild.previousElementSibling.appendChild(go);
  }
  if (!dlg.open) { sumOpener = document.activeElement; dlg.showModal(); }
}
let sumOpener = null;
$("sum-close").addEventListener("click", () => $("summary").close());
$("summary").addEventListener("close", () => {
  const o = sumOpener; sumOpener = null;
  if (o && o.isConnected && o.offsetParent !== null) o.focus(); else tocBtn.focus();
});

(function init() {
  if (/[?&]reset=1\b/.test(location.search)) {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 同上 */ }
    Object.assign(store.data, FRESH());
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { /* そのまま */ }
  }
  if (store.data.big) setBig(true);
  if (store.data.fold) setFold(true);
  if (/[?&]teach\b/.test(location.search)) {
    store.data.teach = true;
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { /* そのまま */ }
  }
  if (store.data.teach) setTeach(true);
  if (store.data.toc && tocDocked()) { toc.hidden = false; tocBtn.setAttribute("aria-expanded", "true"); document.documentElement.classList.add("toc-open"); }
  openStage(parseHash() ?? store.data.last ?? 1, false);
  if (sharedCode() != null) openShared();
  worldZoom.refit();
  boot();
})();
