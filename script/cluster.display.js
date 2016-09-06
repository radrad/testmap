// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Drawing and displaying something on map


cluster.infoWindowContent = function(param){ // param = point
	return '<div class="infowindow">\
				<h1>'+param.get.name()+'</h1>\
				<!--<p>Preis: ' + param.get.hotel().price + '€</p>\
				<p>Sterne: ' + param.get.hotel().stars + '</p>\
				<a class="focus-button" data-target="' + param.get.name() + '"><i class="fa fa-plus" title="Dieses Hotel als Lösung markieren"></i></a>\
			--></div>';
};
cluster.mapSwitcher = { // switches maps for magnifier effect
	state: false, // switched?
	animateAlternateMap: true, // alternate map auto-movement?
	equalMapZoom: true, // set zooms between map and alternate map
	zoom: function(params){ // params: {takeCenter?, state?, zoomChange?, bounds (gmapBounds)}
		if(params.takeCenter)
			var center = cluster.map.map.getCenter();
		if(params.state){
			cluster.mapSwitcher.equalMapZoom = false;
			cluster.map.$dom.addClass("map-zoom");
			cluster.map.$dom.css(cluster.browser.zoomCSS);
			cluster.map.$dom.removeClass("map-big");
			cluster.alternateMap.$dom.removeClass("map-off");
			cluster.map.$shadow.fadeIn();
			cluster.map.map.setOptions({
				disableDefaultUI: true
			});
			cluster.browser.$menu.slideDown();
		}else{
			cluster.mapSwitcher.equalMapZoom = true;
			cluster.map.$dom.addClass("map-big");
			cluster.map.$dom.css(cluster.browser.defaultCSS);
			cluster.map.$dom.removeClass("map-zoom");
			cluster.alternateMap.$dom.addClass("map-off");
			cluster.map.$shadow.fadeOut();
			cluster.map.map.setOptions({
				disableDefaultUI: false
			});
			cluster.browser.$menu.slideUp();
		}
		google.maps.event.trigger(cluster.map.map, "resize");
		google.maps.event.trigger(cluster.alternateMap.map, "resize");
		if(params.bounds)
			cluster.map.map.setCenter(params.bounds.center);
		if(params.zoomChange)
			window.setTimeout(function(){
				var gmapBounds = new google.maps.LatLngBounds();
				gmapBounds.extend(params.bounds.sw);
				gmapBounds.extend(params.bounds.ne);
				cluster.drawing.smoothFitBounds({gmapBounds: gmapBounds, map: cluster.map.map, forceZoom: true});
			},200);
		if(params.takeCenter)
			cluster.map.map.setCenter(center);
		cluster.mapSwitcher.state = params.state;
	}
};

cluster.drawing = { // Drawing class
	redraw: function(){ // Redraw everything!
		console.log("Redraw called");
		// Check if clustering is complete
		for (var i = 0; i < cluster.points.length; i++) {
			if(cluster.points[i].get.cluster() == null){
				console.log("Redraw stopped: Need calculation first");
				console.log(cluster.points[i].get.name(),cluster.points[i].get.clusters());
				cluster.calculations.neededClustering({zoomLevel: cluster.zoomLevel.active});
				continue;
			}
		}

		// Draw points
		for (var i = 0; i < cluster.points.length; i++) {
			if(cluster.points[i].map.marker == null){ // If not yet drawn, draw a new marker
				cluster.points[i].map.marker = new MarkerWithLabel({
			    	position: cluster.points[i].get.pos(),
			    	map: cluster.map.map,
			    	icon: new google.maps.MarkerImage('images/' + cluster.colors.name + '-cluster-26.png',
				      // Marker size
				      new google.maps.Size(2,2),
				      // The origin for this image
				      new google.maps.Point(0,0),
				      // The anchor for this image
				      new google.maps.Point(1,1)
				    ),
				    tooltip: cluster.points[i].get.tooltip(),
				    name: cluster.points[i].get.name(),
					labelContent: cluster.points[i].get.centerPoints(),
					labelAnchor: cluster.points[i].get.pos(),
					labelClass: cluster.points[i].get.labelClass()
		  		});
		  		google.maps.event.addListener(cluster.points[i].map.marker, "click", function(){
		  			cluster.events.clickedPoint(this);
		  		});
			  	cluster.points[i].map.actualSize = 26;
			  	// Tooltips (mouseover)
				var tooltip = new Tooltip({map: cluster.map.map}, cluster.points[i].map.marker);
				
				google.maps.event.addListener(cluster.points[i].map.marker, 'mouseover', function() {
					try{
						log.log({type: "mouseover", object: "point", name: this.name});
					}catch(e){
						log.log({type: "logging error", catch: e});
					}
					if(cluster.infoWindow != null && cluster.infoWindow.getMap() != null && cluster.infoWindow.title == this.name){
						return;
					}
					tooltip.bindTo("text", this, "tooltip");
					tooltip.addTip();
					tooltip.getPos2(this.getPosition());
					$(tooltip.div_).css({"margin-top":cluster.helper.getTooltipMarginTop({marker: this, div: tooltip.div_})});
					var pointObject = cluster.helper.getPointByName(this.name);
					if(pointObject.map.size() == 42){ // if this is a cluster center
						cluster.polygons.objects[cluster.zoomLevel.active][pointObject.get.cluster()].polygon.setOptions({fillColor:cluster.colors.clusterHover});
					}
				});

				google.maps.event.addListener(cluster.points[i].map.marker, 'mouseout', function() {
					try{
						log.log({type: "mouseout", object: "point", name: this.name});
					}catch(e){
						log.log({type: "logging error", catch: e});
					}
					tooltip.removeTip();
					var pointObject = cluster.helper.getPointByName(this.name);
					if(pointObject.map.size() == 42){ // if this is a cluster center
						cluster.polygons.objects[cluster.zoomLevel.active][pointObject.get.cluster()].polygon.setOptions({fillColor:cluster.colors.cluster});
					}
				});
			}
			if(!cluster.points[i].map.inAnimation){ // if the marker isn't already in animation mode
				cluster.points[i].map.inAnimation = true;
				cluster.drawing.animation.point(cluster.points[i]);
			}
			// Set tooltip content:
			cluster.points[i].map.marker.tooltip = cluster.points[i].get.tooltip();


		};

		// Draw polygons
		if(cluster.dynamicAdding){
			cluster.drawing.drawPolygons();
			cluster.polygonsDrawn = false;
		}else{
			if(!cluster.polygonsDrawn){
				for (var i = 0; i <= cluster.gmapsAttr.maxZoomLevel; i++) {
					cluster.drawing.drawPolygons(i);
				}
			}
		}
	},
	drawPolygons: function(param){ // Draw polygons on map
		if(param == undefined)
			var param = cluster.zoomLevel.active;
		// If polygons are not calculated now?
		if(cluster.polygons.xy[param] == null){
			// Reset drawn stuff for this zoom level
			if(cluster.polygons.objects[param] != null){
				for (var i = 0; i < cluster.polygons.objects[param].length; i++) {
					cluster.polygons.objects[param][i].polygon.setMap(null);
				};
				cluster.polygons.objects[param] = null;
			}
			this.polygons = [];
			this.clusters = cluster.calculations.getClusterArray(param);
			for (var i = 0; i < this.clusters.length; i++) {
				this.polygons.push(cluster.calculations.concaveHull(this.clusters[i]));
			};
			cluster.polygons.xy[param] = this.polygons;
		}

		// Draw polygons
		this.xy = cluster.polygons.xy[param];
		this.polygons = cluster.polygons.objects[param];

		// If polygon level isnt already drawn somehow
		if(this.polygons == null){
			this.polygons = [];
			for (var i = 0; i < this.xy.length; i++) {
				this.polygons.push({
					polygon: new google.maps.Polygon({
					    paths: this.xy[i],
					    map: null,
					    strokeColor: '#FFFFFF',
					    strokeOpacity: 1,
					    strokeWeight: 0,
					    fillColor: cluster.colors.cluster,
					    fillOpacity: 0
					}),
					animation: {
						active: false,
						opacity: {
							is: 0,
							shouldBe: 0
						}
					},
					zoomLevel: param
				});
				google.maps.event.addListener(this.polygons[this.polygons.length - 1].polygon, "click", function(){
					cluster.events.clickedCluster(this);
				});
				google.maps.event.addListener(this.polygons[this.polygons.length - 1].polygon, "mouseover", function(){
					cluster.events.mouseoverCluster(this);
				});
				google.maps.event.addListener(this.polygons[this.polygons.length - 1].polygon, "mouseout", function(){
					cluster.events.mouseoutCluster(this);
				});
			};
			cluster.polygons.objects[param] = this.polygons;
		}

		// Change opacities of neighbor zoom levels and active zoom level (all):
		for (var i = 0; i <= cluster.gmapsAttr.maxZoomLevel; i++) {
			this.polygons = cluster.polygons.objects[i];
			if(this.polygons == null)
				continue;
			this.opacity = 0;
			if(i == cluster.zoomLevel.active)
				this.opacity = 40;
			else if(i == cluster.zoomLevel.active - 1)
				this.opacity = 16;
			//else if(i == cluster.zoomLevel.active + 1)
			//	this.opacity = 60;
			for (var j = 0; j < this.polygons.length; j++) {
				if(this.polygons[j].polygon.getMap() == null && this.opacity != 0)
					this.polygons[j].polygon.setMap(cluster.map.map);
				this.polygons[j].animation.opacity.shouldBe = this.opacity;
				if(!this.polygons[j].animation.active)
					cluster.drawing.animation.polygon(this.polygons[j]);
			};
		};
	},

	smoothFitBounds: function(params){ // zooms to a specific level or auto-calculate zoom level by polygon bounds param: {map, gmapBounds, zoomLevel, breakCondition, forceZoom}
		if(params.breakCondition != undefined && params.breakCondition.func(params.breakCondition.params))
			return;
		if(params.map == undefined)
			params.map = cluster.map.map;
		if(params.gmapBounds == undefined && params.zoomLevel == undefined)
			return;
		if(params.zoomLevel == undefined)
			params.zoomLevel = cluster.drawing.getZoomByBounds(params.map,params.gmapBounds);
		var actualZoomLevel = params.map.getZoom();
		if(params.zoomLevel == actualZoomLevel){
			if(params.forceZoom)
				params.map.setZoom(actualZoomLevel + 1);
			return;
		}
		if(!cluster.smoothZooming){
			params.map.setZoom(params.zoomLevel);
			return;
		}
		if(params.zoomLevel > actualZoomLevel)
			params.map.setZoom(actualZoomLevel + 1);
		else
			params.map.setZoom(actualZoomLevel - 1);
		window.setTimeout(function(){
			params.forceZoom = false;
			cluster.drawing.smoothFitBounds(params);
		},600);
	},
	/**
	* Returns the zoom level at which the given rectangular region fits in the map view. 
	* The zoom level is computed for the currently selected map type. 
	* @param {google.maps.Map} map
	* @param {google.maps.LatLngBounds} bounds 
	* @return {Number} zoom level
	**/

	/* This function is written by: Engineer, StackOverflow
	http://stackoverflow.com/questions/9837017/equivalent-of-getboundszoomlevel-in-gmaps-api-3
	*/
	getZoomByBounds: function( map, bounds ){ // returns perfect zoom level for polygon bounds to be shown at
	  var MAX_ZOOM = map.mapTypes.get( map.getMapTypeId() ).maxZoom || 21 ;
	  var MIN_ZOOM = map.mapTypes.get( map.getMapTypeId() ).minZoom || 0 ;

	  var ne= map.getProjection().fromLatLngToPoint( bounds.getNorthEast() );
	  var sw= map.getProjection().fromLatLngToPoint( bounds.getSouthWest() ); 

	  var worldCoordWidth = Math.abs(ne.x-sw.x);
	  var worldCoordHeight = Math.abs(ne.y-sw.y);

	  //Fit padding in pixels 
	  var FIT_PAD = 40;

	  for( var zoom = MAX_ZOOM; zoom >= MIN_ZOOM; --zoom ){ 
	      if( worldCoordWidth*(1<<zoom)+2*FIT_PAD < $(map.getDiv()).width() && 
	          worldCoordHeight*(1<<zoom)+2*FIT_PAD < $(map.getDiv()).height() )
	          return zoom;
	  }
	  return 0;
	},
	animation: { // everything that has to do with animation besides css3
		speed: 40, // execution speed, the higher the slower
		polygon: function(param){ // polygon animation
			if(param.animation.opacity.shouldBe == param.animation.opacity.is){
				param.animation.active = false;
				if(param.animation.opacity.shouldBe == 0)
					param.polygon.setMap(null);
				return;
			}
			var newOpacity = 0;
			if(param.animation.opacity.shouldBe > param.animation.opacity.is)
				newOpacity = param.animation.opacity.is + 2;
			else
				newOpacity = param.animation.opacity.is - 2;
			window.setTimeout(function(){
				param.polygon.setOptions({
					fillOpacity: newOpacity * 0.01
				});
				param.animation.opacity.is = newOpacity;
				cluster.drawing.animation.polygon(param);
			},cluster.drawing.animation.speed);
		},
		point: function(param){ // point animation
			param.map.marker.setOptions({
				labelContent: param.get.centerPoints(),
				labelAnchor: new google.maps.Point(param.get.pos()),
				labelClass: param.get.labelClass()
			});
			if(param.map.size() == param.map.actualSize){
				param.map.inAnimation = false;
				if(param.map.size() == 42 || param.map.size() == 38){
					param.map.marker.setIcon({
						url: 'images/' + cluster.colors.name + '-cluster-' + param.map.size() + '.png',
						      // Marker size
						size: new google.maps.Size(param.map.size() > 32 ? 32 : param.map.size(), param.map.size() > 32 ? 32 : param.map.size()),
						      // The origin for this image
						origin: new google.maps.Point(0,0),
						      // The anchor for this image
						anchor: new google.maps.Point((param.map.size() > 32 ? 32 : param.map.size()) / 2, (param.map.size() > 32 ? 32 : param.map.size()) / 2)
					});
				}
				return;
			}
			// NOTE:
			// Due to the fact that this animation implementation is just experimental, this part of the code is not meant to be nice or clean code.
			//
			var newSize = 0;
			if(param.map.size() < 26){
				param.map.actualSize = param.map.size();
				param.map.inAnimation = false;
				param.map.marker.setMap(null);
				return;
			}else{
				param.map.marker.setMap(cluster.map.map);
			}
			// If this is not in the visible area of the map?
			if(cluster.noPointAnimations || !cluster.map.map.getBounds().contains(param.get.pos())){
				param.map.marker.setIcon({
					url: 'images/' + cluster.colors.name + '-cluster-' + param.map.size() + '.png',
					      // Marker size
					size: new google.maps.Size(param.map.size() > 32 ? 32 : param.map.size(), param.map.size() > 32 ? 32 : param.map.size()),
					      // The origin for this image
					origin: new google.maps.Point(0,0),
					      // The anchor for this image
					anchor: new google.maps.Point((param.map.size() > 32 ? 32 : param.map.size()) / 2, (param.map.size() > 32 ? 32 : param.map.size()) / 2)
				});
				param.map.actualSize = param.map.size();
				param.map.inAnimation = false;
				return;
			}
			if(param.map.size() > param.map.actualSize)
				newSize = param.map.actualSize + 2;
			else
				newSize = param.map.actualSize - 2;
			window.setTimeout(function(){
				param.map.marker.setIcon({
					url: 'images/' + cluster.colors.name + '-cluster-' + newSize + '.png',
					      // Marker size
					size: new google.maps.Size(newSize > 32 ? 32 : newSize, newSize > 32 ? 32 : newSize),
					      // The origin for this image
					origin: new google.maps.Point(0,0),
					      // The anchor for this image
					anchor: new google.maps.Point((newSize > 32 ? 32 : newSize) / 2, (newSize > 32 ? 32 : newSize) / 2)
				});
				param.map.actualSize = newSize;
				cluster.drawing.animation.point(param);
			},cluster.drawing.animation.speed);
		}
	},
};