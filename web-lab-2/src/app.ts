import express from "express";
import path from "path";
import booksApiRouter from "./routes/api/books";
import webRouter from "./routes/web";

const app = express();

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.locals.pageTitle = "Домашняя библиотека";
    next();
});

app.use("/api/books", booksApiRouter);
app.use("/", webRouter);

app.use((error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(error.message);
    if (res.headersSent) {
        next(error);
        return;
    }
    res.status(500).json({ message: "Internal server error" });
});

export default app;
