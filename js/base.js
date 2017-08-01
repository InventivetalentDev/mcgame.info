var app = angular.module("infoApp", ["ngCookies", "ui.router", "angularMoment", "angularModalService", "vcRecaptcha", "ngSanitize", "ngStorage", "ngMeta"]);

app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", "$httpProvider", "ngMetaProvider", function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, ngMetaProvider) {
    $stateProvider
        .state("index", {
            url: "/",
            templateUrl: "/pages/index.html",
            controller: "indexController",
            data: {
                meta: {
                    title: "MCGameInfo",
                    titleSuffix:""
                }
            }
        })
        .state("login", {
            url: "/login?username&token",
            templateUrl: "/pages/login.html",
            controller: "loginRegisterController",
            data: {
                meta: {
                    title: "Login"
                }
            }
        })
        .state("register", {
            url: "/register?username",
            templateUrl: "/pages/login.html",
            controller: "loginRegisterController",
            data: {
                meta: {
                    title: "Register"
                }
            }
        })
        .state("logout", {
            url: "/logout?go",
            controller: "logoutController"
        })
        .state("changePassword", {
            url: "/account/changePassword?username&token",
            templateUrl: "/pages/account/changePassword.html",
            controller: "changePasswordController",
            data: {
                meta: {
                    title: "Change Password"
                }
            }
        })
        .state("accountOverview", {
            url: "/account",
            templateUrl: "/pages/account/overview.html",
            controller: "accountOverviewController",
            data: {
                meta: {
                    title: "Account"
                }
            }
        })
        .state("serverList", {
            url: "/servers",
            templateUrl: "/pages/servers.html",
            controller: "serverListController",
            data: {
                meta: {
                    title: "Servers"
                }
            }
        })
        .state("server", {
            url: "/s/:server",
            templateUrl: "/pages/server.html",
            controller: "serverController"
        })
        .state("user", {
            url: "/u/:user",
            templateUrl: "/pages/user.html",
            controller: "userController"
        })

        .state("downloadPlugin", {
            url: "/download/plugin",
            controller: "redirectController",
            params: {to: "http://download.inventivetalent.org/gh/MCGameInfoPlugin"}
        })

        .state("termsOfService", {
            url: "/legal/tos",
            templateUrl: "/pages/legal/terms-of-service.html"
        })
        .state("privacy", {
            url: "/legal/privacy",
            templateUrl: "/pages/legal/privacy.html"
        })
        .state("imprint", {
            url: "/legal/imprint",
            templateUrl: "/pages/legal/imprint.html"
        })
    $urlRouterProvider.when("", "/");
    $urlRouterProvider.otherwise("/");

    // https://github.com/angular-ui/ui-router/issues/50#issuecomment-50039600
    $urlRouterProvider.rule(function ($injector, $location) {
        var path = $location.url();

        // check to see if the path has a trailing slash
        if ('/' === path[path.length - 1]) {
            return path.replace(/\/$/, '');
        }

        if (path.indexOf('/?') > -1) {
            return path.replace('/?', '?');
        }

        return false;
    });

    $locationProvider.html5Mode(true);

    ngMetaProvider.useTitleSuffix(true);
    ngMetaProvider.setDefaultTitleSuffix(" | MCGameInfo");
    ngMetaProvider.setDefaultTitle("MCGameInfo");
    ngMetaProvider.setDefaultTag("image", "https://mcgame.info/favicon.png");


    // Required for session cookies to be sent in $http
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push(['$location', '$localStorage', function ($location, $localStorage) {
        return {
            'request': function (config) {
                if (config.url.indexOf("https://api.mcgame.info") == 0) {
                    config.headers = config.headers || {};
                    if ($localStorage.uuid) {
                        config.headers["X-User-Uuid"] = $localStorage.uuid;
                    }
                    if ($localStorage.token) {
                        config.headers.Authorization = 'Bearer ' + $localStorage.token;
                    }
                }
                return config;
            }
        };
    }]);
}])
    .run(['$transitions', '$rootScope', 'ngMeta', function ($transitions, $rootScope, ngMeta) {
        // https://github.com/vinaygopinath/ngMeta/issues/36#issuecomment-311581385 -> https://github.com/vinaygopinath/ngMeta/issues/25#issuecomment-268954483
        $transitions.onFinish({}, function (trans) {
            $rootScope.$broadcast('$routeChangeSuccess', trans.to());
        });

        ngMeta.init()
    }])

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
    $scope.navbar.tabs = [];
    $scope.navbar.initTabs();
    $scope.footer.visible = true;

    $scope.meta.title = "MCGameInfo";
}]);

app.controller("redirectController", ["$scope", "$state", "$stateParams", "$timeout", function ($scope, $state, $stateParams, $timeout) {
    if ($stateParams.to) {
        window.open($stateParams.to, $stateParams.target || "_self");
    }
}])


$(document).ready(function () {
    $(".button-collapse").sideNav({
        closeOnClick: true,
        draggable: true
    });

    $("ul.tabs").tabs();

    $(".tooltipped").tooltip();
})

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}