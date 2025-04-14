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

// Count of videos playlist
async function getVideoCountByPlayList(playListId) {
    try {
        const response = await fetch(`http://127.0.0.1:3001/api/video/playList/${playListId}`);

        if (!response.ok) {
            console.error("Error to getting the videos: ", response.status, response.statusText);
            return 0; 
        }

        const videos = await response.json();
        
        if (!Array.isArray(videos)) {
            console.error("It isn´t a array:", videos);
            return 0; 
        }

        return videos.length;

    } catch (error) {
        console.error("Error to getting videos count:", error);
        return 0; 
    }
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
        const adminId = getAdminIdFromUrl(); 
        if (!adminId) {
            console.error("Admin ID not found in URL");
            return;
        }
        

        const response = await fetch(`http://localhost:3001/api/playList/adminUser/${adminId}`);
        const playlists = await response.json();
        console.log("Playlists obtenidas:", playlists); 

        const createButtonContainer = document.getElementById("createPlaylistButton");
        createButtonContainer.innerHTML = `
            <a href="playListCreateAdmin.html?adminId=${adminId}" class="btn btn-success mt-3 mb-3">Crear</a>
        `;

        if (playlists.length === 0) {
            console.warn("No playlists found");
            return;
        }

        const tableBody = document.getElementById("playListTableBody");
        tableBody.innerHTML = ""; 

        for (const [index, playlist] of playlists.entries()) {
            const countVideos = await getVideoCountByPlayList(playlist._id); 

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
    try {
        const response = await fetch(`http://127.0.0.1:3001/api/playList/${playListId}`, {
            method: 'DELETE', 
            headers: {
                'Content-Type': 'application/json' 
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

//Take restricted users in check box
async function getRestrictedUsers() {
    const adminId = getAdminIdFromUrl(); 
    if (!adminId) {
        console.error("Admin ID not found in URL");
        return;
    }

    try {
        console.log("Entró en el método de cargar los checkbox");
        
        const response = await fetch(`http://localhost:3001/api/restrictedUser/adminUser/${adminId}`);

        
        const restrictedUsers = await response.json();
        console.log("Desde el cliente: ", restrictedUsers)

        
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
                "Content-Type": "application/json"
            },
            body: JSON.stringify(playlistData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Playlist creada exitosamente!");
            console.log("Nueva Playlist:", data);
            goBackWithAdminId();
        } else {
            console.error("Error al crear la playlist:", data);
            alert("Error: " + (data.error || "No se pudo crear la playlist"));
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Hubo un problema al crear la playlist.");
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
    }

    if (isCreatePlaylistPage()) {
        getRestrictedUsers(); 
    }

    if (isPlaylistRestrictedUSerPage()) {
        getPlaylistsByRestrictedUser(); 
    }
});