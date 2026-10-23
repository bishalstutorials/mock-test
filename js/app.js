
const testList = document.getElementById("test-list");
const testCount = document.getElementById("test-count");

const classFilter = document.getElementById("class-filter");
const subjectFilter = document.getElementById("subject-filter");
const chapterFilter = document.getElementById("chapter-filter");
const languageFilter = document.getElementById("language-filter");
const testTypeFilter = document.getElementById("test-type-filter");

let allTests = [];

const testTypeNames = {
    chapter: "Chapter Test",
    subject: "Subject Test",
    complete: "Complete All Subject Test"
};

function getTestType(test) {
    return String(test.testType || test.type || "chapter")
        .trim()
        .toLowerCase();
}

function getLanguage(test) {
    return String(test.language || "Not specified").trim();
}

function getDuration(test) {
    return test.duration ?? test.durationMinutes ?? 0;
}

function getUniqueValues(tests, property) {
    return [...new Set(
        tests
            .map(test => test[property])
            .filter(value => value !== undefined && value !== null && String(value).trim() !== "")
            .map(value => String(value).trim())
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function populateDropdown(selectElement, values, defaultLabel) {
    const previousValue = selectElement.value || "all";

    selectElement.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "all";
    defaultOption.textContent = defaultLabel;
    selectElement.appendChild(defaultOption);

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });

    if ([...selectElement.options].some(option => option.value === previousValue)) {
        selectElement.value = previousValue;
    } else {
        selectElement.value = "all";
    }
}

function populateFilters() {
    populateDropdown(
        classFilter,
        getUniqueValues(allTests, "class"),
        "All Classes"
    );

    populateDropdown(
        subjectFilter,
        getUniqueValues(allTests, "subject"),
        "All Subjects"
    );

    populateDropdown(
        languageFilter,
        getUniqueValues(allTests, "language").length
            ? getUniqueValues(allTests, "language")
            : [],
        "All Languages"
    );

    populateDropdown(
        testTypeFilter,
        [...new Set(allTests.map(getTestType))]
            .filter(type => testTypeNames[type])
            .sort(),
        "All Test Types"
    );

    updateChapterFilter();
}

function updateChapterFilter() {
    const selectedClass = classFilter.value;
    const selectedSubject = subjectFilter.value;

    let filteredTests = allTests;

    if (selectedClass !== "all") {
        filteredTests = filteredTests.filter(
            test => String(test.class) === selectedClass
        );
    }

    if (selectedSubject !== "all") {
        filteredTests = filteredTests.filter(
            test => String(test.subject) === selectedSubject
        );
    }

    populateDropdown(
        chapterFilter,
        getUniqueValues(filteredTests, "chapter"),
        "All Chapters"
    );
}

function renderTests() {
    const selectedClass = classFilter.value;
    const selectedSubject = subjectFilter.value;
    const selectedChapter = chapterFilter.value;
    const selectedLanguage = languageFilter.value;
    const selectedTestType = testTypeFilter.value;

    const filteredTests = allTests.filter(test => {
        const matchesClass =
            selectedClass === "all" ||
            String(test.class) === selectedClass;

        const matchesSubject =
            selectedSubject === "all" ||
            String(test.subject) === selectedSubject;

        const matchesChapter =
            selectedChapter === "all" ||
            String(test.chapter) === selectedChapter;

        const matchesLanguage =
            selectedLanguage === "all" ||
            getLanguage(test) === selectedLanguage;

        const matchesTestType =
            selectedTestType === "all" ||
            getTestType(test) === selectedTestType;

        return (
            matchesClass &&
            matchesSubject &&
            matchesChapter &&
            matchesLanguage &&
            matchesTestType
        );
    });

    testCount.textContent =
        `${filteredTests.length} mock test${filteredTests.length === 1 ? "" : "s"} found`;

    testList.innerHTML = "";

    if (filteredTests.length === 0) {
        const message = document.createElement("p");
        message.className = "no-tests";
        message.textContent =
            "No mock tests found. Please try changing your filters.";
        testList.appendChild(message);
        return;
    }

    filteredTests.forEach(test => {
        const card = document.createElement("div");
        card.className = "test-card";

        const title = document.createElement("h3");
        title.textContent = test.title || "Untitled Test";

        const details = document.createElement("div");
        details.className = "test-details";

        const classInfo = document.createElement("p");
        classInfo.textContent = `Class: ${test.class || "Not specified"}`;

        const subjectInfo = document.createElement("p");
        subjectInfo.textContent = `Subject: ${test.subject || "Not specified"}`;

        const chapterInfo = document.createElement("p");
        chapterInfo.textContent = `Chapter: ${test.chapter || "All chapters"}`;

        const languageInfo = document.createElement("p");
        languageInfo.textContent = `Language: ${getLanguage(test)}`;

        const typeInfo = document.createElement("p");
        typeInfo.textContent =
            `Test Type: ${testTypeNames[getTestType(test)] || "Not specified"}`;

        const durationInfo = document.createElement("p");
        durationInfo.textContent = `Duration: ${getDuration(test)} minutes`;

        const questionCount = document.createElement("p");
        const totalQuestions = Array.isArray(test.questions)
            ? test.questions.length
            : 0;
        questionCount.textContent = `Questions: ${totalQuestions}`;

        const startLink = document.createElement("a");
        startLink.className = "btn";
        startLink.href = `test.html?id=${encodeURIComponent(test.id)}`;
        startLink.textContent = "Start Test";

        details.append(
            classInfo,
            subjectInfo,
            chapterInfo,
            languageInfo,
            typeInfo,
            durationInfo,
            questionCount
        );

        card.append(title, details, startLink);
        testList.appendChild(card);
    });
}

async function loadMockTests() {
    try {
        testList.innerHTML = "<p>Loading mock tests...</p>";

        const response = await fetch("data/tests.json");

        if (!response.ok) {
            throw new Error("Could not load the test data.");
        }

        const data = await response.json();
        allTests = Array.isArray(data.tests) ? data.tests : [];

        populateFilters();
        renderTests();
    } catch (error) {
        console.error("Error loading mock tests:", error);

        testCount.textContent = "";

        testList.innerHTML =
            "<p>Unable to load mock tests. Please refresh the page and try again.</p>";
    }
}

classFilter.addEventListener("change", () => {
    updateChapterFilter();
    renderTests();
});

subjectFilter.addEventListener("change", () => {
    updateChapterFilter();
    renderTests();
});

chapterFilter.addEventListener("change", renderTests);
languageFilter.addEventListener("change", renderTests);
testTypeFilter.addEventListener("change", renderTests);

const resetButton = document.getElementById("reset-filters");

if (resetButton) {
    resetButton.addEventListener("click", () => {
        classFilter.value = "all";
        subjectFilter.value = "all";
        chapterFilter.value = "all";
        languageFilter.value = "all";
        testTypeFilter.value = "all";

        updateChapterFilter();
        renderTests();
    });
}

loadMockTests();

const currentYear = document.getElementById("current-year");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}
