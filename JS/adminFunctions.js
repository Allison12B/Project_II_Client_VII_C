//Take the param 
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Clean inputs
function clearInputs(inputs) {
    inputs.forEach(input => {
        input.value = '';
    });
}

//Login logic
async function findAdmin(event) {
    // Prevent default form submission
    event.preventDefault();

    const email = document.getElementById('emailKey').value;
    const password = document.getElementById('passwordKey').value;

    // First check if fields are empty
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    // Data type validate 
    if (
        typeof email !== 'string' || email.trim() === '' ||
        typeof password !== 'string' || password.trim() === ''
    ) {
        alert('Please provide valid email and password');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/adminUserLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        const inputs = document.querySelectorAll('input');
        if (!response.ok) {
            clearInputs(inputs); 
            inputs[0].focus();
        } else if(data.success && data.token) {
            // Guardar el token en localStorage
            sessionStorage.setItem('jwtToken', data.token);
            // Redirigir
            window.location.href = `profileHome.html?adminId=${data.data.id}`;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || "An error occurred during login");
    }
}

// Save a new profile
async function createAdmin(event) {
    // Prevent default form submission
    event.preventDefault();

    let admin = {
        email: document.getElementById('emailAdmin').value,
        password: document.getElementById('passwordAdmin').value,
        phoneNumber: parseInt(document.getElementById('phoneNumberAdmin').value),
        pin: parseInt(document.getElementById('pinAdmin').value),
        name: document.getElementById('nameAdmin').value,
        lastName: document.getElementById('lastNameAdmin').value,
        age: parseInt(document.getElementById('ageAdmin').value),
        country: document.getElementById('countryAdmin').value,
        dateBirth: document.getElementById('dateBirthAdmin').value
    }

    // First check if fields are empty
    if (!admin.email || !admin.password || !admin.phoneNumber || !admin.pin || !admin.name || !admin.lastName || !admin.age || !admin.country || !admin.dateBirth) {
        alert("Please enter both email, password, phone number, pin, name, last name, age, country and date birth");
        return;
    }

    // Data type validate 
    if (
        typeof admin.email !== 'string' || admin.email.trim() === '' ||
        typeof admin.password !== 'string' || admin.password.trim() === '' ||
        typeof admin.phoneNumber !== 'number' || isNaN(admin.phoneNumber) ||
        typeof admin.pin !== 'number' || admin.pin < 100000 || admin.pin > 999999 ||
        typeof admin.name !== 'string' || admin.name.trim() === '' ||
        typeof admin.lastName !== 'string' || admin.lastName.trim() === '' ||
        typeof admin.age !== 'number' || isNaN(admin.age) || admin.age <= 18 ||
        typeof admin.country !== 'string' || admin.country.trim() === '' ||
        typeof admin.dateBirth !== 'string' || admin.dateBirth.trim() === ''
    ) {
        alert('Please provide valid data');
        return;
    }

    const repeatPassword = document.getElementById('repeatPassworAdmin').value;
    if (admin.password !== repeatPassword) {
        alert("Passwords do not match");
        return;
    }

    const response = await fetch("http://localhost:3001/api/adminUser", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(admin)
    });

    if (response && response.status == 201) {
        admin = await response.json();
        console.log('Saved Administrator: ', admin);
        window.location.href = "index.html";
    }
    alert('Saved Administrator');
}

// Verificate data
async function AdminPinLogin(event) {
    event.preventDefault();

    const adminId = getUrlParam('adminId');

    const inputs = document.querySelectorAll('.otp-input');
    const pin = Array.from(inputs).map(input => input.value).join('');

    if (pin.length !== 6) {
        return;
    }

    try {

        const response = await fetch(`http://localhost:3001/api/adminUserPin/${adminId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pin: Number(pin) 
            })
        });

        const data = await response.json();

        if (data.success) {
            
            window.location.href = `./videoViews/videoAdmin.html?adminId=${adminId}`;
        } else {
            clearInputs(inputs); 
            inputs[0].focus();
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert(error.message || "An error occurred during verification");
        clearInputs(inputs); 
        inputs[0].focus();
    }
}


function setupPinInputs() {
    const inputs = document.querySelectorAll('.otp-input');

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').trim();
            const pasteArray = pasteData.split('');

            pasteArray.forEach((char, idx) => {
                if (idx < inputs.length) {
                    inputs[idx].value = char;
                }
            });


            if (pasteArray.length >= inputs.length) {
                inputs[inputs.length - 1].focus();
            } else {
                inputs[pasteArray.length].focus();
            }
        });

        // manage tecla backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// add the parameters adminId y remover token de sessionStorage
function updateBackLink() {
    // Remover el token del sessionStorage (logout)
    sessionStorage.removeItem('jwtToken');

    const adminId = getUrlParam('adminId');
    if (!adminId) return;

    document.querySelectorAll('a[href*="profileHome.html"], button[onclick*="profileHome.html"]').forEach(element => {
        if (element.tagName === 'A') {
            element.href = `profileHome.html?adminId=${adminId}`;
        } else {
            element.onclick = () => {
                window.location.href = `profileHome.html?adminId=${adminId}`;
            };
        }
    });
}


document.addEventListener('DOMContentLoaded', function () {
    setupPinInputs();
    updateBackLink();


    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', AdminPinLogin);
    }
});


/**
 * Para cargar el video en la vista
 <iframe scr="https://www.youtube.com/embed/${youtubeId}".frameborder="0" allowfullscreen></iframe>
 */