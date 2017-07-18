var app = angular.module("infoApp", ["ngCookies", "ui.router", "angularMoment","angularModalService","vcRecaptcha"]);

app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", "$httpProvider", function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
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
            url: "/logout?go",
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
        .state("serverList",{
            url:"/servers",
            templateUrl:"/pages/servers.html",
            controller:"serverListController"
        })
    $urlRouterProvider.when("", "/");
    $urlRouterProvider.otherwise("/");

    $locationProvider.html5Mode(true);

    // Required for session cookies to be sent in $http
    $httpProvider.defaults.withCredentials = true;
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
    $scope.navbar.tabs=[];
$scope.navbar.initTabs();
}]);


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