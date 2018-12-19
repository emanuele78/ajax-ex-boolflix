"use strict";
// TODO valutare se estrapolare proprietà prototype
//container, element e firstFlag sono stringhe che rappresentano le classi utilizzate nel css
//container: container per lo slider
//element: elemento dello slider
//firstFlag: classe assegnata al primo elemento visualizzato
//data: array di oggetti da visualizzare
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

// funzione di utilità
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
function TmdbSearchResponse(id, portraitImage, config) {
    this.notAvailable = "Non disponibile";
    this.id = id;
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

//sovrascrivo oggetto prototype per aggiungere più funzioni comuni a tutte le istanze
// TmdbSearchResponse.prototype = {
//     constructor: TmdbSearchResponse,
//     getId: function () {
//         return this.id;
//     },
//     getPortrait: function () {
//         return this.portraitImage;
//     }
// };

//costruttore per istanze film
function Movie(id, poster, overview, releaseDate, genres, backdrops, title, originalTitle, originalLang, voteAverage, voteCount, config) {
    TmdbSearchResponse.call(this, id, poster, config);
    this.overview = overview;
    this.releaseDate = releaseDate;
    this.genres = genres;
    this.backdrops = backdrops;
    this.title = title;
    this.originalTitle = originalTitle;
    this.originalLang = originalLang;
    this.voteAverage = voteAverage;
    this.voteCount = voteCount;
}

// costruttore per istanze serie tv
function TvShow(id, poster, overview, releaseDate, genres, backdrops, title, originalTitle, originalLang, voteAverage, voteCount, config) {
    TmdbSearchResponse.call(this, id, poster, config);
    this.overview = overview;
    this.releaseDate = releaseDate;
    this.genres = genres;
    this.backdrops = backdrops;
    this.title = title;
    this.originalTitle = originalTitle;
    this.originalLang = originalLang;
    this.voteAverage = voteAverage;
    this.voteCount = voteCount;
}

//costruttore per istanze persona
function Person(id, pic, name, config) {
    TmdbSearchResponse.call(this, id, pic, config);
    this.name = name;
}