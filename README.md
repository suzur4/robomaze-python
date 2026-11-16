# ロボ迷路 Python

情報Ⅰ「アルゴリズムとプログラミング」第1時（アルゴリズムとその表記）の模擬授業用教材。
ブラウザだけで Python が動き、ロボットを動かしながら順次・反復・選択の3つの構造を学ぶ。

## ステップ

| | 内容 | 教科書（実教出版『最新情報Ⅰ』） |
|---|---|---|
| 1 | 順番に並べる（順次） | p.164 |
| 2 | くり返しにまとめる（反復・for） | p.164 |
| 3 | 場合分け（選択・if）。ドアの開閉は実行のたびに両方テストされる | p.164〜165 例題3 |
| 4 | 3つを組み合わせて自分で解く | p.165 確認問題、p.166 |
| 5 | right() が使えないロボット | p.165 確認問題の後半 |
| 6 | 模様を描く（発展） | |
| 7 | フラクタル（まとめの実演） | |

迷路とロボットの絵は自作で、教科書の図は使っていない。

画面の青・黄・赤は、順次・反復・選択の3つの構造を表す。フローチャート、ステップの番号、命令ボタンで同じ色を使っている。

## 手元で動かす

`index.html` をダブルクリックしても動かない（ブラウザが Python 本体を読み込めない）。
このフォルダで簡単なサーバを立てて開く。

```
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開く。

## GitHub Pages で公開する

1. このフォルダの中身をリポジトリの直下（または `docs/`）に置いて push する
2. リポジトリの Settings → Pages で、公開するブランチとフォルダを選ぶ
3. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で開ける

`.nojekyll` を同梱している（GitHub Pages がファイルを加工しないようにするため）。

## ファイル

- `index.html` / `style.css` / `app.js` … 画面
- `tokens.css` / `base.css` … 色・書体・余白の決まりと、全ページ共通の基本スタイル
- `robot.py` … Python 側。生徒のプログラムを実行して、ロボットの動きを記録する
- `pyodide/` … ブラウザで動く Python 本体（Pyodide 314.0.8、約13MB）。
  このフォルダを消すと、同じ版を CDN（jsDelivr）から読み込む

## 中身を変える

- ステップの文・迷路・最初のプログラム：`app.js` の先頭の `STAGES`
  - 迷路は文字で書く。`#` 壁、`.` 通路、`S` スタート、`G` ゴール
  - `door: true` でゴールにドアが付く。`disabled: ["right"]` で命令を故障させる
- ロボットの命令とエラーの文：`robot.py`

## 生徒が使える命令

迷路: `forward()` `left()` `right()` `open_door()` `door_is_open()`

模様: `forward(100)` `back(50)` `left(90)` `right(90)` `color("red")` `width(3)`
`pen_up()` `pen_down()` `goto(x, y)` `dot()` `dot(x, y)`

## 保存されるもの

進み具合と書いたプログラムは、その端末のブラウザ（localStorage）にだけ保存される。
外部には何も送らない。

## 使っているもの

- [Pyodide](https://pyodide.org/)（Mozilla Public License 2.0）
- Google Fonts: Jost、Zen Kaku Gothic New、M PLUS 1 Code（SIL Open Font License）
