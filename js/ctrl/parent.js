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
        tabs: [],
        initTabs:function () {
            $timeout(function () {
                $("ul.tabs").tabs({
                    onShow:function (tab) {
                        console.log(tab)
                        location.hash=tab[0].id
                    }
                });
            }, 100);
        }
    }

    $scope.locationHash = location.hash;
}])