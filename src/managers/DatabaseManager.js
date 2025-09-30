import { createClient } from '@supabase/supabase-js'

/**
 * DatabaseManager - Singleton class for all Supabase database operations
 * Provides a clean abstraction layer for database interactions
 */
export class DatabaseManager {
    static #instance = null

    constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables. Check your .env.local file.')
        }

        this.supabase = createClient(supabaseUrl, supabaseKey)
    }

    /**
     * Initialize the DatabaseManager singleton
     */
    static async init() {
        if (!this.#instance) {
            this.#instance = new DatabaseManager()
        }
        return this.#instance
    }

    /**
     * Get the DatabaseManager singleton instance
     */
    static getInstance() {
        if (!this.#instance) {
            throw new Error('DatabaseManager not initialized. Call init() first.')
        }
        return this.#instance
    }

    /**
     * Get the Supabase client for direct access
     */
    getSupabase() {
        return this.supabase
    }

    /**
     * Fetch words from the database, optionally filtered by difficulty
     * @param {string|null} difficulty - 'easy', 'medium', 'hard', or null for all
     * @returns {Promise<{data: Array|null, error: string|null}>}
     */
    async getWords(difficulty = null) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                let query = this.supabase
                    .from('words')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (difficulty) {
                    query = query.eq('difficulty', difficulty)
                }

                const { data, error } = await query
                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error fetching words:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in getWords:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Fetch word statistics for a specific player
     * @param {string} playerId - UUID of the player
     * @returns {Promise<{data: Array|null, error: string|null}>}
     */
    async getPlayerWordStats(playerId) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                const { data, error } = await this.supabase
                    .from('player_word_stats')
                    .select(`
                        *,
                        words (
                            correct_spelling,
                            wrong_spelling,
                            difficulty
                        )
                    `)
                    .eq('player_id', playerId)
                    .order('last_seen_date', { ascending: false })

                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error fetching player word stats:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in getPlayerWordStats:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Update or insert word statistics for a player
     * Handles correct_streak, mastery_level transitions, and last_wrong_date
     * @param {string} playerId - UUID of the player
     * @param {string} wordId - UUID of the word
     * @param {boolean} isCorrect - Whether the player answered correctly
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async upsertWordStat(playerId, wordId, isCorrect) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                // First, try to get existing stats
                const { data: existingStats } = await this.supabase
                    .from('player_word_stats')
                    .select('total_correct, total_wrong, correct_streak, last_wrong_date')
                    .eq('player_id', playerId)
                    .eq('word_id', wordId)
                    .single()

                // Calculate new values based on isCorrect
                let newStats;
                if (isCorrect) {
                    // Correct answer: increment streak and total_correct
                    const newStreak = (existingStats?.correct_streak || 0) + 1;
                    let masteryLevel;
                    if (newStreak === 0) {
                        masteryLevel = 'learning';
                    } else if (newStreak === 1 || newStreak === 2) {
                        masteryLevel = 'practicing';
                    } else {
                        masteryLevel = 'mastered';
                    }
                    
                    newStats = {
                        player_id: playerId,
                        word_id: wordId,
                        correct_streak: newStreak,
                        total_correct: (existingStats?.total_correct || 0) + 1,
                        total_wrong: existingStats?.total_wrong || 0,
                        last_wrong_date: existingStats?.last_wrong_date || null,
                        last_seen_date: new Date().toISOString(),
                        mastery_level: masteryLevel
                    };
                } else {
                    // Wrong answer: reset streak, increment total_wrong, set last_wrong_date
                    newStats = {
                        player_id: playerId,
                        word_id: wordId,
                        correct_streak: 0,  // Reset streak on wrong answer
                        total_correct: existingStats?.total_correct || 0,
                        total_wrong: (existingStats?.total_wrong || 0) + 1,
                        last_wrong_date: new Date().toISOString(),  // Set current timestamp
                        last_seen_date: new Date().toISOString(),
                        mastery_level: 'learning'  // Back to learning on wrong answer
                    };
                }

                const { data, error } = await this.supabase
                    .from('player_word_stats')
                    .upsert(newStats)
                    .select()
                    .single()

                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error upserting word stat:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in upsertWordStat:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Save a game session record
     * @param {Object} sessionData - Session data object
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async saveGameSession(sessionData) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                const { data, error } = await this.supabase
                    .from('game_sessions')
                    .insert(sessionData)
                    .select()
                    .single()

                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error saving game session:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in saveGameSession:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Save a new highscore
     * @param {string} playerId - UUID of the player
     * @param {number} score - Score achieved
     * @param {string} difficulty - Difficulty level
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async saveHighscore(playerId, score, difficulty) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                const { data, error } = await this.supabase
                    .from('highscores')
                    .insert({
                        player_id: playerId,
                        score: score,
                        difficulty: difficulty
                    })
                    .select()
                    .single()

                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error saving highscore:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in saveHighscore:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Fetch top highscores, optionally filtered by difficulty
     * @param {number} limit - Maximum number of highscores to return
     * @param {string|null} difficulty - Difficulty filter or null for all
     * @returns {Promise<{data: Array|null, error: string|null}>}
     */
    async getHighscores(limit = 10, difficulty = null) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                let query = this.supabase
                    .from('highscores')
                    .select(`
                        *,
                        players (
                            username
                        )
                    `)
                    .order('score', { ascending: false })
                    .limit(limit)

                if (difficulty) {
                    query = query.eq('difficulty', difficulty)
                }

                const { data, error } = await query
                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error fetching highscores:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in getHighscores:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Create a new player record
     * @param {string} authId - UUID from Supabase Auth
     * @param {string} username - Player's chosen username
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async createPlayer(authId, username) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 5000)
            )

            const queryPromise = (async () => {
                const { data, error } = await this.supabase
                    .from('players')
                    .insert({
                        auth_id: authId,
                        username: username
                    })
                    .select()
                    .single()

                return { data, error }
            })()

            const result = await Promise.race([queryPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Error creating player:', result.error)
                return { data: null, error: result.error.message }
            }

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Database error in createPlayer:', error)
            return { data: null, error: error.message }
        }
    }
}

// Default export for compatibility
export default DatabaseManager

