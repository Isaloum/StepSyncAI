const GoalManager = require('../goal-manager');
const fs = require('fs');
const path = require('path');

// Mock fs to avoid actual file operations
jest.mock('fs');

describe('GoalManager', () => {
    let goalManager;
    let mockDashboard;
    const testDataDir = './test-data';

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Mock dashboard
        mockDashboard = {
            getAllEntries: jest.fn(() => []),
            getEntriesByDateRange: jest.fn(() => [])
        };

        // Mock fs methods
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('[]');
        fs.writeFileSync.mockReturnValue(undefined);
        fs.mkdirSync.mockReturnValue(undefined);

        // Create instance
        goalManager = new GoalManager(mockDashboard, testDataDir);
    });

    describe('constructor and file operations', () => {
        test('should create instance with dashboard and data directory', () => {
            expect(goalManager).toBeDefined();
            expect(goalManager.dashboard).toBe(mockDashboard);
            expect(goalManager.dataDir).toBe(testDataDir);
            expect(goalManager.goals).toEqual([]);
            expect(goalManager.achievements).toEqual([]);
        });

        test('should load existing goals from file', () => {
            const mockGoals = [
                { id: '1', title: 'Test Goal', type: 'sleep' }
            ];

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockGoals));

            const gm = new GoalManager(mockDashboard, testDataDir);
            expect(gm.goals).toEqual(mockGoals);
        });

        test('should handle file read errors gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File read error');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const gm = new GoalManager(mockDashboard, testDataDir);

            expect(gm.goals).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should save goals to file', () => {
            goalManager.goals = [
                { id: '1', title: 'Test Goal' }
            ];

            const result = goalManager.saveGoals();

            expect(result).toBe(true);
            expect(fs.mkdirSync).toHaveBeenCalledWith(testDataDir, { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should handle save errors gracefully', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = goalManager.saveGoals();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should save and load achievements', () => {
            const mockAchievements = [{ id: '1', type: 'badge' }];

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockAchievements));

            const gm = new GoalManager(mockDashboard, testDataDir);
            expect(gm.achievements).toEqual(mockAchievements);

            gm.saveAchievements();
            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });

    describe('createGoal', () => {
        beforeEach(() => {
            // Mock console.log to suppress output
            jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            console.log.mockRestore();
        });

        test('should create a valid sleep goal', () => {
            const goalData = {
                type: 'sleep',
                title: 'Sleep 8 hours daily',
                description: 'Get consistent sleep',
                target: 8,
                duration: 30,
                startDate: '2025-01-01',
                metric: 'hours'
            };

            const goal = goalManager.createGoal(goalData);

            expect(goal).toHaveProperty('id');
            expect(goal.type).toBe('sleep');
            expect(goal.title).toBe('Sleep 8 hours daily');
            expect(goal.target).toBe(8);
            expect(goal.duration).toBe(30);
            expect(goal.status).toBe('active');
            expect(goal.progress.current).toBe(0);
            expect(goal.progress.percentage).toBe(0);
            expect(goal.progress.streak).toBe(0);
            expect(goalManager.goals.length).toBe(1);
        });

        test('should create exercise goal with default values', () => {
            const goalData = {
                type: 'exercise',
                title: 'Exercise 30 min daily',
                target: 30,
                duration: 60
            };

            const goal = goalManager.createGoal(goalData);

            expect(goal.type).toBe('exercise');
            expect(goal.description).toBe('Exercise 30 min daily'); // Uses title as default
            expect(goal.frequency).toBe('daily');
            expect(goal).toHaveProperty('startDate');
            expect(goal).toHaveProperty('endDate');
        });

        test('should throw error for missing required fields', () => {
            expect(() => {
                goalManager.createGoal({ type: 'sleep', title: 'Test' });
            }).toThrow('Missing required fields');

            expect(() => {
                goalManager.createGoal({ title: 'Test', target: 10, duration: 30 });
            }).toThrow('Missing required fields');
        });

        test('should throw error for invalid goal type', () => {
            expect(() => {
                goalManager.createGoal({
                    type: 'invalid',
                    title: 'Test',
                    target: 10,
                    duration: 30
                });
            }).toThrow('Invalid type');
        });

        test('should calculate correct end date', () => {
            const goalData = {
                type: 'mood',
                title: 'Improve mood',
                target: 7,
                duration: 14,
                startDate: '2025-01-01'
            };

            const goal = goalManager.createGoal(goalData);

            expect(goal.startDate).toBe('2025-01-01');
            expect(goal.endDate).toBe('2025-01-15');
        });

        test('should generate milestones for goal', () => {
            const goalData = {
                type: 'custom',
                title: 'Custom goal',
                target: 100,
                duration: 40
            };

            const goal = goalManager.createGoal(goalData);

            expect(goal.milestones).toHaveLength(4);
            expect(goal.milestones[0].percentage).toBe(25);
            expect(goal.milestones[0].days).toBe(10);
            expect(goal.milestones[1].percentage).toBe(50);
            expect(goal.milestones[1].days).toBe(20);
            expect(goal.milestones[2].percentage).toBe(75);
            expect(goal.milestones[3].percentage).toBe(100);
        });

        test('should create medication goal', () => {
            const goalData = {
                type: 'medication',
                title: 'Take meds consistently',
                target: 100,
                duration: 30
            };

            const goal = goalManager.createGoal(goalData);

            expect(goal.type).toBe('medication');
            expect(goal.status).toBe('active');
        });
    });

    describe('getGoals and getGoal', () => {
        beforeEach(() => {
            jest.spyOn(console, 'log').mockImplementation();

            // Create multiple goals
            goalManager.createGoal({
                type: 'sleep',
                title: 'Sleep goal',
                target: 8,
                duration: 30
            });

            goalManager.createGoal({
                type: 'exercise',
                title: 'Exercise goal',
                target: 30,
                duration: 60
            });

            goalManager.createGoal({
                type: 'sleep',
                title: 'Another sleep goal',
                target: 7,
                duration: 14
            });

            console.log.mockRestore();
        });

        test('should get all goals', () => {
            const goals = goalManager.getGoals();
            expect(goals).toHaveLength(3);
        });

        test('should filter goals by type', () => {
            const sleepGoals = goalManager.getGoals({ type: 'sleep' });
            expect(sleepGoals).toHaveLength(2);
            expect(sleepGoals.every(g => g.type === 'sleep')).toBe(true);
        });

        test('should filter goals by status', () => {
            goalManager.goals[0].status = 'completed';

            const activeGoals = goalManager.getGoals({ status: 'active' });
            expect(activeGoals).toHaveLength(2);
            expect(activeGoals.every(g => g.status === 'active')).toBe(true);

            const completedGoals = goalManager.getGoals({ status: 'completed' });
            expect(completedGoals).toHaveLength(1);
        });

        test('should filter active goals by date', () => {
            // Set one goal to past end date
            goalManager.goals[0].endDate = '2020-01-01';

            const activeGoals = goalManager.getGoals({ active: true });
            expect(activeGoals.length).toBeLessThan(3);
        });

        test('should get goal by ID', () => {
            const goalId = goalManager.goals[0].id;
            const goal = goalManager.getGoal(goalId);

            expect(goal).toBeDefined();
            expect(goal.id).toBe(goalId);
        });

        test('should return undefined for non-existent goal', () => {
            const goal = goalManager.getGoal('non-existent-id');
            expect(goal).toBeUndefined();
        });
    });

    describe('generateMilestones', () => {
        test('should generate correct milestones for 100 day goal', () => {
            const milestones = goalManager.generateMilestones(100);

            expect(milestones).toHaveLength(4);
            expect(milestones[0]).toEqual({
                percentage: 25,
                days: 25,
                reached: false,
                reachedAt: null
            });
            expect(milestones[3]).toEqual({
                percentage: 100,
                days: 100,
                reached: false,
                reachedAt: null
            });
        });

        test('should round up milestone days', () => {
            const milestones = goalManager.generateMilestones(30);

            expect(milestones[0].days).toBe(8); // 25% of 30 = 7.5, rounded up to 8
            expect(milestones[1].days).toBe(15); // 50% of 30 = 15
        });
    });

    describe('updateProgress', () => {
        let goalId;

        beforeEach(() => {
            jest.spyOn(console, 'log').mockImplementation();

            const goal = goalManager.createGoal({
                type: 'sleep',
                title: 'Sleep 8 hours',
                target: 8,
                duration: 30,
                startDate: '2025-01-01'
            });
            goalId = goal.id;

            console.log.mockRestore();
        });

        test('should throw error for non-existent goal', () => {
            expect(() => {
                goalManager.updateProgress('invalid-id', {});
            }).toThrow('Goal not found');
        });

        test('should throw error for inactive goal', () => {
            goalManager.goals[0].status = 'completed';

            expect(() => {
                goalManager.updateProgress(goalId, {});
            }).toThrow('Goal is not active');
        });

        test('should update progress when goal is met', () => {
            jest.spyOn(console, 'log').mockImplementation();

            const data = {
                date: '2025-01-01',
                sleep_hours: 8
            };

            const goal = goalManager.updateProgress(goalId, data);

            expect(goal.progress.daysCompleted).toBe(1);
            expect(goal.progress.streak).toBe(1);
            expect(goal.progress.maxStreak).toBe(1);
            expect(goal.progress.lastCompletedDate).toBe('2025-01-01');
            expect(goal.progress.percentage).toBeGreaterThan(0);
            expect(goal.history).toHaveLength(1);

            console.log.mockRestore();
        });

        test('should track streak correctly', () => {
            jest.spyOn(console, 'log').mockImplementation();

            // Day 1
            goalManager.updateProgress(goalId, {
                date: '2025-01-01',
                sleep_hours: 8
            });

            // Day 2 (consecutive)
            const goal2 = goalManager.updateProgress(goalId, {
                date: '2025-01-02',
                sleep_hours: 8
            });

            expect(goal2.progress.streak).toBe(2);
            expect(goal2.progress.maxStreak).toBe(2);

            console.log.mockRestore();
        });

        test('should reset streak when day is missed', () => {
            jest.spyOn(console, 'log').mockImplementation();

            // Day 1
            goalManager.updateProgress(goalId, {
                date: '2025-01-01',
                sleep_hours: 8
            });

            // Day 3 (skipped day 2)
            const goal = goalManager.updateProgress(goalId, {
                date: '2025-01-03',
                sleep_hours: 8
            });

            expect(goal.progress.streak).toBe(1); // Reset to 1
            expect(goal.progress.maxStreak).toBe(1);

            console.log.mockRestore();
        });

        test('should reset streak when goal not met', () => {
            jest.spyOn(console, 'log').mockImplementation();

            // Day 1 - goal met
            goalManager.updateProgress(goalId, {
                date: '2025-01-01',
                sleep_hours: 8
            });

            // Day 2 - goal not met
            const goal = goalManager.updateProgress(goalId, {
                date: '2025-01-02',
                sleep_hours: 5 // Below target
            });

            expect(goal.progress.streak).toBe(0);
            expect(goal.history[1].completed).toBe(false);

            console.log.mockRestore();
        });

        test('should complete goal when 100% reached', () => {
            jest.spyOn(console, 'log').mockImplementation();

            // Manually set progress to near completion
            goalManager.goals[0].progress.daysCompleted = 29;
            goalManager.goals[0].duration = 30;

            const goal = goalManager.updateProgress(goalId, {
                date: '2025-01-30',
                sleep_hours: 8
            });

            expect(goal.status).toBe('completed');
            expect(goal.completedAt).toBeTruthy();
            expect(goal.progress.percentage).toBeGreaterThanOrEqual(100);

            console.log.mockRestore();
        });
    });

    describe('deleteGoal and archiveGoal', () => {
        let goalId;

        beforeEach(() => {
            jest.spyOn(console, 'log').mockImplementation();

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Test goal',
                target: 30,
                duration: 30
            });
            goalId = goal.id;

            console.log.mockRestore();
        });

        test('should delete goal by ID', () => {
            jest.spyOn(console, 'log').mockImplementation();

            const result = goalManager.deleteGoal(goalId);

            expect(result).toBe(true);
            expect(goalManager.goals).toHaveLength(0);
            expect(fs.writeFileSync).toHaveBeenCalled();

            console.log.mockRestore();
        });

        test('should throw error when deleting non-existent goal', () => {
            expect(() => {
                goalManager.deleteGoal('invalid-id');
            }).toThrow('Goal not found');
        });

        test('should archive goal by ID', () => {
            jest.spyOn(console, 'log').mockImplementation();

            const result = goalManager.archiveGoal(goalId);

            expect(result).toBeDefined();
            expect(result.status).toBe('archived');
            expect(result.archivedAt).toBeTruthy();
            expect(goalManager.goals[0].status).toBe('archived');

            console.log.mockRestore();
        });

        test('should throw error when archiving non-existent goal', () => {
            expect(() => {
                goalManager.archiveGoal('invalid-id');
            }).toThrow('Goal not found');
        });
    });

    describe('getGoalStats', () => {
        beforeEach(() => {
            jest.spyOn(console, 'log').mockImplementation();

            // Create and complete some goals
            const goal1 = goalManager.createGoal({
                type: 'sleep',
                title: 'Sleep goal 1',
                target: 8,
                duration: 10
            });
            goal1.progress.daysCompleted = 10;
            goal1.progress.percentage = 100;
            goal1.status = 'completed';

            const goal2 = goalManager.createGoal({
                type: 'exercise',
                title: 'Exercise goal',
                target: 30,
                duration: 20
            });
            goal2.progress.daysCompleted = 15;
            goal2.progress.percentage = 75;

            console.log.mockRestore();
        });

        test('should get stats for specific goal', () => {
            const goalId = goalManager.goals[0].id;
            const stats = goalManager.getGoalStats(goalId);

            expect(stats.total).toBe(1);
            expect(stats.completed).toBe(1);
            expect(stats.averageCompletion).toBe(100);
        });

        test('should get overall stats for all goals', () => {
            const stats = goalManager.getGoalStats();

            expect(stats.total).toBe(2);
            expect(stats.active).toBe(1);
            expect(stats.completed).toBe(1);
            expect(stats.byType).toBeDefined();
            expect(stats.byType.sleep).toBe(1);
            expect(stats.byType.exercise).toBe(1);
        });

        test('should calculate average progress', () => {
            const stats = goalManager.getGoalStats();

            // (100 + 75) / 2 = 87.5, rounded = 88
            expect(stats.averageCompletion).toBe(88);
        });

        test('should return empty stats for invalid goal ID', () => {
            const stats = goalManager.getGoalStats('invalid-id');
            expect(stats).toBeDefined();
            expect(stats.total).toBe(0);
            expect(stats.active).toBe(0);
            expect(stats.completed).toBe(0);
        });
    });

    describe('getAchievements', () => {
        beforeEach(() => {
            goalManager.achievements = [
                { id: '1', type: 'streak', value: 7, goalId: 'goal-1' },
                { id: '2', type: 'completion', goalId: 'goal-2' },
                { id: '3', type: 'streak', value: 30, goalId: 'goal-1' }
            ];
        });

        test('should get all achievements', () => {
            const achievements = goalManager.getAchievements();
            expect(achievements).toHaveLength(3);
        });

        test('should filter achievements by type', () => {
            const streakAchievements = goalManager.getAchievements({ type: 'streak' });
            expect(streakAchievements).toHaveLength(2);
            expect(streakAchievements.every(a => a.type === 'streak')).toBe(true);
        });

        test('should not filter by goalId (only by type)', () => {
            // getAchievements only filters by type, not goalId
            const allAchievements = goalManager.getAchievements({});
            expect(allAchievements).toHaveLength(3);
        });
    });
});
