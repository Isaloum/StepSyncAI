jest.mock('../daily-dashboard');
jest.mock('../goal-manager');

const GoalCLI = require('../goal-cli');
const DailyDashboard = require('../daily-dashboard');
const GoalManager = require('../goal-manager');

describe('GoalCLI', () => {
    let cli;
    let mockDashboard;
    let mockGoalManager;
    let consoleLogSpy;
    let consoleErrorSpy;
    let originalArgv;

    beforeEach(() => {
        // Save original argv
        originalArgv = process.argv;

        // Create mock instances
        mockDashboard = {
            getHistory: jest.fn().mockReturnValue([]),
            getTodayEntry: jest.fn().mockReturnValue(null),
            getEntry: jest.fn().mockReturnValue({
                date: new Date().toISOString().split('T')[0],
                sleep: 8,
                exercise: 30,
                mood: 7
            }),
            logSleep: jest.fn(),
            logExercise: jest.fn(),
            logMood: jest.fn()
        };

        mockGoalManager = {
            displayGoals: jest.fn(),
            getGoals: jest.fn((filter) => {
                const goals = [
                    {
                        id: 'goal-1',
                        title: 'Sleep 8 hours',
                        type: 'sleep',
                        target: 8,
                        current: 7,
                        progress: 87.5,
                        status: 'active'
                    },
                    {
                        id: 'goal-2',
                        title: 'Exercise 30 min',
                        type: 'exercise',
                        target: 30,
                        current: 25,
                        progress: 83.3,
                        status: 'active'
                    }
                ];
                if (filter && filter.status) {
                    return goals.filter(g => g.status === filter.status);
                }
                return goals;
            }),
            createGoal: jest.fn().mockReturnValue({
                id: 'goal-new',
                title: 'Test Goal',
                success: true
            }),
            updateAllGoals: jest.fn().mockReturnValue([
                {
                    success: true,
                    goal: {
                        title: 'Goal 1',
                        type: 'sleep',
                        progress: { percentage: 85, streak: 5 }
                    }
                }
            ]),
            deleteGoal: jest.fn(),
            archiveGoal: jest.fn(),
            getGoalStats: jest.fn().mockReturnValue({
                total: 5,
                active: 3,
                completed: 1,
                archived: 1,
                totalProgress: 65,
                averageCompletion: 65,
                longestStreak: 15,
                totalStreak: 15,
                byType: {
                    sleep: 2,
                    exercise: 2,
                    mood: 1
                }
            }),
            displayAchievements: jest.fn(),
            getGoalEmoji: jest.fn().mockReturnValue('🎯')
        };

        DailyDashboard.mockImplementation(() => mockDashboard);
        GoalManager.mockImplementation(() => mockGoalManager);

        // Spy on console methods
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Create new CLI instance
        cli = new GoalCLI();
    });

    afterEach(() => {
        // Close readline interface
        if (cli.rl) {
            cli.rl.close();
        }

        // Restore original argv
        process.argv = originalArgv;

        // Restore console
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();

        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('creates DailyDashboard and GoalManager instances', () => {
            expect(DailyDashboard).toHaveBeenCalled();
            expect(GoalManager).toHaveBeenCalledWith(mockDashboard);
            expect(cli.dashboard).toBe(mockDashboard);
            expect(cli.goalManager).toBe(mockGoalManager);
        });

        test('creates readline interface', () => {
            expect(cli.rl).toBeDefined();
            expect(cli.rl.close).toBeDefined();
        });
    });

    describe('showHelp', () => {
        test('displays help information', () => {
            cli.showHelp();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Goal Setting & Achievement System');
            expect(output).toContain('COMMANDS:');
            expect(output).toContain('list');
            expect(output).toContain('create');
            expect(output).toContain('progress');
            expect(output).toContain('stats');
            expect(output).toContain('achievements');
        });

        test('includes goal types', () => {
            cli.showHelp();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('GOAL TYPES:');
            expect(output).toContain('Sleep Goals');
            expect(output).toContain('Exercise Goals');
            expect(output).toContain('Mood Goals');
        });
    });

    describe('prompt', () => {
        test('returns user input as a promise', async () => {
            const mockQuestion = jest.fn((q, cb) => cb('  test answer  '));
            cli.rl.question = mockQuestion;

            const result = await cli.prompt('Test question: ');

            expect(result).toBe('test answer');
            expect(mockQuestion).toHaveBeenCalledWith('Test question: ', expect.any(Function));
        });

        test('trims whitespace from input', async () => {
            cli.rl.question = jest.fn((q, cb) => cb('\n\t  answer with spaces  \t\n'));

            const result = await cli.prompt('Question: ');

            expect(result).toBe('answer with spaces');
        });
    });

    describe('listGoals', () => {
        test('displays all goals', () => {
            cli.listGoals();

            expect(mockGoalManager.displayGoals).toHaveBeenCalled();
        });

        test('handles empty goal list', () => {
            mockGoalManager.getGoals.mockReturnValue([]);

            cli.listGoals();

            expect(mockGoalManager.displayGoals).toHaveBeenCalled();
        });
    });

    describe('createGoal', () => {
        beforeEach(() => {
            // Mock prompt responses for complete goal creation
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = [
                    '1',                          // type choice: sleep
                    'Sleep 8 hours',              // title
                    'Get better sleep',           // description
                    '8',                          // target hours
                    '30',                         // duration
                    ''                            // startDate (empty = today)
                ];
                return Promise.resolve(responses[promptCallCount++] || '');
            });
        });

        test('prompts user for goal details', async () => {
            await cli.createGoal();

            expect(cli.prompt).toHaveBeenCalled();
            expect(mockGoalManager.createGoal).toHaveBeenCalled();
        });

        test('handles invalid goal type', async () => {
            cli.prompt = jest.fn().mockResolvedValue('99'); // invalid type

            await cli.createGoal();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Invalid');
        });

        test('handles creation errors', async () => {
            mockGoalManager.createGoal.mockImplementation(() => {
                throw new Error('Creation failed');
            });

            await cli.createGoal();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Error');
        });

        test('handles empty title', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['1', '']; // type, empty title
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Title is required');
        });

        test('handles invalid target value', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['1', 'Test Goal', 'Description', 'abc']; // invalid target
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Invalid target value');
        });

        test('handles invalid duration', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['1', 'Test Goal', 'Description', '8', 'abc']; // invalid duration
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Invalid duration');
        });

        test('handles zero or negative duration', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['1', 'Test Goal', 'Description', '8', '0']; // zero duration
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Invalid duration');
        });

        test('creates exercise goal type', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['2', 'Exercise 30 min', 'Daily exercise', '30', '21', ''];
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(mockGoalManager.createGoal).toHaveBeenCalled();
            const callArg = mockGoalManager.createGoal.mock.calls[0][0];
            expect(callArg.type).toBe('exercise');
        });

        test('creates mood goal type', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['3', 'Mood goal', 'Daily mood', '7', '30', ''];
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(mockGoalManager.createGoal).toHaveBeenCalled();
            const callArg = mockGoalManager.createGoal.mock.calls[0][0];
            expect(callArg.type).toBe('mood');
        });

        test('creates medication goal type', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['4', 'Take meds', 'Daily medication', '30', ''];
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(mockGoalManager.createGoal).toHaveBeenCalled();
            const callArg = mockGoalManager.createGoal.mock.calls[0][0];
            expect(callArg.type).toBe('medication');
            expect(callArg.target).toBe(1); // Binary target
        });

        test('creates custom goal type', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['5', 'Custom goal', 'My custom goal', '100', '14', ''];
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(mockGoalManager.createGoal).toHaveBeenCalled();
            const callArg = mockGoalManager.createGoal.mock.calls[0][0];
            expect(callArg.type).toBe('custom');
        });

        test('handles custom start date', async () => {
            let promptCallCount = 0;
            cli.prompt = jest.fn().mockImplementation(() => {
                const responses = ['1', 'Test Goal', 'Description', '8', '30', '2025-01-15'];
                return Promise.resolve(responses[promptCallCount++] || '');
            });

            await cli.createGoal();

            expect(mockGoalManager.createGoal).toHaveBeenCalled();
            const callArg = mockGoalManager.createGoal.mock.calls[0][0];
            expect(callArg.startDate).toBe('2025-01-15');
        });
    });

    describe('updateProgress', () => {
        test('updates all goals when data exists', async () => {
            await cli.updateProgress();

            expect(mockGoalManager.updateAllGoals).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('handles no goals available', async () => {
            mockGoalManager.getGoals.mockReturnValue([]);

            await cli.updateProgress();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No active goals');
        });

        test('prompts to log data when no entry exists', async () => {
            mockDashboard.getEntry.mockReturnValue(null);
            cli.prompt = jest.fn().mockResolvedValue('n'); // User declines

            await cli.updateProgress();

            expect(cli.prompt).toHaveBeenCalled();
            expect(mockGoalManager.updateAllGoals).not.toHaveBeenCalled();
        });
    });

    describe('showStats', () => {
        test('displays goal statistics', () => {
            cli.showStats();

            expect(mockGoalManager.getGoalStats).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Goal Statistics');
        });

        test('shows correct stat values', () => {
            mockGoalManager.getGoalStats.mockReturnValue({
                total: 10,
                active: 7,
                completed: 2,
                archived: 1,
                totalProgress: 75,
                averageCompletion: 75,
                longestStreak: 25,
                totalStreak: 20,
                byType: {
                    sleep: 3,
                    exercise: 4,
                    mood: 3
                }
            });

            cli.showStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('10');
            expect(output).toContain('7');
            expect(output).toContain('2');
            expect(output).toContain('75');
        });
    });

    describe('showAchievements', () => {
        test('displays achievements', () => {
            cli.showAchievements();

            expect(mockGoalManager.displayAchievements).toHaveBeenCalled();
        });

        test('handles call successfully', () => {
            cli.showAchievements();

            expect(mockGoalManager.displayAchievements).toHaveBeenCalled();
        });
    });

    describe('showLeaderboard', () => {
        test('displays streak leaderboard', () => {
            cli.showLeaderboard();

            expect(mockGoalManager.getGoals).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('handles empty leaderboard', () => {
            mockGoalManager.getGoals.mockReturnValue([]);

            cli.showLeaderboard();

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('deleteGoal', () => {
        test('deletes goal by id', () => {
            cli.deleteGoal('goal-123');

            expect(mockGoalManager.deleteGoal).toHaveBeenCalledWith('goal-123');
        });

        test('handles deletion errors', () => {
            mockGoalManager.deleteGoal.mockImplementation(() => {
                throw new Error('Delete failed');
            });

            cli.deleteGoal('goal-123');

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Error');
        });
    });

    describe('archiveGoal', () => {
        test('archives goal by id', () => {
            cli.archiveGoal('goal-456');

            expect(mockGoalManager.archiveGoal).toHaveBeenCalledWith('goal-456');
        });

        test('handles archive errors', () => {
            mockGoalManager.archiveGoal.mockImplementation(() => {
                throw new Error('Archive failed');
            });

            cli.archiveGoal('goal-456');

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Error');
        });
    });

    describe('run', () => {
        test('runs help command by default', async () => {
            process.argv = ['node', 'goal-cli.js'];
            await cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Goal Setting & Achievement System');
        });

        test('runs list command', async () => {
            process.argv = ['node', 'goal-cli.js', 'list'];
            await cli.run();

            expect(mockGoalManager.displayGoals).toHaveBeenCalled();
        });

        test('runs create command', async () => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('1')              // type
                .mockResolvedValueOnce('Sleep 8 hours')  // title
                .mockResolvedValueOnce('Get better sleep') // description
                .mockResolvedValueOnce('8')              // target
                .mockResolvedValueOnce('30')             // duration
                .mockResolvedValueOnce('');              // startDate

            process.argv = ['node', 'goal-cli.js', 'create'];
            await cli.run();

            expect(mockGoalManager.createGoal).toHaveBeenCalled();
        });

        test('runs progress command', async () => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('8')
                .mockResolvedValueOnce('30')
                .mockResolvedValueOnce('7');

            process.argv = ['node', 'goal-cli.js', 'progress'];
            await cli.run();

            expect(mockGoalManager.updateAllGoals).toHaveBeenCalled();
        });

        test('runs stats command', async () => {
            process.argv = ['node', 'goal-cli.js', 'stats'];
            await cli.run();

            expect(mockGoalManager.getGoalStats).toHaveBeenCalled();
        });

        test('runs achievements command', async () => {
            process.argv = ['node', 'goal-cli.js', 'achievements'];
            await cli.run();

            expect(mockGoalManager.displayAchievements).toHaveBeenCalled();
        });

        test('runs leaderboard command', async () => {
            process.argv = ['node', 'goal-cli.js', 'leaderboard'];
            await cli.run();

            expect(mockGoalManager.getGoals).toHaveBeenCalled();
        });

        test('runs delete command with id', async () => {
            process.argv = ['node', 'goal-cli.js', 'delete', 'goal-123'];
            await cli.run();

            expect(mockGoalManager.deleteGoal).toHaveBeenCalledWith('goal-123');
        });

        test('runs archive command with id', async () => {
            process.argv = ['node', 'goal-cli.js', 'archive', 'goal-456'];
            await cli.run();

            expect(mockGoalManager.archiveGoal).toHaveBeenCalledWith('goal-456');
        });

        test('runs help command with "help" argument', async () => {
            process.argv = ['node', 'goal-cli.js', 'help'];
            await cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Goal Setting & Achievement System');
        });

        test('runs help command with "--help" flag', async () => {
            process.argv = ['node', 'goal-cli.js', '--help'];
            await cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Goal Setting & Achievement System');
        });

        test('runs help for unknown command', async () => {
            process.argv = ['node', 'goal-cli.js', 'unknown'];
            await cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Goal Setting & Achievement System');
        });
    });

    describe('module export', () => {
        test('exports GoalCLI class', () => {
            expect(GoalCLI).toBeDefined();
            expect(typeof GoalCLI).toBe('function');
        });
    });
});
