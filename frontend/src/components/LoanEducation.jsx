import { Info, AlertTriangle, TrendingDown, DollarSign, Percent, Clock } from 'lucide-react';
import './LoanEducation.css';

export function LoanEducation({ 
    collateralAmount, 
    collateralValueUSD, 
    borrowAmount, 
    platformFee, 
    netReceived, 
    apy, 
    protocol,
    tokenSymbol 
}) {
    // Calculate interest examples
    const calculateInterest = (months) => {
        const apyDecimal = parseFloat(apy) / 100;
        const monthlyRate = apyDecimal / 12;
        return borrowAmount * monthlyRate * months;
    };

    const interest1Month = calculateInterest(1);
    const interest6Months = calculateInterest(6);
    const interest1Year = borrowAmount * (parseFloat(apy) / 100);

    // Calculate liquidation price
    const liquidationThreshold = 0.80; // 80%
    const currentPrice = collateralValueUSD / collateralAmount;
    const liquidationPrice = (borrowAmount / (collateralAmount * liquidationThreshold));
    const priceDropPercent = ((currentPrice - liquidationPrice) / currentPrice) * 100;

    return (
        <div className="loan-education">
            {/* Fee Breakdown */}
            <div className="education-section">
                <div className="section-header">
                    <DollarSign size={20} />
                    <h4>💰 Fee Breakdown</h4>
                </div>

                <div className="fee-cards">
                    {/* Platform Fee */}
                    <div className="fee-card platform-fee">
                        <div className="fee-card-header">
                            <span className="fee-label">Platform Fee (1%)</span>
                            <Info size={16} className="info-icon" />
                        </div>
                        <div className="fee-amount">${platformFee.toFixed(2)}</div>
                        <div className="fee-description">
                            <strong>One-time fee</strong> charged by DedlyFi for facilitating your loan.
                            This covers smart contract execution, security, and platform maintenance.
                        </div>
                        <div className="fee-recipient">
                            → Goes to: <strong>DedlyFi Platform</strong>
                        </div>
                    </div>

                    {/* Protocol Interest */}
                    <div className="fee-card protocol-fee">
                        <div className="fee-card-header">
                            <span className="fee-label">Protocol Interest ({apy})</span>
                            <Info size={16} className="info-icon" />
                        </div>
                        <div className="fee-amount interest-amount">
                            ~${interest1Year.toFixed(2)}<span className="period">/year</span>
                        </div>
                        <div className="fee-description">
                            <strong>Continuous interest</strong> charged by {protocol} lending protocol.
                            Accrues per block (~12 seconds). No monthly payments required.
                        </div>
                        <div className="fee-recipient">
                            → Goes to: <strong>{protocol} Liquidity Providers</strong>
                        </div>
                    </div>
                </div>

                {/* Total You Receive */}
                <div className="total-receive">
                    <div className="total-label">You Receive (After Platform Fee)</div>
                    <div className="total-amount">${netReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC</div>
                </div>
            </div>

            {/* Interest Timeline */}
            <div className="education-section">
                <div className="section-header">
                    <Clock size={20} />
                    <h4>📈 Interest Over Time</h4>
                </div>

                <div className="interest-timeline">
                    <div className="timeline-item">
                        <div className="timeline-period">1 Month</div>
                        <div className="timeline-bar">
                            <div className="timeline-fill" style={{ width: '16.67%' }} />
                        </div>
                        <div className="timeline-amount">+${interest1Month.toFixed(2)}</div>
                        <div className="timeline-total">Total Debt: ${(borrowAmount + interest1Month).toFixed(2)}</div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-period">6 Months</div>
                        <div className="timeline-bar">
                            <div className="timeline-fill" style={{ width: '50%' }} />
                        </div>
                        <div className="timeline-amount">+${interest6Months.toFixed(2)}</div>
                        <div className="timeline-total">Total Debt: ${(borrowAmount + interest6Months).toFixed(2)}</div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-period">1 Year</div>
                        <div className="timeline-bar">
                            <div className="timeline-fill" style={{ width: '100%' }} />
                        </div>
                        <div className="timeline-amount">+${interest1Year.toFixed(2)}</div>
                        <div className="timeline-total">Total Debt: ${(borrowAmount + interest1Year).toFixed(2)}</div>
                    </div>
                </div>

                <div className="interest-note">
                    <Info size={16} />
                    <span>
                        Interest accrues continuously (every ~12 seconds). You can repay anytime without penalties.
                    </span>
                </div>
            </div>

            {/* Liquidation Risk */}
            <div className="education-section liquidation-section">
                <div className="section-header warning">
                    <AlertTriangle size={20} />
                    <h4>⚠️ Liquidation Risk</h4>
                </div>

                <div className="liquidation-info">
                    <div className="liquidation-card">
                        <div className="liquidation-label">Current {tokenSymbol} Price</div>
                        <div className="liquidation-value current-price">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <TrendingDown size={32} className="arrow-down" />

                    <div className="liquidation-card danger">
                        <div className="liquidation-label">Liquidation Price</div>
                        <div className="liquidation-value liquidation-price">${liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div className="price-drop">({priceDropPercent.toFixed(1)}% drop)</div>
                    </div>
                </div>

                <div className="liquidation-explanation">
                    <div className="explanation-title">What happens if liquidated?</div>
                    <ul className="explanation-list">
                        <li>
                            <strong>You lose your collateral:</strong> Your {collateralAmount.toFixed(4)} {tokenSymbol} will be sold to repay the debt.
                        </li>
                        <li>
                            <strong>Liquidation penalty:</strong> A 5% bonus is paid to the liquidator from your collateral.
                        </li>
                        <li>
                            <strong>You keep the USDC:</strong> The ${netReceived.toFixed(2)} USDC you received is yours to keep.
                        </li>
                    </ul>
                </div>

                <div className="safety-tips">
                    <div className="tip-title">🛡️ How to Stay Safe</div>
                    <div className="tips-grid">
                        <div className="tip">
                            <Percent size={16} />
                            <span>Keep Health Factor above <strong>1.5</strong></span>
                        </div>
                        <div className="tip">
                            <TrendingDown size={16} />
                            <span>Monitor {tokenSymbol} price regularly</span>
                        </div>
                        <div className="tip">
                            <DollarSign size={16} />
                            <span>Add collateral if price drops</span>
                        </div>
                        <div className="tip">
                            <Clock size={16} />
                            <span>Repay early to reduce risk</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="education-summary">
                <div className="summary-title">📊 Loan Summary</div>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">You Deposit</span>
                        <span className="summary-value">{collateralAmount.toFixed(4)} {tokenSymbol}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Collateral Value</span>
                        <span className="summary-value">${collateralValueUSD.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">You Receive</span>
                        <span className="summary-value highlight">${netReceived.toLocaleString()} USDC</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Interest Rate</span>
                        <span className="summary-value">{apy} APY</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Loan-to-Value</span>
                        <span className="summary-value">70%</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Health Factor</span>
                        <span className="summary-value success">1.43</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
