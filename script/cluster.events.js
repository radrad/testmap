// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Event handling

cluster.events = { // Event handling
	screenSizeChanged: function(){ // Screen size has changed
		try{
			log.log({type: "browser", description: "Screen Size Changed to " + $(window).width() + "x" + $(window).height()});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		cluster.browser.height = $(window).height();
		cluster.browser.width = $(window).width();
		cluster.browser.zoomCSS = {
			width: cluster.browser.height * cluster.browser.zoomPercentage + "px",
			height: cluster.browser.height * cluster.browser.zoomPercentage + "px",
			"margin-left": "-" + (cluster.browser.height * cluster.browser.zoomPercentage) / 2 + "px",
			"margin-top": "-" + (cluster.browser.height * cluster.browser.zoomPercentage) / 2 + "px"
		};
		cluster.browser.menuCSS = {
			"margin-left": "-" + ((cluster.browser.height * cluster.browser.zoomPercentage) / 2) - 120 + "px"
		};
		if(cluster.map.$dom.hasClass("map-zoom"))
			cluster.map.$dom.css(cluster.browser.zoomCSS);
		cluster.browser.$menu.css(cluster.browser.menuCSS);
	},
	clickedCluster: function(sender){ // a cluster has been clicked
		try{
			log.log({type: "click", object: "cluster-polygon", name: cluster.helper.getPointByPolygon(sender).get.name()});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		var bounds = cluster.calculations.getBoundsOfPolygon({polygon:sender});
		if(cluster.alternateZoom){ // Parameter input
			if(!cluster.mapSwitcher.state){
				cluster.map.map.panTo(bounds.center);
				window.setTimeout(function(){
					cluster.mapSwitcher.zoom({state: true, bounds: bounds, zoomChange: true});
				},400);
			}else
				cluster.mapSwitcher.zoom({state: true, bounds: bounds, zoomChange: true});
		}else{ // Parameter input
			cluster.zoomLevel.refresh(cluster.zoomLevel.active);
			cluster.mapSwitcher.zoom({state: false, bounds: bounds, zoomChange: true});
		}
	},
	mouseoverCluster: function(sender){ // the mouse touched a cluster
		try{
			log.log({type: "mouseover", object: "cluster-polygon", name: cluster.helper.getPointByPolygon(sender).get.name()});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		if(sender.fillOpacity == 0.4)
			sender.setOptions({fillColor: cluster.colors.clusterHover});
	},
	mouseoutCluster: function(sender){ // the mouse is leaving a cluster
		try{
			log.log({type: "mouseout", object: "cluster-polygon", name: cluster.helper.getPointByPolygon(sender).get.name()});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		sender.setOptions({fillColor: cluster.colors.cluster});
	},
	clickedPoint: function(sender){ // a single point or cluster center point has been clicked
		try{
			log.log({type: "click", object: "point", name: sender.name});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		this.point = cluster.helper.getPointByName(sender.name);
		cluster.map.map.panTo(this.point.get.pos());
		if(this.point.get.cluster() != -1 && this.point.map.size() > 8){
			if(this.point.map.size(cluster.zoomLevel.active) == 38){
				// medium cluster
				cluster.events.clickedCluster(cluster.polygons.objects[cluster.zoomLevel.active + 1][this.point.get.cluster(cluster.zoomLevel.active + 1)].polygon);
			}else{
				// normal cluster
				cluster.events.clickedCluster(cluster.polygons.objects[cluster.zoomLevel.active][this.point.get.cluster()].polygon);
				cluster.polygons.objects[cluster.zoomLevel.active][this.point.get.cluster()].polygon.setOptions({fillColor:cluster.colors.clusterHover});
			}
		}else{
			//cluster.map.map.panTo(this.point.get.pos());
			if(cluster.infoWindow != null && cluster.infoWindow.getMap() != null)
				cluster.infoWindow.close();
			else
				cluster.infoWindow = new google.maps.InfoWindow({maxWidth: 500});
			if(cluster.infoWindow.title == sender.name){
				cluster.infoWindow.title = "";
				return;
			}
			cluster.infoWindow.title = sender.name;
			cluster.infoWindow.setContent(cluster.infoWindowContent(this.point));
			cluster.infoWindow.open(cluster.map.map,sender);
		}
	},
	switchAlternateZoom: function(){ // user wants to change alternate zoom feature (magnifier effect or minimap)
		try{
			log.log({type: "action", description: "switchedAlternateZoom", to: !cluster.alternateZoom});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		var centerPoint = cluster.map.map.getCenter();
		cluster.alternateZoom =! cluster.alternateZoom;
		if(cluster.alternateZoom){
			cluster.mapSwitcher.equalMapZoom = true;
			cluster.map.$dom.addClass("map-big");
			cluster.map.$dom.css(cluster.browser.defaultCSS);
			cluster.map.$dom.removeClass("map-zoom");
			cluster.alternateMap.$dom.addClass("map-off");
			cluster.alternateMap.$dom.removeClass("map-off-total");
			//cluster.alternateMap.$dom.removeClass("map-minimap");
		}else{
			cluster.mapSwitcher.equalMapZoom = false;
			cluster.map.$dom.addClass("map-big");
			cluster.map.$dom.css(cluster.browser.defaultCSS);
			cluster.map.$dom.removeClass("map-zoom");
			//cluster.alternateMap.$dom.removeClass("map-off");
			cluster.alternateMap.$dom.addClass("map-off-total");
			//cluster.alternateMap.$dom.addClass("map-minimap");
		}
		if(cluster.alternateMap.polygon != null){
			cluster.alternateMap.polygon.setMap(null);
		}
		cluster.alternateMap.polygon = null;
		cluster.map.$shadow.fadeOut();
		cluster.map.map.setOptions({
			disableDefaultUI: false
		});
		google.maps.event.trigger(cluster.map.map, "zoom_changed");
		google.maps.event.trigger(cluster.alternateMap.map, "resize");
		//$(sender).find("img").attr("src","images/radio_" + (cluster.alternateZoom ? "" : "un") + "checked.png");
		cluster.map.map.setCenter(centerPoint);
	},
	switchShowSmallPoints: function(sender){ // switch between small points on cluster to be displayed or not
		try{
			log.log({type: "action", description: "switched small points", to: !cluster.showSmallPoints});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		cluster.showSmallPoints =! cluster.showSmallPoints;
		$(sender).find("img").attr("src","images/radio_" + (cluster.showSmallPoints ? "" : "un") + "checked.png");
		cluster.drawing.redraw();

	},
	zoomIn: function(){ // zoom in called
		try{
			log.log({type: "zoom", type: "+", to: cluster.zoomLevel.active + 1});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		cluster.map.map.setZoom(cluster.zoomLevel.active + 1);
	},
	zoomOut: function(){ // zoom out called
		try{
			log.log({type: "zoom", type: "-", to: cluster.zoomLevel.active - 1});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		cluster.map.map.setZoom(cluster.zoomLevel.active - 1);
	},
	returnToMap: function(){ // return to map called (from magnifier effect)
		try{
			log.log({type:"action", description: "returned to map"});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		cluster.mapSwitcher.animateAlternateMap = false;
		cluster.map.map.setZoom(cluster.zoomLevel.active - 1);
		window.setTimeout(function(){
			cluster.mapSwitcher.zoom({state: false, takeCenter: true});
		},600);
	}
};

cluster.addPoint = function(param){ // adds point to the map
	try{
		log.log({type: "action", description: "point added", params: param});
	}catch(e){
		log.log({type: "logging error", catch: e});
	}
	cluster.points.push(new cluster.Point({
		clusters: [],
		pos: param,
		name: "Hotel " + cluster.points.length
	}));
	// Save to local storage
	cluster.localStorage.save();

	cluster.calculations.deepClustering();
	cluster.drawing.redraw();
};