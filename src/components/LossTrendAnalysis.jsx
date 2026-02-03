import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';

const LossTrendAnalysis = ({ trendData }) => {
    return (
        <div className="loss-trend-analysis animate-fade-in">
            <div className="chart-card">
                <div className="chart-header">
                    <h4>满期赔付率趋势分析 (按月)</h4>
                    <p>基于每月满期保费与出险赔付金额的动态趋势</p>
                </div>
                <div style={{ height: 400, marginTop: '2rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData}>
                            <defs>
                                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(val) => `${val}%`}
                                label={{ value: '赔付率', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(val) => `¥${(val / 10000).toFixed(0)}万`}
                                label={{ value: '签单保费', angle: 90, position: 'insideRight', style: { fill: '#94a3b8' } }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'fullTermLossRatio') return [`${value.toFixed(2)}%`, '满期赔付率'];
                                    if (name === 'quarterlyLossRatio') return [`${value.toFixed(2)}%`, '季度赔付率'];
                                    if (name === 'writtenPremium') return [`¥${value.toLocaleString()}`, '签单保费'];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="fullTermLossRatio"
                                name="满期赔付率"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorLoss)"
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="writtenPremium"
                                name="签单保费"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 5 }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="quarterlyLossRatio"
                                name="季度赔付率"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                connectNulls={true}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="trend-stats">
                <div className="trend-stat-card">
                    <label>月均满期赔付率</label>
                    <span>{(trendData.reduce((acc, curr) => acc + curr.fullTermLossRatio, 0) / (trendData.length || 1)).toFixed(1)}%</span>
                </div>
                <div className="trend-stat-card">
                    <label>峰值月份</label>
                    <span style={{ color: '#ef4444' }}>
                        {trendData.length > 0 ? trendData.reduce((prev, curr) => prev.fullTermLossRatio > curr.fullTermLossRatio ? prev : curr).month : '-'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LossTrendAnalysis;
