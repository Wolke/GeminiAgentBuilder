# Deploying G8N Backend to Google Apps Script (GAS)

To enable GAS integrations (Sheets, Gmail, Drive, etc.), you need to deploy the backend code to a Google Apps Script project.

## Option A: Manual Deployment (Copy & Paste)

1.  **Create a New Project**:
    *   Go to [script.google.com](https://script.google.com/).
    *   Click **New Project**.
    *   Name it "G8N Backend".

2.  **Copy Files**:
    *   Create `Router.gs`, `Engine.gs` in the GAS editor. A `Code.gs` should already exist.
    *   Copy content from `src/gas/Code.js` to `Code.gs`.
    *   Copy content from `src/gas/Router.js` to `Router.gs`.
    *   Copy content from `src/gas/Engine.js` to `Engine.gs`.

3.  **Project Settings**:
    *   Go to **Project Settings** (gear icon).
    *   Check "Show \"appsscript.json\" manifest file in editor".
    *   Go back to Editor, open `appsscript.json`.
    *   Copy content from `src/gas/appsscript.json` to it.

4.  **Deploy as Web App**:
    *   Click **Deploy** -> **New deployment**.
    *   Select type: **Web app**.
    *   Description: "Initial G8N deployment".
    *   **Execute as**: "Me" (your account).
    *   **Who has access**: "Anyone" (or "Anyone with Google Account" if you prefer auth, but "Anyone" is easiest for testing. Note: "Anyone" allows anonymous access to your script's functions, so ensure your token protection is active if you go public). 
        *   *Recommendation*: Use **"Anyone"** for simplest setup with the G8N builder.

5.  **Get URL**:
    *   Copy the **Web App URL** (ends in `/exec`).
    *   Paste this URL into G8N **Settings -> Google Apps Script -> Web App URL**.

## Option B: Using `clasp` (CLI)

1.  **Install Clasp**:
    ```bash
    npm install -g @google/clasp
    login
    ```

2.  **Login**:
    ```bash
    clasp login
    ```

3.  **Create/Clone**:
    ```bash
    cd src/gas
    clasp create --title "G8N Backend" --type webapp
    ```

4.  **Push**:
    ```bash
    clasp push
    ```

5.  **Deploy**:
    ```bash
    clasp deploy
    ```
