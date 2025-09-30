import { createClient } from '@supabase/supabase-js'
import { DatabaseManager } from './DatabaseManager.js'

/**
 * AuthManager - Singleton class for handling Supabase authentication
 * Provides a clean API for user authentication and session management
 */
export class AuthManager {
    static #instance = null
    #currentUser = null

    constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables. Check your .env.local file.')
        }

        this.supabase = createClient(supabaseUrl, supabaseKey)
        
        // Service role client for admin operations like deleting auth users
        if (supabaseServiceKey) {
            this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })
        }
        
        this.setupAuthStateListener()
    }

    /**
     * Initialize the AuthManager singleton
     */
    static async init() {
        if (!this.#instance) {
            this.#instance = new AuthManager()
        }
        return this.#instance
    }

    /**
     * Get the AuthManager singleton instance
     */
    static getInstance() {
        if (!this.#instance) {
            throw new Error('AuthManager not initialized. Call init() first.')
        }
        return this.#instance
    }

    /**
     * Set up listener for authentication state changes
     */
    setupAuthStateListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.#currentUser = session?.user || null
            } else if (event === 'SIGNED_OUT') {
                this.#currentUser = null
            }
        })
    }

    /**
     * Sign up a new user with email and password
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @param {string} username - User's chosen username
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async signUp(email, password, username) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Authentication timeout')), 10000)
            )

            const signUpPromise = (async () => {
                // Create user in Supabase Auth
                const { data: authData, error: authError } = await this.supabase.auth.signUp({
                    email: email,
                    password: password
                })

                if (authError) {
                    return { data: null, error: authError.message }
                }

                if (!authData.user) {
                    return { data: null, error: 'Failed to create user account' }
                }

                // Create player record in database
                const dbManager = DatabaseManager.getInstance()
                const { data: playerData, error: playerError } = await dbManager.createPlayer(
                    authData.user.id,
                    username
                )

                if (playerError) {
                    // If player creation fails, clean up the auth user to prevent orphaned accounts
                    console.error('Failed to create player record:', playerError)
                    
                    if (this.supabaseAdmin) {
                        try {
                            await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id)
                            console.log('Cleaned up orphaned auth user:', authData.user.id)
                        } catch (cleanupError) {
                            console.error('Failed to clean up auth user:', cleanupError)
                        }
                    }
                    
                    return { data: null, error: 'Failed to create player profile' }
                }

                this.#currentUser = authData.user
                return { 
                    data: { 
                        user: authData.user, 
                        player: playerData 
                    }, 
                    error: null 
                }
            })()

            const result = await Promise.race([signUpPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Sign up error:', result.error)
                return { data: null, error: result.error }
            }

            return result
        } catch (error) {
            console.error('Authentication error in signUp:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Sign in an existing user
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async signIn(email, password) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Authentication timeout')), 10000)
            )

            const signInPromise = (async () => {
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                })

                if (error) {
                    return { data: null, error: error.message }
                }

                this.#currentUser = data.user
                return { data: data.user, error: null }
            })()

            const result = await Promise.race([signInPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Sign in error:', result.error)
                return { data: null, error: result.error }
            }

            return result
        } catch (error) {
            console.error('Authentication error in signIn:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Sign out the current user
     * @returns {Promise<{data: boolean|null, error: string|null}>}
     */
    async signOut() {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Authentication timeout')), 5000)
            )

            const signOutPromise = (async () => {
                const { error } = await this.supabase.auth.signOut()
                
                if (error) {
                    return { data: null, error: error.message }
                }

                this.#currentUser = null
                return { data: true, error: null }
            })()

            const result = await Promise.race([signOutPromise, timeoutPromise])
            
            if (result.error) {
                console.error('Sign out error:', result.error)
                return { data: null, error: result.error }
            }

            return result
        } catch (error) {
            console.error('Authentication error in signOut:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Get the current authenticated user
     * @returns {Object|null} Current user object or null if not authenticated
     */
    getCurrentUser() {
        return this.#currentUser
    }

    /**
     * Get the current session
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async getSession() {
        try {
            const { data, error } = await this.supabase.auth.getSession()
            
            if (error) {
                console.error('Error getting session:', error)
                return { data: null, error: error.message }
            }

            this.#currentUser = data.session?.user || null
            return { data: data.session, error: null }
        } catch (error) {
            console.error('Authentication error in getSession:', error)
            return { data: null, error: error.message }
        }
    }

    /**
     * Check if current user is admin
     * @returns {boolean} True if current user is admin
     */
    isAdmin() {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
        return this.#currentUser?.email === adminEmail
    }

    /**
     * Set up callback for authentication state changes
     * @param {Function} callback - Function to call on auth state change
     */
    onAuthStateChange(callback) {
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.#currentUser = session?.user || null
            callback(event, session)
        })
    }
}

// Default export for compatibility
export default AuthManager

