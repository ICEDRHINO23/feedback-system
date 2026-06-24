<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Manage Teachers</title>

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial,sans-serif;
}

body{
    background:#f4f6f9;
}

.header{
    background:#001f5b;
    color:white;
    padding:20px;
    text-align:center;
}

.container{
    width:90%;
    max-width:1200px;
    margin:30px auto;
}

.card{
    background:white;
    padding:20px;
    border-radius:10px;
    box-shadow:0 2px 8px rgba(0,0,0,.1);
}

input{
    width:100%;
    padding:12px;
    margin-bottom:15px;
    border:1px solid #ccc;
    border-radius:5px;
}

button{
    padding:12px 20px;
    border:none;
    border-radius:5px;
    cursor:pointer;
}

.add-btn{
    background:#001f5b;
    color:white;
    width:100%;
}

.delete-btn{
    background:red;
    color:white;
}

.reset-btn{
    background:orange;
    color:white;
}

table{
    width:100%;
    border-collapse:collapse;
    margin-top:20px;
}

table th{
    background:#001f5b;
    color:white;
    padding:12px;
}

table td{
    border:1px solid #ddd;
    padding:10px;
    text-align:center;
}

.back-btn{
    background:#001f5b;
    color:white;
    margin-bottom:15px;
}

</style>
</head>

<body>

<div class="header">
    <h1>Teacher Management</h1>
</div>

<div class="container">

    <button
        class="back-btn"
        onclick="location.href='dashboard.html'">
        ← Back To Dashboard
    </button>

    <div class="card">

        <h2>Add Teacher</h2>

        <br>

        <input
            type="text"
            id="teacherName"
            placeholder="Teacher Name">

        <input
            type="text"
            id="employeeId"
            placeholder="Employee ID">

        <input
            type="text"
            id="subject"
            placeholder="Subject">

        <button
            class="add-btn"
            onclick="addTeacher()">
            Add Teacher
        </button>

    </div>

    <div class="card" style="margin-top:20px;">

        <h2>Teachers List</h2>

        <table>

            <thead>

                <tr>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Subject</th>
                    <th>Password</th>
                    <th>Action</th>
                </tr>

            </thead>

            <tbody id="teacherTable">

                <tr>
                    <td colspan="5">
                        Loading...
                    </td>
                </tr>

            </tbody>

        </table>

    </div>

</div>

<script type="module" src="../js/teachers.js"></script>

</body>
</html>
