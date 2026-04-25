from app.core.tools.llm import get_llm

def generate_pr_review(diff: str, title: str, body: str) -> str:
    llm = get_llm()
    response = llm.invoke(f"""
You are a senior software engineer acting as an automated PR reviewer.
Review the following Pull Request.

Title: {title}
Description: {body}

Diff:
{diff}

Provide a concise, helpful code review. 
Point out any bugs, security issues, or code quality improvements.
If the code looks good, say so!
Format the response nicely in Markdown.
""")
    return response.content.strip()
