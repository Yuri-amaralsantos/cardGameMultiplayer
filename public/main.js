
const socket = io();
let playerIndex = null;
let enemyIndex = null;
let target = null;
let data = null;
const ui_player = document.getElementById("player");
const ui_enemy = document.getElementById("enemy");
const ui_turn = document.getElementById("turn");

function createCardHand(index, cost, nome, desc, imagem, atk, hp) {
  // Create main button element
  const cardButton = document.createElement('button');
  cardButton.className = 'card';
  cardButton.onclick = () => play(index);

  // Create root div
  const rootDiv = document.createElement('div');
  rootDiv.className = 'root';

  // Create header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'card-header';

  const manaCostDiv = document.createElement('div');
  manaCostDiv.className = 'mana-cost';
  manaCostDiv.textContent = cost;

  const titleH3 = document.createElement('p');
  titleH3.className = 'card-title';
  titleH3.textContent = nome;

  headerDiv.appendChild(manaCostDiv);
  headerDiv.appendChild(titleH3);

  // Create image section
  const imageDiv = document.createElement('div');
  imageDiv.className = 'card-image';

  const cardImg = document.createElement('img');
  cardImg.src = imagem;
  cardImg.alt = 'Card Art';

  imageDiv.appendChild(cardImg);

  // Create body section
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'card-body';

  const cardText = document.createElement('p');
  cardText.className = 'card-text';
  cardText.textContent = desc;

  bodyDiv.appendChild(cardText);

  // Create footer section
  const footerDiv = document.createElement('div');
  footerDiv.className = 'card-footer';

  const attackDiv = document.createElement('div');
  attackDiv.className = 'attack';
  attackDiv.textContent = atk;

  const healthDiv = document.createElement('div');
  healthDiv.className = 'health';
  healthDiv.textContent = hp;

  footerDiv.appendChild(attackDiv);
  footerDiv.appendChild(healthDiv);

  // Assemble card
  rootDiv.appendChild(headerDiv);
  rootDiv.appendChild(imageDiv);
  rootDiv.appendChild(bodyDiv);
  rootDiv.appendChild(footerDiv);
  cardButton.appendChild(rootDiv);

  return cardButton; // Return the created element
}

function createCardBoard(index, side, imagem, atk, hp, token) {
  // Create main button element
  const cardButton = document.createElement('button');
  cardButton.className = 'cardBoard';
  cardButton.onclick = () => targeting(side, index);
  console.log(atk)
  if (token == 1) {
    cardButton.style.border = '5px solid yellow';  // Yellow border when attack is greater than 5
  } else {
    cardButton.style.border = '2px solid black';   // Black border when attack is 5 or less
  }

  // Create image element
  const cardImg = document.createElement('img');
  cardImg.src = imagem;
  cardImg.alt = 'Card Art';

  // Create attack element
  const attackDiv = document.createElement('div');
  attackDiv.className = 'attack ball1';
  attackDiv.textContent = atk;

  // Create health element
  const healthDiv = document.createElement('div');
  healthDiv.className = 'health ball2';
  healthDiv.textContent = hp;

  // Assemble the card
  cardButton.appendChild(cardImg);
  cardButton.appendChild(attackDiv);
  cardButton.appendChild(healthDiv);

  return cardButton; // Return the created button element
}






function targeting(side, x) {

  if (data.turn == playerIndex) {
    if (data[side].board[x].token == 0 && side === playerIndex ) {
      alert("essa carta não pode mais atacar esse turno");
      return
    }
    if (target === null && side === playerIndex && data[side].board[x].token > 0) {
      target = x;
    } else if (target !== null && side === enemyIndex) {
      socket.emit("battle", {
        p1: playerIndex,
        id1: target,
        p2: enemyIndex,
        id2: x,
      });

      target = null;
    }

  } else {
    alert("turno do oponente");
  }
}

function turn() {

  if (data.turn == playerIndex) {
    socket.emit("turn");
  } else {
    alert("turno do oponente");
  }
}

function play(x) {
  if (data.turn == playerIndex) {

    if (data[playerIndex].mana >= data[playerIndex].hand[x].cost) {
      socket.emit("play", playerIndex, x);
    } else {
      alert("sem mana suficiente")
    }

  } else {
    alert("turno do oponente");
  }
}

function targetEnemy() {
  if (target !== null) {
    socket.emit("direct-attack", {
      p1: playerIndex,
      id1: target,
      p2: enemyIndex,
    });
    target = null
  } else {
    alert("escolha uma criatura antes de atacar o herói inimigo");
  }
}

socket.on("define", (a, b) => {
  playerIndex = a;
  enemyIndex = b;
});

socket.on("update-partial", (d) => {

  if (d.turn) {
    data.turn = d.turn;
    ui_turn.children[0].textContent = "Turn: " + data.turn;
  }
  if (d.mana) {
    data[d.mana.role].mana = d.mana.value;
    if (d.mana.role == playerIndex) {
      ui_turn.children[1].textContent = "Mana: " + data[d.mana.role].mana;
    }
  }
  if (d.hp) {
    data[d.hp.role].hp = d.hp.value;
    if (d.hp.role == playerIndex) {
      ui_player.children[2].textContent = `${data[playerIndex].nome} / hp: ${data[playerIndex].hp}`;
    } else {
      ui_enemy.children[0].innerHTML = `${data[enemyIndex].nome} / hp: ${data[enemyIndex].hp}`;
    }
  }
  if (d.card) {
    if (d.card.type == "hand" && d.card.role == playerIndex) {
      data[playerIndex].hand[d.card.index] = d.card.value
      ui_player.children[1].children[d.card.index].innerHTML = ""
      const item = d.card.value
      const buttonHTML = createCardHand(d.card.index, item.cost, item.nome, item.desc, item.imagem, item.atk, item.hp)
      ui_player.children[1].replaceChild(buttonHTML, ui_player.children[1].children[d.card.index])
    }
    else {
      if (d.card.role == playerIndex) {
        data[playerIndex].board[d.card.index] = d.card.value
        ui_player.children[0].children[d.card.index].innerHTML = ""
        const item = data[playerIndex].board[d.card.index]
        const buttonHTML = createCardBoard(d.card.index, playerIndex, item.imagem, item.atk, item.hp)
        ui_player.children[0].replaceChild(buttonHTML, ui_player.children[0].children[d.card.index])
      } else {
        data[enemyIndex].board[d.card.index] = d.card.value
        ui_enemy.children[1].children[d.card.index].innerHTML = ""
        const item = data[enemyIndex].board[d.card.index]
        const buttonHTML = createCardBoard(d.card.index, enemyIndex, item.imagem, item.atk, item.hp)
        ui_enemy.children[1].replaceChild(buttonHTML, ui_enemy.children[1].children[d.card.index])
      }
    }
  }
  if (d.hand) {
    data[d.hand.role].hand = d.hand.value;
    if (d.hand.role == playerIndex) {
      ui_player.children[1].innerHTML = ""
      data[d.hand.role].hand.forEach(function (item, index) {
        const buttonHTML = createCardHand(index, item.cost, item.nome, item.desc, item.imagem, item.atk, item.hp)

        ui_player.children[1].append(buttonHTML)
      });
    }

  }
  if (d.board) {
    data[d.board.role].board = d.board.value;
    if (d.board.role === playerIndex) {
      ui_player.children[0].innerHTML = "";
     
      data[d.board.role].board.forEach(function (item, index) {
        console.log(data[d.board.role].board)
        const buttonHTML = createCardBoard(index, playerIndex, item.imagem, item.atk, item.hp,item.token)

        ui_player.children[0].append(buttonHTML)
      });
    } else if (d.board.role === enemyIndex) {
      ui_enemy.children[1].innerHTML = "";
      data[d.board.role].board.forEach(function (item, index) {
        const buttonHTML = createCardBoard(index, enemyIndex, item.imagem, item.atk, item.hp, item.token)

        ui_enemy.children[1].append(buttonHTML)
      });
    }
  }
});

socket.on("message", (text) => {
  alert(text)
})

socket.on("update-all", (d) => {
  data = d;

  ui_turn.children[0].textContent = "Turn: " + data.turn;
  ui_turn.children[1].textContent = "Mana: " + data[playerIndex].mana;
  ui_player.children[2].textContent = `${data[playerIndex].nome} / hp: ${data[playerIndex].hp}`;
  if (data[enemyIndex]) {
    ui_enemy.children[0].innerHTML = `${data[enemyIndex].nome} / hp: ${data[enemyIndex].hp}`;
  }


});
