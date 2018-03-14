var map;
var infowindow;
var markers = [];
var polygons = [];
var baseUrl = 'http://localhost:3000';
var coffeeUrl = '/coffee.json';
var buildingUrl = '/building.json';

function initMap() {
    var mapOptions = {
        center: {lat:43.083848, lng:-77.6799},
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    document.querySelector("#worldZoomButton").onclick = function(){
        map.setZoom(1);  
    };
    document.querySelector("#defaultZoomButton").onclick = function(){
        map.setZoom(16);  
    };
     document.querySelector("#isometricZoomButton").onclick = function(){
        map.setZoom(18);  
    };
    document.querySelector("#buildingZoomButton").onclick = function(){
        map.setZoom(30);
    };
    document.querySelector("#updateCoffee").onclick = function(){
        getCoffeeData();
    };


    map.mapTypeId = 'satellite';
    map.setTilt(45);
}

function addMarker(latitude, longitude, title){
    var position = {lat:latitude, lng:longitude};
    var marker = new google.maps.Marker({position: position, map:map});
    marker.setTitle(title);

    markers.push(marker);

    //Add a listener for the click event
    google.maps.event.addListener(marker, 'click', function(e){
        makeInfoWindow(this.position,this.title);
    });
}

function makeInfoWindow(position, msg){
    //Close old infoWindow if it exists
    if(infowindow) {infowindow.close();}

    //Make a new infoWindow
    infowindow = new google.maps.InfoWindow({
        map:map,
        position:position,
        content: "<b>" + msg + "</b>"
    });
}

function clearMarkers(){
    markers.forEach(function(marker) {
       marker.setMap(null); 
    });
    
    markers = [];
}

function getCoffeeData() {
    clearMarkers();
    
    $("#content").fadeOut(1000);
    $.ajax({
        dataType: "json",
        url: baseUrl + coffeeUrl,
        data: null,
        success: function(data) {
            data.coffeeShops.forEach(function(obj){
                addMarker(obj.latitude, obj.longitude, obj.title);
            });
        },
        error: function(error){
            console.dir(error);
        }
    });
}