from typing import Optional
from typing import TypedDict

class AgentState(TypedDict):
    issue: str
    code_context: Optional[str]
    plan: Optional[str]
    patch: Optional[str]
    tests: Optional[str]
    pr_url: Optional[str]