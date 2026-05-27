# 🚀 Dr. Paul AI Chatbot Website Integration Guide

This guide provides a step-by-step walkthrough to deploy your premium AI Chatbot and integrate it seamlessly onto any external live website (including WordPress, Webflow, Shopify, or custom HTML sites).

---

## 🛠️ Step 1: Deploy the Chatbot Web Application

Before embedding the chatbot onto any site, you must host the Next.js application online. We highly recommend **Vercel** because it is the native platform for Next.js, extremely fast, and offers a robust, free tier.

### Option A: Quick Deploy to Vercel (Recommended)
1. **Push your code to GitHub**: Create a private repository on GitHub and push this codebase up.
2. **Create a Vercel Project**:
   - Sign up or log into [Vercel](https://vercel.com).
   - Click **Add New** $\rightarrow$ **Project**.
   - Import your GitHub repository.
3. **Configure Environment Variables**:
   Under the **Environment Variables** section, add the exact same variables from your `.env.local` file:
   - `GEMINI_API_KEY` (Your Google Gemini API Key)
   - `GOOGLE_SHEETS_WEBHOOK_URL` (Your active Google Sheets Webhook URL)
4. **Deploy**: Click **Deploy**. Vercel will build your application and provide a production URL (e.g., `https://dr-paul-ai-chatbot.vercel.app`).

*Make sure your deployed URL loads perfectly and that the chatbot bubble is visible in the bottom-right corner.*

---

## 🔌 Step 2: Copy the Magic Embed Snippet

Once your chatbot is deployed, you can embed it onto any external site using the **Floating Iframe Embed** script below. 

This script renders the chatbot inside a secure, sandboxed iframe. This guarantees **zero styling leakage**: parent website styles (CSS) will not conflict with or warp the chatbot's premium UI.

Copy the following code snippet and replace `https://YOUR-DEPLOYED-CHATBOT-URL.vercel.app` with your actual Vercel production URL:

```html
<!-- Start Dr. Paul AI Chatbot Embed -->
<script>
  (function() {
    // 1. Define the Chatbot URL (REPLACE WITH YOUR ACTUAL DEPLOYED URL)
    const CHATBOT_URL = 'https://YOUR-DEPLOYED-CHATBOT-URL.vercel.app';

    // 2. Inject Styles for the Floating Sandboxed Container
    const css = `
      #drpaul-chat-container {
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 2147483647; /* Maximum z-index */
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
      // Security Check: Optional validation to make sure message is from our deployed app
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

## 💻 Step 3: Platform Integration Guides

Choose the option below that fits the target website:

### 1. WordPress (Easiest)
You can inject the script globally using a lightweight plugin:
1. Log in to your **WordPress Dashboard**.
2. Go to **Plugins** $\rightarrow$ **Add New**.
3. Search for **WPCode** (formerly *Insert Headers and Footers*), install, and activate it.
4. Go to **Code Snippets** $\rightarrow$ **Header & Footer** in the left menu.
5. Paste the copied snippet into the **Footer** section.
6. Click **Save Changes**.

*Alternatively, if you are a developer, paste the script before the `</body>` tag in your theme's `footer.php` file.*

---

### 2. Webflow
1. Log in to your **Webflow** account and open the site builder.
2. Go to **Site Settings** $\rightarrow$ **Custom Code**.
3. Scroll down to the **Footer Code** section (before the `</body>` tag).
4. Paste the copied snippet inside the text block.
5. Click **Save Changes** and **Publish** the site.

---

### 3. Shopify
1. Log in to your **Shopify Admin**.
2. Go to **Online Store** $\rightarrow$ **Themes**.
3. Click the **...** (three dots button) next to your active theme $\rightarrow$ **Edit Code**.
4. Open the `layout/theme.liquid` file.
5. Scroll down to the bottom of the file, locate the closing `</body>` tag, and paste the snippet **directly above** it.
6. Click **Save**.

---

### 4. Custom HTML / PHP Website
1. Open your project's main HTML layout file (e.g., `index.html`, `footer.html`, or `base.html`).
2. Scroll to the absolute bottom of the document.
3. Paste the snippet **directly above** the closing `</body>` tag.
4. Save and deploy your website files.

---

## 🔬 Step 4: Verification Checklist

After integration, verify the behavior is working perfectly by checking:
- [ ] **Load Timing**: Does the chatbot circular floating bubble load correctly at the bottom-right of the screen with proper shadows?
- [ ] **Proactive Greeting Tooltip**: Does the greeting bubble `"Hi there! 👋 Hey, how can I help you?"` slide up smoothly after exactly **5 seconds** without blocking main content?
- [ ] **Fluid Scaling & Transitions**: Click the button. Does the chat popover scale and open smoothly?
- [ ] **Iframe Sandbox Click-throughs**: Can you still hover and click elements on the *parent* website right next to the widget button? (This validates that pointer-events are configured correctly).
- [ ] **Mobile Responsiveness**: Resize your browser or test on a mobile device. Does the chatbot cover the screen fluidly when expanded, and close back to a tiny circular button when minimized?
- [ ] **Complete End-to-End Submission**: Ask the chatbot to book a weight loss consultation, fill out the booking form, submit it, and verify that the data appears immediately in your Google Sheet!

---

## 🔒 Step 5: Advanced (Optional) Security Tweaks

If you wish to prevent other websites from hotlinking your widget inside an iframe, you can configure your Next.js application's frame protection header to only allow your domain.
For most standard applications, leaving it open allows the chat widget to scale to multiple micro-sites or landing pages easily!
