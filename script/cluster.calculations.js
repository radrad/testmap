// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Clustering calculations, DBSCAN implementation, polygon and center point calculation


cluster.calculations = { // Everything that has to do with calculation
	gmapsBoundsToSquarePath: function(gmapBounds){ // convertes params gmapBounds to simple box latlngs
		var ne = gmapBounds.getNorthEast(),
			sw = gmapBounds.getSouthWest();
		return [
			new google.maps.LatLng(ne.lat(), sw.lng()),
			ne,
			new google.maps.LatLng(sw.lat(), ne.lng()),
			sw
		];
	},
	getBoundsOfPolygon: function(params){ // returns the bounds of a polygon,  params = {polygon: .. OR points: ...}
		var north,
			west,
			east,
			south,
			lat,
			lng,
			path = params.polygon != null ? params.polygon.getPath().getArray() : params.points;
		for (var i = 0; i < path.length; i++) {
			lat = params.polygon != null ? path[i].lat() : path[i].get.pos().lat();
			lng = params.polygon != null ? path[i].lng() : path[i].get.pos().lng();
			if(north == null || north > lat)
				north = lat;
			if(west == null || west < lng)
				west = lng;
			if(east == null || east > lng)
				east = lng;
			if(south == null || south < lat)
				south = lat;
		};
		return {sw: new google.maps.LatLng(south, west), ne: new google.maps.LatLng(north, east), center: new google.maps.LatLng((south+north) / 2, (west+east) / 2)};
	},
	concaveHull: function(param){ // returns nearly concave hull
		this.xyPoints = [];
		this.firstResult = [];
		this.result = [];
		
		// get CONVEX hull via "GrahamScan":
		for (var i = 0; i < param.length; i++) {
			this.xyPoints.push({x: param[i].get.pos().lat(), y: param[i].get.pos().lng()});
		}
		this.xyPoints = GrahamScan.execute(this.xyPoints);

		for (var i = 0; i < this.xyPoints.length; i++) {
			this.firstResult.push(new google.maps.LatLng(this.xyPoints[i].x, this.xyPoints[i].y));
		}

		// Calculate average distances
		var distances = 0;
		for (var i = 0; i < this.firstResult.length; i++) {
			if(i < this.firstResult.length - 1)
				distances += google.maps.geometry.spherical.computeDistanceBetween(this.firstResult[i], this.firstResult[i+1]);
		}

		distances = distances / (this.firstResult.length - 1);

		for (var i = 0; i < this.firstResult.length; i++) {
			this.result.push(this.firstResult[i]);
			if(i < this.firstResult.length - 1){
				if(distances < google.maps.geometry.spherical.computeDistanceBetween(this.firstResult[i], this.firstResult[i+1])){
					var newPoint = new google.maps.LatLng(
						(this.firstResult[i].lat() + this.firstResult[i+1].lat()) / 2,
						(this.firstResult[i].lng() + this.firstResult[i+1].lng()) / 2
					);
					var closestPoint = null,
						closestDistance = null;
					for (var j = 0; j < param.length; j++) {
						if(closestDistance == null || closestDistance > google.maps.geometry.spherical.computeDistanceBetween(
							newPoint,
							param[j].get.pos()
						)){
							closestPoint = param[j];
							closestDistance = google.maps.geometry.spherical.computeDistanceBetween(newPoint,param[j].get.pos());
						}
					}
					this.result.push(closestPoint.get.pos());
				}
			}
		}
		return this.result;
	},
	sortPointsByClusterAndSize: function(param){ // sort point objects by cluster and size. needs a few less operations in cluster calculation part, param = zoomLevel
		cluster.points.sort(function(a,b){
			this.aCluster = a.get.cluster(param);
			this.bCluster = b.get.cluster(param);
			if(this.aCluster < this.bCluster)
				return -1;
			if(this.aCluster > this.bCluster)
				return 1;
			this.aSize = a.map.size(param);
			this.bSize = b.map.size(param);
			if(this.aSize > this.bSize)
				return -1;
			if(this.aSize < this.bSize)
				return 1;
			return 0;
		});
	},
	neededClustering: function(params){ // cluster all unclustered zoom levels deeper than params.zoomLevel
		try{
			log.log({type: "action", description: "needed clustering called", params: params});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
  		for (var i = cluster.gmapsAttr.maxZoomLevel; i >= params.zoomLevel; i--) {
  			for(var j = 0; j < cluster.points.length; j++){
  				if(cluster.points[j].get.cluster(i) == null){
		  			cluster.calculations.clustering({zoomLevel: i});
		  			console.log("Clustering (needed deep called), Level " + i);
  				}
  			}
  		}
	},
	deepClustering: function(){ // cluster ALL zoom levels
		try{
			log.log({type: "action", description: "deep clustering called"});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
  		for (var i = cluster.gmapsAttr.maxZoomLevel; i >= 0; i--) {
  			console.log("Clustering (deep called), Level " + i);
  			cluster.calculations.clustering({zoomLevel: i});
  		}
	},
	clustering: function(params){ // cluster zoom level. params: {zoomLevel}
		try{
			log.log({type: "action", description: "clustering called", params: params});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		console.log("Clustering calculation called");
		this.performanceCheckerStart = performanceChecker.add("DBSCAN start");
		if(params == undefined)
			params = {zoomLevel: cluster.zoomLevel.active};
		if(params.zoomLevel == undefined)
			params.zoomLevel = cluster.zoomLevel.active;

		// Reset clustering for this zoom level for all points
		for (var i = 0; i < cluster.points.length; i++) {
			cluster.points[i].set.cluster({zoomLevel: params.zoomLevel, clusterId: null});
			cluster.points[i].map.setMediumCluster({zoomLevel: params.zoomLevel, val: false});
		}
		// Vars
		var private = {
			near: [], 
			nearDeep: [],
			clusterId: -1,
			getNear: function(param){ // get points near param-given point
				cluster.maxDist.value = cluster.maxDist.calculate(params.zoomLevel);
				var result = [];
				for (var i = 0; i < cluster.points.length; i++) {
					if(cluster.points[i].get.name() == param.get.name())
						continue;
					if(google.maps.geometry.spherical.computeDistanceBetween(cluster.points[i].get.pos(), param.get.pos()) <= cluster.maxDist.value){
						result.push(cluster.points[i]);
					}
				}
				return result;
			}
		}
		// CLUSTERING ALGORITHM
		// Calculation algorithm based on DBSCAN

		// Pre-sort points, needs a few less iterations in further process then
		if(params.zoomLevel != cluster.gmapsAttr.maxZoomLevel){
			cluster.calculations.sortPointsByClusterAndSize(params.zoomLevel + 1);
		}

		// iterate points
		for (var i = 0; i < cluster.points.length; i++) {
			// Already visited?
			if(cluster.points[i].get.cluster(params.zoomLevel) != null)
				continue; // continue with next point

			// Get points that are near this one
			private.near = private.getNear(cluster.points[i]);

			// No points near this one? Make it NOISE
			if(private.near.length < cluster.minPts){
				cluster.points[i].set.cluster({zoomLevel: params.zoomLevel, clusterId: -1});
				continue; // continue with next point
			}

			// A new cluster has to be created now. Increase clusterId
			private.clusterId++;

			// Set clusterId for point and for all other points in this cluster
			cluster.points[i].set.cluster({zoomLevel: params.zoomLevel, clusterId: private.clusterId});
			for (var j = 0; j < private.near.length; j++) {
				private.skip = false;
				if(private.near[j].get.cluster(params.zoomLevel) != null) // if a point already has a cluster here
					continue; // continue with next point in line

				private.near[j].set.cluster({zoomLevel: params.zoomLevel, clusterId: private.clusterId});

				// Points near the points that are near the point that has had near points at the beginning...
				private.nearDeep = private.getNear(private.near[j]);
				if(private.nearDeep.length >= cluster.minPts){ // if there are enough of them
					private.near = private.near.concat(private.nearDeep);
					j = 0; // restart iteration of near points, there are now more points in here
					continue; //continue with first point in line again
				}
			}
		}

		// Split large clusters
		// seperated by lng and lat (experimental code, copy paste)

		// LONGITUDE
		this.clusters = cluster.calculations.getClusterArray(params.zoomLevel);
		this.maxDist = cluster.maxDist.calculate(params.zoomLevel) / 15000;
		for (var i = 0; i < this.clusters.length; i++) {
			this.bounds = cluster.calculations.getBoundsOfPolygon({points:this.clusters[i]});
			try{
				this.splits = Math.ceil((this.bounds.sw.lng() - this.bounds.ne.lng()) / this.maxDist);
			}catch(e){continue;} // if points have equal positions
			if(this.splits > 1){
				this.splitSize = (this.bounds.sw.lng() - this.bounds.ne.lng()) / this.splits;
				this.lngLimit = this.bounds.ne.lng() + this.splitSize; // half the cluster
				for (var j = 0; j < this.clusters[i].length; j++) {
					this.lng = this.clusters[i][j].get.pos().lng();
					if(this.lng > this.lngLimit && this.lng != this.bounds.ne.lng())
						this.clusters[i][j].set.cluster({zoomLevel: params.zoomLevel, clusterId: this.clusters.length + Math.ceil((this.lng - this.bounds.ne.lng()) / this.splitSize) - 2});
				};
			}
			this.clusters = cluster.calculations.getClusterArray(params.zoomLevel);
		};

		// LATITUDE
		this.clusters = cluster.calculations.getClusterArray(params.zoomLevel);
		this.maxDist = cluster.maxDist.calculate(params.zoomLevel) / 15000;
		for (var i = 0; i < this.clusters.length; i++) {
			this.bounds = cluster.calculations.getBoundsOfPolygon({points:this.clusters[i]});
			try{
				this.splits = Math.ceil((this.bounds.sw.lat() - this.bounds.ne.lat()) / this.maxDist);
			}catch(e){continue;} // if points have equal positions
			if(this.splits > 1){
				this.splitSize = (this.bounds.sw.lat() - this.bounds.ne.lat()) / this.splits;
				this.latLimit = this.bounds.ne.lat() + this.splitSize; // half the cluster
				for (var j = 0; j < this.clusters[i].length; j++) {
					this.lat = this.clusters[i][j].get.pos().lat();
					if(this.lat > this.latLimit && this.lat != this.bounds.ne.lat())
						this.clusters[i][j].set.cluster({zoomLevel: params.zoomLevel, clusterId: this.clusters.length + Math.ceil((this.lat - this.bounds.ne.lat()) / this.splitSize) - 2});
				};
			}
			this.clusters = cluster.calculations.getClusterArray(params.zoomLevel);
		};

		// Set Medium-Clusters (Subclusters)
		if(params.zoomLevel != cluster.gmapsAttr.maxZoomLevel){
			for (var i = 0; i < cluster.points.length; i++) {
				if(cluster.points[i].map.size(params.zoomLevel + 1) == 42 && cluster.points[i].map.size(params.zoomLevel) < 32){
					cluster.points[i].map.setMediumCluster({zoomLevel: params.zoomLevel, val: true});
				}
			};
		}

		// Performance checking
		performanceChecker.add("DBSCAN end, zoom: " + params.zoomLevel);
		performanceChecker.display.compare(this.performanceCheckerStart);

		// Reset polygons
		cluster.polygons.xy[params.zoomLevel] = null;

		// Calculate cluster centers
		cluster.calculations.setClusterCenters(params.zoomLevel);

		// If redrawing is needed
		if(params.redraw)
			cluster.drawing.redraw();
	},
	setClusterCenters: function(param){ // Sets cluster centers, param = zoomLevel (default: active zoom level)
		if(param == undefined)
			param = cluster.zoomLevel.active;
		console.log("Calculate cluster centers for zoom level " + param);
		// Unset all centers
		for (var i = 0; i < cluster.points.length; i++) {
			cluster.points[i].map.setCenter({zoomLevel: param, val: false});
			cluster.points[i].map.setNearCenter({zoomLevel: param, val: false});
		}

		this.clusters = cluster.calculations.getClusterArray(param);
		for (var i = 0; i < this.clusters.length; i++) {
			this.lats = 0;
			this.lngs = 0;
			this.bestDistance = undefined;
			for (var j = 0; j < this.clusters[i].length; j++) {
				this.lats += this.clusters[i][j].get.pos().lat();
				this.lngs += this.clusters[i][j].get.pos().lng();
			}
			this.centerPoint = new google.maps.LatLng((this.lats / this.clusters[i].length), (this.lngs / this.clusters[i].length));
			this.resultPoint = null;
			for (var j = 0; j < this.clusters[i].length; j++) {
				if(param != cluster.gmapsAttr.maxZoomLevel && this.clusters[i][j].map.size(param + 1) < 42){ // if there are deeper zoom levels available and this is not a cluster center point in a deeper zoom level
					continue;
				}
				if(this.bestDistance == undefined || 
					google.maps.geometry.spherical.computeDistanceBetween(
						this.centerPoint,
						new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
					) < this.bestDistance){
					this.bestDistance = google.maps.geometry.spherical.computeDistanceBetween(
						this.centerPoint,
						new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
					);
					this.resultPoint = this.clusters[i][j];
				}
			}

			// Search for suitable points in previous zoom level. experimental code, copy paste

			if(this.resultPoint == null){ // if there is no cluster center available to use, find a medium cluster instead
				for (var j = 0; j < this.clusters[i].length; j++) {
					if(param != cluster.gmapsAttr.maxZoomLevel && this.clusters[i][j].map.size(param + 1) < 38){ // if there are deeper zoom levels available and this is not a cluster center point in a deeper zoom level
						continue;
					}
					if(this.bestDistance == undefined || 
						google.maps.geometry.spherical.computeDistanceBetween(
							this.centerPoint,
							new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
						) < this.bestDistance){
						this.bestDistance = google.maps.geometry.spherical.computeDistanceBetween(
							this.centerPoint,
							new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
						);
						this.resultPoint = this.clusters[i][j];
					}
				}
			}
			if(this.resultPoint == null){ // if there is no cluster center available to use, find a normal point instead:
				for (var j = 0; j < this.clusters[i].length; j++) {
					if(param != cluster.gmapsAttr.maxZoomLevel && this.clusters[i][j].map.size(param + 1) < 32){ // if there are deeper zoom levels available and this is not a normal point in a deeper zoom level
						continue;
					}
					if(this.bestDistance == undefined || 
						google.maps.geometry.spherical.computeDistanceBetween(
							this.centerPoint,
							new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
						) < this.bestDistance){
						this.bestDistance = google.maps.geometry.spherical.computeDistanceBetween(
							this.centerPoint,
							new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
						);
						this.resultPoint = this.clusters[i][j];
					}
				}
			}
			if(this.resultPoint == null){ // if still not found any, take the nearest, no matter what kind of point it is
				for (var j = 0; j < this.clusters[i].length; j++) {
					if(this.bestDistance == undefined || 
						google.maps.geometry.spherical.computeDistanceBetween(
							this.centerPoint,
							new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
						) < this.bestDistance){
						this.bestDistance = google.maps.geometry.spherical.computeDistanceBetween(
							this.centerPoint,
							new google.maps.LatLng(this.clusters[i][j].get.pos().lat(),this.clusters[i][j].get.pos().lng())
						);
						this.resultPoint = this.clusters[i][j];
					}
				}
			}

			this.resultPoint.map.setCenter({zoomLevel: param, val: true, points: this.clusters[i].length});

			// Set points near center point to invisible so they wont get too close
			for (var j = 0; j < this.clusters[i].length; j++) {
				if(
					this.clusters[i][j].get.name() != this.resultPoint.get.name() && 
					google.maps.geometry.spherical.computeDistanceBetween(
						this.clusters[i][j].get.pos(),
						this.resultPoint.get.pos()
					) < cluster.maxDist.calculate(param) * 0.65
				){
					this.clusters[i][j].map.setNearCenter({zoomLevel: param, val: true});
				}
			};
		}
	},
	getClusterArray: function(param){ // Gets all points that are in clusters as an array of clusters, param = zoomLevel, default: actual zoom level
		if(param == undefined)
			param = cluster.zoomLevel.active;
		this.clusters = [];
		for (var i = 0; i < cluster.points.length; i++) {
			if(cluster.points[i].get.cluster(param) == null)
				continue;
			if(this.clusters[cluster.points[i].get.cluster(param)] == undefined)
				this.clusters[cluster.points[i].get.cluster(param)] = [];
			this.clusters[cluster.points[i].get.cluster(param)].push(cluster.points[i]);
		}
		return this.clusters;
	}
};