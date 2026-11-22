
function downloadResultPDF(result) {
    if (!result || !Array.isArray(result.questions)) {
        alert("Result data is missing or invalid.");
        return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups for this website.");
        return;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function convertFractions(text) {
        const mathPattern =
            /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g;

        return text.split(mathPattern).map(part => {
            if (
                part.startsWith("\\(") ||
                part.startsWith("\\[") ||
                part.startsWith("$$") ||
                part.startsWith("$")
            ) {
                return part;
            }

            return part.replace(
                /(?<![\w.])([A-Za-z][A-Za-z0-9₀-₉]*|\d+)\s*\/\s*([A-Za-z][A-Za-z0-9₀-₉]*|\d+)(?![\w.])/g,
                (match, numerator, denominator) =>
                    `\\(\\frac{${numerator}}{${denominator}}\\)`
            );
        }).join("");
    }

    function renderRichText(value) {
        let text = String(value ?? "").replace(/\r\n?/g, "\n");

        text = convertFractions(text);

        return text.split("\n").map(line => {
            line = line.replace(/^\s{0,3}#{1,6}\s*/, "");

            let safeLine = escapeHTML(line);

            safeLine = safeLine
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>");

            return safeLine;
        }).join("<br>");
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

    function getAttemptSuffix(number) {
        if (number % 100 >= 11 && number % 100 <= 13) {
            return "th";
        }

        switch (number % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    const attemptNumber =
        Number.isInteger(result.attemptNumber) &&
        result.attemptNumber > 0
            ? result.attemptNumber
            : 1;

    const attemptLabel =
        `${attemptNumber}${getAttemptSuffix(attemptNumber)} Attempt`;

    const totalQuestions =
        Number(result.totalQuestions) || result.questions.length;

    const marksPerQuestion =
        Number(result.marksPerQuestion) || 0;

    const totalMarks =
        totalQuestions * marksPerQuestion;

    const score = Number(result.score) || 0;
    const correct = Number(result.correct) || 0;
    const wrong = Number(result.wrong) || 0;
    const unattempted = Number(result.unattempted) || 0;

    const answeredQuestions =
        Number.isFinite(Number(result.answeredQuestions))
            ? Number(result.answeredQuestions)
            : Math.max(0, totalQuestions - unattempted);

    const startTime = formatDateTime(result.startTime);
    const endTime = formatDateTime(result.endTime);
    const timeTaken = result.timeTaken || "Not available";

    function getAnswer(index) {
        const answer = result.selectedAnswers?.[index];

        if (answer === null || answer === undefined) {
            return "Unattempted";
        }

        return String.fromCharCode(65 + answer) + ". " +
            (result.questions[index].options?.[answer] ?? "");
    }

    function getCorrectAnswer(question) {
        return String.fromCharCode(65 + question.correctAnswer) +
            ". " + (question.options?.[question.correctAnswer] ?? "");
    }

    const questionHTML = result.questions.map((question, index) => `
        <div class="question">
            <div class="question-text">
                Q${index + 1}. ${renderRichText(question.question)}
            </div>

            <p>
                <strong>Your answer:</strong>
                ${renderRichText(getAnswer(index))}
            </p>

            <p>
                <strong>Correct answer:</strong>
                ${renderRichText(getCorrectAnswer(question))}
            </p>
        </div>
    `).join("");

    const html = `
    <!DOCTYPE html>
    <html lang="as">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Bishal's Tutorials - Test Result</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

        <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
            rel="stylesheet"
        >

        <style>
            * {
                box-sizing: border-box;
            }

            body {
                font-family:
                    "Noto Sans Bengali",
                    "Nirmala UI",
                    "Vrinda",
                    sans-serif;

                color: #111;
                background: white;
                font-size: 12pt;
                line-height: 1.9;
                margin: 0;
                font-kerning: normal;
                font-feature-settings: "kern" 1, "liga" 1;
                letter-spacing: normal;
            }

            .page {
                max-width: 850px;
                margin: 25px auto;
                padding: 25px;
            }

            .header {
                display: flex;
                align-items: center;
                gap: 22px;
                border-bottom: 2px solid #12346b;
                padding-bottom: 18px;
                margin-bottom: 28px;
            }

            .logo {
                width: 105px;
                height: auto;
                object-fit: contain;
            }

            .institute-name {
                font-size: 25px;
                font-weight: bold;
                color: #12346b;
            }

            .tagline {
                font-size: 13px;
                font-weight: bold;
                letter-spacing: 1px;
            }

            h2 {
                font-size: 20px;
                margin-bottom: 18px;
            }

            .summary {
                line-height: 2;
                margin-bottom: 30px;
                padding: 15px 18px;
                border: 1px solid #ccc;
                border-radius: 6px;
            }

            .summary-row {
                display: flex;
                justify-content: space-between;
                gap: 15px;
                padding: 3px 0;
                border-bottom: 1px solid #eee;
            }

            .summary-row:last-child {
                border-bottom: none;
            }

            .summary-label {
                font-weight: bold;
            }

            .attempt-number {
                font-weight: bold;
                color: #12346b;
            }

            .section-title {
                font-size: 17px;
                font-weight: bold;
                border-bottom: 1px solid #999;
                padding-bottom: 8px;
                margin: 28px 0 20px;
            }

            .question {
                margin-bottom: 26px;
                padding-bottom: 18px;
                border-bottom: 1px solid #ddd;
                break-inside: avoid;
                page-break-inside: avoid;
            }

            .question-text {
                font-weight: bold;
                margin-bottom: 12px;
                overflow-wrap: anywhere;
            }

            .question p {
                margin: 7px 0;
                overflow-wrap: anywhere;
            }

            .question h1,
            .question h2,
            .question h3,
            .question h4 {
                font-family: inherit;
                font-size: 1em;
                line-height: 1.9;
                display: inline;
                margin: 0;
            }

            mjx-container {
                max-width: 100%;
            }

            mjx-container[display="true"] {
                overflow-x: auto;
                overflow-y: hidden;
                padding: 4px 0;
            }

            .footer {
                margin-top: 35px;
                padding-top: 12px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 10px;
            }

            @page {
                size: A4;
                margin: 20mm;
            }

            @media print {
                body {
                    font-size: 11.5pt;
                    line-height: 1.85;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .page {
                    max-width: none;
                    margin: 0;
                    padding: 0;
                }

                .summary {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .question {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
            }
        </style>

        <script>
            window.MathJax = {
                tex: {
                    inlineMath: [
                        ['\\\\(', '\\\\)'],
                        ['$', '$']
                    ],
                    displayMath: [
                        ['\\\\[', '\\\\]'],
                        ['$$', '$$']
                    ],
                    processEscapes: true
                },
                svg: {
                    fontCache: 'global'
                },
                startup: {
                    typeset: false
                }
            };
        </script>

        <script
            defer
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js">
        </script>
    </head>

    <body>
        <main class="page">

            <header class="header">
                <img
                    class="logo"
                    src="https://bishalstutorials.github.io/mock-test/assets/logo.png"
                    alt="Bishal's Tutorials"
                >

                <div>
                    <div class="institute-name">
                        Bishal's Tutorials
                    </div>

                    <div class="tagline">
                        LEARN &amp; SUCCEED
                    </div>
                </div>
            </header>

            <h2>MOCK TEST RESULT</h2>

            <div class="summary">

                <div class="summary-row">
                    <span class="summary-label">Test:</span>
                    <span>${escapeHTML(result.testTitle)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Class:</span>
                    <span>${escapeHTML(result.className)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Subject:</span>
                    <span>${escapeHTML(result.subject)}</span>
                </div>

                <div class="summary-row attempt-number">
                    <span>Attempt Number:</span>
                    <span>${escapeHTML(attemptLabel)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Start Time:</span>
                    <span>${escapeHTML(startTime)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">End Time:</span>
                    <span>${escapeHTML(endTime)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Time Taken:</span>
                    <span>${escapeHTML(timeTaken)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Marks:</span>
                    <span>${escapeHTML(score)} / ${escapeHTML(totalMarks)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Correct Answers:</span>
                    <span>${escapeHTML(correct)} / ${escapeHTML(totalQuestions)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Wrong Answers:</span>
                    <span>${escapeHTML(wrong)} / ${escapeHTML(totalQuestions)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Answered Questions:</span>
                    <span>${escapeHTML(answeredQuestions)} / ${escapeHTML(totalQuestions)}</span>
                </div>

                <div class="summary-row">
                    <span class="summary-label">Unattempted Questions:</span>
                    <span>${escapeHTML(unattempted)}</span>
                </div>

            </div>

            <div class="section-title">ANSWER REVIEW</div>

            ${questionHTML}

            <div class="footer">
                Bishal's Tutorials | LEARN &amp; SUCCEED
            </div>

        </main>

        <script>
            async function preparePDF() {
                try {
                    await document.fonts.ready;

                    const start = Date.now();

                    while (
                        !window.MathJax ||
                        !window.MathJax.startup ||
                        !window.MathJax.startup.promise
                    ) {
                        if (Date.now() - start > 30000) {
                            throw new Error("MathJax loading timed out.");
                        }

                        await new Promise(resolve =>
                            setTimeout(resolve, 100)
                        );
                    }

                    await MathJax.startup.promise;

                    await MathJax.typesetPromise([
                        document.querySelector(".page")
                    ]);

                    await document.fonts.ready;

                    await new Promise(resolve =>
                        requestAnimationFrame(() =>
                            requestAnimationFrame(resolve)
                        )
                    );

                } catch (error) {
                    console.error("PDF rendering error:", error);

                    alert(
                        "Mathematical formatting failed to load. " +
                        "Please check your internet connection and try again."
                    );

                    return;
                }

                window.focus();

                setTimeout(() => {
                    window.print();
                }, 500);
            }

            window.addEventListener("load", preparePDF);
        </script>
    </body>
    </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}
