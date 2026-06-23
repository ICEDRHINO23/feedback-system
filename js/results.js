import { db } from "./firebase-config.js";

import {
collection,
getDocs,
deleteDoc,
doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allResults = [];

async function loadResults(){

const tbody =
document.getElementById(
"resultTable"
);

try{

const snapshot =
await getDocs(
collection(db,"results")
);

tbody.innerHTML="";
allResults=[];

if(snapshot.empty){

tbody.innerHTML=`
<tr>
<td colspan="7">
No Results Found
</td>
</tr>
`;

return;
}

snapshot.forEach(resultDoc=>{

const result={
id:resultDoc.id,
...resultDoc.data()
};

allResults.push(result);

});

renderResults(allResults);

loadClassFilter();

}catch(error){

console.error(error);

tbody.innerHTML=`
<tr>
<td colspan="7">
Error Loading Results
</td>
</tr>
`;

}

}

function renderResults(results){

const tbody =
document.getElementById(
"resultTable"
);

tbody.innerHTML="";

results.forEach(result=>{

tbody.innerHTML += `

<tr>

<td>
${result.studentName || ""}
</td>

<td>
${result.studentClass || ""}
</td>

<td>
${result.score || 0}
</td>

<td>
${result.totalMarks || 0}
</td>

<td>
${result.percentage || 0}%
</td>

<td>
${result.submittedAt || ""}
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

function loadClassFilter(){

const filter =
document.getElementById(
"classFilter"
);

const classes =
[
...new Set(
allResults.map(
r=>r.studentClass
)
)
];

classes.forEach(cls=>{

filter.innerHTML += `
<option value="${cls}">
${cls}
</option>
`;

});

}

window.deleteResult =
async function(id){

if(
!confirm(
"Delete Result?"
)
)
return;

try{

await deleteDoc(
doc(
db,
"results",
id
)
);

loadResults();

}catch(error){

console.error(error);

alert(
"Unable to Delete"
);
}

};

document
.getElementById(
"searchBox"
)
.addEventListener(
"input",
filterResults
);

document
.getElementById(
"classFilter"
)
.addEventListener(
"change",
filterResults
);

function filterResults(){

const search =
document
.getElementById(
"searchBox"
)
.value
.toLowerCase();

const selectedClass =
document
.getElementById(
"classFilter"
)
.value;

const filtered =
allResults.filter(result=>{

const nameMatch =
(result.studentName || "")
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

loadResults();
