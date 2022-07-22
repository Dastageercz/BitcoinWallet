const express = require ('express');
const frontend = require('../')
const router = require('../generatePrivateKey.js')
const axios = require("axios")

const app = express();
const port = 5000;

app.use(express.json());
app.use('/bit', router)

app.get("/promise", (req, res) => {
  const uri = 'https://chain.so/api/v2/get_address_balance/BTCTEST/mufjUT3pF2KwNiC2UPBaFhyvLA4nUGd9P3';
	axios({
		url: uri,
		method: "get",
	})
		.then(response => {
			res.status(200).json(response.data);
		})
		.catch((err) => {
			res.status(500).json({ message: err });
		});
});

app.get("/", (req, res) => {
  res.send('test run');
});

app.listen(port, () => {
  console.log("Ok", port);
});
