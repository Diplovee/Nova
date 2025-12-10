<svg viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="clip3"><rect width="800" height="200" rx="20"/></clipPath></defs><g clip-path="url(#clip3)"><rect width="800" height="200" fill="#f3f4f6"/><circle cx="650" cy="100" r="160" fill="#dbeafe"/><circle cx="100" cy="200" r="80" fill="#e0e7ff"/><rect x="550" y="40" width="200" height="120" rx="8" fill="#ffffff"/><rect x="570" y="60" width="100" height="10" rx="5" fill="#bfdbfe"/><rect x="570" y="85" width="160" height="8" rx="4" fill="#f3f4f6"/><rect x="570" y="105" width="140" height="8" rx="4" fill="#f3f4f6"/><text x="80" y="120" font-family="Helvetica, sans-serif" font-size="55" fill="#1e3a8a" font-weight="bold">Nova</text><text x="240" y="120" font-family="Helvetica, sans-serif" font-size="20" fill="#6b7280" font-weight="300">Xalo Software</text></g></svg>
# Nova - AI-Powered Project Manager

This contains everything you need to run Nova locally - both as a web app and desktop application.

## Desktop Application (Recommended)

**Prerequisites:** Node.js, Rust toolchain

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the desktop app:
   ```bash
   npm run tauri:dev
   ```

The desktop version offers better performance and native system integration.

## Build for Distribution

To build installable binaries for your platform:

```bash
npm run tauri:build
```

This will create platform-specific bundles in `src-tauri/target/release/bundle`.

## Web Application

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the web app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser
