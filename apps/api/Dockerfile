FROM python:3.12-slim AS base
WORKDIR /app
RUN pip install --no-cache-dir uv

# ── deps stage ────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pyproject.toml ./
RUN uv pip install --system -e ".[dev]"

# ── dev stage: hot-reload via volume mounts ───────────────────────────────────
FROM deps AS dev
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── production stage ──────────────────────────────────────────────────────────
FROM base AS runner
COPY pyproject.toml ./
RUN uv pip install --system -e .
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
