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
	timer: 15, //timer length
	timerRunning: false, //check if timer is running
	database: undefined, // for reference to firebase
	players: 0, //number of player need to get value from firebase and update
	opponentPicks: [], //stores array of opponent choices pulled from firebase
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

			setTimeout(game.getOpponentPicks, 3000)
			setTimeout(game.updateScore, 4000)

			// game.updateScore()
		}
	},
	countdown: function(){
		$("#info").text("Match is starting")

		// var matchplayers = database.ref("Players")
		// matchplayers.on("value", function(snapshot){
		// 	snapshot.forEach(function(child){
		// 		if(child !== game.playerID){
		// 		console.log(child.val().playerPick)
		// 		game.opponentPicks.push(child.val().playerPick)
		// 	}
		// 	})

		// })

		game.timerRunning = true;
		game.countdownID = setInterval(game.decrementTimer, 1000)
	},
	loadButtons: function(){
		//BUG on smaller view finder form covers buttons making them unclickable 
		for(var i = 0; i < 5; i++){
			var element = $("<div>")
			var id = game.displayImgs[i + 5].split(".")
			$(element).addClass("button")
					  .attr("id", id[0])
			var btnImg = $("<img>")
			$(btnImg).attr("src", "assets/images/" + game.displayImgs[i])
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
			console.log(snapshot.val())
			game.players = snapshot.val()
		});

		var players = database.ref("Players")
		players.once("value", function(snapshot){
			snapshot.forEach(function(child){
				console.log(child.val().name)
				console.log(child.val().wins)
				console.log(child.val().losses)
				var element = $("<div>")
				var player = child.val().name
				var wins = child.val().wins
				var losses = child.val().losses
				$("tbody").append("<tr><td>" + player + "</td><td>" + wins + "</td><td>" + losses + "<td></tr>")	
			})
		})



		//sets on click events for buttons
		$(".button").on("click", game.playerChoice)
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
		connectionsRef.on("value", function(snap){
			database.ref(game.playerID).remove()
			if(snap.val() === false){
				game.players--;
				database.ref("playerCount").set(game.players)
			}
			
		})


		// updates player count locally when firebase updates player count
		database.ref("Players").on("child_added", game.updatePlayerList)
		// database.ref("Players").on("value", game.getOpponentPicks)
		// 	console.log()
		// })

		//Initiate match once there is more than one player
		var playerCount = database.ref("playerCount")
			playerCount.on("value", function(snap){
				if(snap.val() > 1){
					playerCount.off()
					game.countdown()
				}
				
			});

	},
	getOpponentPicks: function(){

		//WORKS BUT UNSTABLE
		var matchplayers = database.ref("Players")
		matchplayers.once("value", function(snapshot){
			snapshot.forEach(function(child){
				// console.log("Snapshot val is:" + snapshot.val().name)
				// console.log("child val is:" +child.val().name)
				if(child.val().name !== game.playerID){
				// console.log(child.val().playerPick)
				// console.log(child.val().name)
				game.opponentPicks.push(child.val().playerPick)
			}
			})

		})
		console.log(game.opponentPicks)
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
		// var wins = database.ref(game.playerID)
		// wins.on("value", function(snapshot){
			// console.log(snapshot.val())
		for(var i = 0; i < game.opponentPicks.length; i++){
			if(game.playerPick ===  "Rock" && (game.opponentPicks[i] === "Lizard" || game.opponentPicks[i] === "Scissors")){
				game.score++;
				database.ref(game.playerID).update({wins: game.score})
			} else if(game.playerPick ===  "Paper" && (game.opponentPicks[i] === "Spock" || game.opponentPicks[i] === "Rock")){
				game.score++;
				database.ref(game.playerID).update({wins: game.score})
			} else if(game.playerPick ===  "Scissors" && (game.opponentPicks[i] === "Lizard" || game.opponentPicks[i] === "Paper")){
				game.score++;
				database.ref(game.playerID).update({wins: game.score})
			} else if(game.playerPick ===  "Lizard" && (game.opponentPicks[i] === "Spock" || game.opponentPicks[i] === "Paper")){
				game.score++;
				database.ref(game.playerID).update({wins: game.score})
			} else if(game.playerPick ===  "Spock" && (game.opponentPicks[i] === "Scissors" || game.opponentPicks[i] === "Rock")){
				game.score++;
				database.ref(game.playerID).update({wins: game.score})
			}
		}
		console.log("SCORE is:" + game.score)

		// })
		
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
		// game.countdown()	
	},
	updatePlayerList: function(snapshot){
		//BUG sometimes posts undefined data (probably on removal of child OR when countdown finishes)
		var element = $("<div>")
		var player = snapshot.val().name
		var wins = snapshot.val().wins
		var losses = snapshot.val().losses
		$("tbody").append("<tr><td>" + player + "</td><td>" + wins + "</td><td>" + losses + "<td></tr>")

	},

}


game.initialize()

