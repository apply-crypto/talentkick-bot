/**
 * Talent Kick — WhatsApp Interactive List Bot
 */

const express = require("express");
const app = express();
app.use(express.json());

// ─── CREDENTIALS ────────────────────────────────────────────────────
const ACCESS_TOKEN    = "EAANds37PrHwBRfP048YN0YRh7oAZBWFO7ZAqS5X47Qp1ePRBcFwzoQVCMirXV6VtTMpwBsZCSDrQlQ0XQCZAztyZBY1e1dAkoZC8FuWzreWJWXla2vqE5jw4ZAVVACZC7jbvEApg6NuioZAqyT6yZA7NNmu11hJNAZBQ9bk0ij3gMy46Y42axODhD0pZB3vDuIQwSxiLTRSiGodFHbJY";
const PHONE_NUMBER_ID = "1072262365971856";
const VERIFY_TOKEN    = "talentkick_webhook_2024";
// ────────────────────────────────────────────────────────────────────

const API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

const HANDOFF_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours

// { phoneNumber: timestamp } — when they were handed off to team
const handedOffToTeam = new Map();
// Set of users who tapped "Ask our team" and we're waiting for their question
const waitingToAsk = new Set();
// { phoneNumber: subMenuFunction } — so back button knows where to go
const lastSubMenu = new Map();

function isHandedOff(from) {
  if (!handedOffToTeam.has(from)) return false;
  const handoffTime = handedOffToTeam.get(from);
  const elapsed = Date.now() - handoffTime;
  if (elapsed > HANDOFF_DURATION_MS) {
    // 72 hours passed — reactivate bot
    handedOffToTeam.delete(from);
    waitingToAsk.delete(from);
    console.log(`🔄 ${from} reactivated after 72h`);
    return false;
  }
  return true;
}

async function sendMessage(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) console.error("Send error:", JSON.stringify(data));
  return data;
}

async function sendText(to, text) {
  return sendMessage({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: text } });
}

// ─── BACK BUTTON ONLY (for regular answers) ──────────────────────────
async function sendBackButton(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Would you like to know anything else?" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "back_menu", title: "↩️ Back to menu" } },
        ]
      }
    }
  });
}

// ─── ASK TEAM + BACK (only for "Other") ──────────────────────────────
async function sendOtherButtons(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Our team is here for you 💛 What would you like to do?" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "ask_team",  title: "💛 Ask our team" } },
          { type: "reply", reply: { id: "back_menu", title: "↩️ Back to menu" } },
        ]
      }
    }
  });
}

// ─── MAIN MENU ───────────────────────────────────────────────────────
async function sendMainMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Talent Kick 🚀" },
      body: { text: "Hi! Welcome to Talent Kick 👋\n\nWe're a highly selective, cross-university entrepreneurship programme in Switzerland.\n\nHow can we help you today?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "See options",
        sections: [{ title: "Who are you?", rows: [
          { id: "menu_applicant", title: "👤 Applicant",           description: "Interested in joining TK" },
          { id: "menu_batch",     title: "🎓 Current Participant",  description: "Already in the programme" },
          { id: "menu_partner",   title: "🤝 Partner",              description: "Organisation or collaborator" },
          { id: "menu_external",  title: "🌍 General Enquiry",      description: "Press, public or other" },
        ]}]
      }
    }
  });
}

// ─── APPLICANT MENU ──────────────────────────────────────────────────
async function sendApplicantMenu(to) {
  lastSubMenu.set(to, sendApplicantMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "👤 Applicant Topics" },
      body: { text: "What would you like to know about applying to Talent Kick?" },
      footer: { text: "talentkick.ch/apply" },
      action: {
        button: "Choose topic",
        sections: [{ title: "Applicant Topics", rows: [
          { id: "app_calls",       title: "📢 Current Calls",       description: "Open application calls" },
          { id: "app_eligibility", title: "✅ Eligibility",           description: "Who can apply?" },
          { id: "app_how",         title: "📝 How to Apply",          description: "Step-by-step process" },
          { id: "app_programme",   title: "🎓 The Programme",         description: "What does TK look like?" },
          { id: "app_funding",     title: "💰 Funding & Support",     description: "CHF 5000 Team Kick award" },
          { id: "app_qa",          title: "📞 Book a Q&A",            description: "Free call with our team" },
          { id: "app_faq",         title: "❓ FAQ",                   description: "Common questions" },
        ]}]
      }
    }
  });
}

// ─── BATCH MENU ──────────────────────────────────────────────────────
async function sendBatchMenu(to) {
  lastSubMenu.set(to, sendBatchMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🎓 Participant Topics" },
      body: { text: "What do you need help with today?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "Choose topic",
        sections: [{ title: "Participant Topics", rows: [
          { id: "batch_timetable", title: "🗓️ Timetable & Links",    description: "Events & session schedule" },
          { id: "batch_deadlines", title: "📋 Milestones",            description: "Key deadlines & submissions" },
          { id: "batch_materials", title: "📚 Materials",             description: "Resources & recordings" },
          { id: "batch_coaching",  title: "🧑‍💼 Coaching",             description: "1:1 coaching sessions" },
          { id: "batch_support",   title: "🛠️ Support",               description: "Issues & help" },
        ]}]
      }
    }
  });
}

// ─── PARTNER MENU ────────────────────────────────────────────────────
async function sendPartnerMenu(to) {
  lastSubMenu.set(to, sendPartnerMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🤝 Partner Topics" },
      body: { text: "How can we help you today?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "Choose topic",
        sections: [{ title: "Partner Topics", rows: [
          { id: "partner_opps",    title: "🌱 Partner With Us",      description: "Collaboration opportunities" },
          { id: "partner_collab",  title: "🤲 Collaborate",           description: "Events, workshops, content" },
          { id: "partner_mentor",  title: "💡 Become a Mentor",       description: "Support our participants" },
          { id: "partner_invoice", title: "🧾 Invoicing",             description: "Payments & finance" },
          { id: "partner_contact", title: "📬 Contact TK Team",       description: "Reach the right person" },
        ]}]
      }
    }
  });
}

// ─── EXTERNAL MENU ───────────────────────────────────────────────────
async function sendExternalMenu(to) {
  lastSubMenu.set(to, sendExternalMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🌍 General Enquiries" },
      body: { text: "What would you like to know about Talent Kick?" },
      footer: { text: "talentkick.ch" },
      action: {
        button: "Choose topic",
        sections: [{ title: "General Topics", rows: [
          { id: "ext_about",   title: "🏫 About Talent Kick",        description: "Who we are & our mission" },
          { id: "ext_offer",   title: "🎯 The Programme",            description: "What we offer" },
          { id: "ext_unis",    title: "🎓 Universities",             description: "Which unis participate?" },
          { id: "ext_media",   title: "📰 Media & Press",            description: "Press enquiries" },
          { id: "ext_contact", title: "📬 Contact Us",               description: "Get in touch" },
        ]}]
      }
    }
  });
}

// ─── ANSWERS ─────────────────────────────────────────────────────────
const ANSWERS = {
  app_calls: `📢 *Current Application Calls*\n\nThe application portal for *TK-S26* is now open! 🎉\n\nThis is our upcoming cohort — a highly selective cross-university programme for Master's and PhD students across Switzerland.\n\nSpots are limited so don't wait too long!\n\n👉 Apply here: www.talentkick.ch/apply`,

  app_eligibility: `✅ *Who Can Apply?*\n\nTalent Kick is open to:\n\n🎓 Master's or PhD students at a Swiss university or University of Applied Sciences\n🌍 Students from any field — technical, business, medical, design and more\n💡 People with an entrepreneurial mindset and curiosity\n🤝 Students willing to commit alongside their studies\n\n*Time commitment:*\nSemester 1: ~2–6 hours per week\nSemesters 2–4: ~6 hours per semester\n\nYou do NOT need a startup idea or prior experience!\n\n👉 www.talentkick.ch/apply`,

  app_how: `📝 *How to Apply*\n\n1️⃣ Visit our application page\n2️⃣ Fill in the online application form\n3️⃣ Submit before the deadline\n4️⃣ Our team reviews your application\n5️⃣ Selected candidates are invited to next steps\n6️⃣ Receive your decision by email ✅\n\nWe look for driven, curious students ready to combine their studies with an entrepreneurial journey.\n\n👉 www.talentkick.ch/apply`,

  app_programme: `🎓 *The Talent Kick Programme*\n\nA *1–4 semester cross-university programme* where you:\n\n🤝 Find an interdisciplinary co-founder team across Swiss universities\n💡 Develop and validate a startup idea alongside your studies\n🧑‍💼 Receive 5 personal 1:1 coaching sessions\n🌐 Build deep connections into the Swiss startup ecosystem\n💰 Receive the CHF 5,000 Team Kick Award upon hitting milestones\n\n*Semester 1:* Bootcamps, workshops, team-building and coaching\n*Semesters 2–4:* You drive your own journey with your team and mentor\n\n👉 www.talentkick.ch/program`,

  app_funding: `💰 *Funding & Support*\n\nOnce your team achieves the two Semester 1 milestones:\n✅ Forming a stable interdisciplinary team\n✅ Convincing a successful entrepreneur as your mentor\n\nYou receive the *Team Kick Award of CHF 5,000* 🎉\n\nTop teams also get access to:\n🏆 Venture Kick\n🔬 ETH Pioneer Fellowship\n🌱 Innosuisse\n🏛️ Foundation FIT, Wyss Zurich, EPFL Blaze, FONGIT...\n\n👉 www.talentkick.ch/program`,

  app_qa: `📞 *Book a Free Q&A Session*\n\nNot sure if Talent Kick is right for you? Book a free 1-on-1 Q&A call with our team!\n\n⏱️ 20–30 minutes\n💬 Video call or WhatsApp call\n🗓️ Mon–Fri — check Calendly for slots\n\n👉 calendly.com/gabriela-talentkick/tk-s26-q-a-with-talent-kick`,

  app_faq: `❓ *Frequently Asked Questions*\n\n*Do I need a startup idea to apply?*\nNo! Just curiosity and drive.\n\n*Do I need to find my own team?*\nNo! TK helps you find co-founders across universities.\n\n*Can I do TK alongside my studies?*\nYes! It's designed to complement your studies.\n\n*Is it free?*\nYes — and you can receive CHF 5,000 in funding!\n\n*Which universities participate?*\nETH Zurich, EPFL, UZH, ZHAW, HSG, FHNW and more.\n\n👉 www.talentkick.ch`,

  batch_timetable: `🗓️ *Timetable & Session Links*\n\nAll session links, bootcamp dates and event schedules are shared in your cohort WhatsApp group and via email 📌\n\nFor the full programme overview:\n👉 www.talentkick.ch/program`,

  batch_deadlines: `📋 *Milestones & Deadlines*\n\n*Semester 1 — Two key milestones:*\n\n🎯 Milestone 1: Form a stable, interdisciplinary co-founder team\n🎯 Milestone 2: Convince a successful entrepreneur as your mentor\n\nOnce achieved → you receive the *CHF 5,000 Team Kick Award* and move to semesters 2–4!\n\nSpecific deadlines are communicated by your coach and in your cohort group.\n\n📧 info@talentkick.ch`,

  batch_materials: `📚 *Materials & Resources*\n\nAll programme materials are shared via:\n📌 Your cohort WhatsApp group\n📧 Email from your coach\n\nIncludes: bootcamp slides, workshop recordings, coaching resources, and ecosystem partner content.\n\nCan't find something? Reply here or ask in your cohort group! 😊`,

  batch_coaching: `🧑‍💼 *1:1 Coaching Sessions*\n\nAs part of TK you receive *5 individual coaching sessions* in Semester 1, continuing through Semesters 2–4.\n\nSessions focus on:\n🧭 Leading yourself\n👥 Leading others\n🔄 Leading change\n\nTo schedule or reschedule, contact your coach directly.\n\n📧 info@talentkick.ch`,

  batch_support: `🛠️ *Support & Issues*\n\n🔧 Technical issues → email info@talentkick.ch with a screenshot\n📅 Scheduling issues → contact your coach directly\n❓ Programme questions → reply to this message\n\nWe usually respond within a few hours during working hours ⚡\n\n📧 info@talentkick.ch`,

  partner_opps: `🌱 *Partner With Talent Kick*\n\nWe partner with:\n🏢 Corporates & Employers\n🎓 Universities & research institutions\n🌍 Foundations & public bodies\n💡 Startup ecosystem organisations\n\nCurrent supporters: Gebert Rüf Foundation, Foundation Botnar, ETH Domain, ETH Foundation.\n\n📧 info@talentkick.ch\n👉 www.talentkick.ch`,

  partner_collab: `🤲 *Collaboration Enquiries*\n\nWe're open to:\n✅ Co-hosted events & workshops\n✅ Guest speaker opportunities\n✅ Joint programmes & challenges\n✅ Content & media collaborations\n\n📧 info@talentkick.ch\n\nInclude your organisation name, idea, and contact details 🚀`,

  partner_mentor: `💡 *Become a Mentor*\n\nMentors are crucial to Talent Kick! Participants must convince a successful entrepreneur to be their mentor as part of Milestone 2.\n\nAs a mentor you:\n🤝 Support an interdisciplinary student team\n💬 Share your entrepreneurial experience\n🌐 Connect them to your network\n\n📧 info@talentkick.ch`,

  partner_invoice: `🧾 *Invoicing & Payments*\n\n📧 Finance: info@talentkick.ch\n🏦 Bank details: provided on request\n\nPlease include:\n• Organisation name\n• Invoice number\n• PO number (if applicable)\n• Amount & currency\n\nProcessed within a few business days 💳`,

  partner_contact: `📬 *Contact the Talent Kick Team*\n\n📧 Email: info@talentkick.ch\n🌐 Website: www.talentkick.ch\n📸 Instagram: @talentkick\n💼 LinkedIn: linkedin.com/company/talentkick\n\nWe look forward to connecting! 🙏`,

  ext_about: `🏫 *About Talent Kick*\n\nTalent Kick is a *highly selective, cross-university entrepreneurship programme* in Switzerland 🇨🇭\n\nOur mission: bring exceptional talents together in interdisciplinary, diverse teams and translate academic excellence into real-world entrepreneurial impact.\n\nAn initiative of the *Kick Foundation*, supported by Gebert Rüf Foundation, Foundation Botnar, ETH Domain and the ETH Foundation.\n\n👉 www.talentkick.ch`,

  ext_offer: `🎯 *What Talent Kick Offers*\n\nA *1–4 semester programme* for Master's & PhD students:\n\n🤝 Find your interdisciplinary co-founder team\n🧑‍💼 Personal 1:1 coaching throughout\n💡 Develop & validate your startup idea\n🌐 Connect to the Swiss startup ecosystem\n💰 CHF 5,000 Team Kick Award\n🏆 Access to Venture Kick, ETH Pioneer Fellowship, Innosuisse & more\n\n👉 www.talentkick.ch/program`,

  ext_unis: `🎓 *Participating Universities*\n\nTalent Kick collaborates with:\n\n🏛️ ETH Zurich\n🏛️ EPFL\n🏛️ University of Zurich (UZH)\n🏛️ ZHAW\n🏛️ University of St. Gallen (HSG)\n🏛️ FHNW\n...and more!\n\nStudents from any field are welcome.\n\n👉 www.talentkick.ch`,

  ext_media: `📰 *Media & Press*\n\n📧 Press contact: info@talentkick.ch\n\nWe're happy to:\n✅ Provide quotes & statements\n✅ Arrange interviews\n✅ Share press kit & images\n✅ Collaborate on stories about Swiss entrepreneurship\n\nWe respond within 24 hours.`,

  ext_contact: `📬 *Get in Touch*\n\n📧 Email: info@talentkick.ch\n🌐 Website: www.talentkick.ch\n📸 Instagram: @talentkick\n💼 LinkedIn: linkedin.com/company/talentkick\n📍 Switzerland 🇨🇭\n\nWe respond within a few business days 😊`,
};

// ─── HANDLE INCOMING ─────────────────────────────────────────────────
async function handleIncoming(message) {
  const from = message.from;
  const type = message.type;

  // Check if handed off — respects 72h timeout
  if (isHandedOff(from)) {
    console.log(`👤 ${from} is with the team — bot silent`);
    return;
  }

  // Waiting to type their question
  if (waitingToAsk.has(from) && type === "text") {
    waitingToAsk.delete(from);
    handedOffToTeam.set(from, Date.now()); // Start 72h timer
    await sendText(from, "Got it! Our team will get back to you personally very soon 💛\n\nIn the meantime, feel free to visit:\n👉 www.talentkick.ch");
    return;
  }

  // Text message → main menu
  if (type === "text") {
    await sendMainMenu(from);
    return;
  }

  // List selection
  if (type === "interactive" && message.interactive?.type === "list_reply") {
    const id = message.interactive.list_reply.id;
    if (id === "menu_applicant") return sendApplicantMenu(from);
    if (id === "menu_batch")     return sendBatchMenu(from);
    if (id === "menu_partner")   return sendPartnerMenu(from);
    if (id === "menu_external")  return sendExternalMenu(from);
    if (ANSWERS[id]) {
      await sendText(from, ANSWERS[id]);
      const isOther = ['app_other','batch_other','partner_other','ext_other'].includes(id);
      setTimeout(() => isOther ? sendOtherButtons(from) : sendBackButton(from), 1000);
      return;
    }
  }

  // Button reply
  if (type === "interactive" && message.interactive?.type === "button_reply") {
    const buttonId = message.interactive.button_reply.id;

    if (buttonId === "ask_team") {
      waitingToAsk.add(from);
      await sendText(from, "Of course! 😊 Go ahead and type your question and our team will get back to you personally 💛");
      return;
    }

    if (buttonId === "back_menu") {
      // Go back to the sub-menu they came from, or main menu
      const subMenu = lastSubMenu.get(from);
      if (subMenu) return subMenu(from);
      return sendMainMenu(from);
    }
  }

  await sendMainMenu(from);
}

// ─── WEBHOOK VERIFY ──────────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
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
  res.sendStatus(200);
  try {
    const messages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return;
    for (const message of messages) {
      console.log("📨 Incoming:", JSON.stringify(message, null, 2));
      await handleIncoming(message);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
});

// ─── START ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Talent Kick Bot running on port ${PORT}`));
