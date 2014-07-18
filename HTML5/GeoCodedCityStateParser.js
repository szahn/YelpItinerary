function GeoCodedCityStateParser(){
	
	function parse(results){
		var address = results[1].formatted_address;
		var result = results[0];
		var components = result.address_components;
		var grouped = _.groupBy(components, function(component){ return component.types.join('-'); });

		var city = grouped['locality-political'][0].short_name;
		var state = grouped['administrative_area_level_1-political'][0].short_name;
	
		return {
			address: address,
			city: city,
			state: state,
			label: city + ", " + state
		};

	}

	return {
		parse: parse
	};
}