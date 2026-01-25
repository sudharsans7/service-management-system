const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let requests = [];
let id = 1;

app.get("/requests", (req, res) => {
    res.json(requests);
});

app.post("/requests", (req, res) => {
    const { title, category } = req.body;

    const newRequest = {
        id: id++,
        title,
        category,
        status: "Open",
        createdAt: new Date().toLocaleString()
    };

    requests.push(newRequest);
    res.status(201).json(newRequest);
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
