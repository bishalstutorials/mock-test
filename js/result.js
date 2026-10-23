
const resultYear = document.getElementById("result-year");

if (resultYear) {
    resultYear.textContent = new Date().getFullYear();
}

const resultText = sessionStorage.getItem("mockTestResult");

const resultTitle = document.getElementById("result-title");
const resultScore = document.getElementById("result-score");
const resultCorrect = document.getElementById("result-correct");
const resultSummary = document.getElementById("result-summary");
const downloadPdfButton = document.getElementById("download-pdf-button");

let result = null;

if (!resultText) {
    resultTitle.textContent =
        "No test result found. Please take a test first.";

    if (downloadPdfButton) {
        downloadPdfButton.disabled = true;
    }
} else {
    try {
        result = JSON.parse(resultText);

        resultTitle.textContent =
            `${result.testTitle} | ${result.className} | ${result.subject}`;

        resultScore.textContent =
            `${result.score} / ${result.totalQuestions * result.marksPerQuestion}`;

        resultCorrect.textContent =
            `${result.correct} / ${result.totalQuestions}`;

        resultSummary.textContent =
            `Wrong: ${result.wrong} | Unattempted: ${result.unattempted}`;
    } catch (error) {
        result = null;

        resultTitle.textContent =
            "Unable to load the test result. Please take the test again.";

        if (downloadPdfButton) {
            downloadPdfButton.disabled = true;
        }
    }
}

// Connect the PDF download button
if (downloadPdfButton) {
    downloadPdfButton.addEventListener("click", function () {
        if (!result) {
            alert("No test result found. Please take a test first.");
            return;
        }

        if (typeof downloadResultPDF !== "function") {
            alert("PDF function not found. Please check js/pdf.js.");
            return;
        }

        downloadResultPDF(result);
    });
}
