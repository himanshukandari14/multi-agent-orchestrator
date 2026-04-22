import subprocess
import tempfile

def apply_patch(patch: str):
    try:
        with open("temp.patch", "w") as f:
            f.write(patch)

        result = subprocess.run(
            ["git", "apply", "--whitespace=fix", "temp.patch"],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print("PATCH ERROR:", result.stderr)
            return False

        return True

    except Exception as e:
        print("EXCEPTION:", str(e))
        return False