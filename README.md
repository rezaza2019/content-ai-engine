<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/82678bda-2911-4618-9f34-3d8fdd254520

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env` (or `.env.local`) and set:
   - `GEMINI_API_KEY` for AI features
   - `WP_USERNAME` and `WP_APP_PASSWORD` for WordPress create/update (Application Password from **Users → Profile** in WordPress; use an Editor or Administrator account)
3. Run the app:
   `npm run dev`
