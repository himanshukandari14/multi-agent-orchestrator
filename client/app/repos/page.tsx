"use client"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [repos, setRepos] = useState([])

  useEffect(() => {
    const token = localStorage.getItem("token")

    fetch("http://localhost:8000/repos", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setRepos(data))
  }, [])

  return (
    <div>
      <h1>Your Repos</h1>
      {repos.map((repo) => (
        <div key={repo.id}>
          {repo.name}
        </div>
      ))}
    </div>
  )
}