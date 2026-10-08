# Task: Build a Static QR Code Generator Website

You are a senior frontend engineer and UI/UX designer.

Build a complete, modern, responsive QR Code Generator website that can be deployed to **GitHub Pages** as a fully static application.

## 1. Project Objective

Create a free, privacy-friendly QR code generator that runs entirely in the user's browser.

Users should be able to generate, customize, preview, and download QR codes without registering, using external APIs, or sending their data to a server.

The application must be fully functional, not just a UI prototype.

## 2. Technology Stack

Use:

- React + TypeScript
- Vite
- Tailwind CSS
- `qr-code-styling` for QR generation and customization
- Lucide React for icons
- GitHub Pages for hosting
- GitHub Actions for automatic deployment

Do not use:

- Backend servers
- Databases
- External QR code generation APIs
- Authentication
- Paid services
- Unnecessary dependencies

## 3. Core Features

### 3.1 QR Code Types

Support the following:

1. **URL:** Generate a QR code from a website URL.
2. **Text:** Generate a QR code containing arbitrary text.
3. **Wi-Fi:** Generate a QR code containing SSID, password, and security type (WPA/WPA2, WEP, or no password).
4. **Email:** Generate a QR code with recipient, subject, and body.
5. **Phone:** Generate a QR code for a phone number.
6. **SMS:** Generate a QR code with recipient and message.

Use appropriate standard payload formats for each type. Properly escape special characters where required.

### 3.2 Live QR Preview

- Automatically update the QR code when inputs change.
- Display the generated QR code in a clean preview panel.
- Show a useful placeholder when no valid input is provided.
- Prevent invalid or empty inputs from generating misleading QR codes.
- Handle excessive payload lengths and generation errors gracefully.
- Do not unnecessarily recreate QR instances on every render.

### 3.3 QR Customization

Allow users to customize:

- Foreground color
- Background color
- Dot style: square, rounded, dots, classy
- Corner square style
- Corner dot style
- QR error correction level: L, M, Q, H
- QR image size
- Optional logo upload

For logo uploads:

- Accept PNG, JPEG, and WebP.
- Show an immediate preview.
- Allow removing or replacing the logo.
- Recommend high error correction when a logo is used.
- Limit logo dimensions to avoid excessive QR obstruction.
- Clean up temporary object URLs and resources.
- Explain that decorative QR codes should be tested with a scanner.

### 3.4 Download

Support:

- PNG
- SVG
- JPEG, if supported reliably by the chosen library

Requirements:

- Export the current QR design.
- Allow high-resolution output.
- Use meaningful filenames.
- Preserve QR colors and styling.
- Ensure exported files match the preview.
- Handle export failures with clear feedback.

### 3.5 Reset

Provide a Reset button that restores all settings to their defaults.

## 4. UI/UX Design

Create a polished, modern, minimal interface suitable for a public utility website.

Design direction:

- Clean SaaS-style interface
- Light theme by default
- Optional dark mode
- Neutral backgrounds with a consistent accent color
- Rounded cards
- Subtle borders and shadows
- Clear typography
- Smooth but restrained transitions
- Lucide icons
- Responsive layout

### Desktop Layout

Use a two-column layout.

**Left panel: QR Configuration**

- QR type selector
- Input fields based on selected QR type
- Customization controls
- Logo upload
- Reset button

**Right panel: QR Preview**

- Large QR preview
- Download format selector
- Download button
- QR size/resolution options

Keep the preview panel sticky on larger screens where appropriate.

### Mobile Layout

- Stack configuration and preview vertically.
- Ensure all inputs and buttons are touch-friendly.
- Prevent horizontal overflow.
- Keep the QR preview easy to access.

### Accessibility

- Use semantic HTML.
- Associate labels with inputs.
- Support keyboard navigation.
- Provide visible focus states.
- Maintain sufficient color contrast.
- Provide accessible error messages.

## 5. Privacy and Security

The application must work entirely client-side.

- Never transmit QR content to a server.
- Do not use analytics or tracking scripts.
- Do not upload logo files.
- Do not persist sensitive information such as Wi-Fi passwords.
- Do not log user input to the console.
- Avoid rendering user-controlled content as unsafe HTML.
- Clearly explain that QR generation happens locally.

## 6. GitHub Pages Deployment

Configure the project for automatic deployment through GitHub Actions.

Requirements:

1. Create `.github/workflows/deploy.yml`.
2. Trigger deployment on pushes to the `main` branch.
3. Install dependencies using `npm ci`.
4. Run TypeScript checks and production build.
5. Upload the Vite `dist` directory as the Pages artifact.
6. Deploy using official GitHub Pages Actions.
7. Configure the correct GitHub Actions permissions.
8. Support repository-based GitHub Pages URLs.

Important:

Do not hardcode the repository name.

Configure the Vite base path through an environment variable or an equivalent reliable build-time mechanism so the project can be deployed to:

`https://USERNAME.github.io/REPOSITORY_NAME/`

Ensure assets load correctly under a repository subpath.

Avoid unnecessary client-side routing. If routing is introduced, ensure GitHub Pages refreshes do not produce 404 errors.

## 7. Project Structure

Use a maintainable component-based architecture.

Suggested structure:

```text
qr-generator/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
├── src/
│   ├── components/
│   │   ├── QRTypeSelector.tsx
│   │   ├── QRInputForm.tsx
│   │   ├── QRCustomizer.tsx
│   │   ├── QRPreview.tsx
│   │   ├── QRDownload.tsx
│   │   └── LogoUploader.tsx
│   ├── lib/
│   │   ├── qrPayload.ts
│   │   └── qrDefaults.ts
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

You may adjust the structure if there is a clear technical reason.

## 8. Code Quality

Follow these standards:

- Strict TypeScript typing
- Reusable React components
- Separation of QR payload generation from presentation
- No unnecessary `any` types
- No dead code
- No placeholder features
- No unnecessary abstractions
- Proper loading, empty, and error states
- Clean resource management for uploaded images
- Minimal dependencies
- Readable and maintainable code

Prioritize correctness and reliability over excessive features.

## 9. Testing and Validation

Implement automated tests for QR payload formatting, including:

- URL
- Plain text
- Wi-Fi with special characters
- Email with subject and body
- Phone
- SMS
- Empty and invalid inputs

Also verify:

- QR generation updates when inputs change.
- Customization settings affect the preview.
- Logo upload and removal work.
- PNG and SVG downloads work.
- Reset restores default settings.
- The production build succeeds.
- GitHub Pages asset paths work correctly.

Run all available checks and fix any failures before finishing.

If browser-based testing is unavailable, explicitly state which UI behaviors could not be verified.

## 10. README

Create a comprehensive `README.md` containing:

1. Project overview
2. Features
3. Technology stack
4. Installation
5. Local development
6. Production build
7. GitHub Pages deployment instructions
8. GitHub repository settings required for deployment
9. Limitations of static QR codes
10. Privacy explanation

## 11. Execution Instructions

1. Inspect the existing repository before modifying anything.
2. If the repository is empty, initialize the project.
3. If a project already exists, preserve its working configuration where practical.
4. Implement the complete application.
5. Configure GitHub Pages deployment.
6. Install dependencies.
7. Run tests, type checks, and production build.
8. Fix identified errors.
9. Review the final implementation for unnecessary complexity.

Do not stop after creating a project skeleton.

Do not ask for confirmation unless an essential decision cannot be made safely.

Do not run `git add`, `git commit`, or `git push`.

## 12. Final Response

After completing the implementation, provide:

- Summary of implemented features
- Files created or modified
- Technologies and dependencies used
- Test and build results
- Any known limitations
- Exact steps required to enable GitHub Pages
- Expected deployment URL format
- **One suggested Conventional Commit message**

The final result must be a fully functional, responsive, production-buildable QR code generator ready for deployment to GitHub Pages.