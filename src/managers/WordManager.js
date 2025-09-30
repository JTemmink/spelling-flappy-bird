import DatabaseManager from './DatabaseManager.js';
import { DIFFICULTY } from '../utils/constants.js';

/**
 * WordManager - Singleton class for word selection and management
 * Phase 3: Simple random word selection
 * Phase 4: Adaptive weighting algorithm with player stats
 */
class WordManager {
    static #instance = null;

    constructor() {
        this.wordsCache = [];
        this.lastFetchTime = 0;
        this.CACHE_DURATION = 300000; // 5 minutes in milliseconds
        this.playerStats = null;
        this.sessionWords = null;
        this.sessionWordIndex = 0;
    }

    /**
     * Initialize the singleton instance
     * @returns {WordManager} The singleton instance
     */
    static async init() {
        if (!WordManager.#instance) {
            WordManager.#instance = new WordManager();
        }
        return WordManager.#instance;
    }

    /**
     * Get the singleton instance
     * @returns {WordManager} The singleton instance
     * @throws {Error} If not initialized
     */
    static getInstance() {
        if (!WordManager.#instance) {
            throw new Error('WordManager not initialized. Call WordManager.init() first.');
        }
        return WordManager.#instance;
    }

    /**
     * Load words from database with caching
     * @param {string|null} difficulty - Filter by difficulty ('easy', 'medium', 'hard') or null for all
     * @returns {Promise<Array>} Array of word objects
     */
    async loadWords(difficulty = null) {
        const now = Date.now();
        
        // Check if cache is valid
        if (this.wordsCache.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
            console.log('Using cached words');
            return this.filterWordsByDifficulty(this.wordsCache, difficulty);
        }

        try {
            console.log('Fetching words from database...');
            const { data } = await DatabaseManager.getInstance().getWords(difficulty);
            
            this.wordsCache = data ?? [];
            this.lastFetchTime = now;
            
            console.log(`Loaded ${this.wordsCache.length} words from database`);
            return this.filterWordsByDifficulty(this.wordsCache, difficulty);
        } catch (error) {
            console.error('Error loading words from database:', error);
            
            // Use cached words even if stale
            if (this.wordsCache.length > 0) {
                console.log('Using stale cached words due to database error');
                return this.filterWordsByDifficulty(this.wordsCache, difficulty);
            }
            
            // Return empty array if no cache available
            return [];
        }
    }

    /**
     * Load player word statistics from database
     * @param {string} playerId - UUID of the player
     * @returns {Promise<Array>} Array of player word stats
     */
    async loadPlayerStats(playerId) {
        try {
            const { data } = await DatabaseManager.getInstance().getPlayerWordStats(playerId);
            this.playerStats = data || [];
            return this.playerStats;
        } catch (error) {
            console.error('Error loading player stats:', error);
            this.playerStats = [];
            return [];
        }
    }

    /**
     * Calculate word weight based on player performance
     * @param {Object} wordStat - Word stat object with streak and wrong date
     * @returns {number} Weight value (higher = more priority)
     */
    calculateWordWeight(wordStat) {
        // RULE 1: Wrong in last 3 days = highest priority
        if (wordStat.last_wrong_date) {
            const daysSince = (Date.now() - new Date(wordStat.last_wrong_date).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 3) return 1000;
        }
        
        // RULE 2: Mastered (3+ correct streak) = lowest priority
        if (wordStat.correct_streak >= 3) return 1;
        
        // RULE 3: Still learning = medium priority based on wrong count
        return 10 + (wordStat.total_wrong * 5);
    }

    /**
     * Filter words by word length based on difficulty
     * @param {Array} words - Array of word objects
     * @param {string} difficulty - Difficulty level
     * @returns {Array} Filtered array of words
     */
    filterByWordLength(words, difficulty) {
        if (!difficulty) return words;
        
        const difficultyKey = difficulty.toUpperCase();
        const lengthConfig = DIFFICULTY[difficultyKey]?.wordLength;
        if (!lengthConfig) return words;
        
        return words.filter(word => 
            word.word_length >= lengthConfig.min && 
            word.word_length <= lengthConfig.max
        );
    }

    /**
     * Initialize adaptive session for authenticated players
     * @param {string} playerId - UUID of the player
     * @param {string} difficulty - Difficulty level
     * @returns {Promise<Object>} Session words object with priority and pool
     */
    async initializeSession(playerId, difficulty) {
        // Load player stats
        await this.loadPlayerStats(playerId);
        
        // Get all words and filter by difficulty and word length
        const allWords = this.filterByWordLength(this.wordsCache, difficulty);
        
        // Create words with stats and weights
        const wordsWithStats = allWords.map(word => {
            const stats = this.playerStats.find(stat => stat.word_id === word.id);
            const wordStat = stats || {
                correct_streak: 0,
                total_wrong: 0,
                last_wrong_date: null
            };
            
            return {
                word,
                stats: wordStat,
                weight: this.calculateWordWeight(wordStat)
            };
        });
        
        // Sort by weight descending (highest priority first)
        wordsWithStats.sort((a, b) => b.weight - a.weight);
        
        // Identify review words (correct_streak < 3 OR last_wrong_date within 3 days)
        const reviewWords = wordsWithStats.filter(item => {
            const { stats } = item;
            if (stats.correct_streak < 3) return true;
            if (stats.last_wrong_date) {
                const daysSince = (Date.now() - new Date(stats.last_wrong_date).getTime()) / (1000 * 60 * 60 * 24);
                return daysSince < 3;
            }
            return false;
        });
        
        // Take top 3 review words as priority, rest as pool
        const priority = reviewWords.slice(0, 3);
        const pool = wordsWithStats;
        
        this.sessionWords = { priority, pool };
        this.sessionWordIndex = 0;
        
        console.log(`Session initialized: ${priority.length} priority words, ${pool.length} total words`);
        return this.sessionWords;
    }

    /**
     * Get next word from session (priority first, then weighted random)
     * @returns {Object|null} Word object or null
     */
    getNextSessionWord() {
        if (!this.sessionWords) return null;
        
        // First 3 words come from priority list
        if (this.sessionWordIndex < 3 && this.sessionWordIndex < this.sessionWords.priority.length) {
            const item = this.sessionWords.priority[this.sessionWordIndex];
            this.sessionWordIndex++;
            return item.word;
        }
        
        // Use weighted random selection from pool
        const pool = this.sessionWords.pool;
        if (pool.length === 0) return null;
        
        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of pool) {
            random -= item.weight;
            if (random <= 0) return item.word;
        }
        
        return pool[0].word; // Fallback
    }

    /**
     * Get weighted word for adaptive learning
     * @param {string|null} difficulty - Filter by difficulty
     * @returns {Object|null} Word object or null
     */
    getWeightedWord(difficulty = null) {
        if (!this.sessionWords) {
            // Fallback to random selection
            return this.getRandomWord(difficulty);
        }
        
        const word = this.getNextSessionWord();
        if (!word) return null;
        
        // Apply difficulty filter if specified
        if (difficulty && word.difficulty !== difficulty) {
            return this.getRandomWord(difficulty);
        }
        
        return word;
    }

    /**
     * Get a random word pair from the cache
     * Fallback for unauthenticated users or when session not initialized
     * @param {string|null} difficulty - Filter by difficulty or null for any
     * @returns {Object|null} Word object with { id, correctSpelling, wrongSpelling, difficulty } or null
     */
    getRandomWord(difficulty = null) {
        let availableWords = this.filterWordsByDifficulty(this.wordsCache, difficulty);
        availableWords = this.filterByWordLength(availableWords, difficulty);
        
        if (availableWords.length === 0) {
            console.warn('No words available for selection');
            return null;
        }

        // Use Phaser's RND if available, otherwise fall back to Math.random
        const randomIndex = typeof Phaser !== 'undefined' && Phaser.Math?.RND?.pick 
            ? Phaser.Math.RND.between(0, availableWords.length - 1)
            : Math.floor(Math.random() * availableWords.length);

        return availableWords[randomIndex];
    }

    /**
     * Get a specific word by ID from cache
     * @param {string} wordId - The word ID to find
     * @returns {Object|null} Word object or null if not found
     */
    getWordById(wordId) {
        return this.wordsCache.find(word => word.id === wordId) || null;
    }

    /**
     * Clear the cache to force refresh on next loadWords() call
     */
    clearCache() {
        this.wordsCache = [];
        this.lastFetchTime = 0;
        console.log('Word cache cleared');
    }

    /**
     * Clear current session data
     */
    clearSession() {
        this.sessionWords = null;
        this.sessionWordIndex = 0;
        this.playerStats = null;
        console.log('Session cleared');
    }

    /**
     * Filter words by difficulty
     * @param {Array} words - Array of word objects
     * @param {string|null} difficulty - Difficulty to filter by
     * @returns {Array} Filtered array of words
     */
    filterWordsByDifficulty(words, difficulty) {
        if (!difficulty) {
            return words;
        }
        return words.filter(word => word.difficulty === difficulty);
    }
}

// Default export for compatibility
export default WordManager
