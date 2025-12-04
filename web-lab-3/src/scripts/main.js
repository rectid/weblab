const jsonRequest = async (url, { method = "GET", body } = {}) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error ?? `Ошибка запроса: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const showToast = (message, type = "success") => {
  const toastContainer = document.querySelector("#liveToast");
  const toastBody = toastContainer?.querySelector(".toast-body");
  if (!toastContainer || !toastBody) {
    alert(message); // fallback для простоты
    return;
  }
  toastBody.textContent = message;
  toastContainer.classList.remove("text-bg-success", "text-bg-danger");
  toastContainer.classList.add(type === "error" ? "text-bg-danger" : "text-bg-success");
  const toast = bootstrap.Toast.getOrCreateInstance(toastContainer);
  toast.show();
};

const initUserEditor = () => {
  const editButtons = document.querySelectorAll("[data-edit-user]");
  const deleteButtons = document.querySelectorAll("[data-delete-user]");
  const addButton = document.querySelector("[data-add-user]");
  const form = document.querySelector("#user-edit-form");
  const modalElement = document.getElementById("userEditModal");
  const modal = modalElement ? bootstrap.Modal.getOrCreateInstance(modalElement) : null;
  const modalTitle = modalElement?.querySelector(".modal-title");

  if (!form || !modal) {
    return;
  }

  let currentUserId = null;
  const defaultRole = form.dataset.defaultRole ?? "user";
  const defaultStatus = form.dataset.defaultStatus ?? "pending";

  if (addButton) {
    addButton.addEventListener("click", () => {
      currentUserId = null;
      form.reset();
      form.querySelector("[name=role]").value = defaultRole;
      form.querySelector("[name=status]").value = defaultStatus;
      form.querySelector("[name=photo]").value = "https://placehold.co/96x96?text=NEW";
      if (modalTitle) {
        modalTitle.textContent = "Добавить участника";
      }
      modal.show();
    });
  }

  editButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      currentUserId = button.dataset.editUser;
      if (!currentUserId) {
        return;
      }
      try {
        const user = await jsonRequest(`/api/users/${currentUserId}`);
        form.querySelector("[name=fullName]").value = user.fullName ?? "";
        form.querySelector("[name=birthDate]").value = user.birthDate ?? "";
        form.querySelector("[name=email]").value = user.email ?? "";
        form.querySelector("[name=photo]").value = user.photo ?? "";
        form.querySelector("[name=role]").value = user.role ?? "user";
        form.querySelector("[name=status]").value = user.status ?? "pending";
        if (modalTitle) {
          modalTitle.textContent = "Редактировать участника";
        }
        modal.show();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      const isUpdate = Boolean(currentUserId);
      const targetUrl = isUpdate ? `/api/users/${currentUserId}` : "/api/users";
      const method = isUpdate ? "PUT" : "POST";
      await jsonRequest(targetUrl, {
        method,
        body: payload
      });
      modal.hide();
      showToast(isUpdate ? "Пользователь обновлён" : "Пользователь создан");
      window.location.reload();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.dataset.deleteUser;
      if (!userId || !confirm("Удалить пользователя и записи о дружбе?")) {
        return;
      }
      try {
        await jsonRequest(`/api/users/${userId}`, { method: "DELETE" });
        showToast("Пользователь удалён");
        window.location.reload();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
};

const initFriendManagement = () => {
  const selector = document.getElementById("friendUserSelect");
  const addForm = document.getElementById("friend-add-form");
  const removeButtons = document.querySelectorAll("[data-remove-friend]");

  if (selector) {
    selector.addEventListener("change", (event) => {
      const userId = event.target.value;
      const url = new URL(window.location.href);
      url.searchParams.set("userId", userId);
      window.location.href = url.toString();
    });
  }

  if (addForm) {
    addForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(addForm);
      const userId = formData.get("userId");
      const friendId = formData.get("friendId");
      if (!userId || !friendId) {
        return;
      }
      try {
        await jsonRequest("/api/friends", {
          method: "POST",
          body: { userId, friendId }
        });
        showToast("Связь сохранена");
        window.location.reload();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }

  removeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const { removeFriendUser: userId, removeFriendTarget: friendId } = button.dataset;
      if (!userId || !friendId) {
        return;
      }
      try {
        await jsonRequest("/api/friends", {
          method: "DELETE",
          body: { userId, friendId }
        });
        showToast("Связь удалена");
        window.location.reload();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
};

const initNewsPage = () => {
  const selector = document.getElementById("newsUserSelect");
  const form = document.getElementById("news-add-form");

  if (selector) {
    selector.addEventListener("change", (event) => {
      const userId = event.target.value;
      const url = new URL(window.location.href);
      url.searchParams.set("userId", userId);
      window.location.href = url.toString();
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const authorId = formData.get("authorId");
      const text = formData.get("text");
      if (!authorId || !text) {
        return;
      }
      try {
        await jsonRequest("/api/messages", {
          method: "POST",
          body: { authorId, text }
        });
        showToast("Новость опубликована");
        form.reset();
        window.location.reload();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initUserEditor();
  initFriendManagement();
  initNewsPage();
});
