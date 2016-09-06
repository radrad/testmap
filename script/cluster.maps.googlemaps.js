// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Map-APIs, Google Maps API V3


cluster.gmapsAttr = { // google maps attributes
	maxZoomLevel: 15 // Closest allowed zoom level
};

cluster.maxDist = { // max distance for two points to be too close to each other, per zoom level
	calculate: function(param){ // max distance between points, param = zoomLevel (default: active zoom level)
		if(param == undefined)
			param = cluster.zoomLevel.active;
		switch(param){ // values for google maps api v3
			case 15:
				return 0;
			case 14:
				return 205;
			case 13:
				return 370;
			case 12:
				return 820;
			case 11:
				return 1600;
			case 10:
				return 3200;
			case 9:
				return 5600;
			case 8:
				return 15000;
			case 7:
				return 25000;
			case 6:
				return 52000;
			case 5:
				return 87000;
			case 4:
				return 220000;
			case 3:
				return 420000;
			case 2:
				return 1100000;
			case 1:
				return 1900000;
			case 0:
				return 3300000;
			default:
				return 0;
		}
	}
};