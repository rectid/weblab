import { Router, Request, Response } from "express";
import { LibraryService } from "../../services/libraryService";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
    res.render("books/index", {
        filters: {
            availability: "all",
            dueBefore: "",
            overdue: false,
        },
    });
});

router.get("/books/:id", async (req: Request, res: Response) => {
    const book = await LibraryService.getBookById(req.params.id);

    if (!book) {
        res.status(404).render("errors/not-found", {
            message: "Книга не найдена",
        });
        return;
    }

    res.render("books/detail", { book });
});

export default router;
