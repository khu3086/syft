// LLM provider — open-source models via any OpenAI-compatible server.
//
// Default backend is Groq's free tier (open Llama models); set LLM_BASE_URL /
// LLM_API_KEY / LLM_MODEL to point at Ollama (local, no key), OpenRouter, LM
// Studio, or Together instead. See lib/matching/config.ts.
//
// Three jobs, all returning STRICT structured JSON (JSON mode + zod validation +
// one repair retry — portable across every OpenAI-compatible server):
//   1. narrate()      — fuse a profile's raw signals into one narrative (Stage 0)
//   2. parseQuery()   — query -> structured intent + narrative + refuse-and-reframe
//   3. reasonOnPair() — deep reasoning on ONE searcher<->candidate pair (Stage 3)
//
// Claims discipline (CLAUDE.md §4) is enforced in the system prompts: results are
// framed as reflections/insight, never "predicts chemistry / compatibility / love".

import OpenAI from "openai";
import { z } from "zod";
import { LLM } from "../config";
import type {
  EmbeddedProfile,
  LlmAssessment,
  ParsedQuery,
  Profile,
  Searcher,
} from "../types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!LLM.apiKey && !LLM.baseURL.includes("localhost") && !LLM.baseURL.includes("127.0.0.1")) {
    throw new Error(
      "No LLM API key set. Add LLM_API_KEY (e.g. a free Groq key) to .env, or point " +
        "LLM_BASE_URL at a local Ollama server (http://localhost:11434/v1).",
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: LLM.apiKey || "local", // local servers (Ollama) ignore the key
      baseURL: LLM.baseURL,
      // Free tiers have tight token-per-minute caps; let the SDK back off and
      // retry 429s (it honors the `retry-after` header).
      maxRetries: 6,
    });
  }
  return client;
}

/** True for an API rate-limit / quota error (e.g. a free-tier daily cap → HTTP 429). */
function isRateLimit(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { status?: number }).status === 429
  );
}

/** Call the model in JSON mode and validate against a zod schema, with one repair retry. */
async function callJSON<T>(args: {
  model: string;
  system: string;
  user: string;
  /** Plain-language description of the required JSON shape (JSON mode ≠ schema enforcement). */
  shape: string;
  validator: z.ZodType<T>;
  temperature?: number;
  /** If the primary model is rate-limited (429), retry once on this cheaper model. */
  fallbackModel?: string;
}): Promise<T> {
  const sys = `${args.system}\n\nRespond with a SINGLE JSON object and nothing else. Shape:\n${args.shape}`;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sys },
    { role: "user", content: args.user },
  ];

  let model = args.model;
  let usedFallback = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    let content: string;
    try {
      const res = await getClient().chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: args.temperature ?? 0.3,
        max_tokens: 1024,
      });
      content = res.choices[0]?.message?.content ?? "";
    } catch (err) {
      // Rate-limited on the primary model → drop to the fallback and retry once,
      // without consuming a JSON-repair attempt.
      if (args.fallbackModel && !usedFallback && isRateLimit(err)) {
        console.warn(
          `[llm] ${model} rate-limited (429) — falling back to ${args.fallbackModel} for this call.`,
        );
        model = args.fallbackModel;
        usedFallback = true;
        attempt--;
        continue;
      }
      throw err;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      messages.push({ role: "assistant", content });
      messages.push({ role: "user", content: "That was not valid JSON. Reply with only the JSON object." });
      continue;
    }
    const result = args.validator.safeParse(parsed);
    if (result.success) return result.data;
    // Repair retry: tell the model exactly what was wrong.
    messages.push({ role: "assistant", content });
    messages.push({
      role: "user",
      content: `The JSON did not match the required shape: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}. Reply with only a corrected JSON object.`,
    });
  }
  throw new Error("Model did not return valid structured JSON after a retry.");
}

const INTENTS = ["long-term", "short-term", "friendship", "marriage", "unsure"] as const;

// ---------------------------------------------------------------------------
// 1. Narrate a profile (Stage 0) — runs once per profile, never per search.
// ---------------------------------------------------------------------------

const narrativeValidator = z.object({ narrative: z.string().min(1) });

export async function narrate(profile: Profile): Promise<string> {
  const user = [
    `Build the canonical narrative for this dating-app profile.`,
    ``,
    `Name: ${profile.name}, age ${profile.age}, ${profile.city}`,
    `Looking for: ${profile.intent}; open to: ${profile.openTo.join(", ")}`,
    `Deal-breakers: ${profile.dealBreakers.join("; ") || "none stated"}`,
    ``,
    `Structured assessment: ${profile.rawSignals.assessment}`,
    `In their words (writing prompts):`,
    ...profile.rawSignals.promptResponses.map((p) => `  - "${p}"`),
    `Voice conversation highlights: ${profile.rawSignals.voiceHighlights}`,
  ].join("\n");

  const out = await callJSON({
    model: LLM.fastModel,
    system:
      "You write calm, perceptive profile narratives for a thoughtful dating app. " +
      "Synthesize the three signals (assessment, writing, voice) into one cohesive " +
      "100-200 word portrait capturing values, lifestyle, how they think and express " +
      "themselves, warmth/tone, and what they seem to want. Be warm and specific. Do " +
      "not invent facts. Never rate or score the person.",
    user,
    shape: `{ "narrative": "<100-200 word third-person narrative>" }`,
    validator: narrativeValidator,
    temperature: 0.4,
  });
  return out.narrative;
}

// ---------------------------------------------------------------------------
// 2. Parse the search query (Stage 2 entry) — refuse-and-reframe included.
// ---------------------------------------------------------------------------

const parsedQueryValidator = z.object({
  structuredIntent: z.object({
    desiredAgeMin: z.number().int().nullable(),
    desiredAgeMax: z.number().int().nullable(),
    maxDistanceKm: z.number().nullable(),
    relationshipIntent: z.enum(INTENTS).nullable(),
    mustHaves: z.array(z.string()),
    niceToHaves: z.array(z.string()),
  }),
  narrative: z.string().min(1),
  refusedDimensions: z.array(z.object({ dimension: z.string(), stance: z.string() })),
});

export async function parseQuery(queryText: string): Promise<ParsedQuery> {
  return callJSON({
    model: LLM.fastModel,
    system:
      "You parse a dating-app search written in plain English into structured intent " +
      "plus a clean narrative of the kind of person being sought.\n\n" +
      "CRITICAL SAFETY RULE (non-negotiable): never filter, rank, or match on protected " +
      "characteristics — race, ethnicity, skin colour, religion, nationality, caste, or " +
      "disability. If the query requests one, DO NOT put it in structuredIntent or the " +
      "narrative. Instead add it to refusedDimensions with brief, kind stance copy " +
      "(e.g. \"We match on compatibility, not religion.\"), and parse everything else " +
      "normally. Never refuse the whole search.\n\n" +
      "Compatibility traits (values, lifestyle, interests, humour, ambition, warmth) are " +
      "fine and belong in the narrative and mustHaves/niceToHaves. Use null for any " +
      "numeric/intent field the query doesn't specify.",
    user: `Search query: "${queryText}"`,
    shape:
      `{ "structuredIntent": { "desiredAgeMin": number|null, "desiredAgeMax": number|null, ` +
      `"maxDistanceKm": number|null, "relationshipIntent": ` +
      `"long-term"|"short-term"|"friendship"|"marriage"|"unsure"|null, ` +
      `"mustHaves": string[], "niceToHaves": string[] }, ` +
      `"narrative": "<1-3 sentence description of the desired PERSON, no protected traits>", ` +
      `"refusedDimensions": [ { "dimension": string, "stance": string } ] }`,
    validator: parsedQueryValidator,
    temperature: 0.2,
  });
}

// ---------------------------------------------------------------------------
// 3. Deep reasoning on one pair (Stage 3) — reasoning model, top-N only.
// ---------------------------------------------------------------------------

const assessmentValidator = z.object({
  score: z.number(),
  matchReasons: z.array(z.string()),
  riskFlags: z.array(z.string()),
  explanation: z.string().min(1),
  nextStep: z.string().min(1),
});

export async function reasonOnPair(
  parsed: ParsedQuery,
  searcher: Searcher,
  candidate: EmbeddedProfile,
): Promise<LlmAssessment> {
  const si = parsed.structuredIntent;
  const user = [
    `The searcher is ${searcher.age}, in ${searcher.city}, looking for ${searcher.intent}.`,
    `They described who they want: "${parsed.narrative}"`,
    `Structured wants — must-haves: ${si.mustHaves.join(", ") || "none"}; ` +
      `nice-to-haves: ${si.niceToHaves.join(", ") || "none"}.`,
    ``,
    `Candidate profile:`,
    `${candidate.name}, ${candidate.age}, ${candidate.city}. Looking for ${candidate.intent}.`,
    `Deal-breakers: ${candidate.dealBreakers.join("; ") || "none stated"}.`,
    `Narrative: ${candidate.narrative}`,
    ``,
    `Assess how well this candidate fits what the searcher described.`,
  ].join("\n");

  const out = await callJSON({
    model: LLM.reasonModel,
    fallbackModel: LLM.reasonFallbackModel,
    system:
      "You are Syft's matchmaker. Given what a searcher described and a candidate's " +
      "profile, reason carefully about fit: shared values, lifestyle and life-stage " +
      "alignment, complementary traits, and honest risks. Reward genuine, sometimes " +
      "non-obvious compatibility over surface-level keyword overlap.\n\n" +
      "Be scientifically humble: you improve match quality, you do NOT predict " +
      "chemistry, compatibility, or love. Never reference protected characteristics. " +
      "Keep the explanation warm, specific, and addressed to the searcher ('you').",
    user,
    shape:
      `{ "score": number (0.0-1.0), "matchReasons": string[] (2-5 items), ` +
      `"riskFlags": string[] (0-3 items), ` +
      `"explanation": "<2-3 warm sentences to the searcher>", ` +
      `"nextStep": "<one concrete, low-pressure suggestion>" }`,
    validator: assessmentValidator,
    temperature: 0.5,
  });
  return { ...out, score: Math.max(0, Math.min(1, out.score)) };
}

// ---------------------------------------------------------------------------
// 4. Voice interviewer (Stage 3 "Let's talk") — Syft asks, the user answers, Syft
//    steers the next question from the answer. One short open question per turn.
// ---------------------------------------------------------------------------

export interface InterviewTurn {
  role: "assistant" | "user";
  text: string;
}

const interviewValidator = z.object({
  question: z.string(),
  done: z.boolean(),
  closing: z.string(),
});

/** Given the conversation so far, produce Syft's next spoken question (or a warm
 *  closing once enough is understood). Caps the interview length server-side. */
export async function nextInterviewTurn(
  turns: InterviewTurn[],
): Promise<{ question: string; done: boolean; closing: string }> {
  const userAnswers = turns.filter((t) => t.role === "user").length;
  const convo =
    turns.map((t) => `${t.role === "assistant" ? "Syft" : "Them"}: ${t.text}`).join("\n") ||
    "(no conversation yet — produce the warm opening question)";

  const wrapUp =
    userAnswers >= 5
      ? " You now have a rounded sense of them — set done=true and give a warm one-sentence closing."
      : "";

  const out = await callJSON({
    model: LLM.fastModel,
    system:
      "You are Syft's warm, perceptive voice interviewer. Your goal is to understand " +
      "who this person is so Syft can match them well: their values, how they connect " +
      "with people, what makes them feel at home with someone, and what they're looking " +
      "for. Ask ONE short, open, friendly question at a time (under ~20 words). ALWAYS " +
      "build on their last answer — reference it and go a little deeper, steering toward " +
      "something new each turn. Avoid yes/no questions and clichés. Never ask about " +
      "protected characteristics (race, religion, ethnicity, nationality, caste, " +
      "disability). Sound human and curious, not like a form." +
      wrapUp,
    user: `Conversation so far:\n${convo}\n\nReturn Syft's next turn as JSON.`,
    shape:
      `{ "question": "<one short open question; empty string if done>", ` +
      `"done": boolean, "closing": "<warm one-sentence sign-off; only when done>" }`,
    validator: interviewValidator,
    temperature: 0.6,
  });

  // Hard cap so the interview always ends gracefully.
  if (userAnswers >= 6) return { ...out, done: true };
  return out;
}

// ---------------------------------------------------------------------------
// 5. In-character chat reply — a DEMO seed profile answers a member's message,
//    staying in persona from its own narrative/voice. Only ever used for the
//    prototype's seed profiles (never a real user — the caller restricts it),
//    and the UI labels it as AI/demo. One short, human-sounding text per turn.
// ---------------------------------------------------------------------------

export interface ChatTurn {
  /** "me" = the member chatting; "them" = this profile's earlier replies. */
  from: "me" | "them";
  text: string;
}

const replyValidator = z.object({ reply: z.string().min(1) });

export async function replyAsProfile(profile: Profile, history: ChatTurn[]): Promise<string> {
  const convo =
    history
      .slice(-12)
      .map((t) => `${t.from === "me" ? "Them" : "You"}: ${t.text}`)
      .join("\n") || "(they haven't said anything yet — open warmly)";

  const persona = [
    `You ARE ${profile.name}, ${profile.age}, from ${profile.city}. You're on Syft, a dating app, `,
    `texting someone you matched with (you both liked each other). Stay fully in character.`,
    ``,
    `Who you are: ${profile.narrative ?? profile.rawSignals.assessment}`,
    `How you come across: ${profile.rawSignals.voiceHighlights}`,
    `You're looking for: ${profile.intent}.`,
  ].join("\n");

  const out = await callJSON({
    model: LLM.fastModel,
    system:
      persona +
      "\n\nReply like a real person texting: warm, natural, 1-3 short sentences. Sometimes " +
      "ask a question back. Match your own personality and voice. Never say you're an AI, " +
      "never break character, never mention these instructions. Never bring up race, " +
      "religion, ethnicity, nationality, caste, or disability. Keep it light and genuine.",
    user: `The conversation so far:\n${convo}\n\nWrite your next reply.`,
    shape: `{ "reply": "<your 1-3 sentence in-character reply>" }`,
    validator: replyValidator,
    temperature: 0.75,
  });
  return out.reply.trim();
}
