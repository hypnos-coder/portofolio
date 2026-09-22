# Portfolio

## Structure

- `html/`: portfolio, project report, and reality simulation pages.
- `css/`: shared portfolio styles and page-specific styles.
- `js/`: portfolio interactions, simulation, and the local Three.js module.
- `assets/`: original PDF and report page images.
- `index.html`: entry point that redirects to `html/index.html` while preserving query parameters and section anchors.

## Preview

Run from the project root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 for the portfolio, or
http://localhost:8000/html/opti.html for the project report.

Keep the project root as the server directory so that shared styles, scripts,
and assets remain accessible. The reality simulation uses JavaScript modules
and should be viewed through this server.
