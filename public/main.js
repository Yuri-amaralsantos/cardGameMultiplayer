
const socket = io();
let playerIndex = null;
let enemyIndex = null;
let target = null;
let data = null;
const ui_player = document.getElementById("player");
const ui_enemy = document.getElementById("enemy");
const ui_turn = document.getElementById("turn");

function createCardHand(index, cost, nome, desc, imagem, atk, hp,) {
  return `
        
         <button class="card" onclick="play(${index})">
         <div class="root">
    <div class="card-header">
      <div class="mana-cost">${cost}</div>
      <h3 class="card-title">${nome}</h3>
    </div>
    <div class="card-image">
      <img src=${imagem} alt="Card Art">
    </div>
    <div class="card-body">
      <p class="card-text">${desc}
    </div>
    <div class="card-footer">
      <div class="attack">${atk}</div>
      <div class="health">${hp}</div>
      </div>
    </button>
       `;
}
function createCardBoard(index, side, imagem, atk, hp,) {
  return `
         
          <button class="cardBoard" onclick="targeting('${side}',${index})">
      
       <img src=${imagem} alt="Card Art">
      
      
       <div class="attack ball1" >${atk}</div>
       <div class="health ball2" >${hp}</div>
      
      
     </button>
    
     
        `;
}






function targeting(side, x) {
 
  if (data.turn == playerIndex) {
    if (target === null && side === playerIndex) {
      if (data[side].board[x].token > 0 ) {
        
          target = x;
      } else {
        alert("essa carta não pode mais atacar esse turno");
      }
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
  if (d.hand) {
    data[d.hand.role].hand = d.hand.value;
    if (d.hand.role == playerIndex) {
      ui_player.children[1].innerHTML = ""
      data[d.hand.role].hand.forEach(function (item, index) {
        const buttonHTML = createCardHand(index, item.cost, item.nome, item.desc, item.imagem, item.atk, item.hp)

        ui_player.children[1].innerHTML += buttonHTML
      });
    }

  }
  if (d.board) {
    data[d.board.role].board = d.board.value;
    if (d.board.role === playerIndex) {
      ui_player.children[0].innerHTML = "";
      data[d.board.role].board.forEach(function (item, index) {
        const buttonHTML = createCardBoard(index, playerIndex, item.imagem, item.atk, item.hp)

        ui_player.children[0].innerHTML += buttonHTML
      });
    } else if (d.board.role === enemyIndex) {
      ui_enemy.children[1].innerHTML = "";
      data[d.board.role].board.forEach(function (item, index) {
        const buttonHTML = createCardBoard(index, enemyIndex, item.imagem, item.atk, item.hp)

        ui_enemy.children[1].innerHTML += buttonHTML
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
