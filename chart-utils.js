/**
 * ASCII Chart Utilities for Terminal Visualization
 * Provides reusable charting functions for CLI apps
 */

class ChartUtils {
    /**
     * Create a line chart showing trends over time
     * @param {Array} data - Array of {label, value} objects
     * @param {Object} options - Chart options (title, height, width, min, max)
     */
    static lineChart(data, options = {}) {
        const {
            title = 'Line Chart',
            height = 10,
            width = 60,
            min = null,
            max = null,
            showValues = true
        } = options;

        if (!data || data.length === 0) {
            return `${title}\n(No data to display)`;
        }

        const values = data.map(d => d.value);
        const minValue = min !== null ? min : Math.min(...values);
        const maxValue = max !== null ? max : Math.max(...values);
        const range = maxValue - minValue || 1;

        let output = `\n${title}\n${'═'.repeat(width)}\n`;

        // Y-axis scale
        for (let row = height; row >= 0; row--) {
            const rowValue = minValue + (range * row / height);
            const yLabel = rowValue.toFixed(1).padStart(6);
            output += `${yLabel} │`;

            // Plot points
            for (let i = 0; i < data.length; i++) {
                const normalizedValue = (data[i].value - minValue) / range;
                const pointRow = Math.round(normalizedValue * height);

                if (pointRow === row) {
                    output += '●';
                } else if (i > 0) {
                    // Draw line between points
                    const prevNormalized = (data[i - 1].value - minValue) / range;
                    const prevRow = Math.round(prevNormalized * height);

                    if ((row > Math.min(pointRow, prevRow) && row < Math.max(pointRow, prevRow))) {
                        output += '│';
                    } else {
                        output += ' ';
                    }
                } else {
                    output += ' ';
                }
            }
            output += '\n';
        }

        // X-axis
        output += '       └' + '─'.repeat(data.length) + '\n';
        output += '        ';

        // X-axis labels (show every nth label to avoid crowding)
        const labelInterval = Math.ceil(data.length / 10);
        for (let i = 0; i < data.length; i++) {
            if (i % labelInterval === 0 || i === data.length - 1) {
                output += data[i].label.substring(0, 1);
            } else {
                output += ' ';
            }
        }
        output += '\n';

        // Show actual values if enabled
        if (showValues && data.length <= 15) {
            output += '\nValues:\n';
            data.forEach((d, i) => {
                output += `  ${d.label}: ${d.value}\n`;
            });
        }

        return output;
    }

    /**
     * Create a horizontal bar chart
     * @param {Array} data - Array of {label, value} objects
     * @param {Object} options - Chart options
     */
    static barChart(data, options = {}) {
        const {
            title = 'Bar Chart',
            width = 50,
            showPercentage = false
        } = options;

        if (!data || data.length === 0) {
            return `${title}\n(No data to display)`;
        }

        const maxValue = Math.max(...data.map(d => d.value));
        const maxLabelLength = Math.max(...data.map(d => d.label.length));

        let output = `\n${title}\n${'═'.repeat(width + maxLabelLength + 10)}\n`;

        data.forEach(item => {
            const barLength = Math.round((item.value / maxValue) * width);
            const bar = '█'.repeat(barLength);
            const percentage = showPercentage ? ` (${((item.value / maxValue) * 100).toFixed(1)}%)` : '';
            const label = item.label.padEnd(maxLabelLength);

            output += `${label} │${bar} ${item.value}${percentage}\n`;
        });

        return output;
    }

    /**
     * Create a sparkline (mini inline chart)
     * @param {Array} values - Array of numbers
     */
    static sparkline(values) {
        if (!values || values.length === 0) return '';

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

        return values.map(value => {
            const normalized = (value - min) / range;
            const index = Math.min(Math.floor(normalized * ticks.length), ticks.length - 1);
            return ticks[index];
        }).join('');
    }

    /**
     * Create a progress bar
     * @param {number} current - Current value
     * @param {number} total - Total/target value
     * @param {Object} options - Options
     */
    static progressBar(current, total, options = {}) {
        const {
            width = 40,
            showPercentage = true,
            filled = '█',
            empty = '░'
        } = options;

        const percentage = Math.min((current / total) * 100, 100);
        const filledLength = Math.round((percentage / 100) * width);
        const emptyLength = width - filledLength;

        const bar = filled.repeat(filledLength) + empty.repeat(emptyLength);
        const percentText = showPercentage ? ` ${percentage.toFixed(1)}%` : '';

        return `${bar}${percentText} (${current}/${total})`;
    }

    /**
     * Create a calendar heatmap (7 days wide)
     * @param {Array} data - Array of {date, value} objects
     * @param {Object} options - Options
     */
    static calendarHeatmap(data, options = {}) {
        const {
            title = 'Calendar Heatmap',
            days = 28,
            levels = 4
        } = options;

        if (!data || data.length === 0) {
            return `${title}\n(No data to display)`;
        }

        const today = new Date();
        const dateMap = new Map();
        data.forEach(d => {
            const dateStr = new Date(d.date).toDateString();
            dateMap.set(dateStr, d.value);
        });

        // Calculate value ranges for color levels
        const values = data.map(d => d.value).filter(v => v > 0);
        const maxValue = Math.max(...values, 1);
        const step = maxValue / levels;

        const symbols = ['░', '▒', '▓', '█'];

        let output = `\n${title}\n${'═'.repeat(30)}\n`;
        output += '    Mon Tue Wed Thu Fri Sat Sun\n';

        // Calculate start date (go back 'days' days)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days + 1);

        // Start from the most recent Monday
        while (startDate.getDay() !== 1) {
            startDate.setDate(startDate.getDate() - 1);
        }

        let currentWeek = [];
        let weekNum = 1;

        for (let i = 0; i < days + (7 - (days % 7)); i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            const dateStr = date.toDateString();
            const value = dateMap.get(dateStr) || 0;

            // Determine symbol based on value
            let symbol = symbols[0];
            if (value > 0) {
                const level = Math.min(Math.floor(value / step), levels - 1);
                symbol = symbols[level];
            }

            currentWeek.push(symbol);

            // New week (Sunday)
            if (currentWeek.length === 7) {
                output += `W${weekNum.toString().padStart(2)} ${currentWeek.join('   ')}\n`;
                currentWeek = [];
                weekNum++;
            }
        }

        output += `\nLegend: ${symbols[0]} None  ${symbols[1]} Low  ${symbols[2]} Medium  ${symbols[3]} High\n`;

        return output;
    }

    /**
     * Create a simple percentage wheel/circle
     * @param {number} percentage - Percentage (0-100)
     * @param {string} label - Label to display
     */
    static percentageWheel(percentage, label = '') {
        const p = Math.min(Math.max(percentage, 0), 100);
        const eighth = Math.round(p / 12.5);

        const wheels = [
            '○',  // 0%
            '◔',  // 12.5%
            '◑',  // 25%
            '◕',  // 37.5%
            '●',  // 50%
            '◕',  // 62.5%
            '◑',  // 75%
            '◔',  // 87.5%
            '○'   // 100%
        ];

        const wheel = p >= 100 ? '●' : (p === 0 ? '○' : wheels[eighth] || '◑');
        return `${wheel} ${p.toFixed(1)}%${label ? ' ' + label : ''}`;
    }

    /**
     * Create a streak display
     * @param {number} currentStreak - Current streak count
     * @param {number} longestStreak - Longest streak achieved
     */
    static streakDisplay(currentStreak, longestStreak) {
        const fire = currentStreak >= 7 ? '🔥'.repeat(Math.min(Math.floor(currentStreak / 7), 5)) : '';

        let output = '\n📊 Streak Information\n';
        output += '═'.repeat(40) + '\n';
        output += `Current Streak: ${currentStreak} days ${fire}\n`;
        output += `Longest Streak: ${longestStreak} days\n`;

        if (currentStreak >= longestStreak && currentStreak > 0) {
            output += '🎉 New personal record!\n';
        }

        return output;
    }

    /**
     * Create a summary stats box
     * @param {Object} stats - Object with stat keys and values
     * @param {string} title - Box title
     */
    static statsBox(stats, title = 'Statistics') {
        const entries = Object.entries(stats);
        const maxKeyLength = Math.max(...entries.map(([k]) => k.length));
        const width = maxKeyLength + 30;

        let output = `\n╔${'═'.repeat(width)}╗\n`;
        output += `║ ${title.padEnd(width - 1)}║\n`;
        output += `╠${'═'.repeat(width)}╣\n`;

        entries.forEach(([key, value]) => {
            const line = `${key.padEnd(maxKeyLength)}: ${value}`;
            output += `║ ${line.padEnd(width - 1)}║\n`;
        });

        output += `╚${'═'.repeat(width)}╝\n`;

        return output;
    }
}

module.exports = ChartUtils;
