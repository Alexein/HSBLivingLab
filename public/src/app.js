var app = angular.module('HSB', ['ngMaterial', 'ngAnimate', 'ngRoute']);

app.config(['$routeProvider',
	function($routeProvider){
		$routeProvider
			.when('/', {
				templateUrl: 'src/view/home.html',
				controller: 'HSBController'
			})
			.when('/notification', {
				templateUrl: 'src/view/notification.html',
				controller: 'HSBController'
			})
			.when('/booking', {
				templateUrl: 'src/view/booking.html',
				controller: 'HSBController'
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

app.controller('HSBController', function($mdSidenav) {
  var vm = this;

  vm.toggleSidenav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };

});