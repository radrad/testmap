// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Saving, loading points in local storage or user input


cluster.localStorage = { // saving, loading, storing
	save: function(){ // save to local storage
		try{
			log.log({type: "localStorage", description: "save"});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		console.log("save called");
		this.points = [];
		for (var i = 0; i < cluster.points.length; i++) {
			this.points.push({
				private: cluster.points[i].get.private(),
				pos: {
					lat: cluster.points[i].get.pos().lat(),
					lng: cluster.points[i].get.pos().lng()
				}
			});
		}
		localStorage.setItem("cluster.points", JSON.stringify(this.points));
	},
	saveConsole: function(){ // save to console
		try{
			log.log({type: "localStorage", description: "save console"});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		console.log("save called");
		this.points = [];
		for (var i = 0; i < cluster.points.length; i++) {
			this.points.push({
				private: cluster.points[i].get.private(),
				pos: {
					lat: cluster.points[i].get.pos().lat(),
					lng: cluster.points[i].get.pos().lng()
				}
			});
		}
		$($("textarea")[0]).val(JSON.stringify(this.points));
	},
	load: function(){ // load from local storage
		log.log({type: "localStorage", description: "load"});
		console.log("load called");
		cluster.points = [];
		try{
			console.log(localStorage.getItem("cluster.points"));
			this.points = JSON.parse(localStorage.getItem("cluster.points"));
			for (var i = 0; this.points != null && i < this.points.length; i++) {
				cluster.points.push(new cluster.Point({
					pos: new google.maps.LatLng(this.points[i].pos.lat, this.points[i].pos.lng),
					name: this.points[i].private.name,
					private: this.points[i].private
				}));
			};
		}catch(e){
			alert("Local Storage not supported. Please use latest Firefox.");
		}
	},
	manual: function(){ // load from manual input
		log.log({type: "localStorage", description: "manual"});
		console.log("manual load called");
		cluster.points = [];
		try{
			this.points = JSON.parse($($("textarea")[0]).val());
			console.log(this.points);
			for (var i = 0; this.points != null && i < this.points.length; i++) {
				cluster.points.push(new cluster.Point({
					clusters: [],
					pos: new google.maps.LatLng(this.points[i].pos.lat, this.points[i].pos.lng),
					name: this.points[i].private.name,
					private: this.points[i].private
				}));
			};
		}catch(e){
			alert("Local Storage not supported. Please use latest Firefox.");
		}
	},
	loadParam: function(param){ // load from param input (param = input)
		cluster.map.map.setCenter(new google.maps.LatLng(param.center.lat, param.center.lng));
		log.log({type: "localStorage", description: "loadParam", center: param.center});
		console.log("manual load called");
		for (var i = 0; i < cluster.points.length; i++) {
			cluster.points[i].map.marker.setMap(null);
		};
		for (var i = 0; i < cluster.polygons.objects.length; i++) {
			try{cluster.polygons.objects[i].setMap(null);}catch(e){}
		};
		cluster.points = [];
		cluster.polygons= {
			xy: [],
			objects: []
		};
		cluster.polygonsDrawn = false;
		try{
			this.points = param.data;
			console.log(this.points);
			for (var i = 0; this.points != null && i < this.points.length; i++) {
				cluster.points.push(new cluster.Point({
					clusters: [],
					pos: new google.maps.LatLng(this.points[i].pos.lat, this.points[i].pos.lng),
					name: this.points[i].private.name,
					private: this.points[i].private
				}));
			};
		}catch(e){
			alert("Local Storage not supported. Please use latest Firefox.");
		}
		cluster.map.map.setZoom(7);
		cluster.drawing.redraw();
		if(cluster.clusteringAlg == 3)
			new MarkerClusterer(cluster.map.map, cluster.helper.getMarkers(), {maxZoom: 14});
	},
	showTextarea: function(){ // show input area
		log.log({type: "localStorage", description: "showTextarea"});
		$($("textarea")[0]).css({display:"block","z-index":4000,height:"200px",width:"200px",top:0,left:0,position:"absolute"});
	}
};