console.log("JavaScript Loaded Successfully");

function addRow() {

    let table = document.getElementById("courseTable");

    let currentRows = table.rows.length;

    if(currentRows >= 10){

        alert("Maximum of 10 courses allowed.");

        return;
    }

    let row = table.insertRow();

    row.innerHTML = `
        <td><input type="text"></td>
        <td><input type="text"></td>

        <td>
            <input type="text"
                   onblur="calculateAverage(this)">
        </td>

        <td>
            <input type="text"
                   onblur="calculateAverage(this)">
        </td>

        <td>
            <input type="text"
                   onblur="calculateAverage(this)">
        </td>
    `;
}

function calculateAverage(input) {

    console.log("Function called");

    let text = input.value.trim();

    if (text === "") {
        return;
    }

    let scores = text.split(",");

    let percentages = [];

    for (let score of scores) {

        score = score.trim();

        if (score.includes("/")) {

            let parts = score.split("/");

            let obtained = parseFloat(parts[0]);
            let total = parseFloat(parts[1]);

            if (!isNaN(obtained) &&
                !isNaN(total) &&
                total > 0) {

                let percentage =
                    (obtained / total) * 100;

                percentages.push(percentage);
            }
        }
        else {

            let value = parseFloat(score);

            if (!isNaN(value)) {
                percentages.push(value);
            }
        }
    }

    if (percentages.length > 0) {

        let sum = percentages.reduce(
            (a, b) => a + b,
            0
        );

        let average =
            sum / percentages.length;

        input.value =
            average.toFixed(2);
    }
}

function predictGrades() {

    let table =
        document.getElementById("courseTable");

    let rows = table.rows;

    let output = "";
    let predictionsToSave = [];
    for (let row of rows) {

        let courseCode =
            row.cells[0].querySelector("input").value;

        let courseName =
            row.cells[1].querySelector("input").value;

        let assignment =
            row.cells[2].querySelector("input").value;

        let quiz =
            row.cells[3].querySelector("input").value;

        let project =
            row.cells[4].querySelector("input").value;

        let scores = [];

        if (assignment !== "")
            scores.push(parseFloat(assignment));

        if (quiz !== "")
            scores.push(parseFloat(quiz));

        if (project !== "")
            scores.push(parseFloat(project));

        if (scores.length === 0)
            continue;

        let total =
            scores.reduce((a,b) => a+b,0);

        let average =
            total / scores.length;

        let grade = getGrade(average);
        predictionsToSave.push({

        course_code: courseCode,

        course_name: courseName,

        predicted_score: average,

        predicted_grade: grade
});
        let gradeColor =
        getGradeColor(grade);
        
        let remark = getRemark(grade);
        
        let recommendation =
        getRecommendation(average);
        output += `
        
        <div class="result-card">


                <h3>${courseCode} - ${courseName}</h3>

                <p>
                    Predicted Score:
                    ${average.toFixed(2)}%
                </p>

                <p>
                    Predicted Grade:
                    <strong style="
                        color:${gradeColor};
                        font-size:24px;">
                        ${grade}
                    </strong>
                </p>

                <p>
                Remark:
                ${remark}
                </p>

                <p>
                Recommendation:
                ${recommendation}
                </p>

            </div>
        `;
    }
    if(output !== ""){

        document.getElementById(
            "resultsTitle"
        ).style.display = "block";
    }
    document.getElementById("results").innerHTML =
        output;
fetch('/save-predictions', {

    method: 'POST',

    headers: {
        'Content-Type': 'application/json'
    },

    body: JSON.stringify(
        predictionsToSave
    )

})
.then(response => response.json())
.then(data => {

    console.log(
        data.message
    );

});
    }

function getGrade(score) {

    if(score >= 80) return "A";
    if(score >= 75) return "B+";
    if(score >= 70) return "B";
    if(score >= 65) return "C+";
    if(score >= 60) return "C";
    if(score >= 55) return "D+";
    if(score >= 50) return "D";
    if(score >= 45) return "E";

    return "F";
}

function getRemark(grade) {

    switch(grade) {

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

function getRecommendation(score){

    if(score >= 80){

        return "Maintain your study habits and consistency to sustain this achievement.";
    }

    if(score >= 75){

        let diff = (80 - score).toFixed(2);

        return `You are only ${diff}% away from an A grade.`;
    }

    if(score >= 70){

        let diff = (75 - score).toFixed(2);

        return `Improving by ${diff}% could move you into the B+ category.`;
    }

    if(score >= 65){

        let diff = (70 - score).toFixed(2);

        return `An improvement of ${diff}% could raise your grade to B.`;
    }

    if(score >= 60){

        return "You are passing, but additional effort in assignments and quizzes is recommended.";
    }

    if(score >= 50){

        return "Increased study time and continuous assessment performance are recommended.";
    }

    return "Academic support are strongly recommended.";
}

function getGradeColor(grade){

    switch(grade){

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