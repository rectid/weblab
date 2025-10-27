import { Router, Request, Response } from "express";
import { LibraryService } from "../../services/libraryService";
import { BookFilters } from "../../types/book";

const router = Router();

const parseFilters = (req: Request): BookFilters => {
    const filters: BookFilters = {};
    const availability = req.query.availability;
    const overdue = req.query.overdue;
    const dueBefore = req.query.dueBefore;

    if (availability === "available" || availability === "checkedOut") {
        filters.availability = availability;
    }

    if (typeof overdue === "string") {
        filters.overdue = overdue === "true";
    }

    if (typeof dueBefore === "string" && dueBefore.trim()) {
        filters.dueBefore = dueBefore.trim();
    }

    return filters;
};

const handleError = (res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : "Unexpected error";

    if (message.toLowerCase().includes("not found")) {
        res.status(404).json({ message });
        return;
    }

    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("cannot")) {
        res.status(409).json({ message });
        return;
    }

    if (message.toLowerCase().includes("required") || message.toLowerCase().includes("format")) {
        res.status(400).json({ message });
        return;
    }

    res.status(500).json({ message: "Internal server error" });
};

router.get("/", async (req: Request, res: Response) => {
    try {
        const filters = parseFilters(req);
        const books = await LibraryService.getBooks(filters);
        res.json({ data: books });
    } catch (error: unknown) {
        handleError(res, error);
    }
});

router.get("/:id", async (req: Request, res: Response) => {
    try {
        const book = await LibraryService.getBookById(req.params.id);
        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }
        res.json({ data: book });
    } catch (error: unknown) {
        handleError(res, error);
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const book = await LibraryService.createBook(req.body);
        res.status(201).json({ data: book });
    } catch (error: unknown) {
        handleError(res, error);
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const updated = await LibraryService.updateBook(req.params.id, req.body);
        res.json({ data: updated });
    } catch (error: unknown) {
        handleError(res, error);
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await LibraryService.deleteBook(req.params.id);
        res.status(204).send();
    } catch (error: unknown) {
        handleError(res, error);
    }
});

router.post("/:id/checkout", async (req: Request, res: Response) => {
    try {
        const updated = await LibraryService.checkoutBook(req.params.id, req.body);
        res.json({ data: updated });
    } catch (error: unknown) {
        handleError(res, error);
    }
});

router.post("/:id/return", async (req: Request, res: Response) => {
    try {
        const updated = await LibraryService.returnBook(req.params.id);
        res.json({ data: updated });
    } catch (error: unknown) {
        handleError(res, error);
    }
});

export default router;
