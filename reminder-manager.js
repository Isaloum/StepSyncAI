const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * ReminderManager - Smart Notifications & Reminders System
 *
 * Features:
 * - Medication reminders based on schedules
 * - Exercise time notifications (adaptive)
 * - Sleep schedule alerts
 * - Custom wellness reminders
 * - Smart timing based on user patterns
 * - Recurring reminders with snooze
 * - History tracking and compliance
 */
class ReminderManager {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        this.remindersFile = path.join(dataDir, 'reminders.json');
        this.reminders = this.loadReminders();
    }

    /**
     * Load reminders from file
     */
    loadReminders() {
        try {
            if (fs.existsSync(this.remindersFile)) {
                const data = fs.readFileSync(this.remindersFile, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading reminders:', error.message);
        }
        return [];
    }

    /**
     * Save reminders to file
     */
    saveReminders() {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
            fs.writeFileSync(
                this.remindersFile,
                JSON.stringify(this.reminders, null, 2),
                'utf-8'
            );
            return true;
        } catch (error) {
            console.error('Error saving reminders:', error.message);
            return false;
        }
    }

    /**
     * Create a new reminder
     *
     * @param {Object} reminderData - Reminder configuration
     * @returns {Object} Created reminder
     */
    createReminder(reminderData) {
        const {
            type,
            title,
            message,
            time,
            days = 'daily',
            enabled = true,
            metadata = {}
        } = reminderData;

        // Validate required fields
        if (!type || !title || !time) {
            throw new Error('Missing required fields: type, title, time');
        }

        // Validate time format (HH:mm)
        if (!/^\d{2}:\d{2}$/.test(time)) {
            throw new Error('Invalid time format. Use HH:mm (e.g., 08:30)');
        }

        // Validate type
        const validTypes = ['medication', 'exercise', 'sleep', 'mood', 'goal', 'general', 'custom'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
        }

        const reminder = {
            id: uuidv4(),
            type,
            title,
            message: message || title,
            time,
            days: days === 'daily' ? 'daily' : this.normalizeDays(days),
            enabled,
            metadata,
            createdAt: new Date().toISOString(),
            lastShown: null,
            snoozedUntil: null,
            dismissed: false,
            history: []
        };

        this.reminders.push(reminder);
        this.saveReminders();

        console.log('\n✅ Reminder created successfully!');
        console.log(`   ID: ${reminder.id}`);
        console.log(`   Type: ${reminder.type}`);
        console.log(`   Time: ${reminder.time}`);
        console.log(`   Days: ${reminder.days === 'daily' ? 'Daily' : reminder.days.join(', ')}`);

        return reminder;
    }

    /**
     * Normalize days array to lowercase
     */
    normalizeDays(days) {
        if (Array.isArray(days)) {
            return days.map(d => d.toLowerCase());
        }
        return 'daily';
    }

    /**
     * Get all reminders
     *
     * @param {Object} filters - Optional filters (type, enabled)
     * @returns {Array} Filtered reminders
     */
    getReminders(filters = {}) {
        let filtered = [...this.reminders];

        if (filters.type) {
            filtered = filtered.filter(r => r.type === filters.type);
        }

        if (filters.enabled !== undefined) {
            filtered = filtered.filter(r => r.enabled === filters.enabled);
        }

        return filtered;
    }

    /**
     * Get a specific reminder by ID
     */
    getReminder(id) {
        return this.reminders.find(r => r.id === id);
    }

    /**
     * Update a reminder
     */
    updateReminder(id, updates) {
        const index = this.reminders.findIndex(r => r.id === id);
        if (index === -1) {
            throw new Error(`Reminder not found: ${id}`);
        }

        // Validate time format if updating time
        if (updates.time && !/^\d{2}:\d{2}$/.test(updates.time)) {
            throw new Error('Invalid time format. Use HH:mm (e.g., 08:30)');
        }

        // Normalize days if updating
        if (updates.days && updates.days !== 'daily') {
            updates.days = this.normalizeDays(updates.days);
        }

        this.reminders[index] = {
            ...this.reminders[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveReminders();
        console.log(`✅ Reminder updated: ${id}`);
        return this.reminders[index];
    }

    /**
     * Delete a reminder
     */
    deleteReminder(id) {
        const index = this.reminders.findIndex(r => r.id === id);
        if (index === -1) {
            throw new Error(`Reminder not found: ${id}`);
        }

        const reminder = this.reminders[index];
        this.reminders.splice(index, 1);
        this.saveReminders();

        console.log(`✅ Reminder deleted: ${reminder.title}`);
        return true;
    }

    /**
     * Toggle reminder enabled/disabled
     */
    toggleReminder(id) {
        const reminder = this.getReminder(id);
        if (!reminder) {
            throw new Error(`Reminder not found: ${id}`);
        }

        reminder.enabled = !reminder.enabled;
        this.saveReminders();

        console.log(`✅ Reminder ${reminder.enabled ? 'enabled' : 'disabled'}: ${reminder.title}`);
        return reminder;
    }

    /**
     * Check if a reminder is due now
     *
     * @param {Object} reminder - Reminder to check
     * @param {Date} now - Current time (for testing)
     * @returns {boolean} True if reminder is due
     */
    isReminderDue(reminder, now = new Date()) {
        if (!reminder.enabled) {
            return false;
        }

        // Check if snoozed
        if (reminder.snoozedUntil && new Date(reminder.snoozedUntil) > now) {
            return false;
        }

        // Check day of week
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        if (reminder.days !== 'daily' && !reminder.days.includes(dayOfWeek)) {
            return false;
        }

        // Check time
        const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Due if within the same hour and minute
        if (currentHour === reminderHour && currentMinute === reminderMinute) {
            // Check if already shown today
            if (reminder.lastShown) {
                const lastShown = new Date(reminder.lastShown);
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                lastShown.setHours(0, 0, 0, 0);

                // Already shown today at this time
                if (lastShown.getTime() === today.getTime()) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Get all due reminders
     *
     * @param {Date} now - Current time (for testing)
     * @returns {Array} Due reminders
     */
    getDueReminders(now = new Date()) {
        return this.reminders.filter(reminder => this.isReminderDue(reminder, now));
    }

    /**
     * Mark a reminder as shown
     */
    markAsShown(id) {
        const reminder = this.getReminder(id);
        if (!reminder) {
            throw new Error(`Reminder not found: ${id}`);
        }

        const timestamp = new Date().toISOString();
        reminder.lastShown = timestamp;
        reminder.snoozedUntil = null;

        reminder.history.push({
            timestamp,
            action: 'shown'
        });

        this.saveReminders();
        return reminder;
    }

    /**
     * Snooze a reminder
     *
     * @param {string} id - Reminder ID
     * @param {number} minutes - Snooze duration in minutes (default: 15)
     */
    snoozeReminder(id, minutes = 15) {
        const reminder = this.getReminder(id);
        if (!reminder) {
            throw new Error(`Reminder not found: ${id}`);
        }

        const snoozedUntil = new Date();
        snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);

        reminder.snoozedUntil = snoozedUntil.toISOString();

        reminder.history.push({
            timestamp: new Date().toISOString(),
            action: 'snoozed',
            duration: minutes
        });

        this.saveReminders();
        console.log(`⏰ Reminder snoozed for ${minutes} minutes`);
        return reminder;
    }

    /**
     * Dismiss a reminder
     */
    dismissReminder(id) {
        const reminder = this.getReminder(id);
        if (!reminder || reminder.dismissed) {
            throw new Error(`Reminder not found: ${id}`);
        }

        reminder.dismissed = true;
        reminder.history.push({
            timestamp: new Date().toISOString(),
            action: 'dismissed'
        });

        this.saveReminders();
        console.log('✅ Reminder dismissed');
        return reminder;
    }

    /**
     * Create medication reminder from medication data
     *
     * @param {Object} medication - Medication data
     * @returns {Object} Created reminder
     */
    createMedicationReminder(medication) {
        const { name, dosage, frequency, time } = medication;

        // Determine days based on frequency
        let days = 'daily';
        if (frequency && frequency.includes('week')) {
            // Parse "3 times per week" or similar
            const match = frequency.match(/(\d+)\s*times?\s*per\s*week/i);
            if (match) {
                const timesPerWeek = parseInt(match[1]);
                if (timesPerWeek < 7) {
                    // Default to every other day or specific pattern
                    days = ['monday', 'wednesday', 'friday'];
                }
            }
        }

        return this.createReminder({
            type: 'medication',
            title: `Take ${name}`,
            message: `Time to take your ${name}${dosage ? ` (${dosage})` : ''}`,
            time: time || '08:00',
            days,
            metadata: {
                medicationName: name,
                dosage,
                frequency
            }
        });
    }

    /**
     * Create exercise reminder with smart timing
     *
     * @param {Object} options - Exercise reminder options
     * @returns {Object} Created reminder
     */
    createExerciseReminder(options = {}) {
        const {
            time = '18:00',
            days = 'daily',
            title = 'Exercise Time',
            message = 'Time for your daily exercise! 🏃'
        } = options;

        return this.createReminder({
            type: 'exercise',
            title,
            message,
            time,
            days,
            metadata: {
                suggestedDuration: options.duration || 30
            }
        });
    }

    /**
     * Create sleep reminder
     *
     * @param {Object} options - Sleep reminder options
     * @returns {Object} Created reminder(s)
     */
    createSleepReminder(options = {}) {
        const {
            bedtime = '22:00',
            wakeup = '06:00',
            days = 'daily'
        } = options;

        const reminders = [];

        // Bedtime reminder
        reminders.push(this.createReminder({
            type: 'sleep',
            title: 'Bedtime Reminder',
            message: 'Time to wind down and prepare for sleep 😴',
            time: bedtime,
            days,
            metadata: {
                reminderType: 'bedtime'
            }
        }));

        // Wake-up reminder
        reminders.push(this.createReminder({
            type: 'sleep',
            title: 'Wake Up',
            message: 'Good morning! Time to start your day ☀️',
            time: wakeup,
            days,
            metadata: {
                reminderType: 'wakeup'
            }
        }));

        return reminders;
    }

    /**
     * Get reminder compliance statistics
     *
     * @param {string} reminderId - Optional: specific reminder ID
     * @returns {Object} Compliance statistics
     */
    getComplianceStats(reminderId = null) {
        const reminders = reminderId
            ? [this.getReminder(reminderId)].filter(Boolean)
            : this.reminders;

        const stats = {
            total: reminders.length,
            enabled: reminders.filter(r => r.enabled).length,
            byType: {},
            compliance: {}
        };

        // Count by type
        reminders.forEach(reminder => {
            stats.byType[reminder.type] = (stats.byType[reminder.type] || 0) + 1;

            // Calculate compliance for this reminder
            const shown = reminder.history.filter(h => h.action === 'shown').length;
            const dismissed = reminder.history.filter(h => h.action === 'dismissed').length;
            const snoozed = reminder.history.filter(h => h.action === 'snoozed').length;

            if (shown > 0) {
                const complianceRate = ((dismissed + snoozed) / shown * 100).toFixed(1);
                stats.compliance[reminder.id] = {
                    title: reminder.title,
                    type: reminder.type,
                    shown,
                    dismissed,
                    snoozed,
                    complianceRate: parseFloat(complianceRate)
                };
            }
        });

        return stats;
    }

    /**
     * Suggest optimal reminder time based on user patterns
     * Uses analytics data to find best times
     *
     * @param {string} type - Reminder type (exercise, sleep, etc.)
     * @param {Object} analytics - AnalyticsEngine instance (optional)
     * @returns {Object} Suggested time and confidence data
     */
    suggestOptimalTime(type, analytics = null) {
        // Default suggestions based on type
        const defaults = {
            medication: '08:00',
            exercise: '18:00',
            sleep: '22:00',
            custom: '12:00'
        };

        // If analytics engine provided, use it to find optimal time based on patterns
        if (analytics && typeof analytics.findOptimalTimeForActivity === 'function') {
            try {
                const result = analytics.findOptimalTimeForActivity(type, 30);

                if (result.success) {
                    return {
                        time: result.optimalTime,
                        confidence: result.confidence,
                        source: 'analytics',
                        message: result.message,
                        sampleSize: result.sampleSize
                    };
                }

                // Analytics didn't have enough data, return default with explanation
                return {
                    time: result.defaultTime || defaults[type] || defaults.custom,
                    confidence: 0,
                    source: 'default',
                    message: result.message || 'Using default time - not enough historical data yet'
                };
            } catch (error) {
                // Analytics failed, fall back to defaults
                console.log('⚠️  Analytics unavailable, using default time');
            }
        }

        // No analytics provided or analytics failed - return default
        return {
            time: defaults[type] || defaults.custom,
            confidence: 0,
            source: 'default',
            message: 'Using default time (analytics not available)'
        };
    }

    /**
     * Display all reminders in a formatted way
     */
    displayReminders() {
        if (this.reminders.length === 0) {
            console.log('\n📭 No reminders set up yet.');
            console.log('   Use the CLI to create your first reminder!');
            return;
        }

        console.log('\n🔔 Your Reminders\n');
        console.log('═'.repeat(60));

        const byType = this.reminders.reduce((acc, reminder) => {
            if (!acc[reminder.type]) {
                acc[reminder.type] = [];
            }
            acc[reminder.type].push(reminder);
            return acc;
        }, {});

        const typeEmojis = {
            medication: '💊',
            exercise: '🏃',
            sleep: '😴',
            custom: '⚡'
        };

        Object.entries(byType).forEach(([type, reminders]) => {
            console.log(`\n${typeEmojis[type]} ${type.toUpperCase()} REMINDERS`);
            console.log('─'.repeat(60));

            reminders.forEach(reminder => {
                const status = reminder.enabled ? '✓' : '✗';
                const daysStr = reminder.days === 'daily'
                    ? 'Daily'
                    : reminder.days.map(d => d.substring(0, 3)).join(', ');

                console.log(`\n  [${status}] ${reminder.title}`);
                console.log(`      Time: ${reminder.time} | Days: ${daysStr}`);
                console.log(`      ID: ${reminder.id}`);

                if (reminder.snoozedUntil && new Date(reminder.snoozedUntil) > new Date()) {
                    const snoozeDate = new Date(reminder.snoozedUntil);
                    console.log(`      ⏰ Snoozed until ${snoozeDate.toLocaleTimeString()}`);
                }
            });
        });

        console.log('\n' + '═'.repeat(60));
        console.log(`Total: ${this.reminders.length} reminders (${this.reminders.filter(r => r.enabled).length} enabled)`);
    }
}

module.exports = ReminderManager;
