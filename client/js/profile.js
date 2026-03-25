const token = localStorage.getItem('token'); //assuming JWT token ins stored here
const form = document.getElementById('profileForm');
const msg = document.getElementById('msg');

//LOGOUT Function
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

//FETCH current profile data
async function loadProfile() {
    try{
        const res = await fetch('http://localhost:5000/api/profile', {
            headers: {'Authorization':`Bearer ${token}`}
        });
        const data = await res.json();
        if(res.ok) {
            document.getElementById('name').value = data.name || '';
            document.getElementById('age').value = data.age || '';
            document.getElementById('height').value = data.height || '';
            document.getElementById('weight').value = data.weight || '';
            document.getElementById('goal').value = data.goal || '';
        } else {
            msg.textContent = data.msg || 'Error fetching profile.';
        }
    } catch (err) {
        msg.textContent = 'Server error';
    }
}

//UPDATE profile
form.addEventListener('submit', async(e) => {
    e.preventDefault();

    const body = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        goal: document.getElementById('goal').value
    };

    try {
        const res = await fetch('http://localhost:5000/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        msg.textContent = res.ok ? 'Profile updated!' : data.msg || data.message;
    }catch (err) {
        msg.textContent = 'Server error';
    }
});

loadProfile();