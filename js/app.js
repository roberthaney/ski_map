//hardcoded data
var Model = [
	{
	  lat: 43.620751,
	  lng: -72.806577,
    name: "Killington",
    location: "locid:USVT0126;loctype:1", 
    wikipedia: "Killington_Ski_Resort"
	},
  {
    lat: 43.939372,
    lng: -72.957557,
    name: "Middlebury Snow Bowl",
    location: "Hancock",
    wikipedia: "Middlebury_College_Snow_Bowl"
  },
  {
    lat: 44.136301,
    lng: -72.894357,
    name: "Sugarbush", 
    location: "locid:USVT0237;loctype:1",
    wikipedia: "Sugarbush_Resort"
  },
  {
    lat: 44.202643,
    lng: -72.917751,
    name: "Mad River Glen", 
    location: "locid:T72617042;loctype:2",
    wikipedia: "Mad_River_Glen"
  },
  {
    lat: 44.529931,
    lng: -72.779242,
    name: "Stowe", 
    location: "zmw:05662.1.99999",
    wikipedia: "Stowe_Mountain_Resort"
  },
];

//define globals to be available to ViewModel and initMap
var markers = [];
var map;

//initalize google map function
var initMap= function() {
  
  //instantiate map  
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 44.08, lng: Model[3].lng}, 
    zoom: 9
  });
  
  //check that map was loaded
  if (map === undefined) {
    $('#map').html("<br><br><h3>Google Maps is unavailable at this time</h3>");
  };
  
  //listener to recenter map
  var currCenter = map.getCenter();
  google.maps.event.addDomListener(window, "resize", function() {
    map.setCenter(currCenter);
  });
  
  //create markers and infowindows for each entry in model
  for (var i = 0; i < Model.length; i++) {
    var infoWindow = new google.maps.InfoWindow({
      content: Model[i].name
    });
    Model[i].info_window = infoWindow;
    var marker = new google.maps.Marker({
      position: Model[i],
      map: map,
      title: Model[i].name
    });
    //for each marker add listener with closure
    marker.addListener('click', (function(markerCopy, infoWindowCopy, i) {
      var i = i;
      return function() {
        //animate on click for limited amount of time
        if (markerCopy.getAnimation()) {
          markerCopy.setAnimation(null);
        } else {
          markerCopy.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function() {
          markerCopy.setAnimation(null);
          }, 2000);
        }
        //open info window for given marker
        infoWindowCopy.open(map, markerCopy);

        //get external data from APIs using asynchronous protocols, add to secondary presentation panel
        $.getJSON("http://api.wunderground.com/api/9a6cc052e17075c8/conditions/q/VT/" + Model[i].location + ".json", function(data) {
        var location_header = "<div id='location-header'><h4>" + Model[i].name + "</h4>";
        var temperature_display = "<h5>Temperature: " + data.current_observation.temp_f + " F</h5>";
        var weather_display = "<h5>Current Weather: " + data.current_observation.weather + "</h5>";
        var wind_display = "<h5>Wind: " + data.current_observation.wind_mph + " MPH</h5>";
        var acknowledgement = "<div><p>Current conditions courtesy of: </p><span><img id='wunderimage' src=images/wundergroundLogo_4c_horz.png></span></div>";
        $("#location-information").html(location_header + temperature_display + weather_display + wind_display);
        $("#acknowledgement").html(acknowledgement);
        }).error(function(e){
          $("#location-information").html("<p style='color: red; background-color: white; text-align: center;''>**Cannot load weather conditions**</p>");
        });
        
        $.ajax({
          url: "http://en.wikipedia.org/w/api.php?action=opensearch&search=" + Model[i].wikipedia + "&format=json&callback=wikiCallback",
          dataType: "jsonp",
          success: function(response) { 
            $("#wiki-info").html("<p><em>" + response[1] + "</em>: " + response[2] + "<a href='" + response[3] +"'> Wikipedia link.</a>" + "</p>");
          }
        }).fail(function() {
          $("#wiki-info").html("<p style='color: red; background-color: white; text-align: center;'>**Cannot access Wikipedia resources**</p>");
        }); 
      };
    })(marker, infoWindow, i));
    markers.push(marker);
    Model[i].marker = marker;
  };

};

var viewModel = function() {
  self = this;
  //create then populate observable array with names for list from Model data
  self.locations = ko.observableArray([]);
  for (var i = 0; i < Model.length; i++) {
    self.locations.push(Model[i]);
  }
  
  //handler for list view, animates map and gets asynchronous data for presentation panel
  self.logger = function(obj) {
    obj.info_window.open(map, obj.marker);
    obj.marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        obj.marker.setAnimation(null);
      }, 2000); 
    $.getJSON("http://api.wunderground.com/api/9a6cc052e17075c8/conditions/q/VT/" + obj.location + ".json", function(data) {
        var location_header = "<div id='location-header'><h4>" + obj.name + "</h4>";
        var temperature_display = "<h5>Temperature: " + data.current_observation.temp_f + " F</h5>";
        var weather_display = "<h5>Current Weather: " + data.current_observation.weather + "</h5>";
        var wind_display = "<h5>Wind: " + data.current_observation.wind_mph + " MPH</h5>";
        var acknowledgement = "<div><p>Current conditions courtesy of: </p><span><img class='img-responsive center-block' id='wunderimage' src=images/wundergroundLogo_4c_horz.png></span></div>";
        $("#acknowledgement").html(acknowledgement);
        $("#location-information").html(location_header + temperature_display + weather_display + wind_display);
    }).error(function(e) {
      $("#location-information").html("<p style='color: red; background-color: white; text-align: center;'>**Cannot load weather conditions**</p>");
    });
    $.ajax({
      url: "http://en.wikipedia.org/w/api.php?action=opensearch&search=" + obj.wikipedia + "&format=json&callback=wikiCallback",
      dataType: "jsonp",
      success: function(response) {
        $("#wiki-info").html("<p><em>" + response[1] + "</em>: " + response[2] + "<a href='" + response[3] +"'> Wikipedia link.</a>" + "</p>");
      }
    }).fail(function() {
      $("#wiki-info").html("<p style='color: red; background-color: white; text-align: center;'>**Cannot access Wikipedia resources**</p>");
    });
  };

  //filter markers on search term function
  self.filterMarkers = function(filter) {
    for (i=0; i < markers.length; i++) {
      if (filter && markers[i].title.toLowerCase().indexOf(filter) === -1) {
        markers[i].setVisible(false);
      } else {
        markers[i].setVisible(true);
      }
    }
  };

  //observable bound to input field
  self.searchTerm = ko.observable('');

  //computed filtered locations bound to list view
  self.filteredLocations = ko.computed(function() {
    var filter = self.searchTerm().toLowerCase();
    //if no filter return whole array of locations
    if (!filter) {
      //call helper function to make sure all locations displayed if no search term
      self.filterMarkers();
      return self.locations();
    } else {
      //call helper to filter markers array on search term by title
      self.filterMarkers(filter);
      //filter locations array on search term
      return ko.utils.arrayFilter(self.locations(), function(location) {
        return location.name.toLowerCase().indexOf(filter) !== -1;
      });
    }
  }, viewModel);  
};

ko.applyBindings(new viewModel());
