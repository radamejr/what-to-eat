let chosenPlace;
let storage =  window.localStorage;
let filteredResults;
let request;

function constructCircle() {
  if (!searchCircle){
    searchCircle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      map: map,
      center: currentPos,
      radius: searchRadius * 1609.344,
    })
  } else {
    searchCircle.setCenter(currentPos);
    searchCircle.setRadius(searchRadius * 1609.344);
  }
}

function searchNearby(){
  const hasSearch = checkRadiusValue();
  const hasPos = checkPositionValue();
  if(hasSearch && hasPos){
    const hasCached = checkCachedSearch();
    if(hasCached){
      console.log("This is a cached result, cache is kept for a week.")
      handleSearchResults(hasCached, true)
    } else {
      service = new google.maps.places.PlacesService(map);
      request = {
        location: currentPos,
        radius: searchRadius,
      }
    service.nearbySearch(request, handleSearchResults);
    }
  }
}
// add check for status and to send results to filter.
function handleSearchResults(results, status) {
  filtered = filterResults(mockResults);
  filteredResults = filtered;
  if(filterResults.length > 0){
    chosenPlace = filteredResults[Math.floor(Math.random()*filteredResults.length)];
    setTimeout(() => {
      setWithExpiry(currentPos.lat + currentPos.lng + searchRadius, JSON.stringify(chosenPlace))
      buildResultCard();
    }, 500)
  } else {
    alert("No places found within range");
  }
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

function checkRadiusValue(){  
  const inputDiv = parseInt(document.getElementById("radius-input").value);
  if(isNaN(inputDiv) || inputDiv <= 0){
    alert("Please enter a number for search Radius.")
    return false;
  }
  searchRadius = inputDiv;
  return true;
}

function checkPositionValue() {
  if(!currentPos){
    alert("No current position, you can click the map to select a search center.")
    return false;
  }
  return true;
}
//figure out chache scheme, check for one.
function checkCachedSearch(){
  const key = currentPos.lat + currentPos.lng + searchRadius;
  const hasCache = getWithExpiry(key);
  return hasCache;
}

// generate card data.
function buildResultCard() {
  console.log(chosenPlace);
  document.getElementById('result-card-name').innerHTML = chosenPlace.name;
  document.getElementById('result-card-address').innerHTML = chosenPlace.address;
  document.getElementById('result-card-number').innerHTML = chosenPlace.phone;
  document.getElementById('result-card-website').href = chosenPlace.website;
  document.getElementById('result-card-rating').innerHTML = "Rated: " + chosenPlace.rating;
  document.getElementById('result-card-rating-count').innerHTML = "Total Reviews: " + chosenPlace.user_ratings_total;
  hoursList = document.getElementById('result-hours-list');
  hoursList.innerHTML = ""
  chosenPlace.days_open.forEach((day) => {
    buildHoursLine(hoursList, day);
  })
}

function buildHoursLine(ul, day) {
  newLi = document.createElement('li');
  newLi.innerHTML = day;
  newLi.className = "result-card-text"
  ul.appendChild(newLi);
}

// set a cache of the radius/location query to avoid hitting endpoint if needed.
function setWithExpiry(key, value){
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + 604800000,
  }
  storage.setItem(key, JSON.stringify(item));
}


function getWithExpiry(key) {
	const value = storage.getItem(key)
	if (!value) {
		return null
	}
	const item = JSON.parse(value)
	const now = new Date()
	if (now.getTime() > item.expiry) {
		storage.removeItem(key)
		return null
	}
	return item.value
}

function handleRadiusChange() {
  console.log("radius changed")
  const radiusValue = parseInt(document.getElementById("radius-input").value);
  if(isNaN(radiusValue) || radiusValue <= 0){
    return
  }
  searchRadius = radiusValue
  constructCircle()
}