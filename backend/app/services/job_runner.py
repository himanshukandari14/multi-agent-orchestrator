import os
import subprocess
import shutil
import logging
from app.core.graph.workflow import build_graph
from app.utils.job_tracker import update_job


def run_job(data):
    repo_url = data["repo_url"]
    issue = data["issue"]

    from rq import get_current_job
    rq = get_current_job()
    # Prefer the client-facing id (from /fix) so status polling uses the same key as Redis
    job_id = data.get("job_id")
    if not job_id and rq is not None:
        job_id = str(rq.id)
    if not job_id:
        raise ValueError("run_job: missing job_id")

    job_dir = f"/tmp/job_{job_id}"

    print(f"\n🚀 Starting job: {job_id}")

    try:
        update_job(job_id, status="processing", progress=10)

        if os.path.exists(job_dir):
            shutil.rmtree(job_dir)

        logger = logging.getLogger(__name__)
        logger.info("Cloning repo...")

        update_job(job_id, progress=30, message="Cloning repo...")

        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, job_dir],
            check=True
        )

        os.chdir(job_dir)

        print("🧠 Running AI agents...")
        update_job(job_id, progress=60, message="Running AI agents...")

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

        update_job(job_id, progress=80, message="Finalizing PR...")

        # save outputs (optional debug)
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
            result={
                "pr_url": result.get("pr_url"),
                "message": "PR created successfully"
            }
        )

        print("✅ Job completed")
        return result

    except Exception as e:
        update_job(
            job_id,
            status="failed",
            progress=100,
            result={"error": str(e)}
        )
        print("\n❌ JOB FAILED:", str(e))
        return {"error": str(e)}