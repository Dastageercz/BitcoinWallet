const express = require ('express');
const router = require('../generatePrivateKey.js')

const app = express();
const port = 5000;

app.use(express.json());
app.use('/bit', router)

app.get("/", (req, res) => {
  res.send(`Test Server ${port}`);
});

app.listen(port, () => {
  console.log("Ok", port);
});
