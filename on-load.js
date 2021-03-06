let map;
let currentPos;
let infoWindow;
let searchCircle;
let searchRadius;

function initMap() {
    map = new google.maps.Map(document.getElementById("google-map"), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 12,
        clickableIcons: false,
        streetViewControl: false,
        mapTypeControl: false,
    })
    infoWindow = new google.maps.InfoWindow();
    placeService = new google.maps.places.PlacesService(map);
    map.addListener("click", (mapsMouseEvent)=> {
      dropInfoWindow(mapsMouseEvent)
    })
    getUserLocation();
};

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(currentPos);
            infoWindow.setPosition(currentPos);
            infoWindow.setContent("Search around here.");
            infoWindow.open(map);
          },
          () => {
            alert("No current position, you can click the map to select a search center.");
          }
        );
    } else {
        alert("Your browers does not support gelocation.")
    }
}
function dropInfoWindow(mapsMouseEvent){
  infoWindow.close();
  infoWindow.setPosition(mapsMouseEvent.latLng)
  infoWindow.setContent("Search around here.");
  infoWindow.open(map);
  map.setCenter(mapsMouseEvent.latLng);
  currentPos = mapsMouseEvent.latLng;
  constructCircle();
}
