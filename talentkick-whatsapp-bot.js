const express = require("express");
const app = express();
app.use(express.json());

const ACCESS_TOKEN    = "EAANds37PrHwBRU6dhMMIytIWqIWZBOFsFuMGE6I7HbXPHNn9FkC0OE24YwnT1q1tu6skDriP6XetSNEZCtoDeClm9QHcC2cL21LqLtFnvqHZBch4MpsNCoj9fGKP6ANZAre4R9mtNSlNYlFEn4uXbVIxE5ZCJIMlwo9j9qh7l6ZArxsvBQQBEUlxVJIKEZB5bLBgtK3Ej4uGNdTTrH4TrHtROJ9JK4WBs326WPZBHcP4jvoLO2nnXlJKOYaZCqJFLw4X0OJnSvT74FK8baffdq83Ag6TOseJW6Rl8uMYR5wZDZD";
const PHONE_NUMBER_ID = "1115185408338275";
const VERIFY_TOKEN    = "talentkick_webhook_2024";
const API_URL         = "https://graph.facebook.com/v19.0/" + PHONE_NUMBER_ID + "/messages";
const HANDOFF_MS      = 72 * 60 * 60 * 1000;
const INTEREST_LIST   = "https://forms.monday.com/forms/712378ebd14956e786905256fcd55720?r=use1";
const LINKEDIN        = "https://www.linkedin.com/company/talentkick";

const handedOffToTeam = new Map();
const waitingToAsk    = new Set();
const lastSubMenu     = new Map();
const hasSeenIntro    = new Set();

// Multi-step conversation state
// state: { step, data: {} }
const convState = new Map();

const GREETINGS = ["hi", "hello", "hallo", "hey", "hola", "bonjour", "ciao", "start", "apply", "menu"];

function isHandedOff(from) {
  if (!handedOffToTeam.has(from)) return false;
  if (Date.now() - handedOffToTeam.get(from) > HANDOFF_MS) {
    handedOffToTeam.delete(from);
    waitingToAsk.delete(from);
    return false;
  }
  return true;
}

function clearState(from) {
  handedOffToTeam.delete(from);
  waitingToAsk.delete(from);
  hasSeenIntro.delete(from);
  convState.delete(from);
}

async function sendMessage(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Authorization": "Bearer " + ACCESS_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) console.error("Send error:", JSON.stringify(data));
  return data;
}

async function sendText(to, text) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual",
    to: to, type: "text", text: { body: text }
  });
}

async function sendBackButton(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Was this helpful? What would you like to do next? \ud83d\ude0a" },
      action: { buttons: [
        { type: "reply", reply: { id: "back_menu",    title: "\u21a9\ufe0f Back to menu" } },
        { type: "reply", reply: { id: "found_answer", title: "\u2705 Found my answer!" } },
      ]}
    }
  });
}

async function sendOtherButtons(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Our team is here for you! \ud83d\udc9b What would you like to do?" },
      action: { buttons: [
        { type: "reply", reply: { id: "ask_team",     title: "\ud83d\udc9b Ask our team" } },
        { type: "reply", reply: { id: "back_menu",    title: "\u21a9\ufe0f Back to menu" } },
        { type: "reply", reply: { id: "found_answer", title: "\u2705 Found my answer!" } },
      ]}
    }
  });
}

async function sendIntro(to) {
  hasSeenIntro.add(to);
  await sendText(to,
    "\ud83d\ude80 *Welcome to Talent Kick!*\n\n" +
    "Hey! \ud83d\udc4b Big things start with one message.\n\n" +
    "We\u2019re Switzerland\u2019s leading cross-university entrepreneurship programme \u2014 finding the most driven Master\u2019s & PhD students and turning them into the founders of tomorrow \u2728\n\n" +
    "We bring exceptional talents together across disciplines and universities \u2014 to form interdisciplinary co-founder teams, validate real startup ideas, and take their first bold steps into entrepreneurship. All while still studying.\n\n" +
    "Our alumni are already building and making real impact in the world \ud83c\udf0d And it all starts here \ud83d\udc47"
  );
  setTimeout(function() { sendWhoAreYouMenu(to); }, 1500);
}

async function sendWhoAreYouMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Tell us about yourself! \ud83d\ude0a" },
      body: { text: "We\u2019d love to know who you are so we can guide you in the right direction \ud83c\udfaf" },
      footer: { text: "talentkick.ch" },
      action: { button: "Who are you?", sections: [{ title: "I am a...", rows: [
        { id: "menu_applicant", title: "\ud83c\udf93 Aspiring founder",    description: "Thinking about applying to TK" },
        { id: "menu_batch",     title: "\u26a1 TK Participant",            description: "Already on the journey" },
        { id: "menu_collab",    title: "\ud83e\udd1d Collaborator",        description: "Partner, mentor or organisation" },
        { id: "menu_external",  title: "\ud83d\udd0d Just exploring",      description: "Curious about what TK is" },
      ]}]}
    }
  });
}

async function sendApplicantMenu(to) {
  lastSubMenu.set(to, sendApplicantMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "\ud83c\udf93 Your TK Journey Starts Here" },
      body: { text: "Amazing \u2014 you\u2019re in the right place! \ud83d\ude80\n\nWhat would you like to know?" },
      footer: { text: "talentkick.ch/apply" },
      action: { button: "Explore", sections: [{ title: "I want to know about...", rows: [
        { id: "app_apply",     title: "\ud83d\udce2 Apply to TK-S26",      description: "Open now \u2014 don\u2019t miss it!" },
        { id: "app_eligible",  title: "\u2705 Am I eligible?",             description: "Check your requirements" },
        { id: "app_programme", title: "\ud83c\udf93 How does TK work?",    description: "Programme + funding explained" },
        { id: "app_qa",        title: "\ud83d\udcde Book a free Q&A",      description: "Talk to our team directly" },
        { id: "app_other",     title: "\ud83d\udcac Something else",       description: "Any other question" },
      ]}]}
    }
  });
}

async function sendBatchMenu(to) {
  lastSubMenu.set(to, sendBatchMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "\u26a1 Keep Building!" },
      body: { text: "Great to hear from you! \ud83d\ude4c\n\nHow can we support your journey today?" },
      footer: { text: "talentkick.ch" },
      action: { button: "Get support", sections: [{ title: "I need help with...", rows: [
        { id: "batch_schedule",   title: "\ud83d\uddd3\ufe0f Schedule & materials",  description: "Events, links & resources" },
        { id: "batch_milestones", title: "\ud83c\udfc6 Milestones & coaching",       description: "Deadlines & 1:1 sessions" },
        { id: "batch_support",    title: "\ud83d\udee0\ufe0f I need support",         description: "Issues & help" },
        { id: "batch_other",      title: "\ud83d\udcac Something else",              description: "Any other question" },
      ]}]}
    }
  });
}

async function sendCollabMenu(to) {
  lastSubMenu.set(to, sendCollabMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "\ud83e\udd1d Let\u2019s Build Together!" },
      body: { text: "Excited to connect! \ud83d\udcab\n\nHow would you like to get involved?" },
      footer: { text: "talentkick.ch" },
      action: { button: "Get involved", sections: [{ title: "I am...", rows: [
        { id: "collab_existing", title: "\ud83c\udf31 Already a partner/mentor",   description: "Existing TK collaborator" },
        { id: "collab_join",     title: "\ud83d\udca1 Interested in joining",      description: "Want to partner or mentor" },
        { id: "collab_other",    title: "\ud83d\udcac Something else",             description: "Any other question" },
      ]}]}
    }
  });
}

async function sendExternalMenu(to) {
  lastSubMenu.set(to, sendExternalMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "\ud83d\udd0d Discover Talent Kick" },
      body: { text: "Happy to tell you more! \u2728\n\nWhat are you curious about?" },
      footer: { text: "talentkick.ch" },
      action: { button: "Explore", sections: [{ title: "I want to know about...", rows: [
        { id: "ext_about",  title: "\ud83d\ude80 About TK & the programme",   description: "Who we are & what we do" },
        { id: "ext_media",  title: "\ud83d\udcf0 Media & Press",              description: "Press enquiries" },
        { id: "ext_other",  title: "\ud83d\udcac Something else",             description: "Any other question" },
      ]}]}
    }
  });
}

// ─── MULTI-STEP FLOWS ────────────────────────────────────────────────

// ELIGIBILITY FLOW
async function startEligibilityFlow(to) {
  convState.set(to, { flow: "eligibility", step: 1, data: {} });
  await sendText(to,
    "\u2705 *Let\u2019s check your eligibility!* \ud83d\ude80\n\n" +
    "Just a few quick questions.\n\n" +
    "*1\ufe0f\u20e3 Which university or UAS are you currently enrolled at?*"
  );
}

// COLLAB EXISTING FLOW
async function startCollabExistingFlow(to) {
  convState.set(to, { flow: "collab_existing", step: 1, data: {} });
  await sendText(to,
    "\ud83c\udf31 *Great to hear from an existing TK collaborator!* \ud83d\ude4c\n\n" +
    "Let us get a few details so our team can follow up with you personally.\n\n" +
    "*1\ufe0f\u20e3 What is your name?*"
  );
}

// COLLAB JOIN FLOW
async function startCollabJoinFlow(to) {
  convState.set(to, { flow: "collab_join", step: 1, data: {} });
  await sendText(to,
    "\ud83d\udca1 *Amazing \u2014 we love meeting new collaborators!* \ud83d\ude80\n\n" +
    "Let us get a few details so our team can reach out to you personally.\n\n" +
    "*1\ufe0f\u20e3 What is your name?*"
  );
}

async function handleConvFlow(from, text) {
  const state = convState.get(from);
  if (!state) return false;

  const flow = state.flow;
  const step = state.step;

  // ── ELIGIBILITY ──────────────────────────────────────────────────
  if (flow === "eligibility") {
    if (step === 1) {
      state.data.university = text;
      state.step = 2;
      await sendText(from,
        "*2\ufe0f\u20e3 What is your current student level?*\n\n" +
        "Reply with one of the following:\n" +
        "- Bachelor\n- Master\n- PhD"
      );
      return true;
    }
    if (step === 2) {
      state.data.level = text;
      state.step = 3;
      await sendText(from,
        "*3\ufe0f\u20e3 How many semesters do you have left in your studies?*\n\n" +
        "(Just type a number, e.g. 3)"
      );
      return true;
    }
    if (step === 3) {
      state.data.semesters = text;
      convState.delete(from);
      const d = state.data;
      const semNum = parseInt(d.semesters) || 0;
      const isMasterPhD = d.level.toLowerCase().includes("master") || d.level.toLowerCase().includes("phd") || d.level.toLowerCase().includes("doctor");
      const hasEnough = semNum >= 2;

      if (!isMasterPhD) {
        await sendText(from,
          "\u2705 *Your Eligibility Results*\n\n" +
          "Thanks for sharing, " + d.university + " student! \ud83d\ude4c\n\n" +
          "Talent Kick is currently designed for *Master\u2019s and PhD students*.\n\n" +
          "Unfortunately Bachelor students are not eligible for our current programme.\n\n" +
          "But don\u2019t worry \u2014 you can join our *interest list* to be notified when this changes or when new opportunities open up! \ud83d\udc47\n\n" +
          "\ud83d\udcdd Join the interest list: " + INTEREST_LIST + "\n\n" +
          "Follow our journey on LinkedIn: " + LINKEDIN
        );
      } else if (!hasEnough) {
        await sendText(from,
          "\u2705 *Your Eligibility Results*\n\n" +
          "Thanks " + d.university + " " + d.level + " student! \ud83d\ude4c\n\n" +
          "Talent Kick requires at least *2 semesters remaining* from the programme start.\n\n" +
          "With " + d.semesters + " semester(s) left it might be tight \u2014 but we\u2019d love to keep you in the loop for future cohorts!\n\n" +
          "\ud83d\udcdd Join the interest list: " + INTEREST_LIST + "\n\n" +
          "Follow our journey on LinkedIn: " + LINKEDIN
        );
      } else {
        await sendText(from,
          "\u2705 *Your Eligibility Results*\n\n" +
          "Great news! \ud83c\udf89\n\n" +
          "Based on what you\u2019ve shared:\n" +
          "\ud83c\udf93 University: " + d.university + "\n" +
          "\ud83d\udcda Level: " + d.level + "\n" +
          "\u23f0 Semesters left: " + d.semesters + "\n\n" +
          "You *look eligible* for Talent Kick! \ud83d\ude80\n\n" +
          "The programme runs 1\u20134 semesters and is designed to fit alongside your studies. You could potentially extend up to " + Math.min(semNum, 4) + " semesters with us.\n\n" +
          "Next step \u2014 apply now or book a free Q&A with our team!\n\n" +
          "\ud83d\udc49 Apply: www.talentkick.ch/apply\n" +
          "\ud83d\udcde Book Q&A: calendly.com/gabriela-talentkick/tk-s26-q-a-with-talent-kick\n\n" +
          "\ud83d\udcdd Also join our interest list to stay updated: " + INTEREST_LIST
        );
      }
      setTimeout(function() { sendBackButton(from); }, 1000);
      return true;
    }
  }

  // ── COLLAB EXISTING ──────────────────────────────────────────────
  if (flow === "collab_existing") {
    if (step === 1) {
      state.data.name = text;
      state.step = 2;
      await sendText(from, "*2\ufe0f\u20e3 What is your email address?*");
      return true;
    }
    if (step === 2) {
      state.data.email = text;
      state.step = 3;
      await sendText(from, "*3\ufe0f\u20e3 What is your organisation or university?*");
      return true;
    }
    if (step === 3) {
      state.data.org = text;
      state.step = 4;
      await sendText(from, "*4\ufe0f\u20e3 What is your field or area of work?*");
      return true;
    }
    if (step === 4) {
      state.data.field = text;
      convState.delete(from);
      const d = state.data;
      await sendText(from,
        "\ud83c\udf31 *Thanks " + d.name + "!* \ud83d\ude4c\n\n" +
        "Our team will be in touch with you very soon at *" + d.email + "*\n\n" +
        "In the meantime, let\u2019s connect on LinkedIn! \ud83d\udc49 " + LINKEDIN + "\n\n" +
        "Excited to keep building together! \ud83d\ude80"
      );
      await sendText(from,
        "\ud83d\udce5 *New Collaborator Enquiry*\n\n" +
        "Name: " + d.name + "\n" +
        "Email: " + d.email + "\n" +
        "Organisation: " + d.org + "\n" +
        "Field: " + d.field + "\n" +
        "Type: Existing collaborator\n" +
        "WhatsApp: " + from
      );
      setTimeout(function() { sendBackButton(from); }, 1000);
      return true;
    }
  }

  // ── COLLAB JOIN ──────────────────────────────────────────────────
  if (flow === "collab_join") {
    if (step === 1) {
      state.data.name = text;
      state.step = 2;
      await sendText(from, "*2\ufe0f\u20e3 What is your email address?*");
      return true;
    }
    if (step === 2) {
      state.data.email = text;
      state.step = 3;
      await sendText(from, "*3\ufe0f\u20e3 What is your organisation or university?*");
      return true;
    }
    if (step === 3) {
      state.data.org = text;
      state.step = 4;
      await sendText(from, "*4\ufe0f\u20e3 What is your field or area of work?*");
      return true;
    }
    if (step === 4) {
      state.data.field = text;
      convState.delete(from);
      const d = state.data;
      await sendText(from,
        "\ud83d\udca1 *Thanks " + d.name + "! So excited to connect!* \ud83d\ude80\n\n" +
        "Our team will reach out to you personally at *" + d.email + "* very soon.\n\n" +
        "In the meantime, let\u2019s connect on LinkedIn! \ud83d\udc49 " + LINKEDIN + "\n\n" +
        "Big things are built together \u2014 can\u2019t wait! \ud83d\udc4b"
      );
      await sendText(from,
        "\ud83d\udce5 *New Collaborator Enquiry*\n\n" +
        "Name: " + d.name + "\n" +
        "Email: " + d.email + "\n" +
        "Organisation: " + d.org + "\n" +
        "Field: " + d.field + "\n" +
        "Type: Interested in joining\n" +
        "WhatsApp: " + from
      );
      setTimeout(function() { sendBackButton(from); }, 1000);
      return true;
    }
  }

  // ── ASK TEAM FLOW ────────────────────────────────────────────────
  if (flow === "ask_team") {
    convState.delete(from);
    handedOffToTeam.set(from, Date.now());
    await sendText(from,
      "Got it! Our team will get back to you personally very soon \ud83d\udc9b\n\n" +
      "In the meantime feel free to explore: www.talentkick.ch"
    );
    return true;
  }

  return false;
}

const ANSWERS = {
  app_apply:
    "\ud83d\udce2 *Apply to TK-S26*\n\n" +
    "This is your moment! \ud83d\ude80\n\n" +
    "The application portal for *TK-S26* is now open \u2014 our next cohort of Switzerland\u2019s most driven student founders.\n\n" +
    "How to apply:\n" +
    "1\ufe0f\u20e3 Visit our application page\n" +
    "2\ufe0f\u20e3 Fill in the online form\n" +
    "3\ufe0f\u20e3 Submit before the deadline\n" +
    "4\ufe0f\u20e3 We review & invite selected candidates\n" +
    "5\ufe0f\u20e3 Receive your decision by email \u2705\n\n" +
    "Spots are highly selective \u2014 don\u2019t wait!\n\n" +
    "\ud83d\udc49 Apply now: www.talentkick.ch/apply\n\n" +
    "\ud83d\udcdd Stay in the loop: " + INTEREST_LIST,

  app_programme:
    "\ud83c\udf93 *How Does TK Work?*\n\n" +
    "A *highly selective, 1\u20134 semester programme* that turns exceptional students into founders \u2728\n\n" +
    "*Your journey:*\n" +
    "\ud83e\udd1d Find your interdisciplinary co-founder team\n" +
    "\ud83e\uddd1\u200d\ud83d\udcbc 5 personal 1:1 coaching sessions\n" +
    "\ud83d\udca1 Validate a real startup idea alongside your studies\n" +
    "\ud83c\udf0d Deep connections into the Swiss startup ecosystem\n\n" +
    "*Semester 1:* Bootcamps, workshops & team-building\n" +
    "*Semesters 2\u20134:* You\u2019re in the driving seat\n\n" +
    "*Funding:*\n" +
    "Hit your milestones \u2192 *CHF 5,000 Team Kick Award* \ud83c\udf89\n" +
    "Top teams unlock: Venture Kick, ETH Pioneer Fellowship, Innosuisse & more\n\n" +
    "Fully *free* \u2014 valued at CHF 20,000 per student!\n\n" +
    "\ud83d\udc49 www.talentkick.ch/program\n\n" +
    "\ud83d\udcdd Join our interest list: " + INTEREST_LIST,

  app_qa:
    "\ud83d\udcde *Book a Free Q&A Session*\n\n" +
    "Still figuring out if TK is the right fit? Let\u2019s talk! \ud83d\ude0a\n\n" +
    "\u23f1\ufe0f 20\u201330 minutes\n" +
    "\ud83d\udcac Video call or WhatsApp call\n" +
    "\ud83d\uddd3\ufe0f Mon\u2013Fri \u2014 check Calendly for slots\n\n" +
    "\ud83d\udc49 calendly.com/gabriela-talentkick/tk-s26-q-a-with-talent-kick\n\n" +
    "\ud83d\udcdd Also join our interest list: " + INTEREST_LIST,

  app_other:
    "\ud83d\udcac *Something Else?*\n\n" +
    "No worries \u2014 our team is happy to help! \ud83d\ude4c\n\n" +
    "\ud83d\udce7 Email: info@talentkick.ch\n" +
    "\ud83d\udcac Or simply reply to this message\n\n" +
    "We usually respond within a few hours \u26a1\n\n" +
    "\ud83d\udcdd Stay in the loop: " + INTEREST_LIST,

  batch_schedule:
    "\ud83d\uddd3\ufe0f *Schedule, Events & Materials*\n\n" +
    "All session links, bootcamp dates, event schedules and materials are shared in your *cohort WhatsApp group* and via email \ud83d\udccc\n\n" +
    "Can\u2019t find something? Reply here or ask in your cohort group \u2014 we\u2019ve got you! \ud83d\ude4c\n\n" +
    "\ud83d\udc49 www.talentkick.ch/program",

  batch_milestones:
    "\ud83c\udfc6 *Milestones & Coaching*\n\n" +
    "*Semester 1 \u2014 Two key milestones:*\n" +
    "\ud83d\udd25 Milestone 1: Form a stable, interdisciplinary co-founder team\n" +
    "\ud83d\udd25 Milestone 2: Convince a successful entrepreneur as your mentor\n\n" +
    "Nail both \u2192 *CHF 5,000 Team Kick Award* & unlock Semesters 2\u20134! \ud83c\udf89\n\n" +
    "*Coaching:* 5 personal 1:1 sessions focusing on leading yourself, leading others & leading change.\n\n" +
    "To schedule, contact your coach directly.\n" +
    "\ud83d\udce7 info@talentkick.ch",

  batch_support:
    "\ud83d\udee0\ufe0f *I Need Support*\n\n" +
    "We\u2019re here for you! \ud83d\ude4c\n\n" +
    "\ud83d\udd27 Technical issues \u2192 email info@talentkick.ch with a screenshot\n" +
    "\ud83d\udcc5 Scheduling issues \u2192 contact your coach directly\n" +
    "\u2753 Programme questions \u2192 reply to this message\n\n" +
    "We usually respond within a few hours \u26a1\n\n" +
    "\ud83d\udce7 info@talentkick.ch",

  batch_other:
    "\ud83d\udcac *Something Else?*\n\n" +
    "We\u2019ve got you! \ud83d\ude4c\n\n" +
    "\ud83d\udce7 Email: info@talentkick.ch\n" +
    "\ud83d\udcac Reply to this message\n" +
    "\ud83d\udccc Or post in your cohort WhatsApp group\n\n" +
    "\ud83d\udd50 Mon\u2013Fri, 9AM\u20136PM CET",

  collab_other:
    "\ud83d\udcac *Something Else?*\n\n" +
    "No problem at all \u2014 our team is happy to help! \ud83d\ude4c\n\n" +
    "\ud83d\udce7 Email: info@talentkick.ch\n" +
    "\ud83d\udcbc LinkedIn: " + LINKEDIN + "\n" +
    "\ud83d\udcac Or reply to this message\n\n" +
    "We usually respond within a few hours \u26a1",

  ext_about:
    "\ud83d\ude80 *About Talent Kick & the Programme*\n\n" +
    "Talent Kick is Switzerland\u2019s leading cross-university entrepreneurship programme \ud83c\udde8\ud83c\udded\n\n" +
    "Our mission: bring exceptional student talents together in interdisciplinary teams and translate academic excellence into real-world entrepreneurial impact \ud83c\udf0e\n\n" +
    "*What we offer:*\n" +
    "\ud83e\udd1d Find your interdisciplinary co-founder team\n" +
    "\ud83e\uddd1\u200d\ud83d\udcbc Personal 1:1 coaching\n" +
    "\ud83d\udcb0 CHF 5,000 Team Kick Award\n" +
    "\ud83c\udfc6 Access to Venture Kick, ETH Pioneer Fellowship, Innosuisse & more\n" +
    "Fully *free* \u2014 valued at CHF 20,000!\n\n" +
    "An initiative of the *Kick Foundation*.\n\n" +
    "\ud83d\udc49 www.talentkick.ch\n" +
    "\ud83d\udcbc LinkedIn: " + LINKEDIN,

  ext_media:
    "\ud83d\udcf0 *Media & Press Enquiries*\n\n" +
    "\ud83d\udce7 Press contact: info@talentkick.ch\n\n" +
    "We are happy to:\n" +
    "\u2705 Provide quotes & statements\n" +
    "\u2705 Arrange interviews\n" +
    "\u2705 Share press kit & images\n\n" +
    "We respond within 24 hours.\n\n" +
    "\ud83d\udcbc LinkedIn: " + LINKEDIN,

  ext_other:
    "\ud83d\udcac *Something Else?*\n\n" +
    "We\u2019d love to hear from you! \ud83d\ude4c\n\n" +
    "\ud83d\udce7 Email: info@talentkick.ch\n" +
    "\ud83c\udf0d Website: www.talentkick.ch\n" +
    "\ud83d\udcbc LinkedIn: " + LINKEDIN + "\n\n" +
    "We respond within a few business days \ud83d\ude0a",
};

const OTHER_IDS = ["app_other","batch_other","collab_other","ext_other"];

async function handleIncoming(message) {
  const from = message.from;
  const type = message.type;

  // ── Handle multi-step conversation flows ──────────────────────────
  if (type === "text") {
    const body = (message.text && message.text.body ? message.text.body.trim() : "");
    const bodyLower = body.toLowerCase();
    const isGreeting = GREETINGS.some(function(g) { return bodyLower.includes(g); });

    // Greeting resets everything
    if (isGreeting) {
      clearState(from);
      await sendIntro(from);
      return;
    }

    // If in a conv flow, handle it
    if (convState.has(from)) {
      await handleConvFlow(from, body);
      return;
    }

    // If waiting to ask team
    if (waitingToAsk.has(from)) {
      convState.set(from, { flow: "ask_team", step: 1, data: {} });
      await handleConvFlow(from, body);
      return;
    }

    // If handed off — silent
    if (isHandedOff(from)) return;

    // Otherwise show menu
    if (!hasSeenIntro.has(from)) {
      await sendIntro(from);
    } else {
      await sendWhoAreYouMenu(from);
    }
    return;
  }

  // ── If handed off but they tap a list → reactivate ────────────────
  if (type === "interactive" && message.interactive && message.interactive.type === "list_reply") {
    // List selection always works even if handed off
    handedOffToTeam.delete(from);
    waitingToAsk.delete(from);
    convState.delete(from);

    const id = message.interactive.list_reply.id;
    if (id === "menu_applicant") return sendApplicantMenu(from);
    if (id === "menu_batch")     return sendBatchMenu(from);
    if (id === "menu_collab")    return sendCollabMenu(from);
    if (id === "menu_external")  return sendExternalMenu(from);

    // Special flows
    if (id === "app_eligible")      return startEligibilityFlow(from);
    if (id === "collab_existing")   return startCollabExistingFlow(from);
    if (id === "collab_join")       return startCollabJoinFlow(from);

    if (ANSWERS[id]) {
      await sendText(from, ANSWERS[id]);
      const isOther = OTHER_IDS.indexOf(id) !== -1;
      setTimeout(function() { isOther ? sendOtherButtons(from) : sendBackButton(from); }, 1000);
      return;
    }
  }

  // ── Button replies ─────────────────────────────────────────────────
  if (type === "interactive" && message.interactive && message.interactive.type === "button_reply") {
    const buttonId = message.interactive.button_reply.id;

    if (buttonId === "ask_team") {
      waitingToAsk.add(from);
      await sendText(from,
        "Of course! \ud83d\ude0a Go ahead and type your question and our team will get back to you personally \ud83d\udc9b"
      );
      return;
    }
    if (buttonId === "back_menu") {
      convState.delete(from);
      const subMenu = lastSubMenu.get(from);
      if (subMenu) return subMenu(from);
      return sendWhoAreYouMenu(from);
    }
    if (buttonId === "found_answer") {
      await sendText(from,
        "That is amazing! \ud83c\udf89 So glad we could help!\n\n" +
        "Feel free to reach out anytime \u2014 we are always here for you \ud83d\udc9b\n\n" +
        "Stay inspired and keep building! \ud83d\ude80\n" +
        "www.talentkick.ch"
      );
      return;
    }
  }

  // ── Fallback ───────────────────────────────────────────────────────
  if (!hasSeenIntro.has(from)) {
    await sendIntro(from);
  } else {
    await sendWhoAreYouMenu(from);
  }
}

app.get("/webhook", function(req, res) {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async function(req, res) {
  res.sendStatus(200);
  try {
    const messages = req.body && req.body.entry && req.body.entry[0] &&
      req.body.entry[0].changes && req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value && req.body.entry[0].changes[0].value.messages;
    if (!messages || messages.length === 0) return;
    for (var i = 0; i < messages.length; i++) {
      console.log("Incoming:", JSON.stringify(messages[i]));
      await handleIncoming(messages[i]);
    }
  } catch (err) {
    console.error("Error:", err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log("Talent Kick Bot running on port " + PORT); });
