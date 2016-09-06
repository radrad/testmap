// performanceChecker, can be used to compare clustering calculation speeds or other speed tests
// by Malte Wellmann, 2013
var performanceChecker = {
	results: [], // results var
	minTime: 0.5, // min time between 2 results to be important enough to display them in console
	display: { // display results
		all: function(){ // displays all results
			console.log("performanceCheckers:");
			for (var i = 0; i < performanceChecker.results.length; i++) {
				performanceChecker.display.single(i);
			}
		},
		single: function(i){ // displays specific (param) result or comparison, will use latest if no param given
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
		compare: function(i){ // compares specific (param) result to the latest result
			console.log("performanceChecker compare",performanceChecker.results[i].description + " to " + performanceChecker.results[performanceChecker.results.length - 1].description,performanceChecker.results[performanceChecker.results.length - 1].value - performanceChecker.results[i].value);
		}
	},
	add: function(description){	// add new result or part of result
		performanceChecker.results.push({
			description: description,
			value: window.performance.now()
		});
		return performanceChecker.results.length - 1;
	},
	start: function(){ // add "started" result
		return performanceChecker.add("Started");
	},
	end: function(description){ // compares this time to last results time and displays comparison
		performanceChecker.add(description);
		performanceChecker.display.single();
	}
}