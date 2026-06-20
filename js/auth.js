function login(){
    const admissionNo =
        document.getElementById("admissionNo").value;

    const password =
        document.getElementById("password").value;

    if(admissionNo && password){
        window.location.href="dashboard.html";
    }else{
        alert("Please enter login details");
    }
}
