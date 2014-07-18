function GeoCodedLatLonParser(){
	
	function parse(results){
		var result = results[0];
		var geometry = result.geometry;
		var lat = geometry.location.k;
		var lon = geometry.location.B;
	
		return {
			lat: lat,
			lon: lon
		};

	}

	return {
		parse: parse
	};
}