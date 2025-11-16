const ReminderService = require('../reminder-service');
const fs = require('fs');
const cron = require('node-cron');
const notifier = require('node-notifier');

// Mock dependencies
jest.mock('fs');
jest.mock('node-cron');
jest.mock('node-notifier');

describe('ReminderService', () => {
    let reminderService;
    let consoleLogSpy;
    let consoleErrorSpy;
    let mockCronJob;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup console spies
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock cron job
        mockCronJob = {
            stop: jest.fn()
        };
        cron.schedule.mockReturnValue(mockCronJob);

        // Mock notifier
        notifier.notify = jest.fn();

        // Mock fs by default
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({
            medication: { enabled: false, reminders: [] },
            mentalHealth: { enabled: false, journalTime: '20:00', checkInTime: '09:00' },
            aws: { enabled: false, studyTime: '19:00' }
        }));
        fs.writeFileSync.mockImplementation(() => {});

        // Create instance
        reminderService = new ReminderService('test-reminders.json');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Configuration Management', () => {
        test('loads default config when file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            const service = new ReminderService('nonexistent.json');

            expect(service.config.medication.enabled).toBe(false);
            expect(service.config.mentalHealth.enabled).toBe(false);
            expect(service.config.aws.enabled).toBe(false);
        });

        test('loads existing config from file', () => {
            const existingConfig = {
                medication: { enabled: true, reminders: [{ id: 1, name: 'Test', time: '08:00' }] },
                mentalHealth: { enabled: true, journalTime: '21:00', checkInTime: '08:00' },
                aws: { enabled: true, studyTime: '18:00' }
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

            const service = new ReminderService('existing.json');

            expect(service.config.medication.enabled).toBe(true);
            expect(service.config.medication.reminders).toHaveLength(1);
            expect(service.config.mentalHealth.journalTime).toBe('21:00');
            expect(service.config.aws.studyTime).toBe('18:00');
        });

        test('handles corrupted config file gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json{]');

            const service = new ReminderService('corrupted.json');

            expect(service.config.medication.enabled).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('saves config to file successfully', () => {
            const result = reminderService.saveConfig();

            expect(result).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                'test-reminders.json',
                expect.any(String)
            );
        });

        test('handles save errors gracefully', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });

            const result = reminderService.saveConfig();

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Medication Reminders', () => {
        test('enables medication reminders successfully', () => {
            const medications = [
                { id: 1, name: 'Aspirin', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' },
                { id: 2, name: 'Vitamin D', dosage: '1000IU', scheduledTime: '09:00', frequency: 'daily' }
            ];

            const result = reminderService.enableMedicationReminders(medications);

            expect(result).toBe(true);
            expect(reminderService.config.medication.enabled).toBe(true);
            expect(reminderService.config.medication.reminders).toHaveLength(2);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Medication reminders enabled'));
        });

        test('schedules cron jobs for medication reminders', () => {
            const medications = [
                { id: 1, name: 'Aspirin', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];

            reminderService.enableMedicationReminders(medications);

            expect(cron.schedule).toHaveBeenCalledWith('00 08 * * *', expect.any(Function));
            expect(reminderService.scheduledJobs.has('med-1')).toBe(true);
        });

        test('disables medication reminders and stops jobs', () => {
            // First enable
            const medications = [
                { id: 1, name: 'Test Med', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];
            reminderService.enableMedicationReminders(medications);

            // Then disable
            const result = reminderService.disableMedicationReminders();

            expect(result).toBe(true);
            expect(reminderService.config.medication.enabled).toBe(false);
            expect(mockCronJob.stop).toHaveBeenCalled();
            expect(reminderService.scheduledJobs.has('med-1')).toBe(false);
        });

        test('sends notification when medication reminder triggers', () => {
            const medications = [
                { id: 1, name: 'Aspirin', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];

            reminderService.enableMedicationReminders(medications);

            // Get the cron callback and execute it
            const cronCallback = cron.schedule.mock.calls[0][1];
            cronCallback();

            expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Medication Reminder',
                message: expect.stringContaining('Aspirin')
            }));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Medication Reminder'));
        });

        test('clears existing medication jobs before scheduling new ones', () => {
            const medications1 = [
                { id: 1, name: 'Med1', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];
            const medications2 = [
                { id: 2, name: 'Med2', dosage: '200mg', scheduledTime: '09:00', frequency: 'daily' }
            ];

            reminderService.enableMedicationReminders(medications1);
            reminderService.enableMedicationReminders(medications2);

            expect(mockCronJob.stop).toHaveBeenCalled();
        });
    });

    describe('Mental Health Reminders', () => {
        test('enables mental health reminders with default times', () => {
            const result = reminderService.enableMentalHealthReminders();

            expect(result).toBe(true);
            expect(reminderService.config.mentalHealth.enabled).toBe(true);
            expect(reminderService.config.mentalHealth.journalTime).toBe('20:00');
            expect(reminderService.config.mentalHealth.checkInTime).toBe('09:00');
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mental health reminders enabled'));
        });

        test('enables mental health reminders with custom times', () => {
            const result = reminderService.enableMentalHealthReminders('21:00', '08:00');

            expect(result).toBe(true);
            expect(reminderService.config.mentalHealth.journalTime).toBe('21:00');
            expect(reminderService.config.mentalHealth.checkInTime).toBe('08:00');
        });

        test('schedules journal and check-in cron jobs', () => {
            reminderService.enableMentalHealthReminders('20:00', '09:00');

            expect(cron.schedule).toHaveBeenCalledWith('00 20 * * *', expect.any(Function)); // Journal
            expect(cron.schedule).toHaveBeenCalledWith('00 09 * * *', expect.any(Function));  // Check-in
            expect(reminderService.scheduledJobs.has('mh-journal')).toBe(true);
            expect(reminderService.scheduledJobs.has('mh-checkin')).toBe(true);
        });

        test('disables mental health reminders and stops jobs', () => {
            reminderService.enableMentalHealthReminders();
            const result = reminderService.disableMentalHealthReminders();

            expect(result).toBe(true);
            expect(reminderService.config.mentalHealth.enabled).toBe(false);
            expect(mockCronJob.stop).toHaveBeenCalled();
        });

        test('sends journal reminder notification', () => {
            reminderService.enableMentalHealthReminders('20:00', '09:00');

            const journalCallback = cron.schedule.mock.calls.find(
                call => call[0] === '00 20 * * *'
            )[1];
            journalCallback();

            expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Journal Reminder',
                message: expect.stringContaining('reflect')
            }));
        });

        test('sends check-in reminder notification', () => {
            reminderService.enableMentalHealthReminders('20:00', '09:00');

            const checkinCallback = cron.schedule.mock.calls.find(
                call => call[0] === '00 09 * * *'
            )[1];
            checkinCallback();

            expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Daily Check-in',
                message: expect.stringContaining('feeling')
            }));
        });

        test('stops and replaces existing jobs when rescheduling', () => {
            // First enable with initial times
            reminderService.enableMentalHealthReminders('20:00', '09:00');

            // Get the initial jobs
            const initialJournalJob = reminderService.scheduledJobs.get('mh-journal');
            const initialCheckinJob = reminderService.scheduledJobs.get('mh-checkin');

            // Enable again with different times (should stop old jobs)
            reminderService.enableMentalHealthReminders('21:00', '10:00');

            // Verify old jobs were stopped
            expect(initialJournalJob.stop).toHaveBeenCalled();
            expect(initialCheckinJob.stop).toHaveBeenCalled();

            // Verify new jobs were created with new times
            expect(cron.schedule).toHaveBeenCalledWith('00 21 * * *', expect.any(Function));
            expect(cron.schedule).toHaveBeenCalledWith('00 10 * * *', expect.any(Function));
        });
    });

    describe('AWS Study Reminders', () => {
        test('enables AWS study reminders with default time', () => {
            const result = reminderService.enableAWSReminders();

            expect(result).toBe(true);
            expect(reminderService.config.aws.enabled).toBe(true);
            expect(reminderService.config.aws.studyTime).toBe('19:00');
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AWS study reminders enabled'));
        });

        test('enables AWS study reminders with custom time', () => {
            const result = reminderService.enableAWSReminders('18:30');

            expect(result).toBe(true);
            expect(reminderService.config.aws.studyTime).toBe('18:30');
        });

        test('schedules AWS study cron job', () => {
            reminderService.enableAWSReminders('19:00');

            expect(cron.schedule).toHaveBeenCalledWith('00 19 * * *', expect.any(Function));
            expect(reminderService.scheduledJobs.has('aws-study')).toBe(true);
        });

        test('disables AWS study reminders and stops job', () => {
            reminderService.enableAWSReminders();
            const result = reminderService.disableAWSReminders();

            expect(result).toBe(true);
            expect(reminderService.config.aws.enabled).toBe(false);
            expect(mockCronJob.stop).toHaveBeenCalled();
        });

        test('sends AWS study reminder notification', () => {
            reminderService.enableAWSReminders('19:00');

            const studyCallback = cron.schedule.mock.calls[0][1];
            studyCallback();

            expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({
                title: 'AWS Study Time',
                message: expect.stringContaining('study session')
            }));
        });

        test('stops and replaces existing job when rescheduling', () => {
            // First enable with initial time
            reminderService.enableAWSReminders('19:00');

            // Get the initial job
            const initialStudyJob = reminderService.scheduledJobs.get('aws-study');

            // Enable again with different time (should stop old job)
            reminderService.enableAWSReminders('20:00');

            // Verify old job was stopped
            expect(initialStudyJob.stop).toHaveBeenCalled();

            // Verify new job was created with new time
            expect(cron.schedule).toHaveBeenCalledWith('00 20 * * *', expect.any(Function));
        });
    });

    describe('Notification System', () => {
        test('sends notification with correct parameters', () => {
            reminderService.sendNotification('Test Title', 'Test Message');

            expect(notifier.notify).toHaveBeenCalledWith({
                title: 'Test Title',
                message: 'Test Message',
                sound: true,
                wait: false,
                timeout: 10
            });
        });
    });

    describe('Status Display', () => {
        test('shows status with all reminders disabled', () => {
            reminderService.showStatus();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Reminder Status'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✗ Disabled'));
        });

        test('shows status with medication reminders enabled', () => {
            const medications = [
                { id: 1, name: 'Aspirin', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];
            reminderService.enableMedicationReminders(medications);

            consoleLogSpy.mockClear();
            reminderService.showStatus();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Enabled'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Aspirin at 08:00'));
        });

        test('shows status with all reminders enabled', () => {
            const medications = [
                { id: 1, name: 'Test Med', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];
            reminderService.enableMedicationReminders(medications);
            reminderService.enableMentalHealthReminders('20:00', '09:00');
            reminderService.enableAWSReminders('19:00');

            consoleLogSpy.mockClear();
            reminderService.showStatus();

            const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
            expect(allLogs).toContain('Medication Reminders');
            expect(allLogs).toContain('Mental Health Reminders');
            expect(allLogs).toContain('AWS Study Reminders');
        });
    });

    describe('Start/Stop All Reminders', () => {
        test('startAll schedules all enabled reminders', () => {
            // Enable all reminders in config
            reminderService.config.medication.enabled = true;
            reminderService.config.medication.reminders = [
                { id: 1, name: 'Med1', dosage: '100mg', time: '08:00', frequency: 'daily' }
            ];
            reminderService.config.mentalHealth.enabled = true;
            reminderService.config.aws.enabled = true;

            reminderService.startAll();

            expect(cron.schedule).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All enabled reminders started'));
        });

        test('stopAll stops all active reminders', () => {
            const medications = [
                { id: 1, name: 'Test', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];
            reminderService.enableMedicationReminders(medications);
            reminderService.enableMentalHealthReminders();
            reminderService.enableAWSReminders();

            reminderService.stopAll();

            expect(mockCronJob.stop).toHaveBeenCalled();
            expect(reminderService.scheduledJobs.size).toBe(0);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All reminders stopped'));
        });
    });

    describe('Edge Cases', () => {
        test('handles empty medication list', () => {
            const result = reminderService.enableMedicationReminders([]);

            expect(result).toBe(true);
            expect(reminderService.config.medication.reminders).toHaveLength(0);
        });

        test('handles medication with unusual time format', () => {
            const medications = [
                { id: 1, name: 'Test', dosage: '100mg', scheduledTime: '8:5', frequency: 'daily' }
            ];

            reminderService.enableMedicationReminders(medications);

            // Should handle gracefully even with non-standard format
            expect(cron.schedule).toHaveBeenCalled();
        });

        test('does not schedule reminders when disabled', () => {
            reminderService.config.medication.enabled = false;
            cron.schedule.mockClear();

            reminderService.scheduleMedicationReminders();

            expect(cron.schedule).not.toHaveBeenCalled();
        });

        test('handles multiple enable/disable cycles', () => {
            const medications = [
                { id: 1, name: 'Test', dosage: '100mg', scheduledTime: '08:00', frequency: 'daily' }
            ];

            reminderService.enableMedicationReminders(medications);
            reminderService.disableMedicationReminders();
            reminderService.enableMedicationReminders(medications);
            reminderService.disableMedicationReminders();

            expect(mockCronJob.stop).toHaveBeenCalled();
            expect(reminderService.config.medication.enabled).toBe(false);
        });
    });
});
