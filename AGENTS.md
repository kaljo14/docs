# Internal documentation

This repository documents only `my-map`, `map-infra`, and `neofyis-geopulse`.
Do not inspect other sibling project directories without a new user request.

- Verify behavior against implementation and manifests, not only existing READMEs.
- Distinguish checked-in configuration, observed runtime behavior, and proposals.
- Never copy `.env` values, credentials, tokens, private keys, or raw scraped datasets into docs.
- Give each page a title, description, and verified `source_files` list in frontmatter.
- Update `content/docs/sources.md` when refreshing the source snapshot.
- Run `npm run check:sources` with the three sibling repos present; run `npm run build` with dependencies installed.
- Keep this a docs-only Fumadocs app. Publishing requires an internal hosting destination with access control; no automatic public deployment.
