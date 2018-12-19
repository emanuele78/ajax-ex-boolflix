"use strict";

$(function () {
    var config = {
        apiKey: "a5e6574da66e1b3a83737b6b9d31c1b3",
        noImagePathPortrait: "assets/noimage_portrait.jpg",
        noImagePathLandscaoe: "assets/noimage_landscape.jpg",
        baseTmdbUrl: "https://api.themoviedb.org/3",
        configPath: "/configuration",
        tvGenresPath: "/genre/tv/list",
        moviesGenresPath: "/genre/movie/list",
        tvSearchPath: "/search/tv",
        moviesSearchPath: "/search/movie",
        peopleSearchPath: "/search/person",
        timeout: 20000,
        dataType: "json",
        responseLang: "it-IT",
        includeAdult: false,
        sliderAnimationDuration: 500
    };
    $.when(getConfiguration(config), getTvGenres(config), getMovieGenres(config)).then(function () {
        //dopo che la configurazione è terminata, collego handler per la ricerca
        attachSearchHandler(config);
    });
});

// seguono le funzioni che configurano alcuni valori come il base url per le immagini, le dimensioni
// per le immagini e la lista generi tv e film
function getConfiguration(configObject) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.configPath,
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
        url: configObject.baseTmdbUrl + configObject.tvGenresPath,
        success: function (data, status, xhr) {
            configObject.tvGenres = data.genres;
        }
    };
    return getAjaxRequest(properties, configObject);
}

function getMovieGenres(configObject) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.moviesGenresPath,
        success: function (data, status, xhr) {
            configObject.movieGenres = data.genres;
        }
    };
    return getAjaxRequest(properties, configObject);
}

//funzione che collega handler per la ricerca
function attachSearchHandler(configObject) {
    //handler per la pressione del tasto invio all'interno della casella di ricerca
    $(".search__input").keyup(function (key) {
        if (key.keyCode === 13) {
            performSearch($(".search__input").val(), configObject);
        }
    });
    //handler per il click sul bottone di ricerca
    $(".search__button").click(function () {
        performSearch($(".search__input").val(), configObject);
    });
}

//funzione che riceve la richiesta dell'utente di avviare una ricerca in tmdb
function performSearch(text, configObject) {
    // TODO verificare se c'è una richiesta pendente da proprietà config object
    if (text === undefined || text.trim().length == 0) {
        // TODO ricerca non valida, verificare se aggiungere anche un minimo numero di caratteri
        return;
    }
    // TODO rimuovere handler su frecce slider dopo avvio nuova ricerca
    $(".slider__arrow--next").off();
    $(".slider__arrow--previous").off();
    $.when(
        searchForMovies(text.trim(), configObject, 1),
        searchForTvShows(text.trim(), configObject, 1),
        searchForPeople(text.trim(), configObject, 1)
    ).then(function () {
        // TODO risultati ottenuti - aggiungere handler per click su immagini
    });

}

//funzione che avvia la ricerca per i film
function searchForMovies(text, configObject, page) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.moviesSearchPath,
        data: {
            language: configObject.responseLang,
            query: text,
            include_adult: configObject.includeAdult,
            page: page
        },
        success: function (data, status, xhr) {
            handleMovieSearchResults(data, configObject);
        },
        error: function () {
            // TODO errore ricerca film
        }
    };
    return getAjaxRequest(properties, configObject);
}

//funzione che gestisce la risposta per la ricerca effettuata sui film
function handleMovieSearchResults(data, configObject) {
    var movies = [];
    console.log(data);
    if (data.total_results > 0) {
        data.results.forEach(function (entry) {
            //creo nuovo oggetto movie e lo inserisco nell'array
            movies.push(new Movie(
                entry.id,
                entry.poster_path,
                entry.overview,
                entry.release_date,
                entry.genre_ids,
                entry.backdrop_path,
                entry.title,
                entry.original_title,
                entry.original_language,
                entry.vote_average,
                entry.vote_count,
                configObject
            ));
        });
    }
    //inserisco html fornito attraverso handlebars
    $(".movie_results .movies").html(getHtmlFromHandlebars(movies, $("#search_results_template").html()));
    //stampo i dettagli sui risultati della ricerca - film trovati, pagine, etc..
    printSearchDetails("Film trovati: ", $(".movie_results .result_details__items_count"), data.total_results, $(".movie_results .result_details__pages_count"), data.page, data.total_pages);
    //creo oggetto slider
    var movieSlider = new Slider("movies", "result", "result--first", data.page, data.total_pages, configObject.sliderAnimationDuration, movies, undefined);
    //handler per i click su avanti e indietro
    $(".movie_results .slider__arrow--next").click(function () {
        movieSlider.moveNext();
    });
    $(".movie_results .slider__arrow--previous").click(function () {
        movieSlider.movePrevious();
    });
}

// funzione che avvia la ricerca per le serie tv
function searchForTvShows(text, configObject, page) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.tvSearchPath,
        data: {
            language: configObject.responseLang,
            query: text,
            include_adult: configObject.includeAdult,
            page: page
        },
        success: function (data, status, xhr) {
            handleTvShowsSearchResults(data, configObject);
        },
        error: function () {
            // TODO errore ricerca film
        }
    };
    return getAjaxRequest(properties, configObject);
}

// funzione che gestisce la risposta per la ricerca effettuata sulle serie tv
function handleTvShowsSearchResults(data, configObject) {
    var tvShows = [];
    console.log(data);
    if (data.total_results > 0) {
        data.results.forEach(function (entry) {
            //creo nuovo oggetto serie tv e lo inserisco nell'array
            tvShows.push(new TvShow(
                entry.id,
                entry.poster_path,
                entry.overview,
                entry.first_air_date,
                entry.genre_ids,
                entry.backdrop_path,
                entry.name,
                entry.original_name,
                entry.original_language,
                entry.vote_average,
                entry.vote_count,
                configObject
            ));
        });
    }
    //inserisco html fornito attraverso handlebars
    $(".tvshow_results .tvshows").html(getHtmlFromHandlebars(tvShows, $("#search_results_template").html()));
    //stampo i dettagli sui risultati della ricerca - serie tv trovate, pagine, etc..
    printSearchDetails("Serie TV trovate: ", $(".tvshow_results .result_details__items_count"), data.total_results, $(".tvshow_results .result_details__pages_count"), data.page, data.total_pages);
    //creo oggetto slider
    var tvShowsSlider = new Slider("tvshows", "result", "result--first", data.page, data.total_pages, configObject.sliderAnimationDuration, tvShows, undefined);
    //handler per i click su avanti e indietro
    $(".tvshow_results .slider__arrow--next").click(function () {
        tvShowsSlider.moveNext();
    });
    $(".tvshow_results .slider__arrow--previous").click(function () {
        tvShowsSlider.movePrevious();
    });
}

// funzione che avvia la ricerca per le persone
function searchForPeople(text, configObject, page) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.peopleSearchPath,
        data: {
            language: configObject.responseLang,
            query: text,
            include_adult: configObject.includeAdult,
            page: page
        },
        success: function (data, status, xhr) {
            handlePeopleSearchResults(data, configObject);
        },
        error: function () {
            // TODO errore ricerca film
        }
    };
    return getAjaxRequest(properties, configObject);
}

// funzione che gestisce la risposta per la ricerca effettuata sulle persone
function handlePeopleSearchResults(data, configObject) {
    var people = [];
    console.log(data);
    if (data.total_results > 0) {
        data.results.forEach(function (entry) {
            //creo nuovo oggetto persona e lo inserisco nell'array
            people.push(new Person(
                entry.id,
                entry.profile_path,
                entry.name,
                configObject
            ));
        });
    }
    //inserisco html fornito attraverso handlebars
    $(".people_results .people").html(getHtmlFromHandlebars(people, $("#search_results_template").html()));
    //stampo i dettagli sui risultati della ricerca - persone trovate, pagine, etc..
    printSearchDetails("Personaggi trovati: ", $(".people_results .result_details__items_count"), data.total_results, $(".people_results .result_details__pages_count"), data.page, data.total_pages);
    //creo oggetto slider
    var peopleSlider = new Slider("people", "result", "result--first", data.page, data.total_pages, configObject.sliderAnimationDuration, people, undefined);
    //handler per i click su avanti e indietro
    $(".people_results .slider__arrow--next").click(function () {
        peopleSlider.moveNext();
    });
    $(".people_results .slider__arrow--previous").click(function () {
        peopleSlider.movePrevious();
    });
}

//funzione di utilità che inserisce valori quali risultati totali, pagina corrente e pagine totali
function printSearchDetails(elementName, totalResultsElement, totalResults, paginationElement, currentPage, totalPages) {
    totalResultsElement.text(elementName + totalResults.toLocaleString());
    if (totalResults === 0) {
        paginationElement.text("");
    } else {
        paginationElement.text("Pagina " + currentPage + " di " + totalPages);
    }
}

// funzione di utilità per inviare una richiesta ajax
// l'oggetto properties contiene i parametri configurati dalla funzione chiamante. Nella funzione
// vengono aggiunti o parametri comuni come il timeout, l'apikey e il tipo di risposta
// questi valori sono contenuti nell'oggetto configObject
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
    // console.log(properties);
    return $.ajax(properties);
}

// funzione di utilità per handlebars
function getHtmlFromHandlebars(data, source) {
    var template = Handlebars.compile(source);
    return template({list: data});
}