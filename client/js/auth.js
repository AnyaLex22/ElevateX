const API = "http://localhost:5000/api/auth";

//LOGIN
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(API + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({email,password})
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token); //store session
        window.location.href = "dashboard.html";
    }else {
        alert(data.message || "Login failed.");
    }
}

//REGISTER
async function register() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(API + "/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name,email,password})
    });

    const data = await res.json();

    alert(data.message);
    window.location.href = "login.html";
}