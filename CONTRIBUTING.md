# Contributing to Redmine MCP Server

Thanks for your interest in contributing.

## Getting Started

1. Fork the repository and create a feature branch.
2. Install dependencies.
3. Run checks before opening a pull request.

```bash
npm install
npm run lint
npm test
```

## Development Workflow

- Keep changes focused and small.
- Add or update tests for behavior changes.
- Update documentation for user-facing changes (for example, tool schemas or environment variables).
- Prefer clear, descriptive commit messages.

## Pull Request Guidelines

- Explain the problem and why your change is needed.
- Summarize what changed and any trade-offs.
- Include validation steps (commands run, sample output, or screenshots when relevant).
- Link related issues when available.

## Coding Standards

- Use TypeScript and existing project conventions.
- Keep APIs backward compatible when possible.
- Never commit secrets (API keys, tokens, or credentials).

## Reporting Issues

When filing a bug report, include:

- Environment details (Node.js version, OS, Redmine version if known).
- Reproduction steps.
- Expected vs actual behavior.
- Relevant logs or error messages (redacted if sensitive).

## Public Distribution (Docker + MCP Registry)

Use this checklist when preparing a public release so users can pull and run the
server directly.

1. Bump version in `package.json`.
2. Build and test locally:

```bash
npm run lint
npm test
```

3. Build and push Docker image tags:

```bash
export IMAGE=docker.io/<docker-user>/redmine-mcp-server
export TAG=<version>

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t $IMAGE:$TAG \
  -t $IMAGE:latest \
  --push .
```

4. Verify pull and startup from a clean environment:

```bash
docker run --rm -i \
  -e REDMINE_BASE_URL="https://redmine.example.com" \
  -e REDMINE_API_KEY="your_api_key_here" \
  docker.io/<docker-user>/redmine-mcp-server:$TAG
```

5. Create a GitHub release and include:
   - Version notes and migration notes (if any).
   - Docker image references (`$IMAGE:$TAG` and `latest`).
   - Minimum supported Node.js version.

6. Add or update MCP registry entry metadata (where applicable):
   - Server name: `redmine-mcp-server`
   - Source repository URL
   - Docker image reference
   - Required environment variables (`REDMINE_BASE_URL`, `REDMINE_API_KEY`)
   - Safety notes (`REDMINE_READONLY`, destructive operations requiring `confirm`)
   - Use `REGISTRY_PUBLISHING.md` for copy-ready templates across registries.

7. Re-check documentation links in `README.md` after release.
