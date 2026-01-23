import React from 'react';
import { BookOpen, Info } from 'lucide-react';

const MetricGuide = () => {
    return (
        <div className="metric-guide animate-fade-in">
            <div className="guide-header">
                <BookOpen size={24} color="#3b82f6" />
                <h2>指标说明文档</h2>
            </div>

            <div className="guide-content">
                <section className="guide-section">
                    <h3>一、赔付率</h3>

                    <div className="guide-item">
                        <h4>1. 满期赔付率</h4>
                        <div className="formula">公式：(已决赔款 + 未决赔款) / 满期保费</div>
                        <p>该指标以保单年度为统计口径。反映的是该批保单已满期部分的赔付情况。用来衡量当年所做的业务品质的好坏，考虑了尚未结案的案件。</p>
                        <div className="note">
                            <Info size={14} />
                            <span>注意：不含IBNR（已发生未报案案件）。</span>
                        </div>
                    </div>

                    <div className="guide-item">
                        <h4>2. 历年制赔付率</h4>
                        <div className="formula">公式：(已决赔款 + 期末未决 - 期初未决) / (当期保费 - 期末未到期 + 期初未到期)</div>
                        <p>对长期经营的公司更有意义，考虑了业务的长期品质和影响。统计时间与财务年度口径一致。</p>
                    </div>

                    <div className="guide-item">
                        <h4>3. 已报告赔付率</h4>
                        <div className="formula">公式：(已决赔款 + 未决提转差) / 已赚保费</div>
                        <p>没有考虑已发生未报告案件，财务分析时较少使用。</p>
                    </div>

                    <div className="guide-item">
                        <h4>4. 综合赔付率</h4>
                        <div className="formula">公式：(赔付支出 + 准备金提转差等) / 已赚保费</div>
                        <p>财务口径指标，真正考核利润。包含了IBNR数据，准确反映某一时期内整体经营情况。</p>
                    </div>

                    <div className="guide-item">
                        <h4>5. 事故年度制满期赔付率</h4>
                        <p>按出险时间口径统计。既与当年的业务品质有关，还与往年的业务品质有关。</p>
                    </div>

                    <div className="guide-item">
                        <h4>6. 终极赔付率</h4>
                        <p>保单年口径的测试指标。预估最终赔款，用于制定承保政策和优化业务结构。</p>
                    </div>
                </section>

                <section className="guide-section">
                    <h3>二、保费</h3>
                    <div className="guide-item">
                        <h4>1. 保费收入</h4>
                        <p>对应承保风险所收到的保费，承诺未来所有赔款支付的对价。</p>
                    </div>
                    <div className="guide-item">
                        <h4>2. 满期保费</h4>
                        <div className="formula">公式：保费收入 × [min(统计末, 终止日) - 生效日] / [终止日 - 生效日]</div>
                        <p>指从保单生效日起至统计区间末已经满期的那部分保费。</p>
                    </div>
                    <div className="guide-item">
                        <h4>3. 已赚保费</h4>
                        <p>核算期真正收入。反映了新承保保单和部分历史保单对核算区间的收入贡献。</p>
                    </div>
                </section>

                <section className="guide-section">
                    <h3>三、准备金 (含IBNR)</h3>
                    <p>未决赔款准备金（Reserve for Outstanding Losses）是为未结案的赔案而提取的准备金。</p>
                    <div className="guide-item">
                        <h4>1. IBNR (已发生未报案准备金)</h4>
                        <p>狭义指保险事故已发生但尚未报案。广义还包括已报案未进入程序、重立赔案、以及估损不足准备金。</p>
                    </div>
                </section>

                <section className="guide-section">
                    <h3>四、保单获取成本 (首日费用)</h3>
                    <p>仅限于增量成本（如手续费、佣金、税金等）。首日费用的存在会影响未到期准备金的提取，进而影响财务口径的已赚保费。</p>
                </section>
            </div>
        </div>
    );
};

export default MetricGuide;
