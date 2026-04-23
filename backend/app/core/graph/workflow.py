from app.core.agents.test_writer import test_writer
from app.core.agents.code_writer import code_writer_agent
from app.core.agents.planner import planner_agent
from app.core.agents.code_reader import code_reader_agent
from app.core.agents.pr_agent import pr_agent

from app.core.state.agent_state import AgentState
from langgraph.graph import StateGraph, END


def build_graph():
    workflow = StateGraph(AgentState)

    # Nodes
    workflow.add_node("code_reader", code_reader_agent)
    workflow.add_node("planner", planner_agent)
    workflow.add_node("code_writer", code_writer_agent)
    workflow.add_node("test_writer", test_writer)
    workflow.add_node("pr_agent", pr_agent)

    # Flow
    workflow.set_entry_point("code_reader")
    workflow.add_edge("code_reader", "planner")
    workflow.add_edge("planner", "code_writer")
    workflow.add_edge("code_writer", "test_writer")
    workflow.add_edge("test_writer", "pr_agent")
    workflow.add_edge("pr_agent", END)

    return workflow.compile()