
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


// ============================================
// MATHEMATICAL TEXT FORMATTING
// ============================================

function formatMathText(value) {
    let text = String(value ?? "");

    // Normalize double-escaped LaTeX delimiters.
    // Converts \\( into \( and \\) into \).
    text = text.replace(/\\\\([()[\]])/g, "\\$1");

    // Escape HTML characters safely.
    text = text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");

    // Preserve existing LaTeX expressions.
    // Do not convert their fractions a second time.
    if (text.includes("\\(") || text.includes("\\[")) {
        return text;
    }

    // Convert ordinary mathematical symbols.
    function toLatex(part) {
        return part
            .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
            .replace(/²/g, "^{2}")
            .replace(/³/g, "^{3}")
            .replace(/θ/g, "\\theta")
            .replace(/°/g, "^\\circ")
            .replace(/\b(sin|cos|tan|cot|sec|cosec)\b/g, "\\$1");
    }

    // Convert simple fractions into stacked fractions.
    const fractionPattern =
        /(\([^()]*\)|[A-Za-z0-9√θ°]+)\s*\/\s*(\([^()]*\)|[A-Za-z0-9√θ°]+)/g;

    text = text.replace(
        fractionPattern,
        function(match, numerator, denominator) {
            return "\\(\\frac{" +
                toLatex(numerator.trim()) +
                "}{" +
                toLatex(denominator.trim()) +
                "}\\)";
        }
    );

    return text;
}


// ============================================
// MATHJAX RENDERING
// ============================================

async function renderMath(elements) {
    try {
        // Wait for MathJax to become available.
        if (!window.MathJax) {
            console.error("MathJax library is not loaded.");
            return;
        }

        await window.MathJax.startup.promise;

        if (window.MathJax.typesetPromise) {
            await window.MathJax.typesetPromise(elements);
        }

    } catch (error) {
        console.error("MathJax rendering error:", error);
    }
}


// ============================================
// LOAD TEST
// ============================================

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

        // Check whether this test has already been attempted.
        const attemptKey = "attempted_" + currentTest.id;

        if (localStorage.getItem(attemptKey) === "true") {
            testTitle.textContent = currentTest.title;

            questionText.textContent =
                "You have already attempted this test.";

            questionProgress.textContent = "Attempt completed";

            testMessage.textContent =
                "You cannot attempt this test again. Please contact your teacher.";

            optionsContainer.innerHTML = "";

            previousButton.style.display = "none";
            nextButton.style.display = "none";
            submitButton.style.display = "none";

            timerElement.textContent = "Completed";

            return;
        }

        selectedAnswers = Array(
            currentTest.questions.length
        ).fill(null);

        testTitle.textContent = currentTest.title;

        testDetails.textContent =
            `${currentTest.class} | ${currentTest.subject}`;

        await renderQuestion();

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


// ============================================
// RENDER QUESTION AND OPTIONS
// ============================================

async function renderQuestion() {
    if (!currentTest) return;

    const question = currentTest.questions[currentQuestionIndex];

    // Clear previously rendered MathJax content.
    if (window.MathJax && window.MathJax.typesetClear) {
        window.MathJax.typesetClear([
            questionText,
            optionsContainer
        ]);
    }

    questionProgress.textContent =
        `${currentQuestionIndex + 1} of ${currentTest.questions.length}`;

    questionNumber.textContent =
        `Question ${currentQuestionIndex + 1}`;

    // Display question.
    questionText.innerHTML = formatMathText(question.text);

    // Clear old options.
    optionsContainer.innerHTML = "";

    // Display options vertically.
    optionsContainer.style.display = "flex";
    optionsContainer.style.flexDirection = "column";
    optionsContainer.style.alignItems = "stretch";
    optionsContainer.style.gap = "12px";

    testMessage.textContent = "";

    // Create each option separately.
    question.options.forEach((option, index) => {

        const label = document.createElement("label");

        label.className = "option-item";

        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "12px";
        label.style.width = "100%";
        label.style.boxSizing = "border-box";
        label.style.marginBottom = "0";

        const radio = document.createElement("input");

        radio.type = "radio";
        radio.name = "answer";
        radio.value = index;

        radio.checked =
            selectedAnswers[currentQuestionIndex] === index;

        radio.addEventListener("change", function() {
            selectedAnswers[currentQuestionIndex] = index;
        });

        const optionText = document.createElement("span");

        // Convert and display mathematical expressions.
        optionText.innerHTML =
            `${String.fromCharCode(65 + index)}. ` +
            formatMathText(option);

        label.appendChild(radio);
        label.appendChild(optionText);

        optionsContainer.appendChild(label);
    });

    // Render mathematical expressions in question and options.
    await renderMath([
        questionText,
        optionsContainer
    ]);
}


// ============================================
// NAVIGATION
// ============================================

function updateNavigation() {
    if (!currentTest) return;

    previousButton.disabled =
        currentQuestionIndex === 0;

    nextButton.style.display =
        currentQuestionIndex === currentTest.questions.length - 1
            ? "none"
            : "inline-flex";
}

previousButton.addEventListener("click", async function() {

    if (currentQuestionIndex > 0) {

        currentQuestionIndex--;

        await renderQuestion();

        updateNavigation();
    }
});

nextButton.addEventListener("click", async function() {

    if (
        currentTest &&
        currentQuestionIndex < currentTest.questions.length - 1
    ) {

        currentQuestionIndex++;

        await renderQuestion();

        updateNavigation();
    }
});


// ============================================
// TIMER
// ============================================

function updateTimerDisplay() {

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {

    timeRemaining =
        (currentTest.duration ?? currentTest.durationMinutes) * 60;

    console.log("Selected test:", currentTest.id);
    console.log("Duration:", currentTest.duration);
    console.log("Time remaining:", timeRemaining);

    clearInterval(timerInterval);

    updateTimerDisplay();

    timerInterval = setInterval(function() {

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


// ============================================
// SUBMIT TEST
// ============================================

function submitTest() {

    if (!currentTest) return;

    clearInterval(timerInterval);

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    currentTest.questions.forEach((question, index) => {

        if (selectedAnswers[index] === null) {

            unattempted++;

        } else if (
            selectedAnswers[index] === question.correctAnswer
        ) {

            correct++;

        } else {

            wrong++;
        }
    });

    const score =
        (correct * marksPerQuestion) -
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

    // Save this test as attempted.
    localStorage.setItem(
        "attempted_" + currentTest.id,
        "true"
    );

    // Save result.
    sessionStorage.setItem(
        "mockTestResult",
        JSON.stringify(result)
    );

    window.location.href = "result.html";
}


// ============================================
// SUBMIT BUTTON
// ============================================

submitButton.addEventListener("click", function() {

    const confirmed = confirm(
        "Are you sure you want to submit your test?"
    );

    if (confirmed) {
        submitTest();
    }
});


// ============================================
// START
// ============================================

loadTest();
