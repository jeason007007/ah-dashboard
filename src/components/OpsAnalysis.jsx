import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { Clock, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

const OpsAnalysis = ({ mergedData, selectedYear }) => {
    // 处理运营数据
    const opsData = useMemo(() => {
        let totalReportLag = 0;
        let totalRegLag = 0; // 立案时效
        let totalCloseLag = 0; // 结案时效 (立案->结案)
        let claimCount = 0;
        let fastClaims = 0; // 3天内全流程结案 (用于保留原KPI但可能定义需调整，暂保持 报案->结案 3天)

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
                const reportDate = new Date(claim['报案时间'] || claim['报案日期']);
                const regDate = new Date(claim['立案时间'] || claim['立案日期']);
                const closeDate = new Date(claim['结案日期'] || claim['结案时间']);

                // 核心三个时间点必须存在才能进行完整分析
                // 如果缺少立案时间，暂时用报案时间替代，或者忽略该环节
                if (!isNaN(accidentDate) && !isNaN(reportDate)) {
                    // 1. 报案时效 (Incident -> Report)
                    const rLag = Math.max(0, Math.floor((reportDate - accidentDate) / (1000 * 60 * 60 * 24)));
                    totalReportLag += rLag;

                    // 分布统计 (基于报案时效)
                    if (rLag <= 2) lagBuckets['0-2天']++;
                    else if (rLag <= 7) lagBuckets['3-7天']++;
                    else if (rLag <= 14) lagBuckets['8-14天']++;
                    else lagBuckets['15天以上']++;
                }

                if (!isNaN(reportDate) && !isNaN(closeDate)) {
                    claimCount++;

                    // 2. 立案时效 (Report -> Registration)
                    // 如果立案时间缺失，默认0天 (即报案即立案)
                    let regLag = 0;
                    let validRegDate = reportDate;
                    if (!isNaN(regDate)) {
                        regLag = Math.max(0, Math.floor((regDate - reportDate) / (1000 * 60 * 60 * 24)));
                        validRegDate = regDate;
                    }
                    totalRegLag += regLag;

                    // 3. 结案时效 (Registration -> Closing)
                    const cLag = Math.max(0, Math.floor((closeDate - validRegDate) / (1000 * 60 * 60 * 24)));
                    totalCloseLag += cLag;

                    // 3日结案率 (维持原定义：报案后3天内)
                    const totalProcessLag = Math.max(0, Math.floor((closeDate - reportDate) / (1000 * 60 * 60 * 24)));
                    if (totalProcessLag <= 3) fastClaims++;

                    // 趋势分析 (按结案月份)
                    const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyTrend[monthKey]) {
                        monthlyTrend[monthKey] = {
                            month: monthKey,
                            reportLagSum: 0,
                            regLagSum: 0,
                            closeLagSum: 0,
                            count: 0
                        };
                    }
                    // Trend charts allow accumulating lags for the month
                    // However, report lag is accident->report, usually we track trend based on Closing Date for "Efficiency Trend"
                    // But technically "Report Lag" attributes to the accident/report month.
                    // For simplicity, we view all lags for claims CLOSED in a given month.
                    monthlyTrend[monthKey].reportLagSum += (!isNaN(accidentDate) && !isNaN(reportDate)) ?
                        Math.max(0, Math.floor((reportDate - accidentDate) / (1000 * 60 * 60 * 24))) : 0;
                    monthlyTrend[monthKey].regLagSum += regLag;
                    monthlyTrend[monthKey].closeLagSum += cLag;
                    monthlyTrend[monthKey].count++;
                }
            });
        });

        const avgReportLag = claimCount > 0 ? (totalReportLag / claimCount).toFixed(1) : 0;
        const avgRegLag = claimCount > 0 ? (totalRegLag / claimCount).toFixed(1) : 0;
        const avgCloseLag = claimCount > 0 ? (totalCloseLag / claimCount).toFixed(1) : 0;
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
                avgReportLag: (item.reportLagSum / item.count).toFixed(1),
                avgRegLag: (item.regLagSum / item.count).toFixed(1),
                avgCloseLag: (item.closeLagSum / item.count).toFixed(1)
            }));

        return {
            avgReportLag,
            avgRegLag,
            avgCloseLag,
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
                <p>暂无理赔运营数据。未能解析出"报案时间"、"立案时间"或"结案日期"。</p>
                <div style={{ marginTop: '20px', padding: '10px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b' }}>
                    <p><strong>调试信息 (第一条理赔数据字段):</strong></p>
                    <code>{debugKeys}</code>
                    <p style={{ marginTop: '5px' }}>请确认上传的理赔 Excel 包含：<code>报案时间</code>、<code>立案时间</code>、<code>结案日期</code></p>
                </div>
            </div>
        );
    }

    return (
        <div className="ops-analysis-container animate-fade-in">
            <div className="analysis-header">
                <h3>运营时效分析 ({selectedYear === 'all' ? '累计' : `${selectedYear}年度`})</h3>
                <p>全流程时效监控：出险 → 报案 → 立案 → 结案</p>
            </div>
            {/* KPI Cards */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-icon-box blue">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="metric-body">
                        <span className="metric-label">平均报案时效</span>
                        <div className="metric-value-container">
                            <span className="metric-value">{opsData.avgReportLag}</span>
                            <span className="metric-unit">天</span>
                        </div>
                    </div>
                    <div className="metric-sub" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>出险 → 报案</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-icon-box purple">
                            <FileText size={24} />
                        </div>
                    </div>
                    <div className="metric-body">
                        <span className="metric-label">平均立案时效</span>
                        <div className="metric-value-container">
                            <span className="metric-value">{opsData.avgRegLag}</span>
                            <span className="metric-unit">天</span>
                        </div>
                    </div>
                    <div className="metric-sub" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>报案 → 立案</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-icon-box green">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                    <div className="metric-body">
                        <span className="metric-label">平均结案时效</span>
                        <div className="metric-value-container">
                            <span className="metric-value">{opsData.avgCloseLag}</span>
                            <span className="metric-unit">天</span>
                        </div>
                    </div>
                    <div className="metric-sub" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>立案 → 结案</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-icon-box orange">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="metric-body">
                        <span className="metric-label">3日结案率</span>
                        <div className="metric-value-container">
                            <span className="metric-value">{opsData.autoPayRate}</span>
                            <span className="metric-unit">%</span>
                        </div>
                    </div>
                    <div className="metric-sub" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>报案后3天内赔付</div>
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
                    <h3>全流程时效趋势 (仅展示结案时效)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={opsData.trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="avgCloseLag"
                                    name="结案时效 (立案-结案)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgRegLag"
                                    name="立案时效 (报案-立案)"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
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
