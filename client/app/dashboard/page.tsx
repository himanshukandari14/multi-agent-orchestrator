"use client"

import { useEffect, useState } from "react"

export default function Dashboard() {
  const [repos, setRepos] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [selectedRepo, setSelectedRepo] = useState<any>(null)

  // ✅ useEffect (fetch repos)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (token) {
      localStorage.setItem("token", token)
      window.history.replaceState({}, document.title, "/dashboard")
    }

    const storedToken = localStorage.getItem("token")

    if (!storedToken) return

    fetch("http://localhost:8000/repos", {
      headers: {
        Authorization: `Bearer ${storedToken}`
      }
    })
      .then(res => res.json())
      .then(data => setRepos(data))
  }, [])

  // ✅ load issues
  const loadIssues = (repo: any) => {
    const token = localStorage.getItem("token")

    setSelectedRepo(repo)

    fetch(`http://localhost:8000/repos/${repo.owner.login}/${repo.name}/issues`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setIssues(data))
  }

  // 🔥 ADD THIS HERE (your function)
  const fixIssue = async (issue: any) => {
    const token = localStorage.getItem("token")

    const res = await fetch("http://localhost:8000/fix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        repo_url: selectedRepo.clone_url,
        issue: issue.title
      })
    })

    const data = await res.json()
    const jobId = data.job_id

    alert("🚀 Fix started...")

    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/jobs/${jobId}`)
      const job = await res.json()

      console.log(job)

      if (job.status === "completed") {
        clearInterval(interval)
        alert("✅ PR Created: " + job.result?.pr_url)
      }

      if (job.status === "failed") {
        clearInterval(interval)
        alert("❌ Failed: " + job.result?.error)
      }
    }, 3000)
  }

  // ✅ UI
  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 Your Repos</h1>

      {repos.map(repo => (
        <div key={repo.id}>
          {repo.name}
          <button onClick={() => loadIssues(repo)}>
            View Issues
          </button>
        </div>
      ))}

      <hr />

      <h2>📌 Issues</h2>

      {issues.map(issue => (
        <div key={issue.id}>
          {issue.title}

          {/* 🔥 THIS CALLS YOUR FUNCTION */}
          <button onClick={() => fixIssue(issue)}>
            Fix 🚀
          </button>
        </div>
      ))}
    </div>
  )
}