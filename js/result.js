
const resultYear = document.getElementById("result-year");

if (resultYear) {
    resultYear.textContent = new Date().getFullYear();
}

const resultText = sessionStorage.getItem("mockTestResult");

const resultTitle = document.getElementById("result-title");
const resultStartTime = document.getElementById("result-start-time");
const resultEndTime = document.getElementById("result-end-time");
const resultAttempt = document.getElementById("result-attempt");
const resultTimeTaken = document.getElementById("result-time-taken");
const resultScore = document.getElementById("result-score");
const resultCorrect = document.getElementById("result-correct");
const resultWrong = document.getElementById("result-wrong");
const resultAnswered = document.getElementById("result-answered");
const resultSummary = document.getElementById("result-summary");
const downloadPdfButton = document.getElementById("download-pdf-button");

let result = null;

function displayValue(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function formatDateTime(value) {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

function getAttemptLabel(number) {
    number = Number(number);

    if (!Number.isInteger(number) || number < 1) {
        number = 1;
    }

    let suffix = "th";

    if (number % 100 < 11 || number % 100 > 13) {
        switch (number % 10) {
            case 1:
                suffix = "st";
                break;
            case 2:
                suffix = "nd";
                break;
            case 3:
                suffix = "rd";
                break;
        }
    }

    return `${number}${suffix} Attempt`;
}

function showError(message) {
    displayValue(resultTitle, message);

    if (downloadPdfButton) {
        downloadPdfButton.disabled = true;
    }
}

if (!resultText) {
    showError("No test result found. Please take a test first.");
} else {
    try {
        result = JSON.parse(resultText);

        if (
            !result ||
            !Array.isArray(result.questions) ||
            !Array.isArray(result.selectedAnswers)
        ) {
            throw new Error("Invalid result data.");
        }

        const totalQuestions = Number(result.totalQuestions) || result.questions.length;
        const marksPerQuestion = Number(result.marksPerQuestion) || 0;
        const totalMarks = totalQuestions * marksPerQuestion;

        const score = Number(result.score) || 0;
        const correct = Number(result.correct) || 0;
        const wrong = Number(result.wrong) || 0;
        const unattempted = Number(result.unattempted) || 0;

        const answeredQuestions =
            Number.isFinite(Number(result.answeredQuestions))
                ? Number(result.answeredQuestions)
                : Math.max(0, totalQuestions - unattempted);

        displayValue(
            resultTitle,
            `${result.testTitle || "Mock Test"} | ${result.className || ""} | ${result.subject || ""}`
        );

        displayValue(resultStartTime, formatDateTime(result.startTime));
        displayValue(resultEndTime, formatDateTime(result.endTime));
        displayValue(resultAttempt, getAttemptLabel(result.attemptNumber));

        displayValue(
            resultTimeTaken,
            result.timeTaken || "Not available"
        );

        displayValue(
            resultScore,
            `${score} / ${totalMarks}`
        );

        displayValue(
            resultCorrect,
            `${correct} / ${totalQuestions}`
        );

        displayValue(
            resultWrong,
            `${wrong} / ${totalQuestions}`
        );

        displayValue(
            resultAnswered,
            `${answeredQuestions} / ${totalQuestions}`
        );

        displayValue(
            resultSummary,
            `Unattempted Questions: ${unattempted}`
        );

    } catch (error) {
        console.error("Result loading error:", error);
        result = null;

        showError(
            "Unable to load the test result. Please take the test again."
        );
    }
}

// Connect the PDF download button.
if (downloadPdfButton) {
    downloadPdfButton.addEventListener("click", function () {
        if (!result) {
            alert("No valid test result found. Please take a test first.");
            return;
        }

        if (typeof downloadResultPDF !== "function") {
            alert("PDF function not found. Please check js/pdf.js.");
            return;
        }

        downloadResultPDF(result);
    });
}
