var app = angular.module("infoApp", ["ngCookies", "ui.router"]);

app.factory("httpAuthenticator", ["$cookies", function () {
    return {
        request: function (config) {
            var usernameCookie = $cookies.get("username");
            var uuidCookie = $cookies.get("uuid");
            var accessTokenCookie = $cookies.get("accessToken");

            if (accessTokenCookie)
                config.headers["Access-Token"] = accessTokenCookie;
            // if(uuidCookie)
            //     config.data["uuid"] = uuidCookie;
            // if(usernameCookie)
            //     config.data["username"] = usernameCookie;

            return config;
        }
    }
}])

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
            url: "/logout?login",
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

    // $httpProvider.interceptors.push("httpAuthenticator");
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

app.controller("parentController", ["$scope", "$cookies", function ($scope, $cookies) {
    $scope.cookies = {
        username: "",
        uuid: ""
    };
    $scope.refreshCookies = function () {
        $scope.cookies.username = $cookies.get("username");
        $scope.cookies.uuid = $cookies.get("uuid");
    }
    $scope.refreshCookies();
}])

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
                    });
                    $scope.refreshCookies();

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
    $cookies.remove("username");
    $cookies.remove("uuid");
    $cookies.remove("accessToken");

    $scope.refreshCookies();

    if ($stateParams.login) {
        $state.go("login")
    } else {
        $state.go("index");
    }
}]);

app.controller("accountOverviewController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies) {
    var usernameCookie = $cookies.get("username");
    var uuidCookie = $cookies.get("uuid");
    var accessTokenCookie = $cookies.get("accessToken");

    if (!usernameCookie || !uuidCookie || !accessTokenCookie) {
        $state.go("logout",{login:true});
        return;
    }

    $scope.pushNotification = {
        enabled: false,
        update: function () {
            console.log("Push Notifications: " + $scope.pushNotification.enabled);

            if ($scope.pushNotification.isSubscribed) {
                $scope.pushNotification.unsubscribeUser();
            } else {
                $scope.pushNotification.subscribeUser();
            }
        },
        supported: false,
        isSubscribed: false,
        registration: null,
        updateSubscriptionOnServer: function (subscription) {
            console.log(subscription)
            $http({
                method: "POST",
                url: "https://api.mcgame.info/account/pushNotification/update",
                data: {subscription: subscription, username: usernameCookie, uuid: uuidCookie},
                headers: {"Access-Token": accessTokenCookie}
            }).then(function (response) {
                console.log(response);

                if (response.data.status == "ok") {
                    Materialize.toast("Push Notifications enabled", 4000)
                    $scope.pushNotification.enabled = true;
                } else {
                    Materialize.toast('Error: ' + response.data.msg, 4000)
                    $scope.pushNotification.enabled = false;
                }

                $scope.refreshFriends();
            })
        },
        init: function () {
            // Set the initial subscription value
            $scope.pushNotification.registration.pushManager.getSubscription()
                .then(function (subscription) {
                    $timeout(function () {
                        $scope.pushNotification.isSubscribed = !(subscription === null);

                        if ($scope.pushNotification.isSubscribed) {
                            console.log('User IS subscribed.');
                            $scope.pushNotification.enabled = true;
                        } else {
                            console.log('User is NOT subscribed.');
                            $scope.pushNotification.enabled = false;
                        }
                    })
                });
        },
        subscribeUser: function () {
            const applicationServerKey = urlB64ToUint8Array(/*"BFSI1Ym6OiOrM9COukPX6twj7QMI1L-LfmOvxG6TiiKZepUe-CKwTs_WiITUb1tk3gFq7FdIdnNbBA91i89cVt4"*/"BLdOBlol3QX1BUEQvsfIMvwg_r_zxd9Tn0TTqlt_y-Ecx5hrz8HW5qh1ecEWWOsHOw4A6pQyasNG77sQJYD2oRU");
            $scope.pushNotification.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            })
                .then(function (subscription) {
                    console.log('User is subscribed.');

                    $scope.pushNotification.updateSubscriptionOnServer(subscription);

                    $timeout(function () {
                        $scope.pushNotification.isSubscribed = true;
                    })
                })
                .catch(function (err) {
                    console.log('Failed to subscribe the user: ', err);
                });
        },
        unsubscribeUser: function () {
            $scope.pushNotification.registration.pushManager.getSubscription()
                .then(function (subscription) {
                    if (subscription) {
                        return subscription.unsubscribe();
                    }
                })
                .catch(function (error) {
                    console.log('Error unsubscribing', error);
                })
                .then(function () {
                    $scope.pushNotification.updateSubscriptionOnServer(null);

                    console.log('User is unsubscribed.');
                    $scope.pushNotification.isSubscribed = false;
                    $timeout(function () {
                        $scope.pushNotification.enabled = false;
                    })
                });
        }
    }
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push is supported');
        $scope.pushNotification.supported = true;

        navigator.serviceWorker.register('/js/sw.js')
            .then(function (swReg) {
                console.log('Service Worker is registered', swReg);

                $scope.pushNotification.registration = swReg;
                $scope.pushNotification.init();
            })
            .catch(function (error) {
                console.error('Service Worker Error', error);
            });
    } else {
        console.warn('Push messaging is not supported');
        $scope.pushNotification.supported = false;
    }

    $scope.account = {};
    $scope.infoInput = {
        game: "",
        server: ""
    }
    $scope.updateGameInfo = function () {
        $http({
            method: "POST",
            url: $scope.account.info.server ? "https://api.mcgame.info/join/server" : "https://api.mcgame.info/leave/server",
            data: {username: usernameCookie, uuid: uuidCookie, serverIp: $scope.infoInput.server},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Server updated", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshAccount();
        });
        $http({
            method: "POST",
            url: $scope.account.info.game ? "https://api.mcgame.info/join/game" : "https://api.mcgame.info/leave/game",
            data: {username: usernameCookie, uuid: uuidCookie, gameName: $scope.infoInput.game},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Game updated", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshAccount();
        })
    };

    $scope.friends = [];
    $scope.friendRequests = {
        incoming: [],
        outgoing: []
    };

    $scope.addFriendName = "";
    $scope.addFriend = function () {
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/add",
            data: {username: usernameCookie, uuid: uuidCookie, friend: $scope.addFriendName},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Friend request sent!", 4000)
                $scope.addFriendName = "";
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        })
    };
    $scope.removeFriend = function (uuid, username) {
        if (confirm("Are you sure you want to remove " + username + " from your friends list?")) {
            $http({
                method: "POST",
                url: "https://api.mcgame.info/account/friends/remove",
                data: {username: usernameCookie, uuid: uuidCookie, friend: uuid},
                headers: {"Access-Token": accessTokenCookie}
            }).then(function (response) {
                console.log(response);

                if (response.data.status == "ok") {
                    Materialize.toast("Friend removeed", 4000)
                } else {
                    Materialize.toast('Error: ' + response.data.msg, 4000)
                }

                $scope.refreshFriends();
            })
        }
    };
    $scope.cancelRequest = function (uuid) {
        console.log("cancelRequest " + uuid)
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/requests/cancel",
            data: {username: usernameCookie, uuid: uuidCookie, friend: uuid},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Request cancelled", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        })
    }

    $scope.acceptFriend = function (uuid) {
        console.log("acceptFriend " + uuid)
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/requests/accept",
            data: {username: usernameCookie, uuid: uuidCookie, friend: uuid},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Friend accepted!", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        })
    };
    $scope.declineFriend = function (uuid) {
        console.log("declineFriend " + uuid)
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/requests/decline",
            data: {username: usernameCookie, uuid: uuidCookie, friend: uuid},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Friend declined!", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        })
    };

    $scope.refreshAccount = function () {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/account",
            params: {username: usernameCookie, uuid: uuidCookie},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.account = response.data.user;
                $scope.infoInput = response.data.user.info;
                $timeout(function () {
                    Materialize.updateTextFields();
                })
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        })
    };
    $scope.refreshAccount();
    $interval($scope.refreshAccount, 1000 * 60 * 10);

    $scope.refreshFriends = function () {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/account/friends",
            params: {username: usernameCookie, uuid: uuidCookie},
            headers: {"Access-Token": accessTokenCookie}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.friends = response.data.friends;
                $scope.friendRequests = response.data.requests;
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        })
    };
    $scope.refreshFriends();

    window.addEventListener("focus", function (event) {
        $scope.refreshAccount();
        $scope.refreshFriends();
    });

    $timeout(function () {
        Materialize.updateTextFields();
    })
}]);

$(document).ready(function () {
    $(".button-collapse").sideNav({
        closeOnClick: true,
        draggable: true
    });
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