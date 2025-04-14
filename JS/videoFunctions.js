//Find the params adminId in the url
function getAdminIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("adminId"); 
}

//Find the params profileId
function getRestrictedUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("profileId"); 
}

//Find the params playlistId
function getplaylistIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("playlistId"); 
}


//Go back to the playListAdmin.html
function goBackWithAdminId() {
    const adminId = getAdminIdFromUrl();
    if (adminId) {
        window.location.href = `../videoViews/videoAdmin.html?adminId=${adminId}`;
    }
}

// Get all the videos
async function getVideos() {
    try {
        const response = await fetch("http://localhost:3001/api/video");
        const videos = await response.json();
        console.log("Videos obtenidos:", videos); // Confirmación en consola

        const createButtonContainer = document.getElementById("createVideoButton");
        createButtonContainer.innerHTML = `
            <a href="../videoViews/videoCreateAdmin.html?adminId=${getAdminIdFromUrl()}" class="btn btn-success mt-3 mb-3">Crear</a>
        `;

        // Verificar si hay videos
        if (!videos.length) {
            console.warn("No videos found");
            return;
        }

        const tableBody = document.getElementById("videosTableBody");
        tableBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

        videos.forEach((video, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${video.name}</td>
                <td>${video.url}</td>
                <td>${video.description}</td>
                <td>
                    <a href="" class="btn btn-warning btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video._id}')">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error obteniendo los videos:", error);
    }
}

//Create a new video
async function createVideo() {
    
    const name = document.getElementById('videoName').value;
    const url = document.getElementById('videoUrl').value;
    const description = document.getElementById('descriptionVideo').value;
    const playLists = []; 

    
    if (!name || !url) {
        alert('Please, complete the data');
        return;
    }

    
    const newVideo = {
        name: name,
        url: url,
        description: description,
        playLists: playLists
    };

    try {
    
        const response = await fetch('http://localhost:3001/api/video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newVideo),
        });

        if (!response.ok) {
            
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
            return;
        }

    
        const data = await response.json();
        alert(`Video was create. Video Id: ${data._id}`);
        goBackWithAdminId();
    
    } catch (error) {
        console.error('Error creating video:', error);
        alert('Error creating videovideo.');
    }
}

//Delete a video
async function deleteVideo(videoId) {

    try {
        
        const response = await fetch(`http://localhost:3001/api/video/${videoId}`, {
            method: 'DELETE',
        });

        if (response.status === 404) {
        
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
            return;
        }

        if (response.status === 204) {
            
            alert('video deleted');

            goBackWithAdminId(); 
        }
    } catch (error) {
        console.error('Error deleting the video:', error);
        alert('Error deleting the video.');
    }
}

//Get admin´s playlist in checkbox
async function getAdminPlaylists() {
    const adminId = getAdminIdFromUrl(); 
    if (!adminId) {
        console.error("Admin ID not found in URL");
        return;
    }

    try {
        console.log("Entró en el método de cargar los checkboxes de playlists");
        
        const response = await fetch(`http://localhost:3001/api/playList/adminUser/${adminId}`);
        const playlists = await response.json();
        
        console.log("Playlists desde el cliente: ", playlists);

        if (!Array.isArray(playlists) || playlists.length === 0) {
            console.log("No playlists found for this admin");
            return;
        }

        const container = document.getElementById("playlistsContainer");
        container.innerHTML = ""; 

        playlists.forEach(playlist => {
            const playlistDiv = document.createElement("div");
            playlistDiv.classList.add("form-check");

            playlistDiv.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${playlist._id}" id="playlist-${playlist._id}">
                <label class="form-check-label" for="playlist-${playlist._id}">${playlist.name}</label>
            `;

            container.appendChild(playlistDiv);
        });

    } catch (error) {
        console.error("Error to getting playlists:", error);
    }
}

//Get playlist´s videos
async function getVideosByPlaylist() {
    const playListId = getplaylistIdFromUrl(); 

    if (!playListId) {
        console.error("Error: Playlist ID is required.");
        return;
    }

    try {
        
        const response = await fetch(`http://localhost:3001/api/video/playList/${playListId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error fetching videos.");
        }

        const videos = await response.json();
        console.log("Videos for playlist:", videos);

        const tableBody = document.getElementById("videosRestrictedUserTableBody");
        tableBody.innerHTML = ""; 

        if (videos.length === 0) {
            console.warn("No videos found for this playlist");
            return;
        }

    
        videos.forEach((video, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${video.name}</td>
                <td>${video.url}</td>
                <td>${video.description || 'No description'}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}

/* Llamar a la función cuando la página cargue
document.addEventListener("DOMContentLoaded", function() {
    getVideosByPlaylist(); 
});*/



// Calls the function when the page load
function isVideoAdminPage() {
    return window.location.pathname.includes("videoAdmin.html");
}


function isVideoEditAdminPage() {
    return window.location.pathname.includes("videoEditAdmin.html");
}

function isVideoRestrictedUserPage() {
    return window.location.pathname.includes("videosRestrictedUser.html");
}

document.addEventListener("DOMContentLoaded", function() {
    
    if (isVideoAdminPage()) {
        getVideos(); 
    }

    if (isVideoEditAdminPage()) {
        getAdminPlaylists(); 
    }

    if (isVideoRestrictedUserPage()) {
        getVideosByPlaylist(); 
    }
});
