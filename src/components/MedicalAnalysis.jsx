import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell, PieChart, Pie, LabelList
} from 'recharts';
import { Activity, TrendingUp, DollarSign, Wallet } from 'lucide-react';

const MedicalAnalysis = ({ mergedData, selectedYear }) => {
    // 聚合医疗费用数据
    const medicalData = useMemo(() => {
        return mergedData.reduce((acc, curr) => {
            curr.claims.forEach(claim => {
                acc.totalBill += parseFloat(claim['账单金额']) || 0;
                acc.socialSS += parseFloat(claim['统筹金额']) || 0;
                acc.payout += parseFloat(claim['赔款金额']) || 0;
            });
            return acc;
        }, { totalBill: 0, socialSS: 0, payout: 0 });
    }, [mergedData]);

    const personalBurden = medicalData.totalBill - medicalData.socialSS;
    const personalOOP = Math.max(0, personalBurden - medicalData.payout);



    const [drillDownType, setDrillDownType] = React.useState('plan'); // plan, liability, disease

    // 下钻分析数据
    const drillDownData = useMemo(() => {
        const map = {};
        mergedData.forEach(p => {
            const planName = p['方案名称'] || '默认方案';
            (p.claims || []).forEach(c => {
                let key = '未知';
                if (drillDownType === 'plan') {
                    key = planName;
                } else if (drillDownType === 'liability') {
                    key = c['理赔责任名称'] || c['理赔责任'] || c['责任名称'] || '未知责任';
                } else if (drillDownType === 'disease') {
                    key = c['疾病诊断'] || '未知疾病'; // 暂用具体诊断代替大类
                }

                const amount = parseFloat(c['赔款金额']) || 0;
                map[key] = (map[key] || 0) + amount;
            });
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // 展示 Top 10
    }, [mergedData, drillDownType]);

    // 病种费用排名 Top 10
    const diseaseCostAnalysis = useMemo(() => {
        const counts = {};
        mergedData.forEach(p => {
            (p.claims || []).forEach(c => {
                const d = c['疾病诊断'] || '未知';
                const cost = parseFloat(c['账单金额']) || 0;
                counts[d] = (counts[d] || 0) + cost;
            });
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [mergedData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color || p.fill }}>
                            {p.name}: ¥{p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            {p.payload.percent && ` (${(p.payload.percent * 100).toFixed(1)}%)`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="medical-analysis animate-fade-in p-6">


            {/* 核心指标卡片 */}


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">


                {/* 费用构成分析 (Pie Chart) */}
                <div className="chart-card">
                    <div className="card-header-row">
                        <Wallet size={20} className="text-teal-500" />
                        <h4>费用构成分析</h4>
                    </div>
                    <div className="h-350 flex flex-col justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: '社保统筹', value: medicalData.socialSS },
                                        { name: '商业赔付', value: medicalData.payout },
                                        { name: '个人承担', value: personalOOP }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 20;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text
                                                x={x}
                                                y={y}
                                                fill="#64748b"
                                                textAnchor={x > cx ? 'start' : 'end'}
                                                dominantBaseline="central"
                                                className="text-xs font-medium"
                                            >
                                                {`${(percent * 100).toFixed(1)}%`}
                                            </text>
                                        );
                                    }}
                                >
                                    <Cell key="cell-0" fill="#10b981" />
                                    <Cell key="cell-1" fill="#8b5cf6" />
                                    <Cell key="cell-2" fill="#f97316" />
                                </Pie>
                                <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="text-xs text-slate-500">
                                    账单总金额
                                </text>
                                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold text-slate-800">
                                    ¥{medicalData.totalBill.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 高费用病种分析 */}
                <div className="chart-card">
                    <div className="card-header-row">
                        <Activity size={20} className="text-red-500" />
                        <h4>高费用病种 Top 10</h4>
                    </div>
                    <div className="h-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseCostAnalysis} layout="vertical" margin={{ left: 20, right: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={230} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" name="账单金额" fill="#f87171" radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="value" position="right" formatter={(val) => `¥${(val / 10000).toFixed(1)}万`} style={{ fill: '#64748b', fontSize: '12px' }} />
                                    {diseaseCostAnalysis.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#fca5a5'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 商业赔付穿透分析 */}
                <div className="chart-card xl:col-span-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div className="flex items-center gap-2 mb-2 md:mb-0">
                            <Activity size={20} className="text-indigo-500" />
                            <h4 className="text-lg font-semibold">商业赔付穿透分析 Top 10</h4>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            {['plan', 'liability', 'disease'].map(type => {
                                const isActive = drillDownType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setDrillDownType(type)}
                                        className={`px-4 py-1.5 text-sm rounded-md transition-all duration-200 font-medium focus:outline-none ${isActive ? 'shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                                        style={isActive ? { backgroundColor: 'rgba(139, 92, 246, 0.3)', color: '#6d28d9', fontWeight: 600 } : {}}
                                    >
                                        {type === 'plan' && '按方案'}
                                        {type === 'liability' && '按责任'}
                                        {type === 'disease' && '按病种'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="h-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drillDownData} layout="vertical" margin={{ left: 20, right: 60, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={240} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    getContent={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 border border-indigo-100 shadow-lg rounded-lg text-sm">
                                                    <p className="font-bold text-slate-800 mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-indigo-600 font-medium">赔款: ¥{payload[0].value.toLocaleString()}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" name="赔款金额" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="value" position="right" formatter={(val) => `¥${(val / 10000).toFixed(1)}万`} style={{ fill: '#64748b', fontSize: '12px' }} />
                                    {drillDownData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#7c3aed' : '#a78bfa'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalAnalysis;
