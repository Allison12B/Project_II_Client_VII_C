const token = sessionStorage.getItem('jwtToken');
if (!token) {
    window.location.href = "index.html";
}

function assignEditEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profileId = e.currentTarget.getAttribute('data-id');
            window.location.href = `profileEdit.html?adminId=${getUrlParam('adminId')}&profileId=${profileId}`;
        });
    });
}

function getAdminIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("adminId"); 
}

//Find the params profileId
function getRestrictedUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("profileId"); 
}

//Get params
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function redirectToProfileEdit(param) {
    window.location.href = `../restrictedUser/profileEdit.html?adminId=${getAdminIdFromUrl()}&profileId=${param}`;
}

//Go back to the restrictedUserAdmin.html
function goBackWithAdminId() {
    const adminId = getAdminIdFromUrl();
    if (adminId) {
        window.location.href = `../restrictedUser/restrictedUserAdmin.html?adminId=${adminId}`;
    }
}

// Client inputs
function clearInputs(inputs) {
    inputs.forEach(input => {
        input.value = '';
    });
}

// Go to the view of restricted users playlists
function selectProfile(profileId) {
    window.location.href = `profileLogin.html?adminId=${getUrlParam('adminId')}&profileId=${profileId}`;
}

// Query of graphQL API
function queryRestrictedUserCards() {
    const query = `
        {
            getRestrictedUserByAdmin {
                _id
                name
                avatar
            }
        }
    `;
    return query;
}

function queryRestrictedUserTable() {
    const query = `
        {
            getRestrictedUserByAdmin {
                _id
                avatar
                name
                pin
                age
            }
        }
    `;
    return query;
}

function queryRestrictedUserById(id) {
    const query = `
        {
            getRestrictedUserById(id: "${id}") {
                _id
                age
                avatar
                name
                pin
            }
        }
    `;
    return query;
}

// Return the admin´s restricted users from the GraphQL API
async function fetchGraphQL(query) {
    const token = sessionStorage.getItem('jwtToken');

    try {

        const response = await fetch("http://localhost:4000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query })
        });

        const result = await response.json();

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            return;
        }

        const data = result.data;
        console.log("GraphQL result:", data);
        return data;

    } catch (error) {
        console.error("Error getting data:", error);
        alert("Error to get data");
    }
}


//Get all profiles and create cards with the information of each profile
async function getProfiles() {
    try {
        const profilesData = await fetchGraphQL(queryRestrictedUserCards());

        const profiles = profilesData.getRestrictedUserByAdmin;


        console.log('Perfiles obtenidos:', profiles);

        if (!profiles) return;
    
        const container = document.getElementById('profiles');
    
        if (!container) {
            console.error('Element with ID "profiles" not found');
            return;
        }
    
        container.innerHTML = '';
    
        if (!Array.isArray(profiles)) {
            console.error('Received data is not an array:', profiles);
            return;
        }
    
        const row = document.createElement('div');
        row.className = 'row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4';
        container.appendChild(row);
    
        profiles.forEach(profile => {
            const col = document.createElement('div');
            col.className = 'col';
    
            const card = document.createElement('div');
            card.className = 'card h-100 profile-card';
            card.style.cursor = 'pointer';
    
            card.addEventListener('click', () => {
                selectProfile(profile._id);
            });
    
            const avatarImg = profile.avatar
                ? `<img src="${profile.avatar}" class="card-img-top profile-avatar" alt="Avatar">`
                : '<div class="no-avatar"><i class="fas fa-user-circle"></i></div>';
    
            card.innerHTML = `
                <div class="card-body text-center">
                    ${avatarImg}
                    <h5 class="card-title mt-3">${profile.name || 'Sin nombre'}</h5>
                </div>
            `;
    
            col.appendChild(card);
            row.appendChild(col);
        });

    } catch (error) {
        console.error('Error loading profiles:', error);
        alert('Error loading profiles. See console for details.');
    }
}

//Create a table with the admin´s restricted users
async function getProfilesTable() {
    try{
        const profilesData = await fetchGraphQL(queryRestrictedUserTable());
        const profiles = profilesData.getRestrictedUserByAdmin;
        if (!profiles) return;

        const container = document.getElementById('profilesTable');
        if (!container) return;

        container.innerHTML = '';

        profiles.forEach((profile, index) => {
            const row = document.createElement('tr');

            const avatar = profile.avatar
                ? `<img src="../${profile.avatar}" style="width: 100px; height: 80px; border-radius: 50%;" alt="Avatar">`
                : `<i class="fas fa-user-circle" style="font-size: 2rem;"></i>`;

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${profile.name || 'Sin nombre'}</td>
                <td>${profile.age || ''}</td>
                <td>${profile.pin ? '••••••' : ''}</td>
                <td>${avatar}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${profile._id}" onclick="redirectToProfileEdit('${profile._id}')>
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${profile._id}" onclick="deleteProfile('${profile._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;

            container.appendChild(row);
            assignEditEvents();
        });
    }catch (error) {
        console.error('Error loading profiles:', error);
        alert('Error loading profiles. See console for details.');
    }
}

//Get information about a restricted user by ID 
async function getInformationAboutRestrictedUser() {
    const restrictedUserData = await fetchGraphQL(queryRestrictedUserById(getRestrictedUserIdFromUrl()));
    const restrictedUser = restrictedUserData.getRestrictedUserById;

    document.getElementById('nameProfile').value = restrictedUser.name;
    document.getElementById('ageProfile').value = restrictedUser.age;
    document.getElementById('pinProfile').value = restrictedUser.pin;
    document.getElementById('avatarProfile').value = restrictedUser.avatar;
}

// Save a new profile
async function createProfile() {
    const adminUserId = getUrlParam('adminId');
    const token = sessionStorage.getItem('jwtToken');

    if (!token) {
        alert("No estás autenticado. Por favor inicia sesión.");
        window.location.href = '../index.html';
        return;
    }

    if (!adminUserId) {
        alert("Admin ID not found.");
        window.location.href = 'profileHome.html';
        return;
    }

    const name = document.getElementById('nameProfile').value.trim();
    const age = parseInt(document.getElementById('ageProfile').value.trim());
    const pin = parseInt(document.getElementById('pinProfile').value.trim());
    const avatar = document.getElementById('avatarProfile').value.trim();

    // Validate inputs
    if (
        typeof name !== 'string' || name.trim() === '' ||
        typeof age !== 'number' || age < 1 || age > 12 ||
        typeof pin !== 'number' || pin < 100000 || pin > 999999
    ) {
        alert('Please provide valid data');
        return;
    }

    // Create profile object
    const profile = {
        name,
        age,
        pin,
        avatar,
        adminId: adminUserId
    };

    try {
        const response = await fetch("http://localhost:3001/api/restrictedUser", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profile),
        });

        if (response.ok) {
            const savedProfile = await response.json();
            console.log('Saved Restricted User: ', savedProfile);
            alert('Profile saved successfully!');
            window.location.href = `profileHome.html?adminId=${getUrlParam('adminId')}`;
        } else {
            const error = await response.json();
            alert(`Error: ${error.message || 'Failed to save profile'}`);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('An error occurred while saving the profile');
    }
}




//Edit an specific profile
async function updateProfile() {
    const id = getRestrictedUserIdFromUrl(); 
    const token = sessionStorage.getItem('jwtToken');

    if (!token) {
        alert("You Unauthorized, please log in");
        window.location.href = '../index.html';
        return;
    }

    const name = document.getElementById("nameProfile").value.trim();
    const age = parseInt(document.getElementById("ageProfile").value);
    const pin = parseInt(document.getElementById("pinProfile").value);
    const avatar = document.getElementById("avatarProfile").value;

    if (!name || isNaN(age) || isNaN(pin) || pin < 100000 || pin > 999999 || !avatar) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const userData = {
        name,
        age,
        pin,
        avatar,
        id
    };

    try {
        const response = await fetch(`http://localhost:3001/api/restrictedUser/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user.');
        }

        const updatedUser = await response.json();
        alert('Profile updated successfully.');
        // Redirigir a donde necesites
        window.location.href = `../restrictedUser/restrictedUserAdmin.html?adminId=${getAdminIdFromUrl()}`;
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('There was an error updating the profile.');
    }
}


//Delete an specific profile
async function deleteProfile(profileId) {
    const token = sessionStorage.getItem('jwtToken');

    if (!profileId) {
        console.error('No profile ID provided');
        return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este perfil?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/restrictedUser/${profileId}`, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Perfil eliminado:', result);

            alert('Perfil eliminado correctamente');
            goBackWithAdminId();
        } else {
            const error = await response.json();
            console.error('Error al eliminar:', error);
            alert(`Error: ${error.message || 'No se pudo eliminar el perfil'}`);
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error al conectar con el servidor');
    }
}

// Verificated the pin of restricted users
async function pinFormValidated(event) {
    event.preventDefault();

    const token = sessionStorage.getItem('jwtToken');
    const adminId = getUrlParam('adminId');
    const profileId = getUrlParam('profileId');

    if (!adminId || !profileId) {
        alert("Missing required parameters");
        window.location.href = 'profileHome.html';
        return;
    }

    const inputs = document.querySelectorAll('.otp-input');
    const pin = Array.from(inputs).map(input => input.value).join('');

    if (pin.length !== 6) {
        alert("Please enter a 6-digit code");
        return;
    }

    try {

        const response = await fetch(`http://localhost:3001/api/restrictedUserLogin/${profileId}`, {
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

            window.location.href = `restrictedUser/playlistRestrictedUser.html?adminId=${adminId}&profileId=${profileId}`;
        } else {
            clearInputs(inputs); // Clean the pin input
            inputs[0].focus();
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert(error.message || "An error occurred during verification");
        clearInputs(inputs);  // Clean the pin input
        inputs[0].focus();
    }
}

// Capture all data inputs to create a pin an validate if is correct
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

            // Focus the last input if the paste fills all fields
            if (pasteArray.length >= inputs.length) {
                inputs[inputs.length - 1].focus();
            } else {
                inputs[pasteArray.length].focus();
            }
        });


        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// Redirections
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

function deleteSession() {
    sessionStorage.removeItem('jwtToken'); 
    window.location.href = 'index.html';
}


// Calls the function when the page load
function isProfileEdit() {
    return window.location.pathname.includes("profileEdit.html");
}


document.addEventListener('DOMContentLoaded', function () {

    if (document.getElementById('profiles')) {
        getProfiles();
    } else if (document.getElementById('profilesTable')) {
        getProfilesTable();
    }

    setupPinInputs();
    updateBackLink();

    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', pinFormValidated);
    }

    if(isProfileEdit()) {
        getInformationAboutRestrictedUser()
    }
});