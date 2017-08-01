app.controller("loginRegisterController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$cookies", "$window", 'vcRecaptchaService', "$transition$", "$interval", "$localStorage", "ModalService", "$sce",'ngMeta', function ($scope, $state, $stateParams, $http, $timeout, $cookies, $window, vcRecaptchaService, $transition$, $interval, $localStorage, ModalService, $sce,ngMeta) {
    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = false;


    console.log($scope.footerVisible)

    console.log($stateParams)

    console.log("FROM: ")
    console.log($transition$.from());
    console.log("TO: ");
    console.log($transition$.to())

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

    $scope.loginRegisterSubmit = function () {
        if ($state.is('register'))
            $scope.register();
        if ($state.is('login'))
            $scope.login();
    };

    $scope.captcha = {
        key: "6LcMxCgUAAAAAJY0b5DLi9seYBuDQtgBlNZAvH6E",
        widgetId: null,
        response: null,
        onCreate: function (widgetId) {
            console.log("onCreate captcha");
            $scope.captcha.widgetId = widgetId;
        },
        onSuccess: function (response) {
            console.log("onSuccess captcha")
        },
        onExpire: function () {
            console.log("onExpire captcha");
            vcRecaptchaService.reload($scope.captcha.widgetId);
        }
    }

    $scope.register = function () {
        console.log("register()")
        if ($scope.username.length < 4 || $scope.username.length > 16) {
            Materialize.toast('Invalid Username', 4000)
            return;
        }
        console.log("reCaptcha: " + $scope.captcha.response)
        if (!$scope.captcha.response || $scope.captcha.response.length < 1) {
            Materialize.toast("Invalid reCaptcha", 4000);
            vcRecaptchaService.reload($scope.captcha.widgetId)
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
                        var authModal = undefined;
                        window.addEventListener("message", function (event) {
                            console.log(event);
                            if (event.origin != "https://api.mcgame.info")
                                return;
                            if (event.data) {
                                if (authModal) {
                                    authModal.element.modal("close");
                                }
                                var result = JSON.parse(event.data);
                                if (result.status === "ok") {
                                    Materialize.toast('User registered!', 1000)

                                    $timeout(function () {
                                        $state.go("login", {username: $scope.username, token: result.startToken});
                                    }, 500);
                                } else {
                                    Materialize.toast('Error: ' + result.msg, 4000)
                                    vcRecaptchaService.reload($scope.captcha.widgetId)
                                }
                            }
                        }, false);
                        // var loginPopup = window.open("https://api.mcgame.info/account/register?username=" + $scope.username + "&captcha=" + $scope.captcha.response, "Login", "width=750,height=500");
                        // try {
                        //     loginPopup.focus();
                        // } catch (e) {
                        //     Materialize.toast('Please enable Popups', 4000)
                        // }
                        ModalService.showModal({
                            templateUrl: "/pages/modal/mcauth.html",
                            controller: function ($scope, iframeUrl) {
                                $scope.iframeSrc = $sce.trustAsResourceUrl(iframeUrl);
                            },
                            inputs: {
                                iframeUrl: "https://api.mcgame.info/account/register?username=" + $scope.username + "&captcha=" + $scope.captcha.response
                            }
                        }).then(function (modal) {
                            authModal = modal;
                            modal.element.modal({
                                dismissible: false
                            })
                            modal.element.modal("open")
                        })
                    } else {
                        Materialize.toast('Unknown Username', 4000)
                    }
                });
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
                vcRecaptchaService.reload($scope.captcha.widgetId)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            vcRecaptchaService.reload($scope.captcha.widgetId)
        })
    };

    $scope.login = function () {
        console.log("login()")
        if ($scope.username.length < 4 || $scope.username.length > 16) {
            Materialize.toast("Invalid username length", 4000)
            return;
        }
        console.log("reCaptcha: " + $scope.captcha.response)
        if (!$scope.captcha.response || $scope.captcha.response.length < 1) {
            Materialize.toast("Invalid reCaptcha", 4000);
            vcRecaptchaService.reload($scope.captcha.widgetId)
            return;
        }

        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/login",
            data: {username: $scope.username, password: CryptoJS.SHA512($scope.username + $scope.password).toString(CryptoJS.enc.Hex), token: $scope.tokenLogin, captcha: $scope.captcha.response},
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

                    $cookies.put("uuid", response.data.uuid, {
                        expires: expires
                    });
                    $localStorage.uuid = response.data.uuid;
                    $localStorage.token = response.data.token;

                    $timeout(function () {
                        $state.go("accountOverview", {}, {location: "replace", reload: true});
                    }, 750);
                }
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
                vcRecaptchaService.reload($scope.captcha.widgetId)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            vcRecaptchaService.reload($scope.captcha.widgetId)
        });
    };
}]);