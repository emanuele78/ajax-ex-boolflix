$(function () {
    var config = {
        apiKey: "a5e6574da66e1b3a83737b6b9d31c1b3",
        baseTmdbUrl: "https://api.themoviedb.org/3",
        tvGenresPath: "/genre/tv/list",
        movieGenresPath: "/genre/movie/list",
        timeout: 20000,
        configUrl: "https://api.themoviedb.org/3/configuration",
        dataType: "json"
    };
    $.when(getConfiguration(config), getTvGenres(config), getMovieGenres(config)).then(function () {
        console.log(config);
    });
});

function getConfiguration(configObject) {
    var properties = {
        url: configObject.configUrl,
        success: function (data, status, xhr) {
            configObject.imageBaseUrl = data.images.base_url;
            configObject.imageBaseSecureUrl = data.images.secure_base_url;
            configObject.backdropSizes = data.images.backdrop_sizes;
            configObject.posterSizes = data.images.poster_sizes;
            configObject.profileSizes = data.images.profile_sizes;
        }
    };
    return getAjaxRequest(properties, configObject);
}

function getTvGenres(configObject) {
    var properties = {
        url:configObject.baseTmdbUrl + configObject.tvGenresPath,
        success: function (data, status, xhr) {
            configObject.tvGenres = data.genres;
        }
    };
    return getAjaxRequest(properties, configObject);
}

function getMovieGenres(configObject) {
    var properties = {
        url:configObject.baseTmdbUrl + configObject.movieGenresPath,
        success: function (data, status, xhr) {
            configObject.movieGenres = data.genres;
        }
    };
    return getAjaxRequest(properties, configObject);
}

function getAjaxRequest(properties, configObject) {
    properties.timeout = configObject.timeout;
    properties.dataType = configObject.dataType;
    if ("data" in properties) {
        //ci sono già parametri nella query
        properties.data["api_key"] = configObject.apiKey;
    } else {
        //nessun parametro nella query
        properties.data = {"api_key": configObject.apiKey};
    }
    return $.ajax(properties);
}