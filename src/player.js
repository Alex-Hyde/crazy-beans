import Card from "./Card.js";
import firebase from "./firebase.js";

function Player(){
    this.turnNum = 0; 
    this.cardsInHand = [];

    this.loadCards = function(inputs){
        for(var i = 0; i < inputs.length; i++){
            console.log(inputs[i])
            this.cardsInHand.push(new Card(106,184,inputs[i]));
        }
    }
    
    this.updateHand = function(Game_Key){
        console.log(this.cardsInHand.map(card => card.strvalue));
        firebase.firestore().doc("Games/Game " + Game_Key + "/Players/Player " + (this.turnNum + 1)).update({
            Hand:  this.cardsInHand.map(card => card.strvalue)
        })
    }

}

export default Player;