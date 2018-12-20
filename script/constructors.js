"use strict";
//container, element e firstFlag sono stringhe che rappresentano le classi utilizzate nel css
//container: container per lo slider
//element: elemento dello slider
//firstFlag: classe assegnata al primo elemento visualizzato
function Slider(container, element, firstFlag, currentPage, pagesCount, animationDuration, searchedText, loadFunctionCallback, configObject, searchType) {

    //stringhe di utilità per i selettori jquery
    this.slider = "." + container;
    this.sliderElement = "." + container + " ." + element;
    this.sliderFirstElement = "." + container + " ." + element + "." + firstFlag;
    this.firstFlag = firstFlag;
    this.animationDuration = animationDuration;
    //posizione iniziale della scrollbar
    this.scroll = 0;
    //larghezza degli elementi nello slider
    this.larghezzeElmentoSingolo = $(this.sliderElement).width() + parseInt($(this.sliderElement).css("margin-left"));
    //proprietà che servono a evitare click veloci dell'utente
    this.pendingPrevious = false;
    this.pendingNext = false;
    //proprietà per la paginazione
    this.searchedText = searchedText;
    this.currentPage = currentPage;
    this.pagesCount = pagesCount;
    this.configObject = configObject;
    this.paginationCallback = loadFunctionCallback;
    this.searchType = searchType;
    //reset dello slider
    this.reset();
    // TODO da cancellare
    this.objId = Math.trunc(Math.random() * (100000 - 1) + 1);
    console.log("creato oggetto per tipo " + this.searchType + " slider con id: " + this.objId);
}

// metodi prototype condivisi dalle istanze di slider
Slider.prototype.reset = function () {
    $(this.slider).scrollLeft(0);
};

// muovi avanti lo slider
Slider.prototype.moveNext = function () {
    console.log("metodo next per tipo " + this.searchType + " su oggetto id: " + this.objId);
    if (!this.pendingNext) {
        var massimaPosizioneScroll = $(this.slider).prop("scrollWidth") - $(this.slider).width();
        if (this.scroll < massimaPosizioneScroll) {
            var indiceProssimoElementoDaVisualizzare = this.getIndiceProssimoElementoDaVisualizzare(true);
            if (indiceProssimoElementoDaVisualizzare < $(this.sliderElement).length) {
                //non tutti gli elementi sono interamente visualizzati
                // assegno la classe first_visible al primo elemento da visualizzare
                $(this.sliderElement).eq(indiceProssimoElementoDaVisualizzare).addClass(this.firstFlag);
                //ottengo coordinate dell'elemento
                var offset = Math.trunc($(this.sliderFirstElement).position().left);
                if (this.scroll + offset > massimaPosizioneScroll) {
                    //scrollo alla posizione massima
                    this.scroll = massimaPosizioneScroll;
                } else {
                    //scrollo alla posizione del primo elemento da visualizzare per intero
                    this.scroll += offset;
                }
                this.pendingNext = true;
                var thisObject = this;
                $(this.slider).animate({scrollLeft: this.scroll}, this.animationDuration, function () {
                    thisObject.pendingNext = false;
                });
            }
        } else {
            console.log("raggiunta massima posizione");
            if (this.currentPage < this.pagesCount) {
                //paginazione - avvio una nuova ricerca per la pagina successiva
                this.paginationCallback(this.searchedText, this.configObject, this.currentPage + 1, this.searchType);
            }
        }
    }
};

// muovi indietro lo slider
Slider.prototype.movePrevious = function () {
    console.log("metodo previous per tipo " + this.searchType + " su oggetto id: " + this.objId);
    if (!this.pendingPrevious) {
        if (this.scroll > 0) {
            var massimaPosizioneScroll = $(this.slider).prop("scrollWidth") - $(this.slider).width();
            if (this.scroll === massimaPosizioneScroll) {
                //la scrollbar si trova nella sua posizione massima
                var indiceProssimoElementoDaVisualizzare = this.getIndiceProssimoElementoDaVisualizzare(false, massimaPosizioneScroll);
                $(this.sliderElement).eq(indiceProssimoElementoDaVisualizzare).addClass(this.firstFlag);
                var offset = Math.trunc($(this.sliderFirstElement).position().left);
                this.scroll = (this.scroll + offset < 0 ? 0 : this.scroll + offset);
            } else {
                //scrollbar in posizione intermedia
                indiceProssimoElementoDaVisualizzare = this.getIndiceProssimoElementoDaVisualizzare(false, massimaPosizioneScroll);
                $(this.sliderElement).eq(indiceProssimoElementoDaVisualizzare).addClass(this.firstFlag);
                offset = Math.trunc($(this.sliderFirstElement).position().left);
                this.scroll += offset;
            }
            this.pendingPrevious = true;
            var thisObject = this;
            $(this.slider).animate({scrollLeft: this.scroll}, this.animationDuration, function () {
                thisObject.pendingPrevious = false;
            });
        } else {
            console.log("raggiunta minima posizione");
            if (this.currentPage > 1) {
                //paginazione - avvio una nuova ricerca per la pagina precedente
                this.paginationCallback(this.searchedText, this.configObject, this.currentPage - 1, this.searchType);
            }
        }
    }
};

// funzione prototype di utilità per le istanze di slider
Slider.prototype.getIndiceProssimoElementoDaVisualizzare = function (avanti, massimaPosizioneScroll) {
    console.log("funzione utilità su oggetto id: " + this.objId);
    var indicePrimoElementoVisualizzato = $(this.sliderFirstElement).index();
    var larghezzaTotaleContainer = $(this.slider).width();
    var elementiVisualizzatiInteramente = Math.trunc(larghezzaTotaleContainer / this.larghezzeElmentoSingolo);
    var numeroElementi = $(this.sliderElement).length - 1;
    $(this.sliderElement).removeClass(this.firstFlag);
    if (avanti) {
        return (elementiVisualizzatiInteramente + indicePrimoElementoVisualizzato > numeroElementi) ? numeroElementi : elementiVisualizzatiInteramente + indicePrimoElementoVisualizzato;
    } else {
        if (this.scroll === massimaPosizioneScroll) {
            return numeroElementi - elementiVisualizzatiInteramente;
        }
        return (indicePrimoElementoVisualizzato - elementiVisualizzatiInteramente < 0 ? 0 : indicePrimoElementoVisualizzato - elementiVisualizzatiInteramente);
    }
};

//costruttore per istanze base, tutte le ricerche fatte (film, serietv o persone hanno sempre un id e un'immagine 2:3
function TmdbSearchResponse(id, portraitImage, type, name, config) {
    this.id = id;
    this.type = type;
    this.name = name;
    if (portraitImage === undefined || portraitImage === null) {
        this.portraitImage = config.noImagePathPortrait;
    } else {
        if ("posterSizes" in config && config.posterSizes.includes("w342")) {
            this.portraitImage = config.imageBaseSecureUrl + "w342" + portraitImage;
        } else {
            this.portraitImage = config.noImagePathPortrait;
        }
    }
}
//proprietà prototype che viene ritornata per eventuali valori non definiti
TmdbSearchResponse.prototype.notAvailable = "N/A";
//metodo prototype per ottenere un valore generico
TmdbSearchResponse.prototype.getValue = function (propertyName) {
    if (propertyName in this && this[propertyName].length > 0) {
        return this[propertyName];
    }
    return this.notAvailable;
};
TmdbSearchResponse.prototype.getGenres = function () {
    if (this.genres === null || this.genres === undefined || this.genres.length === 0) {
        return this.notAvailable;
    }
    var genres = [];
    this.genres.forEach(function (item) {
        genres.push(item.name)
    });
    return genres.join(", ");
}

//costruttore per istanze movie
function Movie(id, poster, type, title, config, overview, releaseDate, genres, backdrops, originalTitle, productionCountries, voteAverage, voteCount, revenue, budget, runtime, tagline, cast, crew) {
    TmdbSearchResponse.call(this, id, poster, type, title, config);
    this.overview = overview;
    this.releaseDate = releaseDate;
    this.genres = genres;
    this.backdrops = backdrops;
    this.title = title;
    this.originalTitle = originalTitle;
    this.voteAverage = getVote(voteAverage);
    this.voteCount = voteCount;
    this.runtime = runtime;
    this.tagline = tagline;
    this.cast = cast;
    this.crew = crew;
    if (revenue === null || revenue === undefined || revenue == 0) {
        this.revenue = this.notAvailable;
    } else {
        this.revenue = revenue.toLocaleString();
    }
    if (budget === null || budget === undefined || budget == 0) {
        this.budget = this.notAvailable;
    } else {
        this.budget = budget.toLocaleString();
    }
    formatReleaseDate(releaseDate, this);
    if (productionCountries === null || productionCountries === undefined || productionCountries.length === 0) {
        this.productionCountries = [];
    } else {
        var countryCodes = [];
        productionCountries.forEach(function (item) {
            countryCodes.push({countryFlagUrl: config.getFlagUrl(item.iso_3166_1)})
        });
        this.productionCountries = countryCodes;
    }
}

function formatReleaseDate(releaseDate, object) {
    if (releaseDate === null || releaseDate === undefined || releaseDate.length === 0) {
        object.releaseDate = object.notAvailable;
    } else {
        object.releaseDate = moment(releaseDate, "YYYY-MM-DD").format("DD-MM-YYYY");
    }
}

function formatProductionCountries(productionCountries, object, config) {
    if (productionCountries === null || productionCountries === undefined || productionCountries.length === 0) {
        object.productionCountries = [];
    } else {
        var countryCodes = [];
        productionCountries.forEach(function (item) {
            // countryCodes.push(item.iso_3166_1);
            countryCodes.push({countryFlagUrl: config.getFlagUrl(item.iso_3166_1)})
        });
        object.productionCountries = countryCodes;
    }
}

Movie.prototype = Object.create(TmdbSearchResponse.prototype, {
    constructor: {
        configurable: true,
        enumerable: true,
        value: TmdbSearchResponse,
        writable: true
    }
});

// costruttore per istanze serie tv
function TvShow(id, poster, type, title, config, overview, releaseDate, genres, backdrops, originalTitle, productionCountries, voteAverage, voteCount, status, episodes, seasons, cast, crew) {
    TmdbSearchResponse.call(this, id, poster, type, title, config);
    this.overview = overview;
    this.releaseDate = releaseDate;
    this.genres = genres;
    this.backdrops = backdrops;
    this.title = title;
    this.originalTitle = originalTitle;
    this.voteAverage = getVote(voteAverage);
    this.voteCount = voteCount;
    this.status = status;
    this.cast = cast;
    this.crew = crew;
    this.episodes = episodes;
    this.seasons = seasons;
    formatReleaseDate(releaseDate, this);
    if (productionCountries === null || productionCountries === undefined || productionCountries.length === 0) {
        this.productionCountries = [];
    } else {
        var countryCodes = [];
        productionCountries.forEach(function (item) {
            countryCodes.push({countryFlagUrl: config.getFlagUrl(item)})
        });
        this.productionCountries = countryCodes;
    }
}

TvShow.prototype = Object.create(TmdbSearchResponse.prototype, {
    constructor: {
        configurable: true,
        enumerable: true,
        value: TmdbSearchResponse,
        writable: true
    }
});

//costruttore per istanze persona
function Person(id, pic, type, name, config) {
    TmdbSearchResponse.call(this, id, pic, type, config);
    this.name = name;
}

//funzione di utilità per la formattazione del voto
function getVote(vote) {
    var votes = [];
    if (vote !== undefined && vote !== null) {
        var numericVote = Math.ceil(vote / 2);
        for (var i = 0; i < 5; i++) {
            if (i + 1 <= numericVote) {
                votes.push({vote: true});
            } else {
                votes.push({vote: false});
            }
        }
    }
    return votes;
}