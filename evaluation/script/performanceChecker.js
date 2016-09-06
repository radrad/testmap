// performanceChecker
var performanceChecker = {
	results: [],
	minTime: 0.5,
	display: {
		all: function(){
			console.log("performanceCheckers:");
			for (var i = 0; i < performanceChecker.results.length; i++) {
				performanceChecker.display.single(i);
			}
		},
		single: function(i){
			if(i == undefined)
				var i = performanceChecker.results.length - 1;
			if(i == -1){
				console.log("No performanceChecker results.");
				return;
			}
			if(i == 0)
				console.log("performanceChecker (start)",performanceChecker.results[i].description,performanceChecker.results[i].value);
			else if(performanceChecker.results[i].value - performanceChecker.results[i - 1].value > performanceChecker.minTime)
				console.log("performanceChecker",performanceChecker.results[i].description,performanceChecker.results[i].value - performanceChecker.results[i - 1].value);
		},
		compare: function(i){
			console.log("performanceChecker compare",performanceChecker.results[i].description + " to " + performanceChecker.results[performanceChecker.results.length - 1].description,performanceChecker.results[performanceChecker.results.length - 1].value - performanceChecker.results[i].value);
		}
	},
	add: function(description){
		performanceChecker.results.push({
			description: description,
			value: window.performance.now()
		});
		return performanceChecker.results.length - 1;
	},
	start: function(){
		return performanceChecker.add("Started");
	},
	end: function(description){
		performanceChecker.add(description);
		performanceChecker.display.single();
	}
}