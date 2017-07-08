app.controller("accountOverviewController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", "moment", function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies, moment) {
    var usernameCookie = $cookies.get("username");
    var uuidCookie = $cookies.get("uuid");
    var accessTokenCookie = $cookies.get("accessToken");

    if (!usernameCookie || !uuidCookie || !accessTokenCookie) {
        $state.go("logout", {go: "login"});
        return;
    }

    $scope.navbar.tabs=[
        {

        }
    ];

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