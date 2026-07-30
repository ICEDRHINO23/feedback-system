import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allResults = [];

async function loadResults() {

    const tbody =
        document.getElementById("resultTable");

    try {

        const snapshot =
            await getDocs(
                collection(db, "results")
            );

        tbody.innerHTML = "";
        allResults = [];

        if (snapshot.empty) {

            tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    No Results Found
                </td>
            </tr>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const result = {
                id: docSnap.id,
                ...docSnap.data()
            };

            allResults.push(result);

        });
        allResults.sort((a, b) =>
    new Date(b.submittedAt) - new Date(a.submittedAt)
);
        
        renderResults(allResults);
        loadClassFilter();

    }
    catch (error) {

        console.error(error);

        tbody.innerHTML = `
        <tr>
            <td colspan="8">
                Error Loading Results
            </td>
        </tr>
        `;
    }
}

function renderResults(results) {

    const tbody =
        document.getElementById("resultTable");

    tbody.innerHTML = "";

    results.forEach(result => {

        const percentage =
    result.percentage || "0.00";
        tbody.innerHTML += `

        <tr>

            <td>
                ${result.studentName || "-"}
            </td>

            <td>
                ${result.studentClass || "-"}
            </td>

            <td>
                ${result.section || "-"}
            </td>

            <td>
                ${result.score || 0}
            </td>

            <td>
                ${result.totalMarks || 0}
            </td>

            <td>
                ${percentage}%
            </td>

            <td>
                ${
                    result.submittedAt
                    ? new Date(
                        result.submittedAt
                      ).toLocaleString()
                    : "-"
                }
            </td>

            <td>

                <button
                    class="delete-btn"
                    onclick="deleteResult('${result.id}')">

                    Delete

                </button>

            </td>

        </tr>

        `;
    });
}

function loadClassFilter() {

    const filter =
        document.getElementById("classFilter");

    if (!filter) return;

    filter.innerHTML =
        '<option value="">All Classes</option>';

    const classes =
        [...new Set(
            allResults.map(
                r => r.studentClass
            )
        )];

    classes.forEach(cls => {

        if (!cls) return;

        filter.innerHTML += `
        <option value="${cls}">
            ${cls}
        </option>
        `;
    });
}

window.deleteResult =
async function(id) {

    if (!confirm("Delete Result?"))
        return;

    try {

        await deleteDoc(
            doc(
                db,
                "results",
                id
            )
        );

        loadResults();

    }
    catch(error) {

        console.error(error);

        alert(
            "Unable To Delete Result"
        );
    }
};

function filterResults() {

    const search =
        document
        .getElementById("searchBox")
        .value
        .toLowerCase();

    const selectedClass =
        document
        .getElementById("classFilter")
        .value;

    const filtered =
        allResults.filter(result => {

            const nameMatch =
(
    result.studentName || ""
)
.toLowerCase()
.includes(search);
            const classMatch =
                selectedClass === "" ||
                result.studentClass === selectedClass;

            return (
                nameMatch &&
                classMatch
            );

        });

    renderResults(filtered);
}

const searchBox =
    document.getElementById(
        "searchBox"
    );

if (searchBox) {

    searchBox.addEventListener(
        "input",
        filterResults
    );
}

const classFilter =
    document.getElementById(
        "classFilter"
    );

if (classFilter) {

    classFilter.addEventListener(
        "change",
        filterResults
    );
}

loadResults();
