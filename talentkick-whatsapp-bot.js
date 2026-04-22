/**
 * Talent Kick — WhatsApp Interactive List Bot
 * 
 * HOW TO RUN:
 * 1. npm install express
 * 2. Fill in your credentials below
 * 3. node talentkick-whatsapp-bot.js
 * 4. Expose with: npx localtunnel --port 3000
 * 5. Set your webhook URL in Meta Developer Dashboard
 */

const express = require("express");
const app = express();
app.use(express.json());

// ─── YOUR CREDENTIALS ──────────────────────────────────────────────
const ACCESS_TOKEN   = "EAANds37PrHwBRaQbCBXb3f6I6sH2cHRqPl6nXJOhZAl1BWLYHbJoEphKMExXxdxZAZAe1uyz61CuOsgsf77xl27edyoZCrFmSzokNXZANHE001z9ZCBojiCiBIE04UVUuLZAiPvtnxh7YjJBsL99AAPRwlbUPD2fmjvq7n8cDMpjEIMviEu8s3YMmUjZBYWJN9eJjX2MG0RmQ4F7jnnLGizKrCMfZAleFtGRzWWcZCL1XziAsjLFDxOTcuAj9Edo0e1b9cAS8ugPcgo1BhSVtiKKF4VtbYg8tTLw8TItqy6XoZD";
const PHONE_NUMBER_ID = "1072262365971856";
const VERIFY_TOKEN   = "talentkick_webhook_2024";      // You choose this — paste same in Meta dashboard
// ───────────────────────────────────────────────────────────────────

const API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

// ─── SEND A MESSAGE ─────────────────────────────────────────────────
async function sendMessage(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) console.error("Send error:", JSON.stringify(data));
  return data;
}

// ─── SEND MAIN MENU (Interactive List) ──────────────────────────────
async function sendMainMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "Talent Kick 🎓",
      },
      body: {
        text: "Hi! Welcome to Talent Kick 👋\n\nHow can we help you today? Please select who you are:",
      },
      footer: {
        text: "talentkick.ch",
      },
      action: {
        button: "See options",
        sections: [
          {
            title: "Who are you?",
            rows: [
              { id: "menu_applicant", title: "👤 Applicant",        description: "Interested in joining TK" },
              { id: "menu_batch",     title: "🎓 Batch Member",      description: "Currently enrolled" },
              { id: "menu_partner",   title: "🤝 Partner",           description: "Organisation or collaborator" },
              { id: "menu_external",  title: "🌍 General Enquiry",   description: "Press, public or other" },
            ],
          },
        ],
      },
    },
  });
}

// ─── SEND APPLICANT MENU ────────────────────────────────────────────
async function sendApplicantMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "👤 Applicant Topics" },
      body: { text: "What would you like to know? Select a topic below." },
      footer: { text: "talentkick.ch/apply" },
      action: {
        button: "Choose topic",
        sections: [
          {
            title: "Applicant Topics",
            rows: [
              { id: "app_calls",       title: "📢 Application Calls",    description: "Current open calls" },
              { id: "app_eligibility", title: "✅ Eligibility",           description: "Requirements to join" },
              { id: "app_how",         title: "📝 How to Apply",          description: "Step-by-step guide" },
              { id: "app_dates",       title: "📅 Start Dates",           description: "Programme schedule" },
              { id: "app_qa",          title: "📞 Book a Q&A",            description: "Free call with our team" },
              { id: "app_faq",         title: "❓ FAQ",                   description: "Common questions" },
              { id: "app_other",       title: "💬 Other",                 description: "Something else" },
            ],
          },
        ],
      },
    },
  });
}

// ─── SEND BATCH MENU ────────────────────────────────────────────────
async function sendBatchMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🎓 Batch Member Topics" },
      body: { text: "What do you need help with today?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "Choose topic",
        sections: [
          {
            title: "Batch Member Topics",
            rows: [
              { id: "batch_timetable", title: "🗓️ Timetable & Links",    description: "Session schedule" },
              { id: "batch_deadlines", title: "📋 Deadlines",             description: "Assignment due dates" },
              { id: "batch_materials", title: "📚 Materials",             description: "Resources & recordings" },
              { id: "batch_support",   title: "🛠️ Technical Support",    description: "Issues & help" },
              { id: "batch_other",     title: "💬 Other",                 description: "Something else" },
            ],
          },
        ],
      },
    },
  });
}

// ─── SEND PARTNER MENU ──────────────────────────────────────────────
async function sendPartnerMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🤝 Partner Topics" },
      body: { text: "How can we help you today?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "Choose topic",
        sections: [
          {
            title: "Partner Topics",
            rows: [
              { id: "partner_opps",    title: "🌱 Partnerships",          description: "Collaboration opportunities" },
              { id: "partner_collab",  title: "🤲 Collaborate",           description: "Events, workshops, content" },
              { id: "partner_invoice", title: "🧾 Invoicing",             description: "Payments & finance" },
              { id: "partner_contact", title: "📬 Contact TK Team",       description: "Reach the right person" },
            ],
          },
        ],
      },
    },
  });
}

// ─── SEND EXTERNAL MENU ─────────────────────────────────────────────
async function sendExternalMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🌍 General Enquiries" },
      body: { text: "What would you like to know about Talent Kick?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "Choose topic",
        sections: [
          {
            title: "General Topics",
            rows: [
              { id: "ext_about",   title: "🏫 About Talent Kick",  description: "Who we are" },
              { id: "ext_offer",   title: "🎯 What We Offer",      description: "Our programmes" },
              { id: "ext_media",   title: "📰 Media & Press",      description: "Press enquiries" },
              { id: "ext_contact", title: "📬 Contact Us",         description: "Get in touch" },
            ],
          },
        ],
      },
    },
  });
}

// ─── SEND TEXT REPLY ────────────────────────────────────────────────
async function sendText(to, text) {
  return sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text },
  });
}

// ─── ANSWER RESPONSES ───────────────────────────────────────────────
const ANSWERS = {
  // APPLICANT
  app_calls: `📢 *Current Application Calls*\n\nOur current open application call:\n\n🔹 *Talent Kick S26*\nFor full details and deadlines visit our programme page.\n\n👉 Apply here: www.talentkick.ch/apply`,

  app_eligibility: `✅ *Requirements & Eligibility*\n\nTo be eligible for Talent Kick you typically need:\n\n✅ Aged 18–30\n✅ Based in Switzerland or eligible remotely\n✅ Motivated and committed to the full programme\n✅ Meeting any programme-specific criteria\n\nNot sure? Book a free Q&A with our team!\n👉 calendly.com/gabriela-talentkick/tk-s26-q-a-with-talent-kick`,

  app_how: `📝 *How to Apply*\n\nApplying is simple!\n\n1️⃣ Check eligibility criteria\n2️⃣ Visit our application page\n3️⃣ Fill in the online form\n4️⃣ Submit supporting documents\n5️⃣ Wait for our review (a few days)\n6️⃣ Receive your decision via email & WhatsApp ✅\n\n👉 www.talentkick.ch/apply`,

  app_dates: `📅 *Start Dates & Schedule*\n\nFor all upcoming programme start dates visit our programme page — always kept up to date!\n\n👉 www.talentkick.ch/program`,

  app_qa: `📞 *Book a Free Q&A Session*\n\nNot sure if Talent Kick is right for you? Book a free 1-on-1 Q&A call with our team!\n\n🗓️ Mon–Fri — check Calendly for available slots\n⏱️ 20–30 minutes\n💬 Video call or WhatsApp call\n\n👉 calendly.com/gabriela-talentkick/tk-s26-q-a-with-talent-kick`,

  app_faq: `❓ *FAQ Page*\n\nOur FAQ page is coming soon!\n\nIn the meantime our team is happy to answer any questions directly:\n\n📧 info@talentkick.ch\n💬 Or reply to this message\n\n👉 www.talentkick.ch/program`,

  app_other: `💬 *Other Enquiry*\n\nNo problem! Our team is happy to help with anything not listed.\n\n📧 Email: info@talentkick.ch\n💬 Reply to this message directly\n\nWe usually respond within a few hours during working hours. 🙏`,

  // BATCH
  batch_timetable: `🗓️ *Timetable & Session Links*\n\nYour session links and timetable are always shared in your cohort WhatsApp group 📌\n\nFor the full programme schedule:\n👉 www.talentkick.ch/program`,

  batch_deadlines: `📋 *Assignments & Deadlines*\n\nCurrent assignments and deadlines are shared in your cohort WhatsApp group 📌\n\n⚠️ Late submissions must be flagged to your coach in advance.\n\n📧 Questions? info@talentkick.ch`,

  batch_materials: `📚 *Materials & Resources*\n\nAll course materials are shared in your cohort WhatsApp group and via email 📌\n\nIncludes: slides, notes, session recordings, and reading lists.\n\nCan't find something? Reply to this message or ask in your cohort group! 😊`,

  batch_support: `🛠️ *Support & Technical Issues*\n\n🔧 Common fixes:\n• Can't access materials? → Check your email for the access link\n• Zoom not working? → Try re-installing the app\n• Can't submit? → Screenshot the error and send it to us\n\n📧 info@talentkick.ch\n💬 Or reply to this message\n\nWe'll get back to you within a few hours! ⚡`,

  batch_other: `💬 *Other*\n\nNeed help with something else? We've got you! 🙌\n\n📧 Email: info@talentkick.ch\n💬 Reply to this message\n📌 Or post in your cohort WhatsApp group\n\nAvailable: Mon–Fri, 9AM–6PM CET`,

  // PARTNER
  partner_opps: `🌱 *Partnership Opportunities*\n\nWe collaborate with:\n🏢 Corporates & Employers\n🎓 Universities & Training Bodies\n🌍 NGOs & Social Enterprises\n💡 Mentors & Industry Experts\n\n📧 info@talentkick.ch\n\nWe'll get back to you within 3 business days.\n\n👉 www.talentkick.ch`,

  partner_collab: `🤲 *Collaboration Enquiries*\n\nWe're open to:\n✅ Co-hosted events & workshops\n✅ Guest speaker opportunities\n✅ Joint programmes & bootcamps\n✅ Content & media collaborations\n\n📧 Send your proposal to: info@talentkick.ch\n\nInclude: organisation name, idea, and contact details. We love creative ideas! 🚀`,

  partner_invoice: `🧾 *Invoicing & Payments*\n\n📧 Finance: info@talentkick.ch\n🏦 Bank details: provided on request\n\nPlease include:\n• Organisation name\n• Invoice number\n• PO number (if applicable)\n• Amount & currency\n\nProcessed within a few business days 💳`,

  partner_contact: `📬 *Contact the TK Team*\n\n📧 General: info@talentkick.ch\n🌐 Website: www.talentkick.ch\n📸 Instagram & LinkedIn: @talentkick\n\nWe look forward to working with you! 🙏`,

  // EXTERNAL
  ext_about: `🏫 *About Talent Kick*\n\nTalent Kick is a talent development organisation helping ambitious young people unlock their potential through world-class training, coaching, and mentorship programmes 🚀\n\n📍 Based in: Switzerland 🇨🇭\n🌍 Operating internationally\n📸 Instagram & LinkedIn: @talentkick\n\n👉 www.talentkick.ch`,

  ext_offer: `🎯 *What We Offer*\n\n🎓 Talent Kick Programme — Our flagship talent development programme\n💼 Coaching & Mentorship — 1-on-1 with industry experts\n🌱 Workshops & Events — Skill-building and networking\n🤝 Partner Programmes — Co-created with organisations\n\nDesigned for ambitious young people and early-career professionals.\n\n👉 www.talentkick.ch/program`,

  ext_media: `📰 *Media & Press Enquiries*\n\n📧 Press: info@talentkick.ch\n\nWe're happy to:\n✅ Provide quotes & statements\n✅ Arrange interviews\n✅ Share press kit & images\n✅ Collaborate on stories about youth & talent\n\n📎 Press kit available on request.\nWe respond to media within 24 hours.`,

  ext_contact: `📬 *General Contact*\n\n📧 Email: info@talentkick.ch\n📍 Switzerland 🇨🇭\n📸 Instagram & LinkedIn: @talentkick\n\n👉 www.talentkick.ch\n\nWe respond within a few business days 😊`,
};

// ─── HANDLE INCOMING MESSAGES ────────────────────────────────────────
async function handleIncoming(message) {
  const from = message.from;
  const type = message.type;

  // User sent a text message → show main menu
  if (type === "text") {
    const body = message.text?.body?.toLowerCase().trim() || "";
    // Always send main menu on any text
    await sendMainMenu(from);
    return;
  }

  // User selected from a list
  if (type === "interactive" && message.interactive?.type === "list_reply") {
    const selectedId = message.interactive.list_reply.id;

    // Top-level menu selections → show sub-menu
    if (selectedId === "menu_applicant") return sendApplicantMenu(from);
    if (selectedId === "menu_batch")     return sendBatchMenu(from);
    if (selectedId === "menu_partner")   return sendPartnerMenu(from);
    if (selectedId === "menu_external")  return sendExternalMenu(from);

    // Sub-menu topic selections → send answer
    if (ANSWERS[selectedId]) {
      await sendText(from, ANSWERS[selectedId]);
      // After answering, offer to go back to main menu
      setTimeout(() => {
        sendText(from, "❓ Need anything else? Just reply *menu* to see all options again, or type your question!");
      }, 1000);
      return;
    }
  }

  // Fallback
  await sendMainMenu(from);
}

// ─── WEBHOOK VERIFICATION ────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ─── WEBHOOK RECEIVE ─────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Always acknowledge immediately

  try {
    const entry   = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) return;

    for (const message of messages) {
      console.log("📨 Incoming:", JSON.stringify(message, null, 2));
      await handleIncoming(message);
    }
  } catch (err) {
    console.error("❌ Error handling webhook:", err);
  }
});

// ─── START ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Talent Kick WhatsApp Bot running on port ${PORT}

Next steps:
1. Run: npx localtunnel --port ${PORT}
2. Copy the URL it gives you (e.g. https://xyz.loca.lt)
3. Go to Meta Developer Dashboard → WhatsApp → Configuration
4. Set Webhook URL to: https://xyz.loca.lt/webhook
5. Set Verify Token to: ${VERIFY_TOKEN}
6. Subscribe to: messages
7. Test by texting your WhatsApp number!
  `);
});
