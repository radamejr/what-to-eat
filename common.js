let chosenPlace;
let storage =  window.localStorage;
let filteredResults;

function constructCircle(currentPos) {
  if (!searchCircle){
    searchCircle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      map,
      center: currentPos,
      radius: searchRadius,
    })
  } else {
    searchCircle.setCenter(currentPos);
  }
}

function searchNearby(){
  const hasSearch = checkRadiusValue();
  const hasPos = checkPositionValue();
  if(hasSearch && hasPos){
    service = new google.maps.places.PlacesService(map);
    let request = {
      location: currentPos,
      radius: searchRadius,
    }
    service.nearbySearch(request, handleSearchResults);
  }
}

function handleSearchResults(results, status) {
  filtered = filterResults(mockResults);
  filteredResults = filtered;
  console.log(filtered)
}

function filterResults(results){
  filtered = results.filter((result) => {
      if (result.types.indexOf("food") > -1){
        placeService.getDetails({ placeId: result.place_id }, (place, status) => {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            result.address = place.formatted_address;
            result.phone = place.formatted_phone_number;
            result.rating = place.rating;
            result.user_ratings_total = place.user_ratings_total;
            result.website = place.website;
            result.isOpen = place.opening_hours.isOpen();
            result.days_open = place.opening_hours.weekday_text;
          }
        })
        return result
      }
    } 
  )
  return filtered;
}

function getPlaceDetails(id){
  let request = {
    placeId: id
  }
  let place_details = {};

  placeService = new google.maps.places.PlacesService(map);

  placeService.getDetails(request, (place, status) => {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
    place_details.address = place.formatted_address;
    place_details.phone = place.formatted_phone_number;
    place_details.rating = place.rating;
    place_details.user_ratings_total = place.user_ratings_total;
    place_details.website = place.website;
    place_details.isOpen = place.opening_hours.isOpen();
    place_details.address = place.opening_hours.weekday_text;
    }
  })
  return place_details 
}

function checkRadiusValue(){  
  const inputDiv = parseInt(document.getElementById("radius-input").value);

  if(isNaN(inputDiv)){
    alert("Please enter a number for search Radius.")
    return false;
  }
  return true;
}

function checkPositionValue() {
  if(!currentPos){
    alert("No current position, you can click the map to select a search center.")
    return false;
  }
  return true;
}

function checkCachedSearch(){

}