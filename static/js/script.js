console.log("JavaScript Loaded Successfully");


/* =========================================================
   ADD NEW COURSE ROW
========================================================= */

function addRow() {

    let table = document.getElementById("courseTable");

    let currentRows = table.rows.length;

    if (currentRows >= 10) {

        alert("Maximum of 10 courses allowed.");

        return;
    }

    let row = table.insertRow();

    row.innerHTML = `

        <td>
            <input
                type="text"
                class="course-code"
                placeholder="Eg. DCIT 301">
        </td>

        <td>
            <input
                type="text"
                class="course-name"
                placeholder="Eg. Database Systems">
        </td>

        <td>
            <input
                type="text"
                class="score-input assignment-score"
                placeholder="Eg. 20/25, 18/20">
        </td>

        <td>
            <input
                type="number"
                class="weight-input assignment-weight"
                placeholder="15"
                min="0"
                max="100"
                step="0.01">
        </td>

        <td>
            <input
                type="text"
                class="score-input quiz-score"
                placeholder="Eg. 20/25, 18/20">
        </td>

        <td>
            <input
                type="number"
                class="weight-input quiz-weight"
                placeholder="10"
                min="0"
                max="100"
                step="0.01">
        </td>

        <td>
            <input
                type="text"
                class="score-input project-score"
                placeholder="Eg. 20/25, 18/20">
        </td>

        <td>
            <input
                type="number"
                class="weight-input project-weight"
                placeholder="25"
                min="0"
                max="100"
                step="0.01">
        </td>

    `;
}


/* =========================================================
   CONVERT SCORES INTO PERCENTAGES
=========================================================

   Examples:

   20/25  → 80%
   18/20  → 90%
   80     → 80%

   Multiple scores:

   20/25, 18/20, 75
   → [80, 90, 75]

   Important:
   0 is a valid score and must NOT be ignored.

   Blank values are ignored because they represent
   unavailable scores.
========================================================= */

function parseScores(text) {

    if (!text || text.trim() === "") {

        return [];
    }

    let scores = text.split(",");

    let percentages = [];

    for (let score of scores) {

        score = score.trim();

        // Skip completely empty values
        if (score === "") {
            continue;
        }


        /* -----------------------------------------
           FRACTION FORMAT
           Example: 20/25
        ----------------------------------------- */

        if (score.includes("/")) {

            let parts = score.split("/");

            if (parts.length !== 2) {
                continue;
            }

            let obtained =
                parseFloat(parts[0].trim());

            let total =
                parseFloat(parts[1].trim());


            if (
                !isNaN(obtained) &&
                !isNaN(total) &&
                total > 0
            ) {

                let percentage =
                    (obtained / total) * 100;

                percentages.push(percentage);
            }

        }


        /* -----------------------------------------
           NORMAL NUMBER
           Example: 80
        ----------------------------------------- */

        else {

            let value =
                parseFloat(score);

            if (!isNaN(value)) {

                percentages.push(value);
            }
        }
    }

    return percentages;
}


/* =========================================================
   CALCULATE CATEGORY AVERAGE
========================================================= */

function calculateCategoryAverage(text) {

    let scores =
        parseScores(text);

    if (scores.length === 0) {

        return null;
    }

    let total =
        scores.reduce(
            (sum, score) => sum + score,
            0
        );

    return total / scores.length;
}


/* =========================================================
   CALCULATE WEIGHTED CONTRIBUTION
=========================================================

   Example:

   Average = 80
   Weight = 15%

   Contribution:

   80 × (15 / 100)
   = 12

   This means the student has earned 12 marks
   out of the 15 marks available for that category.
========================================================= */

function calculateWeightedContribution(
    average,
    weight
) {

    if (
        average === null ||
        isNaN(weight) ||
        weight <= 0
    ) {

        return 0;
    }

    return average * (weight / 100);
}


/* =========================================================
   MAIN PREDICTION FUNCTION
========================================================= */

function predictGrades() {

    let table =
        document.getElementById("courseTable");

    let rows =
        table.rows;

    let output = "";

    let predictionsToSave = [];


    /* =====================================================
       PROCESS EACH COURSE
    ===================================================== */

    for (let row of rows) {

        /* -----------------------------------------
           COURSE INFORMATION
        ----------------------------------------- */

        let courseCode =
            row.querySelector(".course-code")?.value.trim()
            || "";

        let courseName =
            row.querySelector(".course-name")?.value.trim()
            || "";


        /* -----------------------------------------
           RAW SCORE INPUTS
        ----------------------------------------- */

        let assignmentText =
            row.querySelector(".assignment-score")?.value.trim()
            || "";

        let quizText =
            row.querySelector(".quiz-score")?.value.trim()
            || "";

        let projectText =
            row.querySelector(".project-score")?.value.trim()
            || "";


        /* -----------------------------------------
           WEIGHTS
        ----------------------------------------- */

        let assignmentWeight =
            parseFloat(
                row.querySelector(".assignment-weight")?.value
            ) || 0;

        let quizWeight =
            parseFloat(
                row.querySelector(".quiz-weight")?.value
            ) || 0;

        let projectWeight =
            parseFloat(
                row.querySelector(".project-weight")?.value
            ) || 0;


        /* -----------------------------------------
           CHECK WHETHER COURSE HAS ANY DATA
        ----------------------------------------- */

        if (
            courseCode === "" &&
            courseName === "" &&
            assignmentText === "" &&
            quizText === "" &&
            projectText === ""
        ) {

            continue;
        }


        /* =================================================
           VALIDATE WEIGHTS
        ================================================= */

        let totalAssessmentWeight =
            assignmentWeight +
            quizWeight +
            projectWeight;


        if (totalAssessmentWeight <= 0) {

            alert(
                `Please enter at least one valid assessment weight for ${courseCode || "this course"}.`
            );

            return;
        }


        if (totalAssessmentWeight > 100) {

            alert(
                `The total assessment weight for ${courseCode || "this course"} cannot exceed 100%.`
            );

            return;
        }


        /* =================================================
           CALCULATE CATEGORY AVERAGES
        ================================================= */

        let assignmentAverage =
            calculateCategoryAverage(
                assignmentText
            );

        let quizAverage =
            calculateCategoryAverage(
                quizText
            );

        let projectAverage =
            calculateCategoryAverage(
                projectText
            );


        /* =================================================
           CALCULATE WEIGHTED CONTRIBUTIONS
        ================================================= */

        let assignmentContribution =
            calculateWeightedContribution(
                assignmentAverage,
                assignmentWeight
            );

        let quizContribution =
            calculateWeightedContribution(
                quizAverage,
                quizWeight
            );

        let projectContribution =
            calculateWeightedContribution(
                projectAverage,
                projectWeight
            );


        /* =================================================
           TOTAL ASSESSMENT SCORE
        ================================================= */

        let totalAssessmentScore =
            assignmentContribution +
            quizContribution +
            projectContribution;


        /* =================================================
           POTENTIAL FINAL EXAMINATION WEIGHT
        ================================================= */

        let potentialExamWeight =
            100 - totalAssessmentWeight;


        /* =================================================
           CURRENT ASSESSMENT PERFORMANCE

           Example:

           Assessment Score = 42
           Assessment Weight = 50

           (42 / 50) × 100
           = 84%
        ================================================= */

        let assessmentPerformance =
            (
                totalAssessmentScore /
                totalAssessmentWeight
            ) * 100;


        /* =================================================
           ASSESSMENT-BASED GRADE PROJECTION
        ================================================= */

        let grade =
            getGrade(
                assessmentPerformance
            );


        let gradeColor =
            getGradeColor(
                grade
            );


        let remark =
            getRemark(
                grade
            );


        let recommendation =
            getRecommendation(
                assessmentPerformance
            );


        /* =================================================
           MAXIMUM POSSIBLE FINAL COURSE SCORE

           If the student gets 100% in the final exam:

           Current Assessment Score
           +
           Remaining Exam Weight

           Example:

           42 + 50 = 92%
        ================================================= */

        let maximumPossibleFinalScore =
            totalAssessmentScore +
            potentialExamWeight;


        /* =================================================
           GENERATE GRADE TARGET RECOMMENDATIONS
        ================================================= */

        let gradeTargets =
            generateGradeTargets(
                totalAssessmentScore,
                potentialExamWeight
            );


        /* =================================================
           SAVE PREDICTION

           We currently save the assessment-based
           performance as predicted_score.

           This keeps compatibility with your
           existing Flask save route.

           We can later expand the database to save
           all the new weighted information.
        ================================================= */

   predictionsToSave.push({

    course_code: courseCode,

    course_name: courseName,

    assessment_score:
        totalAssessmentScore,

    assessment_weight:
        totalAssessmentWeight,

    assessment_performance:
        assessmentPerformance,

    assignment_average:
        assignmentAverage,

    assignment_weight:
        assignmentWeight,

    assignment_contribution:
        assignmentContribution,

    quiz_average:
        quizAverage,

    quiz_weight:
        quizWeight,

    quiz_contribution:
        quizContribution,

    project_average:
        projectAverage,

    project_weight:
        projectWeight,

    project_contribution:
        projectContribution,

    exam_weight:
        potentialExamWeight,

    maximum_possible_score:
        maximumPossibleFinalScore,

    predicted_grade:
        grade

});

/* =========================================================
   CREATE UNIQUE ID FOR EACH COURSE ANALYSIS
========================================================= */

let analysisId =
    "analysis-" +
    Date.now() +
    "-" +
    Math.random()
        .toString(36)
        .substring(2, 8);


/* =========================================================
   BUILD COMPACT RESULT CARD
========================================================= */

output += `

<div class="result-card">

    <h3>
        ${courseCode} - ${courseName}
    </h3>


    <!-- ================================================
         COMPACT ASSESSMENT SUMMARY
    ================================================= -->

    <div class="assessment-summary">

        <h4>
            📊 Assessment Summary
        </h4>

        <p>
            <strong>
                Assessment Score:
            </strong>

            ${totalAssessmentScore.toFixed(2)}
            /
            ${totalAssessmentWeight.toFixed(2)}
        </p>


        <p>
            <strong>
                Assessment Performance:
            </strong>

            ${assessmentPerformance.toFixed(2)}%
        </p>


        <p>
            <strong>
                Projected Grade:
            </strong>

            <strong
                style="
                    color:${gradeColor};
                    font-size:22px;
                "
            >
                ${grade}
            </strong>

            — ${remark}

        </p>

    </div>


    <!-- ================================================
         FULL ANALYSIS TOGGLE
    ================================================= -->

    <button
        type="button"
        class="analysis-toggle"
        id="toggle-${analysisId}"
        onclick="toggleFullAnalysis('${analysisId}')">

        ⌄ Full Analysis

    </button>


    <!-- ================================================
         HIDDEN FULL ANALYSIS
    ================================================= -->

    <div
        id="${analysisId}"
        class="full-analysis"
        style="display:none;">

        <hr>


        <h4>
            📈 Assessment Breakdown
        </h4>


        <p>
            <strong>
                Assignment Average:
            </strong>

            ${
                assignmentAverage !== null
                ? assignmentAverage.toFixed(2) + "%"
                : "Not Available"
            }
        </p>


        <p>
            <strong>
                Assignment Contribution:
            </strong>

            ${assignmentContribution.toFixed(2)}
            /
            ${assignmentWeight.toFixed(2)}
        </p>


        <p>
            <strong>
                Quiz Average:
            </strong>

            ${
                quizAverage !== null
                ? quizAverage.toFixed(2) + "%"
                : "Not Available"
            }
        </p>


        <p>
            <strong>
                Quiz Contribution:
            </strong>

            ${quizContribution.toFixed(2)}
            /
            ${quizWeight.toFixed(2)}
        </p>


        <p>
            <strong>
                Project Average:
            </strong>

            ${
                projectAverage !== null
                ? projectAverage.toFixed(2) + "%"
                : "Not Available"
            }
        </p>


        <p>
            <strong>
                Project Contribution:
            </strong>

            ${projectContribution.toFixed(2)}
            /
            ${projectWeight.toFixed(2)}
        </p>


        <hr>


        <h4>
            🎯 Examination Planning
        </h4>


        <p>
            <strong>
                Total Assessment Weight:
            </strong>

            ${totalAssessmentWeight.toFixed(2)}%
        </p>


        <p>
            <strong>
                Potential Final Examination Weight:
            </strong>

            ${potentialExamWeight.toFixed(2)}%
        </p>


        <p>
            <strong>
                Maximum Possible Final Course Score:
            </strong>

            ${maximumPossibleFinalScore.toFixed(2)}%
        </p>


        <p>
            <strong>
                Current Recommendation:
            </strong>

            ${recommendation}
        </p>


        <hr>


        <h4>
            🚀 Grade Target Recommendations
        </h4>


        <div class="grade-targets">

            ${gradeTargets}

        </div>


    </div>

</div>

`;
    }


    /* =====================================================
       DISPLAY RESULTS
    ===================================================== */

    if (output !== "") {

        document.getElementById(
            "resultsTitle"
        ).style.display = "block";

    }


    document.getElementById(
        "results"
    ).innerHTML = output;


    /* =====================================================
       SAVE RESULTS TO DATABASE
    ===================================================== */

    if (
        predictionsToSave.length > 0
    ) {

        fetch(
            "/save-predictions",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        predictionsToSave
                    )

            }
        )

        .then(
            response =>
                response.json()
        )

        .then(
            data => {

                console.log(
                    data.message
                );

            }
        )

        .catch(
            error => {

                console.error(
                    "Error saving predictions:",
                    error
                );

            }
        );
    }
}


/* =========================================================
   GRADE TARGET RECOMMENDATIONS
=========================================================

   The system does NOT predict the exam score.

   Instead, it calculates the minimum exam performance
   needed to reach each possible final grade.

   Example:

   Assessment Score = 42/50
   Exam Weight = 50%

   To achieve A:

   Required total = 80

   80 - 42 = 38 marks needed from exam

   38 / 50 × 100
   = 76%

========================================================= */

function generateGradeTargets(
    assessmentScore,
    examWeight
) {

    let gradeThresholds = [

        {
            grade: "A",
            minimum: 80
        },

        {
            grade: "B+",
            minimum: 75
        },

        {
            grade: "B",
            minimum: 70
        },

        {
            grade: "C+",
            minimum: 65
        },

        {
            grade: "C",
            minimum: 60
        },

        {
            grade: "D+",
            minimum: 55
        },

        {
            grade: "D",
            minimum: 50
        },

        {
            grade: "E",
            minimum: 45
        }

    ];


    let result = "";


    for (
        let target of gradeThresholds
    ) {

        /* -----------------------------------------
           If there is no exam weight remaining
        ----------------------------------------- */

        if (examWeight <= 0) {

            if (
                assessmentScore >=
                target.minimum
            ) {

                result += `

                <p>
                    <strong>
                        ${target.grade}:
                    </strong>

                    Already achieved based on
                    current assessment score.
                </p>

                `;

            }

            continue;
        }


        /* -----------------------------------------
           Calculate marks still needed
        ----------------------------------------- */

        let marksNeeded =
            target.minimum -
            assessmentScore;


        /* -----------------------------------------
           Grade already guaranteed
        ----------------------------------------- */

        if (marksNeeded <= 0) {

            result += `

            <p>

                <strong
                    style="
                        color:${getGradeColor(target.grade)};
                    "
                >
                    ${target.grade}:
                </strong>

                This grade is currently
                achievable based on your
                assessment performance.

            </p>

            `;

            continue;
        }


        /* -----------------------------------------
           Calculate required exam percentage
        ----------------------------------------- */

        let requiredExamScore =
            (
                marksNeeded /
                examWeight
            ) * 100;


        /* -----------------------------------------
           Grade is mathematically achievable
        ----------------------------------------- */

        if (
            requiredExamScore <= 100
        ) {

            result += `

            <p>

                <strong
                    style="
                        color:${getGradeColor(target.grade)};
                    "
                >
                    ${target.grade}:
                </strong>

                Aim for at least
                <strong>
                    ${requiredExamScore.toFixed(2)}%
                </strong>

                in the final examination.

            </p>

            `;

        }


        /* -----------------------------------------
           Grade is no longer achievable
        ----------------------------------------- */

        else {

            result += `

            <p>

                <strong
                    style="
                        color:${getGradeColor(target.grade)};
                    "
                >
                    ${target.grade}:
                </strong>

                Not mathematically achievable
                based on current assessment
                performance.

            </p>

            `;

        }

    }


    return result;
}


/* =========================================================
   GRADE CLASSIFICATION
========================================================= */

function getGrade(score) {

    if (score >= 80)
        return "A";

    if (score >= 75)
        return "B+";

    if (score >= 70)
        return "B";

    if (score >= 65)
        return "C+";

    if (score >= 60)
        return "C";

    if (score >= 55)
        return "D+";

    if (score >= 50)
        return "D";

    if (score >= 45)
        return "E";

    return "F";
}


/* =========================================================
   GRADE REMARKS
========================================================= */

function getRemark(grade) {

    switch (grade) {

        case "A":

            return "Excellent Performance";

        case "B+":

            return "Very Good Performance";

        case "B":

            return "Good Performance";

        case "C+":

            return "Fairly Good Performance";

        case "C":

            return "Satisfactory Performance";

        case "D+":

            return "Below Average";

        case "D":

            return "Academic Risk";

        case "E":

            return "High Academic Risk";

        default:

            return "Immediate Improvement Required";
    }
}


/* =========================================================
   GENERAL RECOMMENDATIONS
========================================================= */

function getRecommendation(score) {

    if (score >= 80) {

        return "Your current assessment performance is excellent. Maintain your study habits and consistency to give yourself the best opportunity to maintain this level in the final examination.";
    }


    if (score >= 75) {

        let diff =
            (80 - score).toFixed(2);

        return `Your assessment performance is very good. Improving your overall performance by approximately ${diff}% could move you into the A range.`;
    }


    if (score >= 70) {

        let diff =
            (75 - score).toFixed(2);

        return `Your assessment performance is good. Improving by approximately ${diff}% could move you into the B+ range.`;
    }


    if (score >= 65) {

        let diff =
            (70 - score).toFixed(2);

        return `Your assessment performance is fairly good. An improvement of approximately ${diff}% could raise your performance to the B range.`;
    }


    if (score >= 60) {

        return "You are currently performing at a satisfactory level. Additional effort in assignments, quizzes, projects, and examination preparation is recommended.";
    }


    if (score >= 50) {

        return "Your current assessment performance is passing but requires improvement. Increased study time and stronger continuous assessment performance are recommended.";
    }


    return "Your current assessment performance indicates significant academic risk. Immediate improvement in your assessment performance and focused examination preparation are strongly recommended.";
}


/* =========================================================
   GRADE COLORS
========================================================= */

function getGradeColor(grade) {

    switch (grade) {

        case "A":

            return "green";

        case "B+":

            return "#22c55e";

        case "B":

            return "#2563eb";

        case "C+":

            return "#f59e0b";

        case "C":

            return "#ea580c";

        case "D+":

        case "D":

            return "#dc2626";

        case "E":

        case "F":

            return "#991b1b";

        default:

            return "black";
    }
}
/* =========================================================
   TOGGLE FULL ANALYSIS
========================================================= */

function toggleFullAnalysis(id) {

    const analysis =
        document.getElementById(id);

    const button =
        document.getElementById(
            "toggle-" + id
        );

    if (
        analysis.style.display === "none" ||
        analysis.style.display === ""
    ) {

        analysis.style.display = "block";

        button.innerHTML =
            "⌃ Hide Analysis";

    } else {

        analysis.style.display = "none";

        button.innerHTML =
            "⌄ Full Analysis";

    }
}