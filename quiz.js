const quizForm = document.querySelector("#quiz-form");
const timerDisplay = document.querySelector("#quiz-timer");
const resultPanel = document.querySelector("#quiz-result");
const resultHeading = document.querySelector("#result-heading");
const resultSummary = document.querySelector("#result-summary");
const resultTime = document.querySelector("#result-time");
const resultTimeout = document.querySelector("#result-timeout");
const reviewList = document.querySelector("#quiz-review");
const retakeButton = document.querySelector("#retake-quiz");
const questionPrompts = [...quizForm.querySelectorAll(".quiz-question legend")]
  .map((legend) => legend.textContent.trim());

const timeLimitSeconds = 10 * 60;
const passThreshold = 7;
// Keep answer keys and review labels together so scoring and feedback stay in sync.
const questions = [
  { id: "q1", type: "text", answer: "HTML", label: "HTML" },
  { id: "q2", type: "text", answer: "CSS", label: "CSS" },
  { id: "q3", type: "radio", answer: "main", label: "<main>" },
  { id: "q4", type: "radio", answer: "target", label: "Identifies which HTML elements the declarations style" },
  { id: "q5", type: "radio", answer: "alt", label: "alt" },
  { id: "q6", type: "radio", answer: "adapt", label: "Adapts a layout to different screen sizes and devices" },
  {
    id: "q7",
    type: "checkbox",
    answer: ["semantic", "alt", "keyboard"],
    label: "Meaningful semantic HTML, useful image alternative text, and keyboard-operable controls"
  },
  { id: "q8", type: "radio", answer: "true", label: "True" },
  { id: "q9", type: "select", answer: "section", label: "<section>" },
  { id: "q10", type: "radio", answer: "true", label: "True" }
];

let startedAt = Date.now();
let timerInterval;
let completed = false;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function getElapsedSeconds() {
  return Math.min(timeLimitSeconds, Math.floor((Date.now() - startedAt) / 1000));
}

function getAnswer(question) {
  if (question.type === "text") {
    return quizForm.elements[question.id].value.trim();
  }
  if (question.type === "checkbox") {
    return [...quizForm.querySelectorAll(`input[name="${question.id}"]:checked`)]
      .map((input) => input.value)
      .sort();
  }
  return quizForm.elements[question.id].value;
}

function answerMatches(question, answer) {
  if (question.type === "text") {
    return answer.toLowerCase() === question.answer.toLowerCase();
  }
  if (question.type === "checkbox") {
    // Sorting makes checkbox order irrelevant while still requiring an exact match.
    const expected = [...question.answer].sort();
    return answer.length === question.answer.length
      && answer.every((value, index) => value === expected[index]);
  }
  return answer === question.answer;
}

function formatUserAnswer(question, answer) {
  if (question.type === "checkbox") {
    return answer.length ? answer.join(", ") : "No choices selected";
  }
  return answer || "No answer provided";
}

function finishQuiz(timedOut = false) {
  if (completed) return;

  // The completion guard prevents a late timer tick from submitting twice.
  completed = true;
  window.clearInterval(timerInterval);
  const elapsedSeconds = getElapsedSeconds();
  const timeExpired = timedOut || elapsedSeconds >= timeLimitSeconds;
  timerDisplay.textContent = formatTime(timeLimitSeconds - elapsedSeconds);
  const score = questions.reduce((total, question) => {
    return total + Number(answerMatches(question, getAnswer(question)));
  }, 0);
  const passed = score >= passThreshold;

  resultPanel.hidden = false;
  resultPanel.classList.toggle("quiz-result--pass", passed);
  resultPanel.classList.toggle("quiz-result--fail", !passed);
  resultHeading.textContent = passed ? "You passed!" : "Keep practicing";
  resultSummary.textContent = `Score: ${score} / ${questions.length} — ${passed ? "Pass" : "Fail"}`;
  resultTime.textContent = `Time spent: ${formatTime(elapsedSeconds)}`;
  resultTimeout.textContent = timeExpired ? "Time is up. The quiz was submitted automatically." : "";
  reviewList.replaceChildren();

  questions.forEach((question, index) => {
    const userAnswer = getAnswer(question);
    const correct = answerMatches(question, userAnswer);
    const reviewItem = document.createElement("li");
    reviewItem.className = correct ? "review-correct" : "review-incorrect";

    const prompt = document.createElement("p");
    prompt.textContent = questionPrompts[index];

    const title = document.createElement("p");
    title.className = "review-status";
    title.textContent = `Question ${index + 1}: ${correct ? "Correct (+1 point)" : "Incorrect (+0 points)"}`;

    const response = document.createElement("p");
    response.textContent = `Your answer: ${formatUserAnswer(question, userAnswer)}`;

    const answer = document.createElement("p");
    answer.textContent = `Correct answer: ${question.label}`;

    reviewItem.append(prompt, title, response, answer);
    reviewList.append(reviewItem);
  });

  quizForm.querySelectorAll("input, select, button[type='submit']").forEach((control) => {
    control.disabled = true;
  });
  resultPanel.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateTimer() {
  const remaining = timeLimitSeconds - getElapsedSeconds();
  timerDisplay.textContent = formatTime(Math.max(0, remaining));
  if (remaining <= 0) finishQuiz(true);
}

function startTimer() {
  window.clearInterval(timerInterval);
  startedAt = Date.now();
  completed = false;
  timerDisplay.textContent = formatTime(timeLimitSeconds);
  timerInterval = window.setInterval(updateTimer, 1000);
}

quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  finishQuiz();
});

retakeButton.addEventListener("click", () => {
  quizForm.reset();
  quizForm.querySelectorAll("input, select, button[type='submit']").forEach((control) => {
    control.disabled = false;
  });
  resultPanel.hidden = true;
  resultPanel.classList.remove("quiz-result--pass", "quiz-result--fail");
  reviewList.replaceChildren();
  startTimer();
  quizForm.querySelector('input[name="q1"]').focus();
});

startTimer();
