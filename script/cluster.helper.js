// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Helper functions

cluster.helper = { // Helper functions
	getMarkers: function(){ // get all google map marker objects for all points
		var markers = [];
		for (var i = 0; i < cluster.points.length; i++) {
			markers.push(cluster.points[i].map.marker);
		}
		return markers;
	},
	getPointByName: function(param){ // get a point object by its name attribute
		for (var i = 0; i < cluster.points.length; i++) {
			if(cluster.points[i].get.name() == param)
				return cluster.points[i];
		};
		return null;
	},
	getTooltipMarginTop: function(params){ // get perfect tooltip margin, Params: marker, div
		var tooltipHeight = $(params.div).height(),
			pointHeight = params.marker.getIcon().size.height;
		if(pointHeight == 8)
			return "-45px";
		if(pointHeight == 16) 
			return "-72px";
		return - (tooltipHeight + 10 + pointHeight) + "px"; 
	},
	overlayView: null, // Overlay-View, google maps api v3 feature to overlay information
	getPixelCoords: function(param){ // get pixel coords for overlay-view
		if(cluster.helper.overlayView == null){
			cluster.helper.overlayView = new google.maps.OverlayView();
			cluster.helper.overlayView.draw = function() {};
			cluster.helper.overlayView.setMap(cluster.map.map);
		}
		return cluster.helper.overlayView.getProjection().fromLatLngToContainerPixel(param); 
	},
	setHotelData: function(){ // for evaluation: sets random hotel data for all hotels
		var price = {
			min: 60,
			max: 230
		},	stars = {
			min: 0,
			max: 5
		};
		for(var i = 0; i < cluster.points.length; i++){
			cluster.points[i].set.hotel({
				price:  Math.floor(Math.random() * (price.max - price.min + 1) + price.min),
				stars: Math.floor(Math.random() * (stars.max - stars.min + 1) + stars.min)
			});
		}
	},
	getPointByPolygon: function(param){ // returns point object of given polygon param
		for (var i = 0; i < cluster.points.length; i++) {
			if(cluster.points[i].get.cluster() < 0)
				continue;
			if(cluster.polygons.objects[cluster.zoomLevel.active][cluster.points[i].get.cluster()].polygon.getPath() == param.getPath())
				return cluster.points[i];
		};
		return null;
	}
};