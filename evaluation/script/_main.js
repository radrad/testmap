$(document).ready(function() {
	initialize();
	try{
		points = JSON.parse(localStorage.getItem("points"));
	}catch(e){
		alert("Local Storage not supported. Please use a better browser.");
	}
	redrawMarkerList();
	google.maps.event.addListener(map, 'click', function(event) { addMarker(event.latLng); });
	google.maps.event.addListener(map, 'zoom_changed', function(event){
		window.setTimeout(function(){
			redrawMarkerList();
			redrawClusters.execute();
		},600);
	});
	drawMarkers();
	redrawClusters.execute();
	$("#clusterMethodButtons button").on("click",function(){
		setClusterAlg(this.innerHTML);
		$("#clusterMethodButtons button").removeAttr("disabled");
		$(this).attr("disabled", "disabled");
	});
	$("#clMaxDist").on("keyup mouseup",function(){
		var val = parseInt($(this).val());
		$(this).val(val ? val : 0);
		clMaxDist = parseInt($(this).val());
		redrawMarkerList();
		redrawClusters.execute();
	});
	$("#clMinPoints").on("keyup mouseup",function(){
		var val = parseInt($(this).val());
		$(this).val(val ? val : 0);
		clMinPoints = parseInt($(this).val()) - 1;
		redrawMarkerList();
		redrawClusters.execute();
	});
	$("#clDepth").on("keyup mouseup",function(){
		var val = parseInt($(this).val());
		$(this).val(val ? val : 1);
		clDepth = parseInt($(this).val());
		redrawMarkerList();
		redrawClusters.execute();
	});
	$("#clLinkage").on("keyup mouseup change",function(){
		clLinkage = parseInt($(this).val());
		redrawMarkerList();
		redrawClusters.execute();
	});
	$("#clClusters").on("keyup mouseup",function(){
		var val = parseInt($(this).val());
		if($(this).val() == "a")
			val = parseInt(Math.sqrt(points.length/2));
		$(this).val(val ? val : 1);
		clClusters = parseInt($(this).val());
		redrawMarkerList();
		redrawClusters.execute();
	});
});


var sn, // Shorten
	temp,
	primaryColor = "blue",
	clusterAlg = "DBSCAN",
	markerPoints = [],
	map,
	clMinPoints = 0,
	clMaxDist = 40000,
	getClMaxDist = function(){
		clMaxDist = getMapDist();
		$("#clMaxDist").val(clMaxDist);
		return clMaxDist;
	},
	getMapDist = function(){
		var zoom = map.getZoom();
		switch(zoom){ // values for google maps api v3
			case 15:
				return 0;
			case 14:
				return 185;
			case 13:
				return 350;
			case 12:
				return 800;
			case 11:
				return 1400;
			case 10:
				return 3000;
			case 9:
				return 7000;
			case 8:
				return 12000;
			case 7:
				return 23000;
			case 6:
				return 50000;
			case 5:
				return 85000;
			case 4:
				return 200000;
			case 3:
				return 350000;
			case 2:
				return 600000;
			case 1:
			case 0:
				return 1000000;
			default:
				return 0;
		}
	},
	clDepth = 1,
	clClusters = 4,
	clLinkage = "single",
	pointsVisible = false,
	clustersVisible = true,
	pointsMap = function(){return pointsVisible ? map : null},
	clustersMap = function(){return clustersVisible ? map : null},
	lastCategory = 1,
	initialize = function() {
  		var mapOptions = {
    		zoom: 8,
    		center: new google.maps.LatLng(53.079296, 8.801694),
    		mapTypeId: google.maps.MapTypeId.TERRAIN
  		};
  		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	},
	points = [],
	clusters = [],
	standardPoints = [
		{
			pos: {lat: 53.079296, lng: 8.891694},
			name: "Start point",
			category: 1,
			time: "2013-08-27-13-49",
			deprecated: false,
			marked: true
		}
	],
	changeClusterAlg = function(){
		setClusterAlg(prompt('ClusterAlg',clusterAlg));
	},
	setClusterAlg = function(newClusterAlg){
		clusterAlg = newClusterAlg;
		redrawMarkerList();
		redrawClusters.execute();
	},
	pointDetailView = function(point){
		return $("<div class='pointDetailView markerColorBackground" + point.category + "'></div>").
				append($("<h1>" + point.name + "</h1>")).
				append($("<div>" + point.time + "</div>")).
				append($("<div>Lat: " + point.pos.lat + "<br/>Lng: " + point.pos.lng + "</div>")).
				append(pointDetailViewMarker(point.marked));
	},
	clusterDetailView = function(cluster){
		return $("<div class='clusterDetailView'></div>").
				append($("<h1>" + cluster.name + "</h1>")).
				append($("<div>" + clusterPointList(cluster) + "</div>"));
	},
	clusterPointList = function(cluster){
		var list = "";
		for (var i = 0; i < cluster.points.length; i++) {
			list += "<li>" + cluster.points[i].name + "</li>";
		}
		return "<ul>" + list + "</ul>";
	},
	pointDetailViewMarker = function(isMarked){
		return isMarked ? $("<img src='images/star.png' class='marked'/>") : 
						  $("<img src='images/star.png' class='notMarked'/>");
	},
	addMarker = function(location) {
		temp = location;
	  /*
	  if(lastCategory >= 5) // 5 available categories
	  	lastCategory = 1;
	  else
	  	lastCategory++;
	  */
	  marker = new google.maps.Marker({
	    position: location,
    	animation: google.maps.Animation.DROP,
    	icon: getMarkerIcon({category: lastCategory}),
	    map: pointsMap()
	  });
	  markerPoints.push(marker);
	  points.push({
	  	pos: {lat: location.lat(), lng: location.lng()},
			name: "Point " + points.length,
			category: lastCategory,
			time: "2013-08-27-13-49",
			deprecated: false,
			marked: false
	  });
	  console.log("Marker added",marker);
	  redrawMarkerList();
	  redrawClusters.execute();
	},
	redrawMarkerList = function(){
		var $pointsContainer = $("#points");
		if(points == null || points == undefined || points.length == 0){
			points = standardPoints;
		}
		$pointsContainer.empty();
		for(var i = 0; i < points.length; i++){
			$pointsContainer.append(pointDetailView(points[i]));
		}
		var $clustersContainer = $("#clusters");
		clusterPoints(clusterAlg, {
			points: points,
			maxDist: getClMaxDist(),
			minPts: clMinPoints,
			depth: clDepth,
			linkage: clLinkage,
			clusters: clClusters
		});
		$clustersContainer.empty();
		for(var i = 0; i < clusters.length; i++){
			$clustersContainer.append(clusterDetailView(clusters[i]));
		}
		saveMarkers();
	},
	getBoundsOfPolygon = function(polygon){
		var north,
			east,
			west,
			south,
			lat,
			lng,
			path = polygon.pointCircles;
		for (var i = 0; i < path.length; i++) {
			lat = path[i].getPosition().lat();
			lng = path[i].getPosition().lng();
			if(north == null || north > lat)
				north = lat;
			if(east == null || east < lng)
				east = lng;
			if(west == null || west > lng)
				west = lng;
			if(south == null || south < lat)
				south = lat;
		};
		return {sw: new google.maps.LatLng(south, west), ne: new google.maps.LatLng(north, east), center: new google.maps.LatLng((south+north) / 2, (west+east) / 2)};
	},
	getClusterPath = function(cluster){
		var result = [];
		for (var i = 0; i < cluster.points.length; i++) {
			result.push(getPointPosition(cluster.points[i]));
		}
		return result;
	},
	getClusterConvexHull = function(cluster){
		var result = [],
			xyClusterPoints = [];
		for (var i = 0; i < cluster.points.length; i++) {
			xyClusterPoints.push(getXYPoint(cluster.points[i]));
		}
		var grahamScanPoints = GrahamScan.execute(xyClusterPoints);
		for (var i = 0; i < grahamScanPoints.length; i++) {
			result.push(getPointPositionByXY(grahamScanPoints[i]));
		}
		return result;
	},
	getClusterConcaveHull = function(cluster){
		var result = [],
			xyClusterPoints = [];
		for (var i = 0; i < cluster.points.length; i++) {
			xyClusterPoints.push(getXYPoint(cluster.points[i]));
		}
		var grahamScanPoints = GrahamScan.execute(xyClusterPoints);
		for (var i = 0; i < grahamScanPoints.length; i++) {
			result.push(getPointPositionByXY(grahamScanPoints[i]));
		}
		return result;
	},
	getXYPoint = function(point){
		return {x: point.pos.lat, y: point.pos.lng};
	},
	getPointPositionByXY = function(pointXY){
		return new google.maps.LatLng(pointXY.x, pointXY.y);
	},
	getPointPosition = function(point){
		return new google.maps.LatLng(point.pos.lat, point.pos.lng);
	},
	saveMarkers = function(){
		localStorage.setItem("points", JSON.stringify(points));
	},
	showHidePoints = function(sender){
		pointsVisible = !pointsVisible;
		for (var i = 0; i < markerPoints.length; i++) {
			markerPoints[i].setMap(null);
		}
		markerPoints = [];
		drawMarkers();
		$(sender).find("img").attr("src",pointsVisible ? "images/radio_checked.png" : "images/radio_unchecked.png");
	},
	showHideClusters = function(sender){
		clustersVisible = !clustersVisible;
		redrawClusters.execute();
		$(sender).find("img").attr("src",clustersVisible ? "images/radio_checked.png" : "images/radio_unchecked.png");
	},
	drawMarkers = function(){
		for(var i = 0; i < points.length; i++){
			marker = new google.maps.Marker({
		    	position: new google.maps.LatLng(points[i].pos.lat, points[i].pos.lng),
		    	map: pointsMap(),
		    	icon: getMarkerIcon(points[i]),
		    	title: points[i].name
		  	});
		  	markerPoints.push(marker);
		}
	},
	getClusterCenter = function(cluster){
		//http://stackoverflow.com/questions/9692448/how-can-you-find-the-centroid-of-a-concave-irregular-polygon-in-javascript
	   /*var twicearea=0,
	       x=0, y=0,
	       nPts = cluster.points.length,
	       p1, p2, f;
	   for (var i=0, j=nPts-1 ;i<nPts;j=i++) {
	      p1=cluster.points[i]; p2=cluster.points[j];
	      twicearea+=p1.pos.lat*p2.pos.lng;
	      twicearea-=p1.pos.lng*p2.pos.lat;
	      f=p1.pos.lat*p2.pos.lng-p2.pos.lat*p1.pos.lng;
	      x+=(p1.pos.lat+p2.pos.lat)*f;
	      y+=(p1.pos.lng+p2.pos.lng)*f;
	   }
	   f=twicearea*3;
	   return {lat: x/f,lng:y/f};
		*/
		var lats = 0,
			lngs = 0,
			centerPoint,
			resultPoint,
			bestDistance = undefined;
		for (var i = 0; i < cluster.points.length; i++) {
			lats += cluster.points[i].pos.lat;
			lngs += cluster.points[i].pos.lng;
		}
		centerPoint = new google.maps.LatLng((lats / cluster.points.length), (lngs / cluster.points.length));
		for (var i = 0; i < cluster.points.length; i++) {
			if(bestDistance == undefined || 
				google.maps.geometry.spherical.computeDistanceBetween(
					centerPoint,
					new google.maps.LatLng(cluster.points[i].pos.lat,cluster.points[i].pos.lng)
				) < bestDistance
			){
				bestDistance = google.maps.geometry.spherical.computeDistanceBetween(
					centerPoint,
					new google.maps.LatLng(cluster.points[i].pos.lat,cluster.points[i].pos.lng)
				);
				resultPoint = {lat: cluster.points[i].pos.lat, lng: cluster.points[i].pos.lng};
			}
		}
		return resultPoint;
	},
	getClusterIcon = function(cluster){
		return new google.maps.MarkerImage('images/'+primaryColor+'-cluster-big.png',
	      // Marker size
	      new google.maps.Size(32, 32),
	      // The origin for this image
	      new google.maps.Point(0,0),
	      // The anchor for this image
	      new google.maps.Point(16, 16));
	},
	getMarkerIcon = function(point){
		var color = "red";
		switch(point.category){
			case 1:
				color = "green";
				break;
			case 2:
				color = "red";
				break;
			case 3:
				color = "blue";
				break;
			case 4:
				color = "yellow";
				break;
			case 5:
				color = "pink";
				break;
			default:
				break; 
		}
		var tempImage = pointsVisible ? 'images/' + color + '-dot.png' : 'images/' + color + '-transparent-dot.png';
		return new google.maps.MarkerImage(tempImage,
	      // Marker size
	      new google.maps.Size(48, 48),
	      // The origin for this image
	      new google.maps.Point(0,0),
	      // The anchor for this image
	      new google.maps.Point(24, 48));
	},
	addRandomMarkers = function(count){
		var bounds = map.getBounds();
		var southWest = bounds.getSouthWest();
		var northEast = bounds.getNorthEast();
		var lngSpan = northEast.lng() - southWest.lng();
		var latSpan = northEast.lat() - southWest.lat();
		for (var i = 0; i < count; i++) {
		  var point = new google.maps.LatLng(southWest.lat() + latSpan * Math.random(),
		        southWest.lng() + lngSpan * Math.random());
		addMarker(point);
		}
	};

	

	/*
		type = "name of clustering algo" see switch-case
		params = {points: [], ...}
	*/
	var clustering = function(type, params){
		switch(type){
			case "DBSCAN":
			case "HIERARCHICAL":
			case "KMEANS":
				return clusteringAlgorithms[type].execute(params);
			case "5050":
				var c1 = [],
					c2 = [];
				for (var i = 0; i < params.points.length; i++) {
					if(i < (params.points.length / 2))
						c1.push(params.points[i]);
					else
						c2.push(params.points[i]);
				}
				return [{name: "50-1", points: c1}, {name: "50-2", points: c2}];
			case "NONE":
				return [];
			default: // no clustering (every point in one cluster, ALL)
				return [{name: "No Clustering", points: params.points}];
		}
	}, clusterPoints = function(type, params){
		clusters = clustering(type, params);
	};

