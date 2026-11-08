<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Parse Concinco PDF rows before their following EAN line and keep wrapped product descriptions, because quantities and packaging precede the barcode.
- Keep reconciliation browser-only with versioned local history; the no-login screen must not depend on authenticated backend reads.
- Discard outdated asynchronous file reads when inputs change, so removed files cannot restore stale results.
