const XLSX = require('xlsx');
const fs = require('fs');

// 生成 2024-2025 年度的模拟数据
function generateMockData() {
    const policies = [];
    const claims = [];

    // 1. 生成 500 条承保数据，分布在 2024-2025
    for (let i = 1; i <= 500; i++) {
        const premium = Math.floor(Math.random() * 5000) + 500;
        const startYear = 2024;
        const startMonth = Math.floor(Math.random() * 12);
        const startDate = new Date(startYear, startMonth, Math.floor(Math.random() * 28) + 1);
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1);

        const policyId = `POL${20240000 + i}`;
        const groupPolicyId = `GP${20240000 + Math.floor(i / 50)}`; // Mock group policy ID

        const planName = ['方案A-基础款', '方案B-升级款', '方案C-高端款'][Math.floor(Math.random() * 3)];
        const planCode = planName.split('-')[0].replace('方案', '');

        policies.push({
            '投保单位名称': ['XX科技集团', 'XX物流有限公司', 'XX建设工程局', 'XX教育咨询集团', 'XX餐饮连锁'][Math.floor(Math.random() * 5)],
            '保单号': groupPolicyId,
            '个人保单号': policyId,
            '对应主被保人': `被保人${i}`,
            '方案名称': planName,
            '投保方案': planCode,
            '保费': premium,
            '团单起期': startDate.toISOString().split('T')[0], // Added based on screenshot hint
            '生效年月': `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`, // Added based on screenshot hint
            '团单止期': endDate.toISOString().split('T')[0], // Added based on screenshot hint
            '个人生效日': startDate.toISOString().split('T')[0],
            '个人满期日': endDate.toISOString().split('T')[0],
            '性别': Math.random() > 0.5 ? '男' : '女',
            '年龄': Math.floor(Math.random() * 50) + 18
        });

        // 2. 随机生成一些理赔数据，分布在 2025 年各月
        if (Math.random() > 0.3) { // 30% 的概率有赔案
            const numClaims = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numClaims; j++) {
                // 出险日期在保单期内
                const injuryDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                const billAmount = Math.floor(Math.random() * 10000) + 500;
                const ssAmount = billAmount * (Math.random() * 0.5 + 0.1); // 10%-60% 社保
                const claimAmount = (billAmount - ssAmount) * (Math.random() > 0.1 ? 0.9 : 0.5); // 获赔

                claims.push({
                    '个人保单号': policyId,
                    '出险日期': injuryDate.toISOString().split('T')[0],
                    '账单总金额': billAmount,
                    '社保统筹给付': ssAmount,
                    '赔款金额': claimAmount,
                    '疾病诊断': ['急性上呼吸道感染', '肺炎', '阑尾炎', '腰椎间盘突出', '冠心病', '糖尿病', '高血压', '乳腺增生'][Math.floor(Math.random() * 8)]
                });

                // Add operational dates
                const reportLag = Math.floor(Math.random() * 30); // 0-30 days lag
                const reportDate = new Date(injuryDate.getTime() + reportLag * 24 * 60 * 60 * 1000);

                const closeLag = Math.floor(Math.random() * 60) + 1; // 1-60 days processing
                const closeDate = new Date(reportDate.getTime() + closeLag * 24 * 60 * 60 * 1000);

                claims[claims.length - 1]['报案日期'] = reportDate.toISOString().split('T')[0];
                claims[claims.length - 1]['结案日期'] = closeDate.toISOString().split('T')[0];
            }
        }
    }

    const wb = XLSX.utils.book_new();
    const wsPolicies = XLSX.utils.json_to_sheet(policies);
    const wsClaims = XLSX.utils.json_to_sheet(claims);

    XLSX.utils.book_append_sheet(wb, wsPolicies, "承保数据");
    XLSX.utils.book_append_sheet(wb, wsClaims, "理赔数据");

    XLSX.writeFile(wb, "mock_ah_data.xlsx");
    console.log("Mock data generated: mock_ah_data.xlsx with 500 policies and multiple claims across 2024-2025.");
}

generateMockData();
