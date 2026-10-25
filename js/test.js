
const testTitle = document.getElementById("test-title");
const testDetails = document.getElementById("test-details");
const questionProgress = document.getElementById("question-progress");
const questionNumber = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const testMessage = document.getElementById("test-message");
const testYear = document.getElementById("test-year");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const submitButton = document.getElementById("submit-button");
const timerElement = document.getElementById("timer");
const marksPerQuestion = 1;
const negativeMarks = 0;

let currentTest = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];
let timeRemaining = 0;
let timerInterval = null;

if (testYear) {
    testYear.textContent = new Date().getFullYear();
}

async function loadTest() {
    try {
        const response = await fetch("data/tests.json");

        if (!response.ok) {
            throw new Error("Could not load test data.");
        }

        const data = await response.json();
        const params = new URLSearchParams(window.location.search);
const testId = params.get("id");

currentTest = testId
    ? data.tests.find(test => test.id === testId)
    : data.tests[0];

        if (!currentTest || !currentTest.questions.length) {
            throw new Error("No questions were found in the test data.");
        }

        selectedAnswers = Array(currentTest.questions.length).fill(null);

        testTitle.textContent = currentTest.title;
        testDetails.textContent =
            `${currentTest.class} | ${currentTest.subject}`;

        renderQuestion();
        updateNavigation();
        startTimer();

    } catch (error) {
        console.error("Test loading error:", error);
        questionText.textContent = "Unable to load the test.";
        optionsContainer.innerHTML = "";
        questionProgress.textContent = "Unavailable";
        testMessage.textContent =
            "Unable to load the questions. Check the data file and browser Console.";
    }
}

function renderQuestion() {
    if (!currentTest) return;

    const question = currentTest.questions[currentQuestionIndex];

    questionProgress.textContent =
        `${currentQuestionIndex + 1} of ${currentTest.questions.length}`;

    questionNumber.textContent = `Question ${currentQuestionIndex + 1}`;
    questionText.textContent = question.text;
    optionsContainer.innerHTML = "";
    testMessage.textContent = "";

    question.options.forEach((option, index) => {
        const label = document.createElement("label");
        label.className = "option-item";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "answer";
        radio.value = index;
        radio.checked = selectedAnswers[currentQuestionIndex] === index;

        radio.addEventListener("change", function () {
            selectedAnswers[currentQuestionIndex] = index;
        });

        const optionText = document.createElement("span");
        optionText.textContent =
            `${String.fromCharCode(65 + index)}. ${option}`;

        label.append(radio, optionText);
        optionsContainer.appendChild(label);
    });
}

function updateNavigation() {
    if (!currentTest) return;

    previousButton.disabled = currentQuestionIndex === 0;

    nextButton.style.display =
        currentQuestionIndex === currentTest.questions.length - 1
            ? "none"
            : "inline-flex";
}

previousButton.addEventListener("click", function () {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        updateNavigation();
    }
});

nextButton.addEventListener("click", function () {
    if (currentTest &&
        currentQuestionIndex < currentTest.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        updateNavigation();
    }
});

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
    timeRemaining = (currentTest.duration ?? currentTest.durationMinutes) * 60;
    console.log("Selected test:", currentTest.id);
    console.log("Duration:", currentTest.duration);
    console.log("Time remaining:", timeRemaining);
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(function () {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timeRemaining = 0;
            updateTimerDisplay();

            testMessage.textContent =
                "Time is up! Please submit your test.";

            nextButton.disabled = true;
            previousButton.disabled = true;
        }
    }, 1000);
}

loadTest();


function submitTest() {
    if (!currentTest) return;

    clearInterval(timerInterval);

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    currentTest.questions.forEach((question, index) => {
        if (selectedAnswers[index] === null) {
            unattempted++;
        } else if (selectedAnswers[index] === question.correctAnswer) {
            correct++;
        } else {
            wrong++;
        }
    });

    const score = (correct * marksPerQuestion) -
                  (wrong * negativeMarks);

    const result = {
        testTitle: currentTest.title,
        className: currentTest.class,
        subject: currentTest.subject,
        totalQuestions: currentTest.questions.length,
        correct,
        wrong,
        unattempted,
        score,
        marksPerQuestion,
        negativeMarks,
        questions: currentTest.questions,
        selectedAnswers
    };

    sessionStorage.setItem("mockTestResult", JSON.stringify(result));
    window.location.href = "result.html";
}

submitButton.addEventListener("click", function () {
    const confirmed = confirm(
        "Are you sure you want to submit your test?"
    );

    if (confirmed) {
        submitTest();
    }
});
