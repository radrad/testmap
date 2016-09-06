$(document).ready(function() {
	//cluster.initialize(2);
	cluster.evaluation.initialize();
});


var log = { // For evaluation logging
	log: function(param){
		log.data.push({
			time: new Date(),
			event: param
		});
		//console.log("Evaluation data logging",JSON.stringify(log.data[log.data.length - 1]));
		if(log.data.length >= 1000 || param.forceSave){
			localStorage.setItem("cluster.evaluation." + log.lsCounter, JSON.stringify(log.data));
			log.lsCounter++;
			log.data = [];
			log.log({type:"log-save"});
		}
	},
	data: [],
	lsCounter: 0,
	show: function(){
		var id = 0;
		for (var i = 0; i < log.lsCounter; i++) {
			var dataSet = JSON.parse(localStorage.getItem("cluster.evaluation." + i));
			for (var j = 0; j < dataSet.length; j++) {
				console.log("Evaluation log",id,JSON.stringify(dataSet[j]));
				id++;
			};
		};
		for(var i = 0; i < log.data.length; i++){
				console.log("Evaluation log",id,JSON.stringify(log.data[i]));
				id++;
		}
	},
	save: function(){
		var logs = [];
		for (var i = 0; i < log.lsCounter; i++) {
			var dataSet = JSON.parse(localStorage.getItem("cluster.evaluation." + i));
			for (var j = 0; j < dataSet.length; j++) {
				logs.push(dataSet[j]);
			};
		};
		for(var i = 0; i < log.data.length; i++){
				logs.push(log.data[i]);
		}
		$("textarea").val(JSON.stringify(logs));
		cluster.evaluation.ended = true;
		document.evaluationForm.submit();
	},
	leaving: function(){
		log.log({type: "action", description: "trying to leave site", forceSave: true});
		if(cluster.evaluation.ended)
			return;
		return "Sie sind im Begriff diese Seite zu verlassen. Bitte verlassen Sie diese Seite nur, wenn Sie die Betreuer explizit dazu auffordern.";
	}
}

window.onbeforeunload = log.leaving;

var cluster = {
	// Clustering of heterogenous point clouds
	// By Malte Wellmann, 2013
	
	// Public vars
	gmapsAttr: { // Changes from time to time, change needs "Reset"
		maxZoomLevel: 15
	},
	evaluation: {
		$: null,
		group: null,
		number: null,
		step: 0,
		ended: false,
		initialize: function(){
			cluster.evaluation.$ = $("#evaluation");
			cluster.evaluation.$.fadeIn();
			cluster.evaluation.$.animate({width:"500px"});
			cluster.initialize(1);
		},
		pause: function(){
			log.log({type:"evaluation",description:"pause start"});
			alert("PAUSE. Bestätigen zum Fortfahren.");
			log.log({type:"evaluation",description:"pause ende"});
		},
		nextStep: function(param){
			log.log({type: "evaluation", description: "next step called", reason: param, fromStep: cluster.evaluation.step});
			cluster.evaluation.time = 0;
			cluster.evaluation.hotelsFound = [];
			cluster.evaluation.maxPrice = 0;
			for (var i = 0; i < cluster.points.length; i++) {
				cluster.points[i].map.marker.setMap(null);
			};
			for (var i = 0; i < cluster.polygons.objects.length; i++) {
				try{cluster.polygons.objects[i].setMap(null);}catch(e){}
			};
			cluster.points = [];
			cluster.polygons= {
				xy: [],
				objects: []
			};
			cluster.polygonsDrawn = false;
			cluster.clusteringAlg = 1;
			cluster.map.map.setZoom(10);
			cluster.map.map.setCenter(new google.maps.LatLng(53.08054370928221,8.762884140014648));
			cluster.evaluation.step++;
			if(param != false)
				alert(param + " Es geht mit Schritt " + cluster.evaluation.step + " weiter, sobald sie diese Meldung bestätigen.");
			log.log({type: "evaluation", description: "waiting time with alert over"});
			switch(cluster.evaluation.step){
				case 2:
					cluster.evaluation.findCityStep({
						html:"<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 2</h2>Finden Sie 2 Hotels in Vientiane, Laos. Die Hotels müssen in der Nähe des Mekong Rivers liegen und folgende Kriterien erfüllen:<br><br>Preis: maximal 20€<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.vientiane,
						maxPrice: 20,
						time: 3,
						algA: 2,
						algB: 3
					});
					break;
				case 3:/*
					cluster.evaluation.findCityStep({
						html:"<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 3</h2>Finden Sie 2 Hotels im Nordosten von \"New Cairo City\", Kairo, Ägypten. Die Hotels müssen folgende Kriterien erfüllen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 2<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.kairo,
						maxPrice: 50,
						time: 3,
						algA: 2,
						algB: 3
					});
					break;
				case 4:
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 4</h2>Finden Sie 2 Hotels in Mumbai, Indien. Von der \"Mahim Bay\" führt ein Fluss ins Stadtinnere, an diesem Fluss gilt es die Hotels mit diesen Kriterien zu finden:<br><br>Preis: maximal 30€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.mumbai,
						maxPrice: 30,
						time: 3,
						algA: 3,
						algB: 2
					});
					break;
				case 5:*/
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 3</h2>Finden Sie 2 Hotels nahe des Flusses \"Huangpu River\" im Zentrum (Ballungsgebiet) Shanghai, China. Die Hotels müssen die folgenden Kriterien erfüllen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.shanghai,
						maxPrice: 50,
						time: 3,
						algA: 3,
						algB: 2
					});
					break;
				case 4:
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 4</h2>Finden Sie 2 Hotels nahe des Flusses \"River Mersey\" in Liverpool, England. Die Hotels müssen die folgenden Kriterien erfüllen:<br><br>Preis: maximal 40€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.liverpool,
						maxPrice: 40,
						time: 3,
						algA: 3,
						algB: 2
					});
					break;
				case 5:
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 5</h2>Finden Sie 2 Hotels nahe dem \"East Potomac Park\" in Washington, USA, die den folgenden Anforderungen entsprechen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 2<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.washington,
						maxPrice: 50,
						time: 3,
						algA: 1,
						algB: 2
					});
					break;
				case 6:
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 6</h2>Finden Sie 2 Hotels nahe dem Park \"Atatürk Orman Çiftliği\" in Ankara, Türkei. Die Hotels müssen den folgenden Kriterien entsprechen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 2<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.ankara,
						maxPrice: 50,
						time: 3,
						algA: 2,
						algB: 1
					});
					break;
				case 7:
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 7</h2>Finden Sie erneut die 2 Hotels im Süden von Toledo, Spanien, die den folgenden Anforderungen entsprechen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 2<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.toledo,
						maxPrice: 50,
						time: 3,
						algA: 2,
						algB: 3
					});
					break;
				case 8:
					cluster.evaluation.findCityStep({
						html:"<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 8</h2>Finden Sie erneut die 2 Hotels in Vientiane, Laos. Die Hotels müssen in der Nähe des Mekong Rivers liegen und folgende Kriterien erfüllen:<br><br>Preis: maximal 20€<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.vientiane,
						maxPrice: 20,
						time: 3,
						algA: 2,
						algB: 3
					});
					break;
				case 9:
					/*cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 9</h2>Finden Sie erneut die 2 Hotels in Mumbai, Indien. Von der \"Mahim Bay\" führt ein Fluss ins Stadtinnere, an diesem Fluss gilt es die Hotels mit diesen Kriterien zu finden:<br><br>Preis: maximal 30€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.mumbai,
						maxPrice: 30,
						time: 3,
						algA: 3,
						algB: 2
					});*/
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 9</h2>Finden Sie erneut die 2 Hotels nahe des Flusses \"Huangpu River\" im Zentrum (Ballungsgebiet) Shanghai, China. Die Hotels müssen die folgenden Kriterien erfüllen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.shanghai,
						maxPrice: 50,
						time: 3,
						algA: 3,
						algB: 2
					});
					break;
				case 10:
					/*cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 10</h2>Finden Sie erneut die 2 Hotels nahe des Flusses \"Huangpu River\" im Zentrum (Ballungsgebiet) Shanghai, China. Die Hotels müssen die folgenden Kriterien erfüllen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.shanghai,
						maxPrice: 50,
						time: 3,
						algA: 3,
						algB: 2
					});*/
					cluster.evaluation.findCityStep({
						html: "<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 10</h2>Finden Sie erneut die 2 Hotels nahe des Flusses \"River Mersey\" in Liverpool, England. Die Hotels müssen die folgenden Kriterien erfüllen:<br><br>Preis: maximal 40€<br>Sterne: mindestens 1<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 3 Minuten<br>Verbleibend: <span id='time'>3:00</span><br><br><strong>Fortschritt:</strong>",
						dataSet: evaluationDatasets.liverpool,
						maxPrice: 40,
						time: 3,
						algA: 3,
						algB: 2
					});
					break;
				case 11:
					log.log({type:"evaluation",description:"all hotels found and refound",forceSave:true});
					cluster.evaluation.$.html("<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 11</h2>Diese Aufgabe wird nicht online bearbeitet. Bitte fragen Sie die Betreuung nach dem Papierteil dieser Evaluation. Wenn Sie mit dem Papierteil fertig sind, dann klicken Sie auf \"weiter\".<br><br><button class='big-button' onclick='cluster.evaluation.nextStep(false);'>weiter</button>");
					cluster.evaluation.$.animate({width:"500px"});
					break;
				case 12:
					log.log({type:"evaluation",description:"going to google form"});
					cluster.evaluation.$.html("<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 12</h2>Die Evaluation ist fast abgeschlossen. Bitte beantworten Sie nun noch einige Fragen.<br><br><button class='big-button' onclick='log.save();'>weiter</button>");
					break;
				default:
					alert("Die Evaluation ist abgeschlossen. Bitte schließen Sie das Fenster nicht und wenden Sie sich an die Betreuung.");
					break;
			}
		},
		step1: function(param){
			if($("#evaluationNumber").val() == ""){
				alert("Bitte geben Sie Ihre Nummer ein.");
				return;
			}
			cluster.evaluation.group = param == 1 ? "A" : "B";
			cluster.evaluation.step = 1;
			cluster.evaluation.number = $("#evaluationNumber").val();
			cluster.evaluation.$.html("<h1>Evaluation: Clustering für heterogene Point-Clouds</h1>Gruppe: <strong>"+cluster.evaluation.group+"</strong><h2>Aufgabe 1</h2>Finden Sie 2 Hotels im Süden von Toledo, Spanien, die den folgenden Anforderungen entsprechen:<br><br>Preis: maximal 50€<br>Sterne: mindestens 2<br><br>Klicken Sie auf ein Hotel, damit die Werte angezeigt werden. Hier können Sie auf das Plus-Symbol klicken, um das Hotel auszuwählen.<br><br>Zeitvorgabe: Maximal 5 Minuten<br>Verbleibend: <span id='time'>5:00</span><br><br><strong>Fortschritt:</strong>");
			cluster.evaluation.hotelsFound = [];
			cluster.evaluation.maxPrice = 50;
			cluster.evaluation.time = 5 * 60;
			cluster.evaluation.timer();
			cluster.evaluation.$.animate({width:"250px"});
			log.log({type: "evaluation", description: "started in group " + cluster.evaluation.group, number:cluster.evaluation.number});
			log.log({type: "evaluation", description: "step 1 started, toledo, group " + cluster.evaluation.group});
			cluster.clusteringAlg = cluster.evaluation.group == "A" ? 2 : 3;
			cluster.localStorage.loadParam(evaluationDatasets.toledo);
		},
		findCityStep: function(params){
			cluster.evaluation.$.html(params.html);
			cluster.evaluation.hotelsFound = [];
			cluster.evaluation.maxPrice = params.maxPrice;
			cluster.evaluation.time = params.time * 60;
			cluster.evaluation.$.animate({width:"250px"});
			cluster.clusteringAlg = cluster.evaluation.group == "A" ? params.algA : params.algB;
			log.log({type: "evaluation", description: "step " + cluster.evaluation.step + " started, group " + cluster.evaluation.group, alg:cluster.clusteringAlg});
			cluster.localStorage.loadParam(params.dataSet);
		},
		time: 0,
		timer: function(){
			cluster.evaluation.time--;
			try{$("#time").html(parseInt(cluster.evaluation.time / 60) + ":" + (cluster.evaluation.time%60 > 9 ? cluster.evaluation.time%60 : "0" + cluster.evaluation.time%60));}catch(e){console.log("timer dom not found");}
			if(cluster.evaluation.time == 0){
				cluster.evaluation.nextStep("Die Zeit ist abgelaufen");
			}
			window.setTimeout(cluster.evaluation.timer,1000);
		},
		hotelsFound: 0,
		maxPrice: 0,
		clickedPoint: function(param){
			if(param.get.hotel().price <= cluster.evaluation.maxPrice){
				console.log(param.get.name());
				if($.inArray(param.get.name(), cluster.evaluation.hotelsFound) != -1){
					alert("Dieses Hotel wurde der Lösung bereits hinzugefügt.");
					return;
				}
				cluster.evaluation.hotelsFound.push(param.get.name());
				cluster.evaluation.$.html(cluster.evaluation.$.html() + "<br>Hotel " + cluster.evaluation.hotelsFound.length + " gefunden.")
				if(cluster.evaluation.hotelsFound.length == 2){
					cluster.evaluation.nextStep("Sie haben alle Hotels gefunden!");
					log.log({type:"evaluation",description:"all hotels found.",timeLeft:cluster.evaluation.time});
				}
			}else{
				alert("Das von Ihnen als Lösung angegebene Hotel ist zu teuer.");
			}
		}
	},
	points: [],
	polygons: {
		xy: [],
		objects: []
	},
	zoomLevel: {
		active: 8,
		last: 4,
		refresh: function(lastSet){
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
	minPts: 1,
	noPointAnimations: true,
	map: {
		map: null,
		$dom: null,
		$shadow: null
	},
	smoothZooming: false,
	dynamicAdding: false, // enables or disables dynamic adding of points via click on map
	polygonsDrawn: false,
	clusteringAlg: 2, // 1 = none, 2 = normal, 3 = Google TMM
	colors: {
		name: "red",
		clusterHover: "#ff0000",
		cluster: "#ff4444"
	},
	alternateMap: {
		map: null,
		$dom: null,
		refreshZoom: function(){
			return; // disable if minimap is wanted
			cluster.alternateMap.map.setZoom(cluster.zoomLevel.last);
			cluster.alternateMap.refreshPolygon();
		},
		polygon: null,
		refreshPolygon: function(){
			return; // disable if minimap is wanted
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
		}
	},
	browser: {
		height: null,
		width: null,
		zoomPercentage: 0.9, // Size of magnifier in percent (1 = 100%)
		zoomCSS: {},
		menuCSS: {},
		$menu: null,
		defaultCSS: {
			height: "100%",
			width: "100%",
			"margin-left": 0,
			"margin-top": 0
		}
	},
	infoWindow: null,
	infoWindowContent: function(param){ // param = point
		return '<div class="infowindow">\
					<h1>Hotel</h1>\
					<p>Preis: ' + param.get.hotel().price + '€</p>\
					<p>Sterne: ' + param.get.hotel().stars + '</p>\
					<a class="focus-button" data-target="' + param.get.name() + '"><i class="fa fa-plus" title="Dieses Hotel als Lösung markieren"></i></a>\
				</div>';
	},
	mapSwitcher: {
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
		},
		state: false,
		animateAlternateMap: true,
		equalMapZoom: true
	},
	alternateZoom: true,
	showSmallPoints: false,
	initialize: function(param) {
		try{
			log.log({type: "action", description: "initialize"});
		}catch(e){
			log.log({type: "logging error", catch: e});
		}
		if(param != undefined)
			cluster.clusteringAlg = param; 
		// Create maps
  		cluster.map.map = new google.maps.Map(document.getElementById('map-canvas'), {
  			zoom: 8,
  			maxZoom: 15,
    		center: new google.maps.LatLng(53.08054370928221,8.762884140014648),
    		mapTypeId: google.maps.MapTypeId.ROADMAP,
    		streetViewControl: false
  		});

  		cluster.alternateMap.map = new google.maps.Map(document.getElementById('map-canvas-alternate'), {
  			zoom: 8,
  			maxZoom: 15,
  			center: new google.maps.LatLng(53.08054370928221,8.762884140014648),
    		mapTypeId: google.maps.MapTypeId.ROADMAP,
    		disableDefaultUI: true
  		});

  		google.maps.event.addListenerOnce(cluster.map.map, 'idle', function(){

	  		cluster.map.$dom = $("#map-canvas");
	  		cluster.map.$shadow = $("#map-shadow");
	  		cluster.alternateMap.$dom = $("#map-canvas-alternate");
	  		cluster.browser.$menu = $("#map-controls");

	  		// Get points from last session
	  		//cluster.localStorage.load();

			// Calculate clusters and draw everything
			cluster.drawing.redraw();

			// Gather Browser Info and set magnifier size
			cluster.events.screenSizeChanged();

			// Events
			$(document).on("click",".focus-button",function(){
				try{
					log.log({type: "click", object: "focus-button", name: $(this).data("target")});
				}catch(e){
					log.log({type: "logging error", catch: e});
				}
				var point = cluster.helper.getPointByName($(this).data("target"));
				cluster.map.map.panTo(point.get.pos());
				cluster.drawing.smoothFitBounds({zoomLevel: cluster.gmapsAttr.maxZoomLevel, breakCondition: {
						params: {point: point},
						func: function(params){
							return params.point.get.cluster() == -1;
						}
					}
				});
				cluster.evaluation.clickedPoint(point);
			});
			$(window).resize(cluster.events.screenSizeChanged);
			google.maps.event.addListener(cluster.map.map, 'click', function(event) { if(cluster.dynamicAdding){ cluster.addPoint(event.latLng); }});
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
			cluster.map.$shadow.on('mousedown', cluster.events.returnToMap);
			cluster.events.switchAlternateZoom();
			if(cluster.clusteringAlg == 3)
				new MarkerClusterer(cluster.map.map, cluster.helper.getMarkers(), {maxZoom: 14});
		}); // map loaded

	},

	events: {
		screenSizeChanged: function(){
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
		clickedCluster: function(sender){
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
		mouseoverCluster: function(sender){
			try{
				log.log({type: "mouseover", object: "cluster-polygon", name: cluster.helper.getPointByPolygon(sender).get.name()});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			if(sender.fillOpacity == 0.4)
				sender.setOptions({fillColor: cluster.colors.clusterHover});
		},
		mouseoutCluster: function(sender){
			try{
				log.log({type: "mouseout", object: "cluster-polygon", name: cluster.helper.getPointByPolygon(sender).get.name()});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			sender.setOptions({fillColor: cluster.colors.cluster});
		},
		clickedPoint: function(sender){
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
		switchAlternateZoom: function(sender){
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
			$(sender).find("img").attr("src","images/radio_" + (cluster.alternateZoom ? "" : "un") + "checked.png");
			cluster.map.map.setCenter(centerPoint);
		},
		switchShowSmallPoints: function(sender){
			try{
				log.log({type: "action", description: "switched small points", to: !cluster.showSmallPoints});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			cluster.showSmallPoints =! cluster.showSmallPoints;
			$(sender).find("img").attr("src","images/radio_" + (cluster.showSmallPoints ? "" : "un") + "checked.png");
			cluster.drawing.redraw();

		},
		zoomIn: function(){
			try{
				log.log({type: "zoom", type: "+", to: cluster.zoomLevel.active + 1});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			cluster.map.map.setZoom(cluster.zoomLevel.active + 1);
		},
		zoomOut: function(){
			try{
				log.log({type: "zoom", type: "-", to: cluster.zoomLevel.active - 1});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			cluster.map.map.setZoom(cluster.zoomLevel.active - 1);
		},
		returnToMap: function(){
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
	},

	drawing: {
		redraw: function(){
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
			  		/*
			  		google.maps.event.addListener(cluster.points[i].map.marker, "dblclick", function(){
			  			cluster.events.clickedPoint(this);
			  		});
					*/
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
		drawPolygons: function(param){
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
					google.maps.event.addListener(this.polygons[this.polygons.length - 1].polygon, "click", function(event){
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

		smoothFitBounds: function(params){ // {map, gmapBounds, zoomLevel, breakCondition, forceZoom}
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
		getZoomByBounds: function( map, bounds ){
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
		animation: {
			speed: 40,
			polygon: function(param){
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
			point: function(param){
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
	},

	calculations: {
		gmapsBoundsToSquarePath: function(gmapBounds){
			var ne = gmapBounds.getNorthEast(),
				sw = gmapBounds.getSouthWest();
			return [
				new google.maps.LatLng(ne.lat(), sw.lng()),
				ne,
				new google.maps.LatLng(sw.lat(), ne.lng()),
				sw
			];
		},
		getBoundsOfPolygon: function(params){ // params = {polygon: .. OR points: ...}
			var north,
				west,
				east,
				south,
				lat,
				lng,
				path = params.polygon != null ? params.polygon.getPath().getArray() : params.points;
			for (var i = 0; i < path.length; i++) {
				lat = params.polygon != null ? path[i].b : path[i].get.pos().lat();
				lng = params.polygon != null ? path[i].d : path[i].get.pos().lng(); // TODO: b,d in lat(), lng()
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
		concaveHull: function(param){
			this.xyPoints = [];
			this.firstResult = [];
			this.result = [];
			
			// Convex hull via "GrahamScan":
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

			//console.log(this.result.length, this.firstResult.length);

			/*
			// Concave hull (see https://gist.github.com/gka/1552725)
			for (var i = 0; i < param.length; i++) {
				this.xyPoints.push([param[i].get.pos().lat(), param[i].get.pos().lng()]);
			}
			var w = 960,
				h = 500,
				alpha = 50,
				offset = function(a,dx,dy) {
					return a.map(function(d) { return [d[0]+dx,d[1]+dy]; });
				},
				dsq = function(a,b) {
					var dx = a[0]-b[0], dy = a[1]-b[1];
					return dx*dx+dy*dy;
				},
				asq = alpha*alpha,
				// well, this is where the "magic" happens..
				mesh = d3.geom.delaunay(offset(this.xyPoints,0,0)).filter(function(t) {
					return dsq(t[0],t[1]) < asq && dsq(t[0],t[2]) < asq && dsq(t[1],t[2]) < asq;
				});
			console.log(mesh);
			for (var i = 0; i < mesh.length; i++) {
				this.result.push(new google.maps.LatLng(mesh[i][0][0], mesh[i][0][1]));
				this.result.push(new google.maps.LatLng(mesh[i][1][0], mesh[i][1][1]));
				this.result.push(new google.maps.LatLng(mesh[i][2][0], mesh[i][2][1]));
			};
			*/

			return this.result;
		},
		sortPointsByClusterAndSize: function(param){ // param = zoomLevel
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
		deepClustering: function(){
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
		clustering: function(params){
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
				getNear: function(param){
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
			// Calculation algorithm based on DBSCAN
			if(params.zoomLevel != cluster.gmapsAttr.maxZoomLevel){
				cluster.calculations.sortPointsByClusterAndSize(params.zoomLevel + 1);
			}
			for (var i = 0; i < cluster.points.length; i++) {
				// Already visited?
				//cluster.points[i].set.cluster({zoomLevel: params.zoomLevel, clusterId: -1});
				//continue;
				if(cluster.points[i].get.cluster(params.zoomLevel) != null)
					continue;
				// Get points that are near this one
				private.near = private.getNear(cluster.points[i]);
				// No points near this one? Noise it.
				if(private.near.length < cluster.minPts){
					cluster.points[i].set.cluster({zoomLevel: params.zoomLevel, clusterId: -1});
					continue;
				}
				// Increase clusterId
				private.clusterId++;
				// Set clusterId for point and for all other points in this cluster
				cluster.points[i].set.cluster({zoomLevel: params.zoomLevel, clusterId: private.clusterId});
				for (var j = 0; j < private.near.length; j++) {
					private.skip = false;
					if(private.near[j].get.cluster(params.zoomLevel) != null)
						continue;

					private.near[j].set.cluster({zoomLevel: params.zoomLevel, clusterId: private.clusterId});
					private.nearDeep = private.getNear(private.near[j]);
					if(private.nearDeep.length >= cluster.minPts){
						private.near = private.near.concat(private.nearDeep);
						j = 0;
						continue;
					}
				}
			}

			// Split large clusters

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

			// Medium-Clusters
			if(params.zoomLevel != cluster.gmapsAttr.maxZoomLevel){
				for (var i = 0; i < cluster.points.length; i++) {
					if(cluster.points[i].get.name() == "Hotel 125")
						console.log("CPI",cluster.points[i].get.private(),cluster.points[i].map.size(params.zoomLevel + 1),cluster.points[i].map.size(params.zoomLevel));
					if(cluster.points[i].map.size(params.zoomLevel + 1) == 42 && cluster.points[i].map.size(params.zoomLevel) < 32){
						cluster.points[i].map.setMediumCluster({zoomLevel: params.zoomLevel, val: true});
					}
				};
			}


			performanceChecker.add("DBSCAN end, zoom: " + params.zoomLevel);
			performanceChecker.display.compare(this.performanceCheckerStart);

			// Reset polygons
			cluster.polygons.xy[params.zoomLevel] = null;


			// Calculate cluster centers
			cluster.calculations.setClusterCenters(params.zoomLevel);

			if(params.redraw)
				cluster.drawing.redraw();
		},
		setClusterCenters: function(param){ // param = zoomLevel (default: active zoom level)
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
				if(this.resultPoint == null){ // if still not found any, take the nearest.
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
				// Set points near center point to invisible
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
	},

	addPoint: function(param){
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
	},

	// Basic Classes
	localStorage: {
		save: function(){
			try{
				log.log({type: "localStorage", description: "save"});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			console.log("save called");
			this.points = [];
			for (var i = 0; i < cluster.points.length; i++) {
				this.points.push({
					private: cluster.points[i].get.private(),
					pos: {
						lat: cluster.points[i].get.pos().lat(),
						lng: cluster.points[i].get.pos().lng()
					}
				});
			}
			localStorage.setItem("cluster.points", JSON.stringify(this.points));
		},
		saveConsole: function(){
			try{
				log.log({type: "localStorage", description: "save console"});
			}catch(e){
				log.log({type: "logging error", catch: e});
			}
			console.log("save called");
			this.points = [];
			for (var i = 0; i < cluster.points.length; i++) {
				this.points.push({
					private: cluster.points[i].get.private(),
					pos: {
						lat: cluster.points[i].get.pos().lat(),
						lng: cluster.points[i].get.pos().lng()
					}
				});
			}
			$($("textarea")[0]).val(JSON.stringify(this.points));
		},
		load: function(){
			log.log({type: "localStorage", description: "load"});
			console.log("load called");
			cluster.points = [];
			try{
				console.log(localStorage.getItem("cluster.points"));
				this.points = JSON.parse(localStorage.getItem("cluster.points"));
				for (var i = 0; this.points != null && i < this.points.length; i++) {
					cluster.points.push(new cluster.Point({
						pos: new google.maps.LatLng(this.points[i].pos.lat, this.points[i].pos.lng),
						name: this.points[i].private.name,
						private: this.points[i].private
					}));
				};
			}catch(e){
				alert("Local Storage not supported. Please use latest Firefox.");
			}
		},
		manual: function(){
			log.log({type: "localStorage", description: "manual"});
			console.log("manual load called");
			cluster.points = [];
			try{
				this.points = JSON.parse($($("textarea")[0]).val());
				console.log(this.points);
				for (var i = 0; this.points != null && i < this.points.length; i++) {
					cluster.points.push(new cluster.Point({
						clusters: [],
						pos: new google.maps.LatLng(this.points[i].pos.lat, this.points[i].pos.lng),
						name: this.points[i].private.name,
						private: this.points[i].private
					}));
				};
			}catch(e){
				alert("Local Storage not supported. Please use latest Firefox.");
			}
		},
		loadParam: function(param){
			cluster.map.map.setCenter(new google.maps.LatLng(param.center.lat, param.center.lng));
			log.log({type: "localStorage", description: "loadParam", center: param.center});
			console.log("manual load called");
			for (var i = 0; i < cluster.points.length; i++) {
				cluster.points[i].map.marker.setMap(null);
			};
			for (var i = 0; i < cluster.polygons.objects.length; i++) {
				try{cluster.polygons.objects[i].setMap(null);}catch(e){}
			};
			cluster.points = [];
			cluster.polygons= {
				xy: [],
				objects: []
			};
			cluster.polygonsDrawn = false;
			try{
				this.points = param.data;
				console.log(this.points);
				for (var i = 0; this.points != null && i < this.points.length; i++) {
					cluster.points.push(new cluster.Point({
						clusters: [],
						pos: new google.maps.LatLng(this.points[i].pos.lat, this.points[i].pos.lng),
						name: this.points[i].private.name,
						private: this.points[i].private
					}));
				};
			}catch(e){
				alert("Local Storage not supported. Please use latest Firefox.");
			}
			cluster.map.map.setZoom(7);
			cluster.drawing.redraw();
			if(cluster.clusteringAlg == 3)
				new MarkerClusterer(cluster.map.map, cluster.helper.getMarkers(), {maxZoom: 14});
		},
		showTextarea: function(){
			log.log({type: "localStorage", description: "showTextarea"});
			$($("textarea")[0]).css({display:"block","z-index":4000,height:"200px",width:"200px",top:0,left:0,position:"absolute"});
		}
	},

	helper: {
		getMarkers: function(){
			var markers = [];
			for (var i = 0; i < cluster.points.length; i++) {
				markers.push(cluster.points[i].map.marker);
			}
			return markers;
		},
		getPointByName: function(param){
			for (var i = 0; i < cluster.points.length; i++) {
				if(cluster.points[i].get.name() == param)
					return cluster.points[i];
			};
			return null;
		},
		getTooltipMarginTop: function(params){ // Params: marker, div
			var tooltipHeight = $(params.div).height(),
				pointHeight = params.marker.getIcon().size.height;
			if(pointHeight == 8)
				return "-45px";
			if(pointHeight == 16) // TODO?
				return "-72px";
			return - (tooltipHeight + 10 + pointHeight) + "px"; 
		},
		overlayView: null,
		getPixelCoords: function(param){
			if(cluster.helper.overlayView == null){
				cluster.helper.overlayView = new google.maps.OverlayView();
				cluster.helper.overlayView.draw = function() {};
				cluster.helper.overlayView.setMap(cluster.map.map);
			}
			return cluster.helper.overlayView.getProjection().fromLatLngToContainerPixel(param); 
		},
		setHotelData: function(){
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
		getPointByPolygon: function(param){
			for (var i = 0; i < cluster.points.length; i++) {
				if(cluster.points[i].get.cluster() < 0)
					continue;
				if(cluster.polygons.objects[cluster.zoomLevel.active][cluster.points[i].get.cluster()].polygon.getPath() == param.getPath())
					return cluster.points[i];
			};
			return null;
		}
	},

	Point: function(params){
		var private = {
			clusters: [],
			pos: params.pos,
			name: params.name,
			isCenter: [],
			centerPoints: [],
			isNearCenter: [],
			isMediumCluster: [],
			hotel: {
				price: null,
				stars: null
			}
		}
		if(params.private){
			private.clusters = params.private.clusters;
			private.isCenter = params.private.isCenter;
			private.centerPoints = params.private.centerPoints;
			private.isNearCenter = params.private.isNearCenter;
			private.isMediumCluster = params.private.isMediumCluster;
			private.hotel = params.private.hotel;
		}
		/*if(params.clusters)
			private.clusters = params.clusters;
		*/
		var privateFunctions = {
			getSize: function(param){
				if(cluster.clusteringAlg != 2)
					return 32;
				if(param == undefined)
					param = cluster.zoomLevel.active;
				if(private.clusters[param] == -1)
					return 32; // Single point
				else if(private.isCenter[param])
					return 42; // Cluster center point
				else if(private.isNearCenter[param])
					return 24; // Near cluster center point
				else if(private.isMediumCluster[param])
					return 38;
				else if(private.clusters[param] == -2)
					return 24; // Not important
				else
					return cluster.showSmallPoints ? 8 : 0; // Point in cluster
			}
		}

		this.map = {
			marker: null,
			label: null,
			actualSize: null, // Actual size, not the size that it SHOULD have (for animation)
			size: function(param){ // param = zoomLevel (default: active zoom level)
				return privateFunctions.getSize(param);
			},
			drawSize: function(param){
				var size = privateFunctions.getSize();
				if(size == 42 || size == 38)
					return size + (private.centerPoints[param] >= 50 ? "-high" : private.centerPoints[param] >= 20 ? "" : "-low");
				return size;
			},
			inAnimation: false,
			setCenter: function(params){
				private.isCenter[params.zoomLevel] = params.val;
				if(params.points != undefined)
					private.centerPoints[params.zoomLevel] = params.points; // number of points in this cluster
			},
			setNearCenter: function(params) {
				private.isNearCenter[params.zoomLevel] = params.val;
			},
			setMediumCluster: function(params){
				private.isMediumCluster[params.zoomLevel] = params.val;
				private.centerPoints[params.zoomLevel] = private.centerPoints[params.zoomLevel + 1]; // number of points in this mediumcluster is number of points in previous cluster
			}
		}

		this.get = {
			cluster: function(param){
				if(param == undefined){
					var param = cluster.zoomLevel.active;
				}
				return cluster.clusteringAlg == 2 ? private.clusters[param] : -1;
			},
			clusters: function(){
				return private.clusters;
			},
			pos: function(){
				return private.pos;
			},
			name: function(){
				return private.name;
			},
			centerPoints: function(param){
				if(param == undefined){
					var param = cluster.zoomLevel.active;
				}
				return private.centerPoints[param] != undefined && private.centerPoints[param] != null ? private.centerPoints[param] : 1;
			},
			todo: function(){return private.centerPoints;},
			tooltip: function(){
				if(cluster.clusteringAlg != 2)
					return "Hotel"; //private.name;
				if(private.isCenter[cluster.zoomLevel.active])
					return "<i>" + private.centerPoints[cluster.zoomLevel.active] + "</i>hotels in<br>cluster";
				if(private.isMediumCluster[cluster.zoomLevel.active]){
					return "<i>" + private.centerPoints[cluster.zoomLevel.active] + "</i>of them in<br>this area";
				}
				return "Hotel"; //private.name;
			},
			private: function(){
				return private;
			},
			hotel: function(){
				return private.hotel;
			},
			labelClass: function(param){
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
		this.set = {
			cluster: function(params){
				private.clusters[params.zoomLevel] = params.clusterId;
			},
			pos: function(param){
				private.pos = param;
			},
			name: function(param){
				private.name = param;
			},
			private: function(param){
				private = param;
			},
			hotel: function(param){
				private.hotel = param;
			}
		}
	},
	maxDist: {
		value: 12000,
		calculate: function(param){ // param = zoomLevel (default: active zoom level)
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
	}
}