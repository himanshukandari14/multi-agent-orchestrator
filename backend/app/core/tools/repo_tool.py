import os

IGNORE_KEYWORDS = [
    ".venv",
    "node_modules",
    ".git",
    "__pycache__",
    "site-packages",
    "dist",
    "build"
]


def should_ignore(path: str) -> bool:
    return any(ignore in path for ignore in IGNORE_KEYWORDS)


# 🔥 1. Get full repo structure (IMPORTANT for AI awareness)
def get_repo_structure():
    files = []

    for root, dirs, filenames in os.walk("."):
        if should_ignore(root):
            continue

        for file in filenames:
            path = os.path.join(root, file)

            if should_ignore(path):
                continue

            files.append(path)

    return files[:100]  # limit to avoid token explosion


# 🔥 2. Get relevant file content (FOCUSED, NOT EVERYTHING)
def get_repo_files_content():
    file_data = []

    for root, dirs, files in os.walk("."):
        if should_ignore(root):
            continue

        for file in files:
            path = os.path.join(root, file)

            if should_ignore(path):
                continue

            # ✅ PRIORITY: README + docs + important text files
            if (
                file.lower().startswith("readme")
                or file.endswith((".md", ".txt"))
                or file.endswith((".py", ".js", ".ts"))
            ):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()

                    file_data.append({
                        "path": path,
                        "content": content[:2000]  # prevent huge tokens
                    })

                except Exception:
                    continue

    return file_data[:20]  # keep it controlled