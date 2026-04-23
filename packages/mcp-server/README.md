# Proactiva MCP Server

Model Context Protocol server for Proactiva.

This package is a thin MCP wrapper over the existing Proactiva REST API. It does
not talk to the database directly and it does not reimplement business logic.

## Authentication

The server reads its configuration from environment variables:

- `PROACTIVA_API_URL` - Proactiva base URL, for example `http://localhost:3100`
- `PROACTIVA_API_KEY` - bearer token used for `/api` requests
- `PROACTIVA_COMPANY_ID` - optional default company for company-scoped tools
- `PROACTIVA_AGENT_ID` - optional default agent for checkout helpers
- `PROACTIVA_RUN_ID` - optional run id forwarded on mutating requests

## Usage

```sh
npx -y @proactiva/mcp-server
```

Or locally in this repo:

```sh
pnpm --filter @proactiva/mcp-server build
node packages/mcp-server/dist/stdio.js
```

## Tool Surface

Read tools:

- `proactivaMe`
- `proactivaInboxLite`
- `proactivaListAgents`
- `proactivaGetAgent`
- `proactivaListIssues`
- `proactivaGetIssue`
- `proactivaGetHeartbeatContext`
- `proactivaListComments`
- `proactivaGetComment`
- `proactivaListIssueApprovals`
- `proactivaListDocuments`
- `proactivaGetDocument`
- `proactivaListDocumentRevisions`
- `proactivaListProjects`
- `proactivaGetProject`
- `proactivaGetIssueWorkspaceRuntime`
- `proactivaWaitForIssueWorkspaceService`
- `proactivaListGoals`
- `proactivaGetGoal`
- `proactivaListApprovals`
- `proactivaGetApproval`
- `proactivaGetApprovalIssues`
- `proactivaListApprovalComments`

Write tools:

- `proactivaCreateIssue`
- `proactivaUpdateIssue`
- `proactivaCheckoutIssue`
- `proactivaReleaseIssue`
- `proactivaAddComment`
- `proactivaSuggestTasks`
- `proactivaAskUserQuestions`
- `proactivaRequestConfirmation`
- `proactivaUpsertIssueDocument`
- `proactivaRestoreIssueDocumentRevision`
- `proactivaControlIssueWorkspaceServices`
- `proactivaCreateApproval`
- `proactivaLinkIssueApproval`
- `proactivaUnlinkIssueApproval`
- `proactivaApprovalDecision`
- `proactivaAddApprovalComment`

Escape hatch:

- `proactivaApiRequest`

`proactivaApiRequest` is limited to paths under `/api` and JSON bodies. It is
meant for endpoints that do not yet have a dedicated MCP tool.
