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
