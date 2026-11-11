
function downloadResultPDF(result) {
    if (!result || !Array.isArray(result.questions)) {
        alert("Result data is missing or invalid.");
        return;
    }

    // Open a new printable document
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups for this website to download your result.");
        return;
    }

    // Safely display all question text, including Assamese characters
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    const totalMarks =
        result.totalQuestions * result.marksPerQuestion;

    const questionHTML = result.questions.map((question, index) => {
        const chosen = result.selectedAnswers[index];

        const yourAnswer = chosen === null || chosen === undefined
            ? "Unattempted"
            : String.fromCharCode(65 + chosen) + ". " +
              (question.options?.[chosen] ?? "");

        const correctAnswer =
            String.fromCharCode(65 + question.correctAnswer) + ". " +
            (question.options?.[question.correctAnswer] ?? "");

        return `
            <div class="question">
                <div class="question-text">
                    Q${index + 1}. ${escapeHTML(question.text)}
                </div>

                <p>
                    <strong>Your answer:</strong>
                    ${escapeHTML(yourAnswer)}
                </p>

                <p>
                    <strong>Correct answer:</strong>
                    ${escapeHTML(correctAnswer)}
                </p>
            </div>
        `;
    }).join("");

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Bishal's Tutorials - Test Result</title>

        <style>
            * {
                box-sizing: border-box;
            }

            body {
                font-family:
                    "Noto Sans Bengali",
                    "Nirmala UI",
                    "Vrinda",
                    "Arial Unicode MS",
                    sans-serif;

                color: #111;
                background: white;
                font-size: 12pt;
                line-height: 1.65;
                margin: 0;
            }

            .page {
                max-width: 800px;
                margin: 25px auto;
                padding: 25px;
            }

            .header {
                display: flex;
                align-items: center;
                gap: 20px;
                border-bottom: 2px solid #12346b;
                padding-bottom: 15px;
                margin-bottom: 25px;
            }

            .logo {
                width: 110px;
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
                margin-bottom: 15px;
            }

            .summary {
                line-height: 1.9;
                margin-bottom: 25px;
            }

            .section-title {
                font-size: 17px;
                font-weight: bold;
                border-bottom: 1px solid #999;
                padding-bottom: 7px;
                margin: 25px 0 15px;
            }

            .question {
                margin-bottom: 22px;
                padding-bottom: 14px;
                border-bottom: 1px solid #ddd;
                break-inside: avoid;
                page-break-inside: avoid;
            }

            .question-text {
                font-weight: bold;
                margin-bottom: 10px;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }

            .question p {
                margin: 5px 0;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }

            .footer {
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 10px;
            }

            @media print {
                @page {
                    size: A4;
                    margin: 15mm;
                }

                body {
                    font-size: 11pt;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .page {
                    max-width: none;
                    margin: 0;
                    padding: 0;
                }

                .question {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>

    <body>
        <main class="page">

            <header class="header">
                <img
                    class="logo"
                    src="assets/logo.png"
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
                <div><strong>Test:</strong>
                    ${escapeHTML(result.testTitle)}</div>

                <div><strong>Class:</strong>
                    ${escapeHTML(result.className)}</div>

                <div><strong>Subject:</strong>
                    ${escapeHTML(result.subject)}</div>

                <div><strong>Score:</strong>
                    ${escapeHTML(result.score)} / ${escapeHTML(totalMarks)}</div>

                <div>
                    <strong>Correct:</strong> ${escapeHTML(result.correct)}
                    &nbsp; | &nbsp;
                    <strong>Wrong:</strong> ${escapeHTML(result.wrong)}
                    &nbsp; | &nbsp;
                    <strong>Unattempted:</strong> ${escapeHTML(result.unattempted)}
                </div>
            </div>

            <div class="section-title">
                ANSWER REVIEW
            </div>

            ${questionHTML}

            <div class="footer">
                Bishal's Tutorials | LEARN &amp; SUCCEED
            </div>

        </main>

        <script>
            window.onload = function () {
                window.focus();
                setTimeout(function () {
                    window.print();
                }, 700);
            };
        </script>
    </body>
    </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}
