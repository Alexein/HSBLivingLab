var app = angular.module('StarterApp', ['ngMaterial', 'ngAnimate', 'ngRoute']);

app.config(['$routeProvider',
	function($routeProvider){
		$routeProvider
			.when('/', {
				templateUrl: 'src/view/home.html',
				controller: 'AppController'
			})
			.when('/about', {
				templateUrl: 'src/view/about.html',
				controller: 'AppController'
			})
			.when('/reports', {
				templateUrl: 'src/view/reports.html',
				controller: 'AppController'
			})
			.when('/myneighbours', {
				templateUrl: 'src/view/myneighbours.html',
				controller: 'AppController'
			})
			.when('/support', {
				templateUrl: 'src/view/support.html',
				controller: 'AppController'
			})
			.otherwise({
				redirectTo: '/'
			});
	}
]);

app.controller('AppController', function($mdSidenav) {
  var vm = this;

  vm.toggleSidenav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };

});