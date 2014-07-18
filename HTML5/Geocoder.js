var geocoder = new google.maps.Geocoder();

function Geocode(options, parser, onParsed, onFailed){
	geocoder.geocode(options, function(results, status){
		if (status != google.maps.GeocoderStatus.OK){
			console.log(status);
			onFailed();
			return;
		}


		var geoCoded = parser.parse(results);
		onParsed(geoCoded);
	});
}

function AddressToLatLon(address, parser, onParsed, onFailed){
	Geocode({'address': address}, parser, onParsed, onFailed);
}

function LatLonToAddress(latLon, parser, onParsed, onFailed){
	Geocode({'latLng': latLon}, parser, onParsed, onFailed);
}