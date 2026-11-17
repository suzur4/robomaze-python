# -*- coding: utf-8 -*-
"""ロボ迷路のPython側。

ブラウザ（Pyodide）に一度だけ読み込まれる。生徒が書いたプログラムをここで実行し、
ロボットの動きを「記録」して JSON で返す。画面の動きは app.js が記録を再生して作る。

JavaScript から呼ぶ入口は3つ:
    run_maze(code, stage_json, door_open)  迷路で実行
    run_draw(code)                         模様づくりで実行
    flow(code, mode)                       プログラムをフローチャートの部品に変換
"""
import ast
import difflib
import io
import json
import math
import sys
import unicodedata

USER_FILE = "<あなたのプログラム>"
MAX_LINES = 300_000      # これを超えて行を実行したら「くり返しが終わらない」とみなす
MAX_MAZE_ACTIONS = 400
MAX_DRAW_ACTIONS = 30_000


class RobotStop(BaseException):
    """ロボットが止まった（壁にぶつかった等）。論理エラーとして扱う。
    生徒の except Exception: でつかまらないように BaseException から作る。"""


class _Finished(BaseException):
    """ゴールに着いたので、残りの命令は実行しない。"""


def _user_line():
    """いま実行している、生徒のプログラムの行番号。"""
    f = sys._getframe(1)
    while f is not None:
        if f.f_code.co_filename == USER_FILE:
            return f.f_lineno
        f = f.f_back
    return None


def _no_args(name, args, kwargs):
    if args or kwargs:
        raise RobotStop(
            f"{name}() の ( ) の中には何も書きません。"
            f"迷路では {name}() と書くと1回分だけ動きます。"
        )


# ---------------------------------------------------------------- 迷路

DIRS = [(1, 0), (0, 1), (-1, 0), (0, -1)]  # 0:右 1:下 2:左 3:上


class Maze:
    def __init__(self, stage, door_open):
        self.rows = stage["map"]
        self.has_door = bool(stage.get("door"))
        self.door_open = bool(door_open)
        self.disabled = set(stage.get("disabled", []))
        self.dir = stage.get("dir", 0)
        self.actions = []
        self.goal = False
        for y, row in enumerate(self.rows):
            for x, ch in enumerate(row):
                if ch == "S":
                    self.x, self.y = x, y
                elif ch == "G":
                    self.gx, self.gy = x, y

    def cell(self, x, y):
        if 0 <= y < len(self.rows) and 0 <= x < len(self.rows[y]):
            return self.rows[y][x]
        return "#"

    def ahead(self):
        dx, dy = DIRS[self.dir]
        return self.x + dx, self.y + dy

    def facing_door(self):
        return self.has_door and self.ahead() == (self.gx, self.gy)

    def rec(self, **a):
        if len(self.actions) >= MAX_MAZE_ACTIONS:
            raise RobotStop("命令の回数が多すぎます。くり返しの回数を確認しよう。")
        a["line"] = _user_line()
        self.actions.append(a)

    def check(self, name):
        if name in self.disabled:
            self.rec(t="bump")
            raise RobotStop(f"この迷路では {name}() が故障していて使えません。")

    # --- 生徒が使う命令 ---
    def forward(self, *args, **kwargs):
        _no_args("forward", args, kwargs)
        self.check("forward")
        if self.goal:
            self.rec(t="bump")
            raise RobotStop("もうゴールしています。ゴールのあとにも進む命令が残っていて、ゴールを通り過ぎました。")
        nx, ny = self.ahead()
        c = self.cell(nx, ny)
        if c == "#":
            self.rec(t="bump")
            raise RobotStop("壁にぶつかりました。")
        if c == "G" and self.has_door and not self.door_open:
            self.rec(t="bump")
            raise RobotStop("ドアが閉まっていて、ぶつかりました。")
        self.x, self.y = nx, ny
        self.rec(t="move", x=nx, y=ny)
        if c == "G":
            self.goal = True
            self.rec(t="goal")

    def left(self, *args, **kwargs):
        _no_args("left", args, kwargs)
        self.check("left")
        self.dir = (self.dir - 1) % 4
        self.rec(t="turn", d=-1)

    def right(self, *args, **kwargs):
        _no_args("right", args, kwargs)
        self.check("right")
        self.dir = (self.dir + 1) % 4
        self.rec(t="turn", d=1)

    def open_door(self, *args, **kwargs):
        _no_args("open_door", args, kwargs)
        if not self.facing_door():
            self.rec(t="bump")
            raise RobotStop("目の前にドアがありません。ドアの前まで進んでから開けよう。")
        if self.door_open:
            self.rec(t="bump")
            raise RobotStop("ドアはもう開いています。開いているドアを開けようとして、空振りしました。")
        self.door_open = True
        self.rec(t="open")

    def door_is_open(self, *args, **kwargs):
        _no_args("door_is_open", args, kwargs)
        if not self.facing_door():
            self.rec(t="bump")
            raise RobotStop("ドアの前にいないので、ドアの様子が見えません。")
        self.rec(t="look", open=self.door_open)
        return self.door_open


# ---------------------------------------------------------------- 模様づくり

class Pen:
    """原点は画面の中央。x は右、y は上がプラス。はじめは右向き。"""

    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self.h = 0.0
        self.down = True
        self.col = "#161412"
        self.w = 2
        self.actions = []

    def rec(self, *a):
        if len(self.actions) >= MAX_DRAW_ACTIONS:
            raise RobotStop("命令の回数が多すぎます。くり返しの回数を減らそう。")
        self.actions.append(list(a) + [_user_line()])

    @staticmethod
    def num(name, v, what):
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            raise RobotStop(f"{name}( ) の中には{what}を数で書きます。例: {name}(100)")
        try:
            f = float(v)
        except OverflowError:
            f = math.inf
        if not math.isfinite(f) or abs(f) > 1e6:
            raise RobotStop(f"{name}( ) の数が大きすぎます。-1000000 から 1000000 までの数にしよう。")
        return f

    def _go(self, nx, ny):
        if not (math.isfinite(nx) and math.isfinite(ny)) or abs(nx) > 1e6 or abs(ny) > 1e6:
            raise RobotStop("ロボットが遠くへ行きすぎました。進む長さを小さくしよう。")
        if self.down:
            self.rec("L", round(self.x, 2), round(self.y, 2), round(nx, 2), round(ny, 2), self.col, self.w)
        else:
            self.rec("M", round(nx, 2), round(ny, 2))
        self.x, self.y = nx, ny

    def forward(self, *args):
        if len(args) != 1:
            raise RobotStop("ここでは forward(100) のように、進む長さを ( ) の中に書きます。")
        d = self.num("forward", args[0], "進む長さ")
        r = math.radians(self.h)
        self._go(self.x + d * math.cos(r), self.y + d * math.sin(r))

    def back(self, *args):
        if len(args) != 1:
            raise RobotStop("back(50) のように、下がる長さを ( ) の中に書きます。")
        self.forward(-self.num("back", args[0], "下がる長さ"))

    def left(self, *args):
        if len(args) != 1:
            raise RobotStop("ここでは left(90) のように、回る角度を ( ) の中に書きます。")
        self.h = (self.h + self.num("left", args[0], "回る角度")) % 360
        self.rec("T", round(self.h, 2))

    def right(self, *args):
        if len(args) != 1:
            raise RobotStop("ここでは right(90) のように、回る角度を ( ) の中に書きます。")
        self.h = (self.h - self.num("right", args[0], "回る角度")) % 360
        self.rec("T", round(self.h, 2))

    def color(self, *args):
        if len(args) != 1 or not isinstance(args[0], str):
            raise RobotStop('color("red") のように、色の名前を " " で囲んで書きます。')
        self.col = args[0]

    def width(self, *args):
        if len(args) != 1:
            raise RobotStop("width(3) のように、線の太さを書きます。")
        self.w = max(0.5, min(30.0, self.num("width", args[0], "線の太さ")))

    def pen_up(self, *args, **kwargs):
        if args or kwargs:
            raise RobotStop("pen_up() の ( ) の中には何も書きません。")
        self.down = False

    def pen_down(self, *args, **kwargs):
        if args or kwargs:
            raise RobotStop("pen_down() の ( ) の中には何も書きません。")
        self.down = True

    def goto(self, *args):
        if len(args) != 2:
            raise RobotStop("goto(0, 100) のように、行き先の x と y を書きます。")
        self._go(self.num("goto", args[0], "x と y"), self.num("goto", args[1], "x と y"))

    def dot(self, *args):
        if len(args) == 0:
            x, y = self.x, self.y
        elif len(args) == 2:
            x, y = self.num("dot", args[0], "x と y"), self.num("dot", args[1], "x と y")
        else:
            raise RobotStop("dot(x, y) のように、点を打つ場所の x と y を書きます。")
        self.rec("D", round(x, 2), round(y, 2), self.col, max(self.w, 2))


# ---------------------------------------------------------------- 実行

def _tracer_factory(on_line=None):
    count = 0

    def tracer(frame, event, arg):
        nonlocal count
        if frame.f_code.co_filename != USER_FILE:
            return None
        if event == "line":
            if frame.f_lineno == 0:
                return tracer
            count += 1
            if count > MAX_LINES:
                raise RobotStop("くり返しが終わりません。while の条件や、くり返しの回数を確認しよう。")
            if on_line:
                on_line(frame)
        return tracer

    return tracer


def _no_input(*a, **k):
    raise RobotStop("このページでは input() は使えません。数はプログラムの中に直接書こう。")


SYNTAX_JA = [
    ("expected ':'", "行の終わりに : （コロン）が必要です。for や if の行は : で終わります。"),
    ("was never closed", "かっこ ( が閉じられていません。 ) を書き足そう。"),
    ("unmatched ')'", "かっこ ) が多すぎます。"),
    ("expected an indented block", ": の次の行は字下げ（半角スペース4つ）が必要です。"),
    ("unexpected indent", "字下げが多すぎます。行の先頭のスペースを消そう。"),
    ("unindent does not match", "字下げの幅がそろっていません。スペース4つずつにそろえよう。"),
    ("U+3000", "全角スペースがまざっています。半角スペースに直そう。"),
    ("invalid character", "全角の記号がまざっています。( ) や : は半角で入力しよう。"),
    ("invalid non-printable", "全角スペースなど、見えない文字がまざっています。半角に直そう。"),
    ("unterminated string", '文字を囲む " が閉じられていません。'),
    ("Missing parentheses", "命令のあとに ( ) が必要です。"),
    ("inconsistent use of tabs", "字下げに Tab とスペースがまざっています。スペース4つにそろえよう。"),
    ("Maybe you meant '=='", "くらべるときは = ではなく == を使います。= は箱に入れる（代入）ときの記号です。"),
    ("forgot a comma", "( ) の中で、区切りの , （カンマ）が抜けていないか確認しよう。"),
    ("invalid syntax", "書き方が Python のルールに合っていません。つづりと記号を確認しよう。"),
]

TYPE_JA = {"int": "整数", "float": "小数", "str": "文字", "list": "リスト", "bool": "True / False", "NoneType": "None（何もない）", "dict": "辞書", "tuple": "タプル"}


def _type_ja(name):
    return TYPE_JA.get(name, name)


def _wide_char(msg):
    """「invalid character '８' (U+FF18)」から、まざった全角文字の説明を作る。"""
    import re
    m = re.search(r"invalid character '(.)'", msg)
    if not m:
        return None
    c = m.group(1)
    half = unicodedata.normalize("NFKC", c)
    if c in "“”＂":
        half = '"'
    elif c in "‘’＇":
        half = "'"
    elif c in "、，":
        half = ","
    elif c in "。．":
        half = "."
    elif c in "ー－−":
        half = "-"
    if half == c or not half.isascii():
        return f"「{c}」は Python では使えない文字です。半角の英数字と記号に直そう。"
    kind = "数字" if half.isdigit() else "英字" if half.isalpha() else "記号"
    return f"全角の{kind}「{c}」がまざっています。半角の {half} に直そう。"


def _runtime_ja(e, src):
    """よくある実行時エラーを、高校生向けの説明に変える。わからないときは None。"""
    t = str(e)
    if isinstance(e, TypeError):
        import re
        m = re.search(r"'(\w+)' object is not iterable", t)
        if m:
            return (f"for の in の後ろに{_type_ja(m.group(1))}がそのまま書かれています。"
                    "回数をくり返すときは range(8) のように range( ) で囲もう。")
        m = re.search(r"'(\w+)' object cannot be interpreted as an integer", t)
        if m:
            k = m.group(1)
            extra = {"str": ' " " で囲むと文字になります。数は " を付けずに書きます。',
                     "float": " 小数は使えません。わり算は // を使うと整数になります。"}.get(k, "")
            return f"range( ) の中には整数を書きます。いまは{_type_ja(k)}が入っています。{extra}"
        if "can only concatenate str" in t or ("unsupported operand" in t and "'str'" in t):
            return '数と文字は + でつなげません。print("答え", x) のように , で区切るか、str(x) で文字にしよう。'
        m = re.search(r"object of type '(\w+)' has no len\(\)", t)
        if m:
            return f"len( ) で長さを調べられるのはリストや文字だけです。いまは{_type_ja(m.group(1))}に使っています。"
        m = re.search(r"(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given", t)
        if m:
            return f"{m.group(1)}( ) には ( ) の中に {m.group(2)} 個の値を渡します。いまは {m.group(3)} 個です。"
        m = re.search(r"(\w+)\(\) missing (\d+) required positional argument", t)
        if m:
            return f"{m.group(1)}( ) の ( ) の中に、渡す値が足りません。"
        if "unsupported operand" in t or "not supported between" in t:
            return "計算やくらべる記号の両側に、組み合わせられない種類の値があります。"
    if isinstance(e, IndexError):
        return "リストの範囲の外を見ています。添字は 0 から始まり、最後は「長さ − 1」です。"
    if isinstance(e, AttributeError):
        name = getattr(e, "name", None)
        obj = getattr(e, "obj", None)
        if name is not None and obj is not None:
            k = type(obj).__name__
            msg = f"{_type_ja(k)}には .{name} という命令はありません。"
            if k == "list" and name in ("push", "add", "insert_last"):
                msg += "リストの最後に足すときは append を使います。"
            else:
                close = difflib.get_close_matches(name, [d for d in dir(obj) if not d.startswith("_")], n=1, cutoff=0.6)
                if close:
                    msg += f" {close[0]} のことですか？"
            return msg
    if isinstance(e, KeyError):
        return f"辞書に {e} という見出しはありません。"
    if isinstance(e, ValueError) and "invalid literal for int()" in t:
        return "int( ) で整数にできるのは、数字だけの文字です。"
    return None


def _describe(e, names, code=""):
    """例外を、画面に出す説明に変える。"""
    raw = f"{type(e).__name__}: {e}"
    line = None
    tb = e.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == USER_FILE:
            line = tb.tb_lineno
        tb = tb.tb_next

    if isinstance(e, RobotStop):
        return {"kind": "logic", "message": str(e), "line": line, "raw": ""}

    if isinstance(e, SyntaxError):
        msg = e.msg or ""
        ja = "書き方が Python のルールに合っていません。つづりと記号を確認しよう。"
        for key, text in SYNTAX_JA:
            if key in msg:
                ja = text
                break
        lines = code.split("\n")
        src = lines[e.lineno - 1].strip() if e.lineno and 0 < e.lineno <= len(lines) else ""
        wide = _wide_char(msg) if "invalid character" in msg else None
        if wide:
            ja = wide
        elif src.startswith("else if") or src.startswith("elseif"):
            ja = "Python では else if ではなく elif と書きます。例: elif x == 2:"
        elif (src.startswith("else") or src.startswith("elif")) and msg.startswith("invalid syntax"):
            ja = "else や elif の前には、同じ字下げの if が必要です。字下げの位置をそろえよう。"
        return {"kind": "syntax", "message": ja, "line": e.lineno, "raw": f"{type(e).__name__}: {msg}"}

    if isinstance(e, NameError):
        name = getattr(e, "name", None) or ""
        src_lines = code.split("\n")
        src = src_lines[line - 1] if line and 0 < line <= len(src_lines) else ""
        if "color(" in src and f'"{name}"' not in src and f"'{name}'" not in src:
            ja = f'色の名前は " " で囲みます。例: color("{name}")'
        elif name in ("random", "math"):
            ja = f"{name} を使うには、プログラムの1行目に import {name} と書こう。"
        else:
            close = difflib.get_close_matches(name, names, n=1, cutoff=0.7)
            ja = f"{name} という名前は知りません。つづりを確認しよう。"
            if close:
                ja += f" {close[0]} のことですか？"
        return {"kind": "syntax", "message": ja, "line": line, "raw": raw}

    if isinstance(e, TypeError) and "not callable" in str(e):
        return {"kind": "other", "message": "命令ではないものに ( ) を付けています。", "line": line, "raw": raw}
    if isinstance(e, ZeroDivisionError):
        return {"kind": "other", "message": "0 で割ることはできません。", "line": line, "raw": raw}
    if isinstance(e, SystemExit):
        return {"kind": "other", "message": "exit() や quit() はこのページでは使えません。プログラムは最後まで実行すると自然に終わります。", "line": line, "raw": raw}
    if isinstance(e, RecursionError):
        return {"kind": "logic", "message": "関数が自分を呼び出し続けて終わりません。終わる条件を確認しよう。", "line": line, "raw": raw}
    src_lines = code.split("\n")
    src = src_lines[line - 1] if line and 0 < line <= len(src_lines) else ""
    ja = _runtime_ja(e, src)
    return {"kind": "other", "message": ja or "プログラムの途中でエラーが起きました。", "line": line, "raw": raw}


def _execute(code, api, on_line=None, env_out=None):
    """生徒のプログラムを実行する。戻り値は (エラー情報 or None, print の出力)。"""
    global _OUT
    out = io.StringIO()
    _OUT = out
    env = dict(api)
    env["__name__"] = "__main__"
    env["input"] = _no_input
    env["print"] = lambda *a, **k: print(*a, **{**k, "file": out})
    names = list(api.keys()) + ["print", "range", "for", "if", "else", "elif", "while", "import", "random"]
    err = None
    try:
        compiled = compile(code, USER_FILE, "exec")
        tree = ast.parse(code, USER_FILE)
        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler) and (node.type is None or (isinstance(node.type, ast.Name) and node.type.id == "BaseException")):
                return {"kind": "syntax", "line": node.lineno, "raw": "",
                        "message": "このページでは except: だけの書き方は使えません。except ValueError: のように、つかまえるエラーの種類を書こう。"}, ""
        for node in sorted((n for n in ast.walk(tree) if hasattr(n, "lineno")), key=lambda n: (n.lineno, n.col_offset)):
            if isinstance(node, ast.Expr) and isinstance(node.value, ast.Name) and node.value.id in api:
                err = {"kind": "syntax", "line": node.lineno, "raw": "",
                       "message": f"{node.value.id} のあとに ( ) が必要です。{node.value.id}() と書こう。"}
                return err, ""
            if isinstance(node, (ast.If, ast.While)):
                called = {id(c.func) for c in ast.walk(node.test) if isinstance(c, ast.Call)}
                for sub in ast.walk(node.test):
                    if isinstance(sub, ast.Name) and sub.id in api and id(sub) not in called:
                        err = {"kind": "syntax", "line": node.lineno, "raw": "",
                               "message": f"{sub.id} のあとに ( ) が必要です。{sub.id}() と書かないと、"
                                          "調べた結果ではなく、命令の名前そのものを見てしまいます。"}
                        return err, ""
        sys.settrace(_tracer_factory(on_line))
        try:
            exec(compiled, env)
        finally:
            sys.settrace(None)
    except _Finished:
        pass
    except BaseException as e:  # noqa: BLE001  生徒のプログラムのどんな失敗も画面に出す
        sys.settrace(None)
        err = _describe(e, names, code)
    if env_out is not None:
        env_out.update(env)
    text = out.getvalue()
    if len(text) > 4000:
        text = text[:4000] + "\n…（表示が長いので、ここから先は省略しました）\n"
    return err, text


def run_maze(code, stage_json, door_open):
    stage = json.loads(stage_json)
    m = Maze(stage, door_open)
    api = {
        "forward": m.forward,
        "left": m.left,
        "right": m.right,
        "open_door": m.open_door,
        "door_is_open": m.door_is_open,
    }
    err, out = _execute(code, api)
    if err:
        status = "error"
    elif m.goal:
        status = "goal"
    else:
        status = "short"   # 最後まで実行できたが、ゴールに届いていない
    return json.dumps(
        {"status": status, "actions": m.actions, "error": err, "output": out, "doorStart": bool(door_open)},
        ensure_ascii=False,
    )


def run_draw(code):
    p = Pen()
    api = {
        "forward": p.forward,
        "back": p.back,
        "left": p.left,
        "right": p.right,
        "color": p.color,
        "width": p.width,
        "pen_up": p.pen_up,
        "pen_down": p.pen_down,
        "goto": p.goto,
        "dot": p.dot,
    }
    err, out = _execute(code, api)
    return json.dumps(
        {"status": "error" if err else "done", "actions": p.actions, "error": err, "output": out,
         "end": [round(p.x, 2), round(p.y, 2), round(p.h, 2)]},
        ensure_ascii=False,
    )


# ---------------------------------------------------------------- 変数の箱

MAX_TRACE = 1500
_OUT = None
_SIMPLE = (int, float, str, bool, type(None))


def _show(v):
    """箱に入れて見せられる値だけを返す。見せられないものは None を返す。"""
    try:
        return _show_raw(v)
    except ValueError:  # 桁が多すぎる整数など
        return {"v": "（とても大きな数）"}


def _show_raw(v):
    if isinstance(v, _SIMPLE):
        return {"v": repr(v) if isinstance(v, (str, float)) else str(v)}
    if isinstance(v, (list, tuple)) and len(v) <= 60 and all(isinstance(x, _SIMPLE) for x in v):
        return {"list": [repr(x) if isinstance(x, (str, float)) else str(x) for x in v]}
    return None


def _snapshot(d, skip):
    out = {}
    for k, v in d.items():
        if k in skip or k.startswith("_"):
            continue
        shown = _show(v)
        if shown is not None:
            out[k] = shown
    return out


def run_trace(code):
    """プログラムを1行ずつ追い、各行の直前の変数の中身を記録する。"""
    steps = []
    skip = {"input", "print"}
    state = {"cut": False}

    def on_line(frame):
        if len(steps) >= MAX_TRACE:
            state["cut"] = True
            return
        step = {"line": frame.f_lineno, "vars": _snapshot(frame.f_globals, skip),
                "out": len(_OUT.getvalue()) if _OUT is not None else 0}
        if frame.f_code.co_name != "<module>":
            step["fn"] = frame.f_code.co_name
            step["local"] = _snapshot(frame.f_locals, skip)
        steps.append(step)

    env = {}
    err, out = _execute(code, {}, on_line, env)
    if not err:
        steps.append({"line": None, "vars": _snapshot(env, skip), "out": len(out)})
    return json.dumps(
        {"status": "error" if err else "done", "steps": steps, "error": err, "output": out, "cut": state["cut"]},
        ensure_ascii=False,
    )


# ---------------------------------------------------------------- フローチャート

MAZE_LABEL = {
    "forward": "前に進む",
    "left": "左に90°向く",
    "right": "右に90°向く",
    "open_door": "ドアを開ける",
}


def _src(node):
    try:
        s = ast.unparse(node)
    except Exception:  # noqa: BLE001
        s = "…"
    return s if len(s) <= 26 else s[:25] + "…"


def _call_name(node):
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        return node.func.id
    return None


def _cond(test, mode):
    if _call_name(test) == "door_is_open":
        return "ドアが開いている"
    if isinstance(test, ast.UnaryOp) and isinstance(test.op, ast.Not) and _call_name(test.operand) == "door_is_open":
        return "ドアが閉まっている"
    return _src(test)


def _stmt_label(node, mode):
    """(種類, 表示する文) を返す。種類は proc / io。"""
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
        call = node.value
        name = _call_name(call)
        args = [_src(a) for a in call.args]
        if mode == "maze" and name in MAZE_LABEL and not args:
            return "proc", MAZE_LABEL[name]
        if mode == "draw":
            if name == "forward" and len(args) == 1:
                return "proc", f"{args[0]} 進む"
            if name == "back" and len(args) == 1:
                return "proc", f"{args[0]} 下がる"
            if name == "left" and len(args) == 1:
                return "proc", f"左に {args[0]}° 向く"
            if name == "right" and len(args) == 1:
                return "proc", f"右に {args[0]}° 向く"
            if name == "color" and len(args) == 1:
                return "proc", f"色を {args[0]} にする"
            if name == "width" and len(args) == 1:
                return "proc", f"太さを {args[0]} にする"
            if name == "dot":
                return "proc", "点を打つ" if not args else f"({', '.join(args)}) に点を打つ"
            if name == "goto" and len(args) == 2:
                return "proc", f"({args[0]}, {args[1]}) へ動く"
            if name == "pen_up":
                return "proc", "ペンを上げる"
            if name == "pen_down":
                return "proc", "ペンを下ろす"
        if name == "print":
            return "io", f"{', '.join(args)} を表示"
    return "proc", _src(node)


def _block(stmts, mode):
    out = []
    for s in stmts:
        if isinstance(s, ast.Pass):
            continue
        if isinstance(s, ast.For):
            it = s.iter
            if _call_name(it) == "range" and len(it.args) == 1:
                text = f"{_src(it.args[0])} 回くり返す"
            else:
                text = f"{_src(s.target)} を {_src(it)} の順にくり返す"
            out.append({"k": "loop", "text": text, "line": s.lineno, "body": _block(s.body, mode)})
        elif isinstance(s, ast.While):
            out.append({"k": "loop", "text": f"{_cond(s.test, mode)} 間くり返す", "line": s.lineno,
                        "body": _block(s.body, mode)})
        elif isinstance(s, ast.If):
            out.append({"k": "if", "text": _cond(s.test, mode), "line": s.lineno,
                        "yes": _block(s.body, mode), "no": _block(s.orelse, mode)})
        elif isinstance(s, (ast.FunctionDef, ast.AsyncFunctionDef)):
            out.append({"k": "def", "text": f"関数 {s.name} を定義", "line": s.lineno})
        elif isinstance(s, (ast.Import, ast.ImportFrom)):
            out.append({"k": "def", "text": _src(s), "line": s.lineno})
        else:
            kind, text = _stmt_label(s, mode)
            out.append({"k": kind, "text": text, "line": s.lineno})
    return out


def _count(nodes, kind):
    n = 0
    for nd in nodes:
        if nd["k"] == kind:
            n += 1
        for key in ("body", "yes", "no"):
            if key in nd:
                n += _count(nd[key], kind)
    return n


def flow(code, mode):
    try:
        tree = ast.parse(code, USER_FILE)
    except SyntaxError as e:
        return json.dumps({"ok": False, "line": e.lineno}, ensure_ascii=False)
    nodes = _block(tree.body, mode)
    return json.dumps(
        {"ok": True, "nodes": nodes, "loops": _count(nodes, "loop"), "ifs": _count(nodes, "if")},
        ensure_ascii=False,
    )
