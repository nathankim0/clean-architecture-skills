# CLAUDE.md

Guidance for coding agents working in this repository. `AGENTS.md` is a symlink to this file, so edit only `CLAUDE.md`.

## Overview

A plugin marketplace that ships two agent skills:

- `clean-architecture`: Clean Architecture review and design guidance
- `kent-beck-style`: Kent Beck simple design and refactoring guidance

The same skills are distributed to Claude Code, OpenAI Codex, pi, OpenClaw, GitHub Copilot, and Amp. This is a public repository: never add company names, private code, internal URLs, or examples taken from private projects. Rewrite lessons from real work as generic examples.

## Layout

| Path | Role |
| --- | --- |
| `plugins/<plugin>/skills/<plugin>/SKILL.md` | Skill body. Frontmatter `name` must equal the plugin name |
| `plugins/<plugin>/.codex-plugin/plugin.json` | Canonical plugin manifest |
| `plugins/<plugin>/.claude-plugin/plugin.json` | Relative symlink to `../.codex-plugin/plugin.json`. Never replace it with a copy |
| `.claude-plugin/marketplace.json` | Claude Code marketplace catalog with per-plugin versions |
| `.agents/plugins/marketplace.json` | Codex marketplace catalog |
| `package.json` | pi package; `version` must equal the marketplace `metadata.version` |
| `README.md`, `README.ko.md` | English and Korean READMEs. Keep them in sync |
| `tests/validation.test.mjs` | Validates catalogs, manifests, symlinks, and executes TypeScript examples from the skills |

## Rules

- The tests run some fenced `typescript` examples from `SKILL.md` files (located by signature, such as `async execute(`). Keep those examples valid and behaviorally correct when editing them.
- Keep skill descriptions under 1024 characters and plugin names in kebab-case.
- When a skill changes behavior or guidance, update both READMEs if they describe that behavior.
- Run the validation before every commit:

  ```bash
  node --test
  ```

## Versioning

- Plugin versions (`plugins/<plugin>/.codex-plugin/plugin.json` and the matching entry in `.claude-plugin/marketplace.json`) follow semver per plugin:
  - patch: wording fixes, corrected examples
  - minor: new guidance, checklist items, or sections
  - major: removed or renamed skills, incompatible structure
- The repository version (`package.json` `version` and `.claude-plugin/marketplace.json` `metadata.version`) increases with every release: minor when any plugin gains features, patch otherwise.
- Documentation-only or tooling-only changes (README, this file, CI) may ship without a plugin bump but still bump the repository patch version when released on their own.

## Always Commit, Push, Tag, and Release

Every change in this repository ends with a published release. Do not stop at a local edit.

1. Bump the versions above and run `node --test`.
2. Commit to `main` with a Conventional Commit message (`feat(<plugin>): ...`, `fix: ...`, `docs: ...`, `chore: ...`).
3. Push: `git push origin main`.
4. Tag the repository version and push the tag:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

5. Create the GitHub release for that tag:

   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z - <Short Title>" --notes-file <notes.md>
   ```

   Release notes use this structure:

   ```markdown
   ## <Short Title>

   - What changed, one bullet per user-visible change

   ## Validation

   - How it was verified (tests run, installs checked)

   ## Versions

   - Repository and marketplace: **X.Y.Z**.
   - Clean Architecture plugin: **A.B.C**.
   - Kent Beck Style plugin: **D.E.F**.

   ## Full Changelog

   https://github.com/nathankim0/clean-architecture-skills/compare/vPREV...vX.Y.Z
   ```

6. Refresh the README badges. GitHub serves README images through its camo cache, and shields.io's CDN caches the badge for about 5 minutes (measured: the badge flipped 286 seconds after a release). A purge right after the release just re-caches the old badge, so wait about 5 minutes after `gh release create`, then purge every camo image on the repository page and confirm the release badge shows the new tag:

   ```bash
   for u in $(curl -s https://github.com/nathankim0/clean-architecture-skills \
       | grep -o 'https://camo.githubusercontent.com/[^"\\]*' | sort -u); do
     curl -s -o /dev/null -w "%{http_code} $u\n" -X PURGE "$u"
   done
   curl -s "https://img.shields.io/github/v/release/nathankim0/clean-architecture-skills" | grep -o "vX\.Y\.Z"
   ```

7. Report the commit hash, tag, release URL, and the badge check result.

If a step fails (tests, push, or release), fix the cause and retry; do not skip the tag or release.
