var game = {
	//Images for display and buttons
	displayImgs: ["RockBtn.png", "PaperBtn.png", "ScissorsBtn.png", "LizardBtn.png", "SpockBtn.png", 
				  "Rock.png", "Paper.png", "Scissors.png", "Lizard.png", "Spock.png", 
				  "LbP.png", "LbV.png", "PbR.png", "PbV.png", "RbL.png", 
				  "RbS.png", "SbL.png", "SbP.png", "VbR.png", "VbS.png"],
	greetArray:["Hello", "Hi", "Greetings", "Salutations", "Bonjour", "Well Met",],
	tauntArray:["I will crush you!","Prepare to Lose","MWAHAHAHA","I Win, You Lose"],
	praiseArray:["Wow!!","Cool!","Nice One","Well Done","Good on you, mate",],
	playerID: undefined, //local player Name
	score: 0, // local player score
	playerPick: "noPick", //players choice to be pushed to firebase
	momentTimer: undefined, //timer
	database: undefined, // for reference to firebase
	players: 0, //number of player need to get value from firebase and update
	opponentPicks: [], //stores array of opponent choices pulled from firebase
	matchHappening: false, //store to firebase to check if a match is already running
	firstMatch: true,
	config: {
      apiKey: "AIzaSyCLbEjKvRPiZdO3I6ADlExj_N0ZD60nATk",
      databaseURL: "https://rpsmulti-fd6d4.firebaseio.com",
    },
	countdown: function(){
		var timeLeft = 60 - moment().format("ss"); 
		if(timeLeft === 60){
			timeLeft = 0;
		}
		$("#timer").html("TIME REMAINING:  " + timeLeft);
		game.momentTimer = timeLeft
		database.ref().child("Timer").set(timeLeft)
	},
	loadButtons: function(){
		$("#buttons").empty()
		for(var i = 0; i < 5; i++){
			var id = game.displayImgs[i + 5].split(".")
			var btnImg = $("<img>")
			$(btnImg).attr("src", "assets/images/" + game.displayImgs[i])
					 .attr("id", id[0])
					 .addClass("buttonImg")
					 .attr("data-toggle", "tooltip")
					 .attr("title", id[0])
			$("#buttons").append(btnImg)
		}
	},
	initialize: function(){
		//loads display images
		for(var i = 5; i < game.displayImgs.length; i++){
			var element = $("<img>");
			var id = game.displayImgs[i].split(".")
			$(element).attr("src", "assets/images/" + game.displayImgs[i])
					  .addClass(id[0] + "Img")
					  .addClass("displayImg")
			$("#gameDisplay").append(element)
		}

		//activates tooltip
		$(function () {
 			$('[data-toggle="tooltip"]').tooltip()
		})

    	firebase.initializeApp(game.config);
    	database = firebase.database()

		game.loadButtons();
		//gets number of players already in game
		var playerCount = database.ref("playerCount")
		playerCount.on("value", function(snapshot){
			game.players = snapshot.val()
		});

		database.ref("Chatlog").set(null)


		//sets on click events for buttons
		$("#buttons").on("click", ".buttonImg", game.playerChoice)
		$("#submit").on("click", game.playerName)
		$("#bluff").on("click", game.chatBluff)
		$("#greet").on("click", game.chatGreet)
		$("#taunt").on("click", game.chatTaunt)
		$("#praise").on("click", game.chatPraise)

		// sets connection information and onDisconnect functionality
		var connectionsRef = database.ref("/connections")
		var connectedRef = database.ref(".info/connected")

		connectedRef.on("value", function(snap){
			if(snap.val()){
				var con = connectionsRef.push(true)
				con.onDisconnect().remove()
			}
		})

		var checkMatch = database.ref("matchHappening")
		checkMatch.on("value", function(snapshot){
			game.matchHappening = snapshot.val()
		})

		// updates player count locally when firebase updates player count
		database.ref("Players").on("child_added", game.updatePlayerList)
		database.ref("Chatlog").on("child_added", game.updateChatlog)


		setInterval(game.countdown, 1000)

		var gameTimer = database.ref("Timer")
		gameTimer.on("value", game.gameTiming)

	},
	gameTiming: function(snapshot){
		var tempScore = game.score
		if(snapshot.val() === 34 && game.players >= 1){
			$("#info").html("Match is starting in...")
		} else if(snapshot.val() === 33 && game.players >= 1){
			$("#info").html("3...")
		} else if(snapshot.val() === 32 && game.players >= 1){
			$("#info").html("2...")
		} else if(snapshot.val() === 31 && game.players >= 1){
			$("#info").html("1...")
		} else if(snapshot.val() === 30 && game.players >= 1){
			$("#info").html("GO!! Make your choice")
			database.ref("matchHappening").set(true)
			$("#timer").css("visibility", "visible")
			game.firstMatch = false;
		} else if(snapshot.val() === 59){
			$("#timer").css("visibility", "hidden")
			if(game.firstMatch === false){$("#info").html("Time's Up!!")}
			database.ref("Players").child(game.playerID).update({playerPick: game.playerPick});
			var colorPick = '"#' + game.playerPick + '"'
			$(JSON.parse(colorPick)).addClass("playerPick")
			database.ref("matchHappening").set(false)	
		} else if(snapshot.val() === 55){
			game.getOpponentPicks()
			if(game.firstMatch === false){$("#info").html("Getting Opponents' Picks")}	
		} else if(snapshot.val() === 50){
			game.updateScore()
			if(game.firstMatch === false){
				if(game.score > tempScore){
					$("#info").html("YOU SCORED!!")
				} else {
					$("#info").html("You didn't score a point")
				}
			}
		} else if(snapshot.val() === 45 ){
			if(game.firstMatch === false){$("#info").html("Updating Score...")}
			game.displayScore()
			
		} else if(snapshot.val() === 40 && game.players >=1){
			if(game.firstMatch === false){$("#info").html("RESETTING MATCH!")}
			game.rematch()
		}
	},
	getOpponentPicks: function(){
		var matchplayers = database.ref("Players")
		matchplayers.once("value", function(snapshot){
			snapshot.forEach(function(child){
				if(child.val().name !== game.playerID){
				game.opponentPicks.push(child.val().playerPick)
			}
			})

		})
		for(var i = 0; i < game.opponentPicks.length; i++){
			var opponentColor = '"#' + game.opponentPicks[i] + '"';
			$(JSON.parse(opponentColor)).addClass("opponentPick")
			var choice = '".' + game.opponentPicks[i] + 'Img"';
			$(JSON.parse(choice)).css("visibility", "visible")

		}
	},
	allInvis: function(){
		$(".displayImg").css("visibility", "hidden");
	},
	allVis: function(){
		$(".displayImg").css("visibility", "visible");
	},
	playerChoice: function(){
		if(game.matchHappening){
			game.allInvis();
			var choice = '".' + $(this).attr("id") + 'Img"';
			$(JSON.parse(choice)).css("visibility", "visible")
			game.playerPick = $(this).attr("id")
		}
		
	},
	updateScore: function(){
		//calculates wins for local player and relevent  visuals
		for(var i = 0; i < game.opponentPicks.length; i++){
			if(game.playerPick !== "noPick" && game.opponentPicks[i] === "noPick"){
				game.score++;
				database.ref("Players").child(game.playerID).update({wins: game.score})
			} else if(game.playerPick === "Rock" && (game.opponentPicks[i] === "Lizard" || game.opponentPicks[i] === "Scissors")){
				game.score++;
				database.ref("Players").child(game.playerID).update({wins: game.score})
				if(game.opponentPicks[i] === "Lizard"){
					$(".RbLImg").css("visibility", "visible")
				} else {
					$(".RbSImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Paper" && (game.opponentPicks[i] === "Spock" || game.opponentPicks[i] === "Rock")){
				game.score++;
				database.ref("Players").child(game.playerID).update({wins: game.score})
				if(game.opponentPicks[i] === "Spock"){
					$(".PbVImg").css("visibility", "visible")
				} else {
					$(".PbRImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Scissors" && (game.opponentPicks[i] === "Lizard" || game.opponentPicks[i] === "Paper")){
				game.score++;
				database.ref("Players").child(game.playerID).update({wins: game.score})
				if(game.opponentPicks[i] === "Lizard"){
					$(".SbLImg").css("visibility", "visible")
				} else {
					$(".SbPImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Lizard" && (game.opponentPicks[i] === "Spock" || game.opponentPicks[i] === "Paper")){
				game.score++;
				database.ref("Players").child(game.playerID).update({wins: game.score})
				if(game.opponentPicks[i] === "Spock"){
					$(".LbVImg").css("visibility", "visible")
				} else {
					$(".LbPImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Spock" && (game.opponentPicks[i] === "Scissors" || game.opponentPicks[i] === "Rock")){
				game.score++;
				database.ref("Players").child(game.playerID).update({wins: game.score})
				if(game.opponentPicks[i] === "Scissors"){
					$(".VbSImg").css("visibility", "visible")
				} else {
					$(".VbRImg").css("visibility", "visible")
				}
			}
		}
		//loads up visuals for oppoent wins
		for(var i = 0; i < game.opponentPicks.length; i++){
			if(game.playerPick === "Rock" && (game.opponentPicks[i] === "Paper" || game.opponentPicks[i] === "Spock")){
				if(game.opponentPicks[i] === "Paper"){
					$(".PbRImg").css("visibility", "visible")
				} else {
					$(".VbRImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Paper" && (game.opponentPicks[i] === "Scissors" || game.opponentPicks[i] === "Lizard")){
				if(game.opponentPicks[i] === "Scissors"){
					$(".SbPImg").css("visibility", "visible")
				} else {
					$(".LbPImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Scissors" && (game.opponentPicks[i] === "Spock" || game.opponentPicks[i] === "Rock")){
				if(game.opponentPicks[i] === "Spock"){
					$(".VbSImg").css("visibility", "visible")
				} else {
					$(".RbSImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Lizard" && (game.opponentPicks[i] === "Rock" || game.opponentPicks[i] === "Scissors")){
				if(game.opponentPicks[i] === "Rock"){
					$(".RbLImg").css("visibility", "visible")
				} else {
					$(".SbLImg").css("visibility", "visible")
				}
			} else if(game.playerPick === "Spock" && (game.opponentPicks[i] === "Paper" || game.opponentPicks[i] === "Lizard")){
				if(game.opponentPicks[i] === "Paper"){
					$(".PbVImg").css("visibility", "visible")
				} else {
					$(".LbVImg").css("visibility", "visible")
				}
			}
		}

	},
	displayScore: function(){
		var scores = database.ref("Players")
		scores.once("value", function(snapshot){
			$("tbody").empty()
			snapshot.forEach(function(child){
				var player = child.val().name
				var wins = child.val().wins
				$("tbody").append("<tr><td>" + player + "</td><td>" + wins  + "</td></tr>")	
			})
		})
	},
	playerName: function(){
		if(game.playerID === undefined){
			game.playerID = $(nameInput).val().trim()
			database.ref("Players").child(game.playerID).set({
				name: game.playerID,
				wins: 0,
				playerPick: game.playerPick
			})
			game.players++;
			database.ref("playerCount").set(game.players)	
		}
		//sets on disconnect info for player data and player count
		database.ref("Players").child(game.playerID).onDisconnect().remove()
		var playerNum = database.ref("playerCount")
		playerNum.on("value", function(snapshot){
			game.players = snapshot.val()
			database.ref("playerCount").onDisconnect().set(--game.players)
		})

		
		
	},
	updatePlayerList: function(snapshot){
		var player = snapshot.val().name
		var wins = snapshot.val().wins
		$("tbody").append("<tr><td>" + player + "</td><td>" + wins  + "</td></tr>")

	},
	updateChatlog: function(snapshot){
		var player = snapshot.val().name
		var message = snapshot.val().message
		$("#chatlog").prepend("<p><b><em>" + player + ": </em></b>" + message + "</p>")
	},
	rematch: function(){
		game.allVis();
		game.loadButtons();
		game.timer = 20;
		game.opponentPicks = [];
		game.playerPick = "noPick"

	},
	chatBluff: function(){
		if(game.playerID !== undefined && game.playerPick !== "noPick"){
			database.ref("Chatlog").push({name: game.playerID,
										  message: "I'm picking " + game.playerPick})
		}
	},
	chatGreet: function(){
		var message = game.greetArray[Math.floor(Math.random() * game.greetArray.length)]
		database.ref("Chatlog").push({name: game.playerID,
										  message: message})
	},
	chatTaunt: function(){
		var message = game.tauntArray[Math.floor(Math.random() * game.tauntArray.length)]
		database.ref("Chatlog").push({name: game.playerID,
										  message: message})
	},
	chatPraise: function(){
		var message = game.praiseArray[Math.floor(Math.random() * game.praiseArray.length)]
		database.ref("Chatlog").push({name: game.playerID,
										  message: message})
	},


}


game.initialize()

