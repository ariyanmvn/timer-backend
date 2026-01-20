const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SSC_DATE = new Date("2026-04-21T00:00:00");

// MongoDB setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ariyan.mefyr.mongodb.net/?appName=Ariyan`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1 },
});

let emailCollection;

async function connectDB() {
  await client.connect();
  const db = client.db("sscTimer");
  emailCollection = db.collection("emails");
}
connectDB();

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use App Password
  },
});

// Utility
function daysLeft() {
  const now = new Date();
  return Math.ceil((SSC_DATE - now) / (1000 * 60 * 60 * 24));
}

const motivationalMessages = [
  "Consistency beats talent when talent doesn’t work hard.",
  "Study now so your future can relax.",
  "Every day you study, you're one step closer to success.",
  "SSC is tough, but you are tougher.",
  "Hard work today, freedom tomorrow.",
  "Small efforts every day lead to big results.",
  "Focus on your goal, not the distractions.",
  "Discipline is the bridge between goals and achievement.",
  "Knowledge today, success tomorrow.",
  "Study smart, not just hard.",
  "Progress, no matter how small, is still progress.",
  "Don't stop until you are proud.",
  "Your future self will thank you for today’s effort.",
  "Time invested in studying is never wasted.",
  "Mistakes are lessons, not failures.",
  "Prepare today, perform tomorrow.",
  "Patience and practice lead to perfection.",
  "One step at a time is enough.",
  "Dedication today creates opportunity tomorrow.",
  "The more you learn, the more you earn.",
  "Consistency beats short bursts of effort.",
  "Your focus determines your reality.",
  "Every exam is a step closer to your dream.",
  "A disciplined mind creates a disciplined life.",
  "Small daily wins compound into success.",
  "Push yourself; no one else is going to do it for you.",
  "Success comes to those who show up every day.",
  "Hard work never betrays effort.",
  "Your limits exist only in your mind.",
  "Start where you are, use what you have, do what you can.",
  "Discipline is choosing between what you want now and what you want most.",
  "Excellence is a habit, not an act.",
  "Preparation is the key to confidence.",
  "Focus on progress, not perfection.",
  "The secret to success is to start before you’re ready.",
  "Knowledge is the only wealth that can never be taken.",
  "Success is built on daily routines.",
  "The harder you work, the luckier you get.",
  "Motivation gets you started, habit keeps you going.",
  "Don’t count the days, make the days count.",
  "One hour today is a step ahead tomorrow.",
  "Stay patient, work hard, achieve more.",
  "Learning is a treasure that will follow you everywhere.",
  "Discipline today, freedom tomorrow.",
  "Your efforts today define your success tomorrow.",
  "Study with purpose, not just effort.",
  "Small steps every day lead to giant leaps.",
  "Consistency is the compound interest of success.",
  "Push through discomfort, that’s where growth happens.",
  "A goal without a plan is just a wish.",
  "Don’t let procrastination steal your future.",
  "Knowledge is power, action is mastery.",
  "The best way to predict your future is to create it.",
  "Every day is a new opportunity to improve.",
  "Invest in yourself; it pays the best interest.",
  "Focus is the key to achieving great results.",
  "Success is the sum of small efforts repeated daily.",
  "Your habits today shape your tomorrow.",
  "Discipline outperforms motivation every time.",
  "Do something today that your future self will thank you for.",
  "Study while others are sleeping; dream while others are playing.",
  "Hard work beats talent when talent doesn’t work hard.",
  "Every challenge is an opportunity to grow.",
  "Action is the foundational key to all success.",
  "You are capable of more than you think.",
  "Small consistent efforts create lasting results.",
  "A focused mind achieves more in less time.",
  "Set goals, stay consistent, and never quit.",
  "Don’t wish for it, work for it.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your effort today builds the life you want tomorrow.",
  "Knowledge is earned, not given.",
  "Every day you improve is a day closer to your dream.",
  "Focus on what you can control and ignore the rest.",
  "Persistence overcomes resistance.",
  "Learn, practice, repeat.",
  "Challenges are stepping stones to success.",
  "Your dedication today determines your results tomorrow.",
  "Stay consistent, results will follow.",
  "The difference between try and triumph is a little 'umph'.",
  "Work until your idols become your rivals.",
  "Every morning is a chance to get better.",
  "Don’t let yesterday waste today.",
  "Your mind is a garden; your thoughts are seeds.",
  "Study like someone is going to take it away from you.",
  "Consistency creates credibility.",
  "Small wins every day lead to big achievements.",
  "Focus on effort, not outcome.",
  "Don’t limit yourself; aim higher.",
  "Discipline is your superpower.",
  "Do it for the future you, not the comfort of now.",
  "Growth comes from stepping out of your comfort zone.",
  "Daily improvement is better than delayed perfection.",
  "Hard work compounds over time.",
  "Effort today pays dividends tomorrow.",
  "Study with intensity, rest with purpose.",
  "Success is earned in the quiet hours.",
  "Every exam is an opportunity to shine.",
  "Consistency beats talent every time.",
  "Your grind today will shine tomorrow.",
  "Preparation is the key to confidence and success.",
  "Push yourself, no one else will.",
  "The pain of discipline is less than the pain of regret.",
  "Focus on your goals, ignore the noise.",
  "Your actions today decide your tomorrow.",
  "Do it now, because later becomes never.",
  "Stay committed to your path.",
  "Success doesn’t come to those who wait.",
  "Small steps consistently lead to mastery.",
  "Discipline is doing what needs to be done, even when you don’t want to.",
  "Effort + Consistency = Progress.",
  "Your journey is defined by the work you put in daily.",
  "Don’t stop when tired, stop when done.",
  "Learning is the fastest way to grow.",
  "Every study session counts.",
  "Hard work today makes the future brighter.",
  "Invest in your knowledge—it pays lifelong dividends.",
  "Your effort is your best investment.",
  "Stay disciplined, stay ahead.",
  "Focus on the process, not just the results.",
  "Study is temporary, pride is forever.",
  "Consistency is your key to success.",
  "Push through distractions, your future depends on it.",
  "Today’s effort builds tomorrow’s success.",
  "Motivation is fleeting, discipline lasts.",
];

// ================= ROUTES =================

// Subscribe route
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ message: "Email required" });

  const exists = await emailCollection.findOne({ email });
  if (exists) {
    return res.status(409).send({ message: "Email already subscribed" });
  }

  await emailCollection.insertOne({ email, createdAt: new Date() });

  // Confirmation email
  await transporter.sendMail({
    from: `"SSC Countdown" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "You're subscribed to SSC 2026 Countdown 🎉",
    html: `
  <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2 style="color: #2563eb;">🎉 Welcome to SSC 2026 Countdown!</h2>
    <p style="font-size: 16px; margin-top: 10px;">
      Thank you for subscribing! You're now on the path to stay focused and consistent for SSC 2026.
    </p>
    <p style="font-size: 16px; margin-top: 10px;">
      ⏳ <strong>${daysLeft()} days</strong> left until your SSC exam. Every day counts!
    </p>
    <p style="font-size: 16px; margin-top: 10px; font-style: italic;">
      💡 You will receive a motivational reminder every morning to help you stay on track.
    </p>
    <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px;">
      🔑 Tip: Create a daily study routine and take short breaks to maximize focus.
    </div>
    <p style="margin-top: 20px; font-size: 14px; color: #4b5563;">
      🚀 Keep going, stay consistent, and make each day productive!
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
      Best regards,<br/>
      <strong>Ariyan </strong>
    </p>
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #d1d5db;" />
    <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
      You are receiving this email because you subscribed to SSC 2026 Countdown. If you wish to unsubscribe, please click here.
    </p>
  </div>
`,
  });

  res.send({ message: "Subscribed successfully" });
});

// GET all subscribers
app.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await emailCollection
      .find({}, { projection: { _id: 0, email: 1, createdAt: 1 } })
      .toArray();
    res.send(subscribers);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Failed to fetch subscribers" });
  }
});

// ================= CRON JOB =================

// Every day at 8:00 AM
//"0 8 * * *"
//24 12 * * *"
cron.schedule("42 12 * * *", async () => {
  const emails = await emailCollection.find().toArray();
  const message =
    motivationalMessages[
      Math.floor(Math.random() * motivationalMessages.length)
    ];

  for (const user of emails) {
    await transporter.sendMail({
      from: `"SSC Countdown" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `⏳ ${daysLeft()} Days Left for SSC 2026`,
      html: `
  <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2 style="color: #2563eb;">🌅 Good Morning!</h2>
    <p style="font-size: 16px;">
      ⏳ <strong>${daysLeft()} days</strong> left for <strong>SSC 2026</strong>. Time to make each day count!
    </p>
    <p style="font-size: 16px; margin-top: 12px; font-style: italic;">
      💡 ${message}
    </p>
    <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px;">
      🔑 Tip: Stay focused, take short breaks, and track your progress daily.
    </div>
    <p style="margin-top: 20px; font-size: 14px; color: #4b5563;">
      📌 Remember: Small consistent efforts today lead to big results tomorrow!
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
      🚀 Stay disciplined and keep going,<br/>
      <strong>SSC Countdown Team</strong>
    </p>
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #d1d5db;" />
    <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
      You are receiving this email because you subscribed to SSC 2026 Countdown. If you wish to unsubscribe, please click here.
    </p>
  </div>
`,
    });
  }

  console.log("Daily SSC emails sent ✅");
});

// Test route
app.get("/", (req, res) => {
  res.send("SSC Timer Server Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
