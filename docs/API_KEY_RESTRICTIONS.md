# Firebase API Key & Project Restrictions Guide

This guide details the security configuration necessary to protect your Firebase/Google Cloud Project resources from unauthorized usage and abuse.

## 1. Restrict the Firebase API Key (GCP Console)

Although Firebase API keys are designed to be public (client-side), they should be locked down to prevent them from being intercepted and used by third parties on other websites or apps.

### Step 1: Locate the API Key in GCP Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project from the project dropdown at the top.
3. In the left-hand sidebar, navigate to **APIs & Services** > **Credentials**.
4. Under **API Keys**, locate the key used by your client application (typically named `Browser key` or `Auto-created for Firebase`).

### Step 2: Configure HTTP Referrer Restrictions
1. Click the edit icon (pencil) next to the active API Key.
2. Under **Key restrictions**, locate the **Application restrictions** section.
3. Select **HTTP referrers (web sites)**.
4. Under **Website restrictions**, click **ADD AN ITEM** and add the following patterns:
   - `https://fifapredicton2026.pages.dev/*` (Official Pages deployment)
   - `http://localhost:5173/*` (Local Vite development server)
   - `http://localhost:3000/*` (Optional: Other local servers)
5. Click **DONE**.

### Step 3: Configure API Restrictions
API restrictions ensure that this specific key can only communicate with services it absolutely needs (e.g., Auth and Firestore), preventing it from being used for other expensive GCP APIs if leaked.

1. Under the **API restrictions** section, select **Restrict key**.
2. Click the dropdown list and select only the following APIs:
   - **Identity Toolkit API** (Required for Firebase Authentication)
   - **Cloud Firestore API** (Required for database operations)
   - **Cloud Functions API** (Required for Cloud Functions)
3. Click **SAVE**.

---

## 2. Enforce OAuth Client Domain Whitelisting (Firebase Console)

To prevent attackers from using your Google OAuth Client ID to log users in from clone/malicious sites:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Navigate to **Authentication** > **Settings** > **Authorized Domains**.
4. Ensure only the following domains are whitelisted:
   - `localhost`
   - `fifapredicton2026.pages.dev`
   - `<your-project-id>.firebaseapp.com` (Default fallback domain)
5. Remove any other unused domains.

---

## 3. Verify Custom Claims Integration

After setting up the restrictions, users attempting to access admin functionality from other unauthorized domains or without valid admin Custom Claims will be rejected by:
1. The client-side Auth route checks.
2. The `firestore.rules` rules: `request.auth.token.admin == true`.
3. The Cloud Functions validation blocks: `if (!request.auth.token.admin) { throw new HttpsError('permission-denied'); }`.
