app.controller("accountOverviewController", ["$scope", "$state", "$stateParams", "$http", "$timeout", "$interval", "$cookies", "moment", "ModalService", "$window", function ($scope, $state, $stateParams, $http, $timeout, $interval, $cookies, moment, ModalService, $window) {
    // var usernameCookie = $cookies.get("username");
    // var uuidCookie = $cookies.get("uuid");
    // var accessTokenCookie = $cookies.get("accessToken");
    //
    // if (!usernameCookie || !uuidCookie || !accessTokenCookie) {
    //     $state.go("logout", {go: "login"});
    //     return;
    // }

    $scope.navbar.tabs = [
        {
            title: "Overview",
            href: "#overview"
        },
        {
            title: "Servers",
            href: "#servers"
        },
        {
            title: "Settings",
            href: "#settings"
        }
    ];
    $scope.navbar.initTabs();


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
                data: {subscription: subscription, uuid: $cookies.get("uuid")}
            }).then(function (response) {
                console.log(response);

                if (response.data.status == "ok") {
                    Materialize.toast(response.data.msg, 4000)
                    $scope.pushNotification.enabled = subscription!=null;
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

    $scope.infoInput = {
        game: "",
        server: ""
    }
    $scope.updateGameInfo = function () {
        $http({
            method: "POST",
            url: $scope.account.info.server ? "https://api.mcgame.info/join/server" : "https://api.mcgame.info/leave/server",
            data: { uuid: $cookies.get("uuid"), serverIp: $scope.infoInput.server}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Server updated", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshAccount();
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
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
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
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
            data: { uuid: $cookies.get("uuid"), friend: $scope.addFriendName}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Friend request sent!", 4000)
                $scope.addFriendName = "";
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };
    $scope.removeFriend = function (uuid, username) {
        if (confirm("Are you sure you want to remove " + username + " from your friends list?")) {
            $http({
                method: "POST",
                url: "https://api.mcgame.info/account/friends/remove",
                data: {uuid: $cookies.get("uuid"), friend: uuid}
            }).then(function (response) {
                console.log(response);

                if (response.data.status == "ok") {
                    Materialize.toast("Friend removeed", 4000)
                } else {
                    Materialize.toast('Error: ' + response.data.msg, 4000)
                }

                $scope.refreshFriends();
            }, function (response) {
                Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
                if (response.status == 403) {
                    $state.go("login", {reload: true})
                }
            })
        }
    };
    $scope.cancelRequest = function (uuid) {
        console.log("cancelRequest " + uuid)
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/requests/cancel",
            data: {uuid: $cookies.get("uuid"), friend: uuid}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Request cancelled", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    }

    $scope.acceptFriend = function (uuid) {
        console.log("acceptFriend " + uuid)
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/requests/accept",
            data: { uuid: $cookies.get("uuid"), friend: uuid}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Friend accepted!", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };
    $scope.declineFriend = function (uuid) {
        console.log("declineFriend " + uuid)
        $http({
            method: "POST",
            url: "https://api.mcgame.info/account/friends/requests/decline",
            data: {uuid: $cookies.get("uuid"), friend: uuid}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Friend declined!", 4000)
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }

            $scope.refreshFriends();
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };


    $scope.refreshAccount();
    $interval($scope.refreshAccount, 1000 * 60 * 10);

    $scope.refreshFriends = function () {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/account/friends",
            params: { uuid: $cookies.get("uuid")}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.friends = response.data.friends;
                $scope.friendRequests = response.data.requests;
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };
    $scope.refreshFriends();


    $scope.servers = [];
    $scope.pagination = {page: 1, pages: 0};
    $scope.refreshServers = function () {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/account/servers",
            params: { uuid: $cookies.get("uuid"), page: $scope.pagination.page}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                $scope.servers = response.data.servers;
                $scope.pagination = response.data.pagination;
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
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };
    $scope.verifyServerDomain = function (serverIp, serverName) {
        $http({
            method: "POST",
            url: "https://api.mcgame.info/servers/verify/domain",
            data: { uuid: $cookies.get("uuid"), serverIp: serverIp, serverName: serverName}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                Materialize.toast("Domain verified!", 4000)

                $scope.refreshServers();
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    }
    $scope.refreshServers();

    $scope.showAddServerModal = function () {
        ModalService.showModal({
            templateUrl: "/pages/modal/addServer.html",
            controller: function ($scope, $http, showDomainTokenModal, refreshServers) {
                $scope.serverName = "";
                $scope.serverIp = "";
                $scope.add = function () {
                    if ($scope.serverName.length < 4)return
                    if ($scope.serverIp.length < 4)return;

                    $http({
                        method: "POST",
                        url: "https://api.mcgame.info/servers/add",
                        data: {uuid: $cookies.get("uuid"), serverName: $scope.serverName, serverIp: $scope.serverIp}
                    }).then(function (response) {
                        console.log(response);

                        if (response.data.status == "ok") {
                            Materialize.toast("Server registered.", 4000);
                            showDomainTokenModal($scope.serverName, $scope.serverIp);
                            refreshServers();
                        } else {
                            Materialize.toast('Error: ' + response.data.msg, 4000)
                        }
                    }, function (response) {
                        Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
                        if (response.status == 403) {
                            $state.go("login", {reload: true})
                        }
                    })
                }
            },
            inputs: {
                showDomainTokenModal: $scope.showDomainTokenModal,
                refreshServers: $scope.refreshServers
            }
        }).then(function (modal) {
            modal.element.modal("open")
        })
    };
    $scope.showDomainTokenModal = function (serverName, serverIp) {
        $http({
            method: "GET",
            url: "https://api.mcgame.info/servers/verify/domain/token",
            params: { uuid: $cookies.get("uuid"), serverName: serverName, serverIp: serverIp}
        }).then(function (response) {
            console.log(response);

            if (response.data.status == "ok") {
                ModalService.showModal({
                    templateUrl: "/pages/modal/domainToken.html",
                    controller: function ($scope, $http, id, token, ip) {
                        $scope.serverId = id;
                        $scope.domainToken = token;
                        $scope.serverIp = ip;
                    },
                    inputs: {
                        id: response.data.serverId,
                        token: response.data.domainToken,
                        ip: serverIp
                    }
                }).then(function (modal) {
                    modal.element.modal("open")
                })
            } else {
                Materialize.toast('Error: ' + response.data.msg, 4000)
            }
        }, function (response) {
            Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
            if (response.status == 403) {
                $state.go("login", {reload: true})
            }
        })
    };
    $scope.deleteServer = function (serverId, serverName, serverIp) {
        if (confirm("Are you sure you want to remove " + serverName + " from your servers?")) {
            $http({
                method: "POST",
                url: "https://api.mcgame.info/servers/delete",
                data: {uuid: $cookies.get("uuid"), serverId: serverId, serverName: serverName, serverIp: serverIp}
            }).then(function (response) {
                console.log(response);

                if (response.data.status == "ok") {
                    Materialize.toast("Server deleted.", 4000);
                    $scope.refreshServers();
                } else {
                    Materialize.toast('Error: ' + response.data.msg, 4000)
                }
            }, function (response) {
                Materialize.toast('Unexpected Error: ' + response.data.msg, 4000)
                if (response.status == 403) {
                    $state.go("login", {reload: true})
                }
            })
        }
    }

    $window.focus = function () {
        $scope.refreshAccount();
        $scope.refreshFriends();
    };

    $timeout(function () {
        Materialize.updateTextFields();
    })
}]);