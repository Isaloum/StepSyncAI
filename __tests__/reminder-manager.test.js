const fs = require('fs');
const path = require('path');
const ReminderManager = require('../reminder-manager');

describe('ReminderManager', () => {
    let manager;
    const testDataDir = path.join(__dirname, 'test-reminders-data');

    beforeEach(() => {
        // Create test directory
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }
        manager = new ReminderManager(testDataDir);
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testDataDir)) {
            const files = fs.readdirSync(testDataDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(testDataDir, file));
            });
            fs.rmdirSync(testDataDir);
        }
    });

    describe('Reminder Creation', () => {
        test('should create a basic reminder', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Take Medicine',
                time: '08:00'
            });

            expect(reminder).toBeDefined();
            expect(reminder.id).toBeDefined();
            expect(reminder.type).toBe('medication');
            expect(reminder.title).toBe('Take Medicine');
            expect(reminder.time).toBe('08:00');
            expect(reminder.enabled).toBe(true);
        });

        test('should create reminder with custom message', () => {
            const reminder = manager.createReminder({
                type: 'exercise',
                title: 'Workout',
                message: 'Time for your daily workout!',
                time: '18:00'
            });

            expect(reminder.message).toBe('Time for your daily workout!');
        });

        test('should create reminder with specific days', () => {
            const reminder = manager.createReminder({
                type: 'exercise',
                title: 'Gym Day',
                time: '17:00',
                days: ['monday', 'wednesday', 'friday']
            });

            expect(reminder.days).toEqual(['monday', 'wednesday', 'friday']);
        });

        test('should fail without required fields', () => {
            expect(() => {
                manager.createReminder({
                    title: 'Test'
                });
            }).toThrow('Missing required fields');
        });

        test('should fail with invalid time format', () => {
            expect(() => {
                manager.createReminder({
                    type: 'medication',
                    title: 'Test',
                    time: '8:00'
                });
            }).toThrow('Invalid time format');
        });

        test('should fail with invalid type', () => {
            expect(() => {
                manager.createReminder({
                    type: 'invalid',
                    title: 'Test',
                    time: '08:00'
                });
            }).toThrow('Invalid type');
        });

        test('should normalize days to lowercase', () => {
            const reminder = manager.createReminder({
                type: 'exercise',
                title: 'Workout',
                time: '18:00',
                days: ['Monday', 'WEDNESDAY', 'Friday']
            });

            expect(reminder.days).toEqual(['monday', 'wednesday', 'friday']);
        });
    });

    describe('Medication Reminders', () => {
        test('should create medication reminder', () => {
            const reminder = manager.createMedicationReminder({
                name: 'Aspirin',
                dosage: '500mg',
                time: '08:00'
            });

            expect(reminder.type).toBe('medication');
            expect(reminder.title).toBe('Take Aspirin');
            expect(reminder.metadata.medicationName).toBe('Aspirin');
            expect(reminder.metadata.dosage).toBe('500mg');
        });

        test('should handle medication without dosage', () => {
            const reminder = manager.createMedicationReminder({
                name: 'Vitamin D',
                time: '09:00'
            });

            expect(reminder.title).toBe('Take Vitamin D');
        });

        test('should parse frequency for days', () => {
            const reminder = manager.createMedicationReminder({
                name: 'Med',
                frequency: '3 times per week',
                time: '10:00'
            });

            expect(Array.isArray(reminder.days)).toBe(true);
        });
    });

    describe('Exercise Reminders', () => {
        test('should create exercise reminder with defaults', () => {
            const reminder = manager.createExerciseReminder();

            expect(reminder.type).toBe('exercise');
            expect(reminder.time).toBe('18:00');
            expect(reminder.days).toBe('daily');
        });

        test('should create exercise reminder with custom options', () => {
            const reminder = manager.createExerciseReminder({
                time: '17:00',
                title: 'Evening Run',
                days: ['monday', 'wednesday', 'friday'],
                duration: 45
            });

            expect(reminder.title).toBe('Evening Run');
            expect(reminder.time).toBe('17:00');
            expect(reminder.metadata.suggestedDuration).toBe(45);
        });
    });

    describe('Sleep Reminders', () => {
        test('should create sleep reminders with defaults', () => {
            const reminders = manager.createSleepReminder();

            expect(reminders).toHaveLength(2);
            expect(reminders[0].metadata.reminderType).toBe('bedtime');
            expect(reminders[1].metadata.reminderType).toBe('wakeup');
        });

        test('should create sleep reminders with custom times', () => {
            const reminders = manager.createSleepReminder({
                bedtime: '23:00',
                wakeup: '07:00'
            });

            expect(reminders[0].time).toBe('23:00');
            expect(reminders[1].time).toBe('07:00');
        });
    });

    describe('Reminder Management', () => {
        test('should get all reminders', () => {
            manager.createReminder({
                type: 'medication',
                title: 'Med 1',
                time: '08:00'
            });
            manager.createReminder({
                type: 'exercise',
                title: 'Ex 1',
                time: '18:00'
            });

            const reminders = manager.getReminders();
            expect(reminders).toHaveLength(2);
        });

        test('should filter reminders by type', () => {
            manager.createReminder({
                type: 'medication',
                title: 'Med 1',
                time: '08:00'
            });
            manager.createReminder({
                type: 'exercise',
                title: 'Ex 1',
                time: '18:00'
            });

            const medReminders = manager.getReminders({ type: 'medication' });
            expect(medReminders).toHaveLength(1);
            expect(medReminders[0].type).toBe('medication');
        });

        test('should filter reminders by enabled status', () => {
            manager.createReminder({
                type: 'medication',
                title: 'Med 1',
                time: '08:00',
                enabled: true
            });
            manager.createReminder({
                type: 'exercise',
                title: 'Ex 1',
                time: '18:00',
                enabled: false
            });

            const enabledReminders = manager.getReminders({ enabled: true });
            expect(enabledReminders).toHaveLength(1);
            expect(enabledReminders[0].enabled).toBe(true);
        });

        test('should get specific reminder by ID', () => {
            const created = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            const found = manager.getReminder(created.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
        });

        test('should return undefined for non-existent reminder', () => {
            const found = manager.getReminder('non-existent-id');
            expect(found).toBeUndefined();
        });
    });

    describe('Reminder Updates', () => {
        test('should update reminder time', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            manager.updateReminder(reminder.id, { time: '09:00' });
            const updated = manager.getReminder(reminder.id);
            expect(updated.time).toBe('09:00');
            expect(updated.updatedAt).toBeDefined();
        });

        test('should update reminder days', () => {
            const reminder = manager.createReminder({
                type: 'exercise',
                title: 'Test',
                time: '18:00'
            });

            manager.updateReminder(reminder.id, {
                days: ['monday', 'friday']
            });

            const updated = manager.getReminder(reminder.id);
            expect(updated.days).toEqual(['monday', 'friday']);
        });

        test('should fail to update non-existent reminder', () => {
            expect(() => {
                manager.updateReminder('non-existent', { time: '10:00' });
            }).toThrow('Reminder not found');
        });

        test('should fail with invalid time format', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            expect(() => {
                manager.updateReminder(reminder.id, { time: 'invalid' });
            }).toThrow('Invalid time format');
        });
    });

    describe('Reminder Deletion', () => {
        test('should delete reminder', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            manager.deleteReminder(reminder.id);
            const found = manager.getReminder(reminder.id);
            expect(found).toBeUndefined();
        });

        test('should fail to delete non-existent reminder', () => {
            expect(() => {
                manager.deleteReminder('non-existent');
            }).toThrow('Reminder not found');
        });
    });

    describe('Reminder Toggle', () => {
        test('should toggle reminder enabled state', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00',
                enabled: true
            });

            manager.toggleReminder(reminder.id);
            let updated = manager.getReminder(reminder.id);
            expect(updated.enabled).toBe(false);

            manager.toggleReminder(reminder.id);
            updated = manager.getReminder(reminder.id);
            expect(updated.enabled).toBe(true);
        });

        test('should fail to toggle non-existent reminder', () => {
            expect(() => {
                manager.toggleReminder('non-existent');
            }).toThrow('Reminder not found');
        });
    });

    describe('Due Reminders', () => {
        test('should detect reminder due now', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(true);
        });

        test('should not detect reminder at wrong time', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '09:00'
            });

            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(false);
        });

        test('should respect day of week', () => {
            // Tuesday (2025-11-18)
            const now = new Date('2025-11-18T08:00:00');
            const reminder = manager.createReminder({
                type: 'exercise',
                title: 'Test',
                time: '08:00',
                days: ['monday', 'wednesday', 'friday']
            });

            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(false);
        });

        test('should work with daily reminders', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00',
                days: 'daily'
            });

            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(true);
        });

        test('should not show disabled reminders', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00',
                enabled: false
            });

            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(false);
        });

        test('should not show if already shown today', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            reminder.lastShown = '2025-11-19T08:00:00';
            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(false);
        });

        test('should show if shown on different day', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            reminder.lastShown = '2025-11-18T08:00:00';
            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(true);
        });

        test('should respect snooze', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            reminder.snoozedUntil = '2025-11-19T08:15:00';
            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(false);
        });

        test('should show after snooze expires', () => {
            const now = new Date('2025-11-19T08:00:00');
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            reminder.snoozedUntil = '2025-11-18T08:15:00'; // Yesterday
            reminder.lastShown = '2025-11-18T08:00:00'; // Yesterday
            const isDue = manager.isReminderDue(reminder, now);
            expect(isDue).toBe(true);
        });

        test('should get all due reminders', () => {
            const now = new Date('2025-11-19T08:00:00');

            manager.createReminder({
                type: 'medication',
                title: 'Med 1',
                time: '08:00'
            });

            manager.createReminder({
                type: 'exercise',
                title: 'Exercise',
                time: '18:00'
            });

            manager.createReminder({
                type: 'medication',
                title: 'Med 2',
                time: '08:00'
            });

            const dueReminders = manager.getDueReminders(now);
            expect(dueReminders).toHaveLength(2);
        });
    });

    describe('Reminder Actions', () => {
        test('should mark reminder as shown', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            manager.markAsShown(reminder.id);
            const updated = manager.getReminder(reminder.id);

            expect(updated.lastShown).toBeDefined();
            expect(updated.snoozedUntil).toBeNull();
            expect(updated.history).toHaveLength(1);
            expect(updated.history[0].action).toBe('shown');
        });

        test('should snooze reminder', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            manager.snoozeReminder(reminder.id, 30);
            const updated = manager.getReminder(reminder.id);

            expect(updated.snoozedUntil).toBeDefined();
            expect(updated.history).toHaveLength(1);
            expect(updated.history[0].action).toBe('snoozed');
            expect(updated.history[0].duration).toBe(30);
        });

        test('should use default snooze duration', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            manager.snoozeReminder(reminder.id);
            const updated = manager.getReminder(reminder.id);

            expect(updated.history[0].duration).toBe(15);
        });

        test('should dismiss reminder', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            manager.dismissReminder(reminder.id);
            const updated = manager.getReminder(reminder.id);

            expect(updated.history).toHaveLength(1);
            expect(updated.history[0].action).toBe('dismissed');
        });
    });

    describe('Compliance Statistics', () => {
        test('should calculate basic stats', () => {
            manager.createReminder({
                type: 'medication',
                title: 'Med 1',
                time: '08:00'
            });

            manager.createReminder({
                type: 'exercise',
                title: 'Ex 1',
                time: '18:00',
                enabled: false
            });

            const stats = manager.getComplianceStats();

            expect(stats.total).toBe(2);
            expect(stats.enabled).toBe(1);
            expect(stats.byType.medication).toBe(1);
            expect(stats.byType.exercise).toBe(1);
        });

        test('should calculate compliance rate', () => {
            const reminder = manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            // Simulate some history
            reminder.history = [
                { action: 'shown' },
                { action: 'dismissed' },
                { action: 'shown' },
                { action: 'snoozed' },
                { action: 'shown' }
            ];
            manager.saveReminders();

            const stats = manager.getComplianceStats();
            expect(stats.compliance[reminder.id]).toBeDefined();
            expect(stats.compliance[reminder.id].shown).toBe(3);
            expect(stats.compliance[reminder.id].dismissed).toBe(1);
            expect(stats.compliance[reminder.id].snoozed).toBe(1);
            expect(stats.compliance[reminder.id].complianceRate).toBeCloseTo(66.7, 1);
        });

        test('should get stats for specific reminder', () => {
            const reminder1 = manager.createReminder({
                type: 'medication',
                title: 'Med 1',
                time: '08:00'
            });

            manager.createReminder({
                type: 'exercise',
                title: 'Ex 1',
                time: '18:00'
            });

            const stats = manager.getComplianceStats(reminder1.id);
            expect(stats.total).toBe(1);
        });
    });

    describe('Persistence', () => {
        test('should save reminders to file', () => {
            manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            const remindersFile = path.join(testDataDir, 'reminders.json');
            expect(fs.existsSync(remindersFile)).toBe(true);

            const data = JSON.parse(fs.readFileSync(remindersFile, 'utf-8'));
            expect(data).toHaveLength(1);
        });

        test('should load reminders from file', () => {
            manager.createReminder({
                type: 'medication',
                title: 'Test',
                time: '08:00'
            });

            // Create new manager instance
            const newManager = new ReminderManager(testDataDir);
            const reminders = newManager.getReminders();

            expect(reminders).toHaveLength(1);
            expect(reminders[0].title).toBe('Test');
        });
    });
});
