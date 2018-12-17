$(function () {
    var controller = new Controller();
    controller.initialize();
});

function Controller() {

    this.api_key = "a5e6574da66e1b3a83737b6b9d31c1b3";
    this.configUrl = "https://api.themoviedb.org/3/configuration";

    this.initialize = function () {
        sendRequest(this.configUrl, {"api_key": this.api_key}, 20, this, "config");
    };

    this.response = function (responseData, requestType) {
        switch (requestType) {
            case "config":
                initializeConfigObject.call(this, responseData);
                console.log(this);
        }
    };

    this.error = function (requestType) {

    };
}

function initializeConfigObject(data) {
    this.imageBaseUrl = data.images.base_url;
    this.imageBaseSecureUrl = data.images.secure_base_url;
    this.backdropSizes = data.images.backdrop_sizes;
    this.posterSizes = data.images.poster_sizes;
    this.profileSizes = data.images.profile_sizes;
}

function sendRequest(url, data, timeout, controller, requestType) {
    $.ajax({
        url: url,
        data: data,
        timeout: timeout * 1000,
        success: function (data, status, xhr) {
            controller.response(data, requestType);
        },
        error: function (xhr, status, error) {
            controller.error(requestType);
        }
    });
}