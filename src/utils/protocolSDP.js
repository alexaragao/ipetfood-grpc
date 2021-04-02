exports.parseItem = function ([_, ...params]) {
  let itemPrice = params.pop();
  if (!itemPrice) {
    return {
      response: "Comando CREATE: forneça um preço ao item.",
      error: "MISSING_ARGUMENT"
    };
  }
  itemPrice = parseFloat(itemPrice.replace(',', '.'));
  if (isNaN(itemPrice)) {
    return {
      response: `Comando CREATE: o preço do item precisa ser um número.`,
      error: 'INVALID_ARGUMET_TYPE'
    };
  }

  params.shift();

  const itemName = params.join(' ');

  return {
    data: {
      name: itemName,
      price_br: itemPrice
    }
  };
};

exports.parseOrder = function ({ items }) {
  if (!order.items) {
    return {
      response: `Comando FINISH: nenhum pedido em andamento. Inicie um pedido com o comando CREATE.`,
      error: 'BAD_REQUEST'
    };
  }
  orders.push(order);
  order = {};
  return {
    response: `Pedido #${orders.length} realizado com sucesso`,
    data: orders[orders.length - 1]
  };
}

exports.parseUpdateOrderItem = function ([_, ...params]) {
  const itemId = params[1];

  if (!itemId) {
    return {
      response: `Comando ADD: nenhum item informado.`,
      error: "BAD_REQUEST"
    }
  }
  let itemIdNumber = parseInt(itemId);
  if (isNaN(itemIdNumber)) {
    return {
      response: `Comando ADD: o número do item precisa ser do tipo inteiro.`,
      error: 'INVALID_ARGUMET_TYPE'
    };
  }
  itemIdNumber -= 1;

  let itemAmount = params[2];
  if (itemAmount) {
    itemAmount = parseFloat(itemAmount);
    if (isNaN(itemAmount)) {
      return {
        response: `Comando ADD: o número do item precisa ser do tipo inteiro.`,
        error: 'INVALID_ARGUMET_TYPE'
      };
    }
  } else {
    itemAmount = 1;
  }

  return {
    data: {
      itemId: itemIdNumber,
      amount: itemAmount
    }
  };
};

exports.parseDeleteProduct = function ([_, ...params]) {
  const itemId = params[1];

  if (!itemId) {
    return {
      response: `Comando DELETE: nenhum item informado.`,
      error: "BAD_REQUEST"
    }
  }
  let itemIdNumber = parseInt(itemId);
  if (isNaN(itemIdNumber)) {
    return {
      response: `Comando DELETE: o número do item precisa ser do tipo inteiro.`,
      error: 'INVALID_ARGUMET_TYPE'
    };
  }
  itemIdNumber -= 1;
  return {
    data: itemIdNumber
  };
}