import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { TrendingUp, Activity, Calendar } from 'lucide-react';
import { MediaItem } from '../types/media.js';
import {
  buildDownloadFrequencySeries,
  TimeRangeDays,
  FrequencyDataPoint,
} from '../utils/vault-timeseries.js';

interface VaultFrequencyChartProps {
  history: MediaItem[];
}

export const VaultFrequencyChart: React.FC<VaultFrequencyChartProps> = ({ history }) => {
  const [rangeDays, setRangeDays] = useState<TimeRangeDays>(14);
  const [metricMode, setMetricMode] = useState<'downloads' | 'clips'>('downloads');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const summary = useMemo(
    () => buildDownloadFrequencySeries(history, rangeDays),
    [history, rangeDays]
  );

  const width = 760;
  const height = 210;
  const margin = { top: 20, right: 24, bottom: 32, left: 42 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const getValue = (d: FrequencyDataPoint) =>
    metricMode === 'downloads' ? d.downloadEvents : d.clipCount;

  const { xScale, yScale, linePath, areaPath, yTicks } = useMemo(() => {
    const x = d3
      .scalePoint<string>()
      .domain(summary.points.map((d) => d.dateKey))
      .range([0, innerWidth])
      .padding(0.2);

    const maxVal = d3.max(summary.points, getValue) || 0;
    const upperBound = maxVal === 0 ? 5 : Math.ceil(maxVal * 1.18);

    const y = d3
      .scaleLinear()
      .domain([0, upperBound])
      .nice()
      .range([innerHeight, 0]);

    const lineGenerator = d3
      .line<FrequencyDataPoint>()
      .x((d) => x(d.dateKey) ?? 0)
      .y((d) => y(getValue(d)))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<FrequencyDataPoint>()
      .x((d) => x(d.dateKey) ?? 0)
      .y0(innerHeight)
      .y1((d) => y(getValue(d)))
      .curve(d3.curveMonotoneX);

    return {
      xScale: x,
      yScale: y,
      linePath: lineGenerator(summary.points) || '',
      areaPath: areaGenerator(summary.points) || '',
      yTicks: y.ticks(4),
    };
  }, [summary.points, metricMode, innerWidth, innerHeight]);

  const activePoint = useMemo(() => {
    if (hoveredIndex !== null && summary.points[hoveredIndex]) {
      return summary.points[hoveredIndex];
    }
    for (let i = summary.points.length - 1; i >= 0; i--) {
      if (summary.points[i].downloadEvents > 0 || summary.points[i].clipCount > 0) {
        return summary.points[i];
      }
    }
    return summary.points[summary.points.length - 1];
  }, [hoveredIndex, summary.points]);

  return (
    <div
      data-testid="vault-d3-frequency-chart"
      className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs"
    >
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Download Frequency Over Time (D3 Activity Timeline)
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                Peak: {summary.peakDownloads.toLocaleString()} ({summary.peakDayLabel})
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Avg {summary.averagePerDay.toLocaleString()} saves/day · {summary.totalPeriodClips} clips archived in window
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Metric toggle */}
          <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setMetricMode('downloads')}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                metricMode === 'downloads'
                  ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Download Volume
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('clips')}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                metricMode === 'clips'
                  ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Saved Clips
            </button>
          </div>

          {/* Time window selector */}
          <div
            role="group"
            aria-label="Chart time range"
            className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          >
            {([7, 14, 30] as TimeRangeDays[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md transition-colors cursor-pointer ${
                  rangeDays === days
                    ? 'bg-rose-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Readout Banner */}
      {activePoint && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/90 border border-zinc-200/60 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
              {activePoint.label} ({activePoint.dateKey})
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {activePoint.downloadEvents.toLocaleString()} downloads
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
              {activePoint.clipCount} clips
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-red-500">Pin: {activePoint.pinterestCount}</span>
            <span className="text-pink-500">Reel: {activePoint.instagramCount}</span>
          </div>
        </div>
      )}

      {/* Responsive D3 SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-48 select-none overflow-visible"
          role="img"
          aria-label="D3 line chart showing download frequency over time"
        >
          <defs>
            <linearGradient id="vaultAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.36" />
              <stop offset="75%" stopColor="#ec4899" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="vaultLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Horizontal Y Grid Lines & Labels */}
            {yTicks.map((tick) => {
              const yPos = yScale(tick);
              return (
                <g key={tick} transform={`translate(0, ${yPos})`}>
                  <line
                    x1={0}
                    x2={innerWidth}
                    stroke="currentColor"
                    strokeDasharray="3,3"
                    className="text-zinc-200 dark:text-zinc-800"
                  />
                  <text
                    x={-8}
                    y={4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-zinc-400 dark:fill-zinc-500"
                  >
                    {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                  </text>
                </g>
              );
            })}

            {/* Area under curve */}
            <path d={areaPath} fill="url(#vaultAreaGrad)" />

            {/* Smooth D3 Monotone Line */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#vaultLineGrad)"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-Axis Labels & Data Points */}
            {summary.points.map((pt, idx) => {
              const cx = xScale(pt.dateKey) ?? 0;
              const cy = yScale(getValue(pt));
              const isHovered = hoveredIndex === idx;
              const showLabel =
                rangeDays === 7 ||
                (rangeDays === 14 && idx % 2 === 0) ||
                (rangeDays === 30 && idx % 4 === 0) ||
                idx === summary.points.length - 1;

              return (
                <g
                  key={pt.dateKey}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Vertical hover guide line */}
                  {isHovered && (
                    <line
                      x1={cx}
                      x2={cx}
                      y1={0}
                      y2={innerHeight}
                      stroke="#f43f5e"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Invisible wider hit target for smooth hover */}
                  <rect
                    x={cx - innerWidth / summary.points.length / 2}
                    y={0}
                    width={innerWidth / summary.points.length}
                    height={innerHeight}
                    fill="transparent"
                  />

                  {/* Outer pulse ring on active/non-zero points */}
                  {(isHovered || getValue(pt) > 0) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 7 : 4.5}
                      className="fill-rose-500/20 transition-all duration-150"
                    />
                  )}

                  {/* Data vertex dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 4.5 : 3}
                    className={`${
                      getValue(pt) > 0
                        ? 'fill-rose-500 stroke-white dark:stroke-zinc-900'
                        : 'fill-zinc-300 dark:fill-zinc-700 stroke-white dark:stroke-zinc-900'
                    } stroke-2 transition-all duration-150`}
                  />

                  {/* X-axis date tick label */}
                  {showLabel && (
                    <text
                      x={cx}
                      y={innerHeight + 18}
                      textAnchor="middle"
                      className={`text-[9px] font-mono ${
                        isHovered
                          ? 'fill-rose-500 font-bold'
                          : 'fill-zinc-400 dark:fill-zinc-500'
                      }`}
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
