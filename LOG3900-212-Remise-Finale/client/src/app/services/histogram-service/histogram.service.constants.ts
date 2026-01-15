import { ChartOptions } from 'chart.js';

export const HISTOGRAM_OPTIONS: ChartOptions = {
    scales: {
        x: {
            grid: {
                drawOnChartArea: false,
                drawTicks: false,
            },
        },
        y: {
            title: {
                text: 'Nombre de réponses',
                display: true,
            },
            grid: {
                drawOnChartArea: false,
                drawTicks: false,
            },
            ticks: {
                precision: 0,
            },
        },
    },
    plugins: {
        legend: {
            display: false,
        },
    },
    elements: {
        bar: {
            backgroundColor: 'red',
            borderColor: 'black',
            borderWidth: 1,
        },
    },
    animation: {
        duration: 0,
    },
};
