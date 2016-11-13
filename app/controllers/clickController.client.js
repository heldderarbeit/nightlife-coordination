'use strict';

var loadingIcon = document.querySelector('.loadingIcon');
var barResultsDiv = document.querySelector('#barResults');
var footer = document.querySelector('footer');

const GO_BAR_TEXT = 'Planning to go';
const LEAVE_BAR_TEXT = 'Don\'t Go';

(function () {
   
   var getBarsButton = document.querySelector('.location-search .btn');
   var locationInput = document.querySelector('.location-search [name="location"]');
   
   window.onload = function () { 
      getBarsButton.click();
   };
   
   locationInput.addEventListener('keydown', function (e) {
      if (e.which === 13){
         getBarsButton.click();
      }
   }, false);
   
   getBarsButton.addEventListener('click', function () {
      if (locationInput.value) {
         barResultsDiv.innerHTML = '';
         loadingIcon.style.display = 'initial';
         footer.style.visibility = 'hidden';
         searchBars(locationInput.value);
      }
   }, false);
   
})();

function searchBars (location) {
   var searchBarsUrl = appUrl + '/api/getBars/' + location;
   
   ajaxFunctions.ajaxRequest('GET', searchBarsUrl, function (bars) {
      loadingIcon.style.display = 'none';
      displayBars(JSON.parse(bars));
  });
}

function displayBars (bars) {
    
    if (bars.statusCode === 400) {
        barResultsDiv.innerHTML = '<p>could not find any bars for this location</p>';
    } else {
        for (var bar of bars) {
            var barDiv = document.createElement('div');
            barDiv.className = 'bar';
            barDiv.id = bar.yelp.id;
            barDiv.innerHTML = getBarHtml(bar);
            barResultsDiv.appendChild(barDiv);
            barDiv.querySelector('.btn').onclick = handleVisit;
        }
   
        footer.style.visibility = 'visible';
    }
}

function getBarHtml (bar) {
  
    var barHtml =
    '<div class="col-md-3 col-sm-4 hero-feature">' + 
        '<div class="thumbnail">' +
            '<img src="' + bar.yelp.image_url + '">' +
            getCaptionHtml(bar) +
        '</div>' +
    '</div>';
        
    return barHtml;
}

function getCaptionHtml (bar) {

    var buttonClasses = 'btn ';
    buttonClasses += bar.sessionUser.isVisiting ? 'btn-danger' : 'btn-default my-btn-success';
    var buttonValue = bar.sessionUser.isVisiting ? LEAVE_BAR_TEXT : GO_BAR_TEXT;
    var visitorsText = bar.sessionUser.visit_count === 1 ? ' Visitor' : ' Visitors';
    
    var captionHtml =
    '<div class="caption">' +
        '<h2>' + bar.yelp.name + '</h2>' +
        getRatingHtml(bar.yelp.rating) +
        '<p class="reviews">' + bar.yelp.review_count + ' reviews</p>' +
        getAddressHtml(bar.yelp.display_address[0]) +
        getAddressHtml(bar.yelp.display_address[1]) +
        getAddressHtml(bar.yelp.display_address[2]) +
        getAddressHtml(bar.yelp.display_address[3]) +
        '<input type="button" class="' + buttonClasses + '" value="' + buttonValue + '" />' +
        '<p class="visits">' + bar.nightlife.visit_count + visitorsText + '</p>' +
    '</div>';
    
    return captionHtml;
}

function getRatingHtml (rating) {
   
    var srcUrls = new Array(5);
    srcUrls.fill('img/yelp/stars/19x19_0.png');
    
    switch(rating) {
        case 5.0:
            srcUrls.fill('img/yelp/stars/19x19_5.png');
            break;
          
        case 4.5:
            srcUrls[4] = 'img/yelp/stars/19x19_4_5.png';
          
        case 4.0:
            srcUrls[0] = srcUrls[1] = srcUrls[2] = srcUrls[3] = 'img/yelp/stars/19x19_4.png';
            break;
          
        case 3.5:
            srcUrls[3] = 'img/yelp/stars/19x19_3_5.png';
          
        case 3.0:
            srcUrls[0] = srcUrls[1] = srcUrls[2] = 'img/yelp/stars/19x19_3.png';
            break;
          
        case 2.5:
            srcUrls[2] = 'img/yelp/stars/19x19_2_5.png';
          
        case 2.0:
            srcUrls[0] = srcUrls[1] = 'img/yelp/stars/19x19_2.png';
            break;
          
        case 1.5:
            srcUrls[1] = 'img/yelp/stars/19x19_1_5.png';
          
        case 1.0:
            srcUrls[0] = 'img/yelp/stars/19x19_1.png';
    }
      
    var ratingHtml =  
    '<div class="rating" title="' + rating + (rating===1 ? ' star' : ' stars') + '">' +
        '<img src="' + srcUrls[0] + '" />' +
        '<img src="' + srcUrls[1] + '" />' +
        '<img src="' + srcUrls[2] + '" />' +
        '<img src="' + srcUrls[3] + '" />' +
        '<img src="' + srcUrls[4] + '" />' +
    '</div>';
      
      return ratingHtml;
}

function getAddressHtml (address) {
    
    var addressHtml = 
    '<p class="address" style="' + (address ? '' : 'visibility:hidden;') + '">' + 
        address + 
    '</p>';
    
    return addressHtml;
}

function handleVisit (event) {
    
    var barDiv = event.target.parentElement.parentElement.parentElement.parentElement;
    var visitsParagraph = barDiv.querySelector('.visits');
    
    if (barDiv.querySelector('.btn').value === GO_BAR_TEXT) {
        var visitBarUrl = appUrl + '/api/visitBar/' + barDiv.id;
        
        ajaxFunctions.ajaxRequest('POST', visitBarUrl, function (nightlife) {
            
            nightlife = JSON.parse(nightlife);
            if (nightlife.error === 'not logged in') {
                window.location.href = '/auth/twitter';
            } else if (nightlife.error === 'could not update bar in the db') {
                window.location.href = '/';
            } else {
                event.target.classList.remove('btn-default', 'my-btn-success');
                event.target.classList.add('btn-danger');
                event.target.value = LEAVE_BAR_TEXT;
                
                setVisitsParagraph(visitsParagraph, nightlife.visit_count);
            }
        });    
    } else {
        var leaveBarUrl = appUrl + '/api/leaveBar/' + barDiv.id;
        
        ajaxFunctions.ajaxRequest('POST', leaveBarUrl, function (nightlife) {
            
            nightlife = JSON.parse(nightlife);
            if (nightlife.error === 'not logged in') {
                window.location.href = '/auth/twitter';
            } else if (nightlife.error === 'could not update bar in the db') {
                window.location.href = '/';
            } else {
                event.target.classList.add('btn-default', 'my-btn-success');
                event.target.classList.remove('btn-danger');
                event.target.value = GO_BAR_TEXT;
                
                setVisitsParagraph(visitsParagraph, nightlife.visit_count);
            }
        });
    }
}

function setVisitsParagraph (visitsParagraph, visit_count) {
    var visitorsText = visit_count === 1 ? ' Visitor' : ' Visitors';
    visitsParagraph.textContent = visit_count + visitorsText;
}