//js

// Smart Mirror solution developed by Alan Hill (http://www.zetlanddesign.co.uk).

// weather plugin from http://simpleweatherjs.com/

// example calendar API code from: https://developers.google.com/google-apps/calendar/quickstart/js#prerequisites

// date format from: http://blog.stevenlevithan.com/archives/date-time-format


// Set a global debug bool, allowing easy toggle of debug messages throughout code.  
// Use Logger() instead of console.log()
var gDebug = true;

// CHANGEME
// these are the variables that need to change depending on your personal settings - brought out into the top for easier reference...

//weather
var thisLoc = "London"; //set this to wherever you are of course
var thisUnit = "c";  // c (celsius) or f (fahrenheit)
var thisNumDays = 4; // the number of days ahead to look, including today.

// CHANGEME
// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '<id>.apps.googleusercontent.com';

// This is the ID of the particular calendar - I think "primary" is the default, but you can change it if you have 
// multiple calendars in your Google Account.
var CALENDAR_ID = '<calendar_id>@group.calendar.google.com';



// The date/time and weather widgets are started from the document.ready, but the calendar code is initiated in the html as an "onload"
// querystring event of the Google API script tag

// It could be changed to start in document.ready, but given this is for personal use, I wasn't worried about
// best practise or performance particularly.

// get an object to store events by date
//
var WeatherList = new Object;

// Logging function to print to
function Logger(message){
	if (gDebug) console.log(message);
	}

$(document).ready(function() {

	// Display the date and time at the top
	//
	startTime();

	// The weather feed:
	// - populates the current weather at the top
	// - creates an array of daily weather forecast items, for use in the calendar rows
  $.simpleWeather({
    location: thisLoc,
    woeid: '',
    unit: thisUnit,
    success: function(weather) {

		$("#currentWeather").html("<span class='weather-text'>"+weather.text+"</span><br/> "+weather.temp+"&deg;"+weather.units.temp);

      for (i = 0; i < thisNumDays; i++) {
          var thisDay = "<span class='todays-weather'><br/><span class='weather-text'>"+weather.forecast[i].text+"</span><br/>" + weather.forecast[i].high +'&deg;'+weather.units.temp + "</span>|";
          var weatherDate  = new Date(weather.forecast[i].date);
		  var formattedWeatherDate = dateFormat(weatherDate, "mm/dd/yyyy");
		  WeatherList[formattedWeatherDate] = thisDay;
		  Logger("Got Date for weather: " + formattedWeatherDate);
      }


    },
    error: function(error) {
      $("#weather").html('<p>'+error+'</p>');
    }
  });

});








    function startTime() {
	    var today = new Date();
	    var h = today.getHours();
	    var m = today.getMinutes();
	    var s = today.getSeconds();
	    m = checkTime(m);
	    s = checkTime(s);
	    document.getElementById('nowtime').innerHTML = h + ":" + m;


		var month = today.getUTCMonth() + 1; //months from 1-12
		var day = today.getUTCDate();
		var year = today.getUTCFullYear();

		if(day<10){
        	day='0'+day
    	}
    	if(month<10){
        	month='0'+month
    	}
		newdate = day + "/" + month;


	    document.getElementById('dateDMY').innerHTML = newdate;

	    var t = setTimeout(startTime, 500);
	}
	function checkTime(i) {
    	if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    	return i;
	}



	var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

	/**
     * Check if current user has authorized this application.
     */
	function checkAuth() {
	    gapi.auth.authorize(
          {
              'client_id': CLIENT_ID,
              'scope': SCOPES.join(' '),
              'immediate': true
          }, handleAuthResult);
	}

	/**
     * Handle response from authorization server.
     *
     * @param {Object} authResult Authorization result.
     */
	function handleAuthResult(authResult) {
	    var authorizeDiv = document.getElementById('authorize-div');
	    if (authResult && !authResult.error) {
	        // Hide auth UI, then load client library.
	        authorizeDiv.style.display = 'none';
	        loadCalendarApi();
	    } else {
	        // Show auth UI, allowing the user to initiate authorization by
	        // clicking authorize button.
	        authorizeDiv.style.display = 'inline';
	    }
	}

	/**
     * Initiate auth flow in response to user clicking authorize button.
     *
     * @param {Event} event Button click event.
     */
	function handleAuthClick(event) {
	    gapi.auth.authorize(
          { client_id: CLIENT_ID, scope: SCOPES, immediate: false },
          handleAuthResult);
	    return false;
	}

	/**
     * Load Google Calendar client library. List upcoming events
     * once client library is loaded.
     */
	function loadCalendarApi() {
	    gapi.client.load('calendar', 'v3', listUpcomingEvents);
	}

	// use this to add number of days to a given day
	Date.prototype.addDays = function(days) {
	    this.setDate(this.getDate() + parseInt(days));
	    return this;
	};
	/**
     * Print the summary and start datetime/date of the next ten events in
     * the authorized user's calendar. If no events are found an
     * appropriate message is printed.
     */
	function listUpcomingEvents() {

		// get start date, set to midnight (before) to ensure search picks up all events on that day (today)
		var startDay = new Date();
		// Set time to midnight
		startDay.setHours(0,0,0,0);

		// same for end date, then set end date x days ahead to control how many days to search within
		var endDay = new Date();
		endDay.addDays(thisNumDays);

		// create the request object
	    var request = gapi.client.calendar.events.list({
	        'calendarId': CALENDAR_ID, 
	        'timeMin': (startDay.toISOString()),
	        'timeMax': (endDay.toISOString()),
	        'showDeleted': false,
	        'singleEvents': true,
	        'orderBy': 'startTime'
	    });

		//execute the request, and in the response method start the main processing of results
	    request.execute(function (resp) {
	        var events = resp.items;
	        var outputHTML = "<div>Calendar Events:</div>";

	        // get an object to store events by date
	        //
	        var EventsList = new Object;

	        // get today's date and format to allow easy comparison
	        //
	        var today = new Date();
	        var formattedToday = dateFormat(today, "mm/dd/yyyy");
	        Logger("Formatted today: " + formattedToday);
			
			// update the last updated span
			//
			document.getElementById("updated").innerHTML = "last updated: " + dateFormat(today, "HH:MM");

	        if (events.length > 0) {
	            outputHTML = outputHTML + ''; // start an output string
	            for (i = 0; i < events.length; i++) {
	                var event = events[i];
	                var allDay = false; // used to change the output string if there is no start/end time due to it being "all day".

	                // check start date - if there is no "dateTime" then it's an all day event
	                //
	                var startDateTime = event.start.dateTime;
	                var startDate = event.start.date;

	                // check end date/time
	                //
	                var endDateTime = event.end.dateTime;
	                var endDate = event.end.date;

					var fmStartDate = "";
					var fmEndDate = "";
					var fmOutputStartDate = "";
					var fmOutputEndDate = "";
					var fmOutputEndDateTime = "";

	               	if (!startDateTime) {
						allDay = true;
						Logger("all day event");
						fmStartDate = dateFormat(startDate, "mm/dd/yyyy");
						fmOutputStartDate = dateFormat(startDate, "dd/mm/yy");
						fmEndDate = dateFormat(endDate, "mm/dd/yyyy");
						fmOutputEndDate = dateFormat(endDate, "dd/mm/yy");
	                } else{
						var fmStartDate = dateFormat(startDateTime, "mm/dd/yyyy");
						var fmStartDateTime = dateFormat(startDateTime, "mm/dd/yy HH:MM");
						var fmOutputStartDateTime = dateFormat(startDateTime, "dd/mm/yy HH:MM");
			        	Logger("Formatted startdate: " + fmStartDate);
			        	Logger("Formatted startdatetime: " + fmStartDateTime);
						var fmEndDate = dateFormat(endDateTime, "mm/dd/yyyy");
						var fmEndDateTime = dateFormat(endDateTime, "mm/dd/yy HH:MM");
			        	Logger("Formatted enddate: " + fmEndDate);
			        	Logger("Formatted enddatetime: " + fmEndDateTime);

					}

	                var when = event.start.dateTime;
	                if (!when) {
	                    when = event.start.date;
	                }

	                var whenEnd = event.end.dateTime;
	                if (!whenEnd) {
	                    whenEnd = event.end.date;
	                }


	                // Check if the event is in the past (if so it must
	                // be multiple days since otherwise it would not appear in the results as they only
	                // started searching from today.
	                //

	                if(allDay){
						fmStartDateTime = fmStartDate;
						fmEndDateTime = fmEndDate;
						fmOutputStartDateTime = fmOutputStartDate;
						fmOutputEndDateTime = fmOutputEndDate;
					} else{
						
					}
	                Logger(fmStartDateTime + " <> " + formattedToday + " : " + event.summary);
	                var formattedDate = dateFormat(when, "mm/dd/yyyy");

					if (fmStartDateTime < formattedToday) {
						Logger("started in past: " + event.summary);

						// format the output for a multi day event
						//
	                    var spanningEvent = "<em>" + fmOutputStartDateTime + "-" + fmOutputEndDateTime + ":</em><br/>" + event.summary;
	                    if (WeatherList[formattedToday] != undefined) {
	                        WeatherList[formattedToday] = WeatherList[formattedToday] + spanningEvent + "|";

	                   // } else {
	                   //     WeatherList[formattedToday] = spanningEvent + "|";
	                    }
						Logger(WeatherList[formattedToday]);
					} else{
						//not in the past, so must be today or future, no need to show the date, just the time
						var eventStartTime = "";
						var eventEndTime = "";
						if (allDay) {
						    eventStartTime = "all day";
						    eventEndTime = "";
						} else{
							eventStartTime = dateFormat(startDateTime, "HH:MM");
							eventEndTime = " - " + dateFormat(endDateTime, "HH:MM");
						}

	                    var singleEvent = "<em>" + eventStartTime + eventEndTime + "</em>:<br/>" + event.summary ;
	                    if (WeatherList[formattedDate] != undefined) {
	                        WeatherList[formattedDate] = WeatherList[formattedDate] + singleEvent + "|";

	                   // } else {
	                     //   WeatherList[formattedDate] = singleEvent + "|";
	                    }

					}
	            }
	        } else {
	        }
	        Logger(EventsList);

	        // Now go through the event object by date and output results
	        //
	        var outputHTML = "<table>";
	        var counter=0;
	        for (var key in WeatherList) {
	            if (WeatherList.hasOwnProperty(key)) {

	                Logger("Got event details: " + WeatherList[key]);
	                var thisDay = new Date(key);
	                Logger(thisDay);
	                Logger("Converted: " + convertDate(thisDay));
	                var convertedDayOfDate = dateFormat(convertDate(thisDay), "dd");
	                var convertedDayNameOfDate = dateFormat(convertDate(thisDay), "ddd");

	                // now the events
	                //
	                var eventArray = WeatherList[key].split("|");
	                var daysEvents = "";
	                for (i = 1; i < eventArray.length; i++) { // start at 1 because 0th element is the weather info
	                    var eventHTML = "<span class='anEvent'>" + eventArray[i] + "</span>";
	                    daysEvents = daysEvents + eventHTML;
	                }

	                outputHTML = outputHTML + "<tr><td class='rowDay'><span class='name'>" + convertedDayNameOfDate + "</span><span class='day'>" + convertedDayOfDate + "</span>"+eventArray[0]+"</td><td class='events'>" + daysEvents + "</td></tr>";
	                //Do something
	                counter++;
	            }
	        }
	        outputHTML = outputHTML + "</table>";

	        var outputDiv = document.getElementById("calendar");
	        outputDiv.innerHTML = outputHTML;
	    });
	    function convertDate(inputFormat) {
	        function pad(s) { return (s < 10) ? '0' + s : s; }
	        var d = new Date(inputFormat);
	        return [pad(d.getMonth() + 1), pad(d.getDate()), d.getFullYear()].join('/');
	    }
	}

