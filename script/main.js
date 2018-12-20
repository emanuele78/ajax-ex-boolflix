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
        searchPath: "/search",
        tvShowsPath: "/tv",
        moviesPath: "/movie",
        peoplePath: "/person",
        timeout: 20000,
        dataType: "json",
        responseLang: "it-IT",
        imageLang: "it,null",
        appendExtra: "credits,images",
        includeAdult: false,
        sliderAnimationDuration: 500,
        detailSectionSlideDuration: 300,
        movieType: 1,
        tvShowType: 2,
        personType: 3,
        getFlagUrl: function (countryCode) {
            return "https://www.countryflags.io/" + countryCode + "/flat/32.png";
        }
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
    var paginaIniziale = 1;
    //handler per la pressione del tasto invio all'interno della casella di ricerca
    $(".search__input").keyup(function (key) {
        if (key.keyCode === 13) {
            performSearch($(".search__input").val(), configObject, paginaIniziale);
        }
    });
    //handler per il click sul bottone di ricerca
    $(".search__button").click(function () {
        performSearch($(".search__input").val(), configObject, paginaIniziale);
    });
}

//funzione che riceve la richiesta dell'utente di avviare una ricerca in tmdb
//questa funzione può essere lanciata sia dalla pressione del button (o tasto invio)
//sia dalla paginazione attraverso le frecce degli slider
//a tale scopo il parametro
function performSearch(searchedText, configObject, page, searchType) {
    // tolgo il modifier content--hide che nasconde gli slider
    // questa operazione andrebbe fatta una sola volta tuttavia non è pesante
    $(".content.content--hide").removeClass("content--hide");
    if (configObject.pendingSearch) {
        // TODO c'è una richiesta in corso - considerare eventuale messaggio all'utente
        return;
    }
    if (searchedText === undefined || searchedText.trim().length === 0) {
        // TODO ricerca non valida, considerare se aggiungere anche un minimo numero di caratteri
        return;
    }
    // imposto nel config che una ricerca è stata lanciata
    configObject.pendingSearch = true;
    // ogni opzione di ricerca scollega i listener per le frecce del relativo slider
    //se la ricerca è globale vengono scollegati tutti i listener
    switch (searchType) {
        case configObject.movieType:
            //ricerca film
            detachPaginationFor($(".movie_results"));
            $(".movie_results").find(".selected--element").removeClass("selected--element");
            //controllo se la sezione dettagli è visualizzata
            if ($(".movie_details").is(":visible")) {
                $(".movie_details").slideUp(configObject.detailSectionSlideDuration);
            }
            $.when(
                search(searchedText.trim(), configObject, page, configObject.moviesPath, handleMovieSearchResults),
            ).then(function () {
                searchCompleted(configObject);
            });
            break;
        case configObject.tvShowType:
            //ricerca serie tv
            detachPaginationFor($(".tvshow_results"));
            $(".tvshow_results").find(".selected--element").removeClass("selected--element");
            //controllo se la sezione dettagli è visualizzata
            if ($(".tvshow_details").is(":visible")) {
                $(".tvshow_details").slideUp(configObject.detailSectionSlideDuration);
            }
            $.when(
                search(searchedText.trim(), configObject, page, configObject.tvShowsPath, handleTvShowsSearchResults),
            ).then(function () {
                searchCompleted(configObject);
            });
            break;
        case configObject.personType:
            //ricerca personaggi
            detachPaginationFor($(".people_results"));
            $(".people_results").find(".selected--element").removeClass("selected--element");
            //controllo se la sezione dettagli è visualizzata
            if ($(".person_details").is(":visible")) {
                $(".person_details").slideUp(configObject.detailSectionSlideDuration);
            }
            $.when(
                search(searchedText.trim(), configObject, page, configObject.peoplePath, handlePeopleSearchResults)
            ).then(function () {
                searchCompleted(configObject);
            });
            break;
        default:
            //ricerca tutto
            detachPaginationFor($(".slider"));
            $.when(
                search(searchedText.trim(), configObject, page, configObject.moviesPath, handleMovieSearchResults),
                search(searchedText.trim(), configObject, page, configObject.tvShowsPath, handleTvShowsSearchResults),
                search(searchedText.trim(), configObject, page, configObject.peoplePath, handlePeopleSearchResults)
            ).then(function () {
                searchCompleted(configObject);
            });
    }
}

function searchCompleted(configObject) {
    configObject.pendingSearch = false;
    $(".result").off();
    $(".result").click(function () {
        var id = parseInt($(this).attr("data-id"));
        var type = parseInt($(this).attr("data-type"));
        switch (type) {
            case configObject.movieType:
                //rimuovo classe per il bordo da un eventuale precedente elemento e la aggiungo all'elemento cliccato
                $(".movie_results").find(".selected--element").removeClass("selected--element");
                $(this).addClass("selected--element")
                searchMovieDetails(id, configObject, $(this));
                break;
            case configObject.tvShowType:
                //rimuovo classe per il bordo da un eventuale precedente elemento e la aggiungo all'elemento cliccato
                $(".tvshow_results").find(".selected--element").removeClass("selected--element");
                $(this).addClass("selected--element")
                searchTvShowDetails(id, configObject, $(this));
                break;
            case configObject.personType:
                //rimuovo classe per il bordo da un eventuale precedente elemento e la aggiungo all'elemento cliccato
                $(".people_results").find(".selected--element").removeClass("selected--element");
                $(this).addClass("selected--element")
                searchPersonDetails(id, configObject, $(this));
                break;
        }
    });
}

function searchMovieDetails(movieId, configObject, selectedHtmlElement) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.moviesPath + "/" + movieId,
        data: {
            include_image_language: configObject.imageLang,
            append_to_response: configObject.appendExtra
        },
        success: function (data, status, xhr) {
            console.log(data);
            var cast = [];
            if (data.credits.cast.length > 0) {
                data.credits.cast.forEach(function (item) {
                    cast.push(new TmdbSearchResponse(
                        item.id,
                        item.profile_path,
                        configObject.personType,
                        item.name,
                        configObject));
                });
            }
            var crew = [];
            if (data.credits.crew.length > 0) {
                data.credits.crew.forEach(function (item) {
                    crew.push(new TmdbSearchResponse(
                        item.id,
                        item.profile_path,
                        configObject.personType,
                        item.name,
                        configObject));
                });
            }
            var movie = new Movie(
                data.id,
                data.poster_path,
                configObject.movieType,
                data.title,
                configObject,
                data.overview,
                data.release_date,
                data.genres,
                data.backdrop_path,
                data.original_title,
                data.production_countries,
                data.vote_average,
                data.vote_count,
                data.revenue,
                data.budget,
                data.runtime,
                data.tagline,
                cast,
                crew
            );
            showMovieDetails(movie, configObject, selectedHtmlElement);
        }
    };
    getAjaxRequest(properties, configObject);
}

function searchTvShowDetails(tvShowId, configObject, selectedHtmlElement) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.tvShowsPath + "/" + tvShowId,
        data: {
            include_image_language: configObject.imageLang,
            append_to_response: configObject.appendExtra
        },
        success: function (data, status, xhr) {
            console.log(data);
            var cast = [];
            if (data.credits.cast.length > 0) {
                data.credits.cast.forEach(function (item) {
                    cast.push(new TmdbSearchResponse(
                        item.id,
                        item.profile_path,
                        configObject.personType,
                        item.name,
                        configObject));
                });
            }
            var crew = [];
            if (data.credits.crew.length > 0) {
                data.credits.crew.forEach(function (item) {
                    crew.push(new TmdbSearchResponse(
                        item.id,
                        item.profile_path,
                        configObject.personType,
                        item.name,
                        configObject));
                });
            }
            var tvShow = new TvShow(
                data.id,
                data.poster_path,
                configObject.movieType,
                data.name,
                configObject,
                data.overview,
                data.first_air_date,
                data.genres,
                data.backdrop_path,
                data.original_name,
                data.origin_country,
                data.vote_average,
                data.vote_count,
                data.status,
                data.number_of_episodes,
                data.number_of_seasons,
                cast,
                crew
            );
            showTvDetails(tvShow, configObject, selectedHtmlElement);
        }
    };
    getAjaxRequest(properties, configObject);
}

function searchPersonDetails(personId, configObject, selectedHtmlElement) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.peoplePath + "/" + personId,
        data: {
            include_image_language: configObject.imageLang,
            append_to_response: configObject.appendExtra
        },
        success: function (data, status, xhr) {
            console.log(data);
            var person = new Person(
                data.id,
                data.profile_path,
                configObject.personType,
                data.name,
                configObject,
                data.biography,
                data.birthday,
                data.deathday,
                data.place_of_birth,
                data.images
            );
            showPersonDetails(person, configObject, selectedHtmlElement);
        }
    };
    getAjaxRequest(properties, configObject);
}

function showMovieDetails(movie, configObject) {
    console.log(movie);
    $(".movie_details .title").text(movie.getValue("name"));
    $(".movie_details .sub_title_original_title").text(movie.getValue("originalTitle"));
    $(".movie_details .genres_content").text(movie.getGenres());
    //ottengo template da funzione di utilità per handlebars a cui passo il valore di movie.voteAverage che è un array
    //se il voto non è presente l'array è vuoto altrimenti contiene valori boolean (true=stella piena, false=stella vuota)
    $(".movie_details .vote_average").html(getHtmlFromHandlebars(movie.voteAverage, $("#vote_template").html()));
    $(".movie_details .vote_count").text(movie.voteCount);
    $(".movie_details .budget_value").text(movie.budget);
    $(".movie_details .revenue_value").text(movie.revenue);
    $(".movie_details .plot_content").text(movie.getValue("overview"));
    $(".movie_details .tagline_content").text(movie.getValue("tagline"));
    $(".movie_details .release_date_content").text(movie.releaseDate);
    $(".movie_details .release_country").html(getHtmlFromHandlebars(movie.productionCountries, $("#country_flag_template").html()));
    $(".movie_details .crew").html(getHtmlFromHandlebars(movie.crew, $("#credits_template").html()));
    $(".movie_details .cast").html(getHtmlFromHandlebars(movie.cast, $("#credits_template").html()));
    //controllo se la sezione è visualizzata
    if ($(".movie_details").is(":hidden")) {
        $(".movie_details").slideDown(configObject.detailSectionSlideDuration);
    }
    //associo hanlder per la chiusura
    $(".movie_details .close_section__icon").off();
    $(".movie_details .close_section__icon").click(function () {
        //chiudo dettagli film
        $(".movie_details").slideUp(configObject.detailSectionSlideDuration);
        $(".movie_results").find(".selected--element").removeClass("selected--element");
    });
}

function showTvDetails(tvshow, configObject) {
    console.log(tvshow);
    $(".tvshow_details .title").text(tvshow.getValue("name"));
    $(".tvshow_details .sub_title_original_title").text(tvshow.getValue("originalTitle"));
    $(".tvshow_details .genres_content").text(tvshow.getGenres());
    //ottengo template da funzione di utilità per handlebars a cui passo il valore di movie.voteAverage che è un array
    //se il voto non è presente l'array è vuoto altrimenti contiene valori boolean (true=stella piena, false=stella vuota)
    $(".tvshow_details .vote_average").html(getHtmlFromHandlebars(tvshow.voteAverage, $("#vote_template").html()));
    $(".tvshow_details .vote_count").text(tvshow.voteCount);
    $(".tvshow_details .seasons_value").text(tvshow.seasons);
    $(".tvshow_details .episodes_value").text(tvshow.episodes);
    $(".tvshow_details .plot_content").text(tvshow.getValue("overview"));
    $(".tvshow_details .status_content").text(tvshow.getValue("status"));
    $(".tvshow_details .release_date_content").text(tvshow.releaseDate);
    $(".tvshow_details .release_country").html(getHtmlFromHandlebars(tvshow.productionCountries, $("#country_flag_template").html()));
    $(".tvshow_details .crew").html(getHtmlFromHandlebars(tvshow.crew, $("#credits_template").html()));
    $(".tvshow_details .cast").html(getHtmlFromHandlebars(tvshow.cast, $("#credits_template").html()));
    //controllo se la sezione è visualizzata
    if ($(".tvshow_details").is(":hidden")) {
        $(".tvshow_details").slideDown(configObject.detailSectionSlideDuration);
    }
    //associo hanlder per la chiusura
    $(".tvshow_details .close_section__icon").off();
    $(".tvshow_details .close_section__icon").click(function () {
        //chiudo dettagli film
        $(".tvshow_details").slideUp(configObject.detailSectionSlideDuration);
        $(".tvshow_results").find(".selected--element").removeClass("selected--element");
    });
}

function showPersonDetails(person, configObject) {
    console.log(person);
    //controllo se la sezione è visualizzata
    $(".person_details .person_name").text(person.getValue("name"));
    $(".person_details .birthday_value").text(person.birthday);
    $(".person_details .place_value").text(person.getValue("birthPlace"));
    $(".person_details .deathday_value").text(person.deathday);
    $(".person_details .bio_content").text(person.getValue("bio"));
    $(".person_details .person_images").html(getHtmlFromHandlebars(person.pics, $("#person_images_template").html()));
    if ($(".person_details").is(":hidden")) {
        $(".person_details").slideDown(configObject.detailSectionSlideDuration);
    }
    //associo hanlder per la chiusura
    $(".person_details .close_section__icon").off();
    $(".person_details .close_section__icon").click(function () {
        //chiudo dettagli film
        $(".person_details").slideUp(configObject.detailSectionSlideDuration);
        $(".people_results").find(".selected--element").removeClass("selected--element");
    });
}

//funzione che elimina i listener per le frecce di navigazione per un dato elemento
function detachPaginationFor(elementToDetach) {
    elementToDetach.find(".slider__arrow--next").off();
    elementToDetach.find(".slider__arrow--previous").off();
}
//funzione che prepara l'oggetto properties per la ricerca ajax
function search(searchedText, configObject, page, urlPath, callback) {
    var properties = {
        url: configObject.baseTmdbUrl + configObject.searchPath + urlPath,
        data: {
            query: searchedText,
            include_adult: configObject.includeAdult,
            page: page
        },
        success: function (data, status, xhr) {
            callback(data, configObject, searchedText);
        },
        error: function () {
            callback({total_results: 0, page: 0, total_pages: 0}, configObject, searchedText);
        }
    };
    return getAjaxRequest(properties, configObject);
}

//funzione che gestisce la risposta per la ricerca effettuata sui film
function handleMovieSearchResults(data, configObject, searchedText) {
    var movies = [];
    // console.log(data);
    if (data.total_results > 0) {
        data.results.forEach(function (entry) {
            //creo nuovo oggetto base e lo inserisco nell'array
            movies.push(new TmdbSearchResponse(entry.id, entry.poster_path, configObject.movieType, entry.title, configObject));
        });
    }
    //rimuovo precedente html cancellando anche i listener associati sugli elementi
    $(".movie_results .movies").empty();
    //inserisco html fornito attraverso handlebars
    $(".movie_results .movies").html(getHtmlFromHandlebars(movies, $("#search_results_template").html()));
    //stampo i dettagli sui risultati della ricerca - film trovati, pagine, etc..
    printSearchDetails("Film trovati: ", $(".movie_results .result_details__items_count"), data.total_results, $(".movie_results .result_details__pages_count"), data.page, data.total_pages);
    //creo oggetto slider
    var movieSlider = new Slider("movies", "result", "result--first", data.page, data.total_pages, configObject.sliderAnimationDuration, searchedText, performSearch, configObject, configObject.movieType);
    //handler per i click su avanti e indietro
    $(".movie_results .slider__arrow--next").click(function () {
        movieSlider.moveNext();
    });
    $(".movie_results .slider__arrow--previous").click(function () {
        movieSlider.movePrevious();
    });
}

// funzione che gestisce la risposta per la ricerca effettuata sulle serie tv
function handleTvShowsSearchResults(data, configObject, searchedText) {
    var tvShows = [];
    // console.log(data);
    if (data.total_results > 0) {
        data.results.forEach(function (entry) {
            //creo nuovo oggetto base e lo inserisco nell'array
            tvShows.push(new TmdbSearchResponse(entry.id, entry.poster_path, configObject.tvShowType, entry.name, configObject));
        });
    }
    //rimuovo precedente html cancellando anche i listener associati sugli elementi
    $(".tvshow_results .movies").empty();
    //inserisco html fornito attraverso handlebars
    $(".tvshow_results .tvshows").html(getHtmlFromHandlebars(tvShows, $("#search_results_template").html()));
    //stampo i dettagli sui risultati della ricerca - serie tv trovate, pagine, etc..
    printSearchDetails("Serie TV trovate: ", $(".tvshow_results .result_details__items_count"), data.total_results, $(".tvshow_results .result_details__pages_count"), data.page, data.total_pages);
    //creo oggetto slider
    var tvShowsSlider = new Slider("tvshows", "result", "result--first", data.page, data.total_pages, configObject.sliderAnimationDuration, searchedText, performSearch, configObject, configObject.tvShowType);
    //handler per i click su avanti e indietro
    $(".tvshow_results .slider__arrow--next").click(function () {
        tvShowsSlider.moveNext();
    });
    $(".tvshow_results .slider__arrow--previous").click(function () {
        tvShowsSlider.movePrevious();
    });
}

// funzione che gestisce la risposta per la ricerca effettuata sulle persone
function handlePeopleSearchResults(data, configObject, searchedText) {
    var people = [];
    // console.log(data);
    if (data.total_results > 0) {
        data.results.forEach(function (entry) {
            //creo nuovo oggetto base e lo inserisco nell'array
            people.push(new TmdbSearchResponse(entry.id, entry.profile_path, configObject.personType, entry.name, configObject));
        });
    }
    //rimuovo precedente html cancellando anche i listener associati sugli elementi
    $(".people_results .movies").empty();
    //inserisco html fornito attraverso handlebars
    $(".people_results .people").html(getHtmlFromHandlebars(people, $("#search_results_template").html()));
    //stampo i dettagli sui risultati della ricerca - persone trovate, pagine, etc..
    printSearchDetails("Personaggi trovati: ", $(".people_results .result_details__items_count"), data.total_results, $(".people_results .result_details__pages_count"), data.page, data.total_pages);
    //creo oggetto slider
    var peopleSlider = new Slider("people", "result", "result--first", data.page, data.total_pages, configObject.sliderAnimationDuration, searchedText, performSearch, configObject, configObject.personType);
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
// vengono aggiunti o parametri comuni come il timeout, l'apikey, lingua e il tipo di risposta
// questi valori sono contenuti nell'oggetto configObject
function getAjaxRequest(properties, configObject) {
    properties.timeout = configObject.timeout;
    properties.dataType = configObject.dataType;
    if ("data" in properties) {
        //ci sono già parametri nella query
        properties.data["api_key"] = configObject.apiKey;
        properties.data["language"] = configObject.responseLang;
    } else {
        //nessun parametro nella query
        properties.data = {"api_key": configObject.apiKey, "language": configObject.responseLang};
    }
    // console.log(properties);
    return $.ajax(properties);
}

// funzione di utilità per handlebars
function getHtmlFromHandlebars(data, scriptSource) {
    var template = Handlebars.compile(scriptSource);
    return template({list: data});
}