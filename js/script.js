var app = angular.module("infoApp", ["ngCookies", "ui.router"]);

app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
        .state("index", {
            url: "/",
            templateUrl: "/pages/index.html",
            controller: "indexController"
        })
        .state("login", {
            url: "/login?username&token",
            templateUrl: "/pages/login.html",
            controller: "loginRegisterController"
        })
        .state("register", {
            url: "/register?username",
            templateUrl: "/pages/login.html",
            controller: "loginRegisterController"
        })
        .state("logout", {
            url: "/logout",
            controller: "logoutController"
        })
        .state("changePassword", {
            url: "/account/changePassword?username&token",
            templateUrl: "/pages/account/changePassword.html",
            controller: "changePasswordController"
        })
        .state("accountOverview", {
            url: "/account",
            templateUrl: "/pages/account/overview.html",
            controller: "accountOverviewController"
        })
    $urlRouterProvider.when("", "/");
    $urlRouterProvider.otherwise("/");

    $locationProvider.html5Mode(true);
}]);

app.service("backend", function ($http) {
    this.request = function (path, method, data, headers) {
        return new Promise(
            function (resolve, reject) {
                $http({
                    method: method,
                    url: "https://api.mcgame.info" + path,
                    data: data,
                    headers: headers
                }).then(function (response) {
                    console.log(response)
                    if (response.data.status === "ok") {
                        resolve(response.data);
                    } else {
                        console.warn(response.data.msg)
                        reject(response.data)
                    }
                }, function (response) {
                    console.log(response)
                    reject(response.data)
                })
            }
        )
    };
    this.get = function (path) {
        return this.request(path, "GET", {}, {});
    };
    this.post = function (path, data) {
        return this.request(path, "POST", data || {}, {"Content-Type": "application/json"});
    };
});

app.controller("indexController", ["$scope", function ($scope) {

}]);

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
                    })

                    $timeout(function () {
                        $state.go("accountOverview", {}, {location: "replace", reload: true});
                    }, 750);
                }
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        });
    };
}]);

app.controller("changePasswordController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", function ($scope, $state, $stateParams, $http, $timeout, $cookies) {
    $scope.username = $stateParams.username || "";
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
        });
    }
}]);

app.controller("logoutController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", function ($scope, $state, $stateParams, $http, $timeout, $cookies) {
    $cookies.remove("uuid");
    $cookies.remove("accessToken");

    $state.go("login");
}]);

app.controller("accountOverviewController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", function ($scope, $state, $stateParams, $http, $timeout,$interval, $cookies) {
    var usernameCookie = $cookies.get("username");
    var uuidCookie = $cookies.get("uuid");
    var accessTokenCookie = $cookies.get("accessToken");

    if (!usernameCookie || !uuidCookie || !accessTokenCookie) {
        $state.go("logout");
        return;
    }

    $scope.account = {};

    $scope.refreshAccount = function () {
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account",
            data: {username: usernameCookie, uuid: uuidCookie, accessToken: accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.account = response.data.user;
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        })
    };
    $scope.refreshAccount();

    $interval($scope.refreshAccount, 1000 * 60 * 10);
    window.addEventListener("focus",function (event) {
        $scope.refreshAccount();
    })
}]);