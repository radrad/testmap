// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Point class

cluster.Point = function(params){ // point object, create by params: {pos, name, private: {clusters,isCenter,centerPoints,isNearCenter,isMediumCluster,hotel}}
	var private = { // private vars
		clusters: [], // cluster ids this point belongs to
		pos: params.pos, // position on map
		name: params.name, // point name
		isCenter: [], // is this a center point in some zoom levels?
		centerPoints: [], // if this is a center point, how many points are in this cluster?
		isNearCenter: [], // is this point close to another center point?
		isMediumCluster: [], // is this a medium clusters center point?
		hotel: { // hotel data for evaluation
			price: null,
			stars: null
		}
	};
	if(params.private){ // set private vars from param
		private.clusters = params.private.clusters;
		private.isCenter = params.private.isCenter;
		private.centerPoints = params.private.centerPoints;
		private.isNearCenter = params.private.isNearCenter;
		private.isMediumCluster = params.private.isMediumCluster;
		private.hotel = params.private.hotel;
	}
	var privateFunctions = { // private functions
		getSize: function(param){ // gets the points size that should be drawn, param: zoomLevel, default: active
			if(cluster.clusteringAlg != 2) // if own clustering is not used
				return 32; // Single point
			if(param == undefined) // is a zoom level not given?
				param = cluster.zoomLevel.active; // take actual
			if(private.clusters[param] == -1) // if its not part of a cluser
				return 32; // Single point
			else if(private.isCenter[param]) // if its a center point
				return 42; // Cluster center point
			else if(private.isNearCenter[param]) // if its near a center point
				return 24; // Near cluster center point
			else if(private.isMediumCluster[param]) // if its a medium cluster
				return 38; // Medium cluster point
			else if(private.clusters[param] == -2) // if this is marked as "not important"
				return 24; // Not important
			else // otherwise it must be...
				return cluster.showSmallPoints ? 8 : 0; // ...a normal Point in cluster
		}
	}

	this.map = { // public functions that have to do with map interaction
		marker: null, // google maps marker
		label: null, // label container
		actualSize: null, // Actual size, not the size that it SHOULD have (for animation)
		size: function(param){ // returns size of point in param zoomLevel (default: active zoom level)
			return privateFunctions.getSize(param);
		},
		drawSize: function(param){ // returns drawing size, param = zoomLevel, default: active
			var size = privateFunctions.getSize();
			if(size == 42 || size == 38)
				return size + (private.centerPoints[param] >= 50 ? "-high" : private.centerPoints[param] >= 20 ? "" : "-low");
			return size;
		},
		inAnimation: false, // is this point in animation at the moment?
		setCenter: function(params){ // sets the center point of a cluster, params: {val, zoomLevel}
			private.isCenter[params.zoomLevel] = params.val;
			if(params.points != undefined)
				private.centerPoints[params.zoomLevel] = params.points; // number of points in this cluster
		},
		setNearCenter: function(params) { // sets point as a near-cluster-center point, params: {val, zoomLevel}
			private.isNearCenter[params.zoomLevel] = params.val;
		},
		setMediumCluster: function(params){ // set point as medium cluster center, params: {val, zoomLevel}
			private.isMediumCluster[params.zoomLevel] = params.val;
			private.centerPoints[params.zoomLevel] = private.centerPoints[params.zoomLevel + 1]; // number of points in this mediumcluster is number of points in previous cluster
		}
	}

	this.get = { // Public getters
		cluster: function(param){ // gets param zoomLevels cluster
			if(param == undefined){
				var param = cluster.zoomLevel.active;
			}
			return cluster.clusteringAlg == 2 ? private.clusters[param] : -1;
		},
		clusters: function(){ // returns all clusters for all zoom levels for this point
			return private.clusters;
		},
		pos: function(){ // returns position of point
			return private.pos;
		},
		name: function(){ // returns name of point
			return private.name;
		},
		centerPoints: function(param){ // returns amount of points in cluster if this is a center point
			if(param == undefined){
				var param = cluster.zoomLevel.active;
			}
			return private.centerPoints[param] != undefined && private.centerPoints[param] != null ? private.centerPoints[param] : 1;
		},
		tooltip: function(){ // returns tooltip for this point
			if(cluster.clusteringAlg != 2)
				return private.name;
			if(private.isCenter[cluster.zoomLevel.active])
				return "<i>" + private.centerPoints[cluster.zoomLevel.active] + "</i>hotels in<br>cluster";
			if(private.isMediumCluster[cluster.zoomLevel.active]){
				return "<i>" + private.centerPoints[cluster.zoomLevel.active] + "</i>of them in<br>this area";
			}
			return private.name;
		},
		private: function(){ // returns all the vars of this point
			return private;
		},
		hotel: function(){ // returns hotel information of this point
			return private.hotel;
		},
		labelClass: function(param){ // returns suitable label class for this point (size), param: zoomLevel, default: active
			if(param == undefined){
				var param = cluster.zoomLevel.active;
			}
			var result = "";
			var size = privateFunctions.getSize();
			switch(size){
				case 42:
					result = "label";
					break;
				case 38:
					result = "label-small"
					break;
				default:
					return "hidden";
			}
			return result + (private.centerPoints[param] >= 50 ? " label-high" : private.centerPoints[param] >= 20 ? " label-medium" : " label-low");
		}
	}
	this.set = { // Public setters
		cluster: function(params){ // set cluster id for specific zoom level, params: {clusterId, zoomLevel}
			private.clusters[params.zoomLevel] = params.clusterId;
		},
		pos: function(param){ // sets point position
			private.pos = param;
		},
		name: function(param){ // sets point name
			private.name = param;
		},
		private: function(param){ // sets all vars for this point
			private = param;
		},
		hotel: function(param){ // sets hotel data for this point
			private.hotel = param;
		}
	}
};