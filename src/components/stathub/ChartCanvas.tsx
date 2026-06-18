"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Dataset, ChartType, EventAnnotation } from "@/lib/stathub/types";
import { linearRegressionForecast, rSquaredLabel } from "@/lib/stathub/analytics";
import { ANNOTATION_TYPE_COLORS } from "@/lib/stathub/analytics";

interface ChartCanvasProps {
  dataset: Dataset;
  chartType?: ChartType;
  height?: number;
  interactive?: boolean;
  showForecast?: boolean;
  showAnnotations?: boolean;
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: string;
  color: string;
  isForecast?: boolean;
}

// ── Color helpers ────────────────────────────────────────────────────────────

function heatColor(t: number): string {
  if (t < 0.33) {
    const r = Math.round(99 + (168 - 99) * (t / 0.33));
    const g = Math.round(102 + (85 - 102) * (t / 0.33));
    const b = Math.round(241 + (247 - 241) * (t / 0.33));
    return `rgb(${r},${g},${b})`;
  } else if (t < 0.67) {
    const s = (t - 0.33) / 0.34;
    const r = Math.round(168 + (249 - 168) * s);
    const g = Math.round(85 + (115 - 85) * s);
    const b = Math.round(247 + (22 - 247) * s);
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.67) / 0.33;
    const r = Math.round(249 + (251 - 249) * s);
    const g = Math.round(115 + (146 - 115) * s);
    const b = Math.round(22 + (9 - 22) * s);
    return `rgb(${r},${g},${b})`;
  }
}

// ── Main Chart Canvas ────────────────────────────────────────────────────────

export function ChartCanvas({
  dataset,
  chartType,
  height = 380,
  interactive = true,
  showForecast = false,
  showAnnotations = true,
  className = "",
}: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    value: "",
    color: "",
  });

  const type = chartType || dataset.chartType;

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Forecast data
  const forecast = showForecast ? linearRegressionForecast(dataset, 5) : null;

  const handleHover = useCallback(
    (e: React.MouseEvent, label: string, value: number, color: string, isForecast = false) => {
      if (!interactive) return;
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        label,
        value: `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${dataset.unit}`,
        color,
        isForecast,
      });
    },
    [dataset.unit, interactive]
  );

  const handleLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  const accent = dataset.accent || "#6366f1";

  let svgContent: React.ReactNode = null;

  if (type === "choropleth") {
    svgContent = (
      <ChoroplethChart
        dataset={dataset}
        width={width}
        height={height}
        onHover={handleHover}
        onLeave={handleLeave}
      />
    );
  } else if (type === "radar") {
    svgContent = (
      <RadarChart
        dataset={dataset}
        width={width}
        height={height}
        onHover={handleHover}
        onLeave={handleLeave}
      />
    );
  } else if (type === "scatter") {
    svgContent = (
      <ScatterChart
        dataset={dataset}
        width={width}
        height={height}
        onHover={handleHover}
        onLeave={handleLeave}
      />
    );
  } else if (type === "stacked-bar") {
    svgContent = (
      <StackedBarChart
        dataset={dataset}
        width={width}
        height={height}
        onHover={handleHover}
        onLeave={handleLeave}
      />
    );
  } else {
    svgContent = (
      <StandardChart
        dataset={dataset}
        chartType={type}
        width={width}
        height={height}
        forecast={forecast}
        showForecast={showForecast}
        interactive={interactive}
        annotations={showAnnotations ? dataset.annotations : undefined}
        onHover={handleHover}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ minHeight: height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="sh-chart-svg"
        style={{ overflow: "visible" }}
      >
        {svgContent}
      </svg>
      {interactive && tooltip.visible && typeof document !== "undefined" && createPortal(
        <div
          className="sh-tooltip"
          style={{
            position: "fixed",
            left: Math.min(tooltip.x + 14, window.innerWidth - 160),
            top: tooltip.y - 48 < 10 ? tooltip.y + 20 : tooltip.y - 48,
            borderColor: tooltip.color + "60",
            boxShadow: `0 8px 32px ${tooltip.color}20`,
          }}
        >
          <div className="sh-tooltip-label">{tooltip.label}</div>
          <div className="sh-tooltip-value" style={{ color: tooltip.isForecast ? "#f59e0b" : tooltip.color }}>
            {tooltip.value}
            {tooltip.isForecast && <span className="sh-tooltip-badge">Forecast</span>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Standard Chart (line, area, bar) ─────────────────────────────────────────

interface StandardChartProps {
  dataset: Dataset;
  chartType: ChartType;
  width: number;
  height: number;
  forecast: ReturnType<typeof linearRegressionForecast> | null;
  showForecast: boolean;
  interactive: boolean;
  annotations?: EventAnnotation[];
  onHover: (e: React.MouseEvent, label: string, value: number, color: string, isForecast?: boolean) => void;
  onLeave: () => void;
}

function StandardChart({
  dataset,
  chartType,
  width,
  height,
  forecast,
  showForecast,
  interactive,
  annotations,
  onHover,
  onLeave,
}: StandardChartProps) {
  if (!dataset.data || dataset.data.length === 0) return null;

  const pad = { top: 20, right: 20, bottom: 40, left: 52 };
  const W = Math.max(50, width - pad.left - pad.right);
  const H = Math.max(50, height - pad.top - pad.bottom);

  // Determine data range including forecast
  const allPoints = forecast && showForecast ? forecast.points : dataset.data.map((d) => ({ ...d, forecast: false }));
  const historicalCount = dataset.data.length;

  const vals = allPoints.map((d) => d.value);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const hasNeg = rawMin < 0;
  const vMin = hasNeg ? rawMin * 1.15 : Math.min(0, rawMin * 0.9);
  const vMax = rawMax * 1.15 || 1;
  const vRange = vMax - vMin || 1;

  const yScale = (v: number) => H - ((v - vMin) / vRange) * H;
  const n = allPoints.length;
  const xStep = W / n;
  const xCenter = (i: number) => pad.left + xStep * i + xStep / 2;

  const accent = dataset.accent || "#6366f1";

  // Grid lines
  const gridLines = 4;
  const gridEls: React.ReactNode[] = [];
  const yLabels: React.ReactNode[] = [];
  for (let i = 0; i <= gridLines; i++) {
    const v = vMin + (vRange / gridLines) * (gridLines - i);
    const y = pad.top + (H / gridLines) * i;
    gridEls.push(
      <line key={`g${i}`} x1={pad.left} y1={y} x2={pad.left + W} y2={y} className="sh-grid-line" />
    );
    const lv = Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1);
    yLabels.push(
      <text key={`yl${i}`} x={pad.left - 8} y={y + 4} className="sh-axis-text" textAnchor="end">
        {lv}
      </text>
    );
  }

  // Zero line
  let zeroLine: React.ReactNode = null;
  if (hasNeg) {
    const zy = pad.top + yScale(0);
    zeroLine = <line x1={pad.left} y1={zy} x2={pad.left + W} y2={zy} stroke="currentColor" strokeDasharray="4 2" opacity={0.3} />;
  }

  // X labels
  const every = Math.max(1, Math.ceil(n / 8));
  const xLabels: React.ReactNode[] = [];
  // Index of the last label that falls on the regular interval.
  const lastRegular = Math.floor((n - 1) / every) * every;
  for (let i = 0; i < n; i++) {
    // Show a label on the interval, and always show the final point — but skip
    // the final one if it sits right next to the previous labeled tick, which
    // would make the two labels (e.g. 2023 / 2024) overlap.
    const isRegular = i % every === 0;
    const isLast = i === n - 1;
    const lastTooClose = isLast && (i - lastRegular) < every && i !== lastRegular;
    if ((isRegular || isLast) && !lastTooClose) {
      const x = xCenter(i);
      const isF = allPoints[i].forecast;
      xLabels.push(
        <text
          key={`xl${i}`}
          x={x}
          y={pad.top + H + 22}
          className="sh-axis-text"
          textAnchor="middle"
          opacity={isF ? 0.5 : 1}
          fontStyle={isF ? "italic" : "normal"}
        >
          {allPoints[i].label}
        </text>
      );
    }
  }

  // Confidence band (forecast)
  let confidenceBand: React.ReactNode = null;
  if (showForecast && forecast) {
    const confPoints = forecast.confidence;
    const bandPath =
      confPoints
        .slice(historicalCount - 1)
        .map((c, i) => {
          const idx = historicalCount - 1 + i;
          const x = xCenter(idx);
          return `${x},${pad.top + yScale(c.upper)}`;
        })
        .join(" L ") +
      " L " +
      confPoints
        .slice(historicalCount - 1)
        .reverse()
        .map((c, i) => {
          const idx = n - 1 - i;
          const x = xCenter(idx);
          return `${x},${pad.top + yScale(c.lower)}`;
        })
        .join(" L ");
    confidenceBand = <path d={`M ${bandPath} Z`} fill={accent} opacity={0.12} />;
  }

  // Chart body
  let body: React.ReactNode = null;
  const uid = dataset.id;

  if (chartType === "bar") {
    const bw = Math.max(4, xStep * 0.6);
    const normVals = vals.map((v) => (v - Math.min(...vals)) / (Math.max(...vals) - Math.min(...vals) || 1));
    body = (
      <g>
        {allPoints.map((d, i) => {
          const x = xCenter(i) - bw / 2;
          const y0 = pad.top + yScale(0);
          const yv = pad.top + yScale(d.value);
          const bh = Math.abs(y0 - yv);
          const by = Math.min(y0, yv);
          const isNeg = d.value < 0;
          const barColor = d.forecast ? "#f59e0b" : isNeg ? "#f87171" : heatColor(normVals[i]);
          return (
            <rect
              key={`b${i}`}
              x={x}
              y={by}
              width={bw}
              height={bh}
              fill={barColor}
              opacity={d.forecast ? 0.5 : 0.88}
              rx={4}
              strokeDasharray={d.forecast ? "4 2" : undefined}
              onMouseMove={(e) => onHover(e, d.label, d.value, accent, d.forecast)}
              onMouseLeave={onLeave}
            />
          );
        })}
      </g>
    );
  } else {
    // line or area
    const pts = allPoints.map((d, i) => `${xCenter(i)},${pad.top + yScale(d.value)}`).join(" ");

    // Split into historical and forecast segments
    const histPts = allPoints.slice(0, historicalCount).map((d, i) => `${xCenter(i)},${pad.top + yScale(d.value)}`).join(" ");
    const fcPts = showForecast && forecast
      ? allPoints.slice(historicalCount - 1).map((d, i) => `${xCenter(historicalCount - 1 + i)},${pad.top + yScale(d.value)}`).join(" ")
      : "";

    if (chartType === "area") {
      const first = xCenter(0);
      const last = xCenter(n - 1);
      const zeroY = pad.top + yScale(Math.max(0, vMin));
      body = (
        <g>
          <defs>
            <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <polygon points={`${first},${zeroY} ${histPts} ${last},${zeroY}`} fill={`url(#grad-${uid})`} />
          {confidenceBand}
          <polyline points={histPts} fill="none" stroke={`url(#stroke-${uid})`} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          {showForecast && fcPts && (
            <polyline points={fcPts} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
          )}
          {interactive && allPoints.map((d, i) => (
            <circle
              key={`d${i}`}
              cx={xCenter(i)}
              cy={pad.top + yScale(d.value)}
              r={d.forecast ? 3 : 4.5}
              fill={d.forecast ? "#f59e0b" : accent}
              stroke="#fff"
              strokeWidth={2}
              className="sh-chart-dot"
              onMouseMove={(e) => onHover(e, d.label, d.value, accent, d.forecast)}
              onMouseLeave={onLeave}
            />
          ))}
        </g>
      );
    } else {
      // line
      body = (
        <g>
          {confidenceBand}
          <polyline points={histPts} fill="none" stroke={accent} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          {showForecast && fcPts && (
            <polyline points={fcPts} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
          )}
          {interactive && allPoints.map((d, i) => (
            <circle
              key={`d${i}`}
              cx={xCenter(i)}
              cy={pad.top + yScale(d.value)}
              r={d.forecast ? 3 : 4.5}
              fill={d.forecast ? "#f59e0b" : accent}
              stroke="#fff"
              strokeWidth={2}
              className="sh-chart-dot"
              onMouseMove={(e) => onHover(e, d.label, d.value, accent, d.forecast)}
              onMouseLeave={onLeave}
            />
          ))}
        </g>
      );
    }
  }

  // Annotations
  const annEls: React.ReactNode[] = [];
  if (annotations && annotations.length > 0) {
    annotations.forEach((ann, ai) => {
      const idx = allPoints.findIndex((d) => String(d.label) === String(ann.year));
      if (idx < 0) return;
      const x = xCenter(idx);
      const y = pad.top + yScale(allPoints[idx].value);
      const color = ANNOTATION_TYPE_COLORS[ann.type];
      annEls.push(
        <g key={`ann${ai}`}>
          <line x1={x} y1={pad.top} x2={x} y2={pad.top + H} stroke={color} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.5} />
          <line x1={x} y1={y - 8} x2={x} y2={y - 30} stroke={color} strokeWidth={1.5} />
          <rect x={x - 50} y={y - 46} width={100} height={18} rx={4} fill={color} opacity={0.95} />
          <text x={x} y={y - 33} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700}>
            {ann.label.length > 14 ? ann.label.slice(0, 12) + "…" : ann.label}
          </text>
        </g>
      );
    });
  }

  return (
    <g>
      {gridEls}
      {zeroLine}
      {yLabels}
      {xLabels}
      {body}
      {annEls}
    </g>
  );
}

// ── Scatter Chart ────────────────────────────────────────────────────────────

function ScatterChart({ dataset, width, height, onHover, onLeave }: Omit<StandardChartProps, "chartType" | "forecast" | "showForecast" | "annotations" | "interactive">) {
  if (!dataset.data || dataset.data.length === 0) return null;
  const pad = { top: 20, right: 20, bottom: 40, left: 52 };
  const W = Math.max(50, width - pad.left - pad.right);
  const H = Math.max(50, height - pad.top - pad.bottom);
  const vals = dataset.data.map((d) => d.value);
  const vMin = Math.min(...vals) * 0.9;
  const vMax = Math.max(...vals) * 1.1;
  const vRange = vMax - vMin || 1;
  const yScale = (v: number) => H - ((v - vMin) / vRange) * H;
  const n = dataset.data.length;
  const xStep = W / n;
  const xCenter = (i: number) => pad.left + xStep * i + xStep / 2;
  const accent = dataset.accent;

  const gridLines = 4;
  const gridEls: React.ReactNode[] = [];
  const yLabels: React.ReactNode[] = [];
  for (let i = 0; i <= gridLines; i++) {
    const v = vMin + (vRange / gridLines) * (gridLines - i);
    const y = pad.top + (H / gridLines) * i;
    gridEls.push(<line key={`g${i}`} x1={pad.left} y1={y} x2={pad.left + W} y2={y} className="sh-grid-line" />);
    const lv = Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1);
    yLabels.push(<text key={`yl${i}`} x={pad.left - 8} y={y + 4} className="sh-axis-text" textAnchor="end">{lv}</text>);
  }

  return (
    <g>
      {gridEls}
      {yLabels}
      {dataset.data.map((d, i) => {
        const x = xCenter(i);
        const y = pad.top + yScale(d.value);
        return (
          <g key={`s${i}`}>
            <circle
              cx={x}
              cy={y}
              r={7}
              fill={accent}
              opacity={0.7}
              className="sh-chart-dot"
              onMouseMove={(e) => onHover(e, d.label, d.value, accent)}
              onMouseLeave={onLeave}
            />
            <text x={x} y={pad.top + H + 22} className="sh-axis-text" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </g>
  );
}

// ── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ dataset, width, height, onHover, onLeave }: Omit<StandardChartProps, "chartType" | "forecast" | "showForecast" | "annotations" | "interactive">) {
  if (!dataset.data || dataset.data.length < 3) return null;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 50;
  const n = dataset.data.length;
  const vals = dataset.data.map((d) => d.value);
  const vMax = Math.max(...vals) * 1.1 || 1;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const accent = dataset.accent;

  // Grid circles
  const gridCircles: React.ReactNode[] = [];
  for (let i = 1; i <= 4; i++) {
    const rr = (r / 4) * i;
    gridCircles.push(<circle key={`gc${i}`} cx={cx} cy={cy} r={rr} fill="none" className="sh-grid-line" />);
  }

  // Axis lines
  const axisLines: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = angle(i);
    axisLines.push(
      <line key={`ax${i}`} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} className="sh-grid-line" />
    );
  }

  // Data polygon
  const pts = dataset.data.map((d, i) => {
    const a = angle(i);
    const rr = (d.value / vMax) * r;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");

  // Labels
  const labels = dataset.data.map((d, i) => {
    const a = angle(i);
    const lx = cx + (r + 20) * Math.cos(a);
    const ly = cy + (r + 20) * Math.sin(a);
    return (
      <text key={`rl${i}`} x={lx} y={ly} className="sh-axis-text" textAnchor="middle" dominantBaseline="middle">
        {d.label}
      </text>
    );
  });

  return (
    <g>
      {gridCircles}
      {axisLines}
      <polygon points={pts} fill={accent} fillOpacity={0.2} stroke={accent} strokeWidth={2.5} />
      {dataset.data.map((d, i) => {
        const a = angle(i);
        const rr = (d.value / vMax) * r;
        const x = cx + rr * Math.cos(a);
        const y = cy + rr * Math.sin(a);
        return (
          <circle
            key={`rd${i}`}
            cx={x}
            cy={y}
            r={5}
            fill={accent}
            stroke="#fff"
            strokeWidth={2}
            className="sh-chart-dot"
            onMouseMove={(e) => onHover(e, d.label, d.value, accent)}
            onMouseLeave={onLeave}
          />
        );
      })}
      {labels}
    </g>
  );
}

// ── Choropleth Chart (simplified world map grid) ─────────────────────────────

function ChoroplethChart({ dataset, width, height, onHover, onLeave }: Omit<StandardChartProps, "chartType" | "forecast" | "showForecast" | "annotations" | "interactive">) {
  // Simplified choropleth: represent data as a grid of cells with heat coloring
  if (!dataset.data || dataset.data.length === 0) return null;
  const vals = dataset.data.map((d) => d.value);
  const vMin = Math.min(...vals);
  const vMax = Math.max(...vals);
  const vRange = vMax - vMin || 1;
  const accent = dataset.accent;

  const cols = Math.min(8, dataset.data.length);
  const rows = Math.ceil(dataset.data.length / cols);
  const pad = { top: 20, right: 20, bottom: 50, left: 20 };
  const cellW = (width - pad.left - pad.right) / cols;
  const cellH = Math.min(60, (height - pad.top - pad.bottom) / rows);

  return (
    <g>
      {dataset.data.map((d, i) => {
        const t = (d.value - vMin) / vRange;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = pad.left + col * cellW;
        const y = pad.top + row * cellH;
        return (
          <g key={`ch${i}`}>
            <rect
              x={x + 2}
              y={y + 2}
              width={cellW - 4}
              height={cellH - 4}
              rx={6}
              fill={heatColor(t)}
              opacity={0.85 + t * 0.15}
              onMouseMove={(e) => onHover(e, d.label, d.value, accent)}
              onMouseLeave={onLeave}
              className="sh-chart-cell"
            />
            <text x={x + cellW / 2} y={y + cellH / 2 - 4} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={700}>
              {d.label}
            </text>
            <text x={x + cellW / 2} y={y + cellH / 2 + 10} textAnchor="middle" fontSize={10} fill="#fff" opacity={0.85}>
              {d.value}{dataset.unit}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <g>
        <text x={pad.left} y={height - 20} className="sh-axis-text">Low ({vMin}{dataset.unit})</text>
        <rect x={pad.left + 80} y={height - 30} width={120} height={12} rx={6} fill={heatColor(0.5)} />
        <rect x={pad.left + 80} y={height - 30} width={60} height={12} rx={6} fill={heatColor(0.2)} opacity={0.7} />
        <text x={pad.left + 210} y={height - 20} className="sh-axis-text">High ({vMax}{dataset.unit})</text>
      </g>
    </g>
  );
}

// ── Stacked Bar Chart (uses dataset.data as single series; generates sub-series from tags for demo) ──

function StackedBarChart({ dataset, width, height, onHover, onLeave }: Omit<StandardChartProps, "chartType" | "forecast" | "showForecast" | "annotations" | "interactive">) {
  if (!dataset.data || dataset.data.length === 0) return null;
  // Generate 3 sub-series from the main data (demonstration: split into components)
  const subSeries = [
    { name: "Primary", color: dataset.accent, factor: 0.55 },
    { name: "Secondary", color: "#a855f7", factor: 0.30 },
    { name: "Tertiary", color: "#f97316", factor: 0.15 },
  ];

  const pad = { top: 20, right: 20, bottom: 40, left: 52 };
  const W = Math.max(50, width - pad.left - pad.right);
  const H = Math.max(50, height - pad.top - pad.bottom);
  const totals = dataset.data.map((d) => d.value * (d.value < 0 ? 1 : 1));
  const vMax = Math.max(...totals) * 1.1 || 1;
  const yScale = (v: number) => H - (v / vMax) * H;
  const n = dataset.data.length;
  const xStep = W / n;
  const xCenter = (i: number) => pad.left + xStep * i + xStep / 2;
  const bw = Math.max(4, xStep * 0.6);

  const gridLines = 4;
  const gridEls: React.ReactNode[] = [];
  const yLabels: React.ReactNode[] = [];
  for (let i = 0; i <= gridLines; i++) {
    const v = (vMax / gridLines) * (gridLines - i);
    const y = pad.top + (H / gridLines) * i;
    gridEls.push(<line key={`g${i}`} x1={pad.left} y1={y} x2={pad.left + W} y2={y} className="sh-grid-line" />);
    const lv = Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1);
    yLabels.push(<text key={`yl${i}`} x={pad.left - 8} y={y + 4} className="sh-axis-text" textAnchor="end">{lv}</text>);
  }

  return (
    <g>
      {gridEls}
      {yLabels}
      {dataset.data.map((d, i) => {
        const x = xCenter(i) - bw / 2;
        let cumulative = 0;
        const segments = subSeries.map((ss, si) => {
          const segVal = d.value * ss.factor;
          const segY = pad.top + yScale(cumulative + segVal);
          const segH = yScale(cumulative) - yScale(cumulative + segVal);
          const el = (
            <rect
              key={`sb${i}-${si}`}
              x={x}
              y={segY}
              width={bw}
              height={Math.max(0, segH)}
              fill={ss.color}
              opacity={0.88}
              rx={si === subSeries.length - 1 ? 4 : 0}
              onMouseMove={(e) => onHover(e, `${d.label} · ${ss.name}`, segVal, ss.color)}
              onMouseLeave={onLeave}
            />
          );
          cumulative += segVal;
          return el;
        });
        return (
          <g key={`sbg${i}`}>
            {segments}
            <text x={xCenter(i)} y={pad.top + H + 22} className="sh-axis-text" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </g>
  );
}
