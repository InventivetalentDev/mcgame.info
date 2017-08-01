app.controller("userController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", "moment", "$sce", "$window", 'ngMeta', function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies, moment, $sce, $window, ngMeta) {

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

                ngMeta.setTitle($scope.user.username)
                ngMeta.setTag('image', $sce.trustAsResourceUrl("https://minotar.net/avatar/" + $scope.user.username + "/128"));
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

    $window.onfocus = function () {
        console.log("onfocus")
        $scope.refreshUser();
    };
    $scope.$on('$destroy', function () {
        $window.onfocus = false;
    });

    $timeout(function () {
        Materialize.updateTextFields();
    })
}]);