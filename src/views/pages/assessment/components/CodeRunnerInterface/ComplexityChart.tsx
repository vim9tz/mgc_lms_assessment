"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, Typography, Box } from '@mui/material';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ComplexityChartProps {
    type: 'Time' | 'Space';
    expected: string;
    actual: string;
}

const ComplexityChart: React.FC<ComplexityChartProps> = ({ type, expected, actual }) => {

    const normalize = (val: string) => (val || "").replace(/\s+/g, '').toLowerCase();

    // Map Complexity to "Performance Score" (Higher is Better/Faster)
    // O(1) is 100% efficient, O(n!) is near 0.
    const complexityScore = (complexity: string): number => {
        const c = normalize(complexity);
        if (c.includes("o(1)")) return 100;
        if (c.includes("logn")) return 85;
        if (c.includes("o(n)")) return 70;
        if (c.includes("nlogn")) return 55;
        if (c.includes("n^2")) return 40;
        if (c.includes("2^n")) return 25;
        if (c.includes("n!")) return 10;
        return 0; // Unknown
    };

    const expectedScore = complexityScore(expected);
    const actualScore = complexityScore(actual);
    
    // Series: [Actual, Expected]
    // But specific visual: "Compare".
    // Let's do a RadialBar with 2 series.
    const series = [actualScore, expectedScore];
    
    // Determine color for Actual: Green if Actual >= Expected (-10 tolerance), else Red
    const isGood = actualScore >= (expectedScore - 10);
    const actualColor = isGood ? '#22c55e' : '#ef4444'; // green-500 : red-500

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'radialBar',
            height: 250,
            foreColor: '#334155', // slate-700
        },
        plotOptions: {
            radialBar: {
                dataLabels: {
                    name: {
                        fontSize: '22px',
                    },
                    value: {
                        fontSize: '16px',
                        formatter: function (val) {
                            return val === expectedScore ? expected : actual;
                        }
                    },
                    total: {
                        show: true,
                        label: isGood ? 'Optimal' : 'Needs Optimization',
                        formatter: function (w) {
                            // Show Actual Complexity in center
                            return actual; 
                        },
                         color: isGood ? '#22c55e' : '#ef4444',
                         fontSize: '12px'
                    }
                },
                hollow: {
                    size: '60%',
                },
                track: {
                    background: '#f1f5f9', // slate-100 for light track
                    strokeWidth: '97%',
                    margin: 5, 
                    dropShadow: {
                        enabled: false,
                    }
                },
            },
        },
        colors: [actualColor, '#8b5cf6'], // Actual vs Expected (Purple-500)
        labels: ['Actual', 'Expected'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light', // Light shade for charts
                type: 'horizontal',
                shadeIntensity: 0.5,
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: {
            lineCap: 'round'
        },
        legend: {
            show: true,
            position: 'bottom',
            labels: {
                colors: '#334155', // slate-700 for text labels
            },
            markers: {
                width: 8,
                height: 8,
                radius: 12,
            },
            itemMargin: {
                horizontal: 10,
                vertical: 0
            }
        },
    };

    return (
        <Card sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <CardContent sx={{ p: 0, pb: '0 !important', display: 'flex', flexDirection: 'col', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: -2 }}>
                    {type} Complexity
                </Typography>
                <Box sx={{ position: 'relative' }}>
                    <ReactApexChart 
                        options={options} 
                        series={series} 
                        type="radialBar" 
                        height={230} 
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default ComplexityChart;
