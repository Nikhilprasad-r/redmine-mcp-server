# Redmine MCP Server

stdio-based [Model Context Protocol](https://modelcontextprotocol.io) server that wraps a Redmine instance through its **REST API** (`*.json` endpoints). It runs as a separate Node.js process; **no changes to the Redmine Rails app** are required.

## Requirements

- Node.js **20+**
- A Redmine user with an **API access key** (My account → Show API access key)
- Network access from this process to your Redmine `REDMINE_BASE_URL`

## Install

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Environment variables (see [`.env.example`](.env.example)):

| Variable | Required | Description |
|----------|----------|-------------|
| `REDMINE_BASE_URL` | yes | Base URL, e.g. `https://redmine.example.com` (no trailing slash) |
| `REDMINE_API_KEY` | yes | `X-Redmine-API-Key` value |
| `REDMINE_IMPERSONATE_USER` | no | Sets `X-Redmine-Switch-User` (admin-only in Redmine) |
| `REDMINE_READONLY` | no | If `true` / `1`, blocks all mutating HTTP methods |
| `REDMINE_ALLOW_RAW_REQUEST` | no | If `true` / `1`, registers the `redmine_request` escape-hatch tool |
| `REDMINE_HTTP_TIMEOUT_MS` | no | Default `15000` |
| `REDMINE_MAX_PAGES` | no | Max pages when using `fetch_all` on list tools (default `20`) |
| `REDMINE_MAX_DOWNLOAD_BYTES` | no | Cap for `redmine_attachment_download` (default 5 MiB) |

## Run

```bash
REDMINE_BASE_URL=https://your-redmine.example.com REDMINE_API_KEY=secret npm start
# or during development:
REDMINE_BASE_URL=... REDMINE_API_KEY=... npm run dev
```

## Claude Desktop / Cursor

Add to your MCP client config (paths must be absolute):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "node",
      "args": ["/absolute/path/to/redmine/mcp-server/dist/index.js"],
      "env": {
        "REDMINE_BASE_URL": "https://redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## MCP resources (read-only)

| URI | Description |
|-----|-------------|
| `redmine://projects` | `GET /projects.json` (first 100) |
| `redmine://me` | `GET /users/current.json` |
| `redmine://me/issues` | `GET /issues.json?assigned_to_id=me` (limit 100) |
| `redmine://projects/{id}` | `GET /projects/:id.json` |

## Tools overview

Naming: `redmine_<resource>_<action>`.

**Issues:** `redmine_issues_list`, `redmine_issue_get`, `redmine_issue_create`, `redmine_issue_update`, `redmine_issue_add_comment`, `redmine_issue_delete` (requires `confirm: true`), watchers add/remove, relations list/add/remove.

**Projects:** `redmine_projects_list`, `redmine_project_get`, create/update/archive/unarchive/delete (`confirm` for delete).

**Users:** `redmine_current_user`, `redmine_users_list`, `redmine_user_get`, create/update/delete (`confirm` for delete).

**Time entries:** list/get/create/update/delete (`confirm` for delete).

**News:** list/get/create/update/delete (`confirm` for delete).

**Wiki:** list pages, get page, create/update (PUT), delete (`confirm`).

**Versions & categories:** versions CRUD (`confirm` on delete), issue categories CRUD (`confirm` on delete).

**Queries & metadata:** `redmine_queries_list`, `redmine_enumerations_list`, `redmine_trackers_list`, `redmine_issue_statuses_list`, `redmine_roles_list`, `redmine_role_get`, `redmine_custom_fields_list`.

**Groups (read-only):** `redmine_groups_list`, `redmine_group_get`.

**Memberships:** list/create/update/delete (`confirm` on delete).

**Attachments & search:** `redmine_search`, attachment get/update/delete/upload/download (download returns base64, size-capped).

**Repository (limited REST in stock Redmine):** `redmine_repository_revision_link_issue`, `redmine_repository_revision_unlink_issue` (`confirm`). Listing repositories/revisions over JSON is **not** exposed by core Redmine; use `redmine_request` if you enable it, or plugins.

**Escape hatch:** `redmine_request` — only if `REDMINE_ALLOW_RAW_REQUEST=true`; `DELETE` requires `confirm: true`.

## Safety

- Destructive tools require explicit `confirm: true` where noted.
- Set `REDMINE_READONLY=true` for read-only deployments.
- API keys are never logged by this server.


## Docker

Build a local image:

```bash
docker build -t redmine-mcp-server:local .
```

Run it (stdio MCP server):

```bash
docker run --rm -i   -e REDMINE_BASE_URL="https://redmine.example.com"   -e REDMINE_API_KEY="your_api_key_here"   redmine-mcp-server:local
```

Use this image in MCP config:

```json
{
  "mcpServers": {
    "redmine": {
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
  }
}
```

### Publish to Docker Hub Catalog

1. Login:

```bash
docker login
```

2. Create and use a buildx builder (one-time):

```bash
docker buildx create --name redmine-mcp-builder --use --bootstrap
```

3. Build and push multi-arch image:

```bash
export IMAGE=docker.io/<docker-user>/redmine-mcp-server
export TAG=1.0.0

docker buildx build   --platform linux/amd64,linux/arm64   -t $IMAGE:$TAG   -t $IMAGE:latest   --push .
```

4. In Docker Hub, set your repository description from this README and mark it as public for catalog discovery.

## Development

```bash
npm run lint
npm test
```

## Contributing

Contributions are welcome.

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, coding expectations, and PR workflow.
- Follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) to keep collaboration respectful and inclusive.
- Use [`SUPPORT.md`](SUPPORT.md) for help channels and what details to include.
- Report vulnerabilities privately following [`SECURITY.md`](SECURITY.md).

## License

GPL-2.0-or-later (same family as Redmine).
