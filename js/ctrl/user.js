app.controller("userController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", "moment", "$sce", function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies, moment, $sce) {

    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = true;

    $scope.user = {};
    $scope.refreshUser = function () {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/users/" + $stateParams.user,
            params: {},
            headers: {}
        }).then(function (response) {
            if (response.data.status == "ok") {
                $scope.user = response.data.user;

                $scope.meta.title = $scope.user.username + " | MCGameInfo";
            } else {
                $scope.user = {}
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            console.log(response)
            $scope.user = {}
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
        })
    }
    $scope.refreshUser();


    $timeout(function () {
        Materialize.updateTextFields();
    })
}]);