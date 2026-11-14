<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All content analysis goes through `src/lib/analysis.server.ts`; when the `DETECTION_API_URL` secret is set it forwards to an external (Python) detector, otherwise it asks the AI gateway. Why: the UI and saved history stay unchanged when a real detector is plugged in (contract in `docs/python-backend.md`).
- Every result carries a `source` (`ai-opinion` | `python-detector` | `demo-sample`) that the UI always displays. Why: the app must never imply real forensic detection that isn't connected.
- Image metadata and video frame extraction run in the browser (`src/lib/media-utils.ts`); only shrunk JPEGs are sent to the server. Why: keeps request bodies small and works on the edge runtime.
- Analysis server functions require sign-in and save to the `analyses` table. Why: protects AI credits and powers the dashboard history.
