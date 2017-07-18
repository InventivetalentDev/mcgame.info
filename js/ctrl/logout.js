app.controller("logoutController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", function ($scope, $state, $stateParams, $http, $timeout, $cookies) {
    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();

    $cookies.remove("uuid");

    $http({
        method: "POST",
        url: "https://api.mcgame.info/account/logout"
    }).then(function (response) {
        console.log(response);

        if (response.data.status == "ok") {
            $timeout(function () {
                $state.go($stateParams.go || "index")
            }, 100);
        } else {
            Materialize.toast('Error: ' + response.data.msg, 4000)
        }
    }, function (response) {
        Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
    });
}]);