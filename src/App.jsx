import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, FileSpreadsheet, Activity, ShieldAlert, Clock, ChevronRight, Upload, AlertCircle, RefreshCw, LogOut, BookOpen } from 'lucide-react';
import MetricsGrid from './components/MetricsGrid';
import MedicalAnalysis from './components/MedicalAnalysis';
import RiskProfiling from './components/RiskProfiling';
import LossTrendAnalysis from './components/LossTrendAnalysis';
import OpsAnalysis from './components/OpsAnalysis';
import MetricGuide from './components/MetricGuide';
import { parseExcel, mergeData, calculateMetrics, calculateTrendData, getAvailableYears, filterDataByYear, validateStructure, validateLogic } from './utils/dataProcessor';

function App() {
    const [activeTab, setActiveTab] = useState('summary');
    const [policyData, setPolicyData] = useState(() => {
        const saved = localStorage.getItem('ah_policy_data');
        return saved ? JSON.parse(saved) : null;
    });
    const [claimsData, setClaimsData] = useState(() => {
        const saved = localStorage.getItem('ah_claims_data');
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState('all');
    const [isIncremental, setIsIncremental] = useState(false);

    // Persistence with QuotaExceeded protection
    useEffect(() => {
        try {
            if (policyData) localStorage.setItem('ah_policy_data', JSON.stringify(policyData));
            else localStorage.removeItem('ah_policy_data');
        } catch (e) {
            console.warn('LocalStorage persistence failed (policyData):', e.message);
        }
    }, [policyData]);

    useEffect(() => {
        try {
            if (claimsData) localStorage.setItem('ah_claims_data', JSON.stringify(claimsData));
            else localStorage.removeItem('ah_claims_data');
        } catch (e) {
            console.warn('LocalStorage persistence failed (claimsData):', e.message);
        }
    }, [claimsData]);

    const mergedData = useMemo(() => {
        if (policyData && claimsData) {
            return mergeData(policyData, claimsData);
        }
        return null;
    }, [policyData, claimsData]);

    const metrics = useMemo(() => {
        if (mergedData) {
            const filtered = filterDataByYear(mergedData, selectedYear);
            // 对于特定年度，分析日期设为该年年底，否则为当前日期
            const analysisDate = selectedYear === 'all' ? new Date() : new Date(selectedYear, 11, 31);
            return calculateMetrics(filtered, analysisDate, selectedYear);
        }
        return {
            totalPremium: 0,
            totalEarnedPremium: 0,
            totalClaims: 0,
            totalCases: 0,
            simpleLossRatio: 0,
            earnedLossRatio: 0,
            coveredLives: 0,
            largeClaimsCount: 0,
            largeClaimsAmount: 0,
            largeClaimsRatio: 0
        };
    }, [mergedData, selectedYear]);

    const trendData = useMemo(() => {
        if (mergedData) {
            const filtered = filterDataByYear(mergedData, selectedYear);
            const analysisDate = selectedYear === 'all' ? new Date() : new Date(selectedYear, 11, 31);
            return calculateTrendData(filtered, analysisDate);
        }
        return [];
    }, [mergedData, selectedYear]);

    const availableYears = useMemo(() => {
        if (mergedData) return getAvailableYears(mergedData);
        return [];
    }, [mergedData]);

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const data = await parseExcel(file);

            // 1. Structure Validation
            const validationResult = validateStructure(data, type);
            if (!validationResult.isValid) {
                alert(`文件格式错误：\n${validationResult.error}\n\n缺失列: ${validationResult.missingColumns.join(', ')}`);
                return; // Stop processing
            }

            if (type === 'policy') {
                if (isIncremental && policyData) {
                    // Deduplicate based on policy number
                    const existingIds = new Set(policyData.map(p => p['个人保单号']));
                    const newData = data.filter(p => !existingIds.has(p['个人保单号']));
                    setPolicyData([...policyData, ...newData]);
                } else {
                    setPolicyData(data);
                }
            } else {
                if (isIncremental && claimsData) {
                    // Claims deduplication is trickier, we use a combination of policy + date + amount
                    const getClaimKey = (c) => `${c['个人保单号']}_${c['出险日期']}_${c['赔款金额']}`;
                    const existingKeys = new Set(claimsData.map(getClaimKey));
                    const newData = data.filter(c => !existingKeys.has(getClaimKey(c)));
                    setClaimsData([...claimsData, ...newData]);
                } else {
                    setClaimsData(data);
                }
            }
        } catch (error) {
            console.error('File upload failed:', error);
            alert('文件解析失败，请检查文件格式是否正确。');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Logic Validation (Effect when mergedData updates)
    useEffect(() => {
        if (mergedData) {
            const report = validateLogic(mergedData);
            if (!report.isValid) {
                console.warn('Data Logic Validation Warnings:', report.warnings);
                // Optionally expose this to UI, for now just console
                if (report.stats.invalidDates > 50) { // Only alert if significant issues
                    // alert(`注意：发现 ${report.stats.invalidDates} 条理赔数据的日期逻辑可能存在问题（如报案早于出险），请检查Console获取详细信息。`);
                }
            }
        }
    }, [mergedData]);

    const handleReset = () => {
        if (window.confirm('确定要清除所有已上传的数据吗？')) {
            setPolicyData(null);
            setClaimsData(null);
            setActiveTab('summary');
        }
    };

    const renderContent = () => {
        if (!policyData || !claimsData) {
            return (
                <div className="landing-page-container animate-fade-in">
                    <div className="upload-header-row">
                        <div className="welcome-banner">
                            <h1>欢迎使用 A&H 业务分析系统</h1>
                            <p>请上传承保与理赔数据开始分析，支持增量追加模式。</p>
                        </div>
                        <div className="upload-controls">
                            <label className="toggle-container">
                                <input
                                    type="checkbox"
                                    checked={isIncremental}
                                    onChange={(e) => setIsIncremental(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                                <span className="toggle-label">追加模式 (保留当前数据)</span>
                            </label>
                        </div>
                    </div>

                    <div className="upload-section">
                        <div className={`upload-card ${policyData ? 'completed' : ''}`}>
                            <FileSpreadsheet size={48} color={policyData ? '#22c55e' : '#94a3b8'} />
                            <h3>{policyData ? '承保数据已就绪' : '第一步：承保数据'}</h3>
                            <p>{policyData ? `已加载 ${policyData.length} 条记录` : '请上传包含保费、生效日、保单号的 Excel'}</p>
                            <label className="btn-secondary">
                                {policyData ? '重新上传' : '选择文件'}
                                <input type="file" hidden onChange={(e) => handleFileUpload(e, 'policy')} accept=".xlsx, .xls" />
                            </label>
                        </div>
                        <div className={`upload-card ${claimsData ? 'completed' : ''}`}>
                            <FileSpreadsheet size={48} color={claimsData ? '#22c55e' : '#94a3b8'} />
                            <h3>{claimsData ? '理赔数据已就绪' : '第二步：理赔数据'}</h3>
                            <p>{claimsData ? `已加载 ${claimsData.length} 条记录` : '请上传包含赔款金额、保单号、账单明细的 Excel'}</p>
                            <label className="btn-secondary">
                                {claimsData ? '重新上传' : '选择文件'}
                                <input type="file" hidden onChange={(e) => handleFileUpload(e, 'claims')} accept=".xlsx, .xls" />
                            </label>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="dashboard-content animate-fade-in">
                {activeTab === 'summary' && (
                    <>
                        <MetricsGrid metrics={metrics} />

                        {metrics.earnedLossRatio > 0.8 && (
                            <div className="alert-banner warning">
                                <AlertCircle size={20} />
                                <div>
                                    <strong>风险预警：</strong>当前已赚赔付率超过 80%，建议关注高赔付团单并考虑价格调整。
                                </div>
                            </div>
                        )}

                        <LossTrendAnalysis trendData={trendData} />
                    </>
                )}

                {activeTab === 'medical' && (
                    <MedicalAnalysis
                        mergedData={filterDataByYear(mergedData, selectedYear)}
                        selectedYear={selectedYear}
                    />
                )}

                {activeTab === 'risk' && (
                    <RiskProfiling
                        mergedData={filterDataByYear(mergedData, selectedYear)}
                        selectedYear={selectedYear}
                    />
                )}

                {activeTab === 'ops' && (
                    <OpsAnalysis
                        mergedData={filterDataByYear(mergedData, selectedYear)}
                        selectedYear={selectedYear}
                    />
                )}

                {activeTab === 'guide' && (
                    <MetricGuide />
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="logo">
                    <ShieldAlert size={32} color="#3b82f6" />
                    <span>意健险分析</span>
                </div>
                <nav className="nav-menu">
                    <button
                        className={`nav-item ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        <LayoutDashboard size={20} />
                        <span>核心概览</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'medical' ? 'active' : ''}`}
                        onClick={() => setActiveTab('medical')}
                    >
                        <Activity size={20} />
                        <span>医疗成本</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'risk' ? 'active' : ''}`}
                        onClick={() => setActiveTab('risk')}
                    >
                        <ShieldAlert size={20} />
                        <span>风险画像</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'ops' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ops')}
                    >
                        <Clock size={20} />
                        <span>运营时效</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'guide' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guide')}
                    >
                        <BookOpen size={20} />
                        <span>指标说明</span>
                    </button>
                </nav>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="breadcrumb">
                        首页 <ChevronRight size={14} /> {
                            activeTab === 'summary' ? '核心概览' :
                                activeTab === 'medical' ? '医疗成本' :
                                    activeTab === 'risk' ? '风险画像' :
                                        activeTab === 'guide' ? '指标说明' : '运营时效'
                        }
                    </div>
                    <div className="user-profile">
                        {policyData && claimsData && (
                            <div className="header-actions">
                                <select
                                    className="year-select"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    <option value="all">所有年度</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}年度</option>
                                    ))}
                                </select>
                                <button className="btn-icon" title="重新上传" onClick={() => { setPolicyData(null); setClaimsData(null); }}>
                                    <Upload size={18} />
                                </button>
                                <button className="btn-icon danger" title="重置并清除" onClick={handleReset}>
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        )}
                        <span>管理员</span>
                        <div className="avatar"></div>
                    </div>
                </header>

                <section className="content-area">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
}

export default App;
