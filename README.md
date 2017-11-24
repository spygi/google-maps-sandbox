## How-to
* Put your photos in ```photos/``` folder
* Adjust the ```locations``` file (order is important!) using following schema:
```
"Sydney": { // a name for you to remember - not used in the code
    lat: -33.866174, // where the marker will be placed
    lng: 150.808343,
    pictures: [62,63,64,65,66,67,68,69], // the picture filename(s)
    showDirections: false // show driving direction or not - e.g. because you flew there
}
```
* Push and see live in [Github pages](https://spygi.github.io/oceania-2017/)

## Tech
* [Google Maps JS API](https://developers.google.com/maps/documentation/javascript/)
* [Google MarkerClusterer library]()
* Dom manipulation with Vanilla JS (no JQuery etc)
* Deployed in [Github pages](https://spygi.github.io/oceania-2017/)