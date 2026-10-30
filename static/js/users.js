const usersList = document.getElementById("users-list");
const usersStatus = document.getElementById("users-status");
const openUserDialogButton = document.getElementById("open-user-dialog");
const userDialog = document.getElementById("user-dialog");
const deleteUserDialog = document.getElementById("delete-user-dialog");
const userForm = document.getElementById("user-form");
const userIdInput = document.getElementById("user-id");
const userNameInput = document.getElementById("user-name");
const userEmailInput = document.getElementById("user-email");
const userRoleInput = document.getElementById("user-role");
const userStateInput = document.getElementById("user-state");
const userDialogTitle = document.getElementById("user-dialog-title");
const userDialogDescription = document.getElementById("user-dialog-description");
const userFormMessage = document.getElementById("user-form-message");
const submitUserFormButton = document.getElementById("submit-user-form");
const closeUserDialogButton = document.getElementById("close-user-dialog");
const cancelUserDialogButton = document.getElementById("cancel-user-dialog");
const cancelDeleteDialogButton = document.getElementById("cancel-delete-dialog");
const confirmDeleteUserButton = document.getElementById("confirm-delete-user");
const deleteUserMessage = document.getElementById("delete-user-message");

let users = [];
let pendingDeleteUser = null;

const roleLabels = {
    ADMINISTRADOR: "Administrador",
    PERSONAL_DE_SALUD: "Personal de salud"
};

function initials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
}

function setUsersStatus(message, type = "") {
    usersStatus.className = "user-management-status";
    usersStatus.replaceChildren();

    const icon = document.createElement("span");
    icon.textContent = type === "success" ? "✓" : type === "error" ? "!" : "i";
    usersStatus.append(icon, document.createTextNode(` ${message}`));

    if (type) {
        usersStatus.classList.add(`is-${type}`);
    }
}

function renderUsers() {
    usersList.replaceChildren();

    if (users.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.className = "users-empty-state";
        cell.textContent = "No hay usuarios registrados. Crea el primero para otorgar acceso.";
        row.appendChild(cell);
        usersList.appendChild(row);
        return;
    }

    users.forEach(user => {
        const row = document.createElement("tr");

        const userCell = document.createElement("td");
        const identity = document.createElement("div");
        identity.className = "user-identity";
        const avatar = document.createElement("span");
        avatar.className = "user-avatar";
        avatar.textContent = initials(user.nombre);
        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = user.nombre;
        const email = document.createElement("span");
        email.textContent = user.correo;
        details.append(name, email);
        identity.append(avatar, details);
        userCell.appendChild(identity);

        const roleCell = document.createElement("td");
        const role = document.createElement("span");
        role.className = `role-badge ${user.rol === "ADMINISTRADOR" ? "is-admin" : ""}`;
        role.textContent = roleLabels[user.rol] || user.rol;
        roleCell.appendChild(role);

        const stateCell = document.createElement("td");
        const state = document.createElement("span");
        state.className = `user-state ${user.estado === "ACTIVO" ? "is-active" : "is-inactive"}`;
        state.textContent = user.estado === "ACTIVO" ? "Activo" : "Inactivo";
        stateCell.appendChild(state);

        const actionsCell = document.createElement("td");
        actionsCell.className = "user-row-actions";
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.dataset.editUser = user.id;
        editButton.setAttribute("aria-label", `Editar a ${user.nombre}`);
        editButton.textContent = "Editar";
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.dataset.deleteUser = user.id;
        deleteButton.className = "delete-user-button";
        deleteButton.setAttribute("aria-label", `Eliminar a ${user.nombre}`);
        deleteButton.textContent = "Eliminar";
        actionsCell.append(editButton, deleteButton);

        row.append(userCell, roleCell, stateCell, actionsCell);
        usersList.appendChild(row);
    });
}

async function loadUsers() {
    setUsersStatus("Cargando usuarios...");

    try {
        const response = await fetch("/api/usuarios");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No fue posible cargar los usuarios.");
        }

        users = data.usuarios;
        renderUsers();
        setUsersStatus(`${users.length} usuarios registrados en el sistema.`, "success");
    } catch (error) {
        setUsersStatus(error.message, "error");
    }
}

function openDialog(dialog) {
    if (typeof dialog.showModal === "function") {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "");
    }
}

function closeDialog(dialog) {
    if (typeof dialog.close === "function") {
        dialog.close();
    } else {
        dialog.removeAttribute("open");
    }
}

function openUserDialog(user = null) {
    userForm.reset();
    userFormMessage.textContent = "";
    userIdInput.value = user?.id || "";

    if (user) {
        userDialogTitle.textContent = "Editar usuario";
        userDialogDescription.textContent = "Actualiza los datos y permisos de la cuenta.";
        submitUserFormButton.textContent = "Guardar cambios";
        userNameInput.value = user.nombre;
        userEmailInput.value = user.correo;
        userRoleInput.value = user.rol;
        userStateInput.value = user.estado;
    } else {
        userDialogTitle.textContent = "Crear usuario";
        userDialogDescription.textContent = "Registra una cuenta para el sistema.";
        submitUserFormButton.textContent = "Crear usuario";
    }

    openDialog(userDialog);
    userNameInput.focus();
}

openUserDialogButton.addEventListener("click", () => openUserDialog());
closeUserDialogButton.addEventListener("click", () => closeDialog(userDialog));
cancelUserDialogButton.addEventListener("click", () => closeDialog(userDialog));
cancelDeleteDialogButton.addEventListener("click", () => closeDialog(deleteUserDialog));

usersList.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-user]");
    const deleteButton = event.target.closest("[data-delete-user]");

    if (editButton) {
        const user = users.find(item => item.id === Number(editButton.dataset.editUser));
        if (user) {
            openUserDialog(user);
        }
        return;
    }

    if (deleteButton) {
        pendingDeleteUser = users.find(item => item.id === Number(deleteButton.dataset.deleteUser));

        if (pendingDeleteUser) {
            deleteUserMessage.textContent =
                `Eliminarás el acceso de ${pendingDeleteUser.nombre}. Esta acción no se puede deshacer.`;
            openDialog(deleteUserDialog);
        }
    }
});

userForm.addEventListener("submit", async event => {
    event.preventDefault();

    const userId = Number(userIdInput.value);
    const isEditing = Boolean(userId);
    const userData = {
        nombre: userNameInput.value,
        correo: userEmailInput.value,
        rol: userRoleInput.value,
        estado: userStateInput.value
    };

    submitUserFormButton.disabled = true;
    userFormMessage.textContent = "Guardando...";

    try {
        const response = await fetch(
            isEditing ? `/api/usuarios/${userId}` : "/api/usuarios",
            {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            }
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No fue posible guardar el usuario.");
        }

        await loadUsers();
        closeDialog(userDialog);
        setUsersStatus(
            isEditing ? "Usuario actualizado correctamente." : "Usuario creado correctamente.",
            "success"
        );
    } catch (error) {
        userFormMessage.textContent = error.message;
    } finally {
        submitUserFormButton.disabled = false;
    }
});

confirmDeleteUserButton.addEventListener("click", async () => {
    if (!pendingDeleteUser) {
        return;
    }

    confirmDeleteUserButton.disabled = true;

    try {
        const response = await fetch(`/api/usuarios/${pendingDeleteUser.id}`, {
            method: "DELETE"
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No fue posible eliminar el usuario.");
        }

        await loadUsers();
        closeDialog(deleteUserDialog);
        setUsersStatus("Usuario eliminado correctamente.", "success");
        pendingDeleteUser = null;
    } catch (error) {
        deleteUserMessage.textContent = error.message;
    } finally {
        confirmDeleteUserButton.disabled = false;
    }
});

loadUsers();
