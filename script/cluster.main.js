// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Main document

$(document).ready(function() { // DOM loaded event
	cluster.initialize(1); // initialize map
	//cluster.evaluation.initialize();
});

var cluster = { // Clustering for heterogenous point clouds
	startup: function(param){// startup function, loads city in param

		// Set options:
		var setterFields = ["alternateZoom","clusteringAlg","dynamicAdding","smoothZooming"];
		for (var i = 0; i < setterFields.length; i++) {
			var val = $("input[name='" + setterFields[i] + "']:checked").val();
			if(setterFields[i] == "alternateZoom"){
				if(val == "true")
					cluster.events.switchAlternateZoom();
			}
			else
				cluster[setterFields[i]] = val == "true" ? true : val == "false" ? false : parseInt(val);
		};

		// Load citys point data:
		cluster.localStorage.loadParam(evaluationDatasets[param]);

		// hide start-layer
		$("#startup").fadeOut();
	},
	points: [], // map objects
	polygons: { // map polygons
		xy: [], // coordinates
		objects: [] // objects
	},
	zoomLevel: { // zoom control
		active: 8, // active zoom level
		last: 7, // last zoom level
		refresh: function(lastSet){ // zoom level changed event
			if(	lastSet == undefined &&
				(cluster.zoomLevel.active - 3) >= 0 )
			{
				cluster.zoomLevel.last = cluster.zoomLevel.active - 3;
			}
			else if(lastSet != undefined)
				cluster.zoomLevel.last = lastSet;
			if(!cluster.alternateZoom)
				cluster.alternateMap.refreshZoom();
		}
	},
	minPts: 1, // min amount of points that cluster is created
	noPointAnimations: true, // disables animations if true, requires additional images for each animation point (included)
	map: { // the map object
		map: null, // google maps api object
		$dom: null, // dom object
		$shadow: null // map shadow for fency magnifier
	},
	smoothZooming: false, // smooth zooming enables a slower, more fluid zoom, implemented by Malte Wellmann
	dynamicAdding: false, // enables or disables dynamic adding of points via click on map
	polygonsDrawn: false, // are the polygons already drawn?
	clusteringAlg: 2, // 1 = no Clustering, 2 = own implementation, 3 = Google MarkerClusterer
	colors: { // colors for clusters and everything
		name: "red", // color name for graphics
		clusterHover: "#ff0000", // hover color
		cluster: "#ff4444" // normal color
	},
	alternateMap: { // alternative map for magnifier effect and minimap effect
		map: null, // google maps api object
		$dom: null, // dom object
		refreshZoom: function(){ // automatically refresh zoom, used for display 2nd map as minimap
			// enable if minimap is wanted
			/*
			cluster.alternateMap.map.setZoom(cluster.zoomLevel.last);
			cluster.alternateMap.refreshPolygon();
			*/
		},
		polygon: null, // map polygon (for showing where the big map area is on the minimap)
		refreshPolygon: function(){ // polygon refreshment, must be enabled for minimap effect
			// enable if minimap is wanted
			/*
			if(cluster.alternateMap.polygon == null)
				cluster.alternateMap.polygon = new google.maps.Polygon({
						    path: cluster.calculations.gmapsBoundsToSquarePath(cluster.map.map.getBounds()),
						    map: cluster.alternateMap.map,
						    strokeColor: '#FFFFFF',
						    strokeOpacity: 1,
						    strokeWeight: 1,
						    fillColor: '#FFFFFF',
						    fillOpacity: 0.2
						});
			else
				cluster.alternateMap.polygon.setPath(cluster.calculations.gmapsBoundsToSquarePath(cluster.map.map.getBounds()));
			*/
		}
	},
	browser: { // users web-browser information
		height: null, // screen height in pixels
		width: null, // screen width in pixels
		zoomPercentage: 0.9, // Size of magnifier in percent (1 = 100%)
		zoomCSS: {}, // css for zoomed
		menuCSS: {}, // css for menu
		$menu: null, // menu jQuery ($) dom object
		defaultCSS: { // default css style
			height: "100%",
			width: "100%",
			"margin-left": 0,
			"margin-top": 0
		}
	},
	infoWindow: null, // infoWindow for further point information
	alternateZoom: true, // use magnifier effect or normal zoom
	showSmallPoints: false, // show little points where points are in cluster (requires additional images)
	initialize: function(param) { // Start up everything! (param = clusteringAlgorithm)
		try{
			log.log({type: "action", description: "initialize"});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		// Clustering algorithm given?
		if(param != undefined)
			cluster.clusteringAlg = param; 

		// Create maps
  		cluster.map.map = new google.maps.Map(document.getElementById('map-canvas'), {
  			zoom: 8,
  			maxZoom: 15,
    		center: new google.maps.LatLng(53.08054370928221,8.762884140014648),
    		mapTypeId: google.maps.MapTypeId.ROADMAP,
    		streetViewControl: false,
    		mapTypeControl: true
  		});
  		cluster.alternateMap.map = new google.maps.Map(document.getElementById('map-canvas-alternate'), {
  			zoom: 8,
  			maxZoom: 15,
  			center: new google.maps.LatLng(53.08054370928221,8.762884140014648),
    		mapTypeId: google.maps.MapTypeId.ROADMAP,
    		disableDefaultUI: true
  		});

  		// As soon as google maps is loaded and in an idle state:
  		google.maps.event.addListenerOnce(cluster.map.map, 'idle', function(){

  			// Define jQuery ($) DOM objects
	  		cluster.map.$dom = $("#map-canvas");
	  		cluster.map.$shadow = $("#map-shadow");
	  		cluster.alternateMap.$dom = $("#map-canvas-alternate");
	  		cluster.browser.$menu = $("#map-controls");

	  		// Enable to get points from last session
	  		//cluster.localStorage.load();

			// Calculate clusters and draw everything
			cluster.drawing.redraw();

			// Gather Browser Info and set magnifier size if used
			cluster.events.screenSizeChanged();

			// EVENTS
			// resize window event
			$(window).resize(cluster.events.screenSizeChanged);
			// click on map event
			google.maps.event.addListener(cluster.map.map, 'click', function(event) { if(cluster.dynamicAdding){ cluster.addPoint(event.latLng); }});
			// map zoom changed event
			google.maps.event.addListener(cluster.map.map, 'zoom_changed', function(event){
				try{
					log.log({type: "zoom", to: cluster.map.map.getZoom()});
				}catch(e){
					log.log({type: "logging error", catch: e});
				}
				window.setTimeout(function(){
					cluster.zoomLevel.active = cluster.map.map.getZoom();
					cluster.zoomLevel.refresh();
					cluster.maxDist.value = cluster.maxDist.calculate();
					console.log("Zoom level changed to " + cluster.zoomLevel.active);
					cluster.drawing.redraw();
				},600);
				if(cluster.alternateZoom && cluster.mapSwitcher.animateAlternateMap && cluster.map.map.getZoom() != cluster.alternateMap.map.getZoom() +1){
					if(cluster.mapSwitcher.equalMapZoom)
						cluster.alternateMap.map.setZoom(cluster.map.map.getZoom());
					else
						cluster.alternateMap.map.setZoom(cluster.map.map.getZoom() - 1);
				}
				if(!cluster.mapSwitcher.animateAlternateMap)
					cluster.mapSwitcher.animateAlternateMap = true;
			});
			// map center changed event
			google.maps.event.addListener(cluster.map.map, 'center_changed', function(event) {
				try{
					log.log({type: "map-center-changed", to: cluster.map.map.getCenter()});
				}catch(e){
					log.log({type: "logging error", catch: e});
				}
				if(google.maps.geometry.spherical.computeDistanceBetween(
					cluster.map.map.getCenter(), cluster.alternateMap.map.getCenter()) > 10)
					cluster.alternateMap.map.setCenter(cluster.map.map.getCenter());
				if(!cluster.alternateZoom)
					cluster.alternateMap.refreshPolygon();
			});
			// alternate map center changed event
			google.maps.event.addListener(cluster.alternateMap.map, 'center_changed', function(event) {
				try{
					log.log({type: "map-center-changed-alternate", to: cluster.map.map.getCenter()});
				}catch(e){
					log.log({type: "logging error", catch: e});
				}
				if(google.maps.geometry.spherical.computeDistanceBetween(
					cluster.map.map.getCenter(), cluster.alternateMap.map.getCenter()) > 10)
					cluster.map.map.setCenter(cluster.alternateMap.map.getCenter());
				if(!cluster.alternateZoom)
					cluster.alternateMap.refreshPolygon();
			});
			// map shadow clicked to go back from magnifier view
			cluster.map.$shadow.on('mousedown', cluster.events.returnToMap);



			// Switch to alternate zoom
			cluster.events.switchAlternateZoom();
			// If clustering method is google markerclusterer, then initialize it
			if(cluster.clusteringAlg == 3)
				new MarkerClusterer(cluster.map.map, cluster.helper.getMarkers(), {maxZoom: cluster.gmapsAttr.maxZoomLevel - 1});
		}); // map loaded
	}
};