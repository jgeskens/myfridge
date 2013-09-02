var app = angular.module('MyFridgeApp', ['firebase']);

app.config(['$routeProvider', function($routeProvider){
	$routeProvider.
		when('/', {controller: 'MyFridgeHome', templateUrl: 'views/home.html'}).
		when('/history', {controller: 'MyFridgeHome', templateUrl: 'views/history.html'}).
		otherwise({redirectTo: '/'});
}]);

app.controller('MyFridgeHome', ['$scope', '$timeout', 'angularFire', 'angularFireAuth', function($scope, $timeOut, angularFire, angularFireAuth){

}]);


app.controller('MyFridgeBase', ['$scope', '$timeout', 'angularFire', 'angularFireAuth', function($scope, $timeOut, angularFire, angularFireAuth){
	$scope.loggingIn = false;
	$scope.loginForm = {};
	$scope.creatingAccount = false;

	var logger = function(msg){
		if (!$scope.debuglog)
			$scope.debuglog = [msg];
		else
			$scope.debuglog.push(msg);
	};

	var url='https://oemfoeland.firebaseio.com';

	$scope.$on("angularFireAuth:login", function(evt, user){
		$scope.loggingIn = false;
		$scope.loginError = null;
		var userUrl = url + '/users/' + $scope.user.provider + '/' + $scope.user.id;
		angularFire(userUrl, $scope, 'userdata', {}).then(function()
		{
			$timeOut(function(){
				if (!$scope.userdata.email)
					$scope.userdata.email = $scope.user.email;
			});
		});
	});

	$scope.$on("angularFireAuth:logout", function(evt){
		$scope.userdata = null;
	});

	$scope.$on("angularFireAuth:error", function(evt, error){
		$scope.loggingIn = false;
		$scope.loginError = error;
	});
	
	angularFireAuth.initialize(url, {scope: $scope, 'name': 'user'})

	$scope.login = function(){
		$scope.loggingIn = true;
		angularFireAuth.login('password', 
		{
			email: $scope.loginForm.email, 
			password: $scope.loginForm.password,
			rememberMe: true
		});
		$scope.loginForm.password = '';
	};

	$scope.logout = function(){
		angularFireAuth.logout();
	};

	$scope.create_account = function(){
		$scope.createAccountError = null;
		$scope.creatingAccount = true;
		angularFireAuth._authClient.createUser($scope.new_account.email, $scope.new_account.password, function(error, user){
			$scope.creatingAccount = false;
			if (!error){
				$scope.loggingIn = true;
				angularFireAuth.login('password',
				{
					email: user.email,
					password: $scope.new_account.password,
					rememberMe: true
				});
			}
			else
			{
				$scope.createAccountError = error;
			}
			$scope.new_account = {};
		});
	};

	$scope.login_github = function(){
		angularFireAuth.login('github', {rememberMe: true, scope: ''});
	};

	$scope.add_food = function(){
		var nf = $scope.newfood;
		var now = new Date();
		var expiry_date = null;

		if (nf.days)
		{
			var days = parseInt(nf.days);
			var ms = days * 1000 * 3600 * 24;
			expiry_date = new Date(now.valueOf() + ms);
		}
		else
		{
			expiry_date = new Date(nf.expiry_date);
		}

		if (!$scope.userdata.fridge)
			$scope.userdata.fridge = [];

		var new_id = $scope.userdata.fridge.length;
		$scope.userdata.fridge.push({
			id: new_id,
			name: nf.name,
			expiry_date: expiry_date,
			added: now,
			gone: false
		});
		$scope.newfood = {};
		$scope.$broadcast('foodAdded');
	};

	$scope.get_days_left = function(item){
		var now = new Date();
		return Math.round(((new Date(item.expiry_date)) - now) / (1000 * 3600 * 24));
	};

	$scope.get_item_class = function(item){
		var days = $scope.get_days_left(item);
		return {
			warning: days <= 4 && days > 2, 
			danger: days <= 2
		}
	};

	$scope.mark_gone = function(item){
		$scope.undoGone = item;
		$timeOut(function(){ $scope.undoGone = null; }, 8000);
		item.gone = true;
		item.when_gone = new Date();
		item.expired = false;
	};

	$scope.mark_expired = function(item){
		$scope.undoExpired = item;
		$timeOut(function(){ $scope.undoExpired = null; }, 8000);
		item.gone = true;
		item.when_gone = new Date();
		item.expired = true;
	};

	$scope.restoreItem = function(item){
		$scope.userdata.fridge[item.id].gone = false;
		item.gone = false;
	};

	$scope.mark_opened = function(item, days){
		var now = new Date();
		var days = parseInt(days);
		var ms = days * 1000 * 3600 * 24;
		item.expiry_date = new Date(now.valueOf() + ms);
	};
}]);

app.directive('focusOn', function(){
	return function(scope, elem, attr){
		scope.$on(attr.focusOn, function(e){
			elem[0].focus();
		});
	};
});
