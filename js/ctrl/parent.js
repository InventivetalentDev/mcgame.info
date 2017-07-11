app.controller("parentController", ["$scope", "$cookies", "$timeout", function ($scope, $cookies, $timeout) {
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
        initTabs: function () {
            $timeout(function () {
                $("ul.tabs").tabs({
                    onShow: function (tab) {
                        console.log(tab)
                        location.hash = tab[0].id
                    }
                });
            }, 100);
        }
    }

    $scope.locationHash = location.hash;

    $scope.range = function(count){
        var a = [];
        for (var i = 0; i < count; i++) {
            a.push(i)
        }
        return a;
    }
    $scope.max=Math.max;
    $scope.min=Math.min;
}])