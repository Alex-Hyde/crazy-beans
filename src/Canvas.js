import React from "react";
import firebase from "./firebase.js";
import Card from "./Card.js"
import Player from "./player.js";
import MasterDeck from "./Deck.js";


var player = new Player();

class GameCanvas extends React.Component {

    constructor(props){
        super();
        this.state = {
            currentcard: "none",
            oncard: false,
            turn: 0,
            currentplayer: 0
        }
        this.deck = new Card(216,318,"back");
        this.deck.x = 800;
        this.deck.y = 50;
        this.playernum = props.playernum
        this.reversed = false;
        this.listentodoc = this.listentodoc.bind(this)
        this.updateCanvas = this.updateCanvas.bind(this)
        this.renderhand = this.renderHand.bind(this)
        this.renderDeck = this.renderDeck.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseClick = this.onMouseClick.bind(this)
        this.playCard = this.playCard.bind(this)
    }

listentodoc(){
    this.unsubscribe = firebase.firestore().collection("Games").doc("Game " + this.props.Game_Key).onSnapshot(snapshot => {
        if (snapshot.data()){
            this.setState({
                currentcard : snapshot.data().currentcard,
                oncard : this.state.oncard,
                turn: snapshot.data().turn,
                currentplayer: snapshot.data().currentplayer
            })
            console.log("Hello")
            this.updateCanvas()
        }
    })
}

shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

componentDidMount(){
    player.turnNum = this.props.turnnumber;
    console.log(player.turnNum)
    var unsub = firebase.firestore().doc("Games/Game " + this.props.Game_Key + "/Players/Player " + (player.turnNum + 1)).onSnapshot(snapshot => {
        if (snapshot.data()){
            player.loadCards(snapshot.data().Hand);
            this.updateCanvas();
            this.listentodoc();
            unsub();
        }
    })
}

onMouseMove(e){
    var rect = this.refs.canvas.getBoundingClientRect();
    var rerender = false;
      this.x = e.clientX - rect.left
      this.y = e.clientY - rect.top
      for(var i = 0; i <player.cardsInHand.length; i++ ){
        if (player.cardsInHand[i].onCard(this.x,this.y)){
            rerender = true
        }
      }
      if (rerender){
        this.setState({
            currentcard: this.state.currentcard,
            oncard: true    
        })
      }
      else if (this.state.oncard && !rerender){
        this.setState({
            currentcard: this.state.currentcard,
            oncard: false
        })    
      }
}

pullCard(){
    firebase.firestore().doc("Games/Game " + this.props.Game_Key).get().then(doc => {
        //onsole.log(doc.data().Deck[0])
        player.loadCards([doc.data().Deck[0]]);
        var newdeck = doc.data().Deck
        newdeck.splice(0,1);
        if (newdeck.length === 1){
            this.shuffleArray(MasterDeck)
            newdeck = newdeck.concat(MasterDeck)
        }
        firebase.firestore().doc("Games/Game " + this.props.Game_Key).update({
            Deck: newdeck
        })
    })    
}

playCard(index) {
    console.log(player.cardsInHand[index])
    firebase.firestore().collection("Games").doc("Game " + this.props.Game_Key).update({
        currentcard : player.cardsInHand[index].strvalue,
        turn : this.state.turn + 1,
        currentplayer: (player.turnNum + 1) % this.playernum
    }).then(() => {player.cardsInHand.splice(index,1); this.updateCanvas()})
}

onMouseClick(e){
    console.log(player.turnNum, this.state.currentplayer)
    var rect = this.refs.canvas.getBoundingClientRect();
    var ex = e.clientX - rect.left
    var ey = e.clientY - rect.top
    for(var i = 0; i < player.cardsInHand.length; i++){
        if (player.cardsInHand[i].onCard(ex,ey) && (player.turnNum === this.state.currentplayer)){
            this.playCard(i); 
        }
    }
    if (this.deck.onCard(ex,ey) && (player.turnNum === this.state.currentplayer)){
        this.pullCard();
    }    
}

componentDidUpdate(){
    this.updateCanvas();
}

componentWillUnmount(){

}


renderBoard(){
    const ctx = this.refs.canvas.getContext("2d"); 
    this.deck.draw(ctx);
}

renderHand(){
    const ctx = this.refs.canvas.getContext("2d"); 
    var currentx = 0;
    for(var i = 0; i < player.cardsInHand.length; i++ ){
        player.cardsInHand[i].x = currentx;
        player.cardsInHand[i].y = 400; 
        player.cardsInHand[i].width = 106
        player.cardsInHand[i].height = 184      
        if (player.cardsInHand[i].onCard(this.x,this.y)){
            player.cardsInHand[i].y = 350;
            player.cardsInHand[i].width = 135
            player.cardsInHand[i].height = 234
            player.cardsInHand[i].enlarged = true;
        }
        else{
            player.cardsInHand[i].enlarged = false;
        }
        currentx += player.cardsInHand[i].width
        player.cardsInHand[i].draw(ctx);
    } 
}

renderDeck(){
    const ctx = this.refs.canvas.getContext("2d");
    ctx.drawImage(document.getElementById(this.state.currentcard),0,0,211,327)
}

updateCanvas(){
    const ctx = this.refs.canvas.getContext("2d");
    ctx.clearRect(0,0,1350,595);
    this.renderDeck()
    this.renderBoard()
    this.renderHand()
}

render(){
    return (
        <canvas onMouseMove={this.onMouseMove} onClick={this.onMouseClick} ref="canvas" width={1250} height={595}/>
    );
}

}

export default GameCanvas;