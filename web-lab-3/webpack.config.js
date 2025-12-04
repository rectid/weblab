import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import autoprefixer from "autoprefixer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, "data");

const readJson = (fileName) => {
  const filePath = path.join(dataDir, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
};

const users = readJson("users.json");
const friendPairs = readJson("friends.json");
const messages = readJson("messages.json");

const friendMap = friendPairs.reduce((acc, pair) => {
  acc[pair.userId] = pair.friends;
  return acc;
}, {});

const messagesWithAuthors = messages.map((message) => {
  const author = users.find((user) => user.id === message.authorId);
  return {
    ...message,
    authorName: author ? author.fullName : "Неизвестный пользователь",
    authorAvatar: author ? author.photo : "https://placehold.co/96x96"
  };
});

const baseTemplateParameters = {
  users,
  friendPairs,
  friendMap,
  roleOptions: ["admin", "user"],
  statusOptions: ["pending", "active", "blocked"],
  messages: messagesWithAuthors
};

const htmlPages = [
  {
    name: "users",
    title: "Участники"
  },
  {
    name: "friends",
    title: "Друзья"
  },
  {
    name: "news",
    title: "Новости"
  }
];

const htmlPlugins = htmlPages.map(({ name, title }) =>
  new HtmlWebpackPlugin({
    template: `./src/templates/${name}.ejs`,
    filename: `${name}.html`,
    templateParameters: {
      ...baseTemplateParameters,
      page: name,
      title
    },
    minify: false
  })
);

export default {
  entry: {
    main: "./src/scripts/main.js"
  },
  output: {
    filename: "js/[name].js",
    path: path.resolve(__dirname, "dist/webpack"),
    clean: true,
    publicPath: "/"
  },
  module: {
    rules: [
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            presets: [["@babel/preset-env", { modules: false }]]
          }
        }
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true
            }
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [autoprefixer()]
              },
              sourceMap: true
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.ejs$/i,
        use: [
          {
            loader: "ejs-loader",
            options: {
              esModule: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].css"
    }),
    ...htmlPlugins,
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/assets",
          to: "assets",
          noErrorOnMissing: true
        }
      ]
    })
  ],
  resolve: {
    extensions: [".js"]
  },
  devtool: "source-map",
  target: ["web", "es5"],
  stats: "minimal"
};
