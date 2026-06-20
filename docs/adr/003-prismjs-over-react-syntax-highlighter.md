# ADR 003: Replace react-syntax-highlighter with Prism.js

## Status

Accepted

## Context

The tool needs syntax highlighting for Python (SageMath templates) and TypeScript (frontendCheck source). `react-syntax-highlighter` was the initial choice but added significant bundle weight (~150KB+ gzipped) for a feature that's used in only two places (Source tab and proof rendering).

## Decision

Use Prism.js directly with the `draculaPrism.css` theme. Prism.js is ~30KB gzipped, supports both Python and TypeScript grammars, and integrates easily via `Prism.highlight()`. The Dracula color scheme matches the app's theme.

## Consequences

- 33% smaller bundle compared to react-syntax-highlighter
- Less React-integrated (manual `dangerouslySetInnerHTML` for highlighted output)
- Source tab uses `getAttackSource()` lazy imports via Vite glob to fetch raw source
- Proof rendering uses KaTeX for math, not Prism — Prism is only for code blocks
