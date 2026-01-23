import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MedicalAnalysis = ({ mergedData }) => {
    // 聚合医疗费用数据
    const medicalData = mergedData.reduce((acc, curr) => {
        curr.claims.forEach(claim => {
            acc.totalBill += parseFloat(claim['账单总金额']) || 0; // Updated to match mock data
            acc.socialSS += parseFloat(claim['社保统筹给付']) || 0; // Updated to match mock data
            acc.payout += parseFloat(claim['赔款金额']) || 0;
            acc.selfPay += parseFloat(claim['自费']) || parseFloat(claim['乙类自付']) || 0;
        });
        return acc;
    }, { totalBill: 0, socialSS: 0, payout: 0, selfPay: 0 });

    const personalBurden = medicalData.totalBill - medicalData.socialSS;
    const personalOOP = personalBurden - medicalData.payout;

    // 为桑基图简化逻辑：使用层级条形图展示
    const flowData = [
        { name: '总金额', '账单总额': medicalData.totalBill },
        { name: '支付构成', '社保统筹': medicalData.socialSS, '商业险赔付': medicalData.payout, '个人自负': personalOOP }
    ];

    return (
        <div className="medical-analysis animate-fade-in">
            <div className="analysis-header">
                <h3>医疗费用深度透视</h3>
                <p>基于账单、统筹及赔款字段的费用流向分析</p>
            </div>

            <div className="medical-grid">
                <div className="flow-viz">
                    <h4>费用拆解流向 (Sankey Flow)</h4>
                    <div className="sankey-container">
                        <div className="sankey-node total">
                            <span className="node-label">总账单金额</span>
                            <span className="node-value">¥{medicalData.totalBill.toLocaleString()}</span>
                        </div>

                        <div className="sankey-links">
                            <div className="link-group">
                                <div className="link to-ss" style={{ height: `${(medicalData.socialSS / medicalData.totalBill) * 100}%` }}>
                                    <span>社保统筹</span>
                                </div>
                                <div className="link to-personal" style={{ height: `${(personalBurden / medicalData.totalBill) * 100}%` }}>
                                    <span>个人负担</span>
                                </div>
                            </div>
                        </div>

                        <div className="sankey-nodes-group">
                            <div className="sankey-node ss" style={{ flex: medicalData.socialSS }}>
                                <span className="node-label">社保统筹</span>
                                <span className="node-value">¥{medicalData.socialSS.toLocaleString()}</span>
                            </div>
                            <div className="sankey-node personal" style={{ flex: personalBurden }}>
                                <div className="personal-split">
                                    <div className="split-part payout" style={{ flex: medicalData.payout }}>
                                        <span className="node-label">保险赔付</span>
                                        <span className="node-value">¥{medicalData.payout.toLocaleString()}</span>
                                    </div>
                                    <div className="split-part oop" style={{ flex: personalOOP }}>
                                        <span className="node-label">个人承担</span>
                                        <span className="node-value">¥{personalOOP.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="stats-panel">
                    <div className="stat-item">
                        <label>社保通过率</label>
                        <div className="progress-bar">
                            <div className="progress-fill ss" style={{ width: `${(medicalData.socialSS / medicalData.totalBill) * 100}%` }}></div>
                        </div>
                        <span>{((medicalData.socialSS / medicalData.totalBill) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                        <label>获赔率 (剔除社保后)</label>
                        <div className="progress-bar">
                            <div className="progress-fill payout" style={{ width: `${(medicalData.payout / personalBurden) * 100}%` }}></div>
                        </div>
                        <span>{((medicalData.payout / personalBurden) * 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalAnalysis;
