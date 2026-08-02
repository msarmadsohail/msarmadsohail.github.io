# PDF.js (vendored)

`pdf.min.mjs` and `pdf.worker.min.mjs`, from `pdfjs-dist@6.2.108`, `legacy/build/`
(broadest browser support, not the modern-only build). Apache 2.0, license header intact
in both files.

Self-hosted on purpose, not a CDN script tag: `js/main.js` already avoids third-party
runtime dependencies (a prior GSAP-via-CDN outage broke the mobile nav), and the résumé
viewer is built the same way. Both files are only fetched lazily, on first click of a
résumé link — never on page load.

To update: `npm pack pdfjs-dist`, extract, copy the two files from `legacy/build/` here.
