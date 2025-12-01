const ChartUtils = require('../chart-utils');

describe('ChartUtils', () => {
    describe('lineChart', () => {
        test('handles empty data', () => {
            const result = ChartUtils.lineChart([]);
            expect(result).toContain('Line Chart');
            expect(result).toContain('No data to display');
        });

        test('handles null data', () => {
            const result = ChartUtils.lineChart(null);
            expect(result).toContain('No data to display');
        });

        test('creates chart with data', () => {
            const data = [
                { label: 'Mon', value: 5 },
                { label: 'Tue', value: 7 },
                { label: 'Wed', value: 6 }
            ];
            const result = ChartUtils.lineChart(data);
            expect(result).toContain('Line Chart');
            expect(result).not.toContain('No data to display');
        });

        test('respects custom title', () => {
            const data = [{ label: 'Day 1', value: 10 }];
            const result = ChartUtils.lineChart(data, { title: 'Custom Title' });
            expect(result).toContain('Custom Title');
        });

        test('respects min and max options', () => {
            const data = [
                { label: 'A', value: 5 },
                { label: 'B', value: 10 }
            ];
            const result = ChartUtils.lineChart(data, { min: 0, max: 20 });
            expect(result).toBeTruthy();
        });

        test('hides values when data length exceeds threshold', () => {
            const data = Array.from({ length: 20 }, (_, i) => ({
                label: `D${i}`,
                value: i
            }));
            const result = ChartUtils.lineChart(data);
            expect(result).not.toContain('Values:');
        });

        test('shows values for small datasets', () => {
            const data = [
                { label: 'Mon', value: 5 },
                { label: 'Tue', value: 7 }
            ];
            const result = ChartUtils.lineChart(data, { showValues: true });
            expect(result).toContain('Values:');
            expect(result).toContain('Mon: 5');
        });
    });

    describe('barChart', () => {
        test('handles empty data', () => {
            const result = ChartUtils.barChart([]);
            expect(result).toContain('Bar Chart');
            expect(result).toContain('No data to display');
        });

        test('handles null data', () => {
            const result = ChartUtils.barChart(null);
            expect(result).toContain('No data to display');
        });

        test('creates chart with data', () => {
            const data = [
                { label: 'Category A', value: 10 },
                { label: 'Category B', value: 20 }
            ];
            const result = ChartUtils.barChart(data);
            expect(result).toContain('Bar Chart');
            expect(result).toContain('Category A');
            expect(result).toContain('Category B');
            expect(result).toContain('█');
        });

        test('shows percentages when option enabled', () => {
            const data = [
                { label: 'A', value: 50 },
                { label: 'B', value: 100 }
            ];
            const result = ChartUtils.barChart(data, { showPercentage: true });
            expect(result).toContain('%');
        });

        test('respects custom title and width', () => {
            const data = [{ label: 'Test', value: 5 }];
            const result = ChartUtils.barChart(data, {
                title: 'My Chart',
                width: 30
            });
            expect(result).toContain('My Chart');
        });
    });

    describe('sparkline', () => {
        test('handles empty array', () => {
            const result = ChartUtils.sparkline([]);
            expect(result).toBe('');
        });

        test('handles null', () => {
            const result = ChartUtils.sparkline(null);
            expect(result).toBe('');
        });

        test('creates sparkline from values', () => {
            const values = [1, 2, 3, 4, 5];
            const result = ChartUtils.sparkline(values);
            expect(result).toBeTruthy();
            expect(result.length).toBe(5);
        });

        test('handles single value', () => {
            const result = ChartUtils.sparkline([5]);
            expect(result.length).toBe(1);
        });

        test('handles all same values', () => {
            const result = ChartUtils.sparkline([5, 5, 5, 5]);
            expect(result).toBeTruthy();
        });
    });

    describe('progressBar', () => {
        test('creates progress bar', () => {
            const result = ChartUtils.progressBar(50, 100);
            expect(result).toContain('█');
            expect(result).toContain('░');
            expect(result).toContain('50/100');
        });

        test('handles 0 progress', () => {
            const result = ChartUtils.progressBar(0, 100);
            expect(result).toContain('0/100');
        });

        test('handles 100% progress', () => {
            const result = ChartUtils.progressBar(100, 100);
            expect(result).toContain('100.0%');
        });

        test('handles over 100%', () => {
            const result = ChartUtils.progressBar(150, 100);
            expect(result).toContain('100.0%');
        });

        test('respects custom width', () => {
            const result = ChartUtils.progressBar(50, 100, { width: 20 });
            expect(result).toBeTruthy();
        });

        test('hides percentage when option disabled', () => {
            const result = ChartUtils.progressBar(50, 100, { showPercentage: false });
            expect(result).not.toContain('%');
            expect(result).toContain('50/100');
        });

        test('uses custom filled and empty characters', () => {
            const result = ChartUtils.progressBar(50, 100, {
                filled: '#',
                empty: '-'
            });
            expect(result).toContain('#');
            expect(result).toContain('-');
        });
    });

    describe('calendarHeatmap', () => {
        test('handles empty data', () => {
            const result = ChartUtils.calendarHeatmap([]);
            expect(result).toContain('Calendar Heatmap');
            expect(result).toContain('No data to display');
        });

        test('handles null data', () => {
            const result = ChartUtils.calendarHeatmap(null);
            expect(result).toContain('No data to display');
        });

        test('creates heatmap with data', () => {
            const data = [
                { date: '2025-11-01', value: 5 },
                { date: '2025-11-02', value: 10 },
                { date: '2025-11-03', value: 0 }
            ];
            const result = ChartUtils.calendarHeatmap(data);
            expect(result).toContain('Calendar Heatmap');
            expect(result).toContain('Mon');
            expect(result).toContain('Legend:');
        });

        test('respects custom title', () => {
            const data = [{ date: '2025-11-01', value: 5 }];
            const result = ChartUtils.calendarHeatmap(data, { title: 'Activity' });
            expect(result).toContain('Activity');
        });

        test('handles custom days option', () => {
            const data = [
                { date: '2025-11-01', value: 5 },
                { date: '2025-11-15', value: 10 }
            ];
            const result = ChartUtils.calendarHeatmap(data, { days: 14 });
            expect(result).toBeTruthy();
        });

        test('handles custom levels option', () => {
            const data = [
                { date: '2025-11-01', value: 5 },
                { date: '2025-11-02', value: 10 }
            ];
            const result = ChartUtils.calendarHeatmap(data, { levels: 5 });
            expect(result).toBeTruthy();
        });
    });

    describe('percentageWheel', () => {
        test('handles 0%', () => {
            const result = ChartUtils.percentageWheel(0);
            expect(result).toContain('○');
            expect(result).toContain('0.0%');
        });

        test('handles 100%', () => {
            const result = ChartUtils.percentageWheel(100);
            expect(result).toContain('●');
            expect(result).toContain('100.0%');
        });

        test('handles 50%', () => {
            const result = ChartUtils.percentageWheel(50);
            expect(result).toContain('50.0%');
        });

        test('handles over 100%', () => {
            const result = ChartUtils.percentageWheel(150);
            expect(result).toContain('100.0%');
        });

        test('handles negative values', () => {
            const result = ChartUtils.percentageWheel(-50);
            expect(result).toContain('0.0%');
        });

        test('includes label when provided', () => {
            const result = ChartUtils.percentageWheel(75, 'Complete');
            expect(result).toContain('75.0%');
            expect(result).toContain('Complete');
        });

        test('works without label', () => {
            const result = ChartUtils.percentageWheel(50);
            expect(result).toContain('50.0%');
        });
    });

    describe('streakDisplay', () => {
        test('displays streak information', () => {
            const result = ChartUtils.streakDisplay(5, 10);
            expect(result).toContain('Current Streak: 5 days');
            expect(result).toContain('Longest Streak: 10 days');
        });

        test('shows fire emoji for 7+ day streak', () => {
            const result = ChartUtils.streakDisplay(7, 10);
            expect(result).toContain('🔥');
        });

        test('shows multiple fire emojis for longer streaks', () => {
            const result = ChartUtils.streakDisplay(14, 20);
            expect(result).toContain('🔥');
        });

        test('shows record message when current equals longest', () => {
            const result = ChartUtils.streakDisplay(10, 10);
            expect(result).toContain('New personal record!');
        });

        test('shows record message when current exceeds longest', () => {
            const result = ChartUtils.streakDisplay(15, 10);
            expect(result).toContain('New personal record!');
        });

        test('no record message when current is less', () => {
            const result = ChartUtils.streakDisplay(5, 10);
            expect(result).not.toContain('New personal record!');
        });

        test('handles zero streak', () => {
            const result = ChartUtils.streakDisplay(0, 10);
            expect(result).toContain('Current Streak: 0 days');
            expect(result).not.toContain('🔥');
            expect(result).not.toContain('New personal record!');
        });
    });

    describe('statsBox', () => {
        test('creates stats box', () => {
            const stats = {
                'Total': 100,
                'Average': 50,
                'Maximum': 75
            };
            const result = ChartUtils.statsBox(stats);
            expect(result).toContain('Statistics');
            expect(result).toContain('Total');
            expect(result).toContain('100');
            expect(result).toContain('Average');
            expect(result).toContain('50');
            expect(result).toContain('Maximum');
            expect(result).toContain('75');
            expect(result).toContain('╔');
            expect(result).toContain('╗');
        });

        test('respects custom title', () => {
            const stats = { 'Count': 5 };
            const result = ChartUtils.statsBox(stats, 'My Stats');
            expect(result).toContain('My Stats');
        });

        test('handles single stat', () => {
            const stats = { 'Value': 42 };
            const result = ChartUtils.statsBox(stats);
            expect(result).toContain('Value: 42');
        });

        test('handles stats with multiple entries', () => {
            const stats = {
                'Count': 10,
                'Sum': 100
            };
            const result = ChartUtils.statsBox(stats);
            expect(result).toContain('Count');
            expect(result).toContain('10');
            expect(result).toContain('Sum');
            expect(result).toContain('100');
        });

        test('handles long key names', () => {
            const stats = {
                'Very Long Stat Name Here': 123,
                'Short': 456
            };
            const result = ChartUtils.statsBox(stats);
            expect(result).toContain('Very Long Stat Name Here: 123');
            expect(result).toContain('Short');
            expect(result).toContain(': 456');
        });
    });
});
