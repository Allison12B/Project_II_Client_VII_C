// Obtener token desde URL o sessionStorage
const params = new URLSearchParams(window.location.search);
let token = params.get("jwtToken");

if (token) {
  sessionStorage.setItem("jwtToken", token);
  window.history.replaceState({}, "", window.location.pathname);
} else {
  token = sessionStorage.getItem("jwtToken");
}

if (token) {
  fetch("/api/users/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("user-info").innerHTML = `
      <p><strong>Nombre:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <img src="${data.picture}" width="100" />
    `;
  })
  .catch(err => {
    document.getElementById("user-info").textContent = "Error al cargar el perfil.";
  });
} else {
  document.getElementById("user-info").textContent = "No autenticado.";
}
