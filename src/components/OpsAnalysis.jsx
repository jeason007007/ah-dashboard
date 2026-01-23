import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';

const OpsAnalysis = ({ mergedData }) => {
    // 处理运营数据
    const opsData = useMemo(() => {
        let totalReportLag = 0;
        let totalCloseLag = 0;
        let claimCount = 0;
        let fastClaims = 0; // 3天内结案的案件

        const lagBuckets = {
            '0-2天': 0,
            '3-7天': 0,
            '8-14天': 0,
            '15天以上': 0
        };

        const monthlyTrend = {};

        mergedData.forEach(policy => {
            policy.claims.forEach(claim => {
                const accidentDate = new Date(claim['出险日期']);
                const reportDate = new Date(claim['报案日期']);
                const closeDate = new Date(claim['结案日期']);

                if (!isNaN(accidentDate) && !isNaN(reportDate)) {
                    // 报案时效 (Report Lag)
                    const rLag = Math.max(0, Math.floor((reportDate - accidentDate) / (1000 * 60 * 60 * 24)));
                    totalReportLag += rLag;

                    // 分布统计
                    if (rLag <= 2) lagBuckets['0-2天']++;
                    else if (rLag <= 7) lagBuckets['3-7天']++;
                    else if (rLag <= 14) lagBuckets['8-14天']++;
                    else lagBuckets['15天以上']++;
                }

                if (!isNaN(reportDate) && !isNaN(closeDate)) {
                    // 结案周期 (Closing Cycle)
                    const cLag = Math.max(0, Math.floor((closeDate - reportDate) / (1000 * 60 * 60 * 24)));
                    totalCloseLag += cLag;
                    claimCount++;

                    if (cLag <= 3) fastClaims++;

                    // 趋势分析 (按结案月份)
                    const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyTrend[monthKey]) {
                        monthlyTrend[monthKey] = { month: monthKey, totalDays: 0, count: 0 };
                    }
                    monthlyTrend[monthKey].totalDays += cLag;
                    monthlyTrend[monthKey].count++;
                }
            });
        });

        const avgReportLag = claimCount > 0 ? (totalReportLag / claimCount).toFixed(1) : 0;
        const avgCloseCycle = claimCount > 0 ? (totalCloseLag / claimCount).toFixed(1) : 0;
        const autoPayRate = claimCount > 0 ? ((fastClaims / claimCount) * 100).toFixed(1) : 0;

        // 格式化图表数据
        const distributionData = Object.keys(lagBuckets).map(key => ({
            name: key,
            count: lagBuckets[key]
        }));

        const trendData = Object.values(monthlyTrend)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(item => ({
                month: item.month,
                avgCycle: (item.totalDays / item.count).toFixed(1)
            }));

        return {
            avgReportLag,
            avgCloseCycle,
            autoPayRate,
            distributionData,
            trendData,
            totalClaims: claimCount
        };
    }, [mergedData]);

    if (!opsData.totalClaims) {
        // Debug info: Check what keys are present in the first claim
        const firstClaim = mergedData?.[0]?.claims?.[0];
        const debugKeys = firstClaim ? Object.keys(firstClaim).join(', ') : 'No claims found';

        return (
            <div className="empty-state">
                <AlertTriangle size={48} color="#cbd5e1" />
                <p>暂无理赔运营数据。未能解析出"报案日期"或"结案日期"。</p>
                <div style={{ marginTop: '20px', padding: '10px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b' }}>
                    <p><strong>调试信息 (第一条理赔数据字段):</strong></p>
                    <code>{debugKeys}</code>
                    <p style={{ marginTop: '5px' }}>请确认上传的理赔 Excel 包含：<code>报案日期</code>、<code>结案日期</code></p>
                </div>
            </div>
        );
    }

    return (
        <div className="ops-analysis-container animate-fade-in">
            {/* KPI Cards */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <Clock className="icon blue" />
                        <span>平均报案时效</span>
                    </div>
                    <div className="metric-value">{opsData.avgReportLag} <span className="unit">天</span></div>
                    <div className="metric-sub">出险至报案平均天数</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <CheckCircle2 className="icon green" />
                        <span>平均结案周期</span>
                    </div>
                    <div className="metric-value">{opsData.avgCloseCycle} <span className="unit">天</span></div>
                    <div className="metric-sub">报案至结案平均天数</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <TrendingUp className="icon purple" />
                        <span>3日结案率</span>
                    </div>
                    <div className="metric-value">{opsData.autoPayRate}%</div>
                    <div className="metric-sub">报案后3天内完成赔付的案件占比</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card">
                    <h3>报案时效分布</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={opsData.distributionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => [value + ' 件', '案件数量']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="案件数量" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>结案效率趋势 (月度平均天数)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={opsData.trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => [value + ' 天', '平均结案周期']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="avgCycle"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                    name="平均结案天数"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpsAnalysis;
