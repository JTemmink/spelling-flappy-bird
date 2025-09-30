import { DIFFICULTY } from '../utils/constants.js';

/**
 * ScoreManager - Singleton class for Model B scoring system
 * Score can go negative, no game over on negative score
 */
class ScoreManager {
    static #instance = null;

    constructor() {
        this.currentScore = 0;
        this.wordsAttempted = 0;
        this.wordsCorrect = 0;
        this.wordsWrong = 0;
        this.currentDifficulty = 'EASY';
        this.sessionStartTime = null;
    }

    /**
     * Initialize the singleton instance
     * @returns {ScoreManager} The singleton instance
     */
    static init() {
        if (!ScoreManager.#instance) {
            ScoreManager.#instance = new ScoreManager();
        }
        return ScoreManager.#instance;
    }

    /**
     * Get the singleton instance
     * @returns {ScoreManager} The singleton instance
     * @throws {Error} If not initialized
     */
    static getInstance() {
        if (!ScoreManager.#instance) {
            throw new Error('ScoreManager not initialized. Call ScoreManager.init() first.');
        }
        return ScoreManager.#instance;
    }

    /**
     * Set the current difficulty level
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     */
    setDifficulty(difficulty) {
        const key = difficulty.toUpperCase();
        if (!DIFFICULTY[key]) {
            console.warn(`Invalid difficulty: ${difficulty}. Using 'EASY' instead.`);
            this.currentDifficulty = 'EASY';
        } else {
            this.currentDifficulty = key;
        }
    }

    /**
     * Add points for correct choice
     * @returns {Object} Result object with score, points, and isCorrect
     */
    addCorrect() {
        const points = DIFFICULTY[this.currentDifficulty].points;
        this.currentScore += points;
        this.wordsCorrect++;
        this.wordsAttempted++;

        return {
            score: this.currentScore,
            points: points,
            isCorrect: true
        };
    }

    /**
     * Add penalty for wrong choice
     * @returns {Object} Result object with score, penalty, and isCorrect
     */
    addWrong() {
        const penalty = DIFFICULTY[this.currentDifficulty].penalty;
        this.currentScore += penalty; // Can go negative!
        this.wordsWrong++;
        this.wordsAttempted++;

        return {
            score: this.currentScore,
            penalty: penalty,
            isCorrect: false
        };
    }

    /**
     * Get current score
     * @returns {number} Current score value
     */
    getScore() {
        return this.currentScore;
    }

    /**
     * Start a new session
     */
    startSession() {
        this.reset();
        this.sessionStartTime = Date.now();
        console.log('New session started');
    }

    /**
     * Get session duration in seconds
     * @returns {number} Duration in seconds
     */
    getSessionDuration() {
        if (this.sessionStartTime === null) return 0;
        return Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }

    /**
     * Get session statistics
     * @returns {Object} Stats object with score, counters, accuracy, and duration
     */
    getStats() {
        const accuracy = this.wordsAttempted > 0 
            ? this.wordsCorrect / this.wordsAttempted 
            : 0;

        return {
            score: this.currentScore,
            wordsAttempted: this.wordsAttempted,
            wordsCorrect: this.wordsCorrect,
            wordsWrong: this.wordsWrong,
            accuracy: accuracy,
            duration: this.getSessionDuration()
        };
    }

    /**
     * Reset all counters to 0
     * Called when starting a new game session
     */
    reset() {
        this.currentScore = 0;
        this.wordsAttempted = 0;
        this.wordsCorrect = 0;
        this.wordsWrong = 0;
        this.sessionStartTime = null;
        console.log('ScoreManager reset');
    }
}

export default ScoreManager;
