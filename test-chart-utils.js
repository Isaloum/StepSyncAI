const ChartUtils = require('./chart-utils');

describe('ChartUtils', () => {
    describe('lineChart', () => {
        test('should create a line chart with valid data', () => {
            const data = [
                { label: 'Mon', value: 5 },
                { label: 'Tue', value: 7 },
                { label: 'Wed', value: 6 }
            ];
            const result = ChartUtils.lineChart(data, { title: 'Test Chart', height: 5 });

            expect(result).toContain('Test Chart');
            expect(result).toContain('═');
            expect(result).toContain('│');
        });

        test('should handle empty data', () => {
            const result = ChartUtils.lineChart([]);
            expect(result).toContain('No data to display');
        });

        test('should handle null data', () => {
            const result = ChartUtils.lineChart(null);
            expect(result).toContain('No data to display');
        });

        test('should respect custom min and max values', () => {
            const data = [
                { label: 'Day1', value: 5 },
                { label: 'Day2', value: 10 }
            ];
            const result = ChartUtils.lineChart(data, { min: 0, max: 20, height: 5 });

            expect(result).toContain('20.0');
            expect(result).toContain('0.0');
        });

        test('should show values when data length is small', () => {
            const data = [
                { label: 'Mon', value: 5 },
                { label: 'Tue', value: 7 }
            ];
            const result = ChartUtils.lineChart(data, { showValues: true });

            expect(result).toContain('Values:');
            expect(result).toContain('Mon: 5');
            expect(result).toContain('Tue: 7');
        });

        test('should handle single data point', () => {
            const data = [{ label: 'Day1', value: 10 }];
            const result = ChartUtils.lineChart(data);

            expect(result).not.toContain('No data to display');
            expect(result).toContain('●');
        });
    });

    describe('barChart', () => {
        test('should create a bar chart with valid data', () => {
            const data = [
                { label: 'Item A', value: 10 },
                { label: 'Item B', value: 20 },
                { label: 'Item C', value: 15 }
            ];
            const result = ChartUtils.barChart(data, { title: 'Test Bar Chart' });

            expect(result).toContain('Test Bar Chart');
            expect(result).toContain('Item A');
            expect(result).toContain('Item B');
            expect(result).toContain('█');
        });

        test('should handle empty data', () => {
            const result = ChartUtils.barChart([]);
            expect(result).toContain('No data to display');
        });

        test('should show percentages when enabled', () => {
            const data = [
                { label: 'A', value: 50 },
                { label: 'B', value: 100 }
            ];
            const result = ChartUtils.barChart(data, { showPercentage: true });

            expect(result).toContain('(50.0%)');
            expect(result).toContain('(100.0%)');
        });

        test('should handle single bar', () => {
            const data = [{ label: 'Only', value: 42 }];
            const result = ChartUtils.barChart(data);

            expect(result).toContain('Only');
            expect(result).toContain('42');
        });
    });

    describe('sparkline', () => {
        test('should create sparkline with valid values', () => {
            const values = [1, 2, 3, 4, 5];
            const result = ChartUtils.sparkline(values);

            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
            expect(result).toMatch(/[▁▂▃▄▅▆▇█]+/);
        });

        test('should handle empty array', () => {
            const result = ChartUtils.sparkline([]);
            expect(result).toBe('');
        });

        test('should handle null values', () => {
            const result = ChartUtils.sparkline(null);
            expect(result).toBe('');
        });

        test('should handle uniform values', () => {
            const values = [5, 5, 5, 5];
            const result = ChartUtils.sparkline(values);

            expect(result).toBeTruthy();
            expect(result.length).toBe(4);
        });

        test('should handle single value', () => {
            const result = ChartUtils.sparkline([10]);
            expect(result).toBeTruthy();
            expect(result.length).toBe(1);
        });
    });

    describe('progressBar', () => {
        test('should create progress bar with valid values', () => {
            const result = ChartUtils.progressBar(50, 100);

            expect(result).toContain('█');
            expect(result).toContain('░');
            expect(result).toContain('50.0%');
            expect(result).toContain('(50/100)');
        });

        test('should handle 0% progress', () => {
            const result = ChartUtils.progressBar(0, 100);

            expect(result).toContain('0.0%');
            expect(result).toContain('(0/100)');
        });

        test('should handle 100% progress', () => {
            const result = ChartUtils.progressBar(100, 100);

            expect(result).toContain('100.0%');
            expect(result).toContain('(100/100)');
        });

        test('should cap at 100% when current exceeds total', () => {
            const result = ChartUtils.progressBar(150, 100);

            expect(result).toContain('100.0%');
        });

        test('should hide percentage when disabled', () => {
            const result = ChartUtils.progressBar(50, 100, { showPercentage: false });

            expect(result).not.toContain('%');
            expect(result).toContain('(50/100)');
        });

        test('should respect custom width', () => {
            const result = ChartUtils.progressBar(50, 100, { width: 20 });

            // Should have 10 filled + 10 empty = 20 total characters
            const barPart = result.split(' ')[0];
            expect(barPart.length).toBe(20);
        });

        test('should respect custom characters', () => {
            const result = ChartUtils.progressBar(50, 100, { filled: '#', empty: '-' });

            expect(result).toContain('#');
            expect(result).toContain('-');
        });
    });

    describe('calendarHeatmap', () => {
        test('should create calendar heatmap with valid data', () => {
            const today = new Date();
            const data = [
                { date: today, value: 5 },
                { date: new Date(today.getTime() - 86400000), value: 10 }
            ];
            const result = ChartUtils.calendarHeatmap(data);

            expect(result).toContain('Calendar Heatmap');
            expect(result).toContain('Mon');
            expect(result).toContain('Legend');
        });

        test('should handle empty data', () => {
            const result = ChartUtils.calendarHeatmap([]);
            expect(result).toContain('No data to display');
        });

        test('should handle custom title', () => {
            const data = [{ date: new Date(), value: 5 }];
            const result = ChartUtils.calendarHeatmap(data, { title: 'Custom Title' });

            expect(result).toContain('Custom Title');
        });

        test('should show different intensity levels', () => {
            const today = new Date();
            const data = [
                { date: today, value: 0 },
                { date: new Date(today.getTime() - 86400000), value: 10 }
            ];
            const result = ChartUtils.calendarHeatmap(data);

            expect(result).toContain('░');
        });
    });

    describe('percentageWheel', () => {
        test('should create wheel for 0%', () => {
            const result = ChartUtils.percentageWheel(0);
            expect(result).toContain('○');
            expect(result).toContain('0.0%');
        });

        test('should create wheel for 50%', () => {
            const result = ChartUtils.percentageWheel(50);
            expect(result).toContain('50.0%');
        });

        test('should create wheel for 100%', () => {
            const result = ChartUtils.percentageWheel(100);
            expect(result).toContain('●');
            expect(result).toContain('100.0%');
        });

        test('should handle values above 100%', () => {
            const result = ChartUtils.percentageWheel(150);
            expect(result).toContain('100.0%');
        });

        test('should handle negative values', () => {
            const result = ChartUtils.percentageWheel(-10);
            expect(result).toContain('0.0%');
        });

        test('should include label when provided', () => {
            const result = ChartUtils.percentageWheel(75, 'Complete');
            expect(result).toContain('Complete');
            expect(result).toContain('75.0%');
        });

        test('should show different wheel stages', () => {
            const result25 = ChartUtils.percentageWheel(25);
            const result75 = ChartUtils.percentageWheel(75);

            expect(result25).toContain('25.0%');
            expect(result75).toContain('75.0%');
        });
    });

    describe('streakDisplay', () => {
        test('should show current and longest streak', () => {
            const result = ChartUtils.streakDisplay(5, 10);

            expect(result).toContain('Current Streak: 5 days');
            expect(result).toContain('Longest Streak: 10 days');
        });

        test('should show fire emoji for 7+ day streak', () => {
            const result = ChartUtils.streakDisplay(7, 10);
            expect(result).toContain('🔥');
        });

        test('should show multiple fire emojis for longer streaks', () => {
            const result = ChartUtils.streakDisplay(14, 14);
            expect(result).toContain('🔥🔥');
        });

        test('should show personal record message', () => {
            const result = ChartUtils.streakDisplay(10, 10);
            expect(result).toContain('New personal record!');
        });

        test('should not show personal record when not achieved', () => {
            const result = ChartUtils.streakDisplay(5, 10);
            expect(result).not.toContain('New personal record!');
        });

        test('should handle zero streak', () => {
            const result = ChartUtils.streakDisplay(0, 10);

            expect(result).toContain('Current Streak: 0 days');
            expect(result).not.toContain('🔥');
        });
    });

    describe('statsBox', () => {
        test('should create stats box with valid data', () => {
            const stats = {
                'Total Items': 100,
                'Completed': 75,
                'Average': '85.5%'
            };
            const result = ChartUtils.statsBox(stats, 'Summary');

            expect(result).toContain('Summary');
            expect(result).toContain('Total Items: 100');
            expect(result).toContain('Completed: 75');
            expect(result).toContain('Average: 85.5%');
            expect(result).toContain('╔');
            expect(result).toContain('╗');
            expect(result).toContain('╚');
            expect(result).toContain('╝');
        });

        test('should handle empty stats object', () => {
            const result = ChartUtils.statsBox({});
            expect(result).toContain('Statistics');
        });

        test('should use default title when not provided', () => {
            const stats = { 'Item': 'Value' };
            const result = ChartUtils.statsBox(stats);

            expect(result).toContain('Statistics');
        });

        test('should handle single stat', () => {
            const stats = { 'Count': 42 };
            const result = ChartUtils.statsBox(stats, 'Single Stat');

            expect(result).toContain('Single Stat');
            expect(result).toContain('Count: 42');
        });

        test('should properly align stats with different key lengths', () => {
            const stats = {
                'A': 1,
                'Very Long Key Name': 999
            };
            const result = ChartUtils.statsBox(stats);

            expect(result).toContain('A: 1');
            expect(result).toContain('Very Long Key Name: 999');
        });
    });
});
