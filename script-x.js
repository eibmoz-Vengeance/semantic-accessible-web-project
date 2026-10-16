/*
 * SEMANTIC ACCESSIBLE WEB PROJECT
 * Interactive Number Guessing Game
 *
 * Visible feedback is written to #game-message.
 * Screen-reader feedback is sent through one dedicated live region:
 * #game-announcement.
 */

"use strict";

const GAME_CONFIG = {
    MIN_NUMBER: 1,
    MAX_NUMBER: 100,
    STARTING_POINTS: 100,
    WAGERS: [5, 10, 20, 50, 100],
    WIN_MULTIPLIER: 2,
    HIGH_SCORE_KEY: "semantic_accessible_number_game_high_score"
};

let points = GAME_CONFIG.STARTING_POINTS;
let targetNumber = generateTargetNumber();
let gameOver = false;
let highScore = getSavedHighScore();

const guessForm = document.getElementById("guess-form");
const userNumberInput = document.getElementById("user-number");
const pointsValue = document.getElementById("points-value");
const highScoreValue = document.getElementById("high-score-value");
const gameMessage = document.getElementById("game-message");
const gameAnnouncement = document.getElementById("game-announcement");
const wagerButtons = document.querySelectorAll("[data-wager]");
const resetGameButton = document.getElementById("reset-game-button");

function generateTargetNumber() {
    return Math.floor(
        Math.random() * (GAME_CONFIG.MAX_NUMBER - GAME_CONFIG.MIN_NUMBER + 1)
    ) + GAME_CONFIG.MIN_NUMBER;
}

function isValidGuess(guess) {
    return Number.isInteger(guess) &&
        guess >= GAME_CONFIG.MIN_NUMBER &&
        guess <= GAME_CONFIG.MAX_NUMBER;
}

function isValidWager(wager) {
    return GAME_CONFIG.WAGERS.includes(wager);
}

function getSavedHighScore() {
    try {
        const savedValue = window.localStorage.getItem(GAME_CONFIG.HIGH_SCORE_KEY);
        if (savedValue === null) {
            return GAME_CONFIG.STARTING_POINTS;
        }

        const savedScore = Number(savedValue);
        return Number.isFinite(savedScore) && savedScore >= GAME_CONFIG.STARTING_POINTS
            ? savedScore
            : GAME_CONFIG.STARTING_POINTS;
    } catch (error) {
        // The game remains playable if browser storage is unavailable.
        return GAME_CONFIG.STARTING_POINTS;
    }
}

function saveHighScore() {
    try {
        window.localStorage.setItem(GAME_CONFIG.HIGH_SCORE_KEY, String(highScore));
    } catch (error) {
        // Storage may be blocked by browser privacy settings.
    }
}

function showMessage(message) {
if (gameMessage) {
gameMessage.textContent = message;
}
}

function announceMessage(message) {
if (!gameAnnouncement) {
return;
}


// Clear the previous announcement so identical messages
// can be announced again when appropriate.
gameAnnouncement.textContent = "";

window.requestAnimationFrame(() => {
    gameAnnouncement.textContent = message;
});


}

function updateScore() {
    if (pointsValue) {
        pointsValue.textContent = String(points);
    }

    if (highScoreValue) {
        highScoreValue.textContent = String(highScore);
    }
}

function updateHighScore() {
    if (points > highScore) {
        highScore = points;
        saveHighScore();
    }
}

function updateWagerButtons() {
    wagerButtons.forEach(button => {
        const wager = Number(button.dataset.wager);
        button.disabled = gameOver || !isValidWager(wager) || wager > points;
    });
}

function checkGameOver() {
    if (points <= 0) {
        points = 0;
        gameOver = true;
        showMessage("Game over! You have run out of points. Select Restart Game to play again.");
        updateScore();
        updateWagerButtons();
        return true;
    }

    return false;
}

function processGuess(guess, wager) {
    let resultMessage;

    if (guess === targetNumber) {
        const reward = wager * GAME_CONFIG.WIN_MULTIPLIER;

        points += reward;

        resultMessage =
            `Congratulations! You guessed the number ${targetNumber}. ` +
            `Your ${wager}-point wager returned ${reward} points.`;

        targetNumber = generateTargetNumber();
    } else {
        points = Math.max(0, points - wager);

        if (guess < targetNumber) {
            resultMessage =
                `Your guess was too low. You lost ${wager} points.`;
        } else {
            resultMessage =
                `Your guess was too high. You lost ${wager} points.`;
        }
    }

    // Check whether the player has run out of points.
    const isOver = checkGameOver();

    // Update the visible message independently of the announcement.
    if (!isOver) {
        showMessage(resultMessage);
    }

    // Build one complete screen-reader announcement.
    let announcement =
        `${resultMessage} Your current score is ${points} points.`;

    if (isOver) {
        announcement +=
            " Game over. Select Restart Game to play again.";
    } else {
        announcement += " Enter a number and select your wager.";
    }

    announceMessage(announcement);
}



if (guessForm && userNumberInput) {
    guessForm.addEventListener("submit", event => {
        event.preventDefault();

        if (gameOver) {
            showMessage("The game is over. Select Restart Game to begin a new round.");
            return;
        }

        const rawGuess = userNumberInput.value.trim();

        // An empty field is invalid; do not convert it to zero.
        if (rawGuess === "" || !/^\d+$/.test(rawGuess)) {
            showMessage("Please enter a whole number from 1 to 100.");
            userNumberInput.focus();
            return;
        }

        const guess = Number(rawGuess);
        if (!isValidGuess(guess)) {
            showMessage("Please enter a whole number from 1 to 100.");
            userNumberInput.focus();
            return;
        }

        const submitter = event.submitter;
        const wager = submitter ? Number(submitter.dataset.wager) : NaN;

        if (!isValidWager(wager)) {
            showMessage("Please choose one of the wager buttons before submitting your guess.");
            return;
        }

        if (wager > points) {
            showMessage(`You do not have enough points for a ${wager}-point wager.`);
            return;
        }

        processGuess(guess, wager);
        updateHighScore();
        updateScore();
        updateWagerButtons();

        // Clear the field. Refocusing it is intentional for quick repeated guesses.
        // Using a text input with inputmode=numeric avoids number-input zero quirks.
        userNumberInput.value = "";

        if (!gameOver) {
            userNumberInput.focus({ preventScroll: true });
        }
    });
}

if (resetGameButton) {
    resetGameButton.addEventListener("click", () => {
        points = GAME_CONFIG.STARTING_POINTS;
        targetNumber = generateTargetNumber();
        gameOver = false;

        if (userNumberInput) {
            userNumberInput.value = "";
        }

        updateScore();
        updateWagerButtons();
        showMessage("A new game has started. Enter a number and select your wager.");

        if (userNumberInput) {
            userNumberInput.focus({ preventScroll: true });
        }
    });
}

// Initialize the interface.
updateScore();
updateWagerButtons();
