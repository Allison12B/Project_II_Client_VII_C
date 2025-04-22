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
    event.preventDefault();

    const email = document.getElementById('emailKey').value.trim();
    const password = document.getElementById('passwordKey').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/adminUserLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            document.querySelectorAll('input').forEach(input => input.value = '');
            document.getElementById('emailKey').focus();
            alert(data.error || "Invalid login");
            return;
        }

        if (data.success && data.token) {
            sessionStorage.setItem('jwtToken', data.token);
            window.location.href = `profileHome.html?adminId=${data.data.id}`;
        } else {
            alert("Login failed. No token received.");
        }
    } catch (error) {
        console.error('Login error:', error);
        alert("An error occurred. Please try again.");
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
        const savedAdmin = await response.json();
        console.log('Saved Administrator: ', savedAdmin);
        alert('Saved Administrator');
        window.location.href = "index.html";
    } else {
        alert('There was a problem saving the admin');
    }
}

async function verifyEmail() {  
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        messageDiv.textContent = 'Token no encontrado en el enlace.';
        messageDiv.classList.add('error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message || '¡Correo verificado con éxito!';
            messageDiv.classList.add('success');
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        } else {
            messageDiv.textContent = data.error || 'Token inválido o expirado.';
            messageDiv.classList.add('error');
        }
    } catch (err) {
        messageDiv.textContent = 'Error al verificar el correo.';
        messageDiv.classList.add('error');
    }
}


// Verificate data
async function AdminPinLogin(event) {
    event.preventDefault();
    
    const token = sessionStorage.getItem('jwtToken');
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
                'Authorization': `Bearer ${token}`
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