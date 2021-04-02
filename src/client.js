const PROTO_PATH = "./ipetfood.proto";

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const createTable = require('./utils/createTable');
const { parseItem, parseUpdateOrderItem, parseDeleteProduct } = require('./utils/protocolSDP');

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition).ipetfood;

const client = new protoDescriptor.IPetFood("127.0.0.1:5000", grpc.credentials.createInsecure());

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let order = {};

rl.on('line', line => {
  if (line === "exit") {
    console.log("Programa encerrado.");
    return rl.close();
  }

  const args = line.split(" ");

  const command = args[0].toLowerCase();

  switch (command) {
    case "show":
      let showItem = args[1];
      if (!showItem) {
        console.warn("Comando SHOW: forneça um argumento 'item'.");
        break;
      }
      showItem = showItem.toLowerCase();
      switch (showItem) {
        case 'pedido':
          if (!order.items) {
            console.warn("Comando SHOW: nenhum pedido em andamento. Inicie um pedido com o comando CREATE.");
            break;
          }

          console.log(
            createTable(
              ['#', 'Item', 'Quan.', 'Total (R$)'],
              order.items.map((v, i) => [
                (i + 1).toString(),
                v.product.name,
                v.amount.toString(),
                (v.product.price_br * v.amount).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRA",
                })
              ])
            )
            + `Total (R$): ${order.items.reduce((prev, curr) => prev + (curr.amount * curr.product.price_br), 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRA",
            })}`
          );
          break;
        case 'pedidos':
          client.orderIndex({}, (err, res) => {
            if (err) {
              return console.warn(err.message);
            }

            console.log(
              createTable(
                ['#', 'Total (R$)'],
                res.orders.map((v, i) => [
                  (i + 1).toString(),
                  v.items.reduce((prev, curr) => prev + (curr.amount * curr.product.price_br), 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRA",
                  })
                ])
              )
            );
          });
          break;
        case 'cardapio':
          client.menuIndex({}, (err, res) => {
            if (err) {
              return console.warn(err.message);
            }

            console.log(
              createTable(
                ['#', 'Item', 'Preço (R$)'],
                res.products.map((v, i) => [(i + 1).toString(), v.name, v.price_br.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRA",
                })])
              )
            );
          });
          break;
        default:
          console.log(`Comando SHOW: argumento ${showItem} não faz parte do protocolo SDP.`);
      }
      break;
    case "add":
      let addItem = args[1];
      if (!addItem) {
        console.warn("Comando ADD: forneça um argumento 'item'.");
        break;
      }
      addItem = addItem.toLowerCase();
      switch (addItem) {
        case 'item':
          if (!order.items) {
            console.warn(`Comando ADD: nenhum pedido em andamento. Inicie um pedido com o comando CREATE.`);
            break;
          }
          eventResponse = parseUpdateOrderItem(args);
          if (eventResponse.error) {
            console.warn(eventResponse.message);
            break;
          }

          client.menuIndex({}, (err, res) => {
            if (err) {
              return console.warn(err.message);
            }

            if (!res.products[eventResponse.data.itemId]) {
              return console.warn(`Item ${eventResponse.data.itemId} não encontrado.`);
            }

            let isNew = true;
            for (let orderItem of order.items) {
              if (orderItem.itemId === itemIdNumber) {
                orderItem.amount += eventResponse.data.amount;
                isNew = false;
                break;
              }
            }

            if (isNew) {
              order.items.push({ ...eventResponse.data, product: res.products[eventResponse.data.itemId] });
            }
          });
          break;
        default:
          console.warn(`Comando ADD: argumento ${addItem} não faz parte do protocolo SDP.`);
      }
      break;
    case "delete":
      let deleteItem = args[1];
      if (!deleteItem) {
        console.warn("Comando DELETE: forneça um argumento 'item'.");
        break;
      }
      deleteItem = deleteItem.toLowerCase();
      switch (deleteItem) {
        case 'item':
          eventResponse = parseDeleteProduct(args);
          if (eventResponse.error) {
            console.warn(eventResponse.response);
            break;
          }

          client.menuIndex({}, (err, menu) => {
            if (err) {
              return console.warn(err.message);
            }

            if (!menu.products[eventResponse.data]) {
              return console.warn("Produto não existe.");
            }

            client.menuDelete(menu.products[eventResponse.data], (err, res) => {
              if (err) {
                return console.warn(err);
              }
            });
          });
          break;
      }
      break;
    case "create":
      let createItem = args[1];
      if (!createItem) {
        console.warn("Comando CREATE: forneça um argumento 'item'.");
        break;
      }
      createItem = createItem.toLowerCase();
      switch (createItem) {
        case 'pedido':
          if (order.items) {
            order.items = [];
            console.log(`Pedido reiniciado.`);
            break;
          }
          order.items = [];
          console.log(`Pedido iniciado com sucesso.`);
          break;
        case 'item':
          eventResponse = parseItem(args);
          if (eventResponse.error) {
            console.warn(eventResponse.response);
            break;
          }

          client.menuStore(eventResponse.data, (err, res) => {
            if (err) {
              console.warn(err.message);
            }
          });
          break;
        default:
          console.warn(`Comando CREATE: argumento ${createItem} não faz parte do protocolo SDP.`);
      }
      break;
    case "finish":
      let finishItem = args[1];
      if (!finishItem) {
        console.warn("Comando FINISH: forneça um argumento 'item'.");
        break;
      }
      switch (finishItem) {
        case 'pedido':
          client.orderStore(order, (err, res) => {
            if (err) {
              return console.warn(err.message);
            }

            console.log("Pedido realizado com sucesso.");
          });
          break;
        default:
          console.warn(`Comando FINISH: argumento ${finishItem} não faz parte do protocolo SDP.`);
      }
      break;
    default:
      console.warn(`Comando '${command}' não faz parte do protocolo SDP.`);
  }
});