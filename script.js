const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxK2lSrIdVTQkixPEGCG47Vea7s9yVQ2ZMHTXJQwb6a2cgrha2waX7QtxdNdv20gHgj/exec";

const questions = [
  { title: "Qaysi turdagi ta'lim muassasasida ishlaysiz?", type: "single", options: ["Universitet", "Institut", "Akademiya", "Boshqa"] },
  { title: "Qaysi yo'nalishda dars berasiz?", type: "single", options: ["Aniq fanlar", "Tabiiy fanlar", "Ijtimoiy-gumanitar fanlar", "Texnika va muhandislik", "Pedagogika", "Boshqa"] },
  { title: "Pedagogik tajribangiz qancha?", type: "single", options: ["1 yildan kam", "1–3 yil", "4–7 yil", "8–15 yil", "15 yildan ortiq"] },
  { title: "Darslaringizda qaysi raqamli vositalardan foydalanasiz?", type: "multiple", options: ["Google Forms", "Microsoft Forms", "Moodle", "Google Classroom", "Telegram", "PowerPoint", "Canva", "Kahoot / Quizizz", "Boshqa", "Hozircha raqamli vositalardan foydalanmayman"] },
  { title: "Dars materialini tayyorlashga qancha vaqt sarflaysiz?", type: "single", options: ["30 daqiqadan kam", "30 daqiqa – 1 soat", "1–2 soat", "2–4 soat", "4 soatdan ko'p"] },
  { title: "Test va savollar tayyorlash siz uchun qanchalik vaqt talab qiladi?", type: "single", options: ["10 daqiqadan kam", "10–30 daqiqa", "30–60 daqiqa", "1 soatdan ko'p"] },
  { title: "Interaktiv dars tashkil qilishda eng katta muammolaringiz nimalar?", type: "multiple", maxSelections: 3, options: ["Dars materialini tayyorlashga ko'p vaqt ketadi", "Test va savollar tuzish qiyin", "Talabalarni bir vaqtda jalb qilish qiyin", "Jonli natijalarni ko'rish imkoniyati cheklangan", "Turli platformalarni birgalikda ishlatishga to'g'ri keladi", "Internet yoki texnik muammolar", "Talabalarning faolligi past", "Natijalarni tahlil qilish qiyin", "Boshqa"] },
  { title: "Hozir foydalanayotgan platformangizda nimani o'zgartirgan bo'lardingiz?", type: "text" },
  { title: "Sizga kerak, ammo hozirgi platformalarda mavjud bo'lmagan imkoniyat nima?", type: "text" },
  { title: "AI yordamida dars yaratish konsepsiyasi siz uchun qanchalik foydali?", type: "single", options: ["Juda foydali", "Foydali", "Qisman foydali", "Unchalik foydali emas", "Umuman kerak emas"] },
  { title: "Quyidagi imkoniyatlardan qaysi biri siz uchun eng muhim?", type: "single", options: ["Darsni tez yaratish", "Test va savollarni avtomatik yaratish", "Interaktiv topshiriqlar", "Jonli natijalarni ko'rish", "Talabalar faolligini kuzatish", "Dars yakunida natijalarni tahlil qilish"] },
  { title: "Bunday platformadan foydalanishga qanchalik qiziqasiz?", type: "single", options: ["Juda qiziqaman", "Qiziqaman", "Sinab ko'rib qaror qilaman", "Hozircha qiziqmayman", "Qiziqmayman"] },
  { title: "Bepul sinov davrida real darsda sinab ko'rarmidingiz?", type: "single", options: ["Ha, albatta", "Ehtimol, sinab ko'raman", "Avval batafsil ma'lumot kerak", "Yo'q"] },
  { title: "O'qituvchi uchun bunday platformaning maqbul oylik narxi qancha?", type: "single", options: ["Bepul bo'lishi kerak", "20 000 so'mgacha", "20 000–50 000 so'm", "50 000–100 000 so'm", "100 000 so'mdan yuqori"] },
  { title: "Beta-testda qatnashishni xohlaysizmi?", type: "single", options: ["Ha", "Balki", "Yo'q"] }
];

let currentQuestion = 0;
let answers = {};

const $ = (id) => document.getElementById(id);
const startBtn = $("startBtn");
const restartBtn = $("restartBtn");
const welcomeScreen = $("welcomeScreen");
const surveyScreen = $("surveyScreen");
const completeScreen = $("completeScreen");
const questionNumber = $("questionNumber");
const questionTitle = $("questionTitle");
const questionHelp = $("questionHelp");
const optionsContainer = $("optionsContainer");
const nextBtn = $("nextBtn");
const validationMessage = $("validationMessage");
const progressLabel = $("progressLabel");
const progressPercent = $("progressPercent");
const progressFill = $("progressFill");

function renderQuestion() {
  const q = questions[currentQuestion];
  questionNumber.textContent = String(currentQuestion + 1).padStart(2, "0");
  questionTitle.textContent = q.title;
  questionHelp.textContent = q.type === "multiple"
    ? "Bir yoki bir nechta variantni tanlang."
    : q.type === "text"
      ? "Javobingizni qisqa va aniq yozishingiz mumkin."
      : "O'zingizga mos variantni tanlang.";

  optionsContainer.innerHTML = "";
  validationMessage.textContent = "";

  if (q.type === "single") renderSingle(q);
  if (q.type === "multiple") renderMultiple(q);
  if (q.type === "text") renderText(q);

  nextBtn.textContent = currentQuestion === questions.length - 1 ? "Yakunlash ✓" : "Keyingi →";
  updateProgress();
}

function renderSingle(q) {
  q.options.forEach((option, index) => {
    const wrap = document.createElement("div");
    wrap.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "question";
    input.id = "option-" + index;
    input.value = option;
    input.checked = answers[currentQuestion] === option;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = option;

    input.addEventListener("change", () => {
      answers[currentQuestion] = option;
      if (currentQuestion === 14) renderContactField();
      validationMessage.textContent = "";
    });

    wrap.append(input, label);
    optionsContainer.appendChild(wrap);
  });

  if (currentQuestion === 14 && (answers[currentQuestion] === "Ha" || answers[currentQuestion] === "Balki")) {
    renderContactField();
  }
}

function renderMultiple(q) {
  const selected = Array.isArray(answers[currentQuestion]) ? answers[currentQuestion] : [];

  q.options.forEach((option, index) => {
    const wrap = document.createElement("div");
    wrap.className = "option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = "option-" + index;
    input.value = option;
    input.checked = selected.includes(option);

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = option;

    input.addEventListener("change", () => {
      let values = [...optionsContainer.querySelectorAll("input:checked")].map(el => el.value);
      if (q.maxSelections && values.length > q.maxSelections) {
        input.checked = false;
        validationMessage.textContent = "Eng ko'pi bilan " + q.maxSelections + " ta variant tanlang.";
        return;
      }
      answers[currentQuestion] = values;
      validationMessage.textContent = "";
    });

    wrap.append(input, label);
    optionsContainer.appendChild(wrap);
  });
}

function renderText() {
  const textarea = document.createElement("textarea");
  textarea.className = "text-answer";
  textarea.placeholder = "Javobingiz...";
  textarea.value = answers[currentQuestion] || "";
  textarea.maxLength = 1500;
  textarea.addEventListener("input", () => {
    answers[currentQuestion] = textarea.value.trim();
    validationMessage.textContent = "";
  });
  optionsContainer.appendChild(textarea);
}

function renderContactField() {
  const wrap = document.createElement("div");
  wrap.className = "contact-wrap";

  const label = document.createElement("label");
  label.htmlFor = "contactInput";
  label.textContent = "Telegram username yoki telefon raqami (ixtiyoriy)";

  const input = document.createElement("input");
  input.id = "contactInput";
  input.className = "contact-input";
  input.type = "text";
  input.maxLength = 100;
  input.placeholder = "@username yoki +998...";
  input.value = answers.contact || "";
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    answers.contact = input.value.trim();
  });

  wrap.append(label, input);
  optionsContainer.appendChild(wrap);
}

function updateProgress() {
  const total = questions.length;
  const number = currentQuestion + 1;
  const percent = Math.round((number / total) * 100);
  progressLabel.textContent = "Savol " + number + " / " + total;
  progressPercent.textContent = percent + "%";
  progressFill.style.width = percent + "%";
}

function saveCurrentAnswer() {
  const q = questions[currentQuestion];

  if (q.type === "single" && !answers[currentQuestion]) {
    showValidation("Davom etish uchun variant tanlang.");
    return false;
  }

  if (q.type === "multiple" && (!Array.isArray(answers[currentQuestion]) || answers[currentQuestion].length === 0)) {
    showValidation("Kamida bitta variant tanlang.");
    return false;
  }

  if (q.type === "text" && !(answers[currentQuestion] || "").trim()) {
    showValidation("Javob maydonini to'ldiring.");
    return false;
  }

  return true;
}

function showValidation(message) {
  validationMessage.textContent = message;
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "survey-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function buildPayload() {
  return {
    id: makeId(),
    sana_vaqt: new Date().toISOString(),
    muassasa: answers[0] || "",
    yonalis: answers[1] || "",
    tajriba: answers[2] || "",
    platformalar: Array.isArray(answers[3]) ? answers[3].join(", ") : "",
    tayyorlash_vaqti: answers[4] || "",
    test_vaqti: answers[5] || "",
    muammolar: Array.isArray(answers[6]) ? answers[6].join(", ") : "",
    ozgarish_talabi: answers[7] || "",
    yetishmayotgan_imkoniyat: answers[8] || "",
    ai_bahosi: answers[9] || "",
    muhim_funksiya: answers[10] || "",
    platformaga_qiziqish: answers[11] || "",
    beta_sinov: answers[12] || "",
    narx: answers[13] || "",
    beta_aloqa: answers.contact || ""
  };
}

async function sendToSheets(payload) {
  const body = JSON.stringify(payload);

  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });
    return true;
  } catch (error) {
    console.error("Google Sheets yuborishda xato:", error);
    return false;
  }
}

async function finishSurvey() {
  nextBtn.disabled = true;
  nextBtn.textContent = "Yuborilmoqda...";

  const payload = buildPayload();
  const sent = await sendToSheets(payload);

  console.log("So'rovnoma:", payload);
  console.log("Google Sheets yuborildi:", sent);

  surveyScreen.classList.add("hidden");
  completeScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  nextBtn.disabled = false;
}

startBtn.addEventListener("click", () => {
  welcomeScreen.classList.add("hidden");
  surveyScreen.classList.remove("hidden");
  currentQuestion = 0;
  answers = {};
  renderQuestion();
});

restartBtn.addEventListener("click", () => {
  completeScreen.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");
  currentQuestion = 0;
  answers = {};
});

nextBtn.addEventListener("click", async () => {
  if (!saveCurrentAnswer()) return;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    await finishSurvey();
  }
});

document.addEventListener("pointermove", (event) => {
  document.documentElement.style.setProperty("--mx", event.clientX + "px");
  document.documentElement.style.setProperty("--my", event.clientY + "px");
});