# Bangmin QR

A free, responsive QR code studio. QR content and uploaded logos are processed exclusively in your browser: no accounts, backend, external generation API, analytics, or stored Wi-Fi passwords.

## Features

- Website, plain text, Wi-Fi (WPA/WPA2, WEP, open and hidden networks), email, phone and SMS payloads.
- Live, debounced preview; input validation and useful empty/generation/export error states.
- Foreground/background colors, four dot styles, corner styles and L/M/Q/H correction levels.
- Local PNG/JPEG/WebP logo upload with preview, replacement and removal. Uploads are capped at 2 MB and downscaled to 512 pixels; the logo occupies at most 22% of the code width. Adding a logo selects high correction.
- PNG, SVG and JPEG downloads at 256–2048 pixels with descriptive filenames; SVG scales without losing detail.
- Reset, semantic controls, keyboard focus, reduced motion and mobile layouts.

## Stack

React, strict TypeScript, Vite, Tailwind CSS, qr-code-styling and Lucide React. Vitest tests payloads. GitHub Actions builds and publishes static assets using the official Pages actions.

## Install and develop

Use Node.js 22.12+ (or 24+) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Nothing entered into the form is persisted.

## Checks and production build

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

The production output is `dist/`. `build` includes type checking. For another host or a custom domain, set `VITE_BASE_PATH=/` at build time. For a repository subpath use `VITE_BASE_PATH=/your-repository/`; set the same environment variable when running `npm run preview`. Without an override, the build uses relative asset URLs.

## GitHub Pages deployment

1. Put this project in a GitHub repository with a `main` branch, including `package-lock.json`.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. Ensure Actions are enabled in **Settings → Actions → General**, and your organization permits the official checkout, setup-node and Pages actions.
4. Push your changes to `main`, or open **Actions → Deploy to GitHub Pages → Run workflow**.
5. Wait for both build and deploy jobs to finish. The deployment URL is shown in the workflow and Settings → Pages.

Expected URL: `https://USERNAME.github.io/REPOSITORY_NAME/`. For a repository named `USERNAME.github.io`, the URL is `https://USERNAME.github.io/`. The workflow determines the base from GitHub environment variables without hardcoding the repository name. For custom-domain root hosting, change the workflow's base-path step to use `/` and configure your domain in Pages settings.

The workflow uses `npm ci`, automated tests and the type-checked production build, uploads `dist`, and deploys with `pages: write` and `id-token: write`. There is no client routing, so refreshes do not require a routing fallback.

If `configure-pages` fails with `Get Pages site failed` / `HttpError: Not Found`, complete step 2 above, then rerun the workflow. Pages must be enabled with **Source: GitHub Actions** before this workflow can deploy. Adding `enablement: true` alone does not fix this: automatic enablement requires a separate token with additional permissions, rather than the default `GITHUB_TOKEN`.

## Privacy and limitations

Generation, image resizing and exports run locally. No content is uploaded, logged or stored. Refreshing the page clears your inputs. Assets are served by your hosting provider, which may have its own request logs, but QR content is never sent with those requests.

Static QR codes cannot be edited after printing. There are no scan statistics, redirects or tracking. The URL you encode must remain available. Phone, email and SMS handling varies by scanner and operating system. Wi-Fi support also depends on the device.

Content is limited to 1,200 encoded UTF-8 bytes. A high correction level can exhaust QR capacity sooner; shorten content if generation fails. Low contrast, dense content, decorative dots and logos can reduce scan reliability. Keep dark foregrounds against light backgrounds, preserve the generated quiet zone, and scan-test downloaded files at their intended print size. Correction percentages describe approximate recoverable codewords, not a guaranteed safe logo area. JPEG is lossy; use PNG or SVG for print quality.
