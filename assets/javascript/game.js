var game = {
	//Images for display and buttons
	displayImgs: ["RockBtn.png", "PaperBtn.png", "ScissorsBtn.png", "LizardBtn.png", "SpockBtn.png", 
				  "Rock.png", "Paper.png", "Scissors.png", "Lizard.png", "Spock.png", 
				  "LbP.png", "LbV.png", "PbR.png", "PbV.png", "RbL.png", 
				  "RbS.png", "SbL.png", "SbP.png", "VbR.png", "VbS.png"],
	playerID: undefined, //local player Name
	score: 0, // local player score
	playerPick: "noPick", //players choice to be pushed to firebase
	countdownID: undefined, //for clearing interval
	timer: 20, //timer length
	timerRunning: false, //check if timer is running
	database: undefined, // for reference to firebase
	players: 0, //number of player need to get value from firebase and update
	opponentPicks: [], //stores array of opponent choices pulled from firebase
	matchHappening: false, //store to firebase to check if a match is already running
	config: {
      apiKey: "AIzaSyCLbEjKvRPiZdO3I6ADlExj_N0ZD60nATk",
      databaseURL: "https://rpsmulti-fd6d4.firebaseio.com",
    },
	decrementTimer: function(){
		if(game.timer > 1){
			game.timer--;
			$("#timer").text(game.timer + "Secs")
		} else {
			clearInterval(game.countdownID);
			$("#timer").text("Time is Up");
			game.timerRunning = false;
			database.ref("Players").child(game.playerID).update({playerPick: game.playerPick});

			//lights up players button choice
			var colorPick = '"#' + game.playerPick + 'pic"'
			$(JSON.parse(colorPick)).addClass("playerPick")

			//gets current opponent picks and then updates score
			setTimeout(game.getOpponentPicks, 3000)
			setTimeout(game.updateScore, 4000)
		}
	},
	countdown: function(){
		$("#info").text("Match is starting")
		game.matchHappening = true;
		database.ref().child("matchHappening").set(game.matchHappening);
		game.timerRunning = true;
		game.countdownID = setInterval(game.decrementTimer, 1000)
	},
	loadButtons: function(){
		$("#buttons").empty()
		//BUG on smaller view finder form covers buttons making them unclickable 
		for(var i = 0; i < 5; i++){
			var element = $("<div>")
			var id = game.displayImgs[i + 5].split(".")
			$(element).addClass("button")
					  .attr("id", id[0])
			var btnImg = $("<img>")
			$(btnImg).attr("src", "assets/images/" + game.displayImgs[i])
					 .attr("id", id[0] + "pic")
					 .addClass("buttonImg")
			$(element).append(btnImg)
			$("#buttons").append(element)
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

    	firebase.initializeApp(game.config);
    	database = firebase.database()

		game.loadButtons();
		//gets number of players already in game
		var playerCount = database.ref("playerCount")
		playerCount.once("value", function(snapshot){
			game.players = snapshot.val()
		});

		//initial snapshot to load any players already in game
		//BUG seems to run twice
		var players = database.ref("Players")
		players.once("value", function(snapshot){
			snapshot.forEach(function(child){
				var element = $("<div>")
				var player = child.val().name
				var wins = child.val().wins
				var losses = child.val().losses
				$("tbody").append("<tr><td>" + player + "</td><td>" + wins + "</td><td>" + losses + "<td></tr>")	
			})
		})

		//sets on click events for buttons
		$("#buttons").on("click", ".button", game.playerChoice)
		$("#submit").on("click", game.playerName)

		// sets connection information and onDisconnect functionality
		var connectionsRef = database.ref("/connections")
		var connectedRef = database.ref(".info/connected")

		connectedRef.on("value", function(snap){
			if(snap.val()){
				var con = connectionsRef.push(true)
				con.onDisconnect().remove()
			}
		})

		// updates player count locally when firebase updates player count
		database.ref("Players").on("child_added", game.updatePlayerList)


		//Initiate match once there is more than one player and there isn't already a match in progress
		var playerCount = database.ref()
			playerCount.on("value", function(snap){
				if(snap.child("playerCount").val() > 1 && snap.child("matchHappening").val() !== true){
					playerCount.off()
					game.countdown()
				}
				// if(snap.child("matchHappening") === true){
				// 	playerCount.off()
				// }
				
			});

	},
	getOpponentPicks: function(){

		//WORKS BUT UNSTABLE
		//including own score doesn't matter in positive only scoring,
		//maybe remove check system.
		var matchplayers = database.ref("Players")
		matchplayers.once("value", function(snapshot){
			snapshot.forEach(function(child){
				if(child.val().name !== game.playerID){
				game.opponentPicks.push(child.val().playerPick)
			}
			})

		})
		for(var i = 0; i < game.opponentPicks.length; i++){
			var opponentColor = '"#' + game.opponentPicks[i] + 'pic"';
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
		game.allInvis();
		var choice = '".' + $(this).attr("id") + 'Img"';
		$(JSON.parse(choice)).css("visibility", "visible")
		game.playerPick = $(this).attr("id")

		
	},
	updateScore: function(){
		//NEED TO ADD GETTING A POINT IF THE OPPONENT DOESNT PICK
		//calculates wins for local player and relevent  visuals
		for(var i = 0; i < game.opponentPicks.length; i++){
			if(game.playerPick === "Rock" && (game.opponentPicks[i] === "Lizard" || game.opponentPicks[i] === "Scissors")){
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

		setTimeout(game.displayScore, 3000)

		
	},
	displayScore: function(){
		var scores = database.ref("Players")
		scores.once("value", function(snapshot){
			$("tbody").empty()
			snapshot.forEach(function(child){
				var element = $("<div>")
				var player = child.val().name
				var wins = child.val().wins
				var losses = child.val().losses
				$("tbody").append("<tr><td>" + player + "</td><td>" + wins + "</td><td>" + losses + "<td></tr>")	
			})
		})
		database.ref("matchHappening").set(false)

		setTimeout(game.rematch, 2000)


	},
	playerName: function(){
		if(game.playerID === undefined){
			game.playerID = $(nameInput).val().trim()
			database.ref("Players").child(game.playerID).set({
				name: game.playerID,
				wins: 0,
				losses: 0,
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
		//BUG sometimes posts undefined data (probably on removal of child OR when countdown finishes) **possibly resolved now**
		var player = snapshot.val().name
		var wins = snapshot.val().wins
		var losses = snapshot.val().losses
		$("tbody").append("<tr><td>" + player + "</td><td>" + wins + "</td><td>" + losses + "<td></tr>")

	},
	rematch: function(){
		game.allVis();
		game.loadButtons();
		game.timer = 20;
		game.opponentPick = [];
		game.playerPick = "noPick"
		game.countdown();

	}

}


game.initialize()

