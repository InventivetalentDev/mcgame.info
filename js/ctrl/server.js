app.controller("serverController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", "moment", "$sce", function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies, moment, $sce) {

    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = true;

    $scope.server = {};
    $scope.refreshServer = function () {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/servers/" + $stateParams.server,
            params: {},
            headers: {}
        }).then(function (response) {
            if (response.data.status == "ok") {
                $scope.server = response.data.server;
                $scope.server.players = response.data.players;

                $http({
                    method: "GET",
                    url: "https://mcapi.ca/query/" + $scope.server.ip + "/info",
                    withCredentials: false
                }).then(function (response) {
                    console.log(response.data)
                    var data = response.data;

                    data.trustedMotd = $sce.trustAsHtml(data.htmlmotd)
                    $scope.server.ping = data;
                });
            } else {
                $scope.server = {}
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            console.log(response)
            $scope.server = {}
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
        })
    }
    $scope.refreshServer();


    $timeout(function () {
        Materialize.updateTextFields();
    })
}]);