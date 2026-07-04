import React from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const tooltip = {
  backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
  color: '#0F172A', fontFamily: 'Inter, sans-serif', fontSize: 13,
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
};

export function WeightChart({ data, goalWeight }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip contentStyle={tooltip} />
        {goalWeight && <ReferenceLine y={goalWeight} stroke="#22C55E" strokeDasharray="5 3" label={{ value: 'Goal', fill: '#22C55E', fontSize: 11 }} />}
        <Area type="monotone" dataKey="weight" stroke="#2563EB" strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill: '#2563EB', r: 3 }} name="Weight (kg)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CalorieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltip} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="calories" fill="#2563EB" radius={[4, 4, 0, 0]} name="Calories" />
        <Bar dataKey="target" fill="#BFDBFE" radius={[4, 4, 0, 0]} name="Target" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProteinChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltip} />
        <Area type="monotone" dataKey="protein" stroke="#22C55E" strokeWidth={2.5} fill="url(#pGrad)" dot={{ fill: '#22C55E', r: 3 }} name="Protein (g)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComplianceChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={tooltip} formatter={(v) => [`${v?.toFixed(1)}%`, 'Compliance']} />
        <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="5 3" label={{ value: '70%', fill: '#F59E0B', fontSize: 11 }} />
        <Line type="monotone" dataKey="compliance" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 3 }} name="Compliance %" />
      </LineChart>
    </ResponsiveContainer>
  );
}
