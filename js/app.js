
const yearElement = document.getElementById("current-year");
const startButton = document.getElementById("start-button");
const statusMessage = document.getElementById("status-message");

const mockTestsSection = document.getElementById("mock-tests-section");
const testList = document.getElementById("test-list");

const classFilter = document.getElementById("class-filter");
const subjectFilter = document.getElementById("subject-filter");
const chapterFilter = document.getElementById("chapter-filter");
const languageFilter = document.getElementById("language-filter");
const testTypeFilter = document.getElementById("test-type-filter");
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

        if (statusMessage) {
            statusMessage.textContent =
                "Choose a test below to begin.";
        }

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
        updateFiltersForTestType();
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

// Populate all filter dropdowns
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

    populateDropdown(
        languageFilter,
        "All Languages",
        allTests.map(test => test.language)
    );

    updateChapterFilter();
}

// Add unique values to a dropdown
function populateDropdown(dropdown, defaultLabel, values) {
    if (!dropdown) return;

    const previousValue = dropdown.value;

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

    // Preserve the previous selection if it still exists
    if (
        previousValue !== "all" &&
        uniqueValues.includes(previousValue)
    ) {
        dropdown.value = previousValue;
    }
}

// Update Chapter dropdown according to Class and Subject
function updateChapterFilter() {
    if (!classFilter || !subjectFilter || !chapterFilter) return;

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

// Enable or disable filters according to the selected test type
function updateFiltersForTestType() {
    if (!testTypeFilter) return;

    const selectedType = testTypeFilter.value;

    const disableSubject = selectedType === "complete";

    const disableChapter =
        selectedType === "subject" ||
        selectedType === "complete";

    if (subjectFilter) {
        subjectFilter.disabled = disableSubject;

        if (disableSubject) {
            subjectFilter.value = "all";
        }
    }

    if (chapterFilter) {
        chapterFilter.disabled = disableChapter;

        if (disableChapter) {
            chapterFilter.value = "all";
        }
    }

    updateChapterFilter();

    // Keep Chapter disabled after updating its available options
    if (chapterFilter) {
        chapterFilter.disabled = disableChapter;
    }
}

// Display tests matching all selected filters
function renderTests() {
    const selectedClass = classFilter.value;
    const selectedSubject = subjectFilter.value;
    const selectedChapter = chapterFilter.value;

    const selectedLanguage = languageFilter
        ? languageFilter.value
        : "all";

    const selectedTestType = testTypeFilter
        ? testTypeFilter.value
        : "all";

    const filteredTests = allTests.filter(function (test) {
        const matchesClass =
            selectedClass === "all" ||
            test.class === selectedClass;

        const matchesSubject =
            selectedTestType === "complete" ||
            selectedSubject === "all" ||
            test.subject === selectedSubject;

        const matchesChapter =
            selectedTestType === "subject" ||
            selectedTestType === "complete" ||
            selectedChapter === "all" ||
            test.chapter === selectedChapter;

        const matchesLanguage =
            selectedLanguage === "all" ||
            (test.language || "").toLowerCase() ===
            selectedLanguage.toLowerCase();

        const matchesTestType =
            selectedTestType === "all" ||
            (test.testType || "").toLowerCase() ===
            selectedTestType.toLowerCase();

        return (
            matchesClass &&
            matchesSubject &&
            matchesChapter &&
            matchesLanguage &&
            matchesTestType
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

        const languageInfo = document.createElement("p");
        languageInfo.textContent =
            "Language: " + (test.language || "Not specified");

        const testTypeLabels = {
            chapter: "Chapter Test",
            subject: "Subject Test",
            complete: "Complete All Subject Test"
        };

        const testTypeInfo = document.createElement("p");
        const normalizedTestType =
            (test.testType || "").toLowerCase();

        testTypeInfo.textContent =
            "Test Type: " +
            (testTypeLabels[normalizedTestType] ||
                "Not specified");

        const durationInfo = document.createElement("p");
        durationInfo.textContent =
            "Duration: " +
            (test.durationMinutes ?? test.duration ?? 0) +
            " minutes";

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
        card.appendChild(languageInfo);
        card.appendChild(testTypeInfo);
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

// Update results when Language changes
if (languageFilter) {
    languageFilter.addEventListener("change", renderTests);
}

// Update filters and results when Test Type changes
if (testTypeFilter) {
    testTypeFilter.addEventListener("change", function () {
        updateFiltersForTestType();
        renderTests();
    });
}

// Reset all filters
if (resetFiltersButton) {
    resetFiltersButton.addEventListener("click", function () {
        classFilter.value = "all";
        subjectFilter.value = "all";
        chapterFilter.value = "all";

        if (languageFilter) {
            languageFilter.value = "all";
        }

        if (testTypeFilter) {
            testTypeFilter.value = "all";
        }

        updateFiltersForTestType();
        updateChapterFilter();

        chapterFilter.value = "all";

        renderTests();
    });
}
