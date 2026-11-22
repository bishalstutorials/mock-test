
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

// INSTRUCTION SCREEN
const instructionScreen = document.getElementById("instruction-screen");
const instructionSummary = document.getElementById("instruction-summary");
const startTestButton = document.getElementById("start-test-button");
const testInterface = document.getElementById("test-interface");

// QUESTION PALETTE
const paletteGrid = document.getElementById("palette-grid");
const answeredCount = document.getElementById("answered-count");
const unansweredCount = document.getElementById("unanswered-count");
const notVisitedCount = document.getElementById("not-visited-count");
const paletteToggle = document.getElementById("palette-toggle");
const questionPalette = document.getElementById("question-palette");

let currentTest = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];
let visitedQuestions = [];
let timeRemaining = 0;
let timerInterval = null;
let isSubmitting = false;
let testStarted = false;

let startTime = null;
let endTime = null;
let attemptNumber = 0;

if (testYear) {
    testYear.textContent = new Date().getFullYear();
}


// ============================================
// MATHEMATICAL TEXT FORMATTING
// ============================================

function formatMathText(value) {
    let text = String(value ?? "");

    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    text = text.replace(/&#x20;|&#32;|&nbsp;/gi, " ");
    text = text.replace(/\\\\(?=[()[\]]|[a-zA-Z])/g, "\\");
    text = text.replace(/^\s*#{1,6}\s*/gm, "");
    text = text.replace(/#{3,}\s*/g, "");

    if (
        text.includes("স্তম্ভ-II:") &&
        !text.includes("স্তম্ভ-I:")
    ) {
        text = text.replace(
            /^(\s*\(i\))/m,
            "স্তম্ভ-I:\n$1"
        );
    }

    text = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function toLatex(part) {
        return part
            .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
            .replace(/²/g, "^{2}")
            .replace(/³/g, "^{3}")
            .replace(/θ/g, "\\theta")
            .replace(/°/g, "^\\circ")
            .replace(/\b(sin|cos|tan|cot|sec|cosec)\b/g, "\\$1");
    }

    if (!text.includes("\\(") && !text.includes("\\[")) {

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

        if (
            text.includes("√") ||
            text.includes("²") ||
            text.includes("³") ||
            text.includes("θ") ||
            text.includes("°")
        ) {
            text = toLatex(text);
        }
    }

    return text.replace(/\n/g, "<br>");
}


// ============================================
// MATHJAX RENDERING
// ============================================

async function renderMath(elements) {
    try {
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
// FORMAT TIME
// ============================================

function formatDuration(seconds) {

    const totalSeconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
}


// ============================================
// INSTRUCTION SCREEN
// ============================================

function showTestInstructions() {

    if (!currentTest || !instructionSummary) return;

    const duration =
        Number(currentTest.duration ?? currentTest.durationMinutes);

    const totalQuestions = currentTest.questions.length;

    const marksPerQuestion =
        currentTest.marksPerQuestion ?? 1;

    const negativeMarks =
        currentTest.negativeMarks ?? 0;

    const totalMarks =
        totalQuestions * Number(marksPerQuestion);

    instructionSummary.innerHTML = `
        <div class="instruction-detail">
            <span>Test Name</span>
            <strong>${escapeHTML(currentTest.title)}</strong>
        </div>

        <div class="instruction-detail">
            <span>Class</span>
            <strong>${escapeHTML(currentTest.class || "Not specified")}</strong>
        </div>

        <div class="instruction-detail">
            <span>Subject</span>
            <strong>${escapeHTML(currentTest.subject || "Not specified")}</strong>
        </div>

        <div class="instruction-detail">
            <span>Total Questions</span>
            <strong>${totalQuestions}</strong>
        </div>

        <div class="instruction-detail">
            <span>Duration</span>
            <strong>${duration} Minutes</strong>
        </div>

        <div class="instruction-detail">
            <span>Total Marks</span>
            <strong>${totalMarks}</strong>
        </div>

        <div class="instruction-detail">
            <span>Marks Per Question</span>
            <strong>${marksPerQuestion}</strong>
        </div>

        <div class="instruction-detail">
            <span>Negative Marks</span>
            <strong>${negativeMarks}</strong>
        </div>
    `;

    if (startTestButton) {
        startTestButton.disabled = false;
        startTestButton.textContent = "Start Now →";
    }
}


function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function(character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


// ============================================
// QUESTION PALETTE
// ============================================

function createQuestionPalette() {

    if (!paletteGrid || !currentTest) return;

    paletteGrid.innerHTML = "";

    currentTest.questions.forEach((question, index) => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "palette-question";
        button.textContent = index + 1;

        button.setAttribute(
            "aria-label",
            `Go to question ${index + 1}`
        );

        button.addEventListener("click", async function() {

            if (timeRemaining <= 0 || isSubmitting) {
                return;
            }

            currentQuestionIndex = index;

            await renderQuestion();
            updateNavigation();

            if (window.innerWidth <= 720) {
                closeMobilePalette();
            }

        });

        paletteGrid.appendChild(button);
    });

    updateQuestionPalette();
}


// ============================================
// UPDATE QUESTION PALETTE STATUS
// ============================================

function updateQuestionPalette() {

    if (!currentTest || !paletteGrid) return;

    let answered = 0;
    let visitedUnanswered = 0;
    let notVisited = 0;

    const buttons = paletteGrid.querySelectorAll(
        ".palette-question"
    );

    buttons.forEach((button, index) => {

        button.className = "palette-question";

        const isAnswered =
            selectedAnswers[index] !== null;

        const isVisited =
            visitedQuestions[index] === true;

        if (isAnswered) {

            answered++;
            button.classList.add("answered");

        } else if (isVisited) {

            visitedUnanswered++;
            button.classList.add("visited-unanswered");

        } else {

            notVisited++;
            button.classList.add("not-visited");
        }

        if (index === currentQuestionIndex) {

            button.classList.add("current");
            button.setAttribute("aria-current", "step");

        } else {

            button.removeAttribute("aria-current");
        }
    });

    if (answeredCount) {
        answeredCount.textContent = answered;
    }

    if (unansweredCount) {
        unansweredCount.textContent = visitedUnanswered;
    }

    if (notVisitedCount) {
        notVisitedCount.textContent = notVisited;
    }
}


// ============================================
// MOBILE PALETTE
// ============================================

function closeMobilePalette() {

    if (!questionPalette || !paletteToggle) return;

    questionPalette.classList.remove("mobile-open");

    paletteToggle.setAttribute("aria-expanded", "false");
    paletteToggle.textContent = "☰ Question Palette";
}

if (paletteToggle && questionPalette) {

    paletteToggle.addEventListener("click", function() {

        const isOpen =
            questionPalette.classList.toggle("mobile-open");

        paletteToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        paletteToggle.textContent = isOpen
            ? "✕ Close Question Palette"
            : "☰ Question Palette";
    });
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

        if (
            !currentTest ||
            !Array.isArray(currentTest.questions) ||
            currentTest.questions.length === 0
        ) {
            throw new Error("No questions were found in the test data.");
        }

        // Validate question structure.
        currentTest.questions.forEach((question, index) => {

            if (
                typeof question.question !== "string" ||
                !Array.isArray(question.options) ||
                question.options.length !== 4 ||
                !Number.isInteger(question.correctAnswer) ||
                question.correctAnswer < 0 ||
                question.correctAnswer > 3
            ) {
                throw new Error(
                    `Invalid question data at question ${index + 1}.`
                );
            }

        });

        const duration =
            Number(currentTest.duration ?? currentTest.durationMinutes);

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error("Invalid test duration.");
        }

        selectedAnswers = Array(
            currentTest.questions.length
        ).fill(null);

        visitedQuestions = Array(
            currentTest.questions.length
        ).fill(false);

        testTitle.textContent = currentTest.title;

        testDetails.textContent =
            `${currentTest.class} | ${currentTest.subject} | Test Type: ${currentTest.testType || "Not specified"}`;

        // Show instructions instead of starting the test.
        showTestInstructions();

        if (instructionScreen) {
            instructionScreen.hidden = false;
        }

        if (testInterface) {
            testInterface.hidden = true;
        }

    } catch (error) {

        console.error("Test loading error:", error);

        if (testTitle) {
            testTitle.textContent = "Unable to load the test.";
        }

        if (instructionSummary) {
            instructionSummary.innerHTML = `
                <p class="test-message">
                    Unable to load the test questions.
                    Check the data file and browser Console.
                </p>
            `;
        }

        if (startTestButton) {
            startTestButton.disabled = true;
            startTestButton.textContent = "Test Unavailable";
        }
    }
}


// ============================================
// START TEST
// ============================================

async function startTest() {

    if (!currentTest || testStarted || isSubmitting) return;

    try {

        const duration =
            Number(currentTest.duration ?? currentTest.durationMinutes);

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error("Invalid test duration.");
        }

        // Count the attempt when the student starts.
        const attemptKey = "attempt_count_" + currentTest.id;

        const previousAttempts = Number.parseInt(
            localStorage.getItem(attemptKey) || "0",
            10
        );

        attemptNumber =
            (Number.isFinite(previousAttempts) && previousAttempts >= 0
                ? previousAttempts
                : 0) + 1;

        localStorage.setItem(
            attemptKey,
            String(attemptNumber)
        );

        // Record the actual start time.
        startTime = new Date();

        testStarted = true;

        currentQuestionIndex = 0;

        selectedAnswers = Array(
            currentTest.questions.length
        ).fill(null);

        visitedQuestions = Array(
            currentTest.questions.length
        ).fill(false);

        visitedQuestions[0] = true;

        // Switch from instructions to test interface.
        if (instructionScreen) {
            instructionScreen.hidden = true;
        }

        if (testInterface) {
            testInterface.hidden = false;
        }

        createQuestionPalette();

        await renderQuestion();

        updateNavigation();

        startTimer();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (error) {

        console.error("Could not start test:", error);

        if (testMessage) {
            testMessage.textContent =
                "Unable to start the test. Please reload the page.";
        }
    }
}

if (startTestButton) {
    startTestButton.addEventListener("click", startTest);
}


// ============================================
// RENDER QUESTION AND OPTIONS
// ============================================

async function renderQuestion() {

    if (!currentTest || !testStarted) return;

    const question =
        currentTest.questions[currentQuestionIndex];

    if (window.MathJax && window.MathJax.typesetClear) {

        window.MathJax.typesetClear([
            questionText,
            optionsContainer
        ]);
    }

    visitedQuestions[currentQuestionIndex] = true;

    questionProgress.textContent =
        `${currentQuestionIndex + 1} of ${currentTest.questions.length}`;

    questionNumber.textContent =
        `Question ${currentQuestionIndex + 1}`;

    questionText.innerHTML =
        formatMathText(question.question);

    optionsContainer.innerHTML = "";

    optionsContainer.style.display = "flex";
    optionsContainer.style.flexDirection = "column";
    optionsContainer.style.alignItems = "stretch";
    optionsContainer.style.gap = "12px";

    testMessage.textContent = "";

    question.options.forEach((option, index) => {

        const label = document.createElement("label");

        label.className = "option-item";

        label.style.display = "flex";
        label.style.flexDirection = "row";
        label.style.alignItems = "flex-start";
        label.style.gap = "12px";
        label.style.width = "100%";
        label.style.boxSizing = "border-box";
        label.style.marginBottom = "0";

        const radio = document.createElement("input");

        radio.type = "radio";
        radio.name = "answer";
        radio.value = index;

        radio.style.flexShrink = "0";
        radio.style.marginTop = "4px";

        radio.checked =
            selectedAnswers[currentQuestionIndex] === index;

        radio.addEventListener("change", function() {

            selectedAnswers[currentQuestionIndex] = index;

            updateQuestionPalette();
        });

        const optionText = document.createElement("span");

        optionText.style.display = "block";
        optionText.style.flex = "1";
        optionText.style.minWidth = "0";

        optionText.innerHTML =
            `${String.fromCharCode(65 + index)}. ` +
            formatMathText(option);

        label.appendChild(radio);
        label.appendChild(optionText);

        optionsContainer.appendChild(label);
    });

    updateQuestionPalette();

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
        currentQuestionIndex === 0 || timeRemaining <= 0;

    nextButton.style.display =
        currentQuestionIndex === currentTest.questions.length - 1
            ? "none"
            : "inline-flex";

    updateQuestionPalette();
}


previousButton.addEventListener("click", async function() {

    if (
        testStarted &&
        currentQuestionIndex > 0 &&
        timeRemaining > 0 &&
        !isSubmitting
    ) {

        currentQuestionIndex--;

        await renderQuestion();

        updateNavigation();
    }
});


nextButton.addEventListener("click", async function() {

    if (
        testStarted &&
        currentTest &&
        currentQuestionIndex < currentTest.questions.length - 1 &&
        timeRemaining > 0 &&
        !isSubmitting
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

    const duration =
        currentTest.duration ?? currentTest.durationMinutes;

    timeRemaining = Number(duration) * 60;

    if (!Number.isFinite(timeRemaining) || timeRemaining <= 0) {
        throw new Error("Invalid test duration.");
    }

    console.log("Selected test:", currentTest.id);
    console.log("Duration:", duration);
    console.log("Attempt number:", attemptNumber);
    console.log("Start time:", startTime);

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
                "Time is up! Your test is being submitted.";

            submitTest(true);
        }

    }, 1000);
}


// ============================================
// SUBMIT TEST
// ============================================

function submitTest(autoSubmit = false) {

    if (!currentTest || !testStarted || isSubmitting) return;

    if (!autoSubmit) {

        const confirmed = confirm(
            "Are you sure you want to submit your test?"
        );

        if (!confirmed) return;
    }

    isSubmitting = true;

    clearInterval(timerInterval);

    endTime = new Date();

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let answeredQuestions = 0;

    const marksPerQuestion =
        currentTest.marksPerQuestion ?? 1;

    const negativeMarks =
        currentTest.negativeMarks ?? 0;

    currentTest.questions.forEach((question, index) => {

        if (selectedAnswers[index] === null) {

            unattempted++;

        } else {

            answeredQuestions++;

            if (selectedAnswers[index] === question.correctAnswer) {
                correct++;
            } else {
                wrong++;
            }
        }
    });

    const score =
        (correct * marksPerQuestion) -
        (wrong * negativeMarks);

    const timeTakenSeconds = Math.max(
        0,
        Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    );

    const result = {
        testId: currentTest.id,
        testTitle: currentTest.title,
        className: currentTest.class,
        subject: currentTest.subject,

        totalQuestions: currentTest.questions.length,
        answeredQuestions,
        correct,
        wrong,
        unattempted,

        score,
        marksPerQuestion,
        negativeMarks,

        attemptNumber,

        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        timeTakenSeconds,
        timeTaken: formatDuration(timeTakenSeconds),

        autoSubmitted: autoSubmit,

        questions: currentTest.questions,
        selectedAnswers: [...selectedAnswers]
    };

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

    if (isSubmitting || !testStarted) return;

    submitTest(false);
});


// ============================================
// START
// ============================================

loadTest();
