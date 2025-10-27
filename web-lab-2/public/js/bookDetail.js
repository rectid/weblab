const pageRoot = document.body;
const bookId = pageRoot.dataset.bookId;
const bookForm = document.getElementById("bookForm");
const toastDetail = document.getElementById("detailToast");
const checkoutDialogDetail = document.getElementById("detailCheckoutDialog");
const checkoutFormDetail = document.getElementById("detailCheckoutForm");
const cancelCheckoutDetail = document.getElementById("detailCancelCheckout");
const checkoutButton = document.getElementById("detailCheckout");
const returnButton = document.getElementById("detailReturn");
const deleteButton = document.getElementById("detailDelete");

const showToast = (message, type = "success") => {
    if (!toastDetail) {
        return;
    }
    toastDetail.textContent = message;
    toastDetail.className = `w3-card w3-padding w3-round show ${type}`;
    setTimeout(() => {
        toastDetail.className = "w3-hide";
        toastDetail.textContent = "";
    }, 3000);
};

const refreshPage = () => {
    window.location.reload();
};

if (bookForm) {
    bookForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(bookForm);
        const payload = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/api/books/${bookId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Не удалось обновить");
            }

            showToast("Изменения сохранены", "success");
            setTimeout(refreshPage, 800);
        } catch (error) {
            console.error(error);
            showToast(error.message || "Ошибка при сохранении", "error");
        }
    });
}

if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
        const today = new Date().toISOString().slice(0, 10);
        checkoutFormDetail.reset();
        checkoutFormDetail.detailDueDate.min = today;
        checkoutDialogDetail.showModal();
    });
}

if (cancelCheckoutDetail) {
    cancelCheckoutDetail.addEventListener("click", () => {
        checkoutDialogDetail.close();
    });
}

if (checkoutFormDetail) {
    checkoutFormDetail.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(checkoutFormDetail);
        const payload = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/api/books/${bookId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: payload.borrowerName,
                    dueDate: payload.dueDate,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Не удалось выдать книгу");
            }
            checkoutDialogDetail.close();
            showToast("Книга выдана", "success");
            setTimeout(refreshPage, 800);
        } catch (error) {
            console.error(error);
            showToast(error.message || "Ошибка при выдаче", "error");
        }
    });
}

if (returnButton) {
    returnButton.addEventListener("click", async () => {
        try {
            const response = await fetch(`/api/books/${bookId}/return`, {
                method: "POST",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Не удалось вернуть книгу");
            }
            showToast("Книга возвращена", "success");
            setTimeout(refreshPage, 800);
        } catch (error) {
            console.error(error);
            showToast(error.message || "Ошибка при возврате", "error");
        }
    });
}

if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
        const confirmed = window.confirm("Удалить книгу? Это действие нельзя отменить.");
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
            if (!response.ok && response.status !== 204) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Не удалось удалить книгу");
            }
            showToast("Книга удалена", "success");
            setTimeout(() => {
                window.location.href = "/";
            }, 800);
        } catch (error) {
            console.error(error);
            showToast(error.message || "Ошибка при удалении", "error");
        }
    });
}
