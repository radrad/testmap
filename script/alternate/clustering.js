var clusteringAlgorithms = {
	DBSCAN: {
		vars: {
			near: null,
			nearDeep: null,
			minPts: null,
			maxDist: null,
			clusters: null,
			counter: null
		},
		execute: function(params){
			this.performanceCheckerStart = performanceChecker.add("DBSCAN start");
			// Shorten var names
			sn = clusteringAlgorithms.DBSCAN;
			// Set vars
			sn.vars = {
				near: [],
				nearDeep: [],
				minPts: params.minPts,
				maxDist: params.maxDist,
				clusters: [],
				counter: 0
			};
			// Set point visited and noise params
			performanceChecker.start();
			for (var i = 0; i < params.points.length; i++) {
				params.points[i].visited = false;
				params.points[i].noise = false;
			}
			performanceChecker.end("Visited and Noise reset");
			for (var i = 0; i < params.points.length; i++) {
				if(!params.points[i].visited){
					params.points[i].visited = true;
					sn.vars.near = sn.getNear(params.points, params.points[i]);
					if(sn.vars.near.length < sn.vars.minPts){
						params.points[i].noise = true;
					}else{
						sn.vars.counter++;
						sn.vars.clusters.push({name: "Cluster " + sn.vars.counter, points: []});
						sn.vars.clusters[sn.vars.clusters.length - 1].points.push(params.points[i]);
						for (var j = 0; j < sn.vars.near.length; j++) {
							var skipClusterPush = false;
							if(!sn.vars.near[j].visited){
								sn.vars.near[j].visited = true;
								sn.vars.nearDeep = sn.getNear(params.points, sn.vars.near[j], sn.vars.maxDist);
								if(sn.vars.nearDeep.length >= sn.vars.minPts){
									if(!sn.pointInClusters(sn.vars.near[j]))
										sn.vars.clusters[sn.vars.clusters.length - 1].points.push(sn.vars.near[j]);
									sn.vars.near = sn.join(sn.vars.near, sn.vars.nearDeep);
									j = 0; skipClusterPush = true;
								}
							}
							if(!skipClusterPush && !sn.pointInClusters(sn.vars.near[j]))
								sn.vars.clusters[sn.vars.clusters.length - 1].points.push(sn.vars.near[j]);
						}
					}
				}
			}
			performanceChecker.add("DBSCAN end, zoom: " + map.getZoom());
			performanceChecker.display.compare(this.performanceCheckerStart);
			return sn.vars.clusters;
		},
		getNear: function(DBSCANpoints, DBSCANpoint){
			var result = [];
			for (var i = 0; i < DBSCANpoints.length; i++) {
				if(DBSCANpoints[i].name != DBSCANpoint.name){
					if(google.maps.geometry.spherical.computeDistanceBetween(getPointPosition(DBSCANpoints[i]), getPointPosition(DBSCANpoint)) <= sn.vars.maxDist){
						result.push(DBSCANpoints[i]);
					}
				}
			}
			return result;
		},
		pointInClusters: function(DBSCANpoint){
			for (var i = 0; i < sn.vars.clusters.length; i++) {
				for (var j = 0; j < sn.vars.clusters[i].points.length; j++) {
					if(sn.vars.clusters[i].points[j].name == DBSCANpoint.name)
						return true;
				};
			};
			return false;
		},
		join: function(DBSCANpoints1, DBSCANpoints2){
			return DBSCANpoints1.concat(DBSCANpoints2);
		}
	},
	HIERARCHICAL: {
		execute: function(params){
			return clusteringAlgorithms.HIERARCHICAL.convert.splittedToClusters(
				clusteringAlgorithms.HIERARCHICAL.split(
				{
					structure: clusterfck.hcluster(
						clusteringAlgorithms.HIERARCHICAL.convert.normalToSimplePoints(params.points),
						clusterfck.EUCLIDEAN_DISTANCE,
						params.linkage
					),
					depth: params.depth
				})
			);
		},
		split: function(params){ // params: {structure: hcluster, depth: int (min: 1)}
			var HIERARCHICALclusterStructure = [params.structure];
			for (var i = 0; i < params.depth; i++) {
				var HIERARCHICALnewClusterStructure = [];
				for (var j = 0; j < HIERARCHICALclusterStructure.length; j++) {
					if(HIERARCHICALclusterStructure[j].left && HIERARCHICALclusterStructure[j].right){
						HIERARCHICALnewClusterStructure.push(HIERARCHICALclusterStructure[j].left);
						HIERARCHICALnewClusterStructure.push(HIERARCHICALclusterStructure[j].right);
					}else{
						HIERARCHICALnewClusterStructure.push(HIERARCHICALclusterStructure[j]);
					}
				}
				HIERARCHICALclusterStructure = HIERARCHICALnewClusterStructure;
			}
			return HIERARCHICALclusterStructure;
		},
		convert: {
			splittedToClusters: function(hierarchy){
				var HIERARCHICALclusters = [];
				for (var i = 0; i < hierarchy.length; i++) {
					HIERARCHICALclusters.push({
						points:
							clusteringAlgorithms.HIERARCHICAL.split({
								structure: hierarchy[i],
								depth: 500 // TODO depth maximum besser
							})
					});
				}
				for (var i = 0; i < HIERARCHICALclusters.length; i++) {
					HIERARCHICALclusters[i] = {
						points: clusteringAlgorithms.HIERARCHICAL.convert.valueToNormalPoints(
							HIERARCHICALclusters[i]
						),
						name: "Cluster " + (i -(-1))
					};
				};
				return HIERARCHICALclusters;
			},
			valueToNormalPoints: function(points){
				var normalPoints = [];
				for (var i = 0; i < points.points.length; i++) {
					normalPoints.push({
						pos: {
							lat: points.points[i].value[0],
							lng: points.points[i].value[1]
						},
						name: "Converted Point " + i,
						category: 1,
						time: "2013-08-27-13-49",
						deprecated: false,
						marked: false
					});
				};
				return normalPoints;
			},
			normalToSimplePoints: function(points){
				var simplePoints = [];
				for (var i = 0; i < points.length; i++) {
					simplePoints.push([points[i].pos.lat,points[i].pos.lng]);
				}
				return simplePoints;
			},
			simpleToNormalPoints: function(points){
				var normalPoints = [];
				for (var i = 0; i < points.length; i++) {
					normalPoints.push({
						pos: {
							lat: points[i][0],
							lng: points[i][1]
						},
						name: "Converted Point " + i,
						category: 1,
						time: "2013-08-27-13-49",
						deprecated: false,
						marked: false
					});
				}
				return normalPoints;
			}
		}
	},
	KMEANS: {
		execute: function(params){
			return params.clusters == "a"
			?clusteringAlgorithms.KMEANS.convert.arraysToClusters(
				clusterfck.kmeans(
					clusteringAlgorithms.HIERARCHICAL.convert.normalToSimplePoints(params.points)
				)
			)
			:clusteringAlgorithms.KMEANS.convert.arraysToClusters(
				clusterfck.kmeans(
					clusteringAlgorithms.HIERARCHICAL.convert.normalToSimplePoints(params.points),
					params.clusters
				)
			);
		},
		convert: {
			arraysToClusters: function(arrays){
				var result = [],
					partOfResult;
				for (var i = 0; i < arrays.length; i++) {
					partOfResult = [];
					for (var j = 0; j < arrays[i].length; j++) {
						partOfResult.push({
							pos: {
								lat: arrays[i][j][0],
								lng: arrays[i][j][1]
							},
							name: "Converted Point " + (j -(-1)),
							category: 1,
							time: "2013-08-27-13-49",
							deprecated: false,
							marked: false
						});
					};
					result.push({
						points: partOfResult,
						name: "Cluster " + (i -(-1))
					});
				};
				return result;
			}
		}
	}
};