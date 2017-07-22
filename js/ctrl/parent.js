app.controller("parentController", ["$scope", "$cookies", "$timeout","$http", "$state",function ($scope, $cookies, $timeout,$http,$state) {
    $scope.cookies = {
        username: "",
        uuid: ""
    };
    // $scope.refreshCookies = function () {
    //     $scope.cookies.username = $cookies.get("username");
    //     $scope.cookies.uuid = $cookies.get("uuid");
    // }
    // $scope.refreshCookies();

    $scope.navbar = {
        tabs: [],
        initTabs: function () {
            $timeout(function () {
                console.log("TABS")
                console.log($scope.navbar.tabs)
                $("ul.tabs").tabs({
                    onShow: function (tab) {
                        console.log(tab)
                        location.hash = tab[0].id
                    }
                });
            }, 100);
        }
    };
    $scope.footer={
        visible:true
    };

    $scope.account = {};
    $scope.refreshAccount = function (silent) {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/account",
            params: {uuid:  $cookies.get("uuid")}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.account = response.data.user;
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            console.log(response)
            if(!silent) {
                Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
                if (response.status == 403) {
                    $state.go("login", {reload: true})
                }
            }
        })
    };
    $scope.refreshAccount(true);

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