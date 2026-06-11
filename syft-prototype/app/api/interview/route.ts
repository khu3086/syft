// POST /api/interview  { turns: {role,text}[] }  ->  { question, done, closing }
// Drives Syft's voice interview: given the conversation so far, returns the next
// question Syft should ask (steered by the last answer), or a closing when done.

import { NextResponse } from "next/server";
import { nextInterviewTurn, type InterviewTurn } from "@/lib/matching/providers/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let turns: unknown;
  try {
    ({ turns } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const safe: InterviewTurn[] = Array.isArray(turns)
    ? turns
        .filter(
          (t): t is InterviewTurn =>
            !!t &&
            (t.role === "assistant" || t.role === "user") &&
            typeof t.text === "string",
        )
        .slice(-20)
    : [];

  try {
    const out = await nextInterviewTurn(safe);
    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Interview step failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
