const tableBody = document.getElementById("booksTableBody");
const filtersForm = document.getElementById("filtersForm");
const availabilityFilter = document.getElementById("availabilityFilter");
const dueBeforeFilter = document.getElementById("dueBeforeFilter");
const overdueFilter = document.getElementById("overdueFilter");
const addBookForm = document.getElementById("addBookForm");
const checkoutDialog = document.getElementById("checkoutDialog");
const checkoutForm = document.getElementById("checkoutForm");
const cancelCheckoutBtn = document.getElementById("cancelCheckout");
const toast = document.getElementById("toast");

let checkoutTargetBookId = null;

const showToast = (message, type = "success") => {
    if (!toast) {
        return;
    }
    toast.textContent = message;
    toast.className = `w3-card w3-padding w3-round show ${type}`;
    setTimeout(() => {
        toast.className = "w3-hide";
        toast.textContent = "";
    }, 3000);
};

const buildQuery = () => {
    const params = new URLSearchParams();
    const availability = availabilityFilter.value;
    const dueBefore = dueBeforeFilter.value;
    const overdue = overdueFilter.checked;

    if (availability !== "all") {
        params.set("availability", availability);
    }

    if (dueBefore) {
        params.set("dueBefore", dueBefore);
    }

    if (overdue) {
        params.set("overdue", "true");
    }

    return params.toString();
};

const renderBooks = (books) => {
    tableBody.innerHTML = "";

    if (!books.length) {
        tableBody.innerHTML = "<tr><td colspan=\"6\" class=\"w3-center\">Нет записей</td></tr>";
        return;
    }

    books.forEach((book) => {
        let isOverdue = false;
        if (book.borrower?.dueDate) {
            const dueDate = new Date(book.borrower.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!Number.isNaN(dueDate.getTime())) {
                isOverdue = dueDate < today;
            }
        }

        const row = document.createElement("tr");
        if (!book.available && isOverdue) {
            row.classList.add("w3-pale-red");
        }

        row.innerHTML = `
            <td>
                <div class="w3-large"><strong>${book.title}</strong></div>
                ${book.description ? `<div class="w3-small w3-text-grey">${book.description}</div>` : ""}
            </td>
            <td>${book.author}</td>
            <td>${book.publicationDate}</td>
            <td>
                ${book.available ? '<span class="w3-tag w3-green w3-round">В наличии</span>' : '<span class="w3-tag w3-amber w3-round">Выдана</span>'}
            </td>
            <td>
                ${book.borrower ? `<div>${book.borrower.name}</div><div class="w3-small">до ${book.borrower.dueDate}</div>` : "—"}
            </td>
            <td class="w3-center">
                <a href="/books/${book.id}" class="w3-button w3-light-grey w3-small w3-margin-right" title="Открыть">
                    <i class="fa fa-external-link"></i>
                    <span class="w3-margin-left">Карточка</span>
                </a>
                ${book.available
                    ? `<button class="w3-button w3-blue-gray w3-small w3-margin-right" data-action="checkout" data-id="${book.id}">
                        <i class="fa fa-user-plus"></i>
                        <span class="w3-margin-left">Выдать</span>
                    </button>`
                    : `<button class="w3-button w3-green w3-small w3-margin-right" data-action="return" data-id="${book.id}">
                        <i class="fa fa-undo"></i>
                        <span class="w3-margin-left">Вернуть</span>
                    </button>`}
                <button class="w3-button w3-red w3-small" data-action="delete" data-id="${book.id}">
                    <i class="fa fa-trash"></i>
                    <span class="w3-margin-left">Удалить</span>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
};

const fetchBooks = async () => {
    const query = buildQuery();
    const url = query ? `/api/books?${query}` : "/api/books";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Не удалось загрузить книги");
        }
        const payload = await response.json();
        renderBooks(payload.data || []);
    } catch (error) {
        console.error(error);
        showToast("Ошибка при получении данных", "error");
    }
};

filtersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    fetchBooks();
});

filtersForm.addEventListener("reset", () => {
    setTimeout(fetchBooks, 0);
});

addBookForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(addBookForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Не удалось добавить книгу");
        }

        addBookForm.reset();
        showToast("Книга добавлена", "success");
        fetchBooks();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Ошибка при добавлении", "error");
    }
});

const openCheckoutDialog = (bookId) => {
    checkoutTargetBookId = bookId;
    checkoutForm.reset();
    const today = new Date().toISOString().slice(0, 10);
    checkoutForm.dueDate.min = today;
    checkoutDialog.showModal();
};

cancelCheckoutBtn.addEventListener("click", () => {
    checkoutDialog.close();
});

checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!checkoutTargetBookId) {
        return;
    }

    const formData = new FormData(checkoutForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`/api/books/${checkoutTargetBookId}/checkout`, {
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
        checkoutDialog.close();
        showToast("Книга выдана", "success");
        fetchBooks();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Ошибка при выдаче", "error");
    }
});

const returnBook = async (bookId) => {
    try {
        const response = await fetch(`/api/books/${bookId}/return`, { method: "POST" });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Не удалось вернуть книгу");
        }
        showToast("Книга возвращена", "success");
        fetchBooks();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Ошибка при возврате", "error");
    }
};

const deleteBook = async (bookId) => {
    const confirmed = window.confirm("Удалить книгу? Это действие необратимо.");
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
        fetchBooks();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Ошибка при удалении", "error");
    }
};

tableBody.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-action]");
    if (!target) {
        return;
    }

    const { action, id } = target.dataset;
    if (!id) {
        return;
    }

    if (action === "checkout") {
        openCheckoutDialog(id);
        return;
    }

    if (action === "return") {
        returnBook(id);
        return;
    }

    if (action === "delete") {
        deleteBook(id);
    }
});

fetchBooks();
