const express = require('express');
const router = express.Router();
const fs = require('fs');
const bodyParser = require('body-parser');

router.get('/pizza', (req, res) => {
  const data = fs.readFileSync('pizzas.json');
  const pizzas = JSON.parse(data).pizzas;

  let html = pizzas;

  res.send(html);
});

router.get('/allergenes', (req, res) => {
  const data = fs.readFileSync('allergen.json');
  const allergenes = JSON.parse(data).allergenes;

  let html = allergenes;

  res.send(html);
});

router.get('/order', (req, res) => {
  const ordersData = '{"orders": [' + fs.readFileSync('orders.json') + ']}';
  const orders = JSON.parse(ordersData);

  res.send(JSON.stringify(orders));
});


module.exports = router;