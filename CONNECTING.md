# Connecting redmine-mcp-connector to coding agents

This server speaks MCP over **stdio**. Every client below launches it the same way — as a child process — and differs only in *where* you put the JSON config. Pick your tool from the list.

The recommended launch command for all of them is:

```json
{
  "command": "npx",
  "args": ["-y", "redmine-mcp-connector"]
}
```

`npx -y` downloads the [npm package](https://www.npmjs.com/package/redmine-mcp-connector) on first use and caches it — no manual clone or build step needed. If you'd rather run from a local checkout or a Docker image, see [Alternative: local build](#alternative-local-build) and [Alternative: Docker](#alternative-docker) at the bottom.

You will always need:

| Variable | Required | Description |
|----------|----------|-------------|
| `REDMINE_BASE_URL` | yes | Base URL of your Redmine instance, no trailing slash |
| `REDMINE_API_KEY` | yes | From Redmine: **My account → Show API access key** |

See the [full environment variable table](README.md#configuration) in the README for the optional ones (`REDMINE_READONLY`, `REDMINE_ALLOW_RAW_REQUEST`, etc.).

---

## Table of contents

- [Claude Desktop](#claude-desktop)
- [Claude Code (CLI)](#claude-code-cli)
- [Cursor](#cursor)
- [Windsurf](#windsurf)
- [Cline (VS Code extension)](#cline-vs-code-extension)
- [VS Code (native MCP / Copilot agent mode)](#vs-code-native-mcp--copilot-agent-mode)
- [Zed](#zed)
- [Any other MCP client](#any-other-mcp-client)
- [Alternative: local build](#alternative-local-build)
- [Alternative: Docker](#alternative-docker)
- [Troubleshooting](#troubleshooting)

---

## Claude Desktop

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "redmine-mcp-connector"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. The Redmine tools appear under the 🔌 icon in a new chat.

---

## Claude Code (CLI)

One-liner, no manual JSON editing:

```bash
claude mcp add redmine \
  -e REDMINE_BASE_URL=https://redmine.example.com \
  -e REDMINE_API_KEY='your_api_key_here' \
  -- npx -y redmine-mcp-connector
```

All `-e`/`--env` flags must come **before** the server name, and the command to run goes after `--`. Wrap secret values in single quotes so your shell doesn't expand `$`-characters in them.

To scope it to the current project instead of your whole user config, add `--scope project` (writes to `.mcp.json` in the repo, shareable with teammates via git).

Verify with:

```bash
claude mcp list
```

---

## Cursor

Edit (create if missing) either the project-scoped `.cursor/mcp.json` or the global `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "redmine-mcp-connector"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Reload Cursor, then enable the `redmine` server in **Settings → MCP**.

---

## Windsurf

Edit `~/.codeium/windsurf/mcp_config.json` (create it if it doesn't exist — Windsurf doesn't generate it automatically):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "redmine-mcp-connector"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or use Windsurf's MCP Marketplace UI (gear icon → MCP Servers) and paste the same JSON.

---

## Cline (VS Code extension)

Easiest path: open the Cline panel → **MCP Servers** icon → **Configure MCP Servers**, which opens the settings file directly. Add:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "redmine-mcp-connector"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

The file lives at `cline_mcp_settings.json` under VS Code's global storage for the Cline extension (`saoudrizwan.claude-dev`) — the panel is the reliable way to find it since the exact path varies by OS.

---

## VS Code (native MCP / Copilot agent mode)

VS Code has built-in MCP support (separate from Cline). Create `.vscode/mcp.json` in your workspace, or run **MCP: Add Server** from the Command Palette:

```json
{
  "servers": {
    "redmine": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "redmine-mcp-connector"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Note the key is `servers`, not `mcpServers`, and each entry needs `"type": "stdio"`. For a shared repo, avoid committing your real API key — use the `inputs` field instead so VS Code prompts you and stores the secret securely:

```json
{
  "inputs": [
    {
      "id": "redmine_api_key",
      "type": "promptString",
      "description": "Redmine API key",
      "password": true
    }
  ],
  "servers": {
    "redmine": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "redmine-mcp-connector"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "${input:redmine_api_key}"
      }
    }
  }
}
```

For a user-wide (not per-workspace) server, use **MCP: Open User Configuration** instead, which edits a global `mcp.json`.

---

## Zed

Edit `~/.config/zed/settings.json` (macOS/Linux) or `%APPDATA%\Zed\settings.json` (Windows). Zed uses `context_servers`, not `mcpServers`, and wraps the launch command in a `command` object:

```json
{
  "context_servers": {
    "redmine": {
      "command": {
        "path": "npx",
        "args": ["-y", "redmine-mcp-connector"],
        "env": {
          "REDMINE_BASE_URL": "https://redmine.example.com",
          "REDMINE_API_KEY": "your_api_key_here"
        }
      }
    }
  }
}
```

---

## Any other MCP client

Any client that supports stdio MCP servers needs, in some form, the same three things:

- **command**: `npx`
- **args**: `["-y", "redmine-mcp-connector"]`
- **env**: `REDMINE_BASE_URL`, `REDMINE_API_KEY` (plus any [optional variables](README.md#configuration))

If the client insists on an absolute path to an executable rather than `npx`, install globally first (`npm install -g redmine-mcp-connector`) and point it at the resulting binary (`which redmine-mcp-connector`).

---

## Alternative: local build

Prefer running from a git checkout instead of npm? Clone this repo, then:

```bash
npm install
npm run build
```

Use `node` + an absolute path instead of `npx` in any of the configs above:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/redmine-mcp-server/dist/index.js"]
}
```

---

## Alternative: Docker

See the [Docker section in the README](README.md#docker) for building/pulling the image. Swap the `command`/`args` in any config above for:

```json
{
  "command": "docker",
  "args": [
    "run", "--rm", "-i",
    "-e", "REDMINE_BASE_URL",
    "-e", "REDMINE_API_KEY",
    "docker.io/<docker-user>/redmine-mcp-server:latest"
  ],
  "env": {
    "REDMINE_BASE_URL": "https://redmine.example.com",
    "REDMINE_API_KEY": "your_api_key_here"
  }
}
```

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Client shows the server as "failed" or "disconnected" immediately | Check `REDMINE_BASE_URL`/`REDMINE_API_KEY` are set in the client's `env` block, not just your shell — child processes launched by GUI apps don't inherit your terminal's environment. |
| `401`/`403` errors from tools | Your API key is wrong, revoked, or the Redmine user lacks permission for that action. Regenerate it from **My account → API access key**. |
| Write tools (create/update/delete) silently fail or are rejected | `REDMINE_READONLY=true` is set, or the target project/tracker doesn't allow that field. Destructive tools also require `confirm: true` in the tool call itself. |
| `npx` hangs or fails to resolve the package | First run downloads the package; slow/offline networks time out. Pre-warm it with `npx -y redmine-mcp-connector` once in a terminal, or switch to the [local build](#alternative-local-build) / [Docker](#alternative-docker) alternative. |
| Timeouts on large Redmine instances | Raise `REDMINE_HTTP_TIMEOUT_MS` (default 15000ms) and/or lower `REDMINE_MAX_PAGES` for `fetch_all` calls. |
| Need to see what a tool call actually sent/received | Nothing is logged by default (API keys are never logged). Run the server directly (`REDMINE_BASE_URL=... REDMINE_API_KEY=... npx redmine-mcp-connector`) in a terminal to watch stdio traffic while debugging your client config. |

Still stuck? Open an issue with your client name, redacted config, and the exact error — see [SUPPORT.md](SUPPORT.md).
