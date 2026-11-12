
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

    // Convert ordinary fractions into stacked mathematical fractions.
    // Existing LaTeX expressions are preserved.
    function convertFractions(text) {
        const mathPattern =
            /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g;

        return text.split(mathPattern).map(part => {
            // Do not modify existing mathematical expressions.
            if (
                part.startsWith("\\(") ||
                part.startsWith("\\[") ||
                part.startsWith("$$") ||
                part.startsWith("$")
            ) {
                return part;
            }

            // Convert numeric and simple algebraic fractions.
            return part.replace(
                /(?<![\w.])([A-Za-z][A-Za-z0-9₀-₉]*|\d+)\s*\/\s*([A-Za-z][A-Za-z0-9₀-₉]*|\d+)(?![\w.])/g,
                (match, numerator, denominator) => {
                    return `\\(\\frac{${numerator}}{${denominator}}\\)`;
                }
            );
        }).join("");
    }

    // Format Markdown and preserve mathematical expressions.
    function renderRichText(value) {
        let text = String(value ?? "").replace(/\r\n?/g, "\n");

        // Convert simple fractions before escaping HTML.
        text = convertFractions(text);

        return text.split("\n").map(line => {
            // Remove Markdown heading markers.
            line = line.replace(/^\s{0,3}#{1,6}\s*/, "");

            // Escape HTML safely.
            let safeLine = escapeHTML(line);

            // Basic Markdown formatting.
            safeLine = safeLine
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>");

            return safeLine;
        }).join("<br>");
    }

    function getAnswer(index) {
        const answer = result.selectedAnswers[index];

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
                Q${index + 1}. ${renderRichText(question.text)}
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

    const totalMarks =
        result.totalQuestions * result.marksPerQuestion;

    const html = `
    <!DOCTYPE html>
    <html lang="as">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Bishal's Tutorials - Test Result</title>

        <!-- Assamese and Bengali Unicode font -->
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

                .question {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
            }
        </style>

        <script>
            window.MathJax = {
                tex: {
                    inlineMath: [['\\(', '\\)'], ['$', '$']],
                    displayMath: [['\\[', '\\]'], ['$$', '$$']],
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
                <div>
                    <strong>Test:</strong>
                    ${escapeHTML(result.testTitle)}
                </div>

                <div>
                    <strong>Class:</strong>
                    ${escapeHTML(result.className)}
                </div>

                <div>
                    <strong>Subject:</strong>
                    ${escapeHTML(result.subject)}
                </div>

                <div>
                    <strong>Score:</strong>
                    ${escapeHTML(result.score)} / ${escapeHTML(totalMarks)}
                </div>

                <div>
                    <strong>Correct:</strong> ${escapeHTML(result.correct)}
                    &nbsp; | &nbsp;
                    <strong>Wrong:</strong> ${escapeHTML(result.wrong)}
                    &nbsp; | &nbsp;
                    <strong>Unattempted:</strong> ${escapeHTML(result.unattempted)}
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
                    // Wait for the Assamese font.
                    await document.fonts.ready;

                    // Wait for MathJax to load.
                    await new Promise((resolve, reject) => {
                        const start = Date.now();

                        const check = setInterval(() => {
                            if (
                                window.MathJax &&
                                window.MathJax.startup &&
                                window.MathJax.startup.promise
                            ) {
                                clearInterval(check);
                                resolve();
                            } else if (Date.now() - start > 20000) {
                                clearInterval(check);
                                reject(new Error("MathJax loading timed out."));
                            }
                        }, 100);
                    });

                    await MathJax.startup.promise;

                    // Render all mathematical expressions.
                    await MathJax.typesetPromise();

                    await document.fonts.ready;

                } catch (error) {
                    console.error("PDF rendering error:", error);

                    alert(
                        "Mathematical formatting failed to load. " +
                        "Please check your internet connection."
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
