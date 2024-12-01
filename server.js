const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const gameData = { p1: null, p2: null, turn: "p1" };

const cards = [
  { nome: "guerreiro", cost: 1, atk: 1, hp: 2, token: 0 , imagem:"test.jpg", desc:"um guerreiro dourado"},
  { nome: "crocolisco", cost: 2, atk: 2, hp: 3, token: 0 , imagem:"test2.jpg", desc: "um crocoslico do rio"} ,
  { nome: "arqueira", cost: 1, atk: 3, hp: 1, token: 0 , imagem:"test3.jpg", desc: "uma arqueira elfa"},
]

class Player {
  constructor(id, nome) {
    this.id = id;
    this.nome = nome;
    this.mana = 1;
    this.manaMax = 1;
    this.hp = 5;
    this.deck = cards.map(card => ({ ...card }));
    this.hand = cards.map(card => ({ ...card }));
    this.board = [];
  }
}

function draw(player) {
  if (gameData[player].deck.length > 0) {
    gameData[player].hand.push(gameData[player].deck[0])
    gameData[player].deck.splice(0, 1)
    io.emit("update-partial", {
      hand: { role: player, value: gameData[player].hand }
    });
  }
}


io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);
  let a;
  let b;
  if (gameData.p1 == null) {
    gameData.p1 = new Player(socket.id, "player1");
    a = "p1";
    b = "p2";
  } else if (gameData.p2 == null) {
    gameData.p2 = new Player(socket.id, "player2");
    a = "p2";
    b = "p1";
  } else {
    socket.disconnect();
    return;
  }


  socket.emit("define", a, b);
  io.emit("update-all", gameData);
  if (gameData.p1 !== null) {
    io.emit("update-partial", {
      hand: { role: "p1", value: gameData["p1"].hand },
    });
  }
  if (gameData.p2 !== null) {
    io.emit("update-partial", {
      hand: { role: "p2", value: gameData["p2"].hand },
    });
  }

  socket.on("turn", () => {
    
    
    if (gameData.turn == "p1") {
      gameData.turn = "p2"
    } else {
      gameData.turn = "p1"
    }
    draw(gameData.turn)
    gameData[gameData.turn].manaMax += 1
    gameData[gameData.turn].mana = 0
    gameData[gameData.turn].mana += gameData[gameData.turn].manaMax
    io.emit("update-partial", {
      turn: gameData.turn,
      mana: {
        role: gameData.turn, value: gameData[gameData.turn].mana
      }
    })

    gameData[gameData.turn].board.forEach(function (item) {
      item.token = 1
    });
    io.emit("update-partial", {
      board: { role: gameData.turn, value: gameData[gameData.turn].board }
    }); 


  })

  socket.on("battle", (d) => {
    gameData[d.p1].board[d.id1].hp -= gameData[d.p2].board[d.id2].atk
    gameData[d.p2].board[d.id2].hp -= gameData[d.p1].board[d.id1].atk
    if (gameData[d.p1].board[d.id1].hp < 1) {
      gameData[d.p1].board.splice(d.id1, 1)
      io.emit("update-partial", {
        board: { role: d.p1, value: gameData[d.p1].board }
      }); 
    }else{
      gameData[d.p1].board[d.id1].token=0
      io.emit("update-partial", {
        card:{ type:"board", role:d.p1, index:d.id1 ,value: gameData[d.p1].board[d.id1]}
      });
    }
    if (gameData[d.p2].board[d.id2].hp < 1) {
      gameData[d.p2].board.splice(d.id2, 1)
      io.emit("update-partial", {
        board: { role: d.p2, value: gameData[d.p2].board }
      }); 
    } else{
      io.emit("update-partial", {
        card:{ type:"board", role:d.p2, index:d.id2 ,value: gameData[d.p2].board[d.id2]}
      });
    }
    

  
    
  });
  socket.on("direct-attack", (d) => {

    gameData[d.p2].hp -= gameData[d.p1].board[d.id1].atk
    if (gameData[d.p2].hp < 1) {
      io.emit("message", `player ${d.p1} ganhou!`)
    }

    gameData[d.p1].board[d.id1].token=0

    io.emit("update-partial", {
      card:{ type:"board", role:d.p1, index:d.id1 ,value: gameData[d.p1].board[d.id1]}
    });
    io.emit("update-partial", {
      hp: { role: d.p2, value: gameData[d.p2].hp }
    });


  });
  socket.on("play", (player, index) => {
    gameData[player].mana -= gameData[player].hand[index].cost
    gameData[player].board.push(gameData[player].hand[index])
    gameData[player].hand.splice(index, 1)

    io.emit("update-partial", {
      hand: { role: player, value: gameData[player].hand },
      board: { role: player, value: gameData[player].board },
      mana: { role: player, value: gameData[player].mana }
    });

    
  });




  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    if (gameData.p1?.id === socket.id) {
      gameData.p1 = null;
    } else if (gameData.p2?.id === socket.id) {
      gameData.p2 = null;
    }

    io.emit("update-gameData", gameData);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on http://<your_public_ip>:3000");
});
