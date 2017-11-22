var initialZoom = 4;
var currentZoom;

var markersForInitialZoom = [];
var markersForZoomedIn = [];
var allMarkers = [];
var currentVisibleMarkerIndex; 
var showAllMarkersToggle = false; 

var map;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: initialZoom,
        center: {lat: -31.5, lng: 151.5}
    });

    currentZoom = initialZoom;
    createMarkersAndAttachPictures();

    map.addListener("zoom_changed", zoomChanged);

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
    allMarkers[nextMarkerIndex].setMap(map);
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

function zoomChanged () {
    if (!showAllMarkersToggle) {
        // changing the zoom has an effect only when *all* markers are visible
        return;
    }

    if (map.getZoom() > initialZoom && currentZoom <= initialZoom) {
        // display more markers only if we zoomed in and the previous level was not zoomed in already
        for (var i = 0; i < markersForZoomedIn.length ; i++) {
            markersForZoomedIn[i].setMap(map);
        }
    } else if (map.getZoom() <= initialZoom && currentZoom > initialZoom) {
        // remove markers
        for (var i = 0; i < markersForZoomedIn.length ; i++) {
            markersForZoomedIn[i].setMap(null);
        }
    }

    // update currentZoom for the next zoom change
    currentZoom = map.getZoom();
}

function showAllLocations () {
    // show all markers if the toggle says so and only if they are not visible already
    if (showAllMarkersToggle && currentVisibleMarkerIndex < allMarkers.length - 1) {

        // show initial zoom markers
        for (var i = 0; i < markersForInitialZoom.length ; i++) {
            markersForInitialZoom[i].setMap(map);
        }  

        if (map.getZoom() > initialZoom) {
            // show also zoomed-in markers
            for (var i = 0; i < markersForZoomedIn.length ; i++) {
                markersForZoomedIn[i].setMap(map);
            }      
        }
    } else {
        // hide everything but the first
        for (var i = 1; i < allMarkers.length ; i++) {
            allMarkers[i].setMap(null);
        }

        // reset the index 
        currentVisibleMarkerIndex = 0;
    }    
}

function createMarkersAndAttachPictures() {
    for (var locationKey in locations) {
        if (locations.hasOwnProperty(locationKey)) {
            var location = locations[locationKey];

            // create marker
            var marker = new google.maps.Marker;
            if (!location.onlyForZoomedIn) {
                if (markersForInitialZoom.length === 0) {
                    // it is the first marker therefore make it visible
                    marker.setMap(map);
                    currentVisibleMarkerIndex = 0;
                }
                
                markersForInitialZoom.push(marker);
            } else {
                markersForZoomedIn.push(marker);
            }
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

            (function (_marker, _infoWindow) {
                // we need to use a closure here due to the asynchronous callback
                _marker.addListener('click', function() {
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