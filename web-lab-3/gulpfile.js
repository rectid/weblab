import gulp from "gulp";
import gulpIf from "gulp-if";
import plumber from "gulp-plumber";
import sourcemaps from "gulp-sourcemaps";
import rename from "gulp-rename";
import autoprefixer from "gulp-autoprefixer";
import cleanCSS from "gulp-clean-css";
import gulpSassFactory from "gulp-sass";
import dartSass from "sass";
import babel from "gulp-babel";
import terser from "gulp-terser";
import ejs from "gulp-ejs";
import { deleteAsync } from "del";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const sass = gulpSassFactory(dartSass);
const isProduction = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paths = {
  styles: {
    src: "src/styles/**/*.scss",
    entry: "src/styles/main.scss",
    dest: "dist/gulp/css",
    publicDest: "public/css"
  },
  scripts: {
    src: "src/scripts/**/*.js",
    dest: "dist/gulp/js",
    publicDest: "public/js"
  },
  templates: {
    src: "src/templates/**/*.ejs",
    dest: "dist/gulp"
  },
  assets: {
    src: "src/assets/**/*",
    dest: "dist/gulp/assets"
  }
};

const dataDir = path.join(__dirname, "data");

const loadJson = async (fileName) => {
  const filePath = path.join(dataDir, fileName);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
};

const buildTemplateData = async () => {
  const [users, friendPairs, messages] = await Promise.all([
    loadJson("users.json"),
    loadJson("friends.json"),
    loadJson("messages.json")
  ]);

  const friendMap = friendPairs.reduce((acc, pair) => {
    acc[pair.userId] = pair.friends;
    return acc;
  }, {});

  const enrichMessage = (message) => {
    const author = users.find((user) => user.id === message.authorId);
    return {
      ...message,
      authorName: author ? author.fullName : "Неизвестный пользователь",
      authorAvatar: author ? author.photo : "https://placehold.co/96x96"
    };
  };

  return {
    users,
    friendPairs,
    friendMap,
    roleOptions: ["admin", "user"],
    statusOptions: ["pending", "active", "blocked"],
    messages: messages.map(enrichMessage)
  };
};

export const clean = () => deleteAsync(["dist/gulp/**", "!dist/gulp"]);

export const styles = () =>
  gulp
    .src(paths.styles.entry)
    .pipe(plumber())
    .pipe(gulpIf(!isProduction, sourcemaps.init()))
    .pipe(
      sass({
        outputStyle: isProduction ? "compressed" : "expanded"
      }).on("error", sass.logError)
    )
    .pipe(autoprefixer())
    .pipe(gulpIf(!isProduction, sourcemaps.write(".")))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(gulp.dest(paths.styles.publicDest));

export const scripts = () =>
  gulp
    .src(paths.scripts.src, { sourcemaps: !isProduction })
    .pipe(plumber())
    .pipe(
      babel({
        presets: [["@babel/preset-env", { modules: false }]]
      })
    )
    .pipe(gulpIf(isProduction, terser()))
    .pipe(gulp.dest(paths.scripts.dest, { sourcemaps: !isProduction }))
    .pipe(gulp.dest(paths.scripts.publicDest, { sourcemaps: !isProduction }));

export const templates = async () => {
  const templateData = await buildTemplateData();

  return gulp
    .src(paths.templates.src)
    .pipe(plumber())
    .pipe(ejs(templateData, {}, { ext: ".html" }))
    .pipe(rename({ extname: ".html" }))
    .pipe(gulp.dest(paths.templates.dest));
};

export const assets = () =>
  gulp
    .src(paths.assets.src)
    .pipe(gulp.dest(paths.assets.dest));

export const watch = () => {
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.templates.src, templates);
  gulp.watch("data/**/*.json", templates);
  gulp.watch(paths.assets.src, assets);
};

export const build = gulp.series(clean, gulp.parallel(styles, scripts, templates, assets));

export default build;
