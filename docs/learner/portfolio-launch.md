# Portfolio launch checklist

Follow with the agent. Do **not** commit `.env`, `.env.local`, or any real API keys.

## Suggested public repo name

`iqra-quran-learning`

## Before first push (security)

1. Open [Anthropic Console](https://console.anthropic.com/) → API keys.
2. **Revoke/rotate** any key that lived in local `.env.local` (treat it as exposed once the project goes public).
3. Confirm `git status` never lists `.env` / `.env.local`.

## After GitHub + Vercel are live

Reply with:
- GitHub repo URL
- Vercel live URL

Then the agent will finish `README.md` + `CASE_STUDY.md` with those links and offline test steps.
