app.controller("serverListController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", "moment", function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies, moment) {
    $interval(function () {
        console.info("SERVER LIST")
    }, 1000)


    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = true;


    $scope.servers = [];
    $scope.pagination = {page: 1, pages: 0};
    $scope.refreshServers = function () {
        console.log($scope.pagination)
        $http({
            method: "GET",
            url: "https://api.mcgame.info/servers",
            params: {page: $scope.pagination.page},
            headers: {}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.servers = response.data.servers;
                $scope.pagination = response.data.pagination;
                console.log($scope.pagination)
                $.each($scope.servers, function (index, server) {
                    var i = index;
                    $http({
                        method: "POST",
                        url: "https://api.mcgame.info/util/pingServer",
                        data: {ip: server.ip}
                    }).then(function (response) {
                        if (response.data.status == "ok") {
                            $scope.servers[i].ping = response.data.ping;
                        }
                        console.log($scope.servers)
                    })
                })

                $timeout(function () {
                    $(".tooltipped").tooltip();
                }, 1000);
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            console.log(response)
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };
    $scope.refreshServers();
    $interval($scope.refreshServers, 1000 * 60 * 10);

    $timeout(function () {
        Materialize.updateTextFields();
    })
}]);