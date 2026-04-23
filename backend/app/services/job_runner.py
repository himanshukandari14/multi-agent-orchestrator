import os
import subprocess
import shutil
import logging
from app.core.graph.workflow import build_graph
from app.utils.job_tracker import update_job


def run_job(data):
    repo_url = data["repo_url"]
    issue = data["issue"]

    # 🔥 use RQ job id (VERY IMPORTANT)
    from rq import get_current_job
    job = get_current_job()
    job_id = job.id

    job_dir = f"/tmp/job_{job_id}"

    print(f"\n🚀 Starting job: {job_id}")

    try:
        update_job(job_id, status="processing", progress=10)

        if os.path.exists(job_dir):
            shutil.rmtree(job_dir)

        logger = logging.getLogger(__name__)
        logger.info("Cloning repo...")

        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, job_dir],
            check=True
        )

        update_job(job_id, progress=40)

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

        update_job(job_id, progress=80)

        # save outputs
        if result.get("patch"):
            with open("output_patch.txt", "w") as f:
                f.write(result["patch"])

        if result.get("tests"):
            with open("output_tests.txt", "w") as f:
                f.write(result["tests"])

        update_job(
            job_id,
            status="completed",
            progress=100,
            result=result
        )

        print("✅ Job completed")
        return result

    except Exception as e:
        update_job(job_id, status="failed", error=str(e))
        print("\n❌ JOB FAILED:", str(e))
        return {"error": str(e)}