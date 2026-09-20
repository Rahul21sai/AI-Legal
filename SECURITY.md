# Security Policy

## Supported version

The latest commit on `main` is the supported hackathon release. Earlier commits are development checkpoints and do not receive separate security fixes.

## Reporting a vulnerability

Do not open a public issue containing an exploit, secret, or personal legal information. Use the repository's **Security** tab to submit a private vulnerability report or draft private security advisory. Include the affected module, synthetic reproduction steps, expected and observed behavior, impact, and any known workaround.

Critical and high-severity reports should be assessed within 48 hours. Credentials or personal case material must never be attached.

## Dependency controls

- Direct dependencies are pinned exactly in `package.json`.
- `pnpm-lock.yaml` is committed and CI installs it with `--frozen-lockfile --ignore-scripts`.
- Only the reviewed `sharp` native dependency is rebuilt in CI.
- CI enforces the frozen pnpm integrity lockfile, rejects high-severity advisories, and runs lint, type-checking, 110 unit/component tests, the production build, and 14 browser runs.
- Enable Dependabot alerts and security updates under GitHub **Settings → Code security**. Critical and high security updates are P1 and should be reviewed within 48 hours. Automated version updates are intentionally not configured because GitHub's hosted updater failed against this pnpm 11 repository even with its documented minimal configuration.

## Compromised-dependency response

1. Identify the affected version with `pnpm why <package>` and search `pnpm-lock.yaml`.
2. Stop deployments and invalidate dependency caches.
3. Pin or override the last verified safe version in `pnpm-workspace.yaml`.
4. Reinstall from the known-good lockfile without lifecycle scripts; rebuild only allowlisted packages.
5. Rotate every credential exposed to an affected developer machine or CI runner, including Gemini, Vercel, GitHub, npm, cloud, database, signing, and SSH credentials.
6. Re-run the complete verification suite and document the exposure window and remediation in a private advisory before redeploying.

## Application security boundary

ProofClock stores no case data. Manual dates remain in current-tab state. Optional evidence is sent to Google Gemini only after explicit per-request acknowledgement. Application logs exclude request bodies, dates, source quotes, model responses, forwarding addresses, and secrets.
