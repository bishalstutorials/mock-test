
const yearElement = document.getElementById("current-year");
const startButton = document.getElementById("start-button");
const statusMessage = document.getElementById("status-message");

const mockTestsSection = document.getElementById("mock-tests-section");
const testList = document.getElementById("test-list");

const classFilter = document.getElementById("class-filter");
const subjectFilter = document.getElementById("subject-filter");
const chapterFilter = document.getElementById("chapter-filter");
const resetFiltersButton = document.getElementById("reset-filters");
const testCount = document.getElementById("test-count");

let allTests = [];

// Display the current year
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Open the mock-test catalogue
if (startButton) {
    startButton.addEventListener("click", function () {
        mockTestsSection.hidden = false;

        mockTestsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        startButton.disabled = true;
        startButton.textContent = "Mock Tests Available";

        statusMessage.textContent = "Choose a test below to begin.";

        loadMockTests();
    });
}

// Load available tests
async function loadMockTests() {
    testList.innerHTML =
        '<p class="test-list-message">Loading available tests...</p>';

    try {
        const response = await fetch("data/tests.json");

        if (!response.ok) {
            throw new Error("Could not load test data.");
        }

        const data = await response.json();

        allTests = Array.isArray(data.tests) ? data.tests : [];

        if (allTests.length === 0) {
            testList.innerHTML =
                '<p class="test-list-message">No mock tests are available yet.</p>';

            testCount.textContent = "0 tests available";
            return;
        }

        populateFilters();
        renderTests();

    } catch (error) {
        console.error("Error loading mock tests:", error);

        testList.innerHTML =
            '<p class="test-list-message">' +
            'Unable to load mock tests. Please check Live Server and ' +
            'the data/tests.json file.' +
            '</p>';

        testCount.textContent = "";
    }
}

// Populate Class and Subject dropdowns
function populateFilters() {
    populateDropdown(
        classFilter,
        "All Classes",
        allTests.map(test => test.class)
    );

    populateDropdown(
        subjectFilter,
        "All Subjects",
        allTests.map(test => test.subject)
    );

    // Chapters depend on the selected Class and Subject
    updateChapterFilter();
}

// Add unique values to a dropdown
function populateDropdown(dropdown, defaultLabel, values) {
    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "all";
    defaultOption.textContent = defaultLabel;

    dropdown.appendChild(defaultOption);

    const uniqueValues = [...new Set(
        values
            .filter(
                value =>
                    typeof value === "string" &&
                    value.trim() !== ""
            )
            .map(value => value.trim())
    )].sort((a, b) => a.localeCompare(b));

    uniqueValues.forEach(function (value) {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = value;

        dropdown.appendChild(option);
    });
}

// Update Chapter dropdown according to Class and Subject
function updateChapterFilter() {
    const selectedClass = classFilter.value;
    const selectedSubject = subjectFilter.value;
    const previousChapter = chapterFilter.value;

    const relevantTests = allTests.filter(function (test) {
        const matchesClass =
            selectedClass === "all" ||
            test.class === selectedClass;

        const matchesSubject =
            selectedSubject === "all" ||
            test.subject === selectedSubject;

        return matchesClass && matchesSubject;
    });

    const relevantChapters = relevantTests.map(
        test => test.chapter
    );

    populateDropdown(
        chapterFilter,
        "All Chapters",
        relevantChapters
    );

    // Preserve the selected chapter if it is still relevant
    if (
        previousChapter !== "all" &&
        relevantChapters.includes(previousChapter)
    ) {
        chapterFilter.value = previousChapter;
    }
}

// Display tests matching the selected filters
function renderTests() {
    const selectedClass = classFilter.value;
    const selectedSubject = subjectFilter.value;
    const selectedChapter = chapterFilter.value;

    const filteredTests = allTests.filter(function (test) {
        const matchesClass =
            selectedClass === "all" ||
            test.class === selectedClass;

        const matchesSubject =
            selectedSubject === "all" ||
            test.subject === selectedSubject;

        const matchesChapter =
            selectedChapter === "all" ||
            test.chapter === selectedChapter;

        return (
            matchesClass &&
            matchesSubject &&
            matchesChapter
        );
    });

    testList.innerHTML = "";

    testCount.textContent =
        "Showing " +
        filteredTests.length +
        (filteredTests.length === 1 ? " test" : " tests");

    // Show a message when no tests match
    if (filteredTests.length === 0) {
        testList.innerHTML =
            '<p class="test-list-message">' +
            'No tests match these filters. Try different selections ' +
            'or click Reset Filters.' +
            '</p>';

        return;
    }

    // Create a card for each matching test
    filteredTests.forEach(function (test) {
        const card = document.createElement("article");
        card.className = "test-list-card";

        const title = document.createElement("h3");
        title.textContent = test.title || "Untitled Mock Test";

        const classInfo = document.createElement("p");
        classInfo.textContent =
            "Class: " + (test.class || "Not specified");

        const subjectInfo = document.createElement("p");
        subjectInfo.textContent =
            "Subject: " + (test.subject || "Not specified");

        const chapterInfo = document.createElement("p");
        chapterInfo.textContent =
            "Chapter: " + (test.chapter || "Not specified");

        const durationInfo = document.createElement("p");
        durationInfo.textContent =
            "Duration: " + (test.durationMinutes || 0) + " minutes";

        const questionInfo = document.createElement("p");
        questionInfo.textContent =
            "Questions: " +
            (Array.isArray(test.questions)
                ? test.questions.length
                : 0);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "primary-button";
        button.textContent = "Start Test →";

        button.addEventListener("click", function () {
            if (!test.id) {
                alert("This test is missing its test ID.");
                return;
            }

            window.location.href =
                "test.html?id=" + encodeURIComponent(test.id);
        });

        card.appendChild(title);
        card.appendChild(classInfo);
        card.appendChild(subjectInfo);
        card.appendChild(chapterInfo);
        card.appendChild(durationInfo);
        card.appendChild(questionInfo);
        card.appendChild(button);

        testList.appendChild(card);
    });
}

// Update chapters and results when Class changes
classFilter.addEventListener("change", function () {
    updateChapterFilter();
    renderTests();
});

// Update chapters and results when Subject changes
subjectFilter.addEventListener("change", function () {
    updateChapterFilter();
    renderTests();
});

// Update results when Chapter changes
chapterFilter.addEventListener("change", renderTests);

// Reset all filters
resetFiltersButton.addEventListener("click", function () {
    classFilter.value = "all";
    subjectFilter.value = "all";

    updateChapterFilter();

    chapterFilter.value = "all";

    renderTests();
});
