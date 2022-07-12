import express from "express";

const app = express();
const port = 5000;

app.get("/", (req, res) => {
  res.send(`Test Server ${port}`);
});

app.listen(port, () => {
  console.log("Ok", port);
});
