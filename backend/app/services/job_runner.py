import os
import subprocess
import shutil
import uuid
from app.core.graph.workflow import build_graph


def run_job(data):
    repo_url = data["repo_url"]
    issue = data["issue"]

    job_id = str(uuid.uuid4())
    job_dir = f"/tmp/job_{job_id}"

    print(f"\n🚀 Starting job: {job_id}")

    try:
        # clean folder
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir)

        # clone repo
        print("📥 Cloning repo...")
        subprocess.run(["git", "clone", repo_url, job_dir], check=True)

        os.chdir(job_dir)

        print("🧠 Running AI agents...")

        graph = build_graph()

        result = graph.invoke({
            "issue": issue,
            "repo_url": repo_url,
            "code_context": None,
            "plan": None,
            "patch": None,
            "tests": None,
            "pr_url": None,
        })

        print("\n📦 RESULT:\n", result)

        # ✅ Save outputs (VERY IMPORTANT)
        if result.get("patch"):
            with open("output_patch.txt", "w") as f:
                f.write(result["patch"])

        if result.get("tests"):
            with open("output_tests.txt", "w") as f:
                f.write(result["tests"])

        print("✅ Job completed")

        return result

    except Exception as e:
        print("\n❌ JOB FAILED:", str(e))

        return {
            "error": str(e),
            "pr_url": None
        }