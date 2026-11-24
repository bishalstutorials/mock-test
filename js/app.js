
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
let testsLoaded = false;

// Display the current year
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Normalize text for reliable comparisons
function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

// Identify the category of a test
function getTestTypeCategory(value) {
    const normalized = normalizeText(value);

    if (
        normalized === "chapter" ||
        normalized === "chapter test"
    ) {
        return "chapter";
    }

    if (
        normalized === "subject" ||
        normalized === "subject test" ||
        normalized === "complete" ||
        normalized === "complete test" ||
        normalized === "complete all subject test" ||
        normalized === "complete subject test"
    ) {
        return "subject";
    }

    return normalized;
}

// Format test type for display
function formatTestType(value) {
    const category = getTestTypeCategory(value);

    if (category === "chapter") {
        return "Chapter Test";
    }

    if (category === "subject") {
        return "Subject Test";
    }

    return value ? String(value).trim() : "Not specified";
}

// Open the mock-test catalogue
if (startButton) {
    startButton.addEventListener("click", function () {
        if (mockTestsSection) {
            mockTestsSection.hidden = false;

            mockTestsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        startButton.disabled = true;
        startButton.textContent = "Mock Tests Available";

        if (statusMessage) {
            statusMessage.textContent =
                "Choose a test below to begin.";
        }

        if (!testsLoaded) {
            loadMockTests();
        }
    });
}

// Load teacher-selected active tests
async function loadMockTests() {
    if (!testList) return;

    testList.innerHTML =
        '<p class="test-list-message">Loading available tests...</p>';

    try {
        // Load active test configuration
        const activeResponse = await fetch(
            "data/active-test.json",
            { cache: "no-store" }
        );

        if (!activeResponse.ok) {
            throw new Error("Could not load active-test.json");
        }

        const activeData = await activeResponse.json();
        const activeTestId = activeData.activeTestId;

        if (
            !activeTestId ||
            (
                !Array.isArray(activeTestId) &&
                typeof activeTestId !== "string"
            )
        ) {
            throw new Error("Invalid active test configuration.");
        }

        // Load all test data
        const response = await fetch(
            "data/tests.json",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Could not load tests.json");
        }

        const data = await response.json();

        if (!Array.isArray(data.tests)) {
            throw new Error("The tests array is missing or invalid.");
        }

        // Support "all", a single ID, or multiple IDs.
        allTests = data.tests.filter(function (test) {

            if (activeTestId === "all") {
                return true;
            }

            if (Array.isArray(activeTestId)) {
                return activeTestId.includes(test.id);
            }

            return test.id === activeTestId;
        });

        if (allTests.length === 0) {
            testList.innerHTML =
                '<p class="test-list-message">' +
                'The selected test is unavailable. Please contact your teacher.' +
                '</p>';

            if (testCount) {
                testCount.textContent = "0 tests available";
            }

            return;
        }

        populateFilters();
        renderTests();

        testsLoaded = true;

    } catch (error) {
        console.error("Error loading active tests:", error);

        testList.innerHTML =
            '<p class="test-list-message">' +
            'Unable to load the assigned test. Please try again later.' +
            '</p>';

        if (testCount) {
            testCount.textContent = "";
        }

        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = "Try Again";
        }
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

    // Keep only the three fixed Test Type options
    if (testTypeFilter) {
        testTypeFilter.innerHTML = `
            <option value="all">All Test Types</option>
            <option value="chapter">Chapter Test</option>
            <option value="subject">Subject Test</option>
        `;
    }

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

    if (
        previousValue !== "all" &&
        uniqueValues.includes(previousValue)
    ) {
        dropdown.value = previousValue;
    }
}

// Update Chapter dropdown according to Class and Subject
function updateChapterFilter() {
    if (!chapterFilter) return;

    const selectedClass = classFilter
        ? classFilter.value
        : "all";

    const selectedSubject = subjectFilter
        ? subjectFilter.value
        : "all";

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

    if (
        previousChapter !== "all" &&
        relevantChapters.includes(previousChapter)
    ) {
        chapterFilter.value = previousChapter;
    }
}

// Display tests matching all selected filters
function renderTests() {
    if (!testList) return;

    const selectedClass = classFilter
        ? classFilter.value
        : "all";

    const selectedSubject = subjectFilter
        ? subjectFilter.value
        : "all";

    const selectedChapter = chapterFilter
        ? chapterFilter.value
        : "all";

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
            selectedSubject === "all" ||
            test.subject === selectedSubject;

        const matchesChapter =
            selectedChapter === "all" ||
            test.chapter === selectedChapter;

        const matchesLanguage =
            selectedLanguage === "all" ||
            normalizeText(test.language) ===
            normalizeText(selectedLanguage);

        const matchesTestType =
            selectedTestType === "all" ||
            getTestTypeCategory(test.testType) ===
            selectedTestType;

        return (
            matchesClass &&
            matchesSubject &&
            matchesChapter &&
            matchesLanguage &&
            matchesTestType
        );
    });

    testList.innerHTML = "";

    if (testCount) {
        testCount.textContent =
            "Showing " +
            filteredTests.length +
            (filteredTests.length === 1 ? " test" : " tests");
    }

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

        const testTypeInfo = document.createElement("p");
        testTypeInfo.textContent =
            "Test Type: " + formatTestType(test.testType);

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
if (classFilter) {
    classFilter.addEventListener("change", function () {
        updateChapterFilter();
        renderTests();
    });
}

// Update chapters and results when Subject changes
if (subjectFilter) {
    subjectFilter.addEventListener("change", function () {
        updateChapterFilter();
        renderTests();
    });
}

// Update results when Chapter changes
if (chapterFilter) {
    chapterFilter.addEventListener("change", renderTests);
}

// Update results when Language changes
if (languageFilter) {
    languageFilter.addEventListener("change", renderTests);
}

// Update results when Test Type changes
if (testTypeFilter) {
    testTypeFilter.addEventListener("change", renderTests);
}

// Reset all filters
if (resetFiltersButton) {
    resetFiltersButton.addEventListener("click", function () {
        if (classFilter) classFilter.value = "all";
        if (subjectFilter) subjectFilter.value = "all";
        if (chapterFilter) chapterFilter.value = "all";
        if (languageFilter) languageFilter.value = "all";
        if (testTypeFilter) testTypeFilter.value = "all";

        updateChapterFilter();

        if (chapterFilter) {
            chapterFilter.value = "all";
        }

        renderTests();
    });
}
