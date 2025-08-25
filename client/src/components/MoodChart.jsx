import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function MoodChart({ entries }) {
    const { labels, counts } = useMemo(() => {
        const map = new Map();
        entries.forEach(e => {
            const mood = (e.mood || 'unknown').toLowerCase();
            map.set(mood, (map.get(mood) || 0) + 1);
        });
        return { labels: [...map.keys()], counts: [...map.values()] };
    }, [entries]);

    if (!labels.length) return null;

    return (
        <div style={{ marginTop: 24}}>
            <h3>Mood Trends</h3>
            <Bar
                data={{
                    labels,
                    datasets: [{
                        label: 'Entries',
                        data: counts
                    }],
                }}
                options={{
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                }}
            />
        </div>
    );
}