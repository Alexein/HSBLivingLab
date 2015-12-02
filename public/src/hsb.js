var useServer = false;

var app = angular.module('HSB', ['ngMaterial', 'ngAnimate', 'ngRoute']);

app.config(['$routeProvider',
	function($routeProvider){
		$routeProvider
			.when('/', {
				templateUrl: 'src/view/home.html',
				controller: 'HomeController'
			})
			.when('/login', {
				templateUrl: 'src/view/login.html',
				controller: 'LoginController'
			})
			.when('/notification', {
				templateUrl: 'src/view/notification.html',
				controller: 'NotificationController'
			})
			.when('/booking', {
				templateUrl: 'src/view/booking.html',
				controller: 'BookingController'
			})
			.when('/adboard', {
				templateUrl: 'src/view/adboard.html',
				controller: 'HSBController'
			})
			.when('/reports', {
				templateUrl: 'src/view/reports.html',
				controller: 'HSBController'
			})
			.when('/profile', {
				templateUrl: 'src/view/profile.html',
				controller: 'HSBController'
			})
			.when('/apartment', {
				templateUrl: 'src/view/apartment.html',
				controller: 'HSBController'
			})
			.when('/support', {
				templateUrl: 'src/view/support.html',
				controller: 'HSBController'
			})
			.when('/logout', {
				templateUrl: 'src/view/logout.html',
				controller: 'HSBController'
			})
			.when('/about', {
				templateUrl: 'src/view/about.html',
				controller: 'HSBController'
			})
			.when('/reports', {
				templateUrl: 'src/view/reports.html',
				controller: 'HSBController'
			})
			.when('/myneighbours', {
				templateUrl: 'src/view/myneighbours.html',
				controller: 'HSBController'
			})
			.otherwise({
				redirectTo: '/'
			});
	}
]);

var notificationTypeMessage = 1;
var notificationTypeAnnouncement = 8;
var notificationTypeReminder = 64;
var notificationTypeAlert = 512;

var notificationStatusNew = 1;
var notificationStatusRead = 8;
var notificationStatusRemoved = 64;

var resourceIdLaundry = 10;

var reminderEmail = 1;
var reminderSMS = 2;

var reminder10min = 4;
var reminder30min = 8;
var reminder1hour = 16;
var reminder5hours = 64;
var reminder1day = 256;
var reminder1week = 2048;

function handleReply(scope, data, location, success) {
    if (data.loginRequired) {
        location.setPath('/login');
    } else if (data.error != null) {
        alert('Error: ' + data.error);
    } else {
        success();
    }
}

function remove(array, element) {
    var index = array.indexOf(element);
    if (index >= 0) {
        array.splice(index, 1);
    }
}

function resetState(scope) {
    scope.profileEdit = {};
    scope.apartmentEdit = {};
    scope.bookingView = 'none';
    scope.bookingResource = 'none';
    scope.newBookingItem = false;    
    scope.newBookingQueue = false;    
    scope.notificationItem = null;
    scope.notificationItem = null;
    scope.notificationView = {mark: scope.notificationMarks[0], view: scope.notificationViews[0]};
    scope.messageData = {isRecipient: {}, createMessage: false}
}

function resetData(scope) {
    scope.profileView = 'profile'
    scope.apartmentView = 'apartment'
    scope.loginData = {email : "", password : ""};
    resetState(scope);
}

function loadCurrentUser(http, scope, location) {
    if (!useServer) {
        scope.user = scope.users[0];
        return;
    }
    if (scope.sessionKey != null && scope.user == null) {
        scope.user = {};
        http.post('/currentUser', {sessionKey: scope.sessionKey}).success(function(data) {
            handleReply(scope, data, location, function() {
                var user = data.user;
                scope.user = user;
            });
        }).error(function() {
            alert("error");
        });
    }
}

function zeroPad(s) {
    if (s >= 10) {
        return "" + s;
    } else {
        return "0" + s;
    }
}

function formatDatetime(datetime) {
    if (datetime == null) {
        return null;
    }
    var year = datetime.getYear() + 1900;
    var month = datetime.getMonth() + 1;
    var day = datetime.getDate();
    var hour = datetime.getHours();
    var minute = datetime.getMinutes();
    return year + "-" + zeroPad(month) + "-" + zeroPad(day) + " " + zeroPad(hour) + ":" + zeroPad(minute);
}

function formatDate(date) {
    if (date == null) {
        return null;
    }
    var year = date.getYear() + 1900;
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + "-" + zeroPad(month) + "-" + zeroPad(day);
}

function formatShortDate(date) {
    if (date == null) {
        return null;
    }
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return day + "/" + month;
}

function bookingFormat(unitType, vacancies) {
    if (vacancies == null) {
        return "Fully booked";
    }
    var result = "";
    var v = vacancies[unitType.typeId];
    if (v != null) {
        if (v[0].length > 0) {
            result += v[0].length + "+" + v[1].length + " " + unitType.name + " "; 
        } else {
            result += v[1].length + " " + unitType.name + " "; 
        }
        var queue = v[2];
        if (queue != null && queue.length > 0) {
            result += "(" + queue.length + " i kö) ";
        }
    }
    return result;
}

function setupScope(scope) {
    scope.permissionView = 4;
    scope.permissionNotify = 32;
    scope.permissionEdit = 256;
    scope.permissionAdmin = 2048;
    scope.birthYears = [1999, 1998, 1997];
    scope.dateMonths = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 
                         'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
    scope.dateDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    scope.occupations = [{name: 'Student', occupationId: 1},
                         {name: 'Advokat', occupationId: 2},
                         {name: 'Läkare', occupationId: 3}];
    scope.notificationMarks = [{name: 'Mark as', markId: 0},
                                {name: 'Read', markId: 1},
                                {name: 'New', markId: 2}];
    scope.notificationViews = [{name: 'View all', viewId: 1},
                                {name: 'View unread', viewId: 2}];
    scope.users = [
        {userId: 1000, firstName: "Sven", lastName: "Trebard", email: "sven.trebard@tieto.com", password: "trebard2"},
        {userId: 1001, firstName: "Giuseppe", lastName: "Perri", email: "giuseppe.perri@tieto.com", password: "perri2"},
        {userId: 1002, firstName: "Malin", lastName: "Bergqvist", email: "malin.bergqvist@tieto.com", password: "bergqvist2"},
        {userId: 1003, firstName: "Isabelle", lastName: "Månsson", email: "isabelle.mansson@tieto.com", password: "mansson2"}
    ];

    scope.bookings = [
        {name: 'Laundry', bookingId: 1},
        {name: 'Spaces', bookingId: 2, subBookings: [
            {name: "Gym", subBookingId: 1},
            {name: "Sauna", subBookingId: 2},
            {name: "Workshop", subBookingId: 3},
            {name: "Barbeque", subBookingId: 4},
            {name: "Kitchen", subBookingId: 5},
            {name: "Kids playroom", subBookingId: 6}]},
        {name: 'Tools', bookingId: 3},
        {name: 'Services', bookingId: 4},
        {name: 'Vehicles', bookingId: 5},
        {name: 'Others', bookingId: 6}
    ];

    scope.notifications = [];
    if (!useServer) {
        for (var i = 0; i < 10; i++) {
            var n = {typeId: 1,
                     fromUser: {firstName: "First " + i, lastName: "Last " + i}, 
                     subject: "Hello " + i, 
                     body: "Body " + i, 
                     creationTime: "2015-11-" + zeroPad(i + 1)};
            scope.notifications.push(n);
        }
        var slotsAllHours = [];
        for (var i = 0; i < 24; i++) {
            var entry = {slotId: i, name: zeroPad(i) + ":00-" + zeroPad(i + 1) + ":00"}
            slotsAllHours.push(entry);
        }
        var slotsLaundryHours = [
            {slotId: 0, name: "07-10"},
            {slotId: 1, name: "10-13"},
            {slotId: 2, name: "13-16"},
            {slotId: 3, name: "16-19"},
            {slotId: 4, name: "19-21"}
        ]
        scope.bookingDataMap = {
            'laundry': {
                slots: slotsLaundryHours,
                unitTypes: [
                    {typeId: 1, name: "Tvättmaskiner", units: [
                        {unitId: 1, name: "W1"},
                        {unitId: 2, name: "W2"},
                        {unitId: 3, name: "W3"},
                        {unitId: 4, name: "W4"}]},
                    {typeId: 2, name: "Torktumlare", units: [
                        {unitId: 1, name: "D1"},
                        {unitId: 2, name: "D2"},
                        {unitId: 3, name: "D3"},
                        {unitId: 4, name: "D4"}]}
                ],
                bookingFormat: bookingFormat
            },
            'default': {
                slots: slotsAllHours,
                unitTypes: [{typeId: 1, units: [{unitId: 1}]}],
                bookingFormat: bookingFormat
            }
        }
    }
    scope.weekdays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
    // Set the first date of this week
    scope.calendarStart = new Date();
    var dow = (scope.calendarStart.getDay() + 6) % 7; // Monday, not sunday
    scope.calendarStart.setDate(scope.calendarStart.getDate() - dow);
    scope.weekDates = [];
    for (var i = 0; i < 7; i++) {
        var d = new Date(scope.calendarStart.getTime());
        d.setDate(d.getDate() + i);
        var dStr = formatShortDate(d);
        scope.weekDates.push(dStr);
    }
    // Booking map: {day:{time:{type:{'units:'{unit:bookingId},'queue:'[[bookingId,count]]}}}} where bookingId = 1 for self, 0 for unknown, id for known
}

function setLocalDayBookings(scope) {
    scope.dayBookingMap = {
        'laundry': {
            1: {0: {1: {units: {1:0,2:0,3:0,4:0}, queue: [[1,2]]}, 2: {units: {1:0,2:0,3:0,4:0}}}, 
                3: {1: {units: {1:1,2:0,3:0,4:0}}, 2: {units: {1:0,2:0,3:0,4:0}}}, 
                4: {1: {units: {1:1,2:0}}, 2: {units: {1:1,2:0}}}},
            2: {0: {1: {units: {1:1,2:0}, queue: [[0,1]]}, 2: {units: {1:1,2:0}}}, 
                1: {1: {units: {1:1,2:0}}, 2: {units: {1:1,2:0}}}, 
                2: {1: {units: {1:1,2:0}}, 2: {units: {1:1,2:0}}}, 
                3: {1: {units: {1:1,2:0}}, 2: {units: {1:1,2:0}}}, 
                4: {1: {units: {1:1,2:0}}, 2: {units: {1:1,2:0}}}}
        },
        'gym': {
            3: {0: {1: {units: {1:0}}}, 
                3: {1: {units: {1:0}}}, 
                4: {1: {units: {1:1}}}},
            4: {0: {1: {units: {1:1}}}, 
                1: {1: {units: {1:0}}}, 
                2: {1: {units: {1:1,2:0}}}, 
                3: {1: {units: {1:1,2:0}}}, 
                4: {1: {units: {1:1,2:0}}}}
        }
    }
}

app.service('dataService', function($http) {
    delete $http.defaults.headers.common['X-Requested-With'];
    this.login = function(scope, rootScope, location) {
        $http.post('/login', scope.loginData).success(function(data){
            var sessionKey = data.sessionKey;
            rootScope.sessionKey = sessionKey;
            rootScope.hsbTitle = data.title;
            var systemPermission = data.systemPermission;
            rootScope.systemPermission = systemPermission;
            
            rootScope.bookingDataMap = data.resources;
            for (var i in data.resources) {
                var resource = data.resources[i];
                resource.bookingFormat = bookingFormat;
            }
            location.path('/')
        }).error(function() {
            alert("error");
        });
    }
    this.loadNotifications = function(scope, typeMask, statusMask) {
        if (!useServer) {
            return;
        }
        $http.post('/notifications', {sessionKey: scope.sessionKey,
                                     typeMask: typeMask,
                                     statusMask: statusMask}).success(function(data){
            scope.notifications = data
        }).error(function() {
            alert("error");
        });
    }
    this.sendMessage = function(scope) {
        if (!useServer) {
            scope.messageData.createMessage = false;
            return;
        }
        var subject = scope.messageData.subject;
        var body = scope.messageData.body;
        var recipients = [];
        for (var i = 0; i < scope.users.length; i++) {
            var user = scope.users[i];
            var isRecipient = scope.messageData.isRecipient[user.userId];
            if (isRecipient == true) {
                recipients.push(user.userId);
            }
        }
        if (recipients.length == 0) {
            alert('The message has no recipients');
            return;
        }
        $http.post('/sendMessage', {sessionKey: scope.sessionKey,
                                   subject: subject,
                                   body: body,
                                   recipients: recipients}).success(function(data){
            scope.messageData.createMessage = false;
        }).error(function() {
            alert("error");
        });
    }
    this.loadBookings = function(scope, location) {
        if (!useServer) {
            scope.dayBookings = scope.dayBookingMap[scope.bookingResource];
            return;
        }
        scope.dayBookings = {};
        var resourceName = scope.bookingResource;
        var calenderStart = formatDate(scope.calendarStart);
        var dayCount = 7;
        $http.post('/bookings', {sessionKey: scope.sessionKey,
                                     resourceName: resourceName,
                                    calendarStart: calenderStart,
                                    dayCount: dayCount}).success(function(data){
            handleReply(scope, data, location, function() {
                scope.dayBookings = data;
            });
        }).error(function() {
            alert("error");
        });
    }
    this.setBooking = function(scope, booking) {
        if (!useServer) {
            return;
        }
        $http.post('/setBooking', {sessionKey: scope.sessionKey,
                                     booking: booking}).success(function(data){
            scope.loadBookings();
        }).error(function() {
            alert("error");
        });
    }
    this.setQueue = function(scope, booking) {
        if (!useServer) {
            return;
        }
        $http.post('/setQueue', {sessionKey: scope.sessionKey,
                                        booking: booking}).success(function(data){
            scope.loadBookings();
        }).error(function() {
            alert("error");
        });
    }
    this.createBackup = function(scope) {
        if (!useServer) {
            return;
        }
        $http.post('/createBackup', {sessionKey: scope.sessionKey}).success(function(data){
            var i = 0;
        }).error(function() {
            alert("error");
        });
    }
});

app.controller('LoginController', function($scope, $rootScope, $location, $http, $mdSidenav, dataService) {
    $scope.selectUser = function(user) {
        $scope.loginData.email = user.email; 
        $scope.loginData.password = user.password;
    }
    $scope.login = function() {
        if (!useServer) {
            $rootScope.sessionKey = "abc";
            $location.path('/');
            return;
        }
        dataService.login($scope, $rootScope, $location);
    }
});

app.controller('HomeController', function($scope, $rootScope, $http, $mdSidenav, dataService) {
  dataService.loadNotifications($rootScope, notificationTypeMessage, notificationStatusNew + notificationStatusRead);
});

app.controller('NotificationController', function($scope, $rootScope, $http, $mdSidenav, dataService) {
  dataService.loadNotifications($rootScope, notificationTypeMessage, notificationStatusNew + notificationStatusRead);
});

app.controller('BookingController', function($scope, $rootScope, $location, $http, $mdSidenav, dataService) {
  if (!useServer) {
      setLocalDayBookings($rootScope);
  }
    $scope.selectBookingView = function(bookingView) {
        $scope.bookingView = bookingView;
        $scope.bookingResource = 'none';
    }
    $scope.loadBookings = function() {
        dataService.loadBookings($scope, $location);
    }
    $scope.selectBookingResource = function(bookingResource) {
        $scope.bookingResource = bookingResource;
        $scope.bookingData = $scope.bookingDataMap[bookingResource];
        if ($scope.bookingData == null) {
            $scope.bookingData = $scope.bookingDataMap['default'];
        }
        $scope.loadBookings();
    }
    $scope.getTypeBookings = function(dayId, slotId, create) {
        var dayBookings = $scope.dayBookings;
        if (dayBookings == null) {
            if (create) {
                dayBookings = {};
                $scope.dayBookings = dayBookings;
            } else {
                return null;
            }
        }
        var timeBookings = dayBookings[dayId];
        if (timeBookings == null) {
            if (create) {
                timeBookings = {};
                dayBookings[dayId] = timeBookings;
            } else {
                return null;
            }
        }
        var typeBookings = timeBookings[slotId];
        if (typeBookings == null) {
            if (create) {
                typeBookings = {};
                timeBookings[slotId] = typeBookings;
            }
        }
        return typeBookings;
    }
    $scope.getVacancies = function(dayId, slotId) {
        var unitTypes = $scope.bookingData.unitTypes;
        var typeBookings = $scope.getTypeBookings(dayId, slotId, false);
        var vacancies = {};
        for (var i = 0; i < unitTypes.length; i++) {
            var unitType = unitTypes[i];
            var bookedUnits = null;
            var queue = null;
            var v = [[], [], null]; // Self, vacancies, queue
            if (typeBookings != null) {
                var typeBooking = typeBookings[unitType.typeId];
                if (typeBooking != null) {
                    bookedUnits = typeBooking['units'];
                    v[2] = typeBooking['queue'];
                }
            }
            vacancies[unitType.typeId] = v;
            for (var u = 0; u < unitType.units.length; u++) {
                var unit = unitType.units[u];
                var bookedSelf = false;
                var bookedOthers = false;
                if (bookedUnits != null) {
                    var booker = bookedUnits[unit.unitId];
                    if (booker != null) {
                        if (booker == 1) {
                            bookedSelf = true;
                        } else {
                            bookedOthers = true;
                        }
                    }
                }
                if (bookedSelf) {
                    v[0].push(unit);
                } else if (!bookedOthers) {
                    v[1].push(unit);
                }
            }
        }
        return vacancies;
    }
    $scope.bookingDescription = function(dayId, slotId) {
        var unitTypes = $scope.bookingData.unitTypes;
        var vacancies = $scope.getVacancies(dayId, slotId);
        return $scope.bookingData.bookingFormat(unitTypes, vacancies); 
    }
    $scope.hasVacancies = function(dayId, slotId) {
        var vacancies = $scope.getVacancies(dayId, slotId);
        for (typeId in vacancies) {
            var v = vacancies[typeId];
            var ownUnits = v[0];
            var vacantUnits = v[1];
            if (ownUnits.length > 0 || vacantUnits.length > 0) {
                return true;
            }
        }
        return false;
    }
    $scope.bookUnit = function(dayId, slotId) {
        $scope.bookingDayId = dayId;
        $scope.bookingSlotId = slotId;
        if ($scope.hasVacancies(dayId, slotId)) {
            $scope.showNewBooking();
        } else {
            $scope.showNewQueue();
        }
    }
    $scope.isBookable = function(unitType, unit) { // true if free or booked by self
        var typeBookings = $scope.getTypeBookings($scope.bookingDayId, $scope.bookingSlotId, false);
        if (typeBookings == null) {
            return true;
        }
        var typeBooking = typeBookings[unitType.typeId];
        if (typeBooking == null) {
            return true;
        }
        var unitBookings = typeBooking['units'];
        if (unitBookings == null) {
            return true;
        }
        var unitBooking = unitBookings[unit.unitId];
        if (unitBooking == null) {
            return true;
        }
        return unitBooking == 1;
    }
    $scope.showNewBooking = function() {
        $scope.newBookingItem = true;
        $scope.newBookingQueue = false;
        $scope.bookingEdit = {type: {}, medium: {}, time: {}};
        var unitTypes = $scope.bookingData.unitTypes;
        var typeBookings = $scope.getTypeBookings($scope.bookingDayId, $scope.bookingSlotId, true);
        for (var i = 0; i < unitTypes.length; i++) {
            var unitType = unitTypes[i];
            var typeBooking = typeBookings[unitType.typeId];
            if (typeBooking == null) {
                typeBooking = {};
                typeBookings[unitType.typeId] = typeBooking;
            }
            var bookedUnits = typeBooking['units'];
            if (bookedUnits == null) {
                bookedUnits = {};
                typeBooking['units'] = bookedUnits;
            }
            var bu = {}
            $scope.bookingEdit.type[unitType.typeId] = bu;
            for (var u = 0; u < unitType.units.length; u++) {
                var unit = unitType.units[u];
                if ($scope.isBookable(unitType, unit)) {
                    var booked = bookedUnits[unit.unitId];
                    if (booked != null) {
                        bu[unit.unitId] = true;
                    } else {
                        bu[unit.unitId] = false;
                    }
                }
            }
        }
    }
    $scope.isBooked = function(unitType, unit) {
        var bookingEdit = $scope.bookingEdit;
        if (bookingEdit == null) {
            return false;
        }
        var units = bookingEdit.type[unitType.typeId];
        if (units == null) {
            return false;
        }
        var booked = units[unit.unitId];
        return booked == true;
    }
    $scope.setBooking = function() {
        var unitTypes = $scope.bookingData.unitTypes;
//        var typeBookings = $scope.getTypeBookings($scope.bookingDayId, $scope.bookingSlotId, true);
        var date = new Date($scope.calendarStart.getTime());        
        var addDays = $scope.bookingDayId;
        date.setDate(date.getDate() + addDays);
        var booking = {resource: $scope.bookingResource, date: formatDate(date), slot: $scope.bookingSlotId, type: {}};
        for (var i = 0; i < unitTypes.length; i++) {
            var unitType = unitTypes[i];
            var units = [];
            booking.type[unitType.typeId] = units;
            for (var u = 0; u < unitType.units.length; u++) {
                var unit = unitType.units[u];
                if ($scope.isBookable(unitType, unit)) {
                    var booked = $scope.bookingEdit.type[unitType.typeId][unit.unitId];
                    if (booked) {
                        units.push(unit.unitId);
                    }
                }
            }
        }
        booking.media = 0
        if ($scope.bookingEdit.medium[reminderEmail] == true) {
            booking.media += reminderEmail;
        }
        if ($scope.bookingEdit.medium[reminderSMS] == true) {
            booking.media += reminderSMS;
        }
        booking.times = 0
        if ($scope.bookingEdit.time[reminder10min] == true) {
            booking.times += reminder10min;
        }
        if ($scope.bookingEdit.time[reminder30min] == true) {
            booking.times += reminder30min;
        }
        if ($scope.bookingEdit.time[reminder1hour] == true) {
            booking.times += reminder1hour;
        }
        if ($scope.bookingEdit.time[reminder5hours] == true) {
            booking.times += reminder5hours;
        }
        if ($scope.bookingEdit.time[reminder1day] == true) {
            booking.times += reminder1day;
        }
        if ($scope.bookingEdit.time[reminder1week] == true) {
            booking.times += reminder1week;
        }
        dataService.setBooking($scope, booking)
        $scope.newBookingQueue = false;
        $scope.newBookingItem = false;
    }    
    $scope.showNewQueue = function() {
        var typeBookings = $scope.getTypeBookings($scope.bookingDayId, $scope.bookingSlotId, true);
        var unitTypes = $scope.bookingData.unitTypes;
        $scope.queueData = {type: {}, alert: {}, autobook: false, medium: {}, time: {}};
        for (var i = 0; i < unitTypes.length; i++) {
            var unitType = unitTypes[i];
            var count = 0;
            var typeBooking = typeBookings[unitType.typeId];
            if (typeBooking != null) {
                var queue = typeBooking['queue'];
                if (queue != null) {
                    for (var j = 0; j < queue.length; j++) {
                        var q = queue[j];
                        if (q[0] == 1) {
                            count = q[1];
                        }
                    }
                }
            }
            $scope.queueData.type[unitType.typeId] = {queue: queue, count: count, max: unitType.units.length};
        }
        $scope.newBookingQueue = true;
        $scope.newBookingItem = false;
    }
    $scope.setQueue = function() {
        var unitTypes = $scope.bookingData.unitTypes;
//        var typeBookings = $scope.getTypeBookings($scope.bookingDayId, $scope.bookingSlotId, true);
        var date = new Date();
        date.setDate($scope.calendarStart.getDate() + $scope.bookingDayId);
        var booking = {resource: $scope.bookingResource, date: formatDate(date), slot: $scope.bookingSlotId, type: {}};
        for (var i = 0; i < unitTypes.length; i++) {
            var unitType = unitTypes[i];
            var units = [];
            booking.type[unitType.typeId] = $scope.queueData.type[unitType.typeId].count;
        }
        booking.alert = 0
        if ($scope.queueData.alert[reminderEmail] == true) {
            booking.alert += reminderEmail;
        }
        if ($scope.queueData.alert[reminderSMS] == true) {
            booking.alert += reminderSMS;
        }
        booking.autobook = $scope.queueData.autobook;
        booking.media = 0
        if ($scope.queueData.medium[reminderEmail] == true) {
            booking.media += reminderEmail;
        }
        if ($scope.queueData.medium[reminderSMS] == true) {
            booking.media += reminderSMS;
        }
        booking.times = 0
        if ($scope.queueData.time[reminder10min] == true) {
            booking.times += reminder10min;
        }
        if ($scope.queueData.time[reminder30min] == true) {
            booking.times += reminder30min;
        }
        if ($scope.queueData.time[reminder1hour] == true) {
            booking.times += reminder1hour;
        }
        if ($scope.queueData.time[reminder5hours] == true) {
            booking.times += reminder5hours;
        }
        if ($scope.queueData.time[reminder1day] == true) {
            booking.times += reminder1day;
        }
        if ($scope.queueData.time[reminder1week] == true) {
            booking.times += reminder1week;
        }
        dataService.setQueue($scope, booking)
        $scope.newBookingQueue = false;
        $scope.newBookingItem = false;
    }    
    $scope.createNumberArray = function(count) {
        var a = [];
        for (var i = 0; i < count; i++) {
            a.push(i);
        }
        return a;
    }
    $scope.clearBooking = function() {
        $scope.newBookingQueue = false;
        $scope.newBookingItem = false;
    }
    $scope.isShowingNewBooking = function() {
        return $scope.newBookingItem == true;
    }
    $scope.isShowingNewQueue = function() {
        return $scope.newBookingQueue == true;
    }
});

app.controller('HSBController', function($scope, $rootScope, $location, $http, $mdSidenav, dataService) {
    if ($rootScope.sessionKey == null) {
        $location.path('/login')
    }
    var vm = this;

    vm.toggleSidenav = function(menuId) {
      $mdSidenav(menuId).toggle();
    };

    $scope.setContent = function(contentId) {
        resetState($scope);
//        $($scope.contentId).hide(1000)
//        $scope.contentId = contentId;
//        $($scope.contentId).show(1000)
    }
    $scope.loadCurrentUser = function() {
        loadCurrentUser($http, $scope);
    }
    $scope.hasContent = function(contentId) {
        var pid = $scope.contentId;
        return $scope.contentId == contentId;
    }
    $scope.hasSystemPermission = function(permission) {
        var systemPermission = $scope.systemPermission;
        return (systemPermission & permission) > 0;
    }
    $scope.logout = function() {
        $rootScope.sessionKey = null;
        $scope.setContent('login');
    }
    $scope.createBackup = function() {
        dataService.createBackup($scope);
    }
    $scope.selectProfileView = function(profileView) {
        $scope.profileView = profileView;
    }
    $scope.selectApartmentView = function(apartmentView) {
        $scope.apartmentView = apartmentView;
    }
    $scope.selectNotificationItem = function(notificationItem) {
        $scope.notificationItem = notificationItem;
    }
    $scope.changedNotificationSelectAll = function() {
        for (var i = 0; i < $scope.notifications.length; i++) {
            var n = $scope.notifications[i];
            n.isSelected = $scope.notificationView.selectAll
        }
    }
    $scope.selectNotification = function(notificationItem) {
        $scope.notificationItem = notificationItem;
    }
    $scope.sendMessage = function() {
        dataService.sendMessage($scope);
    }

    setupScope($rootScope);
    resetData($scope);
    configScope($scope);

});

