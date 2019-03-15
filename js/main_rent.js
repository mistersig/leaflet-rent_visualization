/* main JS by Sigfrido, 2018 */
//function to instantiate the Leaflet map
function createMap(){
	//create the map and zoom in order to grab the entire US
	var map = L.map('mapid',{
		maxZoom: 7,
		minZoom:4,
		//maxBounds: bounds
	}).setView([38,-102],5);

	var CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
}).addTo(map);

	//unique basemap by stamen, also adding zillow data info 
// 	var Stamen_Toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
// 	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// 	subdomains: 'abcd',
// 	minZoom: 0,
// 	maxZoom: 20,
// 	ext: 'png'
// }).addTo(map);

    getData(map);
};


//2. Import GeoJSON data--done (in getData())
function getData(map) {
	// load the data
	$.ajax("data/rent_cities_data.geojson",{
		dataType:"json",
		success: function(response){
			//variables 
			var attributes = processData(response);
			//call functions
			createPropSymbols(response, map, attributes);
			createSequenceControls(map, attributes);
			createLegend(map, attributes);
			//createSearch(map,geofeatures)
		}
	});
};
//attribute array for data ||| estimated cost of project 
function processData(data){
	//empty array to hold attributes
	var attributes = [];
	// console.log(data);
	//properties of the first feature in the dataset
	var properties = data.features[0].properties;
	console.log(properties)
	//push each attribute name into attributes array
	for (var attribute in properties){
		//only take attributes with values
		// decided to up alphabetical search and sort 
		if(attribute.indexOf("April"|"September") > -1){
			attributes.push(attribute);
		};
	};
	//check result
	// console.log(attributes);
	return attributes;
};

function pointToLayer (feature, latlng,attributes){
	//determine which attributes to visualize with proportional symbols
	var attribute = attributes[0];
	//create marker options
	var options = {
		fillColor: '#ff7784',
		color: '#fff',
		weight: 1,
		opacty: 1,
		fillOpacity: 0.7
	};
	//for each feature, determine its value for the selected attribute 
	var attValue = Number(feature.properties[attribute]);
	// console.log(attValue);
	// give each feature's circle marker a radius based on its attribute value
	options.radius = calcPropRadius(attValue);

	//create circle marker layer
	var layer = L.circleMarker(latlng, options);
	

	createPopup(feature.properties, attribute, layer, options.radius);


	//event listeners to open popup on hover
	layer.on({
		mouseover: function(){
			this.openPopup();
		},
		mouseout: function(){
			this.closePopup();
		},
	});
	//return the circle marker t the L.geoJson pointToLayer option
	
	return layer; 
};


function updatePropSymbols(map, attribute){
	map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute]){
			//update the layer style and popup
			//access feature properties 
			var props = layer.feature.properties;
			//update each feature's radisu based on new attribute values 
			var radius = calcPropRadius(props[attribute]);
			layer.setRadius(radius);
			createPopup(props, attribute, layer, radius);

		};
	});
	};

function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 4;
    //area based on attribute value and scale factor
    var area = (attValue * scaleFactor)/2;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};    




// //calculate the radius of each proportional symbol 
// function calcPropRadius(attValue){

// 	//min value = 500 || max value = 3638 || sum = 1721772(1,721,772) || number of values = 312
// 	//number of valuves = 1274
// 	console.log(attValue)
// 	var radius = 5+((attValue-569)/3220)*312
// 	// var radius = 5+((attValue-3220)/1894)*569
// 	return radius;
// };

//rent map 
function createPopup(properties,attribute,layer,radius){
	//add city to popup content string
	var popupContent = "<p><b>City: <b>" + properties["City"] + "</p>";
	var month = attribute.split("_")[0];
	//var year = attribute.split("_")[1];
	popupContent += "<p><b>" +"Month: " + month +"</p>" ;
	popupContent += "<p><b>" + "Median Rent: " +"$"+ properties[attribute] + "</p>";
	//replace the layer popup 
	layer.bindPopup(popupContent, {
		offset: new L.Point(0,-radius)
	});
}


//Add circle markers for point features to the map--done (in AJAX callback)
function createPropSymbols(data,map,attributes){

	//create a LEaflet GeoJSON layer and add it to the map 
	var rent2017 = L.geoJson(data,{
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		}
	}).addTo(map);
	// // if you want to add cluster
	// });
	// var markers = L.markerClusterGroup();
	// return markers.addLayer(rent2017).addTo(map);

	var cityRank = L.geoJson(data, {
		pointToLayer: function (feature, latlng){
			return cityMarkers(feature, latlng);
		}
	});
 	
	//adding layer control 
	var overlayOption = {
		"Rent for 2017" : rent2017,
		"City Rank by Size": cityRank
	};

	//add layercontrol to map
	L.control.layers(overlayOption).addTo(map);

};


function cityMarkers(feature,latlng){
	var popupContent = "<p><b>City: <b>" +feature.properties["City"]+ "</p>";
	var citySizeRank = Number(feature.properties["SizeRank"]);
	popupContent += "<p><b>" +"Population Ranking : " + citySizeRank +"</p>" ;
	var layer = L.circleMarker(latlng);
	layer.bindPopup(popupContent,{offset: new L.point(10,10)
	});

	layer.on({
    mouseover: function(){
        this.openPopup();
    },
    mouseout: function(){
        this.closePopup();
    },
    click: function(){
        layer.on(popupContent);
    }
    });
    
    return layer;

};




//create new sequence controls 
function createSequenceControls(map,attributes){

	var SequenceControl = L.Control.extend({
	options: {
		position: 'bottomright'
	},
	onAdd: function(map){
		//create the control container div with a particular class name
		var container = L.DomUtil.create('div', 'sequence-control-container');
		// ... initialize other DOM elements, add listenrs etc. 
		
		$(container).append('<input class="range-slider" type="range">');
        $(container).append('<button class="skip" id="reverse" title="Reverse"> << </button>');
        $(container).append('<button class="skip" id="forward" title="Forward"> >> </button>');

		//kill any mouse event listners on the map
		$(container).on('mousedown dblclick pointerdown', function(e){
            L.DomEvent.stopPropagation(e);
        });

		return container;
		}
	});
	map.addControl(new SequenceControl());

	$('.range-slider').attr({
		max:11,
		min:0,
		value: 0,
		step:1
	});

	//step 5: click listner for buttons
	$('.skip').click(function(){
		//get the old index value
		var index = $('.range-slider').val();
		//step 6: increment or drement depending on button clicked
		if ($(this).attr('id')=='forward'){
			index++;
			//step 7: if past the last attribute, wrap around to first attribute 
			index = index > 11 ?0: index;
		} else if ($(this).attr('id')== 'reverse'){
			index--;
			//step7: if past the first attribute, wrap around to last 
			index = index < 0 ? 11 : index;
		};
		//update slider
		$('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
	});

		//step 8: update slider
	$('.range-slider').on('input',function(){
		//sequence
		var index = $(this).val();
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
	});

};

//leaflet control creation for legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')
            //start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="230px" height="120px">';
            
            //array of circle names to base loop on
            var circles = {
                max: 55,
                mean: 75,
                min: 95
                // max: 80,
                // mean: 120,
                // min: 160                
            }
  //           		fillColor: '#5a9903',
		// color: '#7fdb00',
            
            //loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += 
                '<circle class="legend-circle" id="' + circle + 
                '" fill="#db0015" fill-opacity="0.6" stroke="#fff" stroke-width="1" cx="80" />';
                
                svg += '<text id="' + circle + '-text" x="150" y="' + circles[circle] + '"></text>';
            };
            
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var month = attribute.split("_")[0];
    var content = "<b> Median Rent: </b>" + month + " '17";

    //replace legend content
    $('#temporal-legend').html("<id='legend-month'> "+content);
    
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);


        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 100 - radius,
            r: radius
        });
        $('#'+key+'-text').text( "$"+ Math.round(circleValues[key]*100)/100);
//        $('#'+key+'-text').html("&euro;" + Math.round(circleValues[key]*100)/100 + " million");
    };
};

//calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) /2;
    // console.log(max);
    // console.log(mean);
    // console.log(min);
    

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

$(document).ready(createMap);