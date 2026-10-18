/*
 * ================================================================
 * SEMANTIC ACCESSIBLE WEB PROJECT
 * Games Directory
 * ================================================================
 *
 * Purpose:
 *   Manage the interactive behavior of games.html.
 *
 * Features:
 *   - Centralized game directory
 *   - Featured games
 *   - Recently updated games
 *   - Game library rendering
 *   - Search suggestions and keyboard navigation
 *   - Favorites saved in localStorage
 *   - Recently played games
 *   - Navigation history
 *   - Desktop and mobile section menus
 *   - Keyboard accessibility
 *   - Screen-reader status announcements
 *
 * Design principles:
 *   - Use semantic HTML wherever possible.
 *   - Keep game information separate from rendering logic.
 *   - Keep reusable services independent of the page controller.
 *   - Avoid unnecessary DOM changes and repeated announcements.
 *   - Allow the page to function if browser storage is unavailable.
 *
 * ================================================================
 */

"use strict";


/* ================================================================
   1. CONFIGURATION
   ================================================================ */

const GAMES_CONFIG = Object.freeze({

    // Change these keys if you later decide to rename stored settings.
    STORAGE_KEYS: Object.freeze({
        FAVORITES: "sawp.games.favorites",
        RECENTLY_PLAYED: "sawp.games.recentlyPlayed",
        NAVIGATION_HISTORY: "sawp.games.navigationHistory"
    }),

    // Limit the number of items retained in browser storage.
    MAX_RECENTLY_PLAYED: 8,
    MAX_NAVIGATION_HISTORY: 10,

    // Limit the number of search suggestions displayed at once.
    MAX_SEARCH_RESULTS: 6,

    // Set to true to enable informational console messages.
    DEBUG: false

});


/* ================================================================
   2. GAME DIRECTORY DATA
   ================================================================ */

/*
 * The directory is the central source of game information.
 *
 * Add new game objects here as additional games become available.
 *
 * IMPORTANT:
 *   A game's URL must point to an actual page in your project.
 *
 * Dates use YYYY-MM-DD.
 * Use null when a date or update description is not available.
 */

const GAME_DIRECTORY = Object.freeze([

    Object.freeze({
        id: "number-guessing",

        title: "Number Guessing Game",

        description:
            "Test your intuition in an interactive number guessing game. " +
            "Explore accessible controls, feedback, and game mechanics.",

        category: "Casual",

        developer: "Flat Tire Studio",

        status: "available",

        url: "index.html",

        featured: true,

        updated: false,

        updatedAt: null,

        updateDescription: null,

        tags: Object.freeze([
            "Accessibility",
            "JavaScript",
            "Casual"
        ]),

        icon: "number"

    })

]);


/* ================================================================
   3. STORAGE SERVICE
   ================================================================ */

/*
 * StorageService provides a consistent interface for localStorage.
 *
 * Browser storage can be unavailable because of browser settings,
 * private browsing restrictions, security policies, or storage
 * quotas. The application should continue to function if that
 * happens.
 */

class StorageService {

    static get(key, fallback = null) {

        try {

            const value = localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);

        } catch (error) {

            if (GAMES_CONFIG.DEBUG) {
                console.warn(
                    "Unable to read browser storage:",
                    error
                );
            }

            return fallback;

        }

    }


    static set(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            if (GAMES_CONFIG.DEBUG) {
                console.warn(
                    "Unable to save browser storage:",
                    error
                );
            }

            return false;

        }

    }


    static remove(key) {

        try {

            localStorage.removeItem(key);

            return true;

        } catch (error) {

            if (GAMES_CONFIG.DEBUG) {
                console.warn(
                    "Unable to remove browser storage:",
                    error
                );
            }

            return false;

        }

    }

}


/* ================================================================
   4. ACCESSIBILITY CONTROL
   ================================================================ */

/*
 * AccessibilityControl centralizes small accessibility operations.
 *
 * We deliberately use a single search status region rather than
 * creating multiple competing live regions.
 */

class AccessibilityControl {

    constructor() {

        this.searchStatus =
            document.getElementById("search-status");

    }


    announce(message) {

        if (!this.searchStatus) {
            return;
        }

        /*
         * Avoid repeatedly announcing the same message.
         */

        if (this.searchStatus.textContent === message) {
            return;
        }

        this.searchStatus.textContent = message;

    }


    focus(element) {

        if (!element || typeof element.focus !== "function") {
            return false;
        }

        element.focus();

        return document.activeElement === element;

    }


    clearAnnouncement() {

        if (this.searchStatus) {
            this.searchStatus.textContent = "";
        }

    }

}


/* ================================================================
   5. GAME LIBRARY SERVICE
   ================================================================ */

/*
 * GameLibrary provides access to the directory data.
 *
 * Other components request information from this service instead
 * of maintaining their own copies of the game collection.
 */

class GameLibrary {

    constructor(games) {

        this.games = games;

    }


    getAll() {

        return [...this.games];

    }


    getById(id) {

        return this.games.find(
            game => game.id === id
        ) || null;

    }


    getAvailable() {

        return this.games.filter(
            game => game.status === "available"
        );

    }


    getFeatured() {

        return this.games.filter(
            game =>
                game.featured &&
                game.status === "available"
        );

    }


    getRecentlyUpdated() {

        return this.games
            .filter(
                game =>
                    game.updated &&
                    game.updatedAt
            )
            .sort(
                (a, b) =>
                    b.updatedAt.localeCompare(a.updatedAt)
            );

    }


    search(query) {

        const normalizedQuery =
            query.trim().toLocaleLowerCase();

        if (!normalizedQuery) {
            return this.getAvailable();
        }

        return this.getAvailable().filter(game => {

            const searchableText = [

                game.title,
                game.description,
                game.category,
                game.developer,
                ...game.tags

            ]
                .join(" ")
                .toLocaleLowerCase();

            return searchableText.includes(
                normalizedQuery
            );

        });

    }

}


/* ================================================================
   6. FAVORITES SERVICE
   ================================================================ */

/*
 * FavoritesService stores game IDs rather than complete game
 * objects. This avoids duplicating the directory data in storage.
 */

class FavoritesService {

    constructor(library) {

        this.library = library;

        const storedFavorites = StorageService.get(
            GAMES_CONFIG.STORAGE_KEYS.FAVORITES,
            []
        );

        this.favoriteIds = new Set(

            Array.isArray(storedFavorites)

                ? storedFavorites.filter(
                    id =>
                        typeof id === "string" &&
                        this.library.getById(id)
                )

                : []

        );

    }


    has(gameId) {

        return this.favoriteIds.has(gameId);

    }


    toggle(gameId) {

        const game = this.library.getById(gameId);

        if (!game) {
            return false;
        }

        if (this.favoriteIds.has(gameId)) {

            this.favoriteIds.delete(gameId);

        } else {

            this.favoriteIds.add(gameId);

        }

        this.save();

        return this.has(gameId);

    }


    getAll() {

        return [...this.favoriteIds]
            .map(id => this.library.getById(id))
            .filter(Boolean);

    }


    save() {

        StorageService.set(
            GAMES_CONFIG.STORAGE_KEYS.FAVORITES,
            [...this.favoriteIds]
        );

    }

}


/* ================================================================
   7. RECENTLY PLAYED SERVICE
   ================================================================ */

/*
 * RecentlyPlayedService records games opened from the directory.
 *
 * The most recently opened game appears first.
 */

class RecentlyPlayedService {

    constructor(library) {

        this.library = library;

        const storedGames = StorageService.get(
            GAMES_CONFIG.STORAGE_KEYS.RECENTLY_PLAYED,
            []
        );

        this.gameIds = Array.isArray(storedGames)

            ? storedGames.filter(
                id =>
                    typeof id === "string" &&
                    this.library.getById(id)
            )

            : [];

        /*
         * Remove duplicates from previously saved data.
         */

        this.gameIds = [...new Set(this.gameIds)];

    }


    record(gameId) {

        if (!this.library.getById(gameId)) {
            return;
        }

        this.gameIds = [

            gameId,

            ...this.gameIds.filter(
                id => id !== gameId
            )

        ].slice(
            0,
            GAMES_CONFIG.MAX_RECENTLY_PLAYED
        );

        this.save();

    }


    getAll() {

        return this.gameIds
            .map(id => this.library.getById(id))
            .filter(Boolean);

    }


    clear() {

        this.gameIds = [];

        this.save();

    }


    save() {

        StorageService.set(
            GAMES_CONFIG.STORAGE_KEYS.RECENTLY_PLAYED,
            this.gameIds
        );

    }

}


/* ================================================================
   8. NAVIGATION HISTORY SERVICE
   ================================================================ */

/*
 * NavigationHistoryService manages destinations visited through
 * this directory.
 *
 * This is application history, not a replacement for browser
 * history.
 *
 * The browser's own Back button and history.back() remain available.
 */

class NavigationHistoryService {

    constructor(library) {

        this.library = library;

        const storedHistory = StorageService.get(
            GAMES_CONFIG.STORAGE_KEYS.NAVIGATION_HISTORY,
            []
        );

        this.entries = Array.isArray(storedHistory)

            ? storedHistory.filter(entry => {

                return (

                    entry &&

                    typeof entry.id === "string" &&

                    typeof entry.title === "string" &&

                    typeof entry.url === "string"

                );

            })

            : [];

    }


    record(entry) {

        if (
            !entry ||
            typeof entry.url !== "string" ||
            typeof entry.title !== "string"
        ) {
            return;
        }

        /*
         * Ignore duplicate visits to the same destination
         * when they occur consecutively.
         */

        const latest = this.entries[0];

        if (
            latest &&
            latest.url === entry.url
        ) {
            return;
        }

        const newEntry = {

            id: entry.id || entry.url,

            title: entry.title,

            url: entry.url,

            visitedAt: Date.now()

        };

        this.entries = [

            newEntry,

            ...this.entries.filter(
                item => item.url !== newEntry.url
            )

        ].slice(
            0,
            GAMES_CONFIG.MAX_NAVIGATION_HISTORY
        );

        this.save();

    }


    getAll() {

        return [...this.entries];

    }


    save() {

        StorageService.set(
            GAMES_CONFIG.STORAGE_KEYS.NAVIGATION_HISTORY,
            this.entries
        );

    }

}


/* ================================================================
   9. DOM HELPERS
   ================================================================ */

/*
 * Small helpers keep DOM creation consistent.
 *
 * Text content is assigned through textContent rather than
 * interpolating game information into HTML strings.
 */

function createElement(tagName, className, text) {

    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;

}


function createSvgIcon(type) {

    const namespace = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(
        namespace,
        "svg"
    );

    svg.setAttribute("viewBox", "0 0 48 48");

    svg.setAttribute("aria-hidden", "true");

    svg.setAttribute("focusable", "false");

    const circle = document.createElementNS(
        namespace,
        "circle"
    );

    const path = document.createElementNS(
        namespace,
        "path"
    );

    if (type === "number") {

        circle.setAttribute("cx", "24");
        circle.setAttribute("cy", "24");
        circle.setAttribute("r", "16");

        path.setAttribute(
            "d",
            "M17 18h14M24 18v14M18 32h12"
        );

    } else {

        circle.setAttribute("cx", "24");
        circle.setAttribute("cy", "24");
        circle.setAttribute("r", "17");

        path.setAttribute(
            "d",
            "M15 24h18M24 15v18"
        );

    }

    svg.append(circle, path);

    return svg;

}


/* ================================================================
   10. GAME RENDERER
   ================================================================ */

/*
 * GameRenderer translates directory data into accessible cards.
 *
 * It does not own the game data or browser storage.
 */

class GameRenderer {

    constructor(library, favorites) {

        this.library = library;

        this.favorites = favorites;

    }


    renderAll() {

        this.renderFeatured();

        this.renderUpdated();

        this.renderLibrary();

        this.renderNavigation();

    }


    renderFeatured() {

        const container =
            document.getElementById("featured-grid");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const games = this.library.getFeatured();

        if (games.length === 0) {

            container.appendChild(
                this.createEmptyMessage(
                    "No featured games are available yet."
                )
            );

            return;

        }

        games.forEach(game => {

            container.appendChild(
                this.createGameCard(game)
            );

        });

    }


    renderUpdated() {

        const container =
            document.getElementById("updated-grid");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const games = this.library.getRecentlyUpdated();

        if (games.length === 0) {

            container.appendChild(
                this.createEmptyMessage(
                    "No recent game updates have been published yet."
                )
            );

            return;

        }

        games.forEach(game => {

            container.appendChild(
                this.createUpdateCard(game)
            );

        });

    }


    renderLibrary(games = this.library.getAvailable()) {

        const container =
            document.getElementById("library-grid");

        if (!container) {
            return;
        }

        container.replaceChildren();

        if (games.length === 0) {

            const empty = this.createEmptyMessage(
                "No games match your search."
            );

            empty.classList.add("no-library-results");

            container.appendChild(empty);

            return;

        }

        games.forEach(game => {

            container.appendChild(
                this.createGameCard(game)
            );

        });

    }


    renderNavigation() {

        const container =
            document.getElementById("game-nav");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const games = this.library.getAvailable();

        games.forEach((game, index) => {

            const link = createElement("a");

            link.href = game.url;

            link.dataset.gameId = game.id;

            const number = createElement(
                "span",
                "nav-game-index",
                String(index + 1).padStart(2, "0")
            );

            const copy = createElement(
                "span",
                "nav-game-copy"
            );

            copy.appendChild(
                createElement(
                    "span",
                    "",
                    game.title
                )
            );

            copy.appendChild(
                createElement(
                    "small",
                    "",
                    game.category
                )
            );

            link.append(number, copy);

            container.appendChild(link);

        });

        const count =
            document.getElementById("library-count");

        if (count) {

            count.textContent =
                games.length === 1

                    ? "1 game listed"

                    : `${games.length} games listed`;

        }

    }


    createEmptyMessage(message) {

        const element = createElement(
            "p",
            "empty-inline",
            message
        );

        return element;

    }


    createGameCard(game) {

        const article = createElement(
            "article",
            "game-card"
        );

        article.dataset.gameId = game.id;

        const visual = createElement(
            "div",
            "card-visual"
        );

        visual.appendChild(
            this.createVisualMark(game)
        );

        visual.appendChild(
            createElement(
                "span",
                "card-kicker",
                game.category
            )
        );

        const body = createElement(
            "div",
            "card-body"
        );

        const titleRow = createElement(
            "div",
            "card-title-row"
        );

        const heading = createElement("h3");

        const titleLink = createElement(
            "a",
            "",
            game.title
        );

        titleLink.href = game.url;

        titleLink.dataset.gameId = game.id;

        heading.appendChild(titleLink);

        titleRow.appendChild(heading);

        body.appendChild(titleRow);

        body.appendChild(
            createElement(
                "p",
                "card-description",
                game.description
            )
        );

        body.appendChild(
            this.createMetadata(game)
        );

        body.appendChild(
            this.createTags(game)
        );

        body.appendChild(
            this.createActions(game)
        );

        article.append(visual, body);

        return article;

    }


    createVisualMark(game) {

        const wrapper = createElement(
            "span",
            "visual-mark"
        );

        wrapper.appendChild(
            createSvgIcon(game.icon)
        );

        return wrapper;

    }


    createMetadata(game) {

        const metadata = createElement(
            "div",
            "card-meta"
        );

        metadata.appendChild(
            createElement(
                "span",
                "",
                game.developer
            )
        );

        metadata.appendChild(
            createElement(
                "span",
                "",
                game.status === "available"
                    ? "Available to play"
                    : "In development"
            )
        );

        return metadata;

    }


    createTags(game) {

        const list = createElement(
            "div",
            "tag-list"
        );

        game.tags.forEach(tag => {

            list.appendChild(
                createElement(
                    "span",
                    "tag",
                    tag
                )
            );

        });

        return list;

    }


    createActions(game) {

        const actions = createElement(
            "div",
            "card-actions"
        );

        const playLink = createElement(
            "a",
            "button button-primary",
            "Play game"
        );

        playLink.href = game.url;

        playLink.dataset.gameId = game.id;

        actions.appendChild(playLink);

        actions.appendChild(
            this.createFavoriteButton(game)
        );

        return actions;

    }


    createFavoriteButton(game) {

        const button = createElement(
            "button",
            "favorite-button"
        );

        button.type = "button";

        button.dataset.favoriteId = game.id;

        const isFavorite =
            this.favorites.has(game.id);

        button.setAttribute(
            "aria-pressed",
            String(isFavorite)
        );

        button.setAttribute(
            "aria-label",

            isFavorite

                ? `Remove ${game.title} from favorites`

                : `Add ${game.title} to favorites`

        );

        const svg = createElement("span");

        svg.setAttribute("aria-hidden", "true");

        svg.textContent = "♥";

        const label = createElement(
            "span",
            "",
            isFavorite ? "Saved" : "Favorite"
        );

        button.append(svg, label);

        return button;

    }


    createUpdateCard(game) {

        const article = createElement(
            "article",
            "update-card"
        );

        const visual = createElement(
            "div",
            "card-visual"
        );

        visual.appendChild(
            this.createVisualMark(game)
        );

        const body = createElement(
            "div",
            "card-body"
        );

        body.appendChild(
            createElement(
                "span",
                "update-date",
                `Updated ${game.updatedAt}`
            )
        );

        body.appendChild(
            createElement(
                "h3",
                "",
                game.title
            )
        );

        body.appendChild(
            createElement(
                "p",
                "card-description",
                game.updateDescription ||
                    "A new update is available."
            )
        );

        const link = createElement(
            "a",
            "button button-secondary",
            "Explore game"
        );

        link.href = game.url;

        link.dataset.gameId = game.id;

        body.appendChild(link);

        article.append(visual, body);

        return article;

    }


    renderFavorites(service) {

        const container =
            document.getElementById("favorites-list");

        const count =
            document.getElementById("favorites-count");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const games = service.getAll();

        if (count) {

            count.textContent =
                `${games.length} saved`;

        }

        if (games.length === 0) {

            container.appendChild(
                this.createEmptyMessage(
                    "Your favorites will appear here when you save a game."
                )
            );

            return;

        }

        games.forEach(game => {

            container.appendChild(
                this.createPersonalItem(game, true)
            );

        });

    }


    renderRecentlyPlayed(service) {

        const container =
            document.getElementById("recently-played-list");

        if (!container) {
            return;
        }

        container.replaceChildren();

        const games = service.getAll();

        if (games.length === 0) {

            container.appendChild(
                this.createEmptyMessage(
                    "Games you open from this directory will appear here."
                )
            );

            return;

        }

        games.forEach(game => {

            container.appendChild(
                this.createPersonalItem(game, false)
            );

        });

    }


    createPersonalItem(game, showFavoriteButton) {

        const item = createElement(
            "div",
            "personal-item"
        );

        const link = createElement(
            "a",
            "",
            game.title
        );

        link.href = game.url;

        link.dataset.gameId = game.id;

        const description = createElement(
            "small",
            "",
            game.category
        );

        link.appendChild(description);

        item.appendChild(link);

        if (showFavoriteButton) {

            item.appendChild(
                this.createFavoriteButton(game)
            );

        }

        return item;

    }

}


/* ================================================================
   11. SEARCH COMPONENT
   ================================================================ */

/*
 * Search supports:
 *
 *   - Matching titles, descriptions, categories, developers, tags
 *   - ArrowUp and ArrowDown to select suggestions
 *   - Enter to open a selected suggestion
 *   - Escape to close suggestions
 *   - A clear-search button
 *
 * Focus stays in the search input while the active suggestion
 * changes. aria-activedescendant communicates the active option.
 */

class GameSearch {

    constructor(library, renderer, accessibility) {

        this.library = library;

        this.renderer = renderer;

        this.accessibility = accessibility;

        this.input =
            document.getElementById("game-search");

        this.form =
            document.getElementById("game-search-form");

        this.clearButton =
            document.getElementById("clear-search");

        this.resultsPanel =
            document.getElementById("search-results");

        this.suggestionList =
            document.getElementById("suggestion-list");

        this.resultCount =
            document.getElementById("result-count");

        this.closeButton =
            document.getElementById("close-results");

        this.activeIndex = -1;

        this.results = [];

        this.debounceTimer = null;

        this.initialize();

    }


    initialize() {

        if (!this.input) {
            return;
        }

        this.input.addEventListener(
            "input",
            () => this.handleInput()
        );

        this.input.addEventListener(
            "keydown",
            event => this.handleKeydown(event)
        );

        if (this.form) {

            this.form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    this.openActiveResult();

                }
            );

        }

        if (this.clearButton) {

            this.clearButton.addEventListener(
                "click",
                () => this.clear()
            );

        }

        if (this.closeButton) {

            this.closeButton.addEventListener(
                "click",
                () => this.close(true)
            );

        }

        document.addEventListener(
            "pointerdown",
            event => {

                if (
                    this.resultsPanel &&
                    !this.resultsPanel.hidden &&
                    !event.target.closest(".site-shell")
                ) {

                    this.close(false);

                }

            }
        );

    }


    handleInput() {

        window.clearTimeout(this.debounceTimer);

        const query = this.input.value.trim();

        if (this.clearButton) {

            this.clearButton.hidden = query.length === 0;

        }

        this.activeIndex = -1;

        this.input.removeAttribute(
            "aria-activedescendant"
        );

        if (!query) {

            this.close(false);

            this.renderer.renderLibrary();

            this.accessibility.clearAnnouncement();

            return;

        }

        this.debounceTimer = window.setTimeout(
            () => this.updateResults(query),
            100
        );

    }


    updateResults(query) {

        this.results = this.library
            .search(query)
            .slice(
                0,
                GAMES_CONFIG.MAX_SEARCH_RESULTS
            );

        this.renderSuggestions();

        this.renderer.renderLibrary(
            this.library.search(query)
        );

        if (this.resultsPanel) {

            this.resultsPanel.hidden = false;

        }

        if (this.resultCount) {

            this.resultCount.textContent =
                `${this.results.length} suggestions`;

        }

        if (this.results.length === 0) {

            this.accessibility.announce(
                `No games found for ${query}.`
            );

        } else {

            this.accessibility.announce(
                `${this.results.length} game suggestions available.`
            );

        }

    }


    renderSuggestions() {

        if (!this.suggestionList) {
            return;
        }

        this.suggestionList.replaceChildren();

        if (this.results.length === 0) {

            this.suggestionList.appendChild(
                createElement(
                    "p",
                    "no-results",
                    "No matching games. Try another search."
                )
            );

            return;

        }

        this.results.forEach((game, index) => {

            const option = createElement(
                "a",
                "suggestion-card"
            );

            option.id = `game-suggestion-${index}`;

            option.href = game.url;

            option.dataset.gameId = game.id;

            option.setAttribute("role", "option");

            option.setAttribute(
                "aria-selected",
                "false"
            );

            option.tabIndex = -1;

            const thumbnail = createElement(
                "span",
                "suggestion-thumb"
            );

            thumbnail.appendChild(
                createSvgIcon(game.icon)
            );

            const copy = createElement(
                "span"
            );

            copy.appendChild(
                createElement(
                    "span",
                    "suggestion-title",
                    game.title
                )
            );

            copy.appendChild(
                createElement(
                    "span",
                    "suggestion-description",
                    game.description
                )
            );

            copy.appendChild(
                createElement(
                    "span",
                    "suggestion-meta",
                    `${game.category} · ${game.developer}`
                )
            );

            const openLabel = createElement(
                "span",
                "suggestion-open",
                "Open game"
            );

            option.append(
                thumbnail,
                copy,
                openLabel
            );

            this.suggestionList.appendChild(option);

        });

    }


    handleKeydown(event) {

        if (event.key === "Escape") {

            if (
                this.resultsPanel &&
                !this.resultsPanel.hidden
            ) {

                event.preventDefault();

                this.close(false);

            }

            return;

        }

        if (
            event.key === "ArrowDown" &&
            this.results.length > 0
        ) {

            event.preventDefault();

            this.moveActive(1);

            return;

        }

        if (
            event.key === "ArrowUp" &&
            this.results.length > 0
        ) {

            event.preventDefault();

            this.moveActive(-1);

            return;

        }

        if (
            event.key === "Enter" &&
            this.activeIndex >= 0
        ) {

            event.preventDefault();

            this.openActiveResult();

        }

    }


    moveActive(direction) {

        if (this.results.length === 0) {
            return;
        }

        if (
            !this.resultsPanel ||
            this.resultsPanel.hidden
        ) {
            return;
        }

        this.activeIndex = (

            this.activeIndex +
            direction +
            this.results.length

        ) % this.results.length;

        const options =
            this.suggestionList.querySelectorAll(
                '[role="option"]'
            );

        options.forEach((option, index) => {

            const selected =
                index === this.activeIndex;

            option.setAttribute(
                "aria-selected",
                String(selected)
            );

        });

        const activeOption =
            options[this.activeIndex];

        if (activeOption) {

            this.input.setAttribute(
                "aria-activedescendant",
                activeOption.id
            );

            activeOption.scrollIntoView({
                block: "nearest"
            });

        }

    }


    openActiveResult() {

        if (
            this.activeIndex < 0 ||
            this.activeIndex >= this.results.length
        ) {

            return;

        }

        const game = this.results[this.activeIndex];

        if (!game) {
            return;
        }

        window.location.href = game.url;

    }


    clear() {

        if (!this.input) {
            return;
        }

        window.clearTimeout(this.debounceTimer);

        this.input.value = "";

        this.activeIndex = -1;

        this.results = [];

        this.input.removeAttribute(
            "aria-activedescendant"
        );

        if (this.clearButton) {

            this.clearButton.hidden = true;

        }

        this.close(false);

        this.renderer.renderLibrary();

        this.accessibility.clearAnnouncement();

        this.input.focus();

    }


    close(returnFocus = false) {

        if (this.resultsPanel) {

            this.resultsPanel.hidden = true;

        }

        this.activeIndex = -1;

        this.input?.removeAttribute(
            "aria-activedescendant"
        );

        if (this.suggestionList) {

            this.suggestionList
                .querySelectorAll('[role="option"]')
                .forEach(option => {

                    option.setAttribute(
                        "aria-selected",
                        "false"
                    );

                });

        }

        if (returnFocus && this.input) {

            this.input.focus();

        }

    }

}


/* ================================================================
   12. DROPDOWN CONTROL
   ================================================================ */

/*
 * DropdownControl manages a button and its associated popover.
 *
 * It supports:
 *
 *   - Click to open and close
 *   - Escape to close
 *   - Outside-click dismissal
 *   - aria-expanded synchronization
 *   - Predictable focus restoration
 */

class DropdownControl {

    constructor(button, panel) {

        this.button = button;

        this.panel = panel;

        if (!this.button || !this.panel) {
            return;
        }

        this.button.addEventListener(
            "click",
            () => this.toggle()
        );

        this.button.addEventListener(
            "keydown",
            event => {

                if (event.key === "ArrowDown") {

                    event.preventDefault();

                    this.open();

                    this.focusFirstItem();

                }

            }
        );

        this.panel.addEventListener(
            "keydown",
            event => {

                if (event.key === "Escape") {

                    event.preventDefault();

                    this.close(true);

                }

            }
        );

        this.panel.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest("a") ||
                    event.target.closest("button")
                ) {

                    this.close(false);

                }

            }
        );

        document.addEventListener(
            "pointerdown",
            event => {

                if (
                    !this.panel.hidden &&
                    !this.button.contains(event.target) &&
                    !this.panel.contains(event.target)
                ) {

                    this.close(false);

                }

            }
        );

    }


    isOpen() {

        return Boolean(
            this.panel &&
            !this.panel.hidden
        );

    }


    toggle() {

        if (this.isOpen()) {

            this.close(false);

        } else {

            this.open();

        }

    }


    open() {

        if (!this.button || !this.panel) {
            return;
        }

        this.panel.hidden = false;

        this.button.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    close(returnFocus = false) {

        if (!this.button || !this.panel) {
            return;
        }

        this.panel.hidden = true;

        this.button.setAttribute(
            "aria-expanded",
            "false"
        );

        if (returnFocus) {

            this.button.focus();

        }

    }


    focusFirstItem() {

        if (!this.panel) {
            return;
        }

        const firstItem =
            this.panel.querySelector(
                "a, button"
            );

        firstItem?.focus();

    }

}


/* ================================================================
   13. NAVIGATION HISTORY RENDERER
   ================================================================ */

class NavigationHistoryRenderer {

    constructor(historyService) {

        this.historyService = historyService;

        this.container =
            document.getElementById("history-items");

    }


    render() {

        if (!this.container) {
            return;
        }

        this.container.replaceChildren();

        const entries =
            this.historyService.getAll();

        if (entries.length === 0) {

            this.container.appendChild(
                createElement(
                    "p",
                    "empty-mini",
                    "Your recent destinations will appear here."
                )
            );

            return;

        }

        entries.forEach(entry => {

            const link = createElement("a");

            link.href = entry.url;

            link.dataset.historyId = entry.id;

            const title = createElement(
                "span",
                "",
                entry.title
            );

            const details = createElement(
                "small",
                "",
                "Recently visited"
            );

            link.append(title, details);

            this.container.appendChild(link);

        });

    }

}


/* ================================================================
   14. SECTION SHORTCUTS
   ================================================================ */

/*
 * The existing desktop and mobile controls share section IDs.
 *
 * We do not create another sidebar. These controls simply open
 * their own popovers and navigate to existing page sections.
 */

class SectionNavigation {

    constructor() {

        this.controls = [

            new DropdownControl(

                document.getElementById("sections-toggle"),

                document.getElementById("sections-menu")

            ),

            new DropdownControl(

                document.getElementById(
                    "sections-toggle-mobile"
                ),

                document.getElementById(
                    "sections-menu-mobile"
                )

            )

        ];

        document.querySelectorAll(
            "[data-scroll-to]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => this.scrollToSection(button)
            );

        });

        /*
         * Close section popovers after following a destination.
         */

        document.querySelectorAll(
            ".sections-menu a"
        ).forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    this.controls.forEach(
                        control => control.close(false)
                    );

                }
            );

        });

    }


    scrollToSection(button) {

        const id = button.dataset.scrollTo;

        if (!id) {
            return;
        }

        const section =
            document.getElementById(id);

        if (!section) {
            return;
        }

        section.scrollIntoView({
            behavior: window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches

                ? "auto"

                : "smooth",

            block: "start"

        });

    }

}


/* ================================================================
   15. GAMES PAGE CONTROLLER
   ================================================================ */

/*
 * GamesPage coordinates the services and interface components.
 *
 * Individual services do not need to know how the entire page
 * is assembled.
 */

class GamesPage {

    constructor() {

        this.library = new GameLibrary(
            GAME_DIRECTORY
        );

        this.accessibility =
            new AccessibilityControl();

        this.favorites = new FavoritesService(
            this.library
        );

        this.recentlyPlayed =
            new RecentlyPlayedService(
                this.library
            );

        this.navigationHistory =
            new NavigationHistoryService(
                this.library
            );

        this.renderer = new GameRenderer(
            this.library,
            this.favorites
        );

        this.historyRenderer =
            new NavigationHistoryRenderer(
                this.navigationHistory
            );

        this.search = null;

        this.dropdowns = [];

        this.sectionNavigation = null;

    }


    initialize() {

        /*
         * Record the directory itself as a visited destination.
         */

        this.navigationHistory.record({

            id: "games-directory",

            title: "Games Directory",

            url: window.location.href

        });

        /*
         * Render the initial interface.
         */

        this.renderer.renderAll();

        this.renderer.renderFavorites(
            this.favorites
        );

        this.renderer.renderRecentlyPlayed(
            this.recentlyPlayed
        );

        this.historyRenderer.render();

        /*
         * Initialize search and dropdowns.
         */

        this.search = new GameSearch(
            this.library,
            this.renderer,
            this.accessibility
        );

        this.dropdowns.push(

            new DropdownControl(

                document.getElementById(
                    "history-toggle"
                ),

                document.getElementById(
                    "history-menu"
                )

            )

        );

        this.sectionNavigation =
            new SectionNavigation();

        /*
         * Delegate events from dynamically generated cards.
         */

        this.initializeFavoriteEvents();

        this.initializeGameLinks();

        this.initializeHistoryControls();

        /*
         * Refresh personal sections when another tab changes
         * this site's saved directory information.
         */

        window.addEventListener(
            "storage",
            event => this.handleStorageChange(event)
        );

        this.log("Games directory initialized.");

    }


    initializeFavoriteEvents() {

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-favorite-id]"
                    );

                if (!button) {
                    return;
                }

                const gameId =
                    button.dataset.favoriteId;

                const game =
                    this.library.getById(gameId);

                if (!game) {
                    return;
                }

                const isFavorite =
                    this.favorites.toggle(gameId);

                /*
                 * Re-render all favorite controls so the state
                 * remains consistent wherever the game appears.
                 */

                this.renderer.renderAll();

                this.renderer.renderFavorites(
                    this.favorites
                );

                this.renderer.renderRecentlyPlayed(
                    this.recentlyPlayed
                );

                /*
                 * Restore focus to the corresponding favorite
                 * control after rebuilding the cards.
                 */

                const matchingButtons = [
                    ...document.querySelectorAll(
                        "[data-favorite-id]"
                    )
                ];

                const matchingButton =
                    matchingButtons.find(
                        item =>
                            item.dataset.favoriteId === gameId
                    );

                matchingButton?.focus();

                this.log(
                    `${game.title}: favorite ${isFavorite}`
                );

            }
        );

    }


    initializeGameLinks() {

        document.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest(
                        "a[data-game-id]"
                    );

                if (!link) {
                    return;
                }

                /*
                 * Preserve normal browser behavior for modified
                 * clicks, downloads, and new-tab navigation.
                 */

                if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    link.target === "_blank"
                ) {

                    return;

                }

                const gameId =
                    link.dataset.gameId;

                const game =
                    this.library.getById(gameId);

                if (!game) {
                    return;
                }

                this.recentlyPlayed.record(gameId);

                this.navigationHistory.record({

                    id: game.id,

                    title: game.title,

                    url: new URL(
                        game.url,
                        document.baseURI
                    ).href

                });

                this.renderer.renderRecentlyPlayed(
                    this.recentlyPlayed
                );

                this.historyRenderer.render();

                this.log(
                    `Opening game: ${game.title}`
                );

            }
        );

    }


    initializeHistoryControls() {

        const backButton =
            document.getElementById("browser-back");

        if (backButton) {

            backButton.addEventListener(
                "click",
                () => {

                    /*
                     * Use the browser's real navigation history.
                     */

                    if (window.history.length > 1) {

                        window.history.back();

                    } else {

                        /*
                         * A direct visit may have no previous
                         * same-session page. Return to the site
                         * entry point instead.
                         */

                        window.location.href = "index.html";

                    }

                }
            );

        }

        const clearButton =
            document.getElementById("clear-history");

        if (clearButton) {

            clearButton.addEventListener(
                "click",
                () => {

                    this.recentlyPlayed.clear();

                    this.renderer.renderRecentlyPlayed(
                        this.recentlyPlayed
                    );

                    this.log(
                        "Recently played history cleared."
                    );

                }
            );

        }

    }


    handleStorageChange(event) {

        const relevantKeys = Object.values(
            GAMES_CONFIG.STORAGE_KEYS
        );

        if (
            event.key !== null &&
            !relevantKeys.includes(event.key)
        ) {

            return;

        }

        /*
         * Recreate the services so they read the latest stored
         * values, then update the visible interface.
         */

        this.favorites = new FavoritesService(
            this.library
        );

        this.recentlyPlayed =
            new RecentlyPlayedService(
                this.library
            );

        this.navigationHistory =
            new NavigationHistoryService(
                this.library
            );

        this.renderer = new GameRenderer(
            this.library,
            this.favorites
        );

        this.renderer.renderAll();

        this.renderer.renderFavorites(
            this.favorites
        );

        this.renderer.renderRecentlyPlayed(
            this.recentlyPlayed
        );

        this.historyRenderer =
            new NavigationHistoryRenderer(
                this.navigationHistory
            );

        this.historyRenderer.render();

    }


    log(message) {

        if (GAMES_CONFIG.DEBUG) {

            console.info(
                "[GamesPage]",
                message
            );

        }

    }

}


/* ================================================================
   16. INITIALIZATION
   ================================================================ */

/*
 * The HTML loads this file with the defer attribute.
 *
 * DOMContentLoaded provides an additional safeguard in case this
 * script is moved or loaded differently in the future.
 */

function initializeGamesPage() {

    if (window.gamesPage) {
        return;
    }

    window.gamesPage = new GamesPage();

    window.gamesPage.initialize();

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGamesPage,
        { once: true }
    );

} else {

    initializeGamesPage();

}