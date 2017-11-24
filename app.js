var initialZoom = 5;

var allMarkers = [];
var currentVisibleMarkerIndex; 
var showAllMarkersToggle = false; 
var markerCluster;

var map, directionsService, directionsDisplay, directionsInfoWindow;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: initialZoom,
        center: {lat: -31.5, lng: 155.5}
    });

    createMarkersAndAttachPictures();

    markerCluster = new MarkerClusterer(map, [],
            {imagePath: "clusterer/m",
            gridSize: 40}); // don't show any clusters initially

    directionsService = new google.maps.DirectionsService;  
    directionsDisplay = new google.maps.DirectionsRenderer({
        preserveViewport: true,
        suppressMarkers: true
    });

    document.getElementById("next-location").onclick = showNextLocation;
    document.getElementById("all-locations").onclick = function () {
        if (!showAllMarkersToggle) {
            document.getElementById("all-locations").textContent = "Hide all locations";
        } else {
            document.getElementById("all-locations").textContent = "Show all locations";
        }

        showAllMarkersToggle = !showAllMarkersToggle;
        showAllLocations();
    };
}

function showNextLocation () {
    if (showAllMarkersToggle)  {
        // nothing to do, all markers are visible anyway
        return;
    }

    var nextMarkerIndex = (currentVisibleMarkerIndex + 1) % allMarkers.length;
    var nextMarker = allMarkers[nextMarkerIndex];
    nextMarker.setMap(map);

    // make the directions more visible
    map.setZoom(initialZoom + 2);
    map.setCenter(nextMarker.getPosition());

    // show directions
    if ( nextMarker.showDirections ) {
        directionsService.route({
          origin: allMarkers[currentVisibleMarkerIndex].getPosition(),
          destination: nextMarker.getPosition(),
          travelMode: "DRIVING" 
        }, function(response, status) {
          if (status === 'OK') {
            if (directionsInfoWindow) {
                // close previous InfoWindows before opening new ones
                directionsInfoWindow.close(map);
            }

            var standardRoute = response.routes[0].legs[0];
            var numberOfSteps = standardRoute.steps.length;
            directionsInfoWindow = new google.maps.InfoWindow({
                content: standardRoute.distance.text + " in about " + standardRoute.duration.text,
                position: standardRoute.steps[Math.floor(numberOfSteps / 2)].end_location,
                disableAutoPan: true
            });
            directionsInfoWindow.open(map);

            directionsDisplay.setMap(map); 
            directionsDisplay.setDirections(response);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
    } else {
        // even if we don't show directions, it's better to close the previous ones
        directionsDisplay.setMap(null);
        if (directionsInfoWindow) {
            directionsInfoWindow.close(map);
        }

        // zoom out again
        map.setZoom(initialZoom);

        // open the infoWindow to make the marker more "noticable"
        nextMarker.infoWindow.open(map, nextMarker);
    }

    currentVisibleMarkerIndex = nextMarkerIndex;

    if (currentVisibleMarkerIndex === allMarkers.length - 1) {
        document.getElementById("next-location").textContent = "Start over";
    } else if (currentVisibleMarkerIndex === 0) {
        document.getElementById("next-location").textContent = "Show next location";

        // hide the rest
        for (var i = 1; i < allMarkers.length; i++) {
            allMarkers[i].setMap(null);
        }
    }
}

function showAllLocations () {
    // hide any directions
    directionsDisplay.setMap(null);
    if (directionsInfoWindow) {
        directionsInfoWindow.close(map);
    } 

    // show all markers depending on the toggle value and only if they are not visible already
    if (showAllMarkersToggle && currentVisibleMarkerIndex < allMarkers.length - 1) {
        markerCluster.addMarkers(allMarkers);

        // reset zoom
        map.setZoom(initialZoom);

        // disable next-location button since it's not used
        document.getElementById("next-location").setAttribute("disabled", "");
    } else {
        // hide cluster. this also hides all markers
        markerCluster.clearMarkers();
        allMarkers[0].setMap(map); // show the first one only
        currentVisibleMarkerIndex = 0;

        document.getElementById("next-location").removeAttribute("disabled");
    }   
}

function createMarkersAndAttachPictures() {
    for (var locationKey in locations) {
        if (locations.hasOwnProperty(locationKey)) {
            var location = locations[locationKey];

            // create marker
            var marker = new google.maps.Marker;
            if (allMarkers.length === 0) {
                // it is the first marker therefore make it visible
                marker.setMap(map);
                currentVisibleMarkerIndex = 0;
            }
                
            marker.showDirections = location.showDirections === false ? false : true; // default is true unless explicitly set to false
            allMarkers.push(marker);

            marker.setPosition({lat: location.lat, lng: location.lng});

            // attach pictures
            var locationPictures = document.createElement("div"); 
            var img = document.createElement("img");
            var srcString; 
            img.src = "photos/" + location.pictures[0]; // display the first pic - there is always at least 1 pic
            img.setAttribute("height", "250px");
            img.setAttribute("data-id", 0);
            img.onclick = growPic;

            img.setAttribute("data-imageslocations", location.pictures);
            locationPictures.appendChild(img);

            var next = document.createElement("span");
            next.textContent = ">>>";
            next.setAttribute("data-currentid", 0);
            next.className = "next-pic-button"
            next.setAttribute("data-location", locationKey);

            if (locations[locationKey].pictures.length > 1) {
                next.onclick = changePic; 
                locationPictures.appendChild(next);        
            } // else nothing to cycle through

            var infoWindow = new google.maps.InfoWindow({
                content: locationPictures
            });

            marker.infoWindow = infoWindow; // keep a reference, needed to self open some infoWindows
            
            (function (_marker, _infoWindow) {
                marker.addListener('click', function() { // here we can use both marker or _marker, the listener is attached immediately anyway
                    // Without the immediately executed closure (?) when the callback function is executed after a click, it will run with the last context of createMarkersAndAttachPictures method
                    // which means both the marker and the infoWindow will have the last values from the loop

                    _infoWindow.open(map, _marker);
                });
            })(marker, infoWindow);
        }
    }
}

function growPic (event) {
    var cloneContainer = this.parentNode.cloneNode(true); 
    document.getElementById("map").style.opacity = 0.1;
    document.getElementById("overlay").appendChild(cloneContainer); // instead of a clone we could appendChild of the original node but then on closing the overlay we would need to put it back into place

    cloneContainer.firstChild.setAttribute("height", "800px");
    // because we did a deep clone we need to re-attach a click handler
    if (cloneContainer.firstChild.dataset.imageslocations.split(",").length > 1) {
        cloneContainer.firstChild.nextSibling.onclick = changePic;       
    }

    // hide location buttons
    document.getElementById("next-location").style.visibility = "hidden";
    document.getElementById("all-locations").style.visibility = "hidden";

    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            document.getElementById("map").style.opacity = 1;
            document.getElementById("overlay").removeChild(document.getElementById("overlay").firstChild);
            document.getElementById("next-location").style.visibility = "visible";
            document.getElementById("all-locations").style.visibility = "visible";
        }
    }, {once: true});
}

function changePic(event){
    var currentPic = parseInt(this.dataset.currentid, 10);
    var next = (currentPic + 1) % this.previousSibling.dataset.imageslocations.split(",").length;

    // "hide" the current picture and show the next by changing the src attribute
    var picToShow = "photos/" + this.previousSibling.dataset.imageslocations.split(",")[next];
    this.previousSibling.src = picToShow;
    this.previousSibling.setAttribute("data-id", next);

    // update the data attribute
    this.setAttribute("data-currentid", next); 
}
