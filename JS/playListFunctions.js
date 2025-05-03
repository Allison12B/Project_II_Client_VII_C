//Find the params adminId in the url
function getAdminIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("adminId"); 
}

//Go back to the playListAdmin.html
function goBackWithAdminId() {
    const adminId = getAdminIdFromUrl();
    if (adminId) {
        window.location.href = `playListAdmin.html?adminId=${adminId}`;
    }
}

//Find the params profileId
function getRestrictedUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("profileId"); 
}

//Set a buttom to redirect to crate playlist page
function createPlaylistButton() {
    const adminId = getAdminIdFromUrl();
    if(adminId != null) {
        const createButtonContainer = document.getElementById("createPlaylistButton");
        createButtonContainer.innerHTML = `
            <a href="playListCreateAdmin.html?adminId=${adminId}" class="btn btn-success mt-3 mb-3">Crear</a>
        `;
    }
}

// Query of graphQL API
function queryPlaylistByTable() {
    const query = `
        {
            getPlayListByAdminUser {
            _id
            name
            }
        }
    `;
    return query;
}

function queryRestrictedUserByCheckBox() {
    const query = `
        {
            getRestrictedUserByAdmin {
                _id
                name
            }
        }
    `;
    return query;
}

// Request of graphQL API
// Return the admin´s playlist from the GraphQL API
async function fetchPlaylist(query) {
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
        
        const profiles = result.data.getPlayListByAdminUser;
        console.log('Playlist:', profiles);
        return profiles;

    } catch (error) {
        console.error("Error getting playlist:", error);
        alert("Error to get playlist");
    }
}

// Return the admin´s restricted users from the GraphQL API
async function fetchProfiles(query) {
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

        const profiles = result.data.getRestrictedUserByAdmin;
        console.log('Profiles:', profiles);

        return profiles;

    } catch (error) {
        console.error("Error getting restricted users:", error);
        alert("Error to get restricted users");
    }

}


// Count of videos playlist
async function getVideoCountByPlayList(playListId) {

}

//Get all playlist by Restricted USer
async function getPlaylistsByRestrictedUser() {
    const restrictedUserId = getRestrictedUserIdFromUrl()
    
    if (!restrictedUserId) {
        console.error("Error: restrictedUserId is required.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/playList/retrictedUser/${restrictedUserId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error fetching playlists.");
        }

        const playlists = await response.json();
        console.log("Playlists for restricted user:", playlists);
        
        const tableBody = document.getElementById("playListRestrictedTableBody");
        tableBody.innerHTML = "";  

        if (playlists.length === 0) {
            console.warn("No playlists found for this user");
            return;
        }

        for (const [index, playlist] of playlists.entries()) {
            
            //BORRAR ESTOO!!!!!
            const countVideos = await getVideoCountByPlayList(playlist._id); 
            const row = document.createElement("tr");

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${playlist.name}</td>
                <td>${countVideos}</td>

                <td>
                    <a href="../restrictedUser/videosRestrictedUser.html?adminId=${getAdminIdFromUrl()}&profileId=${getRestrictedUserIdFromUrl()}&playlistId=${playlist._id}" class="btn btn-warning btn-sm">Watch videos</a>
                </td>
            `;

            tableBody.appendChild(row);
        }

    } catch (error) {
        console.error("Error fetching playlists:", error);
        return null;
    }
}

// Get all playlist with reference an admin 
async function getPlaylistsByAdmin() {
    try {
        const playlists = await fetchPlaylist(queryPlaylistByTable());
        
        console.log("Playlists obtenidas:", playlists); 

        if (playlists.length === 0) {
            console.alert("This admin doesn´t has playlists");
            return;
        }

        //CAMBIAR A UN MÉTODO QUE CAPTURE LA CANTIDAD DE VIDEO DE UNA LISTA
        const countVideos = playlists.length;

        const tableBody = document.getElementById("playListTableBody");
        tableBody.innerHTML = ""; 

        for (const [index, playlist] of playlists.entries()) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${playlist.name}</td>
                <td>${countVideos}</td>
                <td>
                    <a href="" class="btn btn-warning btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm" onclick="deletePlayList('${playlist._id}')">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error("Error obteniendo las playlists:", error);
    }
}

// Delete playlist
async function deletePlayList(playListId) {
    const token = sessionStorage.getItem('jwtToken');
    try {
        const response = await fetch(`http://127.0.0.1:3001/api/playList/${playListId}`, {
            method: 'DELETE', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error al eliminar la playlist:", errorData.error);
            alert(`Error: ${errorData.error}`);  
            return;
        }

        alert("PlayList deleted");

        getPlaylistsByAdmin();

    } catch (error) {
        console.error("Error request delete:", error);
        alert("Error request delete");
    }
}

//Take restricted users in check box WITH GraphQL
async function getRestrictedUsers() {
    try {
        const restrictedUsers =  await fetchProfiles(queryRestrictedUserByCheckBox());
        console.log("Mensaje desde el cliente, usuarios restringidos: ", restrictedUsers)

        
        if (restrictedUsers.length === 0) {
            console.log("The admin don´t has restricted users");
            return;
        }

        
        const container = document.getElementById("restrictedUsersContainer");
        container.innerHTML = ""; 

        
        restrictedUsers.forEach(user => {
            const userDiv = document.createElement("div");
            userDiv.classList.add("form-check");

            
            userDiv.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${user._id}" id="user-${user._id}">
                <label class="form-check-label" for="user-${user._id}">${user.name} </label>
            `;

            
            container.appendChild(userDiv);
        });

    } catch (error) {
        console.error("Error al obtener los usuarios restringidos:", error);
    }
}

// Función para obtener los usuarios seleccionados
function getSelectedUsers() {
    const selectedUsers = [];

    const checkboxes = document.querySelectorAll(".form-check-input:checked");

    checkboxes.forEach(checkbox => {
        selectedUsers.push(checkbox.value);
    });

    console.log("Usuarios seleccionados:", selectedUsers);
    return selectedUsers;
}

//Create new playlist
async function createPlaylist() {
    const name = document.getElementById("videoName").value.trim();
    const adminUser = getAdminIdFromUrl(); 
    const restrictedUsers = getSelectedUsers();
    const token = sessionStorage.getItem('jwtToken');

    if (!name) {
        alert("Complete all the inputs");
        return;
    }

    const playlistData = {
        name,
        restrictedUsers,
        adminUser
    };

    try {
        const response = await fetch("http://localhost:3001/api/playList/create/${adminUser}", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(playlistData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Playlist was create succecfull!");
            console.log("New Playlist:", data);
            goBackWithAdminId();
        } else {
            console.error("Error when try create playlist:", data);
            alert("Error: " + (data.error || "Isn´t possible create playlist"));
        }
    } catch (error) {
        console.error("Error in the request:", error);
        alert("Error in the request. Check the console");
    }
}



function isCreatePlaylistPage() {
    return window.location.pathname.includes("playListCreateAdmin.html");
}


function isPlayListAdminPage() {
    return window.location.pathname.includes("playListAdmin.html");
}

function isPlaylistRestrictedUSerPage() {
    return window.location.pathname.includes("playlistRestrictedUser.html");
}


document.addEventListener("DOMContentLoaded", function() {
    
    if (isPlayListAdminPage()) {
        getPlaylistsByAdmin(); 
        createPlaylistButton();
    }

    if (isCreatePlaylistPage()) {
        getRestrictedUsers(); 
    }

    if (isPlaylistRestrictedUSerPage()) {
        getPlaylistsByRestrictedUser(); 
    }
});