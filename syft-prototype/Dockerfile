# syntax=docker/dockerfile:1
#
# Production image for Syft. Single always-on Node server — the right shape for
# this app because embeddings run in-process via @huggingface/transformers
# (onnxruntime-node, a native module) and the model is best kept warm.
#
# Debian "slim" (glibc), NOT alpine (musl) — onnxruntime-node ships glibc
# prebuilt binaries.
#
# Most secrets are RUNTIME-only (LLM key, Supabase service-role key). The ONE
# exception is the public Supabase auth keys: Next.js inlines NEXT_PUBLIC_* into
# the client bundle at BUILD time, so they must be passed as build args (below).
# data/embeddings.json is baked in and the embedding model is warmed at build.

FROM node:22-bookworm-slim AS base
# HOME under /app so any ~/.cache (e.g. the warmed model) lands inside the tree
# we copy into the runner stage.
ENV HOME=/app
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate

# ---- build stage: install deps, warm the model, compile ----
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Native modules (onnxruntime-node, sharp) fetch their linux prebuilt binaries here.
RUN pnpm install --frozen-lockfile
COPY . .
# Bake the local embedding model into the image cache (no API key required).
RUN pnpm warm:model
# Public Supabase auth keys — inlined into the client bundle at build time.
# Pass with --build-arg locally, or set them as build variables on Railway/Render.
# If omitted, the app builds fine and runs in demo mode (no auth) until provided.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
# Compile the Next.js app.
RUN pnpm build

# ---- runner stage: the built app + native deps + warmed model cache ----
FROM base AS runner
ENV NODE_ENV=production
# Copy the whole built tree so node_modules' native binaries, .next, public,
# data/embeddings.json, and the warmed model cache all come along.
COPY --from=build /app /app
EXPOSE 3000
# Railway/Render/Fly inject PORT; default to 3000 locally.
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000} -H 0.0.0.0"]
