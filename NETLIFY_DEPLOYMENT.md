# ⚡ Netlify Deployment & Website Integration Guide

Because your chatbot is now **100% stateless** (no local database files or volume configurations needed), it is **perfectly optimized for Netlify's serverless hosting architecture**. It will run lightning-fast and scale infinitely for free!

This guide walks you through:
1. **Hosting the Next.js app on Netlify** in under 3 minutes.
2. **Embedding the Chatbot Widget** onto any website.

---

## 🛠️ Part 1: Deploying the Chatbot to Netlify

### Step 1: Log in and Import the GitHub Repo
1. Go to [Netlify](https://www.netlify.com) and log in (or sign up).
2. On your Netlify dashboard, click the **Add new site** button $\rightarrow$ select **Import an existing project**.
3. Choose **GitHub** as your Git provider and authorize Netlify.
4. Search for and select your repository: `hasankhan10/drpaulaichatbot`.

### Step 2: Configure Build Settings
Netlify will automatically detect that this is a Next.js application and prepopulate the build settings for you:
*   **Build command**: `npm run build`
*   **Publish directory**: `.next`

*Leave these default settings exactly as they are.*

### Step 3: Add Environment Variables
1. Scroll down to the **Environment variables** section (or click **Advanced build settings** $\rightarrow$ **Add variable**).
2. Enter your production variables:
   *   `GEMINI_API_KEY` $\rightarrow$ `YOUR_ACTUAL_GOOGLE_GEMINI_KEY`
   *   `GOOGLE_SHEETS_WEBHOOK_URL` $\rightarrow$ `YOUR_GOOGLE_SHEETS_WEBHOOK_URL`
3. Click **Deploy drpaulaichatbot**.

### Step 4: Get Your Production URL
Netlify will pull the code directly from your GitHub, compile the production Next.js build, and deploy it.
Once the build is complete (usually 1-2 minutes), you will see your production URL on the screen:
*   Example: `https://drpaul-ai-chatbot.netlify.app`

*(You can also set up a custom domain on Netlify for free in **Site Settings** $\rightarrow$ **Domain management**).*

---

## 🔌 Part 2: Embedding the Chatbot in Your Website

Now that your chatbot is live on Netlify, you can easily add it to any external website (WordPress, Webflow, Shopify, or custom HTML) using this lightweight, zero-dependency **Floating Iframe Embed** code.

### Step 1: Copy this Embed Code
Copy the following HTML/JS snippet. **Be sure to replace** `https://YOUR-SUBDOMAIN.netlify.app` on **Line 6** with your actual Netlify production URL:

```html
<!-- Start Dr. Paul AI Chatbot Embed -->
<script>
  (function() {
    // 1. YOUR NETLIFY DEPLOYMENT URL (REPLACE THIS WITH YOUR ACTUAL NETLIFY URL)
    const CHATBOT_URL = 'https://YOUR-SUBDOMAIN.netlify.app';

    // 2. Inject Styles for the Floating Sandboxed Container
    const css = `
      #drpaul-chat-container {
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 2147483647; /* Maximum z-index to overlay elements */
        border: none;
        background: transparent;
        transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), height 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        overflow: hidden;
        width: 88px;
        height: 88px;
      }
      #drpaul-chat-container iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        pointer-events: auto;
      }
      /* Desktop Sizing Configurations */
      #drpaul-chat-container.state-closed {
        width: 88px;
        height: 88px;
      }
      #drpaul-chat-container.state-greeting {
        width: 400px;
        height: 120px;
      }
      #drpaul-chat-container.state-open {
        width: 440px;
        height: 680px;
      }
      /* Mobile Fluid Sizing (Full Screen on Mobile Viewports) */
      @media (max-width: 640px) {
        #drpaul-chat-container.state-open {
          width: 100% !important;
          height: 100% !important;
          bottom: 0 !important;
          right: 0 !important;
        }
        #drpaul-chat-container.state-greeting {
          width: 100%;
          max-width: 380px;
        }
      }
    `;

    // 3. Apply CSS to Head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = css;
    document.head.appendChild(styleElement);

    // 4. Create and Configure Widget Container Div
    const container = document.createElement('div');
    container.id = 'drpaul-chat-container';
    container.className = 'state-closed';

    // 5. Create and Configure Iframe Element
    const iframe = document.createElement('iframe');
    iframe.src = CHATBOT_URL;
    iframe.title = "Dr. Paul Harrison AI Assistant";
    iframe.setAttribute('allow', 'clipboard-write');

    // 6. Assemble & Inject to Page Body
    container.appendChild(iframe);
    document.body.appendChild(container);

    // 7. Listen for Resize & Toggle Messages from Next.js Child Iframe
    window.addEventListener('message', function(event) {
      if (!event.data || event.data.type !== 'drpaul_chat_state') return;

      const state = event.data.state; // 'closed' | 'greeting' | 'open'
      
      // Update Container Class to Trigger CSS Transitions
      container.className = 'state-' + state;
    });
  })();
</script>
<!-- End Dr. Paul AI Chatbot Embed -->
```

---

## 💻 Step 2: Paste the Code on Your Website

Here is how to paste this code based on your website's platform:

### 1. WordPress (Recommended Method)
If the website is built on WordPress, you can inject it globally without editing files:
1. Go to **Plugins** $\rightarrow$ **Add New**.
2. Search for **WPCode** (*Insert Headers and Footers*), install, and activate it.
3. Open **Code Snippets** $\rightarrow$ **Header & Footer** in your dashboard.
4. Paste the copied snippet into the **Footer** input box.
5. Click **Save Changes**.

*Alternatively, paste it right before the `</body>` tag in your theme's `footer.php` file.*

---

### 2. Webflow
1. Open your Webflow Designer dashboard.
2. Go to **Site Settings** $\rightarrow$ **Custom Code**.
3. Scroll to the **Footer Code** block (before the `</body>` tag).
4. Paste the copied embed snippet inside the field.
5. Save changes and **Publish** your site to production.

---

### 3. Shopify
1. Go to **Online Store** $\rightarrow$ **Themes**.
2. Click the **...** (three dots button) next to your active theme $\rightarrow$ **Edit Code**.
3. Select the `layout/theme.liquid` file.
4. Scroll to the bottom of the file, find the closing `</body>` tag, and paste the code **directly above** it.
5. Click **Save**.

---

### 4. Custom HTML Website
1. Open your main template or page file (e.g., `index.html` or `footer.html`).
2. Go to the very bottom of the document.
3. Paste the snippet **directly above** the closing `</body>` tag.
4. Save and deploy your updated files to your hosting server.
