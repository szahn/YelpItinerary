//Get directions for waypoints
var request = {
	origin: results[0].formatted_address,
	destination: geoCodedLocation.city + ", " + geoCodedLocation.state,
	waypoints: waypoints,
	optimizeWaypoints: true,
	travelMode: google.maps.TravelMode.WALKING
};

directionsService.route(request, function(response, status){
	if (status != google.maps.DirectionsStatus.OK){
		return;
	}

	directionsDisplay.setDirections(response);

	var route = response.routes[0];
	var summaryPanel = document.getElementById('directions');
	summaryPanel.innerHTML = '';
	// For each route, display summary information.
	for (var i = 0; i < route.legs.length; i++) {
		var routeSegment = i + 1;
		summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment + '</b><br>';
		summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
		summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
		summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
		for (var j = 0; j < route.legs[i].steps.length; j++){
			summaryPanel.innerHTML += route.legs[i].steps[j].instructions + '<br/>';
		}
	}
});


//Display marker and info window
marker = new google.maps.Marker({
position: myLocation,
map: map
});

infoWindow.setContent(results[1].formatted_address);
infoWindow.open(map, marker);

			/*var waypoints = [];
			var count = 0;
			_.each(data, function(item){
				//count +=1;
				//if (count > 6) return;
				waypoints.push({
					location: item.streetAddress,
					stopover: true
				});			
			});*/