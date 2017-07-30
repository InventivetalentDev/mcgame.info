app.controller("changePasswordController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", function ($scope, $state, $stateParams, $http, $timeout, $cookies) {

    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = false;

    $scope.meta.title = "Change Password | MCGameInfo";

    $scope.username = $stateParams.username || $scope.account.username || "";
    $scope.oldPassword = "";
    $scope.password = "";

    $scope.tokenLogin = false;

    if ($stateParams.token) {
        $scope.oldPassword = $stateParams.token;
        $scope.tokenLogin = true;
    }

    $timeout(function () {
        Materialize.updateTextFields();
    })

    $scope.change = function () {
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/setPassword",
            data: {username: $scope.username, oldPassword: CryptoJS.SHA512($scope.username + $scope.oldPassword).toString(CryptoJS.enc.Hex), password: CryptoJS.SHA512($scope.username + $scope.password).toString(CryptoJS.enc.Hex), token: $scope.tokenLogin},
            headers: {'Content-Type': 'application/json'}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $cookies.remove("accessToken");
                Materialize.toast("Password changed", 1000);

                $timeout(function () {
                    // Go back to the login page, to log in again

                    $state.go("login", {username: $scope.username});
                }, 500);
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
        })
    }
}]);
