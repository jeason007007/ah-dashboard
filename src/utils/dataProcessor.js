import * as XLSX from 'xlsx';

/**
 * 计算已赚保费 (Earned Premium)
 * 公式: 保费 * (统计段内的经过天数 / 保险期间总天数)
 */
export const calculateEarnedPremium = (policy, analysisDate = new Date()) => {
    const start = new Date(policy['个人生效日']);
    const end = new Date(policy['个人满期日']);
    const premium = parseFloat(policy['保费']) || 0;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (start > analysisDate) return 0; // 还没生效

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const effectiveEnd = end < analysisDate ? end : analysisDate;
    const elapsedDays = Math.max(0, Math.ceil((effectiveEnd - start) / (1000 * 60 * 60 * 24)));

    return premium * (elapsedDays / totalDays);
};

/**
 * 解析 Excel 文件
 */
export const parseExcel = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * 合并承保与理赔数据
 */
export const mergeData = (policies, claims) => {
    // 按保单号建立索引
    const policyMap = new Map();
    policies.forEach(p => {
        const id = p['个人保单号'];
        if (id) {
            if (!policyMap.has(id)) {
                policyMap.set(id, { ...p, claims: [], totalClaimAmount: 0 });
            }
        }
    });

    // 关联理赔数据
    claims.forEach(c => {
        const id = c['个人保单号'];
        if (id && policyMap.has(id)) {
            const policy = policyMap.get(id);
            policy.claims.push(c);
            policy.totalClaimAmount += parseFloat(c['赔款金额']) || 0;
        }
    });

    return Array.from(policyMap.values());
};

/**
 * 计算汇总指标
 */
export const calculateMetrics = (mergedData, analysisDate = new Date(), filterYear = null) => {
    let totalPremium = 0;
    let totalEarnedPremium = 0;
    let totalClaims = 0;
    let totalCases = 0;

    mergedData.forEach(p => {
        const pStart = new Date(p['个人生效日']);
        const premium = parseFloat(p['保费']) || 0;

        // 签单保费逻辑：如果是"所有年度"或保单生效年份等于筛选年份，则计入签单保费
        let shouldCountPremium = true;
        if (filterYear && filterYear !== 'all') {
            if (pStart.getFullYear() !== parseInt(filterYear)) {
                shouldCountPremium = false;
            }
        }

        if (shouldCountPremium) {
            totalPremium += premium;
        }

        // 已赚保费逻辑：只要在统计范围内（由传入的 mergedData 决定），就计算其贡献的已赚保费
        totalEarnedPremium += calculateEarnedPremium(p, analysisDate);

        // 赔款逻辑：filteredData 里的 claims 已经被 filterDataByYear 过滤过了，直接累加
        totalClaims += p.totalClaimAmount || 0;
        totalCases += p.claims.length;
    });

    const simpleLossRatio = totalPremium > 0 ? (totalClaims / totalPremium) : 0;
    const earnedLossRatio = totalEarnedPremium > 0 ? (totalClaims / totalEarnedPremium) : 0;

    return {
        totalPremium,
        totalEarnedPremium,
        fullTermPremium: totalEarnedPremium, // 注意：在分年度视图下，满期保费概念比较模糊，此处暂保持与已赚一致或可调整为当期满期
        totalClaims,
        totalCases,
        simpleLossRatio,
        earnedLossRatio, // 已决赔付率 (已赚)
        fullTermLossRatio: earnedLossRatio, // 满期赔付率 (已决/满期)
        coveredLives: mergedData.length
    };
};

/**
 * 计算年月趋势数据
 */
export const calculateTrendData = (mergedData, analysisDate = new Date()) => {
    const monthlyMap = new Map();

    mergedData.forEach(p => {
        // 1. 每月经过保费计算 & 签单保费计算
        const pStart = new Date(p['个人生效日']);
        const pEnd = new Date(p['个人满期日']);
        const premium = parseFloat(p['保费']) || 0;

        if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
            // A. 签单保费归属 (一次性归属到生效月)
            const startMonthKey = `${pStart.getFullYear()}-${String(pStart.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyMap.has(startMonthKey)) {
                monthlyMap.set(startMonthKey, { month: startMonthKey, premium: 0, claims: 0, earnedPremium: 0, writtenPremium: 0 });
            }
            monthlyMap.get(startMonthKey).writtenPremium += premium;

            // B. 已赚保费 (分摊)
            let current = new Date(pStart.getFullYear(), pStart.getMonth(), 1);
            const end = new Date(pEnd.getFullYear(), pEnd.getMonth(), 1);

            while (current <= end && current <= analysisDate) {
                const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyMap.has(monthKey)) {
                    monthlyMap.set(monthKey, { month: monthKey, premium: 0, claims: 0, earnedPremium: 0, writtenPremium: 0 });
                }

                const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
                const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

                const effectiveStart = pStart > monthStart ? pStart : monthStart;
                const effectiveEnd = pEnd < monthEnd ? pEnd : monthEnd;

                if (effectiveStart <= effectiveEnd) {
                    const daysInMonth = Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1);
                    const totalDays = Math.max(1, Math.ceil((pEnd - pStart) / (1000 * 60 * 60 * 24)));
                    monthlyMap.get(monthKey).earnedPremium += (premium * daysInMonth) / totalDays;
                }

                current.setMonth(current.getMonth() + 1);
            }
        }

        // 2. 理赔金额归属到出险月份
        p.claims.forEach(c => {
            const claimDate = new Date(c['出险日期']);
            if (!isNaN(claimDate.getTime())) {
                const monthKey = `${claimDate.getFullYear()}-${String(claimDate.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyMap.has(monthKey)) {
                    monthlyMap.set(monthKey, { month: monthKey, premium: 0, claims: 0, earnedPremium: 0, writtenPremium: 0 });
                }
                monthlyMap.get(monthKey).claims += parseFloat(c['赔款金额']) || 0;
            }
        });
    });

    return Array.from(monthlyMap.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(item => ({
            ...item,
            fullTermLossRatio: item.earnedPremium > 0 ? (item.claims / item.earnedPremium) * 100 : 0
        }));
};

/**
 * 从数据中提取所有涉及的年份
 */
export const getAvailableYears = (mergedData) => {
    const years = new Set();
    mergedData.forEach(p => {
        const start = new Date(p['个人生效日']);
        if (!isNaN(start.getTime())) {
            years.add(start.getFullYear());
        }
        p.claims.forEach(c => {
            const cDate = new Date(c['出险日期']);
            if (!isNaN(cDate.getTime())) {
                years.add(cDate.getFullYear());
            }
        });
    });
    return Array.from(years).sort((a, b) => b - a);
};

/**
 * 按年度对保单和理赔进行切片过滤
 */
export const filterDataByYear = (mergedData, year) => {
    if (!year || year === 'all') return mergedData;

    const filtered = [];
    mergedData.forEach(p => {
        const pStart = new Date(p['个人生效日']);
        const pEnd = new Date(p['个人满期日']);

        // 保单只要在这一年内有存续就算
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);

        if (pStart <= yearEnd && pEnd >= yearStart) {
            // 复制一份保单，仅保留该年度的理赔
            const yearClaims = p.claims.filter(c => {
                const cDate = new Date(c['出险日期']);
                return cDate.getFullYear() === parseInt(year);
            });

            filtered.push({
                ...p,
                claims: yearClaims,
                totalClaimAmount: yearClaims.reduce((sum, c) => sum + (parseFloat(c['赔款金额']) || 0), 0)
            });
        }
    });

    return filtered;
};

/**
 * 校验数据结构 (Required Columns)
 */
export const validateStructure = (data, type) => {
    if (!data || data.length === 0) {
        return { isValid: false, missingColumns: [], error: '文件内容为空或格式错误' };
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow);

    const requiredPolicyCols = [
        '个人保单号',
        '保费',
        '个人生效日',
        '个人满期日',
        '投保单位名称', // Updated from '投保单位'
        '方案名称' // Updated from '投保方案'
    ];

    const requiredClaimCols = [
        '个人保单号',
        '出险日期',
        '赔款金额'
    ];

    const targetCols = type === 'policy' ? requiredPolicyCols : requiredClaimCols;
    const missing = targetCols.filter(col => !columns.includes(col));

    if (missing.length > 0) {
        return {
            isValid: false,
            missingColumns: missing,
            error: `缺少必要列: ${missing.join(', ')}`
        };
    }

    return { isValid: true, missingColumns: [] };
};

/**
 * 校验业务逻辑 (Data Consistency)
 * 检查：
 * 1. 结案日期 >= 报案日期 >= 出险日期
 * 2. 报案日期/结案日期是否存在 (Warning)
 */
export const validateLogic = (mergedData) => {
    let invalidDates = 0;
    let missingOpsDates = 0;
    let totalClaims = 0;

    mergedData.forEach(p => {
        p.claims.forEach(c => {
            totalClaims++;
            const injuryDate = new Date(c['出险日期']);
            const reportDate = new Date(c['报案日期']);
            const closeDate = new Date(c['结案日期']);

            // 检查运营日期是否存在
            if (isNaN(reportDate.getTime()) || isNaN(closeDate.getTime())) {
                missingOpsDates++;
            } else {
                // 检查日期逻辑顺序
                // 允许同一天，所以用 < 检查
                if (reportDate < injuryDate || closeDate < reportDate) {
                    invalidDates++;
                }
            }
        });
    });

    const warnings = [];
    if (invalidDates > 0) {
        warnings.push(`发现 ${invalidDates} 条理赔数据的日期逻辑有误 (如: 报案早于出险)`);
    }
    if (missingOpsDates > 0) {
        warnings.push(`发现 ${missingOpsDates} 条理赔数据缺少报案或结案日期，将影响运营分析`);
    }

    return {
        isValid: warnings.length === 0,
        warnings,
        stats: { invalidDates, missingOpsDates, totalClaims }
    };
};
