from app.agents.code_reader import code_reader_agent
from app.state.agent_state import AgentState
from langgraph.graph import StateGraph, END

def build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("code_reader", code_reader_agent)

    workflow.set_entry_point("code_reader")
    workflow.add_edge("code_reader", END)

    return workflow.compile()