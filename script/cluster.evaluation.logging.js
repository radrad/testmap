// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Evaluation, Event logging
var log = { // For evaluation logging
	data: [], // logged data var
	lsCounter: 0, // every code needs a counter ;)
	log: function(param){	// log param, param can be {x:y,[..]}
		log.data.push({
			time: new Date(),
			event: param
		});
		// Enable this line to see logging in web browsers console (can be pretty much)
		//console.log("Evaluation data logging",JSON.stringify(log.data[log.data.length - 1]));
		if(log.data.length >= 1000 || param.forceSave){
			localStorage.setItem("cluster.evaluation." + log.lsCounter, JSON.stringify(log.data));
			log.lsCounter++;
			log.data = [];
			log.log({type:"log-save"});
		}
	},
	show: function(){ // Shows every log entry in console
		var id = 0;
		for (var i = 0; i < log.lsCounter; i++) {
			var dataSet = JSON.parse(localStorage.getItem("cluster.evaluation." + i));
			for (var j = 0; j < dataSet.length; j++) {
				console.log("Evaluation log",id,JSON.stringify(dataSet[j]));
				id++;
			};
		};
		for(var i = 0; i < log.data.length; i++){
				console.log("Evaluation log",id,JSON.stringify(log.data[i]));
				id++;
		}
	},
	save: function(){ // saves log entries and sends them to server
		var logs = [];
		for (var i = 0; i < log.lsCounter; i++) {
			var dataSet = JSON.parse(localStorage.getItem("cluster.evaluation." + i));
			for (var j = 0; j < dataSet.length; j++) {
				logs.push(dataSet[j]);
			};
		};
		for(var i = 0; i < log.data.length; i++){
				logs.push(log.data[i]);
		}
		$("textarea").val(JSON.stringify(logs));
		cluster.evaluation.ended = true;
		document.evaluationForm.submit();
	},
	leaving: function(){ // Participant tries to close website? Don't let him do that!
		log.log({type: "action", description: "trying to leave site", forceSave: true});
		if(cluster.evaluation.ended)
			return;
		return "Sie sind im Begriff diese Seite zu verlassen. Bitte verlassen Sie diese Seite nur, wenn Sie die Betreuer explizit dazu auffordern.";
	}
}

// shows warning message if trying to close window or refresh
// window.onbeforeunload = log.leaving;