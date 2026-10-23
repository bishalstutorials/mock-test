
function downloadResultPDF(result) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF library could not load. Please check your internet connection.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Load the institute logo before creating the PDF
    const logoImage = new Image();
    logoImage.src = "assets/logo.png";

    logoImage.onload = function () {
        createPDF();
    };

    logoImage.onerror = function () {
        alert("Logo could not be loaded. Please check that assets/logo.png exists.");
        createPDF();
    };

    function addText(text, size = 11, style = "normal") {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);

        const lines = doc.splitTextToSize(String(text), maxWidth);

        if (y + lines.length * (size * 0.45) > pageHeight - 15) {
            doc.addPage();
            y = 20;
        }

        doc.text(lines, margin, y);
        y += lines.length * (size * 0.45) + 3;
    }

    function createPDF() {
        
        // Add the institute logo
        if (logoImage.complete && logoImage.naturalWidth > 0) {
            const logoWidth = 60;
            const logoHeight = 40
                logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);

            doc.addImage(
                logoImage,
                "PNG",
                margin,
                3,
                logoWidth,
                logoHeight
            );
        }

        // Institute name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Bishal's Tutorials", margin + 53, 20);

        // Tagline directly below the institute name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("LEARN & SUCCEED", margin + 53, 28);

        // Start the report content below the header
        y = 45;

        addText("MOCK TEST RESULT", 15, "bold");
        addText(`Test: ${result.testTitle}`);
        addText(`Class: ${result.className}`);
        addText(`Subject: ${result.subject}`);
        addText(
            `Score: ${result.score} / ${result.totalQuestions * result.marksPerQuestion}`
        );
        addText(
            `Correct: ${result.correct} | Wrong: ${result.wrong} | Unattempted: ${result.unattempted}`
        );

        y += 5;
        addText("ANSWER REVIEW", 13, "bold");

        result.questions.forEach((question, index) => {
            const chosen = result.selectedAnswers[index];

            const chosenText = chosen === null
                ? "Unattempted"
                : `${String.fromCharCode(65 + chosen)}. ${question.options[chosen]}`;

            const correctText =
                `${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}`;

            y += 2;
            addText(`Q${index + 1}. ${question.text}`, 11, "bold");
            addText(`Your answer: ${chosenText}`);
            addText(`Correct answer: ${correctText}`);
        });

        doc.save("Bishals-Tutorials-Test-Result.pdf");
    }
}
