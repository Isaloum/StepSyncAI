const fs = require('fs');
const AWSForKids = require('../aws-for-kids');

// Mock fs module
jest.mock('fs');

describe('AWSForKids', () => {
  let app;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock fs methods with default behavior
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockImplementation(() => {});

    // Create app instance
    app = new AWSForKids('test-aws-progress.json');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor and Data Loading', () => {
    test('should initialize with default data structure when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const newApp = new AWSForKids('new-test.json');

      expect(newApp.data).toHaveProperty('progress');
      expect(newApp.data).toHaveProperty('quizScores');
      expect(newApp.data).toHaveProperty('completedLessons');
      expect(newApp.data).toHaveProperty('totalStudyTime');
      expect(newApp.data.quizScores).toEqual([]);
      expect(newApp.data.completedLessons).toEqual([]);
      expect(newApp.data.totalStudyTime).toBe(0);
    });

    test('should load existing data from file', () => {
      const mockData = {
        progress: { ec2: 100 },
        quizScores: [{ date: '2024-01-01', score: 5, total: 5, percentage: 100 }],
        completedLessons: ['ec2', 's3'],
        totalStudyTime: 120
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const newApp = new AWSForKids('existing-test.json');

      expect(newApp.data.completedLessons).toEqual(['ec2', 's3']);
      expect(newApp.data.totalStudyTime).toBe(120);
      expect(newApp.data.quizScores.length).toBe(1);
    });

    test('should handle corrupted JSON file gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json {{{');

      const newApp = new AWSForKids('corrupted-test.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(newApp.data.completedLessons).toEqual([]);
    });

    test('should initialize concepts on construction', () => {
      expect(app.concepts).toBeDefined();
      expect(app.concepts).toHaveProperty('ec2');
      expect(app.concepts).toHaveProperty('s3');
      expect(app.concepts).toHaveProperty('iam');
      expect(app.concepts).toHaveProperty('vpc');
    });

    test('should initialize quiz questions on construction', () => {
      expect(app.quizQuestions).toBeDefined();
      expect(Array.isArray(app.quizQuestions)).toBe(true);
      expect(app.quizQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('Concepts Structure', () => {
    test('each concept should have required fields', () => {
      Object.entries(app.concepts).forEach(([key, concept]) => {
        expect(concept).toHaveProperty('name');
        expect(concept).toHaveProperty('emoji');
        expect(concept).toHaveProperty('simple');
        expect(concept).toHaveProperty('explanation');
        expect(concept).toHaveProperty('category');
        expect(concept).toHaveProperty('examWeight');
      });
    });

    test('concepts should have valid exam weights', () => {
      const validWeights = ['HIGH', 'MEDIUM', 'LOW'];

      Object.values(app.concepts).forEach(concept => {
        expect(validWeights).toContain(concept.examWeight);
      });
    });

    test('concepts should have valid categories', () => {
      Object.values(app.concepts).forEach(concept => {
        expect(concept.category).toBeTruthy();
        expect(typeof concept.category).toBe('string');
        expect(concept.category.length).toBeGreaterThan(0);
      });
    });

    test('should have multiple concept categories', () => {
      const categories = new Set(Object.values(app.concepts).map(c => c.category));

      expect(categories.size).toBeGreaterThan(1);
      expect(categories.has('Compute') || categories.has('Storage')).toBe(true);
    });

    test('HIGH priority concepts should exist', () => {
      const highPriority = Object.values(app.concepts).filter(c => c.examWeight === 'HIGH');

      expect(highPriority.length).toBeGreaterThan(0);
    });
  });

  describe('Quiz Questions Structure', () => {
    test('each quiz question should have required fields', () => {
      app.quizQuestions.forEach(question => {
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('correct');
        expect(question).toHaveProperty('explanation');
      });
    });

    test('quiz questions should have exactly 4 options', () => {
      app.quizQuestions.forEach(question => {
        expect(question.options.length).toBe(4);
      });
    });

    test('correct answer index should be valid (0-3)', () => {
      app.quizQuestions.forEach(question => {
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(4);
      });
    });

    test('quiz questions should have variety', () => {
      // Verify we have multiple quiz questions
      expect(app.quizQuestions.length).toBeGreaterThan(5);
    });

    test('quiz questions should have non-empty explanations', () => {
      app.quizQuestions.forEach(question => {
        expect(question.explanation).toBeTruthy();
        expect(question.explanation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('learn method', () => {
    test('should display concept information for valid topic', () => {
      app.learn('ec2');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('EC2'));
    });

    test('should mark topic as learned', () => {
      app.learn('ec2');

      expect(app.data.completedLessons).toContain('ec2');
    });

    test('should save data after learning', () => {
      fs.writeFileSync.mockClear();

      app.learn('s3');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should not duplicate completed lessons', () => {
      app.learn('ec2');
      app.learn('ec2');

      const ec2Count = app.data.completedLessons.filter(l => l === 'ec2').length;
      expect(ec2Count).toBe(1);
    });

    test('should handle invalid topic key', () => {
      app.learn('nonexistent-topic');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('should display emoji for concept', () => {
      app.learn('s3');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🧸'));
    });

    test('should display simple explanation', () => {
      app.learn('iam');

      const calls = consoleLogSpy.mock.calls.flat();
      const hasSimpleExplanation = calls.some(call =>
        typeof call === 'string' && call.includes('IAM')
      );

      expect(hasSimpleExplanation).toBe(true);
    });

    test('should track progress count', () => {
      const initialCount = app.data.completedLessons.length;

      app.learn('ec2');
      app.learn('s3');

      expect(app.data.completedLessons.length).toBe(initialCount + 2);
    });
  });

  describe('listTopics method', () => {
    test('should display all topics when no category specified', () => {
      app.listTopics();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AWS CONCEPTS'));
    });

    test('should filter by category when specified', () => {
      app.listTopics('Compute');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should show progress indicators for completed topics', () => {
      app.data.completedLessons = ['ec2'];

      app.listTopics();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('✅');
    });

    test('should display exam weight importance', () => {
      app.listTopics();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Importance:');
    });

    test('should show progress summary', () => {
      app.data.completedLessons = ['ec2', 's3'];

      app.listTopics();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Progress:');
    });

    test('should handle case-insensitive category filter', () => {
      app.listTopics('compute');
      app.listTopics('COMPUTE');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should group concepts by category', () => {
      app.listTopics();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      // Should have category headers
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('progress method', () => {
    test('should display progress statistics', () => {
      app.progress();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('LEARNING PROGRESS'));
    });

    test('should calculate completion percentage', () => {
      app.data.completedLessons = ['ec2', 's3'];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('%');
    });

    test('should display progress bar', () => {
      app.data.completedLessons = ['ec2'];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('█');
    });

    test('should show quiz history when available', () => {
      app.data.quizScores = [
        { date: '2024-01-01', score: 4, total: 5, percentage: '80.0' }
      ];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Quiz History');
    });

    test('should calculate average quiz score', () => {
      app.data.quizScores = [
        { date: '2024-01-01', score: 4, total: 5, percentage: '80.0' },
        { date: '2024-01-02', score: 5, total: 5, percentage: '100.0' }
      ];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Average');
    });

    test('should show next steps recommendations', () => {
      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Next Steps');
    });

    test('should handle zero completed topics', () => {
      app.data.completedLessons = [];

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should display last 5 quiz scores only', () => {
      app.data.quizScores = [];
      for (let i = 0; i < 10; i++) {
        app.data.quizScores.push({
          date: `2024-01-${i + 1}`,
          score: 5,
          total: 5,
          percentage: '100.0'
        });
      }

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('studyGuide method', () => {
    test('should display exam overview', () => {
      app.studyGuide();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('EXAM OVERVIEW');
    });

    test('should show exam duration', () => {
      app.studyGuide();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('90 minutes');
    });

    test('should show passing score', () => {
      app.studyGuide();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('700');
    });

    test('should display exam domains', () => {
      app.studyGuide();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('EXAM DOMAINS');
    });

    test('should include study tips', () => {
      app.studyGuide();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    test('saveData should return true on successful save', () => {
      const result = app.saveData();

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('saveData should return false on write error', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = app.saveData();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('saveData should write formatted JSON', () => {
      app.saveData();

      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('test-aws-progress.json');

      // Check that JSON is formatted (has indentation)
      const jsonData = writeCall[1];
      expect(jsonData).toContain('\n');
      expect(jsonData).toContain('  ');
    });

    test('data should persist completed lessons', () => {
      app.learn('ec2');

      // Get the last save call (most recent)
      const lastSaveCall = fs.writeFileSync.mock.calls[fs.writeFileSync.mock.calls.length - 1];
      const savedData = JSON.parse(lastSaveCall[1]);
      expect(savedData.completedLessons).toContain('ec2');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty completed lessons array', () => {
      app.data.completedLessons = [];

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle empty quiz scores array', () => {
      app.data.quizScores = [];

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle all topics completed', () => {
      const allTopics = Object.keys(app.concepts);
      app.data.completedLessons = allTopics;

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('100');
    });

    test('should handle very long study time', () => {
      app.data.totalStudyTime = 999999;

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle learning same topic multiple times', () => {
      app.learn('ec2');
      const firstCount = app.data.completedLessons.length;

      app.learn('ec2');
      const secondCount = app.data.completedLessons.length;

      expect(firstCount).toBe(secondCount);
    });

    test('should handle special characters in topic keys', () => {
      // Test that existing topics with special chars work
      const topicKeys = Object.keys(app.concepts);
      expect(topicKeys.length).toBeGreaterThan(0);

      topicKeys.forEach(key => {
        expect(typeof key).toBe('string');
      });
    });

    test('should handle zero quiz questions requested', () => {
      // Note: quiz method uses readline, so we just test parameter validation
      expect(app.quizQuestions.length).toBeGreaterThan(0);
    });

    test('should handle category filter with no matches', () => {
      app.listTopics('NonExistentCategory');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete learning workflow', () => {
      // Learn multiple topics
      app.learn('ec2');
      app.learn('s3');
      app.learn('iam');

      // Check progress
      app.progress();

      // Verify topics were saved
      expect(app.data.completedLessons).toContain('ec2');
      expect(app.data.completedLessons).toContain('s3');
      expect(app.data.completedLessons).toContain('iam');
    });

    test('should track quiz attempts over time', () => {
      // Simulate multiple quiz attempts
      app.data.quizScores.push(
        { date: '2024-01-01', score: 3, total: 5, percentage: '60.0' },
        { date: '2024-01-02', score: 4, total: 5, percentage: '80.0' },
        { date: '2024-01-03', score: 5, total: 5, percentage: '100.0' }
      );

      app.progress();

      expect(app.data.quizScores.length).toBe(3);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should allow reviewing learned topics', () => {
      // Learn a topic
      app.learn('vpc');

      // List topics to see progress
      app.listTopics();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('✅');
    });

    test('should provide study guidance based on progress', () => {
      // No quizzes taken yet
      app.data.quizScores = [];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Next Steps');
    });

    test('should handle mixed progress states', () => {
      // Some topics learned, some quizzes taken
      app.data.completedLessons = ['ec2', 's3'];
      app.data.quizScores = [
        { date: '2024-01-01', score: 4, total: 5, percentage: '80.0' }
      ];

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(app.data.completedLessons.length).toBe(2);
      expect(app.data.quizScores.length).toBe(1);
    });
  });

  describe('Concept Coverage', () => {
    test('should have comprehensive AWS service coverage', () => {
      const conceptCount = Object.keys(app.concepts).length;

      expect(conceptCount).toBeGreaterThanOrEqual(10);
    });

    test('should have sufficient quiz questions for practice', () => {
      expect(app.quizQuestions.length).toBeGreaterThanOrEqual(20);
    });

    test('should cover all major AWS categories', () => {
      const categories = new Set(Object.values(app.concepts).map(c => c.category));

      // Should have multiple categories
      expect(categories.size).toBeGreaterThan(3);
    });

    test('should have quiz questions about AWS services', () => {
      // Verify quiz questions ask about AWS-related content
      const allQuestions = app.quizQuestions.map(q => q.question.toLowerCase()).join(' ');

      // Should mention AWS services or concepts
      const hasAWSContent = allQuestions.includes('ec2') ||
                           allQuestions.includes('s3') ||
                           allQuestions.includes('aws') ||
                           allQuestions.includes('cloud');

      expect(hasAWSContent).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    test('should calculate progress percentage correctly', () => {
      const totalTopics = Object.keys(app.concepts).length;
      app.data.completedLessons = ['ec2', 's3'];

      const expectedPercentage = ((2 / totalTopics) * 100).toFixed(1);

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain(expectedPercentage);
    });

    test('should handle 0% progress', () => {
      app.data.completedLessons = [];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('0/');
    });

    test('should handle 100% progress', () => {
      const allTopics = Object.keys(app.concepts);
      app.data.completedLessons = [...allTopics];

      app.progress();

      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('100');
    });
  });

  describe('Visualization Methods', () => {
    beforeEach(() => {
      // Setup test data for visualizations
      const allTopics = Object.keys(app.concepts);

      // Complete some lessons
      app.data.completedLessons = [allTopics[0], allTopics[1], allTopics[2]];

      // Add quiz scores
      app.data.quizScores = [
        { topic: allTopics[0], percentage: 80, date: new Date().toISOString() },
        { topic: allTopics[1], percentage: 90, date: new Date().toISOString() },
        { topic: allTopics[2], percentage: 75, date: new Date().toISOString() },
        { topic: allTopics[0], percentage: 85, date: new Date().toISOString() }
      ];
    });

    describe('visualizeLearningProgress', () => {
      test('should display comprehensive learning dashboard', () => {
        app.visualizeLearningProgress();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Learning Progress Dashboard');
      });

      test('should show topic mastery by category', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Topic Mastery');
        // Should show at least some categories
        expect(output).toMatch(/Compute|Storage|Database|Networking/);
      });

      test('should show quiz performance trends', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Quiz Performance');
      });

      test('should show exam readiness assessment', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Exam Readiness');
      });

      test('should handle no completed lessons', () => {
        app.data.completedLessons = [];
        app.data.quizScores = [];

        app.visualizeLearningProgress();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Learning Progress Dashboard');
        expect(output).toContain('0.0%'); // Should show 0% completion
      });

      test('should handle no quiz scores', () => {
        app.data.quizScores = [];

        app.visualizeLearningProgress();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // Should still show dashboard, just without quiz performance trends section
        expect(output).toContain('Learning Progress Dashboard');
        expect(output).not.toContain('Quiz Performance Trends'); // The detailed quiz section should not show
        expect(output).toContain('Quiz Performance'); // But will still show in exam readiness criteria
      });

      test('should calculate completion percentage', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toMatch(/\d+\.\d+%/);
      });

      test('should show progress bars for categories', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // Should contain progress bar characters
        expect(output).toMatch(/[█░]/);
      });

      test('should show quiz score chart', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // Should have chart elements
        expect(output).toMatch(/[●│]/);
      });

      test('should calculate average quiz score', () => {
        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Average');
      });

      test('should handle 100% completion', () => {
        const allTopics = Object.keys(app.concepts);
        app.data.completedLessons = [...allTopics];
        app.data.quizScores = allTopics.map(topic => ({
          topic,
          percentage: 100,
          date: new Date().toISOString()
        }));

        app.visualizeLearningProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('100');
      });
    });

    describe('Helper Methods for Visualizations', () => {
      test('showExamReadiness should calculate readiness score', () => {
        const completionRate = 50; // 50% of topics completed

        app.showExamReadiness(completionRate);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Readiness');
      });

      test('showExamReadiness should show "Ready" for high scores', () => {
        const completionRate = 90;
        app.data.quizScores = [
          { topic: 'ec2', percentage: 95, date: new Date().toISOString() },
          { topic: 's3', percentage: 92, date: new Date().toISOString() },
          { topic: 'lambda', percentage: 88, date: new Date().toISOString() }
        ];

        app.showExamReadiness(completionRate);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toMatch(/Ready|Excellent/i);
      });

      test('showExamReadiness should show "Keep studying" for low scores', () => {
        const completionRate = 30;
        app.data.quizScores = [
          { topic: 'ec2', percentage: 55, date: new Date().toISOString() },
          { topic: 's3', percentage: 60, date: new Date().toISOString() }
        ];

        app.showExamReadiness(completionRate);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toMatch(/Keep studying|Continue learning/i);
      });

      test('showExamReadiness should handle no quiz scores', () => {
        app.data.quizScores = [];

        app.showExamReadiness(50);

        expect(consoleLogSpy).toHaveBeenCalled();
        // Should not throw error
      });

      test('calculateQuizTrend should identify improving trend', () => {
        const scores = [60, 70, 75, 80, 85];

        const trend = app.calculateQuizTrend(scores);

        expect(trend).toContain('Improving');
      });

      test('calculateQuizTrend should identify declining trend', () => {
        const scores = [90, 85, 80, 75, 70];

        const trend = app.calculateQuizTrend(scores);

        expect(trend).toContain('Declining');
      });

      test('calculateQuizTrend should identify stable trend', () => {
        const scores = [80, 81, 80, 79, 80];

        const trend = app.calculateQuizTrend(scores);

        expect(trend).toContain('Stable');
      });

      test('calculateQuizTrend should handle single score', () => {
        const scores = [75];

        const trend = app.calculateQuizTrend(scores);

        expect(trend).toContain('Insufficient data');
      });

      test('calculateQuizTrend should handle empty scores', () => {
        const scores = [];

        const trend = app.calculateQuizTrend(scores);

        expect(trend).toContain('Insufficient data');
      });
    });
  });
});
