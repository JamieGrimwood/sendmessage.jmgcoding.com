const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const chalk = require("chalk");
const fs = require("fs");
const config = require("./config.json");

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();

const dateLog = `[${year}-${month}-${date} ${hours}:${minutes}:${seconds}]`;

app.use(function (req, res, next) {
  console.log(chalk.blue(`[WEBSITE] ${dateLog} ${req.method} ${req.url}`));
  next();
});

app.get("/", async (req, res) => {
  res.render("index", {
    error: undefined,
  });
});

app.post("/", async (req, res) => {
  if (!req.body.message) {
    return res.render("index", {
      error: "nomessage",
    });
  }

  if (!req.body.sender) {
    return res.render("index", {
      error: "nosender",
    });
  }
  const response = await axios.get("https://api.jmgcoding.com/checkphrase", {
    headers: {
      message: req.body.message,
    },
  });
  if (response.data.toString() === "true") {
    return res.render("index", {
      error: "swear",
    });
  }

  const response2 = await axios.get("https://api.jmgcoding.com/checkphrase", {
    headers: {
      message: req.body.sender,
    },
  });
  if (response2.data.toString() === "true") {
    return res.render("index", {
      error: "swear",
    });
  }

  const content = "\n" + dateLog + " Message from: " + req.body.sender.toString() + ": " + req.body.message.toString();

  var messageFile = fs.createWriteStream("messages.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
  });

  messageFile.write(content);
  axios.post(`https://api.notifymyecho.com/v1/NotifyMe`, null, {
    params: {
      notification: `You have recieved a message from ${req.body.sender.toString()}! ${req.body.message.toString()}`,
      accessCode: config.accessToken,
      title: "string", // optional parameter
    },
  });

  res.render("index", {
    error: "success",
  });
});

app.listen(8081, (async) => {
  console.log("Started the app");
});
