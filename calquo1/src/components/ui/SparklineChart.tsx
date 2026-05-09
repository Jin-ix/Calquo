import React, { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface SparklineChartProps {
    data: number[];
    color?: string;
    strokeWidth?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
    data,
    color = '#10b981', // Default to a vibrant green
    strokeWidth = 2
}) => {
    const [chartData, setChartData] = useState<{ value: number }[]>([]);

    useEffect(() => {
        setChartData(data.map(val => ({ value: val })));
    }, [data]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
