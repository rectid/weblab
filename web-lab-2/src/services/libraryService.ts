import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { Book, BookFilters, BorrowerInfo } from "../types/book";
import { isOverdue, isValidDate } from "../utils/date";

const DATA_FILE = path.join(__dirname, "../../data/library.json");

const readBooks = async (): Promise<Book[]> => {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw) as Book[];
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
            return [];
        }
        throw error;
    }
};

const writeBooks = async (books: Book[]): Promise<void> => {
    await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), "utf-8");
};

const filterBooks = (books: Book[], filters?: BookFilters): Book[] => {
    if (!filters) {
        return books;
    }

    return books.filter((book) => {
        if (filters.availability === "available" && !book.available) {
            return false;
        }

        if (filters.availability === "checkedOut" && book.available) {
            return false;
        }

        if (filters.overdue && (!book.borrower || !isOverdue(book.borrower.dueDate))) {
            return false;
        }

        if (filters.dueBefore) {
            if (!book.borrower || !book.borrower.dueDate) {
                return false;
            }
            const due = new Date(book.borrower.dueDate);
            const filterDate = new Date(filters.dueBefore);
            if (Number.isNaN(due.getTime()) || Number.isNaN(filterDate.getTime())) {
                return false;
            }
            if (due > filterDate) {
                return false;
            }
        }

        return true;
    });
};

const sanitizeText = (value: string): string => value.trim();

export interface BookPayload {
  title: string;
  author: string;
  publicationDate: string;
  description?: string;
}

const validateBookPayload = (payload: BookPayload): void => {
    if (!payload.title || !payload.author || !payload.publicationDate) {
        throw new Error("Missing required fields: title, author, publicationDate");
    }

    if (!isValidDate(payload.publicationDate)) {
        throw new Error("publicationDate must be in YYYY-MM-DD format");
    }
};

const validateBorrower = (borrower: BorrowerInfo): void => {
    if (!borrower.name?.trim()) {
        throw new Error("Borrower name is required");
    }

    if (!isValidDate(borrower.dueDate)) {
        throw new Error("Due date must be in YYYY-MM-DD format");
    }
};

export const LibraryService = {
    async getBooks(filters?: BookFilters): Promise<Book[]> {
        const books = await readBooks();
        return filterBooks(books, filters);
    },

    async getBookById(id: string): Promise<Book | undefined> {
        const books = await readBooks();
        return books.find((book) => book.id === id);
    },

    async createBook(payload: BookPayload): Promise<Book> {
        validateBookPayload(payload);

        const books = await readBooks();
        const now = new Date().toISOString();
        const book: Book = {
            id: uuid(),
            title: sanitizeText(payload.title),
            author: sanitizeText(payload.author),
            publicationDate: payload.publicationDate,
            description: payload.description?.trim() || undefined,
            available: true,
            borrower: undefined,
            createdAt: now,
            updatedAt: now,
        };
        books.push(book);
        await writeBooks(books);
        return book;
    },

    async updateBook(id: string, payload: Partial<BookPayload>): Promise<Book> {
        const books = await readBooks();
        const index = books.findIndex((item) => item.id === id);

        if (index === -1) {
            throw new Error("Book not found");
        }

        const book = books[index];
        const next: Book = { ...book };

        if (payload.title !== undefined) {
            if (!payload.title.trim()) {
                throw new Error("Title cannot be empty");
            }
            next.title = sanitizeText(payload.title);
        }

        if (payload.author !== undefined) {
            if (!payload.author.trim()) {
                throw new Error("Author cannot be empty");
            }
            next.author = sanitizeText(payload.author);
        }

        if (payload.publicationDate !== undefined) {
            if (!isValidDate(payload.publicationDate)) {
                throw new Error("publicationDate must be in YYYY-MM-DD format");
            }
            next.publicationDate = payload.publicationDate;
        }

        if (payload.description !== undefined) {
            next.description = payload.description.trim() || undefined;
        }

        next.updatedAt = new Date().toISOString();
        books[index] = next;

        await writeBooks(books);
        return next;
    },

    async deleteBook(id: string): Promise<void> {
        const books = await readBooks();
        const filtered = books.filter((book) => book.id !== id);

        if (filtered.length === books.length) {
            throw new Error("Book not found");
        }

        await writeBooks(filtered);
    },

    async checkoutBook(id: string, borrower: BorrowerInfo): Promise<Book> {
        validateBorrower(borrower);

        const books = await readBooks();
        const index = books.findIndex((item) => item.id === id);

        if (index === -1) {
            throw new Error("Book not found");
        }

        if (!books[index].available) {
            throw new Error("Book is already checked out");
        }

        const updated: Book = {
            ...books[index],
            available: false,
            borrower: {
                name: sanitizeText(borrower.name),
                dueDate: borrower.dueDate,
            },
            updatedAt: new Date().toISOString(),
        };

        books[index] = updated;
        await writeBooks(books);
        return updated;
    },

    async returnBook(id: string): Promise<Book> {
        const books = await readBooks();
        const index = books.findIndex((item) => item.id === id);

        if (index === -1) {
            throw new Error("Book not found");
        }

        const updated: Book = {
            ...books[index],
            available: true,
            borrower: undefined,
            updatedAt: new Date().toISOString(),
        };

        books[index] = updated;
        await writeBooks(books);
        return updated;
    },
};
