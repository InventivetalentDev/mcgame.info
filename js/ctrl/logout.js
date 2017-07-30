app.controller("logoutController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", "$interval","$localStorage", function ($scope, $state, $stateParams, $http, $timeout, $cookies, $interval,$localStorage) {

    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = false;

    $scope.meta.title = "Logout | MCGameInfo";

    $cookies.remove("uuid");
    delete $localStorage.uuid;
    delete $localStorage.token;

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