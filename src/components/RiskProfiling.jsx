import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, Cell
} from 'recharts';
import { AlertTriangle, Building2, FileText } from 'lucide-react';

const RiskProfiling = ({ mergedData }) => {
    // 展开全部高风险单位列表的状态
    const [showAllHighRisk, setShowAllHighRisk] = useState(false);
    // 展开全部黄色预警单位列表的状态
    const [showAllMediumRisk, setShowAllMediumRisk] = useState(false);

    // 0. 集团维度分析 (Group Business Analysis) - 新增
    const groupAnalysis = useMemo(() => {
        const map = {};
        mergedData.forEach(p => {
            // 尝试读取集团业务标识，如果没有则使用投保单位名称
            const group = p['集团业务标识'] || p['业务线'] || p['投保单位名称'] || '未知集团';
            if (!map[group]) map[group] = { name: group, premium: 0, claims: 0, companies: new Set() };

            map[group].premium += parseFloat(p['保费']) || 0;
            map[group].claims += p.totalClaimAmount || 0;
            map[group].companies.add(p['投保单位名称'] || '未知');
        });

        const list = Object.values(map).map(item => ({
            ...item,
            companyCount: item.companies.size,
            lossRatio: item.premium > 0 ? (item.claims / item.premium) * 100 : 0
        }));

        // 按赔付率降序排列
        return list.sort((a, b) => b.lossRatio - a.lossRatio);
    }, [mergedData]);

    // 1. 公司维度分析 (Company Risk)
    const companyAnalysis = useMemo(() => {
        const map = {};
        mergedData.forEach(p => {
            const company = p['投保单位名称'] || p['分公司'] || '未知机构'; // Updated from 投保单位
            if (!map[company]) map[company] = { name: company, premium: 0, claims: 0 };

            map[company].premium += parseFloat(p['保费']) || 0;
            map[company].claims += p.totalClaimAmount || 0;
        });

        const list = Object.values(map).map(item => ({
            ...item,
            lossRatio: item.premium > 0 ? (item.claims / item.premium) * 100 : 0
        }));

        // 按赔付率降序排列用于图表
        return list.sort((a, b) => b.lossRatio - a.lossRatio);
    }, [mergedData]);

    // 2. 方案维度分析 (Plan Risk)
    const planAnalysis = useMemo(() => {
        const map = {};
        mergedData.forEach(p => {
            const plan = p['方案名称'] || '默认方案'; // Updated from 投保方案
            if (!map[plan]) map[plan] = { name: plan, premium: 0, claims: 0 };

            map[plan].premium += parseFloat(p['保费']) || 0;
            map[plan].claims += p.totalClaimAmount || 0;
        });

        return Object.values(map)
            .map(item => ({
                ...item,
                lossRatio: item.premium > 0 ? (item.claims / item.premium) * 100 : 0
            }))
            .sort((a, b) => b.lossRatio - a.lossRatio);
    }, [mergedData]);

    // 3. 高赔付预警列表 (赔付率 > 99%，排除极端异常值 > 200%)
    const highRiskCompanies = useMemo(() => {
        return companyAnalysis.filter(c => c.lossRatio > 99 && c.lossRatio <= 200);
    }, [companyAnalysis]);

    // 3.1 集团高风险预警列表 (赔付率 > 70%，排除极端异常值 > 200%)
    const highRiskGroups = useMemo(() => {
        return groupAnalysis.filter(g => g.lossRatio > 70 && g.lossRatio <= 200);
    }, [groupAnalysis]);

    // 3.2 中等风险预警列表 (70% <= 赔付率 <= 99%)
    const mediumRiskCompanies = useMemo(() => {
        return companyAnalysis.filter(c => c.lossRatio >= 70 && c.lossRatio <= 99);
    }, [companyAnalysis]);

    // 4. 疾病谱分析 (保留)
    const diseaseSpectrum = useMemo(() => {
        const counts = {};
        mergedData.forEach(p => {
            p.claims.forEach(c => {
                const d = c['疾病诊断'] || '未知';
                counts[d] = (counts[d] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [mergedData]);

    // 5. 调试逻辑：如果只有"未知机构"，说明字段解析失败
    const isParseFailed = companyAnalysis.length === 1 && companyAnalysis[0].name === '未知机构';
    const debugInfo = isParseFailed && mergedData.length > 0 ? Object.keys(mergedData[0]).join(', ') : '';

    // 自定义Tooltip组件，用于显示超过200%的赔付率
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const lossRatioData = payload.find(p => p.name === '简单赔付率');
            const premiumData = payload.find(p => p.name === '签单保费');
            const lossRatio = lossRatioData?.value || 0;
            const isOverflow = lossRatio > 200;

            return (
                <div style={{
                    background: 'white',
                    border: isOverflow ? '2px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '200px'
                }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1f2937' }}>{label}</p>
                    {premiumData && (
                        <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '13px' }}>
                            签单保费: <span style={{ color: '#3b82f6', fontWeight: '600' }}>¥{premiumData.value.toLocaleString()}</span>
                        </p>
                    )}
                    {lossRatioData && (
                        <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '13px' }}>
                            简单赔付率:
                            <span style={{
                                color: isOverflow ? '#ef4444' : '#ef4444',
                                fontWeight: '600',
                                fontSize: isOverflow ? '15px' : '14px'
                            }}>
                                {lossRatio.toFixed(1)}%
                            </span>
                            {isOverflow && <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '4px' }}>⚠️ 超出图表范围</span>}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="risk-profiling animate-fade-in">
            {/* 调试/错误提示 */}
            {isParseFailed && (
                <div className="alert-banner error" style={{ marginBottom: '1.5rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <AlertTriangle size={24} />
                        <strong>字段解析失败：</strong> 未能找到 "投保单位名称" 字段。
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                        <p>当前第一条数据的包含以下字段：</p>
                        <code style={{ background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '4px', wordBreak: 'break-all' }}>
                            {debugInfo}
                        </code>
                        <p style={{ marginTop: '0.5rem' }}>请检查 Excel 表头是否包含 <code>投保单位名称</code>。</p>
                    </div>
                </div>
            )}

            {/* 高风险预警横幅 (集团+公司双维度) */}
            {!isParseFailed && (highRiskGroups.length > 0 || highRiskCompanies.length > 0 || mediumRiskCompanies.length > 0) && (
                <div className="alert-banner error" style={{ marginBottom: '1.5rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <AlertTriangle size={24} />
                        <strong>⚠️ 亏损预警：</strong>
                    </div>
                    <div>
                        {highRiskGroups.length > 0 && <span>发现 <strong>{highRiskGroups.length}</strong> 个集团业务线简单赔付率超过 70%，需要重点关注。</span>}
                        {highRiskGroups.length > 0 && (highRiskCompanies.length > 0 || mediumRiskCompanies.length > 0) && <span> </span>}
                        {highRiskCompanies.length > 0 && <span>发现 <strong>{highRiskCompanies.length}</strong> 家投保单位简单赔付率超过 99%。</span>}
                        {highRiskCompanies.length > 0 && mediumRiskCompanies.length > 0 && <span> </span>}
                        {mediumRiskCompanies.length > 0 && <span>发现 <strong>{mediumRiskCompanies.length}</strong> 家投保单位简单赔付率在 70%-99% 之间，需要关注。</span>}
                        <span>请重点关注下方的预警列表。</span>
                    </div>
                </div>
            )}

            <div className="risk-grid-new">
                {/* ========== 图表展示区域 ========== */}

                {/* 集团维度分析图表 */}
                <div className="chart-card full-width">
                    <div className="card-header-row">
                        <Building2 size={20} className="text-blue-500" />
                        <h4>集团业务线经营分析 (赔付率 vs 保费)</h4>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                            *Y轴锁定200%，超出部分用特殊标记
                        </span>
                    </div>
                    <div style={{ height: 350, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={groupAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" label={{ value: '保费规模 (元)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 200]} label={{ value: '简单赔付率 (%)', angle: 90, position: 'insideRight' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="premium" name="签单保费" fill="#cbd5e1" barSize={40} radius={[4, 4, 0, 0]} />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="lossRatio"
                                    name="简单赔付率"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#ef4444' }}
                                />
                                {/* 为超过200%的数据点添加特殊标记 */}
                                {groupAnalysis.map((entry, index) => {
                                    if (entry.lossRatio > 200) {
                                        return (
                                            <text
                                                key={`overflow-${index}`}
                                                x={index * (600 / groupAnalysis.length) + 30}
                                                y={50}
                                                fill="#ef4444"
                                                fontSize={12}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                            >
                                                ⚠️ {entry.lossRatio.toFixed(0)}%
                                            </text>
                                        );
                                    }
                                    return null;
                                })}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 投保单位维度分析图表 */}
                <div className="chart-card full-width">
                    <div className="card-header-row">
                        <Building2 size={20} className="text-purple-500" />
                        <h4>各投保单位经营分析 (赔付率 vs 保费)</h4>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                            *Y轴锁定200%，超出部分用特殊标记
                        </span>
                    </div>
                    <div style={{ height: 350, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={companyAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" label={{ value: '保费规模 (元)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 200]} label={{ value: '简单赔付率 (%)', angle: 90, position: 'insideRight' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="premium" name="签单保费" fill="#cbd5e1" barSize={40} radius={[4, 4, 0, 0]} />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="lossRatio"
                                    name="简单赔付率"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#ef4444' }}
                                />
                                {/* 为超过200%的数据点添加特殊标记 */}
                                {companyAnalysis.map((entry, index) => {
                                    if (entry.lossRatio > 200) {
                                        return (
                                            <text
                                                key={`overflow-${index}`}
                                                x={index * (800 / companyAnalysis.length) + 30}
                                                y={50}
                                                fill="#ef4444"
                                                fontSize={12}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                            >
                                                ⚠️ {entry.lossRatio.toFixed(0)}%
                                            </text>
                                        );
                                    }
                                    return null;
                                })}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 投保方案分析 */}
                <div className="chart-card">
                    <div className="card-header-row">
                        <FileText size={20} className="text-purple-500" />
                        <h4>分方案赔付表现</h4>
                    </div>
                    <div style={{ height: 300, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planAnalysis} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" domain={[0, 'auto']} hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
                                <Bar dataKey="lossRatio" name="赔付率" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                    {
                                        planAnalysis.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.lossRatio > 80 ? '#ef4444' : '#8b5cf6'} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 疾病谱 */}
                <div className="chart-card">
                    <h4>高频疾病 Top 10</h4>
                    <div style={{ height: 300, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseSpectrum} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" name="理赔件数" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ========== 高风险列表区域 ========== */}

                {/* 集团高风险列表 */}
                <div className="chart-card full-width" style={{
                    border: highRiskGroups.length > 0 ? '2px solid #ef4444' : '1px solid #e5e7eb',
                    background: highRiskGroups.length > 0 ? '#fef2f2' : 'white'
                }}>
                    <div className="card-header-row">
                        <AlertTriangle size={20} className={highRiskGroups.length > 0 ? "text-red-500" : "text-gray-400"} />
                        <h4>集团业务线重点关注列表 (简单赔付率 &gt; 70%)</h4>
                        <span className="badge" style={{
                            background: highRiskGroups.length > 0 ? '#ef4444' : '#9ca3af',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                        }}>
                            重点关注
                        </span>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>集团业务线</th>
                                    <th className="text-right">下属单位数</th>
                                    <th className="text-right">签单保费</th>
                                    <th className="text-right">总赔款</th>
                                    <th className="text-right">简单赔付率</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {highRiskGroups.length > 0 ? (
                                    highRiskGroups.map((g, idx) => (
                                        <tr key={idx} style={{ background: idx === 0 ? '#fee2e2' : 'transparent' }}>
                                            <td className="font-medium">{g.name}</td>
                                            <td className="text-right">{g.companyCount} 家</td>
                                            <td className="text-right">¥{g.premium.toLocaleString()}</td>
                                            <td className="text-right">¥{g.claims.toLocaleString()}</td>
                                            <td className="text-right font-bold" style={{ color: g.lossRatio > 200 ? '#dc2626' : '#ef4444', fontSize: g.lossRatio > 200 ? '16px' : '14px' }}>
                                                {g.lossRatio.toFixed(1)}%
                                                {g.lossRatio > 200 && <span style={{ fontSize: '12px', marginLeft: '4px' }}>⚠️</span>}
                                            </td>
                                            <td><span className="badge error">重点关注</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-gray-400 py-4">
                                            暂无需要重点关注的集团业务线，经营状况良好。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 投保单位高风险列表 */}
                <div className="chart-card full-width" style={{
                    border: highRiskCompanies.length > 0 ? '2px solid #f97316' : '1px solid #e5e7eb',
                    background: highRiskCompanies.length > 0 ? '#fff7ed' : 'white'
                }}>
                    <div className="card-header-row">
                        <AlertTriangle size={20} className={highRiskCompanies.length > 0 ? "text-orange-500" : "text-gray-400"} />
                        <h4>投保单位高风险列表 (简单赔付率 &gt; 99%)</h4>
                        <span className="badge" style={{
                            background: highRiskCompanies.length > 0 ? '#f97316' : '#9ca3af',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                        }}>
                            {highRiskCompanies.length} 个高风险单位
                        </span>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>投保单位</th>
                                    <th className="text-right">签单保费</th>
                                    <th className="text-right">总赔款</th>
                                    <th className="text-right">简单赔付率</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {highRiskCompanies.length > 0 ? (
                                    (showAllHighRisk ? highRiskCompanies : highRiskCompanies.slice(0, 10)).map((c, idx) => (
                                        <tr key={idx} style={{ background: idx < 3 ? '#ffedd5' : 'transparent' }}>
                                            <td className="font-medium">{c.name}</td>
                                            <td className="text-right">¥{c.premium.toLocaleString()}</td>
                                            <td className="text-right">¥{c.claims.toLocaleString()}</td>
                                            <td className="text-right font-bold" style={{ color: c.lossRatio > 200 ? '#dc2626' : '#f97316', fontSize: c.lossRatio > 200 ? '16px' : '14px' }}>
                                                {c.lossRatio.toFixed(1)}%
                                                {c.lossRatio > 200 && <span style={{ fontSize: '12px', marginLeft: '4px' }}>⚠️</span>}
                                            </td>
                                            <td><span className="badge" style={{ background: c.lossRatio > 200 ? '#dc2626' : '#f97316', color: 'white' }}>
                                                {c.lossRatio > 200 ? '严重亏损' : '亏损'}
                                            </span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-gray-400 py-4">
                                            暂无赔付率超 99% 的单位，经营状况良好。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {highRiskCompanies.length > 10 && (
                            <div style={{ padding: '16px', textAlign: 'center' }}>
                                <button
                                    onClick={() => setShowAllHighRisk(!showAllHighRisk)}
                                    style={{
                                        background: showAllHighRisk ? '#f97316' : 'white',
                                        color: showAllHighRisk ? 'white' : '#f97316',
                                        border: '2px solid #f97316',
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {showAllHighRisk ? (
                                        <>
                                            <span>▲</span>
                                            <span>收起列表</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>▼</span>
                                            <span>展开全部 {highRiskCompanies.length} 个高风险单位</span>
                                        </>
                                    )}
                                </button>
                                {!showAllHighRisk && (
                                    <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                                        当前仅显示前 10 个，点击按钮查看全部
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 黄色预警关注单位列表 (70% <= 赔付率 <= 99%) */}
                <div className="chart-card full-width" style={{
                    border: mediumRiskCompanies.length > 0 ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    background: mediumRiskCompanies.length > 0 ? '#fffbeb' : 'white'
                }}>
                    <div className="card-header-row">
                        <AlertTriangle size={20} className={mediumRiskCompanies.length > 0 ? "text-yellow-500" : "text-gray-400"} />
                        <h4>投保单位黄色预警列表 (70% &le; 简单赔付率 &le; 99%)</h4>
                        <span className="badge" style={{
                            background: mediumRiskCompanies.length > 0 ? '#f59e0b' : '#9ca3af',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                        }}>
                            {mediumRiskCompanies.length} 个预警单位
                        </span>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>投保单位</th>
                                    <th className="text-right">签单保费</th>
                                    <th className="text-right">总赔款</th>
                                    <th className="text-right">简单赔付率</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mediumRiskCompanies.length > 0 ? (
                                    (showAllMediumRisk ? mediumRiskCompanies : mediumRiskCompanies.slice(0, 10)).map((c, idx) => (
                                        <tr key={idx}>
                                            <td className="font-medium">{c.name}</td>
                                            <td className="text-right">¥{c.premium.toLocaleString()}</td>
                                            <td className="text-right">¥{c.claims.toLocaleString()}</td>
                                            <td className="text-right font-bold" style={{ color: '#f59e0b', fontSize: '14px' }}>
                                                {c.lossRatio.toFixed(1)}%
                                            </td>
                                            <td><span className="badge" style={{ background: '#f59e0b', color: 'white' }}>
                                                需要关注
                                            </span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-gray-400 py-4">
                                            暂无赔付率在 70%-99% 区间的单位，经营状况良好。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {mediumRiskCompanies.length > 10 && (
                            <div style={{ padding: '16px', textAlign: 'center' }}>
                                <button
                                    onClick={() => setShowAllMediumRisk(!showAllMediumRisk)}
                                    style={{
                                        background: showAllMediumRisk ? '#f59e0b' : 'white',
                                        color: showAllMediumRisk ? 'white' : '#f59e0b',
                                        border: '2px solid #f59e0b',
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {showAllMediumRisk ? (
                                        <>
                                            <span>▲</span>
                                            <span>收起列表</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>▼</span>
                                            <span>展开全部 {mediumRiskCompanies.length} 个预警单位</span>
                                        </>
                                    )}
                                </button>
                                {!showAllMediumRisk && (
                                    <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                                        当前仅显示前 10 个，点击按钮查看全部
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default RiskProfiling;
