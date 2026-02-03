import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { AlertTriangle, Building2, FileText, Activity, Users } from 'lucide-react';

import { calculateEarnedPremium } from '../utils/dataProcessor';

const RiskProfiling = ({ mergedData, selectedYear }) => {
    const [showAllHighRisk, setShowAllHighRisk] = useState(false);
    const [showAllMediumRisk, setShowAllMediumRisk] = useState(false);

    const normalizeGender = (g) => {
        if (!g) return '未知';
        const s = String(g).trim();
        if (s === '男' || s === '男性' || s === 'M') return '男';
        if (s === '女' || s === '女性' || s === 'F') return '女';
        return '未知';
    };

    const groupAnalysis = useMemo(() => {
        const map = {};
        const analysisDate = selectedYear === 'all' ? new Date() : new Date(selectedYear, 11, 31);
        mergedData.forEach(p => {
            const group = p['集团业务标识'] || p['业务线'] || p['投保单位名称'] || '未知集团';
            if (!map[group]) map[group] = { name: group, premium: 0, earnedPremium: 0, claims: 0, companies: new Set() };
            map[group].premium += parseFloat(p['保费']) || 0;
            map[group].earnedPremium += calculateEarnedPremium(p, analysisDate);
            map[group].claims += p.totalClaimAmount || 0;
            map[group].companies.add(p['投保单位名称'] || '未知');
        });
        return Object.values(map).map(item => ({
            ...item,
            companyCount: item.companies.size,
            lossRatio: item.earnedPremium > 0 ? (item.claims / item.earnedPremium) * 100 : 0
        })).sort((a, b) => b.lossRatio - a.lossRatio);
    }, [mergedData, selectedYear]);

    const companyAnalysis = useMemo(() => {
        const map = {};
        const analysisDate = selectedYear === 'all' ? new Date() : new Date(selectedYear, 11, 31);
        mergedData.forEach(p => {
            const company = p['投保单位名称'] || p['分公司'] || '未知机构';
            if (!map[company]) map[company] = { name: company, premium: 0, earnedPremium: 0, claims: 0 };
            map[company].premium += parseFloat(p['保费']) || 0;
            map[company].earnedPremium += calculateEarnedPremium(p, analysisDate);
            map[company].claims += p.totalClaimAmount || 0;
        });
        return Object.values(map).map(item => ({
            ...item,
            lossRatio: item.earnedPremium > 0 ? (item.claims / item.earnedPremium) * 100 : 0
        })).sort((a, b) => b.lossRatio - a.lossRatio);
    }, [mergedData, selectedYear]);

    const planAnalysis = useMemo(() => {
        const map = {};
        const analysisDate = selectedYear === 'all' ? new Date() : new Date(selectedYear, 11, 31);
        mergedData.forEach(p => {
            const plan = p['方案名称'] || '默认方案';
            if (!map[plan]) map[plan] = { name: plan, premium: 0, earnedPremium: 0, claims: 0 };
            map[plan].premium += parseFloat(p['保费']) || 0;
            map[plan].earnedPremium += calculateEarnedPremium(p, analysisDate);
            map[plan].claims += p.totalClaimAmount || 0;
        });
        return Object.values(map).map(item => ({
            ...item,
            lossRatio: item.earnedPremium > 0 ? (item.claims / item.earnedPremium) * 100 : 0
        })).sort((a, b) => b.lossRatio - a.lossRatio);
    }, [mergedData, selectedYear]);

    const diseaseSpectrum = useMemo(() => {
        const counts = {};
        mergedData.forEach(p => {
            (p.claims || []).forEach(c => {
                const d = c['疾病诊断'] || '未知';
                counts[d] = (counts[d] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [mergedData]);

    const ageAnalysis = useMemo(() => {
        const slots = [
            { name: '25岁以下', min: 0, max: 24, premium: 0, earnedPremium: 0, claims: 0, maleClaims: 0, femaleClaims: 0 },
            { name: '25-35岁', min: 25, max: 35, premium: 0, earnedPremium: 0, claims: 0, maleClaims: 0, femaleClaims: 0 },
            { name: '36-45岁', min: 36, max: 45, premium: 0, earnedPremium: 0, claims: 0, maleClaims: 0, femaleClaims: 0 },
            { name: '46-55岁', min: 46, max: 55, premium: 0, earnedPremium: 0, claims: 0, maleClaims: 0, femaleClaims: 0 },
            { name: '55岁以上', min: 56, max: 200, premium: 0, earnedPremium: 0, claims: 0, maleClaims: 0, femaleClaims: 0 }
        ];
        const analysisDate = selectedYear === 'all' ? new Date() : new Date(selectedYear, 11, 31);
        mergedData.forEach(p => {
            const policyAge = parseInt(p['年龄']);
            if (!isNaN(policyAge)) {
                const s = slots.find(s => policyAge >= s.min && policyAge <= s.max);
                if (s) {
                    s.premium += parseFloat(p['保费']) || 0;
                    s.earnedPremium += calculateEarnedPremium(p, analysisDate);
                }
            }
            (p.claims || []).forEach(c => {
                const claimAge = parseInt(c['年龄'] || p['年龄']);
                const gender = normalizeGender(c['性别'] || p['性别']);
                if (!isNaN(claimAge)) {
                    const s = slots.find(s => claimAge >= s.min && claimAge <= s.max);
                    if (s) {
                        const amt = parseFloat(c['赔款金额']) || 0;
                        s.claims += amt;
                        if (gender === '男') s.maleClaims += amt;
                        if (gender === '女') s.femaleClaims += amt;
                    }
                }
            });
        });
        return slots.map(s => ({ ...s, lossRatio: s.earnedPremium > 0 ? (s.claims / s.earnedPremium) * 100 : 0 }));
    }, [mergedData, selectedYear]);

    const highRiskCompanies = useMemo(() => companyAnalysis.filter(c => c.lossRatio > 99), [companyAnalysis]);
    const mediumRiskCompanies = useMemo(() => companyAnalysis.filter(c => c.lossRatio >= 70 && c.lossRatio <= 99), [companyAnalysis]);
    const highRiskGroups = useMemo(() => groupAnalysis.filter(g => g.lossRatio > 70), [groupAnalysis]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color }}>
                            {p.name}: {p.name.includes('率') ? `${p.value.toFixed(1)}%` : `¥${p.value.toLocaleString()}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="risk-profiling animate-fade-in p-6">
            {(highRiskGroups.length > 0 || highRiskCompanies.length > 0) && (
                <div className="alert-banner error mb-6">
                    <AlertTriangle size={24} className="shrink-0" />
                    <div>
                        <strong>数据逻辑说明：</strong>
                        <span>基于业财数据清洗计算，重点预警赔付率 &gt;99% 的亏损单位，以及赔付率 &gt;70% 的高风险业务线。</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* 集团分析 */}
                <div className="chart-card xl:col-span-2">
                    <div className="card-header-row">
                        <Building2 size={20} className="text-blue-500" />
                        <h4>集团业务分析</h4>
                    </div>
                    <div className="h-350">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={groupAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 200]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="premium" name="签单保费" fill="#cbd5e1" barSize={40} />
                                <Line yAxisId="right" type="monotone" dataKey="lossRatio" name="已赚赔付率" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 年龄分析 */}
                <div className="chart-card">
                    <div className="card-header-row">
                        <Activity size={20} className="text-green-500" />
                        <h4>年龄区间性别赔付分布</h4>
                    </div>
                    <div className="h-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={ageAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="maleClaims" name="男性赔款" fill="#3b82f6" stackId="claims" barSize={30} />
                                <Bar yAxisId="left" dataKey="femaleClaims" name="女性赔款" fill="#f472b6" stackId="claims" barSize={30} />
                                <Line yAxisId="right" type="monotone" dataKey="lossRatio" name="已赚赔付率" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 方案分析 */}
                <div className="chart-card">
                    <div className="card-header-row">
                        <FileText size={20} className="text-purple-500" />
                        <h4>分方案赔付表现</h4>
                    </div>
                    <div className="h-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planAnalysis} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={240} />
                                <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                                <Bar dataKey="lossRatio" name="已赚赔付率" fill="#8b5cf6">
                                    {planAnalysis.map((e, i) => <Cell key={i} fill={e.lossRatio > 80 ? '#ef4444' : '#8b5cf6'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 疾病分析 */}
                <div className="chart-card">
                    <div className="card-header-row">
                        <Activity size={20} className="text-red-500" />
                        <h4>高频疾病 Top 10</h4>
                    </div>
                    <div className="h-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseSpectrum} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={240} />
                                <Tooltip />
                                <Bar dataKey="value" name="理赔件数" fill="#f87171" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 预警列表 */}
            <div className="mt-8 grid grid-cols-1 gap-6">
                {highRiskCompanies.length > 0 && (
                    <div className="chart-card">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-red-600">严重亏损单位 (赔付率 &gt; 99%)</h4>
                            <span className="badge error">
                                共 {highRiskCompanies.length} 个
                            </span>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">单位名称</th>
                                        <th className="text-right">签单保费</th>
                                        <th className="text-right">总赔款</th>
                                        <th className="text-right">赔付率</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(showAllHighRisk ? highRiskCompanies : highRiskCompanies.slice(0, 10)).map((c, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{c.name}</td>
                                            <td className="text-right">¥{c.premium.toLocaleString()}</td>
                                            <td className="text-right">¥{c.claims.toLocaleString()}</td>
                                            <td className="text-right font-bold text-red-600">{c.lossRatio.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {highRiskCompanies.length > 10 && (
                                <div className="mt-4 text-center">
                                    <button
                                        className={`btn-expand ${showAllHighRisk ? 'active' : ''}`}
                                        onClick={() => setShowAllHighRisk(!showAllHighRisk)}
                                    >
                                        {showAllHighRisk ? '收起列表' : `展开全部 ${highRiskCompanies.length} 个单位`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mediumRiskCompanies.length > 0 && (
                    <div className="chart-card">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-yellow-600">中等风险预警 (70% - 99%)</h4>
                            <span className="badge warning">
                                共 {mediumRiskCompanies.length} 个
                            </span>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">单位名称</th>
                                        <th className="text-right">签单保费</th>
                                        <th className="text-right">总赔款</th>
                                        <th className="text-right">赔付率</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(showAllMediumRisk ? mediumRiskCompanies : mediumRiskCompanies.slice(0, 5)).map((c, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{c.name}</td>
                                            <td className="text-right">¥{c.premium.toLocaleString()}</td>
                                            <td className="text-right">¥{c.claims.toLocaleString()}</td>
                                            <td className="text-right font-bold text-yellow-600">{c.lossRatio.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {mediumRiskCompanies.length > 5 && (
                                <div className="mt-4 text-center">
                                    <button
                                        className={`btn-expand ${showAllMediumRisk ? 'active' : ''}`}
                                        onClick={() => setShowAllMediumRisk(!showAllMediumRisk)}
                                    >
                                        {showAllMediumRisk ? '收起列表' : `展开全部 ${mediumRiskCompanies.length} 个单位`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskProfiling;
