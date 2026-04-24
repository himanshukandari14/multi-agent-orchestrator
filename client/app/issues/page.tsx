"use client"
import { useState } from "react"


const loadIssues = (owner, repo) => {
    const [issues, setIssues] = useState([])
  const token = localStorage.getItem("token")

  fetch(`http://localhost:8000/repos/${owner}/${repo}/issues`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => setIssues(data))
}

export default loadIssues