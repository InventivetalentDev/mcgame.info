app.controller("loginRegisterController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", "$window", function ($scope, $state, $stateParams, $http, $timeout, $cookies, $window) {
    $scope.state = $state;

    console.log($stateParams)

    $scope.username = $stateParams.username || "";
    $scope.password = $stateParams.password || "";

    $scope.tokenLogin = false;// true, if it's the first time login using a generate token

    if ($stateParams.token) {
        $scope.password = $stateParams.token;
        $scope.tokenLogin = true;
    }

    $timeout(function () {
        Materialize.updateTextFields();
    })

    $scope.register = function () {
        console.log("register()")
        if ($scope.username.length < 4 || $scope.username.length > 16) {
            Materialize.toast('Invalid Username', 4000)
            return;
        }
        $http({
            method: "GET",
            url: "https://api.mcgame.info/account/checkUser",
            params: {username: $scope.username},
            headers: {'Content-Type': 'application/json'}
        }).then(function (response) {
            console.log(response)

            if (response.data.status == "ok") {
                $http({
                    method: "POST",
                    url: "https://api.mcgame.info/util/checkUsername",
                    data: {username: $scope.username},
                    headers: {'Content-Type': 'application/json'}
                }).then(function (response) {
                    console.log(response)
                    if (response.data.valid) {
                        //                    backend.post("/account/register",{test:"test"})
                        window.addEventListener("message", function (event) {
                            if (event.origin != "https://mcgame.info")
                                return;
                            console.log(event);
                            if (event.data) {
                                var result = JSON.parse(event.data);
                                if (result.status === "ok") {
                                    Materialize.toast('User registered!', 1000)

                                    $timeout(function () {
                                        $state.go("login", {username: $scope.username, token: result.startToken});
                                    }, 500);
                                } else {
                                    Materialize.toast('Error: ' + result.msg, 4000)
                                }
                            }
                        }, false);
                        var loginPopup = window.open("https://api.mcgame.info/account/register?username=" + $scope.username, "Login", "width=750,height=500");
                        try {
                            loginPopup.focus();
                        } catch (e) {
                            Materialize.toast('Please enable Popups', 4000)
                        }
                    } else {
                        Materialize.toast('Unknown Username', 4000)
                    }
                });
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
        })
    };

    $scope.login = function () {
        console.log("login()")
        if ($scope.username.length < 4 || $scope.username.length > 16) {
            Materialize.toast("Invalid username length", 4000)
            return;
        }

        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/login",
            data: {username: $scope.username, password: CryptoJS.SHA512($scope.username + $scope.password).toString(CryptoJS.enc.Hex), token: $scope.tokenLogin},
            headers: {'Content-Type': 'application/json'}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                if ($scope.tokenLogin) {
                    // Request an initial password
                    $state.go("changePassword", {username: $scope.username, token: $scope.password});
                } else {
                    Materialize.toast("Login successful", 4000)

                    var now = new $window.Date();
                    var expires = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

                    $cookies.put("username", response.data.username, {
                        expires: expires
                    });
                    $cookies.put("uuid", response.data.uuid, {
                        expires: expires
                    });
                    $cookies.put("accessToken", response.data.accessToken, {
                        expires: expires
                    });
                    $scope.refreshCookies();

                    $timeout(function () {
                        $state.go("accountOverview", {}, {location: "replace", reload: true});
                    }, 750);
                }
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
        });
    };
}]);