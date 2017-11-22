var initialZoom = 4;
var currentZoom;

var markersForInitialZoom = [];
var markersForZoomedIn = [];

var map;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: initialZoom,
        center: {lat: -31.5, lng: 151.5}
    });

    currentZoom = initialZoom;
    createMarkersAndAttachPictures();

    map.addListener("zoom_changed", function() {
        if (map.getZoom() > initialZoom) {
            // display more markers
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
    });
}

function createMarkersAndAttachPictures() {
    for (var locationKey in locations) {
        if (locations.hasOwnProperty(locationKey)) {
            var location = locations[locationKey];

            // create marker
            var marker = new google.maps.Marker;
            if (!location.onlyForZoomedIn) {
                marker.setMap(map);
                markersForInitialZoom.push(marker);
            } else {
                markersForZoomedIn.push(marker);
            }

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
    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            document.getElementById("map").style.opacity = 1;
            document.getElementById("overlay").removeChild(document.getElementById("overlay").firstChild);
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