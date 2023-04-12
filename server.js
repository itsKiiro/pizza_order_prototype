const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

let cartItems = {
  pizzas: {},
  amount: 0,
  total: 0
};

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.redirect('/pizza/list');
});

app.get('/orders', (req, res) => {
  const ordersData = fs.readFileSync('orders.json');
  const od = '{"orders": [' + ordersData + ']}';
  const ordersD = JSON.parse(od);
  ordersD.orders.shift();
  const orders = ordersD.orders;

  const ordersHtml = [];
  let orderId = 1;

  for (const order of orders) {
    const orderedPizzas = [];
    for (const pizzaItem in order.pizzas) {
      orderedPizzas.push(pizzaItem + ":" + order.pizzas[pizzaItem]);
    }
    const orderHtml = `
    <p>OrderID: ${orderId}</p>
    <p>Customer: ${order.customer.name}</p>
    <p>Address: ${order.customer.address.city}, ${order.customer.address.street}</p>
    <p><b>Ordered Items:</b></p>
    <p>${orderedPizzas.join(", ")}</p>
    `;
    ordersHtml.push(orderHtml);
    orderId++;
  }

  const ordersHtmlString = `
  <div id="orders" class="page">
  ${ordersHtml.join()}
  </div>
  `;

  res.render('index', {ordersHtmlString, orders});
});

app.get('/pizza/list', (req, res) => {
  const data = fs.readFileSync('pizzas.json');
  const allergenData = fs.readFileSync('allergen.json');
  const pizzas = JSON.parse(data).pizzas;
  const allergens = JSON.parse(allergenData).allergenes;

  const pizzasHtml = [];

  for (const pizza of pizzas) {
    const pizzaAllergens = [];
    for (const allergen of pizza.allergens) {
      pizzaAllergens.push(allergens[allergen - 1].name);
    }

    const pizzaHtml = `
    <p>${sanitize(pizza.name)} - ${(pizza.price / 100).toFixed(2)} €</p>
    <p>Ingredients: ${pizza.ingredients.join(", ")}</p>
    <p>Allergens: ${pizzaAllergens.join(", ")} </p>
    <form class="orderForm" action="/api/add-to-cart" method="post">
      <input type="hidden" name="pizzaId" value="${pizza.id}">
      <input type="number" name="amount[]" min="1">
      <input type="hidden" name="pizzaName" value="${sanitize(pizza.name)}">;
      <input type="hidden" name="pizzaPrice" value="${pizza.price}" >
      <button type="submit">Add to Cart</button>
    </form>
    <hr>
    `;
    pizzasHtml.push(pizzaHtml);
  }

  const pizzaItemsHtml = [];
  for (const pizzaItem in cartItems.pizzas) {
    pizzaItemsHtml.push(`
    ${pizzaItem} : ${cartItems.pizzas[pizzaItem]}
    `);
  }

  const cartHtml = `
  <div id="cart" name="cart" class="cart">
  <p><b>Items: </b> ${cartItems.amount}</p>
  <p>${pizzaItemsHtml.join("<br>")}</p>
  <hr>
  <p>Total: ${(cartItems.total / 100).toFixed(2)} €</p>
  </div>
  `;

  const pizzaString = `
  <div id="pizzas">
  ${pizzasHtml.join("")}
  </div>
  `;

  const orderFormHtml = `
  <div id="order">
      <h2>Order</h2>
      <form class="orderForm" method="POST" action="/api/order">
        <label for="name">Name:</label>
        <input type="text" id="name" name="customer[name]">
        <label for="email">Email:</label>
        <input type="email" id="email" name="customer[email]">
        <label for="city">City:</label>
        <input type="text" id="city" name="customer[address][city]">
        <label for="street">Street:</label>
        <input type="text" id="street" name="customer[address][street]">
        <button type="submit">Order</button>
      </form>
  </div>
  `;
  res.render('index', {pizzaString, cartHtml, orderFormHtml});

});

app.post('/api/order', (req, res) => {
  const body = req.body;

  const order = {
    id: body.pizzaId,
    pizzas: cartItems.pizzas,
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: new Date().getHours(),
      minute: new Date().getMinutes()
    },
    customer: {
      name: body.customer.name,
      email: body.customer.email,
      address: {
        city: body.customer.address.city,
        street: body.customer.address.street
      }
    }
  };

  fs.appendFileSync('orders.json', "," + JSON.stringify(order));
  
  cartItems = {
    pizzas: {},
    amount: 0,
    total: 0
  };
  
  res.redirect('/pizza/list');
});

app.post('/api/add-to-cart', (req, res) => {
  const body = req.body;

  if(!cartItems.pizzas[body.pizzaName])cartItems.pizzas[body.pizzaName] = parseInt(body.amount);
  else cartItems.pizzas[body.pizzaName] += parseInt(body.amount);

  cartItems.amount += parseInt(body.amount);
  cartItems.total += parseInt(body.pizzaPrice) * parseInt(body.amount);
  
  res.redirect('/pizza/list');
});

function sanitize(input) {
  const escapedInput = input.replace(/[^\w\s]/gi, '');
  return escapedInput;
}


const apiRouter = require("./routes/api")
app.use("/api", apiRouter);

app.listen(3000);
