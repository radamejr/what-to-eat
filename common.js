let chosenPlace;
let storage =  window.localStorage;
let filteredResults;
let request;
let allPagesResults = [];
let resultMarker;

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
    document.getElementById("random-button").disabled = true
    const hasCached = checkCachedSearch();
    if(hasCached){
      console.log("This is a cached result, cache is kept for a week.")
      allPagesResults = JSON.parse(hasCached);
      filterSearchResults()
    } else {
      service = new google.maps.places.PlacesService(map);
      request = {
        location: currentPos,
        radius: searchRadius * 1609.344,
        openNow: true,
      }
      service.nearbySearch(request, handleSearchResults);
    }
  }
}
// add check for status and to send results to filter.
function handleSearchResults(results, status, pagination) {
  if(status != "OK") return;
  results.forEach((place) => {
    allPagesResults.push(place);
  });
  if(pagination && pagination.hasNextPage){
    pagination.nextPage();
  } else {
    setWithExpiry(currentPos.lat + currentPos.lng + searchRadius, JSON.stringify(allPagesResults), 604800000)
    filterSearchResults()
  }
}

function filterSearchResults(){
    filteredResults = filterResults(allPagesResults);
    if(filteredResults.length > 0){
      selectRandomPlace();
    } else {
      alert("No places found within range");
    }
}

function filterResults(results){
  filtered = results.filter((result) => {
      if (result.types.indexOf("food") > -1){
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
  document.getElementById('result-card-name').innerHTML = chosenPlace.name;
  document.getElementById('result-card-address').innerHTML = chosenPlace.address;
  document.getElementById('result-card-number').innerHTML = chosenPlace.phone;
  document.getElementById('result-card-website').href = chosenPlace.website;
  document.getElementById('result-card-rating').innerHTML = "Rated: " + chosenPlace.rating;
  document.getElementById('result-card-rating-count').innerHTML = "Total Reviews: " + chosenPlace.user_ratings_total;
  hoursList = document.getElementById('result-hours-list');
  hoursList.innerHTML = ""
  chosenPlace.days_open?.forEach((day) => {
    buildHoursLine(hoursList, day);
  })
  document.getElementById('result-card').style.display = "block"
  document.getElementById("random-button").disabled = false
}

function buildHoursLine(ul, day) {
  newLi = document.createElement('li');
  newLi.innerHTML = day;
  newLi.className = "result-card-text"
  ul.appendChild(newLi);
}

// set a cache of the radius/location query to avoid hitting endpoint if needed.
function setWithExpiry(key, value, ttl){
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
  const radiusValue = parseInt(document.getElementById("radius-input").value);
  if(isNaN(radiusValue) || radiusValue <= 0){
    return
  }
  searchRadius = radiusValue
  constructCircle()
}

function getPlaceDetails(id) {
  let cachedPlace = getWithExpiry(id)
  if(cachedPlace){
    chosenPlace = cachedPlace;
    console.log("Place was cached within 24hours, using that.")
  } else {
    placeService.getDetails({ placeId: id }, (place, status) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        chosenPlace = Object.assign(chosenPlace, { address: place.formatted_address } )
        chosenPlace = Object.assign(chosenPlace, { phone: place.formatted_phone_number})
        chosenPlace = Object.assign(chosenPlace, { rating: place.rating})
        chosenPlace = Object.assign(chosenPlace, { user_rating_total: place.user_ratings_total })
        chosenPlace = Object.assign(chosenPlace, { website: place.website})
        chosenPlace = Object.assign(chosenPlace, { isOpen: place.opening_hours.isOpen()})
        chosenPlace = Object.assign(chosenPlace, { days_open: place.opening_hours.weekday_text})
      }
    })
    setTimeout(() => {
      setWithExpiry(id, chosenPlace, 86400000);
    }, 500);
  }
  
}

function selectRandomPlace() {
  newPlace = filteredResults[Math.floor(Math.random()*filteredResults.length)];
  if(newPlace.name !== chosenPlace?.name){
    chosenPlace = newPlace;
    getPlaceDetails(chosenPlace.place_id)
    setTimeout(() => {
      buildResultCard();
      dropMarker(chosenPlace.geometry.location, chosenPlace.name)
    }, 1000)
  } else {
    console.log("Place was not open or was the same. Trying again.", newPlace)
    selectRandomPlace();
  }
}

function dropMarker(locationPosition, locationName) {
  if(!resultMarker){
    resultMarker = new google.maps.Marker({
      position: locationPosition,
      title: locationName,
    })
    resultMarker.setMap(map);
  } else {
    resultMarker.setPosition(locationPosition);
    resultMarker.setTitle(locationName);
  }
}