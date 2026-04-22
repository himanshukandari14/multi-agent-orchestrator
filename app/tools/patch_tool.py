import subprocess
import tempfile

def apply_patch(patch_text):
    with tempfile.NamedTemporaryFile(delete=False, mode="w") as f:
        f.write(patch_text)
        patch_file = f.name

    try:
        subprocess.run(["git", "apply", patch_file], check=True)
        return True
    except subprocess.CalledProcessError:
        return False