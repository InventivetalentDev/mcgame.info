app.controller("parentController", ["$scope", "$cookies", function ($scope, $cookies) {
    $scope.cookies = {
        username: "",
        uuid: ""
    };
    $scope.refreshCookies = function () {
        $scope.cookies.username = $cookies.get("username");
        $scope.cookies.uuid = $cookies.get("uuid");
    }
    $scope.refreshCookies();

    $scope.navbar = {
        tabs: []
    }
}])