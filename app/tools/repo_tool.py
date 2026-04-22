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

def should_ignore(path):
    return any(ignore in path for ignore in IGNORE_KEYWORDS)


def get_repo_files_content():
    file_data = []

    for root, dirs, files in os.walk("."):

        # 🚫 skip entire unwanted paths
        if should_ignore(root):
            continue

        for file in files:
            path = os.path.join(root, file)

            # 🚫 skip unwanted files
            if should_ignore(path):
                continue

            if file.endswith((".js", ".ts", ".jsx", ".tsx", ".py")):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()

                    file_data.append({
                        "path": path,
                        "content": content[:1500]
                    })
                except:
                    continue

    return file_data[:15]