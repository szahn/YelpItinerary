var Itinerary = function(){
"use strict";

	var map;

	var viewModel = {
		yelpUserId: "",
		streetAddress: "",
		latitude: "",
		longitude: "",
		city: "",
		state: "",
		markers: []		
	}

	function UpdateView(){
		$("#yelpUserIdInput").val(viewModel.yelpUserId);
		$("#streetAddressInput").val(viewModel.streetAddress);
		$("#latInput").val(viewModel.latitude);
		$("#lonInput").val(viewModel.longitude);
		$("#cityInput").val(viewModel.city);
		$("#stateInput").val(viewModel.state);
	}

	function CheckBrowserCapability(){
		if ("geolocation" in navigator){
			return true;
		}
		else{
			//TODO: improve error handling
			alert("Geolocation not supported")
			return false;
		}
	}

	function Init(){
		//TODO: show loading progress
		if (!CheckBrowserCapability()){
			return;
		}

		var getCurrentPositionOptions = {
			enableHighAccuracy: true, 
			maximumAge        : 30000, 
			timeout           : 27000
		};

		navigator.geolocation.getCurrentPosition(OnPositionFound, 
			onFailedToGetPosition, getCurrentPositionOptions);
	}

	function onFailedToGetPosition(position){
		var msg = "Error obtaining location: (" + err.code + ") " + err.message;
		//TODO: improve error handling
		alert(msg);		
	}

	function OnPositionFound(position){
		viewModel.latitude = position.coords.latitude;
		viewModel.longitude = position.coords.longitude;

		var myCenter = new google.maps.LatLng(viewModel.latitude, viewModel.longitude);
		var mapOptions = {
			zoom: 12,
			center: myCenter
		};			

		map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

		LatLonToAddress(myCenter, new GeoCodedCityStateParser(), OnAddressParsedFromLatLon);
	}

	function RecenterMap(){
		var center = map.getCenter();
		viewModel.latitude = center.k;
		viewModel.longitude = center.B;
		LatLonToAddress(center, new GeoCodedCityStateParser(), OnAddressParsedFromLatLon);
	}

	function OnAddressParsedFromLatLon(geoCodedLocation){
		var myCenterMarker = new google.maps.Marker({
			position: new google.maps.LatLng(viewModel.latitude, viewModel.longitude),
			map: map,
			title: geoCodedLocation.address
		});

		viewModel.streetAddress = geoCodedLocation.address;
		viewModel.city = geoCodedLocation.city;
		viewModel.state = geoCodedLocation.state;

		var infoWindow = new google.maps.InfoWindow();
		infoWindow.setContent(geoCodedLocation.address);
		infoWindow.open(map, myCenterMarker);

		UpdateView();
	}

	function Start(){
		GetPublicYelpBookmarks(viewModel.yelpUserId, viewModel.city, viewModel.state, DisplayMarkers, function(){
			//TODO: handle error
			console.log("Error!");
		});		
	}

	function GetPublicYelpBookmarks(userId, city, state, waypointsCollected){
		var url = 'http://localhost:8080/bookmarks/' + state + '/' +  city + '?YelpUserId=' + userId;

		var ajaxOptions = {url: url, 
			type: 'GET', 
			cache: false, 
			dataType:'json',
			timeout: 6000};
		$.ajax(ajaxOptions).done(function(data, status, xhr){
			waypointsCollected(data);
		}).fail(function(xhr, status, err){
			console.log(err);
		});
	}

	function DisplayMarkers(bookmarks){

		function iterate(index, items, onCompleted){
			if (index >= items.length){
				onCompleted(items);
				return;
			}

			AddressToLatLon(items[index].streetAddress, new GeoCodedLatLonParser(), function(location){
				items[index].location = location;
				iterate(index + 1, items, onCompleted);
			}, function(){
				iterate(index + 1, items, onCompleted);
				console.log("Error!");
			});
		}

		iterate(0, bookmarks, OnCompletedIteratingOverBookmarks);
	}

	function OnCompletedIteratingOverBookmarks(items){
		var geoLocations = new Array();
		var locCount = 0;

		_.each(items, function(bookmark){
			if (!bookmark.location) return;
			locCount += 1;
			if (locCount >= 7) return;

			var geoLocation = {
				marker: new google.maps.Marker({
			      position: new google.maps.LatLng(bookmark.location.lat, bookmark.location.lon),
			      map: map,
			      title: bookmark.title
				}),
				bookmark: bookmark,
				distanceFromCenter: distance(bookmark.location.lat, bookmark.location.lon, 
					viewModel.latitude, viewModel.longitude)
			};

			geoLocations.push(geoLocation);
		});

		geoLocations = _.sortBy(geoLocations, function(loc){ return loc.distanceFromCenter;});

		var waypoints = [];
		var count = 0;
		_.each(geoLocations, function(geoLocation){
			waypoints.push({
				location: geoLocation.bookmark.streetAddress,
				stopover: true
			});			
		});

		var last = geoLocations.pop();
		var finalDestination = last.bookmark.streetAddress;

		var request = {
			origin: viewModel.streetAddress,
			destination: finalDestination,
			waypoints: waypoints,
			optimizeWaypoints: true,
			travelMode: google.maps.TravelMode.WALKING
		};

		var directionsService = new google.maps.DirectionsService();
		directionsService.route(request, function(response, status){
			if (status != google.maps.DirectionsStatus.OK){
				console.log(status);
				return;
			}

			var directionsDisplay = new google.maps.DirectionsRenderer();
			directionsDisplay.setMap(map);
			directionsDisplay.setDirections(response);

			var route = response.routes[0];
			var summaryPanel = document.getElementById('directions');
			summaryPanel.innerHTML = '';

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
	}	

	return{
		init: Init,
		start: Start,
		recenter: RecenterMap
	};

}

window.itinerary = new Itinerary();

$(function(){
	window.itinerary.init();
	$("Form#ItineraryForm").submit(function(e){
		window.itinerary.start();
		e.preventDefault();
		return false;
	});
	$("#Recenter").click(function(e){
		window.itinerary.recenter();
		e.preventDefault();
		return false;
	})
});