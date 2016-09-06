// Clustering for heterogenous point clouds
// by Malte Wellmann, 2014
// Document: Evaluation main class

cluster.evaluation = {
	$: null, // evaluation jQuery ($) object
	group: null, // group of participant, can be "A" or "B"
	number: null, // pseudonym
	step: 0, // actual step
	ended: false, // finished everything?
	initialize: function(){ // call to start
		cluster.evaluation.$ = $("#evaluation");
		cluster.evaluation.$.fadeIn();
		cluster.evaluation.$.animate({width:"500px"});
		cluster.initialize(1);
	},
	pause: function(){ // participant wants to take a break
		log.log({type:"evaluation",description:"pause start"});
		alert("PAUSE. Bestätigen zum Fortfahren.");
		log.log({type:"evaluation",description:"pause ende"});
	},
	nextStep: function(param){ // calls next step
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
		switch(cluster.evaluation.step){ // every evaluation step
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
			case 3:
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
	step1: function(param){ // calls to start the steps. first step initializes map stuff
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
	findCityStep: function(params){ // sets every step detail for a given step as param
		cluster.evaluation.$.html(params.html);
		cluster.evaluation.hotelsFound = [];
		cluster.evaluation.maxPrice = params.maxPrice;
		cluster.evaluation.time = params.time * 60;
		cluster.evaluation.$.animate({width:"250px"});
		cluster.clusteringAlg = cluster.evaluation.group == "A" ? params.algA : params.algB;
		log.log({type: "evaluation", description: "step " + cluster.evaluation.step + " started, group " + cluster.evaluation.group, alg:cluster.clusteringAlg});
		cluster.localStorage.loadParam(params.dataSet);
	},
	time: 0, // time for timer
	timer: function(){ // timer. called once to initialize
		cluster.evaluation.time--;
		try{$("#time").html(parseInt(cluster.evaluation.time / 60) + ":" + (cluster.evaluation.time%60 > 9 ? cluster.evaluation.time%60 : "0" + cluster.evaluation.time%60));}catch(e){console.log("timer dom not found");}
		if(cluster.evaluation.time == 0){
			cluster.evaluation.nextStep("Die Zeit ist abgelaufen");
		}
		window.setTimeout(cluster.evaluation.timer,1000);
	},
	hotelsFound: 0, // found hotels so far
	maxPrice: 0, // price limit for hotels to be found
	clickedPoint: function(param){ // user clicked hotel "param", check if that's ok
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
};