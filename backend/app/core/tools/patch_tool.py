import os
import re
import subprocess

_HUNK_HEADER = re.compile(
    r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$"
)


def _is_hunk_body_line(line: str) -> bool:
    if not line:
        return False
    return line[0] in " +-\\"


def _count_hunk_lines(body: list[str]) -> tuple[int, int]:
    """Return (old_line_count, new_line_count) for a unified-diff hunk body."""
    old_n, new_n = 0, 0
    for line in body:
        if not line:
            continue
        c = line[0]
        if c == " ":
            old_n += 1
            new_n += 1
        elif c == "-":
            old_n += 1
        elif c == "+":
            new_n += 1
        elif c == "\\":
            continue
        else:
            break
    return old_n, new_n


def repair_unified_diff_hunks(patch: str) -> str:
    """
    Rewrite @@ hunk headers so old/new line counts match the following body.
    LLM-generated diffs often declare the wrong count; git then errors with
    'corrupt patch at line N' when an extra '+' line sits past the header.
    """
    text = patch.replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    out: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        m = _HUNK_HEADER.match(line)
        if not m:
            out.append(line)
            i += 1
            continue

        old_start = int(m.group(1))
        new_start = int(m.group(3))
        rest = m.group(5) or ""

        j = i + 1
        while j < n:
            bl = lines[j]
            if bl.startswith("diff --git"):
                break
            if _HUNK_HEADER.match(bl):
                break
            if _is_hunk_body_line(bl):
                j += 1
                continue
            break

        body = lines[i + 1 : j]
        old_cnt, new_cnt = _count_hunk_lines(body)
        new_header = f"@@ -{old_start},{old_cnt} +{new_start},{new_cnt} @@{rest}"
        out.append(new_header)
        out.extend(body)
        i = j

    return "\n".join(out)


def _strip_trailing_ws_on_adds(patch: str) -> str:
    fixed: list[str] = []
    for line in patch.split("\n"):
        if line.startswith("+") and line.rstrip() != line:
            fixed.append(line.rstrip())
        else:
            fixed.append(line)
    return "\n".join(fixed)


def prepare_patch_for_git_apply(patch: str) -> str:
    patch = patch.replace("\r\n", "\n").replace("\r", "\n")
    patch = _strip_trailing_ws_on_adds(patch)
    return repair_unified_diff_hunks(patch)


def apply_patch(patch: str):
    try:
        patch = prepare_patch_for_git_apply(patch)
        with open("temp.patch", "w", encoding="utf-8", newline="\n") as f:
            f.write(patch)
            if not patch.endswith("\n"):
                f.write("\n")

        result = subprocess.run(
            [
                "git",
                "apply",
                "--recount",
                "--whitespace=fix",
                "temp.patch",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print("PATCH ERROR:", (result.stderr or "").strip() or result.stdout)
            try:
                os.remove("temp.patch")
            except OSError:
                pass
            return False

        try:
            os.remove("temp.patch")
        except OSError:
            pass
        return True

    except Exception as e:
        print("EXCEPTION:", str(e))
        try:
            os.remove("temp.patch")
        except OSError:
            pass
        return False
