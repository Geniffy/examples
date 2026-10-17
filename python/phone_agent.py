"""A phone assistant on Vapi that remembers each caller. Vapi calls this server when a call starts (answer with the
caller's briefing), when the assistant looks something up mid-call, and when the call ends (save it). The next
call starts knowing this one, and a promise moved between calls is the new date.

    pip install fastapi uvicorn geniffy
    VAPI_SECRET=... uvicorn phone_agent:app

Set up the assistant in Vapi as https://docs.geniffy.com/integrations/vapi says: {{memory}} in its prompt, a
`recall` tool, the server URL and the end-of-call report on its number, and the X-Vapi-Secret credential.

A number says which customer is probably calling, not who is: caller ID can be faked, and a withheld number is no
number at all, so it gets no memory and its call is not saved. Before the assistant shares anything private from
what it remembers, have it confirm who it is speaking with (a PIN, a one-time code sent to the number you hold for
them, or your own sign-in): https://docs.geniffy.com/production-checklist#spaces
"""
import asyncio
import hmac
import json
import logging
import os

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from geniffy import AsyncGeniffy

geniffy = AsyncGeniffy()                          # reads GENIFFY_API_KEY
app = FastAPI()
log = logging.getLogger("phone_agent")
ASSISTANT_ID = os.environ.get("VAPI_ASSISTANT_ID", "your-assistant-id")
OPENING = "A call is starting. What matters about this caller?"
NOTHING = "Nothing is known about this caller yet. If they mention an earlier call, say so rather than guessing."
UNREAD = "This caller's history could not be read just now. If they mention an earlier call, ask rather than guess."
# what Twilio sends in place of a withheld number: ANONYMOUS, RESTRICTED, BLOCKED, UNKNOWN, UNAVAILABLE
WITHHELD = {"266696687", "7378742833", "2562533", "8656696", "86282452253"}


def space_for(number: str | None) -> str | None:
    """The caller, by the digits of their number. None when it is withheld or missing: then nothing is read or
    saved, rather than one memory shared by every unknown caller. If you know callers as customers, use your
    customer id, and the same memory serves their calls, chats and emails."""
    digits = "".join(ch for ch in number or "" if ch.isdigit())
    if not 7 <= len(digits) <= 15 or digits in WITHHELD:
        return None
    return f"user_{digits}"


async def known_about(space: str | None, cue: str, budget: int) -> str:
    """The caller's briefing, for the prompt, read in a fraction of a second. A call never waits on it for more than
    two seconds."""
    if space is None:
        return NOTHING
    try:
        return await asyncio.wait_for(geniffy.space(space).briefing(cue=cue, budget_chars=budget), 2) or NOTHING
    except Exception as e:                        # slow or failing: the call goes on without it
        log.warning("no briefing for this call: %r", e)
        return UNREAD


async def save_call(space: str, call_id: str, turns: list[dict]) -> None:
    """The call as one conversation under its own id, so a call sent again is the same source. A call of more
    than 500 turns, the most one add takes, goes in parts."""
    for at in range(0, len(turns), 500):
        await geniffy.space(space).memories.add(messages=turns[at:at + 500], title="Call",
                                                external_id=call_id if at == 0 else f"{call_id}-{at // 500}")


@app.post("/vapi")
async def vapi(request: Request, background: BackgroundTasks, x_vapi_secret: str = Header("")):
    if not hmac.compare_digest(x_vapi_secret, os.environ["VAPI_SECRET"]):
        raise HTTPException(401)
    message = (await request.json())["message"]
    call = message.get("call") or {}
    space = space_for((call.get("customer") or {}).get("number"))

    if message["type"] == "assistant-request":    # a call is starting: what to know before talking to them
        memory = await known_about(space, OPENING, 2500)
        return {"assistantId": ASSISTANT_ID, "assistantOverrides": {"variableValues": {"memory": memory}}}

    if message["type"] == "tool-calls":           # the assistant looks something up mid-call
        results = []
        for tool_call in message.get("toolCallList") or []:
            fn = tool_call.get("function") or {}  # Vapi sends {id, type, function: {name, arguments}}
            args = fn.get("arguments") or tool_call.get("arguments") or tool_call.get("parameters") or {}
            args = json.loads(args) if isinstance(args, str) else args
            found = await known_about(space, args.get("query") or OPENING, 1500)
            results.append({"name": fn.get("name") or tool_call.get("name"), "toolCallId": tool_call["id"],
                            "result": " ".join(found.split())})      # Vapi reads a result as one line
        return {"results": results}

    if message["type"] == "end-of-call-report" and space:   # the call is over: save who said what
        turns = [{"role": "assistant" if m["role"] in ("assistant", "bot") else "user", "content": m["message"]}
                 for m in (message.get("artifact") or {}).get("messages") or []
                 if m.get("role") in ("user", "assistant", "bot") and m.get("message")]
        if turns:                                 # saved after Vapi has its answer, so it never waits on the save
            background.add_task(save_call, space, f"vapi-{call['id']}", turns)
    return {}
