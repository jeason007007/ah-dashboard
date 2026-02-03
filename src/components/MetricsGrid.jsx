import React from 'react';
import { TrendingUp, Users, DollarSign, Percent, AlertCircle } from 'lucide-react';

const MetricCard = ({ title, value, unit, icon: Icon, color, trend }) => (
    <div className="metric-card">
        <div className="metric-header">
            <div className={`metric-icon-box ${color}`}>
                <Icon size={20} />
            </div>
            {trend && <span className={`metric-trend ${trend > 0 ? 'up' : 'down'}`}>
                {trend > 0 ? '+' : ''}{trend}%
            </span>}
        </div>
        <div className="metric-body">
            <span className="metric-label">{title}</span>
            <div className="metric-value-container">
                <span className="metric-value">{value}</span>
                <span className="metric-unit">{unit}</span>
            </div>
        </div>
    </div>
);

const MetricsGrid = ({ metrics }) => {
    const formatCurrency = (val) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(val);
    const formatPercent = (val) => (val * 100).toFixed(1);

    return (
        <div className="metrics-grid">
            <MetricCard
                title="总签单保费 (GWP)"
                value={formatCurrency(metrics.totalPremium)}
                unit="¥"
                icon={DollarSign}
                color="blue"
            />
            <MetricCard
                title="在保人数"
                value={metrics.coveredLives}
                unit="人"
                icon={Users}
                color="indigo"
            />
            <MetricCard
                title="满期保费"
                value={formatCurrency(metrics.fullTermPremium)}
                unit="¥"
                icon={TrendingUp}
                color="green"
            />
            <MetricCard
                title="简单赔付率 (已决/GWP)"
                value={formatPercent(metrics.simpleLossRatio)}
                unit="%"
                icon={Percent}
                color="blue"
            />
            <MetricCard
                title="满期赔付率"
                value={formatPercent(metrics.fullTermLossRatio)}
                unit="%"
                icon={Percent}
                color={metrics.fullTermLossRatio > 0.8 ? 'red' : 'indigo'}
            />

            {/* 大额赔案分析 (>25万) */}
            {metrics.largeClaimsCount > 0 && (
                <>
                    <MetricCard
                        title="大案笔数 (>25万)"
                        value={metrics.largeClaimsCount}
                        unit="件"
                        icon={AlertCircle}
                        color="red"
                    />
                    <MetricCard
                        title="大案累计金额"
                        value={formatCurrency(metrics.largeClaimsAmount)}
                        unit="¥"
                        icon={DollarSign}
                        color="red"
                    />
                    <MetricCard
                        title="大案金额占比"
                        value={formatPercent(metrics.largeClaimsRatio)}
                        unit="%"
                        icon={Percent}
                        color="red"
                    />
                </>
            )}
        </div>
    );
};

export default MetricsGrid;
