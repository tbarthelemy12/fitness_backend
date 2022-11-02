require("dotenv").config()
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const app = express()

const router = require("./api")

app.use(cors())
app.use(express.json())
app.use(morgan("dev"))
// Setup your Middleware and API Router here
app.get("/", function (req, res) {
    res.send({msg: "hello"})
})
app.use("/api", router)

module.exports = app;