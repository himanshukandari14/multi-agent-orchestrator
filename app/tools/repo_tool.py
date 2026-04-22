import os

def get_repo_files_content():
    file_data = []

    for root, dirs, files in os.walk("."):
        for file in files:
            if file.endswith((".js", ".ts", ".jsx", ".tsx")):
                path = os.path.join(root, file)

                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()

                    file_data.append({
                        "path": path,
                        "content": content[:2000]  # limit to avoid token overflow
                    })
                except:
                    continue

    return file_data[:10]  # limit number of files