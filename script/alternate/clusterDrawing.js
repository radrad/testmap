var redrawClusters = {
	vars: {
		polygons: [],
		lines: [],
		markerClusters: [],
		old: {
			polygons: [],
			lines: [],
			markerClusters: []
		}
	},
	animation: {
		speed: 40,
		change: {
			pointToClusterPoint: function(params){
				params.newObj.setMap(null); // ISSUES: TODO: die punkte verschwinden dann ganz, mouseover bei 2ern
				if(params.from == params.to){
					params.obj.setMap(null);
					params.newObj.setMap(clustersMap());
					return;
				}
				if(params.from > params.to)
					params.from -= 1;
				else
					params.from += 1;
				window.setTimeout(function(){
					params.obj.setOptions({
						icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-point-transition-' + params.from + '.png',
						      // Marker size
						      new google.maps.Size(32,32),
						      // The origin for this image
						      new google.maps.Point(0,0),
						      // The anchor for this image
						      new google.maps.Point(16,16)
						    )
					});
				}, redrawClusters.animation.speed);
			},
			polygons: function(params){
				if(params.from == params.to){
					params.obj.setMap(null);
					return;
				}
				if(params.from > params.to)
					params.from -= 1;
				else
					params.from += 1;
				window.setTimeout(function(){
					params.obj.setOptions({
						fillOpacity: params.from / 100,
						strokeWeight: params.from / 5
					});
					redrawClusters.animation.change.polygons(params);
				}, redrawClusters.animation.speed);
			},
			pointCircles: function(params){
				if(params.newObj)
					params.newObj.setMap(null);
				if(params.from == params.to){
					params.obj.setMap(null);
					if(params.newObj)
						params.newObj.setMap(clustersMap())
					return;
				}
				if(params.from > params.to)
					params.from -= 2;
				else
					params.from += 2;
				window.setTimeout(function(){
					params.obj.setOptions({
						icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-' + params.from + '.png',
						      // Marker size
						      new google.maps.Size(params.from, params.from),
						      // The origin for this image
						      new google.maps.Point(0,0),
						      // The anchor for this image
						      new google.maps.Point(params.from / 2, params.from / 2)
						    )
					});
					redrawClusters.animation.change.pointCircles(params);
				}, redrawClusters.animation.speed);
			}
		},
		out: {
			polygons: function(obj){
				window.setTimeout(function(){
					redrawClusters.animation.change.polygons({obj: obj, from: 20, to: 0});
				},15 * redrawClusters.animation.speed);
			},
			markerClusters: function(obj){
				obj.setMap(null);
			},
			pointCircles: function(obj){
				for (var i = 0; i < redrawClusters.vars.polygons.length; i++) {
					for (var j = 0; j < redrawClusters.vars.polygons[i].pointCircles.length; j++) {
						if(redrawClusters.vars.polygons[i].pointCircles[j].title == obj.title){
							if(redrawClusters.vars.polygons[i].pointCircles[j].getIcon().url.indexOf("cluster-32") !== -1){
								// is now 8 pixels
								if(obj.getIcon().url.indexOf("cluster-32") != -1){
									// was 8 pixels (stays the same)
									obj.setMap(null);
									return;
								}else{
									// was 32 pixels (is now bigger)
									redrawClusters.animation.change.pointCircles({obj: obj, from: 8, to: 32, newObj: redrawClusters.vars.polygons[i].pointCircles[j]});
									return;
								}
							}else{
								// is now 32 pixels
								if(obj.getIcon().url.indexOf("cluster-8") != -1){
									// was 32 pixels (stays the same)
									obj.setMap(null);
									return;
								}else{
									// was 8 pixels (is now bigger)
									redrawClusters.animation.change.pointCircles({obj: obj, from: 32, to: 8, newObj: redrawClusters.vars.polygons[i].pointCircles[j]});
									return;
								}
							}
						}
					}
				}
				// not a new small or big point, so check if there is a cluster center now
				for (var i = 0; i < redrawClusters.vars.markerClusters.length; i++) {
					this.pos = redrawClusters.vars.markerClusters[i].getPosition();
					if(this.pos.lat() == obj.getPosition().lat() && this.pos.lng() == obj.getPosition().lng()){
						redrawClusters.animation.change.pointToClusterPoint({obj: obj, from: 0, to: 4, newObj: redrawClusters.vars.markerClusters[i]});
					}
				}
				// no cluster center, no big or small point, must be close to another cluster center
				redrawClusters.animation.change.pointCircles({obj: obj, from: 32, to: 2});
			}
		}
	},
	prepareUndraw: function(){
		// Reset vars:
		redrawClusters.vars = {
			lines: [],
			markerClusters: [],
			polygons: [],
			old: {
				lines: redrawClusters.vars.lines,
				markerClusters: redrawClusters.vars.markerClusters,
				polygons: redrawClusters.vars.polygons
			}
		};
	},
	undraw: function(){

		// Undraw on map:
		for (var i = 0; i < redrawClusters.vars.old.lines.length; i++) {
			redrawClusters.vars.old.lines[i].setMap(null);
		};
		for (var i = 0; i < redrawClusters.vars.old.markerClusters.length; i++) {
			redrawClusters.animation.out.markerClusters(redrawClusters.vars.old.markerClusters[i]);
		};
		for (var i = 0; i < redrawClusters.vars.old.polygons.length; i++) {
			for (var j = 0; j < redrawClusters.vars.old.polygons[i].pointCircles.length; j++) {
				redrawClusters.animation.out.pointCircles(redrawClusters.vars.old.polygons[i].pointCircles[j]);
			}
			redrawClusters.animation.out.polygons(redrawClusters.vars.old.polygons[i]);
		}
	},
	execute: function(){
		redrawClusters.prepareUndraw();
		for(var i = 0; i < clusters.length; i++){
			// POLYGON
			this.polygon = new google.maps.Polygon({
			    paths: getClusterConcaveHull(clusters[i]),
			    map: clustersMap(),
			    name: clusters[i].name,
			    strokeColor: '#FFFFFF',
			    strokeOpacity: 0,
			    strokeWeight: 0,
			    fillColor: '#57A1FF',
			    fillOpacity: 0.2
			});

			// CLUSTER CENTER CALCULATION (not for single point clusters)
			if(clusters[i].points.length != 1){
				this.center = getClusterCenter(clusters[i]);
				this.marker = new google.maps.Marker({
			    	position: new google.maps.LatLng(this.center.lat, this.center.lng),
			    	map: clustersMap(),
			    	icon: getClusterIcon(clusters[i]),
			    	title: clusters[i].name
			  	});
			  	this.marker.polygon = this.polygon;
			  	clusters[i].icon = this.marker;
			  	redrawClusters.vars.markerClusters.push(this.marker);
			}


			// LINES AND POINT CIRCLES
			this.pointCircles = [];
			for (var j = 0; j < clusters[i].points.length; j++) {
				if(clusters[i].icon){
					this.line = new google.maps.Polyline({
					    path: [clusters[i].icon.getPosition(), getPointPosition(clusters[i].points[j])],
					    strokeColor: '#57A1FF',
					    strokeOpacity: 0.4,
					    strokeWeight: 1,
					    map: map
					});
				redrawClusters.vars.lines.push(this.line);
				}
				if(clusters[i].points.length == 1){
					this.pointCircle = new google.maps.Marker({
				    	position: getPointPosition(clusters[i].points[j]),
				    	map: clustersMap(),
				    	icon: new google.maps.MarkerImage('images/' + primaryColor + '-cluster-32.png',
					      // Marker size
					      new google.maps.Size(32, 32),
					      // The origin for this image
					      new google.maps.Point(0,0),
					      // The anchor for this image
					      new google.maps.Point(16, 16)
					    ),
				    	title: clusters[i].points[j].name
			  		});
			  		this.pointCircle.polygon = this.polygon;
				    this.pointCircles.push(this.pointCircle);
				}
			    else{
			    	if(google.maps.geometry.spherical.computeDistanceBetween(
			    		getPointPosition(clusters[i].points[j]),
			    		clusters[i].icon.getPosition()) > getMapDist() * 0.6){
					    this.pointCircle = new google.maps.Marker({
					    	position: getPointPosition(clusters[i].points[j]),
					    	map: clustersMap(),
					    	icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-8.png',
						      // Marker size
						      new google.maps.Size(8, 8),
						      // The origin for this image
						      new google.maps.Point(0,0),
						      // The anchor for this image
						      new google.maps.Point(4, 4)
						    ),
					    	title: clusters[i].points[j].name
					  	});
						this.pointCircle.polygon = this.polygon;
			    		this.pointCircles.push(this.pointCircle);
					}
				}
			}

			// SAVINGS
			this.polygon.pointCircles = this.pointCircles;
			redrawClusters.vars.polygons.push(this.polygon);

			// EVENTS
			google.maps.event.addListener(this.polygon, 'mouseover', function(){
				this.setOptions({
					fillOpacity: 0.3
				});
			});
			google.maps.event.addListener(this.polygon, 'mouseout', function(){
				this.setOptions({
					fillOpacity: 0.2
				});
			});
			google.maps.event.addListener(this.marker, 'mouseover', function() {
					this.setOptions({icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-big-hover.png',
							      // Marker size
							      new google.maps.Size(32, 32),
							      // The origin for this image
							      new google.maps.Point(0,0),
							      // The anchor for this image
							      new google.maps.Point(16, 16)
							    )});
				    this.polygon.setOptions({
				    	fillOpacity: 0.3
				    });
				});
			google.maps.event.addListener(this.marker, 'mouseout', function() {
				this.setOptions({icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-big.png',
						      // Marker size
						      new google.maps.Size(32, 32),
						      // The origin for this image
						      new google.maps.Point(0,0),
						      // The anchor for this image
						      new google.maps.Point(16, 16)
						    )});
			    this.polygon.setOptions({
			    	fillOpacity: 0.2
			    });
			});
			for (var j = 0; j < this.polygon.pointCircles.length; j++) {
				if(this.polygon.pointCircles.length == 1){
					google.maps.event.addListener(this.polygon.pointCircles[j], 'mouseover', function() {
					    this.setOptions({icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-32-hover.png',
							      // Marker size
							      new google.maps.Size(32, 32),
							      // The origin for this image
							      new google.maps.Point(0,0),
							      // The anchor for this image
							      new google.maps.Point(16, 16)
							    )});
					});
					google.maps.event.addListener(this.polygon.pointCircles[j], 'mouseout', function() {
					    	this.setOptions({icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-32.png',
							      // Marker size
							      new google.maps.Size(32, 32),
							      // The origin for this image
							      new google.maps.Point(0,0),
							      // The anchor for this image
							      new google.maps.Point(16, 16)
							    )});
					});
				}
				else{
					google.maps.event.addListener(this.polygon.pointCircles[j], 'mouseover', function() {
					    this.setOptions({icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-16-hover.png',
							      // Marker size
							      new google.maps.Size(16, 16),
							      // The origin for this image
							      new google.maps.Point(0,0),
							      // The anchor for this image
							      new google.maps.Point(8, 8)
							    )});
					    this.polygon.setOptions({
					    	fillOpacity: 0.3
					    });
					});
					google.maps.event.addListener(this.polygon.pointCircles[j], 'mouseout', function() {
					    	this.setOptions({icon: new google.maps.MarkerImage('images/'+primaryColor+'-cluster-8.png',
							      // Marker size
							      new google.maps.Size(8, 8),
							      // The origin for this image
							      new google.maps.Point(0,0),
							      // The anchor for this image
							      new google.maps.Point(4, 4)
							    )});
					    this.polygon.setOptions({
					    	fillOpacity: 0.2
					    });
					});
				}
				google.maps.event.addListener(this.polygon.pointCircles[j], 'click', function() {
					map.panTo(this.getPosition());
					map.setZoom(map.getZoom()+1);
					this.polygon.setOptions({
						strokeOpacity: 1,
						strokeWeight: 4
					});
				});
			};
			google.maps.event.addListener(this.polygon, 'click', function(){
				var bounds = getBoundsOfPolygon(this);
				//map.panToBounds(new google.maps.LatLngBounds(bounds.sw, bounds.ne));
				map.panTo(bounds.center);
				map.setZoom(map.getZoom()+1);
				this.setOptions({
					strokeOpacity: 1,
					strokeWeight: 4
				});
			});
			if(clusters[i].icon){
				google.maps.event.addListener(clusters[i].icon, 'click', function(){
					map.panTo(this.getPosition());
					map.setZoom(map.getZoom()+1);
					this.polygon.setOptions({
						strokeOpacity: 1,
						strokeWeight: 4
					});
				});
			}
		}
		redrawClusters.undraw();
	}
}