# Registry Publishing Guide

This document provides copy-ready templates for publishing `redmine-mcp-server`
for public use across common registries and catalogs.

## Prerequisites

- Public source repository URL
- Public Docker image:
  - `docker.io/<docker-user>/redmine-mcp-server:<version>`
  - `docker.io/<docker-user>/redmine-mcp-server:latest`
- Basic project metadata (description, license, maintainer contact)

## Canonical MCP config snippet

Use this as the base installation snippet in all registry listings.

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

## Docker Hub (required)

1. Push image tags (`latest` + versioned tag).
2. Mark repository public.
3. Set description and README content.
4. Add tags/keywords: `mcp`, `model-context-protocol`, `redmine`, `automation`.

Example publish command:

```bash
export IMAGE=docker.io/<docker-user>/redmine-mcp-server
export TAG=<version>

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t $IMAGE:$TAG \
  -t $IMAGE:latest \
  --push .
```

## MCP Registry Submission Template (generic)

Use this template when a registry asks for a JSON/YAML metadata entry.

```json
{
  "name": "redmine-mcp-server",
  "displayName": "Redmine MCP Server",
  "description": "Model Context Protocol server for Redmine REST API.",
  "repository": "https://github.com/<owner>/redmine-mcp-server",
  "license": "GPL-2.0-or-later",
  "runtime": "docker",
  "image": "docker.io/<docker-user>/redmine-mcp-server:latest",
  "tags": ["mcp", "redmine", "project-management", "issues"],
  "env": [
    {
      "name": "REDMINE_BASE_URL",
      "required": true,
      "description": "Redmine base URL, e.g. https://redmine.example.com"
    },
    {
      "name": "REDMINE_API_KEY",
      "required": true,
      "secret": true,
      "description": "Redmine API key used in X-Redmine-API-Key"
    },
    {
      "name": "REDMINE_READONLY",
      "required": false,
      "description": "Set true/1 to block mutating operations"
    }
  ],
  "install": {
    "docker": {
      "image": "docker.io/<docker-user>/redmine-mcp-server:latest"
    }
  },
  "documentation": {
    "readme": "https://github.com/<owner>/redmine-mcp-server#readme",
    "contributing": "https://github.com/<owner>/redmine-mcp-server/blob/main/CONTRIBUTING.md",
    "security": "https://github.com/<owner>/redmine-mcp-server/blob/main/SECURITY.md"
  }
}
```

## Smithery-style listing template

If the target directory or file expects Smithery-compatible metadata, use:

```yaml
name: redmine-mcp-server
displayName: Redmine MCP Server
description: MCP server for Redmine REST API
author: <your-name-or-org>
license: GPL-2.0-or-later
repository: https://github.com/<owner>/redmine-mcp-server
icon: https://raw.githubusercontent.com/<owner>/redmine-mcp-server/main/.github/assets/icon.png
runtime: docker
docker:
  image: docker.io/<docker-user>/redmine-mcp-server:latest
env:
  - name: REDMINE_BASE_URL
    required: true
    description: Redmine base URL
  - name: REDMINE_API_KEY
    required: true
    secret: true
    description: Redmine API key
  - name: REDMINE_READONLY
    required: false
    description: Optional read-only safety mode
```

## PulseMCP / directory listing template

For marketplaces that require a concise catalog card:

```json
{
  "name": "Redmine MCP Server",
  "slug": "redmine-mcp-server",
  "category": "Project Management",
  "short_description": "Interact with Redmine issues, projects, users, wiki, and time entries through MCP.",
  "source_url": "https://github.com/<owner>/redmine-mcp-server",
  "docker_image": "docker.io/<docker-user>/redmine-mcp-server:latest",
  "quickstart": "Set REDMINE_BASE_URL and REDMINE_API_KEY, then run via Docker MCP config.",
  "maintainer": "<name-or-org>",
  "support_url": "https://github.com/<owner>/redmine-mcp-server/blob/main/SUPPORT.md"
}
```

## README snippet for public users

Add this to marketplace descriptions when needed:

```md
### Quick setup

1. Pull image: `docker pull docker.io/<docker-user>/redmine-mcp-server:latest`
2. Add MCP config using Docker runtime.
3. Set:
   - `REDMINE_BASE_URL`
   - `REDMINE_API_KEY`
4. Optional safety mode: `REDMINE_READONLY=true`
```

## Validation Checklist Before Submission

- Docker image is public and pullable.
- README has quickstart and environment variables.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md` exist.
- License is clearly declared.
- Versioned tag and `latest` tag both published.
- A test pull + run from a clean environment succeeds.
