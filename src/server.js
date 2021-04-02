const PROTO_PATH = "./ipetfood.proto";

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const menu = require('./data/menu.json');
const orders = [];

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

const server = new grpc.Server();

server.addService(protoDescriptor.IPetFood.service, {
  menuIndex: function (call, callback) {
    callback(null, { products: menu.items });
  },
  menuStore: function (call, callback) {
    console.log(call);
    const product = call.request;

    menu.items.push(product);

    callback(null, {});
  },
  menuDelete: function (call, callback) {
    const productName = call.request.name;

    console.log(call);

    menu.items = menu.items.filter((i) => i.name !== productName);

    callback(null, {});
  },

  orderIndex: function (call, callback) {
    callback(null, { orders });
  },
  orderStore: function (call, callback) {
    const order = call.request;

    if (!order.items) {
      return callback(new Error("Pedido não existe."), null);
    }

    for (let item of order.items) {
      if (item.itemId > menu.items.length) {
        return callback(new Error(`Item ${itemIdNumber} não encontrado.`), null);
      }
    }

    orders.push(order);

    callback(null, {});
  }
});

server.bind("0.0.0.0:5000", grpc.ServerCredentials.createInsecure());

server.start();