const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const chalk = require("chalk");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
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

const apiLimiter = rateLimit({
  windowMs: 500, // 1 request per 500ms
  max: 1
});

async function getDate() {
	const date_ob = new Date();
	const date = ('0' + date_ob.getDate()).slice(-2);
	const month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
	const year = date_ob.getFullYear();
	const hours = date_ob.getHours();
	const minutes = date_ob.getMinutes();
	const seconds = date_ob.getSeconds();

	const dateLog = `[${year}-${month}-${date} ${hours}:${minutes}:${seconds}]`;

	return dateLog;
}


app.use(async function (req, res, next) {
  const dateLog = await getDate()
  console.log(chalk.blue(`[WEBSITE] ${dateLog} ${req.method} ${req.url}`));
  next();
});

app.get("/", async (req, res) => {
  res.render("index", {
    error: undefined,
  });
});

app.post("/", apiLimiter, async (req, res) => {
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
  
  const dateLog = await getDate()

  const content = "\n" + dateLog + " Message from: " + req.body.sender.toString() + ": " + req.body.message.toString();

  var messageFile = fs.createWriteStream("./public/messages.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
  });

  messageFile.write(content);
  await axios.post(`https://api.notifymyecho.com/v1/NotifyMe`, null, {
    params: {
      notification: `You have recieved a message from ${req.body.sender.toString()}! ${req.body.message.toString()}`,
      accessCode: config.accessToken,
      title: "string", // optional parameter
    },
  }).then(function (response) {
    if (response.data.sent) {
      res.render("index", {
        error: "success",
      });
    }
  }).catch(function (error) {
    if (error.response) {
      if (error.response.data.error.toString() === "Too many requests") {
        res.render("index", {
          error: "toomanyrequests",
        });
      } else {
        res.render("index", {
          error: "unknown",
        });
      }
    }
  });
});

app.listen(8081, (async) => {
  console.log("Started the app");
});
