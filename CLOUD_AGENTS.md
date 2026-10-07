# Cloud / Background Agents

Cloud agents only see what is **committed and pushed** on the branch they clone. Skills installed with `npx skills add … -g` live in your user home folder and are **not** available in the cloud.

## Skills in this repo

Project skills live under:

- `.agents/skills/` (primary for Cursor)
- `.claude/skills/` (mirror for Claude-compatible discovery)

Lockfile: `skills-lock.json`

Included for design work: `impeccable`, `design-taste-frontend`, `emil-design-eng`, `animate`, `animation-vocabulary`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `redesign-existing-projects`, `high-end-visual-design`, `frontend-design`, `threejs-animation`, `ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`, `vercel-react-view-transitions`, plus the rest of the taste-skill pack.

## Before launching a cloud agent

1. Commit skill folders + `skills-lock.json` on the branch you will run.
2. Push that branch: `git push -u origin <branch>`.
3. Point the cloud agent at that branch (not an outdated `main` unless skills are on `main`).
4. In the prompt, tell it to read skills from `.agents/skills/<name>/SKILL.md` (they are already in-repo; no global install required).

## Agent prompts

- `AGENT_PROMPT_TYPOGRAPHIC_PORTFOLIO.md`
- `AGENT_PROMPT_HIGH_END_PORTFOLIO.md`
- `prompts/COPY_PASTE_START.md`
