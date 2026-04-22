const express = require("express");
const app = express();
app.use(express.json());

const ACCESS_TOKEN    = "EAANds37PrHwBRfP048YN0YRh7oAZBWFO7ZAqS5X47Qp1ePRBcFwzoQVCMirXV6VtTMpwBsZCSDrQlQ0XQCZAztyZBY1e1dAkoZC8FuWzreWJWXla2vqE5jw4ZAVVACZC7jbvEApg6NuioZAqyT6yZA7NNmu11hJNAZBQ9bk0ij3gMy46Y42axODhD0pZB3vDuIQwSxiLTRSiGodFHbJY";
const PHONE_NUMBER_ID = "1072262365971856";
const VERIFY_TOKEN    = "talentkick_webhook_2024";
const API_URL         = "https://graph.facebook.com/v19.0/" + PHONE_NUMBER_ID + "/messages";
const HANDOFF_MS      = 72 * 60 * 60 * 1000;

const handedOffToTeam = new Map();
const waitingToAsk    = new Set();
const lastSubMenu     = new Map();

function isHandedOff(from) {
  if (!handedOffToTeam.has(from)) return false;
  if (Date.now() - handedOffToTeam.get(from) > HANDOFF_MS) {
    handedOffToTeam.delete(from);
    waitingToAsk.delete(from);
    return false;
  }
  return true;
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
  return sendMessage({ messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "text", text: { body: text } });
}

async function sendBackButton(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Was this helpful? What would you like to do next?" },
      action: { buttons: [
        { type: "reply", reply: { id: "back_menu",    title: "Back to menu" } },
        { type: "reply", reply: { id: "found_answer", title: "I found my answer" } },
      ]}
    }
  });
}

async function sendOtherButtons(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Our team is here for you! What would you like to do?" },
      action: { buttons: [
        { type: "reply", reply: { id: "ask_team",     title: "Ask our team" } },
        { type: "reply", reply: { id: "back_menu",    title: "Back to menu" } },
        { type: "reply", reply: { id: "found_answer", title: "I found my answer" } },
      ]}
    }
  });
}

async function sendMainMenu(to) {
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Talent Kick" },
      body: { text: "Hi! Welcome to Talent Kick!\n\nWe are a highly selective, cross-university entrepreneurship programme in Switzerland.\n\nHow can we help you today?" },
      footer: { text: "talentkick.ch" },
      action: { button: "See options", sections: [{ title: "Who are you?", rows: [
        { id: "menu_applicant", title: "Applicant",            description: "Interested in joining TK" },
        { id: "menu_batch",     title: "Current Participant",   description: "Already in the programme" },
        { id: "menu_partner",   title: "Partner",               description: "Organisation or collaborator" },
        { id: "menu_external",  title: "General Enquiry",       description: "Press, public or other" },
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
      header: { type: "text", text: "Applicant Topics" },
      body: { text: "What would you like to know about applying to Talent Kick?" },
      footer: { text: "talentkick.ch/apply" },
      action: { button: "Choose topic", sections: [{ title: "Applicant Topics", rows: [
        { id: "app_calls",       title: "Current Calls",        description: "Open application calls" },
        { id: "app_eligibility", title: "Eligibility",           description: "Who can apply?" },
        { id: "app_how",         title: "How to Apply",          description: "Step-by-step process" },
        { id: "app_programme",   title: "The Programme",         description: "What does TK look like?" },
        { id: "app_funding",     title: "Funding & Support",     description: "CHF 5000 Team Kick award" },
        { id: "app_qa",          title: "Book a Q&A",            description: "Free call with our team" },
        { id: "app_other",       title: "Other",                 description: "Something else" },
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
      header: { type: "text", text: "Participant Topics" },
      body: { text: "What do you need help with today?" },
      footer: { text: "talentkick.ch" },
      action: { button: "Choose topic", sections: [{ title: "Participant Topics", rows: [
        { id: "batch_timetable", title: "Timetable & Links",     description: "Events & session schedule" },
        { id: "batch_deadlines", title: "Milestones",            description: "Key deadlines & submissions" },
        { id: "batch_materials", title: "Materials",             description: "Resources & recordings" },
        { id: "batch_coaching",  title: "Coaching",              description: "1:1 coaching sessions" },
        { id: "batch_other",     title: "Other",                 description: "Something else" },
      ]}]}
    }
  });
}

async function sendPartnerMenu(to) {
  lastSubMenu.set(to, sendPartnerMenu);
  return sendMessage({
    messaging_product: "whatsapp", recipient_type: "individual", to: to, type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Partner Topics" },
      body: { text: "How can we help you today?" },
      footer: { text: "talentkick.ch" },
      action: { button: "Choose topic", sections: [{ title: "Partner Topics", rows: [
        { id: "partner_opps",    title: "Partner With Us",       description: "Collaboration opportunities" },
        { id: "partner_collab",  title: "Collaborate",           description: "Events, workshops, content" },
        { id: "partner_mentor",  title: "Become a Mentor",       description: "Support our participants" },
        { id: "partner_invoice", title: "Invoicing",             description: "Payments & finance" },
        { id: "partner_other",   title: "Other",                 description: "Something else" },
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
      header: { type: "text", text: "General Enquiries" },
      body: { text: "What would you like to know about Talent Kick?" },
      footer: { text: "talentkick.ch" },
      action: { button: "Choose topic", sections: [{ title: "General Topics", rows: [
        { id: "ext_about",   title: "About Talent Kick",         description: "Who we are & our mission" },
        { id: "ext_offer",   title: "The Programme",             description: "What we offer" },
        { id: "ext_unis",    title: "Universities",              description: "Which unis participate?" },
        { id: "ext_media",   title: "Media & Press",             description: "Press enquiries" },
        { id: "ext_other",   title: "Other",                     description: "Something else" },
      ]}]}
    }
  });
}

const ANSWERS = {
  app_calls:       "The application portal for TK-S26 is now open!\n\nThis is our upcoming cohort - a highly selective cross-university programme for Master's and PhD students across Switzerland.\n\nSpots are limited so don't wait!\n\nApply here: www.talentkick.ch/apply",
  app_eligibility: "Who Can Apply?\n\nTalent Kick is open to:\n- Master's or PhD students at a Swiss university or UAS\n- Students from any field (technical, business, medical, design...)\n- People with an entrepreneurial mindset\n- Students willing to commit alongside their studies\n\nTime commitment:\nSemester 1: 2-6 hours per week\nSemesters 2-4: ~6 hours per semester\n\nYou do NOT need a startup idea or prior experience!\n\nwww.talentkick.ch/apply",
  app_how:         "How to Apply:\n\n1. Visit our application page\n2. Fill in the online application form\n3. Submit before the deadline\n4. Our team reviews your application\n5. Selected candidates are invited to next steps\n6. Receive your decision by email\n\nwww.talentkick.ch/apply",
  app_programme:   "The Talent Kick Programme\n\nA 1-4 semester cross-university programme where you:\n\n- Find an interdisciplinary co-founder team across Swiss universities\n- Develop and validate a startup idea alongside your studies\n- Receive 5 personal 1:1 coaching sessions\n- Build deep connections into the Swiss startup ecosystem\n- Receive the CHF 5,000 Team Kick Award upon hitting milestones\n\nSemester 1: Bootcamps, workshops, team-building and coaching\nSemesters 2-4: You drive your own journey with your team and mentor\n\nwww.talentkick.ch/program",
  app_funding:     "Funding & Support\n\nOnce your team achieves the two Semester 1 milestones:\n- Forming a stable interdisciplinary team\n- Convincing a successful entrepreneur as your mentor\n\nYou receive the Team Kick Award of CHF 5,000!\n\nTop teams also get access to:\n- Venture Kick\n- ETH Pioneer Fellowship\n- Innosuisse\n- Foundation FIT, Wyss Zurich, EPFL Blaze, FONGIT...\n\nwww.talentkick.ch/program",
  app_qa:          "Book a Free Q&A Session\n\nNot sure if Talent Kick is right for you? Book a free 1-on-1 Q&A call with our team!\n\n- Duration: 20-30 minutes\n- Format: Video call or WhatsApp call\n- Availability: Mon-Fri, check Calendly for slots\n\ncalendly.com/gabriela-talentkick/tk-s26-q-a-with-talent-kick",
  app_other:       "No problem! Our team is happy to help with anything not listed.\n\nEmail: info@talentkick.ch\nOr reply to this message directly\n\nWe usually respond within a few hours during working hours.",
  batch_timetable: "Timetable & Session Links\n\nAll session links, bootcamp dates and event schedules are shared in your cohort WhatsApp group and via email.\n\nFor the full programme overview:\nwww.talentkick.ch/program",
  batch_deadlines: "Milestones & Deadlines\n\nSemester 1 - Two key milestones:\n\n1. Form a stable, interdisciplinary co-founder team\n2. Convince a successful entrepreneur as your mentor\n\nOnce achieved you receive the CHF 5,000 Team Kick Award and move to semesters 2-4!\n\nSpecific deadlines are communicated by your coach and in your cohort group.\n\ninfo@talentkick.ch",
  batch_materials: "Materials & Resources\n\nAll programme materials are shared via:\n- Your cohort WhatsApp group\n- Email from your coach\n\nIncludes: bootcamp slides, workshop recordings, coaching resources, and ecosystem partner content.\n\nCan't find something? Reply here or ask in your cohort group!",
  batch_coaching:  "1:1 Coaching Sessions\n\nAs part of TK you receive 5 individual coaching sessions in Semester 1, continuing through Semesters 2-4.\n\nSessions focus on:\n- Leading yourself\n- Leading others\n- Leading change\n\nTo schedule or reschedule, contact your coach directly.\n\ninfo@talentkick.ch",
  batch_other:     "Need help with something else? We've got you!\n\nEmail: info@talentkick.ch\nOr reply to this message directly\nOr post in your cohort WhatsApp group\n\nAvailable: Mon-Fri, 9AM-6PM CET",
  partner_opps:    "Partner With Talent Kick\n\nWe partner with:\n- Corporates & Employers\n- Universities & research institutions\n- Foundations & public bodies\n- Startup ecosystem organisations\n\nCurrent supporters: Gebert Ruf Foundation, Foundation Botnar, ETH Domain, ETH Foundation.\n\ninfo@talentkick.ch\nwww.talentkick.ch",
  partner_collab:  "Collaboration Enquiries\n\nWe are open to:\n- Co-hosted events & workshops\n- Guest speaker opportunities\n- Joint programmes & challenges\n- Content & media collaborations\n\nEmail: info@talentkick.ch\n\nInclude your organisation name, idea, and contact details.",
  partner_mentor:  "Become a Mentor\n\nMentors are crucial to Talent Kick! Participants must convince a successful entrepreneur to be their mentor as part of Milestone 2.\n\nAs a mentor you:\n- Support an interdisciplinary student team\n- Share your entrepreneurial experience\n- Connect them to your network\n\ninfo@talentkick.ch",
  partner_invoice: "Invoicing & Payments\n\nFinance contact: info@talentkick.ch\nBank details: provided on request\n\nPlease include:\n- Organisation name\n- Invoice number\n- PO number (if applicable)\n- Amount & currency\n\nProcessed within a few business days.",
  partner_other:   "No problem! Our team is happy to help.\n\nEmail: info@talentkick.ch\nOr reply to this message directly\n\nWe usually respond within a few hours during working hours.",
  ext_about:       "About Talent Kick\n\nTalent Kick is a highly selective, cross-university entrepreneurship programme in Switzerland.\n\nOur mission: bring exceptional talents together in interdisciplinary, diverse teams and translate academic excellence into real-world entrepreneurial impact.\n\nAn initiative of the Kick Foundation, supported by Gebert Ruf Foundation, Foundation Botnar, ETH Domain and the ETH Foundation.\n\nwww.talentkick.ch",
  ext_offer:       "What Talent Kick Offers\n\nA 1-4 semester programme for Master's & PhD students:\n\n- Find your interdisciplinary co-founder team\n- Personal 1:1 coaching throughout\n- Develop & validate your startup idea\n- Connect to the Swiss startup ecosystem\n- CHF 5,000 Team Kick Award\n- Access to Venture Kick, ETH Pioneer Fellowship, Innosuisse & more\n\nwww.talentkick.ch/program",
  ext_unis:        "Participating Universities\n\nTalent Kick collaborates with:\n\n- ETH Zurich\n- EPFL\n- University of Zurich (UZH)\n- ZHAW\n- University of St. Gallen (HSG)\n- FHNW\n...and more!\n\nStudents from any field are welcome.\n\nwww.talentkick.ch",
  ext_media:       "Media & Press\n\nPress contact: info@talentkick.ch\n\nWe are happy to:\n- Provide quotes & statements\n- Arrange interviews\n- Share press kit & images\n- Collaborate on stories about Swiss entrepreneurship\n\nWe respond within 24 hours.",
  ext_other:       "No problem! Our team is happy to help.\n\nEmail: info@talentkick.ch\nOr reply to this message directly\n\nWe usually respond within a few hours during working hours.",
};

const GREETINGS = ["hi", "hello", "hallo", "hey", "hola", "bonjour", "ciao", "start", "menu"];

async function handleIncoming(message) {
  const from = message.from;
  const type = message.type;

  if (waitingToAsk.has(from) && type === "text") {
    waitingToAsk.delete(from);
    handedOffToTeam.set(from, Date.now());
    await sendText(from, "Got it! Our team will get back to you personally very soon. In the meantime feel free to visit www.talentkick.ch");
    return;
  }

  if (type === "text") {
    const body = (message.text && message.text.body ? message.text.body.toLowerCase().trim() : "");
    if (GREETINGS.some(function(g) { return body.includes(g); })) {
      handedOffToTeam.delete(from);
      waitingToAsk.delete(from);
    }
    if (!isHandedOff(from)) {
      await sendMainMenu(from);
    }
    return;
  }

  if (isHandedOff(from)) {
    console.log(from + " is with the team - bot silent");
    return;
  }

  if (type === "interactive" && message.interactive && message.interactive.type === "list_reply") {
    const id = message.interactive.list_reply.id;
    if (id === "menu_applicant") return sendApplicantMenu(from);
    if (id === "menu_batch")     return sendBatchMenu(from);
    if (id === "menu_partner")   return sendPartnerMenu(from);
    if (id === "menu_external")  return sendExternalMenu(from);
    if (ANSWERS[id]) {
      await sendText(from, ANSWERS[id]);
      const isOther = ["app_other","batch_other","partner_other","ext_other"].includes(id);
      setTimeout(function() { isOther ? sendOtherButtons(from) : sendBackButton(from); }, 1000);
      return;
    }
  }

  if (type === "interactive" && message.interactive && message.interactive.type === "button_reply") {
    const buttonId = message.interactive.button_reply.id;
    if (buttonId === "ask_team") {
      waitingToAsk.add(from);
      await sendText(from, "Of course! Go ahead and type your question and our team will get back to you personally.");
      return;
    }
    if (buttonId === "back_menu") {
      const subMenu = lastSubMenu.get(from);
      if (subMenu) return subMenu(from);
      return sendMainMenu(from);
    }
    if (buttonId === "found_answer") {
      await sendText(from, "Amazing! So glad we could help. Feel free to reach out anytime, we are always here for you. www.talentkick.ch");
      return;
    }
  }

  await sendMainMenu(from);
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
    const messages = req.body && req.body.entry && req.body.entry[0] && req.body.entry[0].changes && req.body.entry[0].changes[0] && req.body.entry[0].changes[0].value && req.body.entry[0].changes[0].value.messages;
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
